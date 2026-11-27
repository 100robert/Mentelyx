/**
 * Muestreo de curvas y escalas de ejes para el gráfico (motor visual, sección 8). Una curva se corta en tramos cuando el
 * valor no es finito o salta fuera de la vista (asíntotas: tan x, 1/x), en lugar de unir los extremos con una recta falsa.
 */
export type Vista = { xMin: number; xMax: number; yMin: number; yMax: number };
export const PRESUPUESTO_PUNTOS = 20_000;

export function muestrear(f: (x: number) => number, vista: Vista, muestras = 400): Array<Array<[number, number]>> {
  const n = Math.max(2, Math.min(muestras, PRESUPUESTO_PUNTOS));
  const alto = vista.yMax - vista.yMin;
  const tramos: Array<Array<[number, number]>> = [];
  let actual: Array<[number, number]> = [];
  let previo: number | null = null;
  for (let k = 0; k <= n; k++) {
    const x = vista.xMin + ((vista.xMax - vista.xMin) * k) / n;
    const y = f(x);
    const valido = Number.isFinite(y) && Math.abs(y) < 1e9;
    // Salto mayor que dos alturas de la vista entre dos muestras: discontinuidad.
    const salto = valido && previo !== null && Math.abs(y - previo) > 2 * alto && (Math.sign(y) !== Math.sign(previo) || Math.abs(y) > 4 * alto);
    if (!valido || salto) {
      if (actual.length > 1) tramos.push(actual);
      actual = [];
    }
    if (valido) actual.push([x, y]);
    previo = valido ? y : null;
  }
  if (actual.length > 1) tramos.push(actual);
  return tramos;
}

/** Marcas «redondas» (1, 2 o 5 por potencia de 10) para un rango, entre 4 y 10 marcas. */
export function marcas(min: number, max: number, objetivo = 6): number[] {
  const rango = max - min;
  if (!(rango > 0) || !Number.isFinite(rango)) return [];
  const bruto = rango / objetivo;
  const potencia = 10 ** Math.floor(Math.log10(bruto));
  const paso = [1, 2, 5, 10].map((m) => m * potencia).find((p) => rango / p <= objetivo + 2) ?? 10 * potencia;
  const lista: number[] = [];
  for (let v = Math.ceil(min / paso) * paso; v <= max + paso * 1e-9; v += paso) lista.push(Math.abs(v) < paso * 1e-9 ? 0 : Number(v.toPrecision(12)));
  return lista;
}

/** Zoom alrededor de un punto: factor < 1 acerca y > 1 aleja. La vista nunca se invierte ni se vuelve degenerada. */
export function acercar(v: Vista, factor: number, cx = (v.xMin + v.xMax) / 2, cy = (v.yMin + v.yMax) / 2): Vista {
  const f = Math.min(10, Math.max(0.1, factor));
  const nueva = { xMin: cx - (cx - v.xMin) * f, xMax: cx + (v.xMax - cx) * f, yMin: cy - (cy - v.yMin) * f, yMax: cy + (v.yMax - cy) * f };
  const anchoMin = 1e-3, anchoMax = 1e6;
  if (nueva.xMax - nueva.xMin < anchoMin || nueva.yMax - nueva.yMin < anchoMin) return v;
  if (nueva.xMax - nueva.xMin > anchoMax || nueva.yMax - nueva.yMin > anchoMax) return v;
  return nueva;
}

export const desplazar = (v: Vista, dx: number, dy: number): Vista => ({ xMin: v.xMin + dx, xMax: v.xMax + dx, yMin: v.yMin + dy, yMax: v.yMax + dy });

/** Número con coma decimal y hasta `cifras` decimales, sin ceros sobrantes (−0 se muestra como 0). */
export function decimal(n: number, cifras = 2) {
  if (!Number.isFinite(n)) return '—';
  const v = Number(n.toFixed(cifras));
  return (Object.is(v, -0) ? 0 : v).toString().replace('.', ',').replace('-', '−');
}
