import { z } from '../zod';
import { validarBloque } from './bloque-validacion';

/**
 * Preguntas versionadas (`mentelyx.pregunta/v1`). Una pregunta es un dato validado: nunca HTML ni código ejecutable.
 * Las de otras disciplinas reutilizan los bloques del núcleo educativo como «apoyo» (gráfico, vectores, código, texto,
 * fórmula, tabla) o como objeto de identificación (obra o modelo 3D), validados con el mismo `validarBloque`.
 */
export const ESQUEMA_PREGUNTA = 'mentelyx.pregunta/v1';
const Id = z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/);
const Texto = (max: number) => z.string().trim().min(1).max(max);
const Opcion = z.strictObject({ id: Id, texto: Texto(400) });
const Tolerancia = z.strictObject({ tipo: z.enum(['absoluta', 'relativa']), valor: z.number().min(0).max(1e6) });

const base = {
  id: Id,
  version: z.literal(1),
  tema: Texto(120),
  dificultad: z.enum(['basica', 'media', 'avanzada']),
  enunciado: Texto(2000),
  explicacion: z.string().max(3000).optional(),
  origen: z.enum(['ejemplo', 'tutor', 'persona', 'material']),
  /** Solo si es verificable: título del material del que procede la pregunta. Nunca se atribuye al docente lo generado. */
  procedencia: z.string().max(200).optional(),
  apoyo: z.unknown().optional(),
};

const OpcionUnica = z.strictObject({ ...base, tipo: z.literal('opcion-unica'), opciones: z.array(Opcion).min(2).max(8), correcta: Id });
const OpcionMultiple = z.strictObject({ ...base, tipo: z.literal('opcion-multiple'), opciones: z.array(Opcion).min(2).max(8), correctas: z.array(Id).min(1).max(8) });
const VerdaderoFalso = z.strictObject({ ...base, tipo: z.literal('verdadero-falso'), correcta: z.boolean() });
const Abierta = z.strictObject({ ...base, tipo: z.literal('abierta'), criterios: z.array(Texto(300)).min(1).max(8), respuestaModelo: z.string().max(3000).optional() });
const Numerica = z.strictObject({ ...base, tipo: z.literal('numerica'), respuesta: z.number().finite(), tolerancia: Tolerancia, unidad: z.string().max(20).optional() });
const Expresion = z.strictObject({
  ...base,
  tipo: z.literal('expresion'),
  respuesta: Texto(200),
  variables: z.array(z.string().regex(/^[a-z]$/)).min(1).max(3),
  dominio: z.strictObject({ min: z.number().finite(), max: z.number().finite() }),
  prefijo: z.string().max(40).optional(),
});
const Identificar = z.strictObject({ ...base, tipo: z.literal('identificar'), objeto: z.unknown(), correcta: Id });
const Ordenamiento = z.strictObject({ ...base, tipo: z.literal('ordenamiento'), elementos: z.array(Opcion).min(2).max(8), orden: z.array(Id).min(2).max(8) });
const Relacion = z.strictObject({ ...base, tipo: z.literal('relacion'), pares: z.array(z.strictObject({ id: Id, izquierda: Texto(200), derecha: Texto(200) })).min(2).max(8) });
const SubPregunta = z.discriminatedUnion('tipo', [
  z.strictObject({ id: Id, tipo: z.literal('opcion-unica'), enunciado: Texto(1000), opciones: z.array(Opcion).min(2).max(8), correcta: Id }),
  z.strictObject({ id: Id, tipo: z.literal('numerica'), enunciado: Texto(1000), respuesta: z.number().finite(), tolerancia: Tolerancia, unidad: z.string().max(20).optional() }),
  z.strictObject({ id: Id, tipo: z.literal('abierta'), enunciado: Texto(1000), criterios: z.array(Texto(300)).min(1).max(8), respuestaModelo: z.string().max(3000).optional() }),
]);
const Caso = z.strictObject({ ...base, tipo: z.literal('caso'), caso: Texto(4000), preguntas: z.array(SubPregunta).min(1).max(6) });

export const Pregunta = z.discriminatedUnion('tipo', [OpcionUnica, OpcionMultiple, VerdaderoFalso, Abierta, Numerica, Expresion, Identificar, Ordenamiento, Relacion, Caso]);
export type Pregunta = z.infer<typeof Pregunta>;
export type TipoPregunta = Pregunta['tipo'];
export type SubPregunta = z.infer<typeof SubPregunta>;
export type PreguntaDe<T extends TipoPregunta> = Extract<Pregunta, { tipo: T }>;

