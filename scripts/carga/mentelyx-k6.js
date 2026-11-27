// Pruebas de carga de Mentelyx con Grafana k6 (Sprint 2, actividad 8). Escenarios ligados a los EQ del Sprint 1
// (docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md). Base AISLADA `mentelyx_carga` (local), proveedor de
// IA SIMULADO y sin llamadas al Tutor: la carga no toca NVIDIA, Neon ni Atlas. Controles de seguridad activos (sesión,
// Origin, CSRF, Idempotency-Key, límites de autenticación): las sesiones se crean en setup() con logins reales.
//
//   k6 run -e ESCENARIO=humo   scripts/carga/mentelyx-k6.js
//   k6 run -e ESCENARIO=eq01   scripts/carga/mentelyx-k6.js   (EQ-01: 100 VU · 10 min · p95 ≤ 2 s · 5xx < 1 %)
//   k6 run -e ESCENARIO=eq03   scripts/carga/mentelyx-k6.js   (EQ-03: 50/100/200 VU · p95 ≤ 3 s a 200 VU · 5xx < 1 %)
//   k6 run -e ESCENARIO=eq15   scripts/carga/mentelyx-k6.js   (EQ-15: 100 VU de simulacro · p95 guardado ≤ 3 s · 0 pérdidas)
//   k6 run -e ESCENARIO=estres scripts/carga/mentelyx-k6.js   (10→100→250→500→1000→1500→2000 VU; se detiene si falla > 50 %)
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
// Resumen local (sin importar jslib remoto: una falla de red impidió una ejecución el 27/11/2026).
function textSummary(datos) {
  const lineas = [];
  for (const [nombre, m] of Object.entries(datos.metrics).sort(([a], [b]) => a.localeCompare(b))) {
    const v = m.values;
    const umbral = m.thresholds ? (Object.values(m.thresholds).every((t) => t.ok) ? '✓ ' : '✗ ') : '  ';
    let texto;
    if (m.type === 'trend') texto = ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'].filter((k) => k in v).map((k) => `${k}=${v[k] >= 1000 ? `${(v[k] / 1000).toFixed(2)}s` : `${v[k].toFixed(2)}ms`}`).join(' ');
    else if (m.type === 'rate') texto = `${(v.rate * 100).toFixed(2)}% ✓ ${v.passes} ✗ ${v.fails}`;
    else if (m.type === 'counter') texto = `${v.count} ${v.rate.toFixed(4)}/s`;
    else texto = `${v.value ?? ''} min=${v.min ?? ''} max=${v.max ?? ''}`;
    lineas.push(`${umbral}${nombre}${'.'.repeat(Math.max(2, 42 - nombre.length))}: ${texto}`);
  }
  return `\n${lineas.join('\n')}\n`;
}

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:8792').replace(/\/$/, '');
const ESCENARIO = __ENV.ESCENARIO || 'humo';
const CONTRASENA = __ENV.CARGA_CONTRASENA || 'Carga-Ficticia-2026';
const SALIDA = __ENV.SALIDA || 'docs/05-evaluacion-arquitectonica/evidencias/k6';
const DATOS = JSON.parse(open('./datos-carga.json'));

const errores5xx = new Rate('mentelyx_errores_5xx'); // 5xx o error de red (EQ: «errores 5xx < 1 %»)
const lectura = new Trend('mentelyx_lectura_ms', true);
const guardado = new Trend('mentelyx_guardado_respuesta_ms', true);
const calificados = new Counter('mentelyx_intentos_calificados');
const perdidas = new Counter('mentelyx_respuestas_perdidas');
const ajenas = new Counter('mentelyx_intentos_de_otro_estudiante');

