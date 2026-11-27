import type { PreparacionVista } from '../preparaciones/modelo';
import type { Resultados } from '../simulacro/simulacro';

/**
 * Seguimiento con tres conceptos separados:
 * - actividad: lo que se hizo (actividades del plan completadas, preguntas practicadas);
 * - rendimiento observado: resultados efectivamente obtenidos en preguntas con corrección automática;
 * - dominio estimado: NO se calcula todavía. Requiere intentos guardados (contrato 12.7) y un modelo explícito; mostrar
 *   un porcentaje sin esa evidencia sería inventarlo.
 */
export type Intento = { modo: 'practica' | 'simulacro'; nombre: string; resultados: Resultados; terminadoEn: number };

export function actividad(p: PreparacionVista, intentos: readonly Intento[]) {
  return {
    planCompletadas: p.avance.completadas,
    planTotal: p.avance.total,
    preguntasPracticadas: intentos.reduce((a, i) => a + i.resultados.respondidas, 0),
    intentos: intentos.length,
  };
}

export function rendimientoObservado(intentos: readonly Intento[]) {
  const porTema = new Map<string, { correctas: number; evaluadas: number; incorrectas: number }>();
  for (const i of intentos)
    for (const d of i.resultados.detalle) {
      if (d.correccion.puntaje === null || d.correccion.estado === 'pendiente' || d.correccion.estado === 'sin-responder') continue;
      const t = porTema.get(d.tema) ?? { correctas: 0, evaluadas: 0, incorrectas: 0 };
      t.evaluadas++;
      if (d.correccion.estado === 'correcta') t.correctas++;
      if (d.correccion.estado === 'incorrecta' || d.correccion.estado === 'invalida') t.incorrectas++;
      porTema.set(d.tema, t);
    }
  return [...porTema].map(([tema, v]) => ({ tema, ...v }));
}

export type Recomendacion = { clave: string; motivo: 'errores' | 'pendiente-plan' | 'sin-estudiar' | 'pendiente-evaluacion'; tema: string; texto: string; evidencia: string };

/** Recomendaciones de repaso a partir de datos reales: errores observados, plan pendiente y temas sin estudiar. */
export function recomendaciones(p: PreparacionVista, intentos: readonly Intento[]): Recomendacion[] {
  const r: Recomendacion[] = [];
  for (const t of rendimientoObservado(intentos).filter((x) => x.incorrectas > 0).sort((a, b) => b.incorrectas - a.incorrectas))
    r.push({ clave: `e-${t.tema}`, motivo: 'errores', tema: t.tema, texto: `Repasa «${t.tema}»`, evidencia: `${t.incorrectas} ${t.incorrectas === 1 ? 'respuesta incorrecta' : 'respuestas incorrectas'} de ${t.evaluadas} en tus prácticas de hoy.` });
  const pendientesEval = new Set(intentos.flatMap((i) => i.resultados.detalle.filter((d) => d.correccion.estado === 'pendiente').map((d) => d.tema)));
  for (const tema of pendientesEval) r.push({ clave: `p-${tema}`, motivo: 'pendiente-evaluacion', tema, texto: `Revisa tus respuestas abiertas de «${tema}»`, evidencia: 'Quedaron pendientes de evaluación: compáralas con los criterios o pide orientación al Tutor.' });
  for (const t of p.temas) {
    const acts = p.actividades.filter((a) => a.temaCodigo === t.codigo);
    if (acts.length && acts.every((a) => a.estado === 'PENDIENTE')) r.push({ clave: `s-${t.codigo}`, motivo: 'sin-estudiar', tema: t.titulo, texto: `Empieza «${t.titulo}»`, evidencia: 'Aún no completaste ninguna actividad de este tema en tu plan.' });
    else if (acts.some((a) => a.estado === 'PENDIENTE')) r.push({ clave: `q-${t.codigo}`, motivo: 'pendiente-plan', tema: t.titulo, texto: `Termina «${t.titulo}»`, evidencia: `${acts.filter((a) => a.estado === 'PENDIENTE').length} ${acts.filter((a) => a.estado === 'PENDIENTE').length === 1 ? 'actividad pendiente' : 'actividades pendientes'} en tu plan.` });
  }
  return r;
}
