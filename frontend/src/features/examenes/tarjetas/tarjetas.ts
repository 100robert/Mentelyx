/**
 * Tarjetas de estudio (recuperación activa): primero se intenta recordar, después se revela la respuesta y se califica.
 * «Otra vez» devuelve la tarjeta al final de la ronda (hasta 3 veces). Es una repetición dentro de la ronda, NO un
 * algoritmo de repetición espaciada: sin persistencia, no hay historial entre días.
 */
export type Tarjeta = { id: string; tema: string; frente: string; reverso: string; latex?: string; fragmento?: string };
export type Calificacion = 'otra-vez' | 'dificil' | 'bien' | 'facil';
export type EstadoRonda = { cola: string[]; revelada: boolean; calificaciones: Record<string, Calificacion[]>; repeticiones: Record<string, number>; terminadas: string[] };

export const MAX_REPETICIONES = 3;

export const iniciarRonda = (ids: readonly string[]): EstadoRonda => ({ cola: [...ids], revelada: false, calificaciones: {}, repeticiones: {}, terminadas: [] });
export const actual = (e: EstadoRonda) => e.cola[0] ?? null;
export const revelar = (e: EstadoRonda): EstadoRonda => (e.cola.length ? { ...e, revelada: true } : e);

export function calificar(e: EstadoRonda, c: Calificacion): EstadoRonda {
  const id = e.cola[0];
  if (!id || !e.revelada) return e;
  const calificaciones = { ...e.calificaciones, [id]: [...(e.calificaciones[id] ?? []), c] };
  const veces = e.repeticiones[id] ?? 0;
  const resto = e.cola.slice(1);
  if (c === 'otra-vez' && veces < MAX_REPETICIONES) {
    return { ...e, cola: [...resto, id], revelada: false, calificaciones, repeticiones: { ...e.repeticiones, [id]: veces + 1 } };
  }
  return { ...e, cola: resto, revelada: false, calificaciones, terminadas: [...e.terminadas, id] };
}

/** Resumen de la ronda: cuántas tarjetas costaron (alguna vez «otra vez» o «difícil»). */
export function resumenRonda(e: EstadoRonda) {
  const ids = Object.keys(e.calificaciones);
  const costaron = ids.filter((id) => e.calificaciones[id]!.some((c) => c === 'otra-vez' || c === 'dificil'));
  return { vistas: ids.length, terminadas: e.terminadas.length, costaron, pendientes: e.cola.length };
}
