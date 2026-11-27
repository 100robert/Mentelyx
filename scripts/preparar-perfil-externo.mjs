#!/usr/bin/env node
// Genera backend/.dev.vars.externo (ignorado por Git) para `wrangler dev --env externo`: Neon (pooled), MongoDB Atlas y
// NVIDIA, a partir de los secretos centralizados en backend/.secretos/ y del AUTH_SECRET local. NUNCA imprime valores.
//   node scripts/preparar-perfil-externo.mjs
// Fuentes: backend/.secretos/neon-nvidia.env (DATABASE_URL y DIRECT_DATABASE_URL de Neon, NVIDIA_API_KEY, NVIDIA_BASE_URL)
//          backend/.secretos/atlas.env (MONGODB_URI)  ·  backend/.dev.vars (AUTH_SECRET)
// Con --json <archivo> escribe además el JSON para `wrangler secret bulk` (despliegue; requiere autorización).
import dns from 'node:dns/promises';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const leer = (f) =>
  Object.fromEntries(
    readFileSync(raiz + f, 'utf8')
      .split(/\r?\n/)
      .filter((l) => /^[A-Z_][A-Z0-9_]*\s*=/.test(l))
      .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '')]),
  );

const neon = leer('backend/.secretos/neon-nvidia.env');
const atlas = leer('backend/.secretos/atlas.env');
const local = leer('backend/.dev.vars');

// La aplicación usa la conexión POOLED (host «-pooler»); las migraciones, la directa. Se elige por el host, no por el nombre.
const urls = [neon.DATABASE_URL, neon.DIRECT_DATABASE_URL].filter(Boolean);
const pooled = urls.find((u) => new URL(u).hostname.includes('-pooler'));
if (!pooled) throw new Error('No se encontró una URL pooled de Neon (host con «-pooler»).');

// Atlas: la URI SRV se convierte en lista de semillas (sin SRV ni TXT en tiempo de ejecución dentro de workerd).
async function sinSrv(uri) {
  if (!uri.startsWith('mongodb+srv://')) return uri;
  dns.setServers(['1.1.1.1', '8.8.8.8']);
  const u = new URL(uri.replace('mongodb+srv://', 'http://'));
  const srv = await dns.resolveSrv(`_mongodb._tcp.${u.hostname}`);
  const txt = (await dns.resolveTxt(u.hostname).catch(() => [])).flat().join('&');
  const params = new URLSearchParams(txt);
  for (const [k, v] of u.searchParams) params.set(k, v);
  params.set('tls', 'true');
  const hosts = srv.map((s) => `${s.name}:${s.port}`).join(',');
  const credenciales = u.username ? `${u.username}:${u.password}@` : '';
  return `mongodb://${credenciales}${hosts}/?${params.toString()}`;
}

const valores = {
  AUTH_SECRET: local.AUTH_SECRET,
  DATABASE_URL: pooled,
  MONGODB_URL: await sinSrv(atlas.MONGODB_URI),
  NVIDIA_API_KEY: neon.NVIDIA_API_KEY,
};
for (const [k, v] of Object.entries(valores)) if (!v) throw new Error(`Falta ${k}`);
writeFileSync(raiz + 'backend/.dev.vars.externo', Object.entries(valores).map(([k, v]) => `${k}=${v}`).join('\n') + '\n', { mode: 0o600 });
console.log(`backend/.dev.vars.externo escrito con: ${Object.keys(valores).join(', ')} (valores ocultos)`);

const i = process.argv.indexOf('--json');
if (i > 0 && process.argv[i + 1]) {
  writeFileSync(process.argv[i + 1], JSON.stringify(valores), { mode: 0o600 });
  console.log(`JSON para «wrangler secret bulk» escrito en ${process.argv[i + 1]} (bórralo tras usarlo)`);
}
