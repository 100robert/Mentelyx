// Diagnóstico de saturación (no es un escenario EQ): aísla si el límite está en el proceso del Worker local o en las
// conexiones a las bases. Mismo nivel de concurrencia contra una ruta SIN base (`/salud`) y otra que abre conexiones a
// PostgreSQL para la sesión (`/auth/sesion` con cookie inválida: consulta la sesión y responde 401).
//   k6 run -e RUTA=/salud scripts/carga/diagnostico-k6.js
//   k6 run -e RUTA=/auth/sesion scripts/carga/diagnostico-k6.js
import http from 'k6/http';
import { check } from 'k6';

const BASE = (__ENV.BASE_URL || 'http://127.0.0.1:8792').replace(/\/$/, '');
const RUTA = __ENV.RUTA || '/salud';
export const options = { vus: Number(__ENV.VUS || 50), duration: __ENV.DURACION || '30s', summaryTrendStats: ['med', 'p(95)', 'p(99)'] };
export default function () {
  const r = http.get(`${BASE}/api/v1${RUTA}`, { headers: { cookie: 'mentelyx.session_token=invalida' } });
  check(r, { 'respuesta esperada': (x) => x.status === 200 || x.status === 401 });
}
export function handleSummary(d) {
  const m = d.metrics;
  const linea = JSON.stringify({ ruta: RUTA, vus: options.vus, req_s: +m.http_reqs.values.rate.toFixed(1), p50_ms: +m.http_req_duration.values.med.toFixed(0), p95_ms: +m.http_req_duration.values['p(95)'].toFixed(0), fallidas_pct: +(m.http_req_failed.values.rate * 100).toFixed(2) });
  return { stdout: `${linea}\n`, [`docs/05-evaluacion-arquitectonica/evidencias/k6/diagnostico${RUTA.replace(/\//g, '-')}.json`]: `${linea}\n` };
}
