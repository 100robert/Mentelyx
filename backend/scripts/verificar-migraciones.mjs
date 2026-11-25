#!/usr/bin/env node
// MIG-04 (estrategia de pruebas; ADR-075): reconstruye PostgreSQL desde una base VACÍA usando solo Drizzle Kit y
// verifica el resultado. Uso: `pnpm db:verificar` (local, con Docker Compose) y en CI. Sale con código 1 si algo falla.
//   1. Crea una base temporal vacía en el servidor de DATABASE_URL (solo localhost, salvo MIG04_PERMITIR_REMOTO=1).
//   2. Aplica TODAS las migraciones con `drizzle-kit migrate`.
//   3. Comprueba esquemas, tablas y columnas contra la última instantánea de Drizzle Kit, el diario de migraciones,
//      los datos semilla de la versión de piloto y los objetos que Drizzle no modela (triggers, EXCLUDE, extensión).
//   4. Vuelve a ejecutar `drizzle-kit migrate`: no debe aplicar nada (idempotencia).
//   5. Ejecuta `drizzle-kit generate` sobre una copia de las migraciones: no debe aparecer una migración nueva
//      (el esquema TypeScript y las migraciones versionadas coinciden; sin deriva).
//   6. Elimina la base temporal (usar --conservar para inspeccionarla).
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { EOL } from 'node:os';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
// `bin.cjs` no está en `exports`: se localiza junto al punto de entrada del paquete instalado.
const DRIZZLE_KIT = join(dirname(createRequire(import.meta.url).resolve('drizzle-kit')), 'bin.cjs');
const ESQUEMAS = ['m1_users', 'm2_contents', 'm3_evaluations', 'm4_classes', 'm5_billing', 'm6_ai_tutor', 'm7_advertising'];
const OBJETOS_FUERA_DE_DRIZZLE = {
  triggers: ['rb_coherente_con_libro', 'resource_ledger_entries_sin_truncate', 'resource_ledger_entries_solo_insercion', 'rle_coherente_con_saldo'],
  exclusiones: ['rb_periodos_sin_solape_ex'],
  extensiones: ['btree_gist', 'vector'],
};
const SEMILLA = { versiones: 6, limites: 40, policyVersion: 'piloto-2026-11-20' };

const base = new URL(process.env.DATABASE_URL ?? 'postgres://mentelyx:mentelyx_local@127.0.0.1:55432/mentelyx');
if (!['127.0.0.1', 'localhost', '::1'].includes(base.hostname) && process.env.MIG04_PERMITIR_REMOTO !== '1') {
  console.error(`MIG-04 se niega a crear bases temporales en ${base.hostname}; use un PostgreSQL local o de CI.`);
  process.exit(1);
}
const conservar = process.argv.includes('--conservar');
const nombre = `mentelyx_mig04_${Date.now()}`;
const destino = new URL(base);
destino.pathname = `/${nombre}`;

const resultados = [];
const comprobar = (nombreCheck, ok, detalle) => {
  resultados.push({ comprobación: nombreCheck, resultado: ok ? 'OK' : 'FALLA', detalle });
  return ok;
};

function drizzleKit(args, url) {
  return execFileSync(process.execPath, [DRIZZLE_KIT, ...args], {
    cwd: RAIZ,
    env: { ...process.env, DATABASE_URL: url.toString(), FORCE_COLOR: '0' },
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    timeout: 120_000,
  });
}

const journal = JSON.parse(readFileSync(join(RAIZ, 'drizzle/meta/_journal.json'), 'utf8'));
const ultima = journal.entries.at(-1);
const snapshot = JSON.parse(readFileSync(join(RAIZ, `drizzle/meta/${String(ultima.idx).padStart(4, '0')}_snapshot.json`), 'utf8'));
const esperadas = new Map(
  Object.values(snapshot.tables).map((t) => [`${t.schema}.${t.name}`, Object.keys(t.columns).sort()]),
);

