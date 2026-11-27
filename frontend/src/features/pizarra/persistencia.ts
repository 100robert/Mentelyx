import type { EstadoEspacio, Interaccion } from '@/features/bloques/acciones';
import type { Bloque } from '@/features/bloques/esquema';
import type { Elemento } from './modelo';

/**
 * Qué se guarda de la pizarra y dónde (API 12.5, `PUT /tutor-ia/conversaciones/{id}/estado` con `If-Match`):
 * - la interacción con los bloques (pasos revelados, parámetros, vistas, selección): `interaccion`;
 * - los bloques propios (ecuación, gráfico, tabla, modelo, documento, ejercicio): `bloquesPropios`, hasta 20;
 * - las anotaciones de documentos y obras: `anotaciones` (las conserva tal cual; la pizarra no las crea).
 * La capa de trabajo (trazos, formas y textos) NO tiene contrato todavía: no se guarda y la interfaz lo dice.
 */
export const LIMITE_ESTADO_BYTES = 64 * 1024;
export const MAX_PROPIOS = 20;

export type EstadoRemoto = { version: number; interaccion: Record<string, Interaccion>; anotaciones: unknown[]; bloquesPropios?: unknown[] };
export type CuerpoEstado = { interaccion: Record<string, Interaccion>; anotaciones: unknown[]; bloquesPropios: Bloque[] };

export const propiosDe = (bloques: readonly Bloque[]) => bloques.filter((b) => b.origen === 'persona').slice(0, MAX_PROPIOS);

/** Cuerpo del PUT: solo la interacción de bloques que siguen en la sesión. Si supera 64 KB, no se envía. */
export function cuerpoEstado(estado: Pick<EstadoEspacio, 'bloques' | 'interaccion'>, anotaciones: readonly unknown[]): { ok: true; cuerpo: CuerpoEstado; serie: string } | { ok: false; motivo: 'TAMANO' } {
  const ids = new Set(estado.bloques.map((b) => b.id));
  const interaccion = Object.fromEntries(Object.entries(estado.interaccion).filter(([k]) => ids.has(k)));
  const cuerpo: CuerpoEstado = { interaccion, anotaciones: [...anotaciones], bloquesPropios: propiosDe(estado.bloques) };
  const serie = JSON.stringify(cuerpo);
  if (new TextEncoder().encode(serie).length > LIMITE_ESTADO_BYTES) return { ok: false, motivo: 'TAMANO' };
  return { ok: true, cuerpo, serie };
}

/** Clave de cambio: el guardado se programa cuando cambia la interacción o los bloques propios, no por otra cosa. */
export const claveCambio = (estado: Pick<EstadoEspacio, 'bloques' | 'interaccion'>) => JSON.stringify([estado.interaccion, propiosDe(estado.bloques)]);

/**
 * Restaura lo guardado sobre el estado reconstruido desde los mensajes: agrega (con `crear-bloque`, que los valida) los
 * bloques propios que falten y combina la interacción de los bloques que existen.
 */
export function restaurar(actual: Pick<EstadoEspacio, 'bloques' | 'interaccion'>, remoto: EstadoRemoto) {
  const presentes = new Set(actual.bloques.map((b) => b.id));
  const acciones = (remoto.bloquesPropios ?? [])
    .filter((b): b is { id: string } => typeof b === 'object' && b !== null && typeof (b as { id?: unknown }).id === 'string' && !presentes.has((b as { id: string }).id))
    .slice(0, MAX_PROPIOS)
    .map((bloque) => ({ accion: 'crear-bloque' as const, bloque: { ...bloque, origen: 'persona' } }));
  const ids = new Set([...presentes, ...acciones.map((a) => a.bloque.id)]);
  const interaccion = Object.fromEntries(Object.entries(remoto.interaccion ?? {}).filter(([k]) => ids.has(k)));
  return { acciones, interaccion };
}

/** Texto del indicador de guardado: nunca dice «Guardado» si no se guardó, y separa lo que no tiene contrato. */
export function textoGuardado(o: { estado: 'sin-sesion' | 'cargando' | 'guardado' | 'guardando' | 'error' | 'demasiado-grande'; enviando: boolean; errorPregunta: boolean; trabajo: readonly Elemento[] }) {
  const principal = o.enviando
    ? 'Guardando tu pregunta…'
    : o.errorPregunta
      ? 'Tu última pregunta no se guardó'
      : {
          'sin-sesion': 'Sin guardar: la sesión empieza con tu primera pregunta',
          cargando: 'Cargando lo guardado…',
          guardado: 'Guardado en tu cuenta',
          guardando: 'Guardando…',
          error: 'No se pudo guardar; se reintentará con el próximo cambio',
          'demasiado-grande': 'No se guardó: la sesión supera 64 KB',
        }[o.estado];
  const trabajo = o.trabajo.length > 0 ? 'Tus trazos y notas a mano son solo de esta pantalla: aún no se guardan.' : null;
  return { principal, trabajo };
}
