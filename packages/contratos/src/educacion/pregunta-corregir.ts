import { analizar, evaluar } from './expresion';
import type { Pregunta, SubPregunta } from './pregunta-esquema';

/**
 * Corrección de respuestas, siempre con código determinista (nunca código generado por IA):
 * - determinista (opciones, verdadero o falso, identificación, orden y relación, con crédito parcial donde corresponde);
 * - numérica con tolerancia explícita, leyendo la respuesta con el analizador seguro (fracciones y coma decimal);
 * - expresiones: equivalencia comprobada evaluando ambas en puntos del dominio (alcance declarado: no es simbólica);
 * - abiertas: quedan «pendientes de evaluación». No se comparan textos.
 */
export type Respuesta =
  | { tipo: 'opcion'; id: string | null }
  | { tipo: 'opciones'; ids: string[] }
  | { tipo: 'booleano'; valor: boolean | null }
  | { tipo: 'texto'; valor: string }
  | { tipo: 'orden'; ids: string[] }
  | { tipo: 'pares'; asignacion: Record<string, string> }
  | { tipo: 'caso'; respuestas: Record<string, Respuesta> };

export type EstadoCorreccion = 'correcta' | 'incorrecta' | 'parcial' | 'pendiente' | 'sin-responder' | 'invalida';
export type Correccion = { estado: EstadoCorreccion; puntaje: number | null; criterio: string; detalle: string };

const fin = (estado: EstadoCorreccion, puntaje: number | null, criterio: string, detalle: string): Correccion => ({ estado, puntaje, criterio, detalle });
const porPuntaje = (p: number, criterio: string, detalle: string) => fin(p >= 1 ? 'correcta' : p <= 0 ? 'incorrecta' : 'parcial', Math.max(0, Math.min(1, p)), criterio, detalle);
const cifra = (n: number) => String(Number(n.toPrecision(10))).replace('.', ',');

/** Lee un número escrito por la persona: enteros, decimales con coma, fracciones u operaciones sin variables. */
export function leerNumero(texto: string): number | null {
  const r = analizar(texto.trim(), []);
  if (!r.ok) return null;
  const v = evaluar(r.nodo, {});
  return Number.isFinite(v) ? v : null;
}

export function dentroDeTolerancia(valor: number, esperado: number, t: { tipo: 'absoluta' | 'relativa'; valor: number }) {
  const margen = t.tipo === 'absoluta' ? t.valor : t.valor * Math.abs(esperado);
  return Math.abs(valor - esperado) <= margen + 1e-12;
}

const PUNTOS = 24;
/**
 * Equivalencia de dos expresiones en las variables dadas, evaluándolas en 24 puntos repartidos en el dominio. Exige al
 * menos 12 puntos donde ambas estén definidas. Es una comprobación numérica: puede no distinguir expresiones que solo
 * difieren fuera del dominio o en puntos aislados, y así se informa.
 */
export function equivalentes(respuesta: string, esperada: string, variables: readonly string[], dominio: { min: number; max: number }): { ok: boolean; motivo: string } {
  const a = analizar(respuesta, variables);
  if (!a.ok) return { ok: false, motivo: a.error.mensaje };
  const b = analizar(esperada, variables);
  if (!b.ok) return { ok: false, motivo: 'La respuesta esperada no es válida.' };
  let validos = 0;
  for (let k = 0; k < PUNTOS; k++) {
    const valores: Record<string, number> = {};
    variables.forEach((v, j) => {
      // Puntos no equiespaciados y distintos por variable, para no caer en simetrías.
      const f = ((k + 0.5) / PUNTOS + 0.37 * j + 0.0123 * k * k) % 1;
      valores[v] = dominio.min + f * (dominio.max - dominio.min);
    });
    const x = evaluar(a.nodo, valores);
    const y = evaluar(b.nodo, valores);
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
    validos++;
    if (Math.abs(x - y) > 1e-6 * Math.max(1, Math.abs(y))) return { ok: false, motivo: `No coincide con la respuesta esperada en ${variables.map((v) => `${v} = ${cifra(valores[v]!)}`).join(', ')}.` };
  }
  if (validos < PUNTOS / 2) return { ok: false, motivo: 'No se pudo comprobar en suficientes puntos del dominio.' };
  return { ok: true, motivo: `Coincide en ${validos} puntos de [${cifra(dominio.min)}; ${cifra(dominio.max)}].` };
}

