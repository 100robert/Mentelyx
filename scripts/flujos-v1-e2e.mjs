#!/usr/bin/env node
// Flujos V1 de extremo a extremo POR EL FRONTEND (Next.js/OpenNext → service binding → API), con la cuenta ficticia
// de `scripts/sembrar-demo.mjs`. Ejecutar después de la siembra:
//   node scripts/flujos-v1-e2e.mjs [http://127.0.0.1:8788]
// Comprueba páginas SSR reales (Exámenes, preparación, Configuración) y los contratos V1 a través del mismo origen.
const BASE = (process.argv[2] ?? 'http://127.0.0.1:8788').replace(/\/$/, '');
const ORIGEN = new URL(BASE).origin;
const CONTRASENA = process.env.DEMO_CONTRASENA ?? 'Demo-Mentelyx-2026';
const resultados = [];
let cookie = '';
const guardar = (r) => {
  const mapa = new Map(cookie.split('; ').filter(Boolean).map((c) => [c.split('=')[0], c]));
  for (const c of r.headers.getSetCookie().map((x) => x.split(';')[0])) mapa.set(c.split('=')[0], c);
  cookie = [...mapa.values()].join('; ');
};
const paso = async (nombre, fn) => {
  const t = performance.now();
  try {
    const detalle = String((await fn()) ?? '').slice(0, 100);
    resultados.push({ paso: nombre, resultado: 'OK', ms: Math.round(performance.now() - t), detalle });
  } catch (e) {
    resultados.push({ paso: nombre, resultado: 'FALLA', ms: Math.round(performance.now() - t), detalle: String(e?.message ?? e).slice(0, 100) });
  }
};
const exigir = (c, m) => {
  if (!c) throw new Error(m);
};
async function api(ruta, { metodo = 'GET', cuerpo, clave, cabeceras } = {}) {
  const h = { origin: ORIGEN, 'content-type': 'application/json', cookie, ...cabeceras };
  if (metodo !== 'GET') {
    const c = await fetch(`${BASE}/api/v1/auth/csrf`, { headers: h });
    guardar(c);
    h.cookie = cookie;
    h['x-csrf-token'] = (await c.json()).data.token;
  }
  if (clave) h['idempotency-key'] = clave;
  const r = await fetch(`${BASE}/api/v1${ruta}`, { method: metodo, headers: h, ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}) });
  guardar(r);
  const j = await r.json().catch(() => null);
  return { estado: r.status, datos: j?.data, error: j?.error, etag: r.headers.get('etag') };
}
const pagina = async (ruta) => {
  const r = await fetch(BASE + ruta, { headers: { cookie }, redirect: 'manual' });
  return { estado: r.status, html: await r.text() };
};
const k = () => `e2e${crypto.randomUUID().replaceAll('-', '')}`;

