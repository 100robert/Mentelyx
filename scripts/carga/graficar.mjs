#!/usr/bin/env node
// Gráficas SVG reales de las pruebas k6 (Sprint 2): lee la serie CSV comprimida de k6 y el muestreo de recursos, agrega
// por ventanas de 10 s y dibuja VU, solicitudes/s, latencia p50/p95/p99, tasa de errores 5xx y CPU. Además escribe una
// tabla por etapa de VU (para localizar el punto de saturación).
//   node scripts/carga/graficar.mjs eq01 eq03 eq15 estres
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';
import { createGunzip } from 'node:zlib';

const DIR = 'docs/05-evaluacion-arquitectonica/evidencias/k6';
const VENTANA = 10;
const pct = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))];
};

async function leer(esc) {
  const vent = new Map();
  const rl = createInterface({ input: createReadStream(`${DIR}/${esc}-serie.csv.gz`).pipe(createGunzip()) });
  let cab;
  for await (const linea of rl) {
    const c = linea.split(',');
    if (!cab) {
      cab = Object.fromEntries(c.map((n, i) => [n, i]));
      continue;
    }
    const t = Math.floor(Number(c[cab.timestamp]) / VENTANA) * VENTANA;
    const v = vent.get(t) ?? { vus: 0, reqs: 0, dur: [], err: 0, errN: 0 };
    const m = c[cab.metric_name];
    const val = Number(c[cab.metric_value]);
    if (m === 'vus') v.vus = Math.max(v.vus, val);
    else if (m === 'http_reqs') v.reqs += val;
    else if (m === 'http_req_duration') v.dur.push(val);
    else if (m === 'mentelyx_errores_5xx') {
      v.err += val;
      v.errN += 1;
    }
    vent.set(t, v);
  }
  const t0 = Math.min(...vent.keys());
  return [...vent].sort((a, b) => a[0] - b[0]).map(([t, v]) => ({ s: t - t0, vus: v.vus, rps: v.reqs / VENTANA, p50: pct(v.dur, 50), p95: pct(v.dur, 95), p99: pct(v.dur, 99), err: v.errN ? (100 * v.err) / v.errN : 0 }));
}

function recursos(esc) {
  const f = `${DIR}/${esc}-recursos.csv`;
  if (!existsSync(f)) return [];
  const [cab, ...filas] = readFileSync(f, 'utf8').replace(/^\uFEFF/u, '').trim().split(/\r?\n/);
  const i = Object.fromEntries(cab.split(',').map((n, k) => [n, k]));
  const t0 = Date.parse(filas[0]?.split(',')[0]);
  return filas.map((l) => l.split(',')).map((c) => ({ s: (Date.parse(c[i.marca]) - t0) / 1000, cpu: Number(c[i.cpu_equipo_pct]), ram: Number(c[i.ram_libre_mb]), pg: Number(c[i.postgres_cpu_pct]), con: Number(c[i.conexiones_pg]) }));
}

