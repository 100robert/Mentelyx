import type { Context, ErrorHandler, MiddlewareHandler } from 'hono';
import { z, type Hook } from '@hono/zod-openapi';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { ESTADO_HTTP, RECUPERABLE, type CodigoError } from '@mentelyx/contratos';
import { ErrorAplicacion } from './errores';
import { registrar } from './registro';

export type VariablesBase = { requestId: string };

const meta = (c: Context) => ({ requestId: String(c.get('requestId') ?? 'sin-id'), timestamp: new Date().toISOString() });

/** API, sección 4.1: respuesta de éxito con envoltorio común. */
export const responderOk = <T>(c: Context, data: T, estado: ContentfulStatusCode = 200) =>
  c.json({ ok: true as const, data, meta: meta(c) }, estado);

export const responderFallo = (c: Context, code: CodigoError, message: string, details?: Record<string, unknown>) =>
  c.json(
    { ok: false as const, error: { code, message, recuperable: RECUPERABLE[code], ...(details ? { details } : {}) }, meta: meta(c) },
    ESTADO_HTTP[code] as ContentfulStatusCode,
  );

/** Traduce errores a la envoltura de la API sin filtrar trazas ni secretos (API, sección 1, punto 5). */
export const manejarErrores: ErrorHandler = (err, c) => {
  if (err instanceof ErrorAplicacion) {
    // 429 LIMITE_TASA lleva `Retry-After` (orquestación, sección 10.5).
    const reintentar = err.details?.reintentarEnSeg;
    if (typeof reintentar === 'number' && reintentar > 0) c.header('Retry-After', String(Math.ceil(reintentar)));
    return responderFallo(c, err.code, err.message, err.details);
  }
  // Errores de dominio de autorización por recurso: «no encontrado» para no revelar recursos ajenos.
  if (err instanceof Error && err.name === 'RecursoNoEncontrado') return responderFallo(c, 'RECURSO_NO_ENCONTRADO', err.message);
  if (err instanceof Error && err.name === 'ZodError') return responderFallo(c, 'ENTRADA_INVALIDA', 'La solicitud no cumple el contrato.');
  // EQ-20 (hallazgo de la carga del 27/11/2026): una dependencia de datos inalcanzable es 503 recuperable, no 500.
  if (esFalloDeDependencia(err)) {
    registrar('warn', 'dependencia_no_disponible', { requestId: c.get('requestId'), tipo: err instanceof Error ? err.name : typeof err });
    c.header('Retry-After', '5');
    return responderFallo(c, 'SERVICIO_NO_DISPONIBLE', 'El servicio no está disponible en este momento. Inténtalo de nuevo en unos segundos.');
  }
  registrar('error', 'error_no_controlado', { requestId: c.get('requestId'), tipo: err instanceof Error ? err.name : typeof err });
  return responderFallo(c, 'ERROR_INTERNO', 'Ocurrió un error interno.');
};

const DEPENDENCIA = /^Mongo(ServerSelection|Network|NetworkTimeout|NotConnected|PoolClosed)Error$/;
const MENSAJE_CONEXION = /network connection lost|connection terminated|ECONNREFUSED|ECONNRESET|ETIMEDOUT|too many (clients|connections)|remaining connection slots/i;
/** Fallo de conexión con PostgreSQL o MongoDB (también envuelto por Drizzle en `cause`): sin efectos confirmados. */
export function esFalloDeDependencia(err: unknown): boolean {
  for (let e = err as { name?: string; message?: string; code?: string; cause?: unknown } | undefined, n = 0; e && n < 4; e = e.cause as typeof e, n++) {
    if (DEPENDENCIA.test(e.name ?? '') || MENSAJE_CONEXION.test(e.message ?? '') || e.code === '53300' || e.code === '57P01') return true;
  }
  return false;
}

/** Gancho común de validación: un contrato incumplido responde con la envoltura de la API (ENTRADA_INVALIDA). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- firma genérica de la biblioteca
export const ganchoValidacion: Hook<any, any, any, any> = (resultado, c) => {
  if (resultado.success) return undefined;
  // La única cabecera validada por contrato es Idempotency-Key (API, sección 1, punto 6).
  if (resultado.target === 'header') return responderFallo(c, 'CLAVE_IDEMPOTENCIA_REQUERIDA', 'Falta una cabecera Idempotency-Key válida (8–100 caracteres [A-Za-z0-9_-]).');
  return responderFallo(c, 'ENTRADA_INVALIDA', 'La solicitud no cumple el contrato.');
};

/** `Idempotency-Key` obligatoria en operaciones con efectos (API, sección 1, punto 6), documentada en OpenAPI. */
export const CabeceraIdempotencia = z.object({
  'idempotency-key': z
    .string()
    .regex(/^[A-Za-z0-9_-]{8,100}$/)
    .openapi({ description: 'Clave de idempotencia del cliente: un reintento con la misma clave y el mismo cuerpo devuelve el mismo resultado sin otro efecto.', example: 'consulta-2026-11-21-0001' }),
});

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Defensa CSRF (seguridad, sección 3): una petición con efectos que trae `Origin` de un sitio no permitido se rechaza
 * con 403 antes de llegar a los módulos. Better Auth aplica `trustedOrigins` solo en su propio handler, no en las
 * llamadas `auth.api.*` que hace M1, por eso la comprobación vive aquí (hallazgo de PR-INF-01, 21/11/2026).
 * Mutaciones sin Origin o con Fetch Metadata cross-site se rechazan; clientes HTTP deben declarar el origen permitido.
 * El token CSRF ligado a sesión se comprueba además en csrf.ts. Las lecturas no requieren Origin.
 */
export const verificarOrigen =
  (permitidos: readonly string[]): MiddlewareHandler =>
  async (c, next) => {
    const origen = c.req.header('origin');
    if (!METODOS_SEGUROS.has(c.req.method) && (!origen || !permitidos.includes(origen) || c.req.header('sec-fetch-site') === 'cross-site')) {
      return responderFallo(c, 'NO_AUTORIZADO', 'Origen no permitido.');
    }
    await next();
  };
