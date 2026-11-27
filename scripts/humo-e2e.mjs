#!/usr/bin/env node
// Prueba de humo de extremo a extremo (PR-INF-01 y Sprint 03) contra el FRONTEND: todo pasa por Next.js/OpenNext y el
// service binding hacia la API. Sirve igual para el entorno local en workerd y para una URL pública desplegada:
//   node scripts/humo-e2e.mjs http://127.0.0.1:8788
//   node scripts/humo-e2e.mjs https://<url-publica>
// Crea un usuario SINTÉTICO por ejecución (correo @ejemplo.test). No usa datos reales ni credenciales.
const BASE = (process.argv[2] ?? 'http://127.0.0.1:8788').replace(/\/$/, '');
const ORIGEN = new URL(BASE).origin;
const resultados = [];
let cookie = '';

const paso = async (nombre, fn) => {
  const t = performance.now();
  try {
    const detalle = await fn();
    resultados.push({ paso: nombre, resultado: 'OK', ms: Math.round(performance.now() - t), detalle: String(detalle ?? '').slice(0, 110) });
  } catch (e) {
    resultados.push({ paso: nombre, resultado: 'FALLA', ms: Math.round(performance.now() - t), detalle: String(e?.message ?? e).slice(0, 110) });
  }
};
const exigir = (cond, msg) => {
  if (!cond) throw new Error(msg);
};
const pedir = (ruta, init = {}) =>
  fetch(BASE + ruta, { redirect: 'manual', ...init, headers: { origin: ORIGEN, ...(cookie ? { cookie } : {}), ...init.headers } });
const api = async (ruta, { metodo = 'GET', cuerpo, clave } = {}) => {
  const proteccion = {};
  if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) {
    const csrf = await pedir('/api/v1/auth/csrf');
    const token = await csrf.json();
    const previa = csrf.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    if (previa) proteccion.cookie = [cookie, previa].filter(Boolean).join('; ');
    proteccion['x-csrf-token'] = token.data.token;
  }
  const r = await pedir(`/api/v1${ruta}`, {
    method: metodo,
    headers: { 'content-type': 'application/json', ...proteccion, ...(clave ? { 'idempotency-key': clave } : {}) },
    ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}),
  });
  const json = await r.json().catch(() => null);
  return { r, json };
};
const html = async (ruta) => {
  const r = await pedir(ruta);
  return { r, texto: await r.text() };
};

const correo = `humo+${crypto.randomUUID().slice(0, 8)}@ejemplo.test`;
let espacioId;
let conversacionId;

