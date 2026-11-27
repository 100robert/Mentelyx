import { z } from './zod';

// Subconjunto del catálogo de errores (API, sección 7) que usa I-0. Se amplía por incremento, sin renombrar códigos.
export const ESTADO_HTTP = {
  ENTRADA_INVALIDA: 400,
  CLAVE_IDEMPOTENCIA_REQUERIDA: 400,
  NO_AUTENTICADO: 401,
  NO_AUTORIZADO: 403,
  RECURSO_NO_ENCONTRADO: 404,
  OPERACION_EN_CURSO: 409,
  /** V1 (26/11/2026): nombre repetido entre carpetas hermanas (API 12.1). */
  NOMBRE_DUPLICADO: 409,
  /** V1: el intento ya se entregó o su plazo del servidor terminó (API 12.9). */
  INTENTO_CERRADO: 409,
  /** `If-Match` no coincide con la versión guardada (API, sección 7; 12.5). */
  CONFLICTO_VERSION: 412,
  CLAVE_IDEMPOTENCIA_REUTILIZADA: 422,
  CUOTA_AGOTADA: 429,
  PRESUPUESTO_OPERACION_EXCEDIDO: 429,
  LIMITE_TASA: 429,
  ERROR_INTERNO: 500,
  SERVICIO_NO_DISPONIBLE: 503,
  PROVEEDOR_NO_DISPONIBLE: 503,
} as const;

export const CodigoError = z.enum(Object.keys(ESTADO_HTTP) as [keyof typeof ESTADO_HTTP, ...(keyof typeof ESTADO_HTTP)[]]);
export type CodigoError = z.infer<typeof CodigoError>;

/** Errores que el cliente puede reintentar con seguridad (API, sección 7, columna «Recuperable»). */
export const RECUPERABLE: Readonly<Record<CodigoError, boolean>> = {
  ENTRADA_INVALIDA: false,
  CLAVE_IDEMPOTENCIA_REQUERIDA: false,
  NO_AUTENTICADO: false,
  NO_AUTORIZADO: false,
  RECURSO_NO_ENCONTRADO: false,
  OPERACION_EN_CURSO: true,
  NOMBRE_DUPLICADO: false,
  INTENTO_CERRADO: false,
  CONFLICTO_VERSION: false,
  CLAVE_IDEMPOTENCIA_REUTILIZADA: false,
  CUOTA_AGOTADA: false,
  PRESUPUESTO_OPERACION_EXCEDIDO: false,
  LIMITE_TASA: true,
  ERROR_INTERNO: true,
  SERVICIO_NO_DISPONIBLE: true,
  PROVEEDOR_NO_DISPONIBLE: true,
};
