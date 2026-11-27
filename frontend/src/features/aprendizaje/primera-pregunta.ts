/** Opciones para empezar un tema y la primera pregunta al Tutor que preparan (código puro, con pruebas). */
const PROFUNDIDAD = { inicial: 'desde cero', intermedio: 'con un nivel intermedio', avanzado: 'con profundidad' } as const;
const PREVIOS = { nada: 'no sé nada del tema', algo: 'sé algo del tema', bastante: 'ya conozco lo básico' } as const;
const OBJETIVOS = { entender: 'entenderlo bien', practicar: 'practicar con ejercicios', duda: 'resolver una duda concreta' } as const;
export type Opciones = { profundidad: keyof typeof PROFUNDIDAD; previos: keyof typeof PREVIOS; objetivo: keyof typeof OBJETIVOS };

/** Primera pregunta al Tutor a partir del tema y de las opciones elegidas (se prellena; la persona decide enviarla). */
export function primeraPregunta(tema: string, o: Opciones) {
  const cierre = o.objetivo === 'practicar' ? 'Explícame lo esencial y propón ejercicios graduados.' : o.objetivo === 'duda' ? 'Ayúdame a resolver mi duda paso a paso.' : 'Explícamelo paso a paso, con un ejemplo.';
  return `Quiero ${OBJETIVOS[o.objetivo]}: ${tema}. Explícamelo ${PROFUNDIDAD[o.profundidad]}; ${PREVIOS[o.previos]}. ${cierre}`;
}

