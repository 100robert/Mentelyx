import { apiCliente, ErrorApi, mensajeDeError, nuevaClave } from '@/lib/api-cliente';
import type { RespuestaTutorVista } from '@/features/bloques';

/**
 * Llamadas reales al Tutor IA (contrato M6): crear la conversación de la sesión y consultar con una Idempotency-Key fija
 * por pregunta. El transporte actual es JSON; si llega SSE (I-2), solo cambia esta función: la vista recibe el mismo
 * objeto y el adaptador de bloques no depende del transporte.
 */
export type Superficie = 'TUTOR' | 'LECCION' | 'EJERCICIO';
export type RespuestaTutor = RespuestaTutorVista & {
  conversacionId: string;
  estado: 'RESPONDIDA' | 'SIN_CONTEXTO' | 'PARCIAL';
  modoFuentes: 'FUNDAMENTADA' | 'MIXTA' | 'GENERAL';
  uso: { recurso: string; restantesPeriodo: number; ruta: { etiqueta: string } };
  avisos: string[];
};
export type ErrorTutor = { texto: string; codigo: string; reintentable: boolean };

const REINTENTABLES = new Set(['RED', 'OPERACION_EN_CURSO', 'PROVEEDOR_NO_DISPONIBLE', 'LIMITE_TASA', 'SERVICIO_NO_DISPONIBLE']);
export const MAX_PREGUNTA = 4000;

export async function crearConversacion(superficie: Superficie, espacioId?: string, examen?: { preparacionId: string; temaId: string }) {
  const c = await apiCliente<{ id: string }>('/tutor-ia/conversaciones', {
    metodo: 'POST',
    // API 12.9: una sesión de un tema de examen queda vinculada a su preparación (M3 lo verifica).
    cuerpo: { contexto: { superficie, ...(espacioId ? { espacioId } : {}), ...(examen ?? {}) } },
  });
  return c.id;
}

/** `modo: PISTA` (contrato M6): el Tutor guía sin dar la solución completa. `senal` permite cancelar la espera. */
export function consultar(datos: { conversacionId: string; pregunta: string; clave: string; espacioId?: string | undefined; modo?: 'AUTO' | 'PISTA' | undefined; senal?: AbortSignal | undefined }) {
  return apiCliente<RespuestaTutor>('/tutor-ia/consultas', {
    metodo: 'POST',
    clave: datos.clave,
    senal: datos.senal,
    cuerpo: {
      conversacionId: datos.conversacionId,
      pregunta: datos.pregunta.slice(0, MAX_PREGUNTA),
      ...(datos.espacioId ? { fuentes: { espacioId: datos.espacioId } } : {}),
      ...(datos.modo === 'PISTA' ? { modo: 'PISTA' } : {}),
    },
  });
}

export function errorTutor(e: unknown): ErrorTutor {
  const codigo = e instanceof ErrorApi ? e.code : 'ERROR_INTERNO';
  return { texto: mensajeDeError(e), codigo, reintentable: REINTENTABLES.has(codigo) };
}

/** La clave se conserva solo si el resultado es desconocido (red) o sigue en curso: así un reintento no consume dos veces. */
export const conservarClave = (codigo: string) => codigo === 'RED' || codigo === 'OPERACION_EN_CURSO' || codigo === 'CANCELADA';
export { nuevaClave };
