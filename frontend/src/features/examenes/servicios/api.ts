import { apiCliente, ErrorApi, nuevaClave } from '@/lib/api-cliente';
import { desdeListaMultiple, desdePlanUnico, solicitudObjetivo, solicitudPreparacion, type Borrador, type PreparacionMultipleApi, type PreparacionUnicaApi, type PreparacionVista } from '../preparaciones/modelo';

/**
 * Acceso a la API de preparaciones. Primero se intenta el contrato propuesto de varias preparaciones (12.2); si la
 * colección responde 404, se usa el backend actual de una preparación por cuenta. Si tampoco existe, el servicio no
 * está disponible y la interfaz lo dice. No hay datos simulados.
 */
export type ModoServicio = 'multiple' | 'unica' | 'no-disponible';
export type Seguimiento = { total: number; completadas: number; porcentaje: number; areas: Array<{ areaCodigo: string; total: number; completadas: number; porcentaje: number }> };

export const noExiste = (e: unknown) => e instanceof ErrorApi && e.estado === 404;

export async function cargarPreparaciones(): Promise<{ modo: ModoServicio; lista: PreparacionVista[] }> {
  try {
    const lista = await apiCliente<PreparacionMultipleApi[]>('/preparaciones');
    return { modo: 'multiple', lista: lista.map(desdeListaMultiple) };
  } catch (e) {
    if (!noExiste(e)) throw e;
  }
  try {
    const plan = await apiCliente<PreparacionUnicaApi | null>('/preparacion/plan');
    return { modo: 'unica', lista: plan ? [desdePlanUnico(plan)] : [] };
  } catch (e) {
    if (noExiste(e)) return { modo: 'no-disponible', lista: [] };
    throw e;
  }
}

/** Crea una preparación. En el backend actual reemplaza la vigente: la interfaz lo confirma antes de llamar. */
export async function crearPreparacion(b: Borrador, modo: ModoServicio, clave = nuevaClave()): Promise<PreparacionVista> {
  if (modo === 'multiple') {
    const p = await apiCliente<PreparacionMultipleApi>('/preparaciones', { metodo: 'POST', clave, cuerpo: solicitudPreparacion(b) });
    return desdeListaMultiple(p);
  }
  const r = await apiCliente<{ preparacion: PreparacionUnicaApi; repetida: boolean }>('/preparacion/objetivos', { metodo: 'POST', clave, cuerpo: solicitudObjetivo(b) });
  return desdePlanUnico(r.preparacion);
}

export function completarActividad(p: PreparacionVista, actividadId: string) {
  const ruta = p.modo === 'multiple' ? `/preparaciones/${encodeURIComponent(p.id)}/plan/actividades/${encodeURIComponent(actividadId)}/completar` : `/preparacion/plan/actividades/${encodeURIComponent(actividadId)}/completar`;
  return apiCliente<{ id: string; estado: string; completadaEn: string | null }>(ruta, { metodo: 'POST' });
}

export function cargarSeguimiento(p: PreparacionVista) {
  return apiCliente<Seguimiento>(p.modo === 'multiple' ? `/preparaciones/${encodeURIComponent(p.id)}/seguimiento` : '/preparacion/seguimiento');
}

/** Fuentes personales de la cuenta (agrupadas por tema), para elegir cuáles usa una preparación. */
export async function cargarFuentes(): Promise<Array<{ contentId: string; titulo: string; tema: string; lista: boolean }>> {
  const temas = await apiCliente<Array<{ id: string; titulo: string }>>('/espacios');
  const detalles = await Promise.all(temas.slice(0, 12).map((t) => apiCliente<{ titulo: string; listaFuentes: Array<{ contentId: string; titulo: string; estadoLectura: string }> }>(`/espacios/${encodeURIComponent(t.id)}`).catch(() => null)));
  return detalles.flatMap((d) => (d ? d.listaFuentes.map((f) => ({ contentId: f.contentId, titulo: f.titulo, tema: d.titulo, lista: f.estadoLectura === 'LISTA' })) : []));
}
