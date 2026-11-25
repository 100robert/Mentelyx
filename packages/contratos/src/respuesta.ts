import { z } from './zod';
import { CodigoError } from './errores';

// API, sección 4.1: envoltorio común de éxito y fallo.
export const Meta = z.strictObject({
  requestId: z.string().min(1),
  timestamp: z.iso.datetime(),
  paginacion: z
    .strictObject({ siguienteCursor: z.string().nullable(), limite: z.number().int().min(1).max(100) })
    .optional(),
});
export type Meta = z.infer<typeof Meta>;

export const Fallo = z.strictObject({
  ok: z.literal(false),
  error: z.strictObject({
    code: CodigoError,
    message: z.string(),
    recuperable: z.boolean(),
    details: z.record(z.string(), z.unknown()).optional(),
  }),
  meta: Meta,
});
export type Fallo = z.infer<typeof Fallo>;

export const exito = <T extends z.ZodType>(data: T) =>
  z.strictObject({ ok: z.literal(true), data, meta: Meta });

export type Exito<T> = { ok: true; data: T; meta: Meta };