await paso('SSG · / (inicio estático)', async () => {
  const { r, texto } = await html('/');
  exigir(r.status === 200 && texto.includes('Todo empieza con una pregunta'), `estado ${r.status}`);
  return `200 · x-nextjs-cache=${r.headers.get('x-nextjs-cache') ?? '—'} · cache-control=${r.headers.get('cache-control')}`;
});
await paso('SSG · /planes (precios IM 15)', async () => {
  const { r, texto } = await html('/planes');
  // ADR-093: Mentelyx V1 solo muestra los planes de aprendizaje; los docentes están pospuestos.
  exigir(r.status === 200 && texto.includes('S/ 39,90') && texto.includes('S/ 89,90') && !texto.includes('Docente Live'), 'precios de V1 incorrectos');
  return '200 · Estándar S/ 39,90 · Premium S/ 89,90 · sin planes docentes';
});
await paso('ISR · /biblioteca (revalidate 300 s)', async () => {
  const a = await html('/biblioteca');
  const b = await html('/biblioteca');
  const ta = a.texto.match(/data-generada="([^"]+)"/)?.[1];
  const tb = b.texto.match(/data-generada="([^"]+)"/)?.[1];
  exigir(a.r.status === 200 && ta && ta === tb, `generada ${ta} / ${tb}`);
  return `misma página cacheada (${ta}) · x-nextjs-cache=${b.r.headers.get('x-nextjs-cache') ?? '—'} · ${b.r.headers.get('cache-control')}`;
});
await paso('Cabeceras de seguridad y PWA', async () => {
  const r = await pedir('/');
  for (const h of ['x-content-type-options', 'referrer-policy', 'x-frame-options', 'permissions-policy']) exigir(r.headers.get(h), `falta ${h}`);
  const m = await pedir('/manifest.webmanifest');
  exigir(m.status === 200, `manifest ${m.status}`);
  return 'nosniff · strict-origin-when-cross-origin · DENY · manifest 200';
});
await paso('Middleware · /espacios sin sesión → /auth/ingresar', async () => {
  const r = await pedir('/espacios');
  exigir([302, 307, 308].includes(r.status) && (r.headers.get('location') ?? '').includes('/auth/ingresar'), `estado ${r.status}`);
  return `${r.status} → ${r.headers.get('location')}`;
});
await paso('API sin sesión → 401 (envoltorio de error)', async () => {
  const { r, json } = await api('/espacios');
  exigir(r.status === 401 && json?.error?.code === 'NO_AUTENTICADO', `estado ${r.status}`);
  return '401 NO_AUTENTICADO';
});
await paso('Better Auth · CSRF: un registro desde un origen ajeno no crea la cuenta', async () => {
  const intruso = `humo+${crypto.randomUUID().slice(0, 8)}@ejemplo.test`;
  const r = await fetch(`${BASE}/api/v1/auth/registro`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://sitio-ajeno.example' },
    body: JSON.stringify({ nombre: 'Intruso', correo: intruso, contrasena: 'Clave-sintetica-2026' }),
  });
  exigir(r.status !== 201 && r.headers.getSetCookie().length === 0, `estado ${r.status}`);
  // Desde el origen propio, esa cuenta no existe: el rechazo ocurrió antes de crearla.
  const login = await api('/auth/login', { metodo: 'POST', cuerpo: { correo: intruso, contrasena: 'Clave-sintetica-2026' } });
  exigir(login.r.status === 401, `login posterior ${login.r.status}`);
  return `origen ajeno → ${r.status}, sin cookie; la cuenta no se creó (login 401)`;
});
await paso('Registro (Better Auth vía service binding)', async () => {
  const { r, json } = await api('/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Estudiante Humo', correo, contrasena: 'Clave-sintetica-2026' } });
  exigir(r.status === 201, `estado ${r.status} ${JSON.stringify(json?.error)}`);
  cookie = r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  exigir(/session_token=/.test(cookie), 'sin cookie de sesión');
  const atributos = r.headers.getSetCookie()[0] ?? '';
  return `201 · cookie ${/HttpOnly/i.test(atributos) ? 'HttpOnly' : 'SIN HttpOnly'} ${/SameSite=Lax/i.test(atributos) ? 'SameSite=Lax' : ''} ${/Secure/i.test(atributos) ? 'Secure' : ''}`;
});
await paso('SSR autenticado · /espacios (sin caché compartida)', async () => {
  const { r, texto } = await html('/espacios');
  exigir(r.status === 200 && texto.includes('Temas') && texto.includes('Recursos de este mes'), `estado ${r.status}`);
  const cc = r.headers.get('cache-control') ?? '';
  exigir(/private|no-store|no-cache/.test(cc), `cache-control ${cc}`);
  return `200 · plan Gratuito visible · cache-control=${cc}`;
});
await paso('Crear espacio privado', async () => {
  const { r, json } = await api('/espacios', { metodo: 'POST', cuerpo: { titulo: 'Biología — prueba de humo' } });
  exigir(r.status === 201, `estado ${r.status}`);
  espacioId = json.data.id;
  return espacioId;
});
await paso('Registrar fuente MD (R2 + M5 + outbox)', async () => {
  const contenido = '# Fotosíntesis\n\nLa fotosíntesis ocurre en los cloroplastos de las hojas.\n\nLa clorofila absorbe la luz solar y se libera oxígeno.';
  const cuerpo = { titulo: 'Apuntes de fotosíntesis', formato: 'MD', contenido };
  const { r, json } = await api(`/espacios/${espacioId}/fuentes`, { metodo: 'POST', cuerpo, clave: `humo-fuente-${crypto.randomUUID().slice(0, 8)}` });
  exigir(r.status === 202, `estado ${r.status} ${JSON.stringify(json?.error)}`);
  return `202 · ${json.data.contentId}`;
});
await paso('Indexación por evento (outbox → inbox de M6)', async () => {
  for (let i = 0; i < 15; i++) {
    const { json } = await api(`/espacios/${espacioId}`);
    const estado = json?.data?.listaFuentes?.[0]?.estadoLectura;
    if (estado === 'LISTA') return `LISTA tras ${i + 1} consulta(s)`;
    await new Promise((s) => setTimeout(s, 1000));
  }
  throw new Error('la fuente no quedó LISTA en 15 s');
});
await paso('Tutor · consulta con citas (M5 + presupuesto + Mongo)', async () => {
  const c = await api('/tutor-ia/conversaciones', { metodo: 'POST', cuerpo: { contexto: { superficie: 'TUTOR', espacioId } } });
  exigir(c.r.status === 201, `conversación ${c.r.status}`);
  conversacionId = c.json.data.id;
  const clave = `humo-consulta-${crypto.randomUUID().slice(0, 8)}`;
  const cuerpo = { conversacionId, pregunta: '¿Dónde ocurre la fotosíntesis?', fuentes: { espacioId } };
  const { r, json } = await api('/tutor-ia/consultas', { metodo: 'POST', cuerpo, clave });
  exigir(r.status === 200 && json.data.estado === 'RESPONDIDA' && json.data.citas.length > 0, `estado ${r.status} ${json?.data?.estado ?? JSON.stringify(json?.error)}`);
  const repetida = await api('/tutor-ia/consultas', { metodo: 'POST', cuerpo, clave });
  exigir(repetida.json?.data?.mensajeId === json.data.mensajeId, 'el reintento no devolvió el mismo mensaje');
  return `RESPONDIDA · ${json.data.citas.length} cita(s) · ${json.data.uso.recurso} · quedan ${json.data.uso.restantesPeriodo} · reintento idempotente`;
});
await paso('Persistencia y recuperación · /tutor y /tutor/[id] (SSR)', async () => {
  const lista = await html('/tutor');
  exigir(lista.r.status === 200 && lista.texto.includes('se eliminará el'), `lista ${lista.r.status}`);
  const det = await html(`/tutor/${conversacionId}`);
  exigir(det.r.status === 200 && det.texto.includes('cloroplastos'), `detalle ${det.r.status}`);
  return 'conversación listada con fecha de eliminación; mensajes y citas recuperados';
});
await paso('Autorización por recurso · otro usuario no ve el espacio', async () => {
  const propio = cookie;
  cookie = '';
  const otro = await api('/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Otro Usuario', correo: `humo+${crypto.randomUUID().slice(0, 8)}@ejemplo.test`, contrasena: 'Clave-sintetica-2026' } });
  cookie = otro.r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
  const ajeno = await api(`/espacios/${espacioId}`);
  const conv = await api(`/tutor-ia/conversaciones/${conversacionId}`);
  cookie = propio;
  exigir(ajeno.r.status === 404 && conv.r.status === 404, `espacio ${ajeno.r.status} · conversación ${conv.r.status}`);
  return 'espacio 404 · conversación 404';
});
await paso('Cerrar sesión', async () => {
  const { r } = await api('/auth/logout', { metodo: 'POST' });
  exigir(r.status === 200, `estado ${r.status}`);
  const s = await api('/auth/sesion');
  exigir(s.r.status === 401, `sesión tras logout ${s.r.status}`);
  return 'sesión revocada (401 después)';
});

console.log(`\nPrueba de humo E2E · ${BASE} · ${new Date().toISOString()}`);
console.table(resultados);
const fallas = resultados.filter((r) => r.resultado !== 'OK').length;
console.log(fallas === 0 ? `HUMO-E2E: OK (${resultados.length} pasos)` : `HUMO-E2E: ${fallas} paso(s) fallido(s)`);
process.exit(fallas === 0 ? 0 : 1);
