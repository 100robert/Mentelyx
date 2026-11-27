/** Cliente HTTP del navegador hacia /api/v1 (mismo origen; cookies de sesión HttpOnly). Diseño de interfaces, sección 4. */
export class ErrorApi extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly estado: number,
    readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ErrorApi';
  }
}

export const nuevaClave = () => crypto.randomUUID().replaceAll('-', '');

type Opciones = { metodo?: string; cuerpo?: unknown; clave?: string; cabeceras?: Record<string, string>; senal?: AbortSignal | undefined };

export async function apiCliente<T>(ruta: string, opciones: Opciones = {}): Promise<T> {
  const headers: Record<string, string> = { 'content-type': 'application/json', ...opciones.cabeceras };
  if (opciones.clave) headers['idempotency-key'] = opciones.clave;
  // Se obtiene de nuevo por mutación: login/logout rotan el contexto de sesión. No se persiste en localStorage.
  if (!['GET', 'HEAD', 'OPTIONS'].includes((opciones.metodo ?? 'GET').toUpperCase())) {
    const csrf = await apiCliente<{ token: string }>('/auth/csrf');
    headers['x-csrf-token'] = csrf.token;
  }
  let r: Response;
  try {
    r = await fetch(`/api/v1${ruta}`, {
      method: opciones.metodo ?? 'GET',
      headers,
      credentials: 'same-origin',
      ...(opciones.cuerpo === undefined ? {} : { body: JSON.stringify(opciones.cuerpo) }),
      ...(opciones.senal ? { signal: opciones.senal } : {}),
    });
  } catch (e) {
    // Cancelada por la persona: el resultado en el servidor es desconocido (la misma Idempotency-Key lo recupera).
    if (opciones.senal?.aborted || (e instanceof DOMException && e.name === 'AbortError')) throw new ErrorApi('CANCELADA', 'Cancelaste la espera.', 0);
    throw new ErrorApi('RED', 'No hay conexión con el servidor. Inténtalo de nuevo.', 0);
  }
  const json = (await r.json().catch(() => null)) as { ok: boolean; data?: T; error?: { code: string; message: string; details?: Record<string, unknown> } } | null;
  if (!json?.ok) throw new ErrorApi(json?.error?.code ?? 'ERROR_INTERNO', json?.error?.message ?? 'Ocurrió un error inesperado.', r.status, json?.error?.details);
  return json.data as T;
}

/** Mensajes de error en lenguaje claro (diseño de interfaces, sección 10). */
export function mensajeDeError(e: unknown): string {
  if (!(e instanceof ErrorApi)) return 'Ocurrió un error inesperado.';
  switch (e.code) {
    case 'CUOTA_AGOTADA':
      return 'Agotaste los recursos de esta categoría en tu plan para este mes.';
    case 'PRESUPUESTO_OPERACION_EXCEDIDO':
      return 'El Tutor no está disponible por el momento (presupuesto técnico del periodo). Tus fuentes y conversaciones siguen disponibles.';
    case 'LIMITE_TASA': {
      const espera = Number(e.details?.reintentarEnSeg);
      return Number.isFinite(espera) && espera > 0 ? `Hiciste muchas consultas seguidas. Espera ${Math.ceil(espera)} s y vuelve a intentarlo.` : e.message;
    }
    case 'PROVEEDOR_NO_DISPONIBLE':
      return 'El Tutor no pudo responder en este momento. No se descontó la consulta: inténtalo de nuevo en unos segundos.';
    case 'NO_AUTENTICADO':
      return 'Tu sesión terminó. Vuelve a iniciar sesión.';
    default:
      return e.message;
  }
}