const etapas = (lista) => lista.flatMap(([vus, subida, sostener]) => [{ duration: subida, target: vus }, { duration: sostener, target: vus }]);
const ESCENARIOS = {
  humo: { executor: 'constant-vus', vus: 2, duration: '30s', exec: 'mixto' },
  eq01: { executor: 'constant-vus', vus: 100, duration: '10m', exec: 'mixto' },
  eq03: { executor: 'ramping-vus', startVUs: 0, exec: 'mixto', stages: [...etapas([[50, '30s', '2m'], [100, '30s', '2m'], [200, '30s', '2m']]), { duration: '20s', target: 0 }] },
  eq15: { executor: 'constant-vus', vus: 100, duration: '5m', exec: 'simulacro' },
  estres: {
    executor: 'ramping-vus',
    startVUs: 0,
    exec: 'mixto',
    stages: [...etapas([[10, '20s', '40s'], [100, '30s', '1m'], [250, '30s', '1m'], [500, '30s', '1m'], [1000, '1m', '1m'], [1500, '1m', '1m'], [2000, '1m', '1m']]), { duration: '30s', target: 0 }],
    gracefulRampDown: '10s',
  },
};
const UMBRALES = {
  humo: { mentelyx_errores_5xx: ['rate<0.01'], checks: ['rate>0.99'] },
  eq01: { 'mentelyx_lectura_ms': ['p(95)<2000'], mentelyx_errores_5xx: ['rate<0.01'] },
  eq03: { 'mentelyx_lectura_ms': ['p(95)<3000'], mentelyx_errores_5xx: ['rate<0.01'] },
  eq15: { mentelyx_guardado_respuesta_ms: ['p(95)<3000'], mentelyx_errores_5xx: ['rate<0.01'], mentelyx_respuestas_perdidas: ['count==0'], mentelyx_intentos_de_otro_estudiante: ['count==0'] },
  // Condición de parada del estrés: si más de la mitad de las peticiones fallan, el sistema ya saturó.
  estres: { mentelyx_errores_5xx: [{ threshold: 'rate<0.5', abortOnFail: true, delayAbortEval: '30s' }] },
};
export const options = {
  scenarios: { [ESCENARIO]: ESCENARIOS[ESCENARIO] },
  thresholds: UMBRALES[ESCENARIO],
  setupTimeout: '180s',
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  discardResponseBodies: false,
};

const json = (r) => {
  try {
    return r.json();
  } catch {
    return null;
  }
};
function registrar(r, tipo) {
  errores5xx.add(r.status === 0 || r.status >= 500);
  if (tipo === 'lectura') lectura.add(r.timings.duration);
  if (tipo === 'guardado') guardado.add(r.timings.duration);
  return r;
}

/** Inicia sesión con cada cuenta ficticia (límite de autenticación activo) y obtiene su token CSRF. */
export function setup() {
  const sesiones = [];
  for (const c of DATOS.cuentas) {
    const jar = http.cookieJar();
    jar.clear(BASE);
    const csrf0 = http.get(`${BASE}/api/v1/auth/csrf`, { headers: { origin: BASE } });
    const t0 = json(csrf0).data.token;
    const login = http.post(`${BASE}/api/v1/auth/login`, JSON.stringify({ correo: c.correo, contrasena: CONTRASENA }), { headers: { 'content-type': 'application/json', origin: BASE, 'x-csrf-token': t0 } });
    if (login.status !== 200) throw new Error(`login ${c.correo}: ${login.status}`);
    const cookie = Object.entries(jar.cookiesForURL(BASE)).map(([k, v]) => `${k}=${v[0]}`).join('; ');
    const csrf = json(http.get(`${BASE}/api/v1/auth/csrf`, { headers: { origin: BASE, cookie } })).data.token;
    sesiones.push({ cookie, csrf, preparacionId: c.preparacionId, correo: c.correo });
    sleep(0.6); // ≤ 120 inicios de sesión por minuto e IP (F01)
  }
  return { sesiones };
}