export type EstadoTipo = 'disponible' | 'parcial' | 'pendiente';
/** Catálogo de tipos con su corrección. «parcial»: se responde, pero la corrección automática es limitada o no existe. */
export const CATALOGO_TIPOS: Array<{ tipo: string; nombre: string; estado: EstadoTipo; correccion: string }> = [
  { tipo: 'opcion-unica', nombre: 'Opción múltiple con una respuesta', estado: 'disponible', correccion: 'Determinista' },
  { tipo: 'opcion-multiple', nombre: 'Selección múltiple', estado: 'disponible', correccion: 'Determinista con crédito parcial' },
  { tipo: 'verdadero-falso', nombre: 'Verdadero o falso', estado: 'disponible', correccion: 'Determinista' },
  { tipo: 'abierta', nombre: 'Respuesta abierta', estado: 'parcial', correccion: 'Pendiente de evaluación; el Tutor puede dar una orientación, que no es una nota' },
  { tipo: 'numerica', nombre: 'Respuesta numérica', estado: 'disponible', correccion: 'Comparación numérica con tolerancia explícita' },
  { tipo: 'expresion', nombre: 'Ejercicio matemático (expresión)', estado: 'parcial', correccion: 'Equivalencia aproximada: se evalúa en 24 puntos de un intervalo; no es simbólica ni evalúa el procedimiento. Sin matrices, sistemas ni integrales' },
  { tipo: 'grafico', nombre: 'Interpretación de gráficos', estado: 'disponible', correccion: 'Opción o número sobre un gráfico del núcleo educativo' },
  { tipo: 'identificar-imagen', nombre: 'Identificación en imágenes', estado: 'disponible', correccion: 'Determinista (región elegida)' },
  { tipo: 'identificar-3d', nombre: 'Identificación de estructuras 3D', estado: 'disponible', correccion: 'Determinista (pieza elegida)' },
  { tipo: 'ordenamiento', nombre: 'Ordenamiento', estado: 'disponible', correccion: 'Determinista con crédito parcial por posición' },
  { tipo: 'relacion', nombre: 'Relación de conceptos', estado: 'disponible', correccion: 'Determinista con crédito parcial por par' },
  { tipo: 'caso', nombre: 'Análisis de casos', estado: 'parcial', correccion: 'Por subpregunta: las abiertas quedan pendientes de evaluación' },
];

export type ErrorPregunta = { id: string; mensaje: string };
export type ResultadoValidacion = { ok: true; pregunta: Pregunta } | { ok: false; errores: ErrorPregunta[] };

/** Valida esquema y semántica (opciones y pares únicos, respuestas existentes, apoyo y objeto válidos). */
export function validarPregunta(entrada: unknown): ResultadoValidacion {
  const r = Pregunta.safeParse(entrada);
  const id = typeof (entrada as { id?: unknown })?.id === 'string' ? String((entrada as { id: string }).id) : 'pregunta';
  if (!r.success) return { ok: false, errores: r.error.issues.slice(0, 6).map((i) => ({ id, mensaje: `${i.path.join('/')}: ${i.message}` })) };
  const p = r.data;
  const errores: string[] = [];
  const unicos = (ids: string[]) => new Set(ids).size === ids.length;
  if ('opciones' in p && !unicos(p.opciones.map((o) => o.id))) errores.push('Opciones repetidas.');
  if (p.tipo === 'opcion-unica' && !p.opciones.some((o) => o.id === p.correcta)) errores.push('La respuesta correcta no está entre las opciones.');
  if (p.tipo === 'opcion-multiple' && !p.correctas.every((c) => p.opciones.some((o) => o.id === c))) errores.push('Alguna respuesta correcta no está entre las opciones.');
  if (p.tipo === 'ordenamiento' && (p.orden.length !== p.elementos.length || !p.orden.every((x) => p.elementos.some((e) => e.id === x)) || !unicos(p.orden))) errores.push('El orden no corresponde a los elementos.');
  if (p.tipo === 'relacion' && !unicos(p.pares.map((x) => x.id))) errores.push('Pares repetidos.');
  if (p.tipo === 'expresion' && !(p.dominio.min < p.dominio.max)) errores.push('El dominio no es válido.');
  if (p.tipo === 'caso' && !unicos(p.preguntas.map((x) => x.id))) errores.push('Subpreguntas repetidas.');
  if (p.tipo === 'caso')
    for (const s of p.preguntas) if (s.tipo === 'opcion-unica' && !s.opciones.some((o) => o.id === s.correcta)) errores.push(`La subpregunta ${s.id} no tiene su respuesta entre las opciones.`);
  if (p.apoyo !== undefined && !validarBloque(p.apoyo).ok) errores.push('El apoyo no es un bloque válido.');
  if (p.tipo === 'identificar') {
    const v = validarBloque(p.objeto);
    if (!v.ok || (v.bloque.tipo !== 'obra' && v.bloque.tipo !== 'modelo-3d')) errores.push('Solo se identifican regiones de una obra o piezas de un modelo 3D.');
    else {
      const ids = v.bloque.tipo === 'obra' ? v.bloque.contenido.regiones.map((x) => x.id) : (v.bloque.contenido.partes ?? []).map((x) => x.id);
      if (!ids.includes(p.correcta)) errores.push('La respuesta no es una región o pieza del objeto.');
    }
  }
  return errores.length ? { ok: false, errores: errores.map((mensaje) => ({ id, mensaje })) } : { ok: true, pregunta: p };
}

/** Banco validado: las preguntas inválidas se excluyen y se informan (nunca se muestran a medias). */
export function validarBanco(entradas: readonly unknown[]) {
  const preguntas: Pregunta[] = [];
  const rechazadas: ErrorPregunta[] = [];
  for (const e of entradas) {
    const r = validarPregunta(e);
    if (r.ok) preguntas.push(r.pregunta);
    else rechazadas.push(...r.errores);
  }
  return { preguntas, rechazadas };
}
