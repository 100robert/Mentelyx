import { apiServidor } from '@/lib/api-servidor';
import { ejemploPorId } from '../ejemplo/datos';
import { desdeListaMultiple, desdePlanUnico, temaDeActividad, type ActividadApi, type PreparacionMultipleApi, type PreparacionUnicaApi, type PreparacionVista } from '../preparaciones/modelo';

/**
 * Carga una preparación en el servidor (SSR sin caché compartida): un ejemplo ilustrativo, una del contrato de varias
 * preparaciones (12.2) o la vigente del backend actual si su identificador coincide. `null` si no es de la cuenta.
 */
export async function cargarPreparacionServidor(id: string): Promise<PreparacionVista | null> {
  const ejemplo = ejemploPorId(id);
  if (ejemplo) return ejemplo.preparacion;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const detalle = await apiServidor<PreparacionMultipleApi>(`/preparaciones/${encodeURIComponent(id)}`);
  if (detalle.datos) {
    const plan = await apiServidor<{ reglaVersion: string; actividades: ActividadApi[] }>(`/preparaciones/${encodeURIComponent(id)}/plan`);
    const base = desdeListaMultiple(detalle.datos);
    const actividades = [...(plan.datos?.actividades ?? [])].sort((a, b) => a.orden - b.orden);
    const temas = [...new Map(actividades.map((a) => [a.temaCodigo, { codigo: a.temaCodigo, titulo: temaDeActividad(a.titulo), origen: 'persona' as const }])).values()];
    return { ...base, actividades, temas, reglaPlan: plan.datos?.reglaVersion ?? null };
  }
  const vigente = await apiServidor<PreparacionUnicaApi | null>('/preparacion/plan');
  if (vigente.datos && vigente.datos.objetivo.id === id) return desdePlanUnico(vigente.datos);
  return null;
}