const sesion = (data) => data.sesiones[(__VU - 1) % data.sesiones.length];
const cabeceras = (s, mutacion) => ({ headers: { cookie: s.cookie, origin: BASE, 'content-type': 'application/json', ...(mutacion ? { 'x-csrf-token': s.csrf, 'idempotency-key': `k6${__VU}x${__ITER}x${Date.now()}x${Math.floor(Math.random() * 1e6)}` } : {}) }, tags: {} });
const get = (s, ruta, nombre) => registrar(http.get(`${BASE}/api/v1${ruta}`, { ...cabeceras(s, false), tags: { nombre } }), 'lectura');

/** Mezcla representativa (EQ-01/EQ-03): lecturas autenticadas en PostgreSQL y MongoDB y, en 1 de cada 5 iteraciones, un simulacro corto. */
export function mixto(data) {
  const s = sesion(data);
  group('lecturas', () => {
    const r = [
      get(s, '/preparaciones', 'preparaciones'),
      get(s, `/preparaciones/${s.preparacionId}/preguntas`, 'banco (Mongo)'),
      get(s, '/carpetas?modulo=EXAMENES&estado=ACTIVA', 'carpetas'),
      get(s, '/tutor-ia/conversaciones', 'conversaciones (Mongo)'),
      get(s, `/preparaciones/${s.preparacionId}/seguimiento`, 'seguimiento'),
    ];
    check(r, { 'lecturas 200': (xs) => xs.every((x) => x.status === 200) });
  });
  if (Math.random() < 0.2) simulacroDe(s, 3);
  sleep(1);
}

/** EQ-15: iniciar, responder (con la hora del servidor) y entregar un simulacro; audita respuestas y propiedad. */
export function simulacro(data) {
  simulacroDe(sesion(data), 4);
  sleep(1);
}

function respuestaPara(p) {
  if (p.opciones) return { tipo: 'opcion', id: p.opciones[0].id };
  if (p.tipo === 'verdadero-falso') return { tipo: 'booleano', valor: true };
  return { tipo: 'texto', valor: '6' };
}

function simulacroDe(s, cantidad) {
  group('simulacro', () => {
    const i = registrar(http.post(`${BASE}/api/v1/preparaciones/${s.preparacionId}/intentos`, JSON.stringify({ modo: 'SIMULACRO', cantidad, minutos: 30 }), { ...cabeceras(s, true), tags: { nombre: 'iniciar intento' } }), 'escritura');
    if (!check(i, { 'intento 201': (r) => r.status === 201 })) return;
    const d = json(i).data;
    let guardadas = 0;
    for (const p of d.preguntas) {
      const g = registrar(http.put(`${BASE}/api/v1/intentos/${d.intento.id}/respuestas/${p.id}`, JSON.stringify({ respuesta: respuestaPara(p) }), { ...cabeceras(s, false), headers: { ...cabeceras(s, true).headers }, tags: { nombre: 'guardar respuesta' } }), 'guardado');
      if (check(g, { 'respuesta 200': (r) => r.status === 200 })) guardadas++;
    }
    const e = registrar(http.post(`${BASE}/api/v1/intentos/${d.intento.id}/entrega`, null, { ...cabeceras(s, true), tags: { nombre: 'entregar' } }), 'escritura');
    if (!check(e, { 'entrega 200': (r) => r.status === 200 })) return;
    const res = json(e).data;
    calificados.add(1);
    const conRespuesta = res.resultados.preguntas.filter((x) => x.respuesta !== null).length;
    if (conRespuesta < guardadas) perdidas.add(guardadas - conRespuesta);
    if (res.intento.preparacionId !== s.preparacionId) ajenas.add(1);
  });
}

export function handleSummary(datos) {
  const fecha = new Date().toISOString().replace(/[:.]/g, '-');
  return {
    stdout: textSummary(datos, { indent: ' ', enableColors: false }),
    [`${SALIDA}/${ESCENARIO}-resumen.json`]: JSON.stringify({ escenario: ESCENARIO, base: BASE, fecha, metricas: datos.metrics, umbrales: UMBRALES[ESCENARIO] }, null, 2),
    [`${SALIDA}/${ESCENARIO}-resumen.txt`]: textSummary(datos, { indent: ' ', enableColors: false }),
  };
}