function svg(titulo, series, ancho = 900, alto = 220) {
  const pad = { l: 60, r: 150, t: 30, b: 30 };
  const xs = series.flatMap((s) => s.puntos.map((p) => p[0]));
  const ys = series.flatMap((s) => s.puntos.map((p) => p[1])).filter((y) => y !== null && Number.isFinite(y));
  const xMax = Math.max(1, ...xs);
  const yMax = Math.max(1, ...ys) * 1.1;
  const X = (x) => pad.l + (x / xMax) * (ancho - pad.l - pad.r);
  const Y = (y) => alto - pad.b - (y / yMax) * (alto - pad.t - pad.b);
  const COLORES = ['#0A1F44', '#84CC16', '#C2410C', '#6D28D9'];
  const lineas = series
    .map((s, k) => `<polyline fill="none" stroke="${COLORES[k % 4]}" stroke-width="2" points="${s.puntos.filter((p) => p[1] !== null).map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join(' ')}"/><text x="${ancho - pad.r + 10}" y="${pad.t + 16 * k + 10}" font-size="12" fill="${COLORES[k % 4]}">${s.nombre}</text>`)
    .join('');
  const marcasY = [0, 0.25, 0.5, 0.75, 1].map((f) => `<text x="${pad.l - 6}" y="${Y(f * yMax) + 4}" font-size="10" text-anchor="end" fill="#444">${(f * yMax).toFixed(yMax < 10 ? 1 : 0)}</text><line x1="${pad.l}" x2="${ancho - pad.r}" y1="${Y(f * yMax)}" y2="${Y(f * yMax)}" stroke="#ddd"/>`).join('');
  const marcasX = [0, 0.25, 0.5, 0.75, 1].map((f) => `<text x="${X(f * xMax)}" y="${alto - 10}" font-size="10" text-anchor="middle" fill="#444">${Math.round(f * xMax)} s</text>`).join('');
  return `<g><text x="${pad.l}" y="18" font-size="13" font-weight="bold" fill="#0A1F44">${titulo}</text>${marcasY}${marcasX}${lineas}</g>`;
}

for (const esc of process.argv.slice(2)) {
  if (!existsSync(`${DIR}/${esc}-serie.csv.gz`)) continue;
  const v = await leer(esc);
  const r = recursos(esc);
  const graficas = [
    svg(`${esc} · usuarios virtuales`, [{ nombre: 'VU', puntos: v.map((x) => [x.s, x.vus]) }]),
    svg(`${esc} · solicitudes por segundo`, [{ nombre: 'req/s', puntos: v.map((x) => [x.s, x.rps]) }]),
    svg(`${esc} · latencia (ms) por ventana de ${VENTANA} s`, [{ nombre: 'p50', puntos: v.map((x) => [x.s, x.p50]) }, { nombre: 'p95', puntos: v.map((x) => [x.s, x.p95]) }, { nombre: 'p99', puntos: v.map((x) => [x.s, x.p99]) }]),
    svg(`${esc} · errores 5xx o de red (%)`, [{ nombre: '% errores', puntos: v.map((x) => [x.s, x.err]) }]),
    ...(r.length ? [svg(`${esc} · CPU del equipo y de PostgreSQL (%) y conexiones PG`, [{ nombre: 'CPU equipo', puntos: r.map((x) => [x.s, x.cpu]) }, { nombre: 'CPU PostgreSQL', puntos: r.map((x) => [x.s, x.pg]) }, { nombre: 'conexiones PG', puntos: r.map((x) => [x.s, x.con]) }])] : []),
  ];
  const alto = 230;
  writeFileSync(`${DIR}/${esc}-graficas.svg`, `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${alto * graficas.length}" font-family="sans-serif" style="background:#fff">${graficas.map((g, k) => `<g transform="translate(0 ${k * alto})">${g}</g>`).join('')}</svg>`);
  // Tabla por etapa: agrupa ventanas por nivel de VU estable.
  const etapas = new Map();
  for (const x of v) {
    if (!x.vus) continue;
    const e = etapas.get(x.vus) ?? { vus: x.vus, ventanas: 0, rps: 0, p95: [], p99: [], err: 0 };
    e.ventanas++;
    e.rps += x.rps;
    e.p95.push(x.p95);
    e.p99.push(x.p99);
    e.err += x.err;
    etapas.set(x.vus, e);
  }
  const tabla = [...etapas.values()]
    .filter((e) => e.ventanas >= 3)
    .map((e) => ({ vus: e.vus, ventanas: e.ventanas, rps: +(e.rps / e.ventanas).toFixed(1), p95_ms: Math.round(pct(e.p95.filter(Boolean), 50)), p99_ms: Math.round(pct(e.p99.filter(Boolean), 50)), errores_pct: +(e.err / e.ventanas).toFixed(2) }));
  writeFileSync(`${DIR}/${esc}-etapas.json`, JSON.stringify(tabla, null, 2) + '\n');
  console.log(`== ${esc}`);
  console.table(tabla);
}