let prep;
let intento;
await paso('Ingreso de la cuenta de demostración', async () => {
  const r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: 'demo.ana@ejemplo.test', contrasena: CONTRASENA } });
  exigir(r.estado === 200, `login ${r.estado} ${r.error?.code}`);
  const s = await api('/auth/sesion');
  return `${s.datos.nombre} · ${s.datos.correo}`;
});
await paso('Carpetas por módulo (Aprendizaje y Exámenes)', async () => {
  const a = await api('/carpetas?modulo=APRENDIZAJE&estado=ACTIVA');
  const e = await api('/carpetas?modulo=EXAMENES&estado=ACTIVA');
  exigir(a.estado === 200 && e.estado === 200, 'carpetas');
  const cal = a.datos.find((c) => c.nombre === 'Cálculo');
  const el = await api(`/carpetas/${cal.id}/elementos`);
  return `${a.datos.length} de aprendizaje · ${e.datos.length} de exámenes · «Cálculo» con ${el.datos.length} elemento(s)`;
});
await paso('Varias preparaciones y SSR de Exámenes', async () => {
  const l = await api('/preparaciones');
  prep = l.datos.find((p) => p.nombre === 'Parcial de Cálculo I');
  exigir(prep?.carpetaId, 'preparación sembrada en su carpeta');
  // La lista se carga en el cliente (preparaciones.tsx); la página debe responder 200 con sesión.
  const p = await pagina('/examenes');
  exigir(p.estado === 200, `SSR /examenes ${p.estado}`);
  const d = await pagina(`/examenes/${prep.id}`);
  exigir(d.estado === 200 && d.html.includes('guardados en tu cuenta') && d.html.includes('Parcial de Cálculo I'), `SSR detalle ${d.estado}`);
  return `${l.datos.length} preparación(es) · SSR lista y detalle 200`;
});
await paso('Banco sin soluciones e intento de simulacro con hora del servidor', async () => {
  const b = await api(`/preparaciones/${prep.id}/preguntas`);
  exigir(b.datos.total >= 10 && !JSON.stringify(b.datos.preguntas).includes('"correcta"'), 'banco proyectado');
  const i = await api(`/preparaciones/${prep.id}/intentos`, { metodo: 'POST', clave: k(), cuerpo: { modo: 'SIMULACRO', cantidad: 4, minutos: 15 } });
  exigir(i.estado === 201 && i.datos.intento.venceEn, `intento ${i.estado} ${i.error?.code}`);
  intento = i.datos;
  return `banco v${b.datos.version} (${b.datos.total}) · intento ${intento.intento.preguntas} preguntas · vence ${intento.intento.venceEn}`;
});
await paso('Respuestas guardadas, entrega y calificación oficial', async () => {
  for (const p of intento.preguntas) {
    const respuesta = p.opciones ? { tipo: 'opcion', id: p.opciones[0].id } : p.tipo === 'verdadero-falso' ? { tipo: 'booleano', valor: true } : { tipo: 'texto', valor: '6' };
    const g = await api(`/intentos/${intento.intento.id}/respuestas/${p.id}`, { metodo: 'PUT', cuerpo: { respuesta } });
    exigir(g.estado === 200 || g.estado === 400, `respuesta ${g.estado}`);
  }
  const e = await api(`/intentos/${intento.intento.id}/entrega`, { metodo: 'POST', clave: k() });
  exigir(e.estado === 200 && e.datos.intento.estado === 'CALIFICADO', `entrega ${e.estado}`);
  const otra = await api(`/intentos/${intento.intento.id}/entrega`, { metodo: 'POST', clave: k() });
  exigir(otra.datos.intento.puntaje === e.datos.intento.puntaje, 'segunda entrega distinta');
  return `${e.datos.intento.puntaje} de ${e.datos.intento.maximo} · repetida sin cambios`;
});
await paso('Historial y rendimiento persistentes', async () => {
  const h = await api(`/preparaciones/${prep.id}/intentos`);
  const s = await api(`/preparaciones/${prep.id}/seguimiento`);
  exigir(h.datos.some((x) => x.id === intento.intento.id) && s.datos.rendimiento.intentos >= 1, 'historial');
  return `${h.datos.length} intento(s) · ${s.datos.rendimiento.porTema.length} tema(s) con rendimiento`;
});
await paso('Estado de la sesión del Tutor con If-Match', async () => {
  const c = await api('/tutor-ia/conversaciones', { metodo: 'POST', cuerpo: { contexto: { superficie: 'LECCION', preparacionId: prep.id, temaId: 'T02' } } });
  exigir(c.estado === 201, `conversación ${c.estado} ${c.error?.code}`);
  const v = await api(`/tutor-ia/conversaciones/${c.datos.id}/estado`);
  const g = await api(`/tutor-ia/conversaciones/${c.datos.id}/estado`, { metodo: 'PUT', cuerpo: { interaccion: {}, anotaciones: [] }, cabeceras: { 'if-match': v.etag } });
  const conflicto = await api(`/tutor-ia/conversaciones/${c.datos.id}/estado`, { metodo: 'PUT', cuerpo: { interaccion: {}, anotaciones: [] }, cabeceras: { 'if-match': v.etag } });
  const lista = await api(`/tutor-ia/conversaciones?preparacionId=${prep.id}`);
  exigir(g.datos.version === 1 && conflicto.estado === 412 && lista.datos.some((x) => x.id === c.datos.id), 'estado');
  return `versión 1 · conflicto 412 · sesión vinculada a la preparación`;
});
await paso('Configuración SSR con perfil, preferencias y sesiones', async () => {
  const p = await pagina('/configuracion');
  exigir(p.estado === 200 && p.html.includes('demo.ana@ejemplo.test') && p.html.includes('Cambiar la contraseña'), `SSR ${p.estado}`);
  const pref = await api('/cuenta/me/preferencias', { metodo: 'PUT', cuerpo: { profundidad: 'intermedio', herramientasVisuales: ['grafico', 'pasos'], idioma: 'es' } });
  exigir(pref.estado === 200, 'preferencias');
  const s = await api('/auth/sesiones');
  return `perfil visible · preferencias guardadas · ${s.datos.length} sesión(es)`;
});
await paso('Aislamiento: la otra cuenta no ve la preparación', async () => {
  const propia = cookie;
  cookie = '';
  await api('/auth/login', { metodo: 'POST', cuerpo: { correo: 'demo.beto@ejemplo.test', contrasena: CONTRASENA } });
  const r = await api(`/preparaciones/${prep.id}`);
  const i = await api(`/intentos/${intento.intento.id}`);
  const pg = await pagina(`/examenes/${prep.id}`);
  cookie = propia;
  exigir(r.estado === 404 && i.estado === 404 && pg.estado === 404, `ajena ${r.estado}/${i.estado}/${pg.estado}`);
  return 'API 404 · intento 404 · página 404';
});

console.log(`\nFlujos V1 E2E · ${BASE} · ${new Date().toISOString()}`);
console.table(resultados);
const fallas = resultados.filter((r) => r.resultado !== 'OK').length;
console.log(fallas ? `FLUJOS-V1: ${fallas} FALLA(S)` : `FLUJOS-V1: OK (${resultados.length} pasos)`);
process.exit(fallas ? 1 : 0);
