import { ErrorAplicacion } from './errores';

/**
 * Contrato técnico para que un módulo obtenga el actor autenticado sin importar M1.
 * La composición (app.ts) lo conecta con la API pública de M1.
 */
export type ResolverActor = (cabeceras: Headers) => Promise<{ actorId: string } | null>;

/** Actor de la sesión del servidor; nunca se toma un identificador de usuario del cuerpo de la petición. */
export async function exigirActor(resolver: ResolverActor, cabeceras: Headers): Promise<string> {
  const actor = await resolver(cabeceras);
  if (!actor) throw new ErrorAplicacion('NO_AUTENTICADO', 'Inicia sesión para continuar.');
  return actor.actorId;
}

const CLAVE_VALIDA = /^[A-Za-z0-9_-]{8,100}$/;

/** API, sección 1, punto 6: las operaciones con efectos exigen `Idempotency-Key`. */
export function exigirClaveIdempotencia(cabeceras: Headers): string {
  const clave = cabeceras.get('idempotency-key');
  if (!clave || !CLAVE_VALIDA.test(clave)) {
    throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REQUERIDA', 'Falta una cabecera Idempotency-Key válida (8–100 caracteres [A-Za-z0-9_-]).');
  }
  return clave;
}

/** Ejecuta trabajo después de responder (en Workers, `ctx.waitUntil`; en pruebas, se espera directamente). */
export type SegundoPlano = (tarea: Promise<unknown>) => void;