const admin = new pg.Client({ connectionString: base.toString() });
await admin.connect();
let fallo = false;
try {
  await admin.query(`CREATE DATABASE "${nombre}"`);
  const inicio = Date.now();
  drizzleKit(['migrate'], destino);
  comprobar('drizzle-kit migrate desde base vacía', true, `${journal.entries.length} migraciones en ${Date.now() - inicio} ms`);

  const bd = new pg.Client({ connectionString: destino.toString() });
  await bd.connect();
  try {
    const q = async (sql, params) => (await bd.query(sql, params)).rows;
    const esquemas = (await q(`select nspname from pg_namespace where nspname = any($1)`, [ESQUEMAS])).map((r) => r.nspname);
    comprobar('Esquemas de los 7 módulos', esquemas.length === ESQUEMAS.length, esquemas.sort().join(', '));

    const columnas = await q(
      `select table_schema || '.' || table_name as tabla, column_name from information_schema.columns where table_schema = any($1)`,
      [ESQUEMAS],
    );
    const reales = new Map();
    for (const c of columnas) reales.set(c.tabla, [...(reales.get(c.tabla) ?? []), c.column_name]);
    const faltan = [...esperadas.keys()].filter((t) => !reales.has(t));
    const sobran = [...reales.keys()].filter((t) => !esperadas.has(t));
    comprobar('Tablas = instantánea de Drizzle Kit', faltan.length === 0 && sobran.length === 0, `${reales.size} tablas; faltan [${faltan}] sobran [${sobran}]`);
    const columnasDistintas = [...esperadas].filter(([t, cols]) => reales.has(t) && cols.join() !== reales.get(t).sort().join());
    comprobar('Columnas = instantánea de Drizzle Kit', columnasDistintas.length === 0, columnasDistintas.map(([t]) => t).join(', ') || `${columnas.length} columnas`);

    const [{ n: aplicadas }] = await q(`select count(*)::int as n from drizzle.__drizzle_migrations`);
    comprobar('Diario de migraciones', aplicadas === journal.entries.length, `${aplicadas} aplicadas / ${journal.entries.length} en el diario`);

    const [{ v, l }] = await q(
      `select (select count(*)::int from m5_billing.commercial_plan_versions where policy_version = $1) as v,
              (select count(*)::int from m5_billing.plan_resource_limits where policy_version = $1) as l`,
      [SEMILLA.policyVersion],
    );
    comprobar('Semilla de la versión de piloto', v === SEMILLA.versiones && l === SEMILLA.limites, `${v} versiones comerciales, ${l} límites`);

    const triggers = (await q(`select tgname from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'm5_billing' and not t.tgisinternal order by 1`)).map((r) => r.tgname);
    comprobar('Triggers de M5 (solo inserción y coherencia diferida)', OBJETOS_FUERA_DE_DRIZZLE.triggers.every((t) => triggers.includes(t)), triggers.join(', '));
    const exclusiones = (await q(`select conname from pg_constraint where contype = 'x'`)).map((r) => r.conname);
    comprobar('Restricción EXCLUDE sin solape de periodos', OBJETOS_FUERA_DE_DRIZZLE.exclusiones.every((x) => exclusiones.includes(x)), exclusiones.join(', '));
    const extensiones = await q(`select extname, extversion from pg_extension order by 1`);
    const nombres = extensiones.map((r) => r.extname);
    comprobar('Extensiones requeridas', OBJETOS_FUERA_DE_DRIZZLE.extensiones.every((x) => nombres.includes(x)), extensiones.map((r) => `${r.extname} ${r.extversion}`).join(', '));
    const pgvector = extensiones.find((r) => r.extname === 'vector')?.extversion ?? '0';
    const [mayor, menor] = pgvector.split('.').map(Number);
    comprobar('pgvector ≥ 0.8.0 (persistencia, sección 14.3)', mayor > 0 || menor >= 8, `vector ${pgvector}`);
    const [{ version }] = await q(`select current_setting('server_version') as version`);
    comprobar('Versión del servidor', Number.parseInt(version, 10) >= 17, `PostgreSQL ${version}`);

    drizzleKit(['migrate'], destino);
    const [{ n: tras }] = await q(`select count(*)::int as n from drizzle.__drizzle_migrations`);
    comprobar('Segunda ejecución de migrate no aplica nada', tras === aplicadas, `${tras} aplicadas`);
  } finally {
    await bd.end();
  }

  // Deriva: generar contra una COPIA de las migraciones; si el esquema TS difiere, aparecería un .sql nuevo.
  // La copia vive dentro de backend/ (ignorada por Git): una ruta relativa entre unidades distintas de Windows no existe.
  const temporal = mkdtempSync(join(RAIZ, '.mig04-'));
  try {
    cpSync(join(RAIZ, 'drizzle'), join(temporal, 'drizzle'), { recursive: true });
    const config = join(temporal, 'drizzle.config.mjs');
    const salida = `./${relative(RAIZ, join(temporal, 'drizzle')).split(sep).join('/')}`;
    const contenido = { dialect: 'postgresql', schema: './src/modules/*/infraestructura/schema.ts', out: salida, schemaFilter: ESQUEMAS, strict: true };
    writeFileSync(config, `export default ${JSON.stringify(contenido)};${EOL}`);
    const sqls = () => readdirSync(join(temporal, 'drizzle')).filter((f) => f.endsWith('.sql'));
    const antes = sqls();
    const log = drizzleKit(['generate', `--config=${config}`], destino);
    const nuevas = sqls().filter((f) => !antes.includes(f));
    const sinCambios = /No schema changes/i.test(log);
    comprobar(
      'Sin deriva entre esquema TypeScript y migraciones',
      nuevas.length === 0 && sinCambios,
      sinCambios ? 'drizzle-kit generate: «No schema changes»' : `migración nueva: ${nuevas.join(', ') || '¿?'} · ${log.trim().split(/\r?\n/).at(-1)}`,
    );
  } finally {
    rmSync(temporal, { recursive: true, force: true });
  }
} catch (e) {
  fallo = true;
  comprobar('Ejecución', false, String(e?.stderr || e?.stdout || e?.message || e).slice(0, 2000));
} finally {
  if (!conservar) await admin.query(`DROP DATABASE IF EXISTS "${nombre}" WITH (FORCE)`).catch(() => {});
  await admin.end();
}

console.log(`\nMIG-04 · reconstrucción desde base vacía (${nombre}${conservar ? ', conservada' : ', eliminada al terminar'})`);
console.table(resultados);
const fallas = resultados.filter((r) => r.resultado !== 'OK').length;
console.log(fallas === 0 && !fallo ? 'MIG-04: OK' : `MIG-04: ${fallas} comprobación(es) fallida(s)`);
process.exit(fallas === 0 && !fallo ? 0 : 1);
