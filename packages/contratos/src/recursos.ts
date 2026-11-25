import { z } from './zod';

// API, sección 4.6: categorías públicas de recursos de plan (ADR-080).
export const CodigoRecurso = z.enum([
  'CONSULTA_GENERAL',
  'CONSULTA_TECNICA',
  'RAZONAMIENTO_PROFUNDO',
  'EVALUACION_EQUIVALENTE',
  'ILUSTRACION_ESTANDAR',
  'DOCUMENTO_EQUIVALENTE',
  'ALMACENAMIENTO_BYTES',
]);
export type CodigoRecurso = z.infer<typeof CodigoRecurso>;

/** Persistencia, sección 7.9: códigos adicionales de los planes docentes (no se exponen en el catálogo estudiantil). */
export const CodigoRecursoDocente = z.enum([
  'ALMACENAMIENTO_DOCUMENTAL_BYTES',
  'ALMACENAMIENTO_VIDEO_BYTES',
  'TRANSFERENCIA_AUDIOVISUAL_BYTES',
]);
export const CodigoRecursoPlan = z.union([CodigoRecurso, CodigoRecursoDocente]);
export type CodigoRecursoPlan = z.infer<typeof CodigoRecursoPlan>;

export const CodigoProducto = z.enum(['EST_GRATUITO', 'EST_ESTANDAR', 'EST_PLUS', 'EST_PREMIUM', 'DOC_INICIAL', 'DOC_LIVE']);
export type CodigoProducto = z.infer<typeof CodigoProducto>;

/** Clave de operación: el productor la fija una vez y la reutiliza en reservar, confirmar, liberar y reintegrar. */
export const OperationKey = z.string().trim().min(8).max(200).regex(/^[A-Za-z0-9:_.-]+$/);

// API, sección 2.8: contratos internos de M5 (no son endpoints HTTP).
export const ReservarRecursoCmd = z.strictObject({
  actorId: z.uuid(),
  recurso: CodigoRecursoPlan,
  cantidad: z.number().positive().finite(),
  operationKey: OperationKey,
});
export type ReservarRecursoCmd = z.infer<typeof ReservarRecursoCmd>;

/**
 * Situación actual de una reserva ya registrada. Un reintento con la misma clave nunca crea otro efecto:
 * devuelve `RESERVADO` (resultado definitivo de la operación de reservar) y su situación vigente, para que el
 * productor no vuelva a ejecutar un trabajo ya confirmado ni use una reserva liberada (21/11/2026; campos aditivos).
 */
export const SituacionReserva = z.enum(['PENDIENTE', 'CONFIRMADA', 'LIBERADA']);
export type SituacionReserva = z.infer<typeof SituacionReserva>;

export const ResultadoReserva = z.discriminatedUnion('estado', [
  z.strictObject({
    estado: z.literal('RESERVADO'),
    disponibles: z.number(),
    situacion: SituacionReserva,
    /** `true` si la clave ya existía: esta llamada no modificó saldo ni libro. */
    repetida: z.boolean(),
  }),
  z.strictObject({ estado: z.literal('SIN_CUOTA'), disponibles: z.number() }),
]);
export type ResultadoReserva = z.infer<typeof ResultadoReserva>;

export const ResultadoMovimiento = z.strictObject({ estado: z.enum(['APLICADO', 'YA_APLICADO']) });
export type ResultadoMovimiento = z.infer<typeof ResultadoMovimiento>;

export const MotivoLiberacion = z.enum(['RECHAZADA', 'CANCELADA', 'SIN_EJECUCION']);
export const MotivoReintegro = z.enum(['FALLA_IMPUTABLE_SERVICIO']);

// API, catálogo de M5: GET /api/v1/suscripciones/me/derechos (recursos del periodo por categoría).
export const RecursoDelPeriodo = z.strictObject({
  recurso: CodigoRecursoPlan,
  limite: z.number(),
  extra: z.number(),
  reservado: z.number(),
  consumido: z.number(),
  disponibles: z.number(),
});
export const DerechosDelPeriodo = z.strictObject({
  producto: CodigoProducto,
  policyVersion: z.string(),
  periodo: z.strictObject({ inicio: z.iso.date(), fin: z.iso.date() }),
  recursos: z.array(RecursoDelPeriodo),
});
export type DerechosDelPeriodo = z.infer<typeof DerechosDelPeriodo>;