function corregirSub(s: SubPregunta, r: Respuesta | undefined): Correccion {
  if (s.tipo === 'opcion-unica') {
    if (r?.tipo !== 'opcion' || !r.id) return fin('sin-responder', 0, 'Determinista', 'Sin respuesta.');
    return r.id === s.correcta ? fin('correcta', 1, 'Determinista', 'Opción correcta.') : fin('incorrecta', 0, 'Determinista', 'Opción incorrecta.');
  }
  if (s.tipo === 'numerica') {
    if (r?.tipo !== 'texto' || !r.valor.trim()) return fin('sin-responder', 0, 'Numérica', 'Sin respuesta.');
    const v = leerNumero(r.valor);
    if (v === null) return fin('invalida', 0, 'Numérica', 'No es un número.');
    return dentroDeTolerancia(v, s.respuesta, s.tolerancia) ? fin('correcta', 1, 'Numérica', `Dentro de la tolerancia.`) : fin('incorrecta', 0, 'Numérica', `Se esperaba ${cifra(s.respuesta)}${s.unidad ? ` ${s.unidad}` : ''}.`);
  }
  if (r?.tipo !== 'texto' || !r.valor.trim()) return fin('sin-responder', null, 'Abierta', 'Sin respuesta.');
  return fin('pendiente', null, 'Abierta', 'Pendiente de evaluación: una respuesta abierta no se corrige comparando textos.');
}

