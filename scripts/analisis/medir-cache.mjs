#!/usr/bin/env node
// Caché fría frente a caliente en el entorno LOCAL (OpenNext en workerd + API Hono). Mide la primera petición y la mediana
// de las 20 siguientes y registra las cabeceras de caché. No mide la CDN de Cloudflare: localhost no la tiene.
//   node scripts/analisis/medir-cache.mjs [http://127.0.0.1:8788]
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = (process.argv[2] ?? 'http://127.0.0.1:8788').replace(/\/$/, '');
const CONTRASENA = process.env.DEMO_CONTRASENA ?? 'Demo-Mentelyx-2026';
let cookie = '';
const guardar = (r) => {
  const m = new Map(cookie.split('; ').filter(Boolean).map((c) => [c.split('=')[0], c]));
  for (const c of r.headers.getSetCookie().map((x) => x.split(';')[0])) m.set(c.split('=')[0], c);
  cookie = [...m.values()].join('; ');
};
async function pedir(ruta, conSesion = false) {
  const t = performance.now();
  const r = await fetch(BASE + ruta, { headers: { origin: BASE, ...(conSesion ? { cookie } : {}) }, redirect: 'manual' });
  await r.arrayBuffer();
  return { ms: performance.now() - t, estado: r.status, cache: r.headers.get('x-nextjs-cache') ?? r.headers.get('cf-cache-status') ?? '—', control: r.headers.get('cache-control') ?? '—' };
}
const med = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];

// Sesión de la cuenta ficticia de demostración (para las rutas privadas).
const c = await fetch(`${BASE}/api/v1/auth/csrf`, { headers: { origin: BASE } });
guardar(c);
const token = (await c.json()).data.token;
guardar(await fetch(`${BASE}/api/v1/auth/login`, { method: 'POST', headers: { origin: BASE, cookie, 'content-type': 'application/json', 'x-csrf-token': token }, body: JSON.stringify({ correo: 'demo.ana@ejemplo.test', contrasena: CONTRASENA }) }));

const html = await (await fetch(`${BASE}/`)).text();
const estatico = html.match(/\/_next\/static\/[^"']+\.js/)?.[0];
const casos = [
  ['SSG · landing /', '/', false],
  ['SSG · /planes', '/planes', false],
  ['ISR · /biblioteca (revalidate 300 s)', '/biblioteca', false],
  ...(estatico ? [['Estático · bundle JS de Next', estatico, false]] : []),
  ['SSR privado · /examenes', '/examenes', true],
  ['API pública · /api/v1/salud', '/api/v1/salud', false],
  ['API privada · /api/v1/preparaciones', '/api/v1/preparaciones', true],
];
const filas = [];
for (const [nombre, ruta, sesion] of casos) {
  const primera = await pedir(ruta, sesion);
  const siguientes = [];
  for (let i = 0; i < 20; i++) siguientes.push(await pedir(ruta, sesion));
  filas.push({ recurso: nombre, estado: primera.estado, primera_ms: Math.round(primera.ms), mediana_siguientes_ms: Math.round(med(siguientes.map((s) => s.ms))), cache_primera: primera.cache, cache_siguientes: [...new Set(siguientes.map((s) => s.cache))].join('/'), cache_control: primera.control });
}
console.table(filas);
mkdirSync('docs/05-evaluacion-arquitectonica/evidencias/cache', { recursive: true });
writeFileSync('docs/05-evaluacion-arquitectonica/evidencias/cache/medicion-cache-local.json', JSON.stringify({ base: BASE, fecha: new Date().toISOString(), nota: 'Entorno local (workerd); no incluye la CDN de Cloudflare.', filas }, null, 2) + '\n');
