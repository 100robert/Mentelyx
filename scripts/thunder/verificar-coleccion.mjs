#!/usr/bin/env node
// Ejecuta con Node las MISMAS solicitudes de la colección Thunder Client (variables, cookies y «set-env-var») y compara
// el código HTTP con el esperado. No sustituye la ejecución gráfica en Thunder Client; verifica el contrato.
//   node scripts/thunder/verificar-coleccion.mjs [http://localhost:8787]
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'tests/api/thunder-client';
const EVIDENCIA = 'docs/05-evaluacion-arquitectonica/evidencias/thunder-client';
const col = JSON.parse(readFileSync(`${DIR}/mentelyx-api.thunder-collection.json`, 'utf8'));
const env = Object.fromEntries(JSON.parse(readFileSync(`${DIR}/mentelyx-local.thunder-environment.json`, 'utf8')).variables.map((v) => [v.name, v.value]));
const base = (process.argv[2] ?? 'http://localhost:8787').replace(/\/$/, '');
env.baseUrl = `${base}/api/v1`;
env.origin = new URL(base).origin;
const marca = Date.now();
env.correo = `thunder-${marca}@ejemplo.test`;
env.correo2 = `thunder-${marca}-b@ejemplo.test`;

let cookie = '';
const guardar = (r) => {
  const m = new Map(cookie.split('; ').filter(Boolean).map((c) => [c.split('=')[0], c]));
  for (const c of r.headers.getSetCookie().map((x) => x.split(';')[0])) {
    const [k, v] = [c.split('=')[0], c.slice(c.indexOf('=') + 1)];
    if (v) m.set(k, c);
    else m.delete(k);
  }
  cookie = [...m.values()].join('; ');
};
const sustituir = (t) => t.replace(/\{\{#number\}\}/g, () => String(Math.floor(Math.random() * 1e9))).replace(/\{\{(\w+)\}\}/g, (_, k) => env[k] ?? '');
const ruta = (obj, p) => p.replace(/^json\./, '').split('.').reduce((o, k) => o?.[k], obj);

const filas = [];
for (const r of col.requests) {
  const headers = Object.fromEntries(r.headers.map((h) => [h.name, sustituir(h.value)]));
  if (cookie) headers.cookie = cookie;
  const t = Date.now();
  const res = await fetch(sustituir(r.url), { method: r.method, headers, ...(r.body ? { body: sustituir(r.body.raw) } : {}) });
  guardar(res);
  const j = await res.json().catch(() => null);
  for (const p of r.tests.filter((x) => x.type === 'set-env-var')) env[p.value.replace(/[{}]/g, '')] = ruta(j, p.custom);
  const esperado = Number(r.tests.find((x) => x.type === 'res-code').value);
  filas.push({ solicitud: r.name, esperado, obtenido: res.status, resultado: res.status === esperado ? 'OK' : 'FALLA', ms: Date.now() - t, codigo: j?.error?.code ?? '' });
  // Tras la salida o el registro de la segunda cuenta, la sesión cambia: Thunder hace lo mismo con su almacén de cookies.
}
console.table(filas.map(({ solicitud, esperado, obtenido, resultado, codigo }) => ({ solicitud: solicitud.slice(0, 58), esperado, obtenido, resultado, codigo })));
const fallas = filas.filter((f) => f.resultado !== 'OK').length;
mkdirSync(EVIDENCIA, { recursive: true });
writeFileSync(`${EVIDENCIA}/verificacion-contrato.json`, JSON.stringify({ base, fecha: new Date().toISOString(), total: filas.length, fallas, filas }, null, 2) + '\n');
console.log(fallas ? `THUNDER-CONTRATO: ${fallas} FALLA(S)` : `THUNDER-CONTRATO: OK (${filas.length} solicitudes)`);
process.exit(fallas ? 1 : 0);