export function corregir(p: Pregunta, r: Respuesta | undefined): Correccion {
  switch (p.tipo) {
    case 'opcion-unica':
    case 'identificar': {
      if (r?.tipo !== 'opcion' || !r.id) return fin('sin-responder', 0, 'Determinista', 'Sin respuesta.');
      return r.id === p.correcta ? fin('correcta', 1, 'Determinista', 'Respuesta correcta.') : fin('incorrecta', 0, 'Determinista', 'Respuesta incorrecta.');
    }
    case 'verdadero-falso': {
      if (r?.tipo !== 'booleano' || r.valor === null) return fin('sin-responder', 0, 'Determinista', 'Sin respuesta.');
      return r.valor === p.correcta ? fin('correcta', 1, 'Determinista', 'Respuesta correcta.') : fin('incorrecta', 0, 'Determinista', `Es ${p.correcta ? 'verdadero' : 'falso'}.`);
    }
    case 'opcion-multiple': {
      if (r?.tipo !== 'opciones' || r.ids.length === 0) return fin('sin-responder', 0, 'Determinista con crédito parcial', 'Sin respuesta.');
      const aciertos = r.ids.filter((x) => p.correctas.includes(x)).length;
      const errores = r.ids.length - aciertos;
      return porPuntaje((aciertos - errores) / p.correctas.length, 'Determinista con crédito parcial', `${aciertos} de ${p.correctas.length} correctas elegidas${errores ? `, ${errores} incorrecta${errores === 1 ? '' : 's'} (restan)` : ''}.`);
    }
    case 'numerica': {
      if (r?.tipo !== 'texto' || !r.valor.trim()) return fin('sin-responder', 0, 'Numérica con tolerancia', 'Sin respuesta.');
      const v = leerNumero(r.valor);
      if (v === null) return fin('invalida', 0, 'Numérica con tolerancia', 'La respuesta no es un número (puedes usar fracciones y coma decimal).');
      const t = p.tolerancia;
      const margen = t.tipo === 'absoluta' ? `±${cifra(t.valor)}` : `±${cifra(t.valor * 100)} %`;
      return dentroDeTolerancia(v, p.respuesta, t)
        ? fin('correcta', 1, `Comparación numérica (tolerancia ${margen})`, `Tu valor, ${cifra(v)}, está dentro de la tolerancia.`)
        : fin('incorrecta', 0, `Comparación numérica (tolerancia ${margen})`, `Tu valor es ${cifra(v)}; se esperaba ${cifra(p.respuesta)}${p.unidad ? ` ${p.unidad}` : ''}.`);
    }
    case 'expresion': {
      const criterio = 'Equivalencia aproximada por evaluación numérica (no simbólica)';
      if (r?.tipo !== 'texto' || !r.valor.trim()) return fin('sin-responder', 0, criterio, 'Sin respuesta.');
      const e = equivalentes(r.valor, p.respuesta, p.variables, p.dominio);
      if (!e.ok && analizar(r.valor, p.variables).ok === false) return fin('invalida', 0, criterio, e.motivo);
      return e.ok
        ? fin('correcta', 1, criterio, `Coincide con la respuesta esperada: ${e.motivo.charAt(0).toLowerCase()}${e.motivo.slice(1)} Fuera de ese intervalo no se comprobó. No es una demostración simbólica y no evalúa el procedimiento, solo la respuesta final.`)
        : fin('incorrecta', 0, criterio, e.motivo);
    }
    case 'ordenamiento': {
      if (r?.tipo !== 'orden' || r.ids.length === 0) return fin('sin-responder', 0, 'Posiciones', 'Sin respuesta.');
      const bien = p.orden.filter((x, k) => r.ids[k] === x).length;
      return porPuntaje(bien / p.orden.length, 'Determinista con crédito parcial por posición', `${bien} de ${p.orden.length} en su lugar.`);
    }
    case 'relacion': {
      if (r?.tipo !== 'pares' || Object.keys(r.asignacion).length === 0) return fin('sin-responder', 0, 'Pares', 'Sin respuesta.');
      const bien = p.pares.filter((x) => r.asignacion[x.id] === x.id).length;
      return porPuntaje(bien / p.pares.length, 'Determinista con crédito parcial por par', `${bien} de ${p.pares.length} pares correctos.`);
    }
    case 'abierta': {
      if (r?.tipo !== 'texto' || !r.valor.trim()) return fin('sin-responder', null, 'Abierta', 'Sin respuesta.');
      return fin('pendiente', null, 'Abierta', 'Pendiente de evaluación: compárala tú con los criterios. Una respuesta abierta no se corrige comparando textos.');
    }
    case 'caso': {
      const respuestas = r?.tipo === 'caso' ? r.respuestas : {};
      const subs = p.preguntas.map((s) => corregirSub(s, respuestas[s.id]));
      const automaticas = subs.filter((s) => s.puntaje !== null);
      const pendientes = subs.filter((s) => s.estado === 'pendiente').length;
      if (subs.every((s) => s.estado === 'sin-responder')) return fin('sin-responder', 0, 'Por subpregunta', 'Sin respuesta.');
      const puntaje = automaticas.length ? automaticas.reduce((a, s) => a + (s.puntaje ?? 0), 0) / automaticas.length : null;
      const detalle = `${subs.filter((s) => s.estado === 'correcta').length} de ${automaticas.length} subpreguntas con corrección automática correctas${pendientes ? `; ${pendientes} pendiente${pendientes === 1 ? '' : 's'} de evaluación` : ''}.`;
      if (pendientes) return fin('pendiente', puntaje, 'Por subpregunta', detalle);
      return puntaje === null ? fin('pendiente', null, 'Por subpregunta', detalle) : porPuntaje(puntaje, 'Por subpregunta', detalle);
    }
  }
}

/** Correcciones de cada subpregunta (para revisar un caso). */
export const corregirSubpreguntas = (p: Extract<Pregunta, { tipo: 'caso' }>, r: Respuesta | undefined) =>
  p.preguntas.map((s) => ({ id: s.id, correccion: corregirSub(s, r?.tipo === 'caso' ? r.respuestas[s.id] : undefined) }));

export function respondida(r: Respuesta | undefined): boolean {
  if (!r) return false;
  switch (r.tipo) {
    case 'opcion':
      return !!r.id;
    case 'opciones':
    case 'orden':
      return r.ids.length > 0;
    case 'booleano':
      return r.valor !== null;
    case 'texto':
      return r.valor.trim() !== '';
    case 'pares':
      return Object.keys(r.asignacion).length > 0;
    case 'caso':
      return Object.values(r.respuestas).some(respondida);
  }
}
