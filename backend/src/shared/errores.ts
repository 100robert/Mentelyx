import type { CodigoError } from '@mentelyx/contratos';

/** Error de aplicación con un código del catálogo de la API (sección 7). No transporta trazas ni datos personales. */
export class ErrorAplicacion extends Error {
  readonly code: CodigoError;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: CodigoError, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ErrorAplicacion';
    this.code = code;
    this.details = details;
  }
}
