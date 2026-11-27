/**
 * Planes y recursos del piloto «piloto-2026-11-20» (IM, secciones 14, 15.1 y 15.2; migración 0001 de M5).
 * Copia de presentación para la página pública estática: la autoridad comercial es M5. MB/GB en unidades SI.
 * Los planes docentes se conservan, pero no se muestran en Mentelyx V1 (ADR-093: funciones docentes pospuestas).
 */
export type Plan = { codigo: string; nombre: string; precio: string; publico: 'ESTUDIANTE' | 'DOCENTE'; recursos: Array<[string, string]>; nota?: string };

/**
 * Recursos incluidos en los planes cuya función todavía no existe en la aplicación (26/11/2026): ningún módulo los consume.
 * Se muestran con su límite aprobado, marcados como aún no disponibles; no se quitan ni cambian (decisión comercial de M5).
 * Al integrarse la función, se quita su código o nombre de aquí. Las consultas generales y técnicas y el almacenamiento
 * sí se consumen hoy.
 */
export const RECURSOS_AUN_NO_DISPONIBLES = {
  nombres: ['Razonamiento profundo', 'Evaluaciones de 15 preguntas', 'Ilustraciones'] as readonly string[],
  codigos: ['RAZONAMIENTO_PROFUNDO', 'EVALUACION_EQUIVALENTE', 'ILUSTRACION_ESTANDAR'] as readonly string[],
};
export const NOTA_AUN_NO_DISPONIBLE = 'Los recursos marcados como «aún no disponible» forman parte de cada plan, pero su función todavía no está en Mentelyx: no se pueden usar ni se descuentan.';

const DOCENTE: Array<[string, string]> = [
  ['Documentos educativos', '30'],
  ['Consultas generales', '100'],
  ['Consultas técnicas', '50'],
  ['Razonamiento profundo', '10'],
  ['Ilustraciones', '30'],
  ['Almacenamiento documental', '10 GB'],
  ['Almacenamiento de video', '5 GB'],
  ['Transferencia audiovisual', '10 GB'],
];

export const PLANES: Plan[] = [
  { codigo: 'EST_GRATUITO', nombre: 'Gratuito', precio: 'S/ 0', publico: 'ESTUDIANTE', recursos: [['Consultas generales', '60'], ['Consultas técnicas', '15'], ['Razonamiento profundo', '2'], ['Evaluaciones de 15 preguntas', '3'], ['Ilustraciones', '4'], ['Almacenamiento', '500 MB']] },
  { codigo: 'EST_ESTANDAR', nombre: 'Estándar', precio: 'S/ 39,90', publico: 'ESTUDIANTE', recursos: [['Consultas generales', '250'], ['Consultas técnicas', '100'], ['Razonamiento profundo', '20'], ['Evaluaciones de 15 preguntas', '10'], ['Ilustraciones', '10'], ['Almacenamiento', '2 GB']] },
  { codigo: 'EST_PLUS', nombre: 'Plus', precio: 'S/ 59,90', publico: 'ESTUDIANTE', recursos: [['Consultas generales', '450'], ['Consultas técnicas', '200'], ['Razonamiento profundo', '50'], ['Evaluaciones de 15 preguntas', '20'], ['Ilustraciones', '25'], ['Almacenamiento', '5 GB']] },
  { codigo: 'EST_PREMIUM', nombre: 'Premium', precio: 'S/ 89,90', publico: 'ESTUDIANTE', recursos: [['Consultas generales', '750'], ['Consultas técnicas', '350'], ['Razonamiento profundo', '100'], ['Evaluaciones de 15 preguntas', '40'], ['Ilustraciones', '50'], ['Almacenamiento', '10 GB']] },
  { codigo: 'DOC_INICIAL', nombre: 'Docente Inicial', precio: 'S/ 55', publico: 'DOCENTE', recursos: DOCENTE },
  { codigo: 'DOC_LIVE', nombre: 'Docente Live', precio: 'S/ 100', publico: 'DOCENTE', nota: 'Inicial mensual; incluye las capacidades del plan Docente Inicial.', recursos: DOCENTE },
];
