import { z } from 'zod';
import { ErrorAplicacion } from '../../../shared/errores';
import { hashContenido } from '../../../shared/bd/mensajeria';
import {
  exigirFuentesSolicitadas,
  type FuentesAutorizadasPort,
  type PreparacionRepositorio,
} from '../dominio/preparacion';

const Codigo = z.string().regex(/^[A-Z0-9][A-Z0-9_-]{0,59}$/);
export const DefinirObjetivoRequest = z
  .strictObject({
    fuente: z.enum(['PERSONAL', 'FUENTES']),
    fechaObjetivo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    minutosSemanales: z.number().int().min(15).max(1680),
    temas: z
      .array(
        z.strictObject({
          areaCodigo: Codigo,
          temaCodigo: Codigo,
          titulo: z.string().trim().min(1).max(160),
        }),
      )
      .min(1)
      .max(10),
    fuentes: z.array(z.uuid()).max(10).default([]),
  })
  .superRefine((entrada, ctx) => {
    if (entrada.fuente === 'FUENTES' && entrada.fuentes.length === 0) {
      ctx.addIssue({ code: 'custom', path: ['fuentes'], message: 'Selecciona al menos una fuente.' });
    }
    if (new Set(entrada.temas.map((tema) => tema.temaCodigo)).size !== entrada.temas.length) {
      ctx.addIssue({ code: 'custom', path: ['temas'], message: 'Los códigos de tema deben ser únicos.' });
    }
    if (new Set(entrada.fuentes).size !== entrada.fuentes.length) {
      ctx.addIssue({ code: 'custom', path: ['fuentes'], message: 'No repitas fuentes.' });
    }
  });

type Dependencias = {
  repo: PreparacionRepositorio;
  fuentesAutorizadas: FuentesAutorizadasPort;
  ahora: () => Date;
};

function formatoFecha(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function diasEntre(inicio: string, fin: string): number {
  return Math.round((Date.parse(`${fin}T00:00:00.000Z`) - Date.parse(`${inicio}T00:00:00.000Z`)) / 86_400_000);
}

export function crearDefinirObjetivo({ repo, fuentesAutorizadas, ahora }: Dependencias) {
  return async (actorId: string, operationKey: string, entradaDesconocida: unknown) => {
    const entrada = DefinirObjetivoRequest.parse(entradaDesconocida);
    const ahoraActual = ahora();
    const hoy = formatoFecha(ahoraActual);
    const fechaObjetivo = entrada.fechaObjetivo ?? undefined;
    if (fechaObjetivo) {
      const fechaParseada = new Date(`${fechaObjetivo}T00:00:00.000Z`);
      const diasRestantes = diasEntre(hoy, fechaObjetivo);
      if (
        Number.isNaN(fechaParseada.getTime()) ||
        formatoFecha(fechaParseada) !== fechaObjetivo ||
        diasRestantes < 1
      ) {
        throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La fecha del examen debe ser posterior a hoy.');
      }
    }

    const autorizadas = entrada.fuentes.length
      ? exigirFuentesSolicitadas(entrada.fuentes, await fuentesAutorizadas(actorId, { contentIds: entrada.fuentes }))
      : [];
    const hashEntrada = {
      fuente: entrada.fuente,
      fechaObjetivo: fechaObjetivo ?? null,
      minutosSemanales: entrada.minutosSemanales,
      temas: entrada.temas,
      fuentes: autorizadas,
    };
    const hash = await hashContenido(JSON.stringify(hashEntrada));
    const resultado = await repo.crearObjetivo(
      {
        actorId,
        operationKey,
        fuente: entrada.fuente,
        ...(fechaObjetivo ? { fechaObjetivo } : {}),
        minutosSemanales: entrada.minutosSemanales,
        temas: entrada.temas,
        fuentes: autorizadas,
        ahora: ahoraActual,
      },
      hash,
    );
    return resultado;
  };
}

export function crearConsultarPlan({ repo }: Pick<Dependencias, 'repo'>) {
  return (actorId: string) => repo.obtenerPlanVigente(actorId);
}

export function crearCompletarActividad({ repo, ahora }: Pick<Dependencias, 'repo' | 'ahora'>) {
  return (actorId: string, actividadId: string) => repo.completarActividad(actorId, actividadId, ahora());
}

export function crearConsultarSeguimiento({ repo }: Pick<Dependencias, 'repo'>) {
  return async (actorId: string) => {
    const actual = await repo.obtenerPlanVigente(actorId);
    if (!actual) return { objetivo: null, total: 0, completadas: 0, porcentaje: 0, areas: [] };
    const areas = new Map<string, { total: number; completadas: number }>();
    for (const actividad of actual.plan.actividades) {
      const area = areas.get(actividad.areaCodigo) ?? { total: 0, completadas: 0 };
      area.total++;
      if (actividad.estado === 'COMPLETADA') area.completadas++;
      areas.set(actividad.areaCodigo, area);
    }
    const total = actual.plan.actividades.length;
    const completadas = actual.plan.actividades.filter((actividad) => actividad.estado === 'COMPLETADA').length;
    return {
      objetivo: actual.objetivo,
      total,
      completadas,
      porcentaje: total === 0 ? 0 : Math.round((completadas / total) * 100),
      areas: [...areas].map(([areaCodigo, progreso]) => ({
        areaCodigo,
        ...progreso,
        porcentaje: progreso.total === 0 ? 0 : Math.round((progreso.completadas / progreso.total) * 100),
      })),
    };
  };
}
