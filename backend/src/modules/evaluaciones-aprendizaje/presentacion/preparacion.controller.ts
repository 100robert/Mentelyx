import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Fallo, exito } from '@mentelyx/contratos';
import { CabeceraIdempotencia, ganchoValidacion, responderOk, type VariablesBase } from '../../../shared/http';
import { exigirActor, exigirClaveIdempotencia, type ResolverActor } from '../../../shared/sesion';
import { DefinirObjetivoRequest } from '../aplicacion/preparacion.use-cases';
import type { ActividadPreparacion } from '../dominio/preparacion';

type Casos = {
  definirObjetivo: (actorId: string, operationKey: string, entrada: unknown) => Promise<{ resultado: unknown; repetida: boolean }>;
  consultarPlan: (actorId: string) => Promise<unknown>;
  completarActividad: (actorId: string, actividadId: string) => Promise<ActividadPreparacion>;
  consultarSeguimiento: (actorId: string) => Promise<unknown>;
};

const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const Fallos = {
  400: { description: 'Entrada inválida', ...json(Fallo) },
  401: { description: 'Sesión requerida', ...json(Fallo) },
  404: { description: 'Recurso no disponible para esta cuenta', ...json(Fallo) },
};

const Actividad = z.object({
  id: z.uuid(),
  orden: z.number().int(),
  areaCodigo: z.string(),
  temaCodigo: z.string(),
  titulo: z.string(),
  tipo: z.enum(['LECCION', 'PRACTICA', 'SIMULACRO', 'REPASO']),
  fechaLimite: z.string().nullable(),
  minutosEstimados: z.number().int(),
  estado: z.enum(['PENDIENTE', 'COMPLETADA', 'OMITIDA']),
  completadaEn: z.string().nullable(),
});
const Preparacion = z.object({
  objetivo: z.object({
    id: z.uuid(),
    fuente: z.enum(['PERSONAL', 'FUENTES']),
    fechaObjetivo: z.string().nullable(),
    minutosSemanales: z.number().int(),
  }),
  plan: z.object({
    id: z.uuid(),
    version: z.number().int(),
    reglaVersion: z.string(),
    actividades: z.array(Actividad),
  }),
});
const ActividadId = z.object({ actividadId: z.uuid() });

const rutas = {
  definirObjetivo: createRoute({
    method: 'post',
    path: '/preparacion/objetivos',
    request: {
      headers: CabeceraIdempotencia,
      body: { ...json(DefinirObjetivoRequest), required: true },
    },
    responses: {
      201: { description: 'Objetivo y plan determinista creados', ...json(exito(z.object({ preparacion: Preparacion, repetida: z.literal(false) }))) },
      200: { description: 'Reintento idempotente del objetivo', ...json(exito(z.object({ preparacion: Preparacion, repetida: z.literal(true) }))) },
      ...Fallos,
      422: { description: 'Clave de idempotencia reutilizada con otra entrada', ...json(Fallo) },
    },
  }),
  consultarPlan: createRoute({
    method: 'get',
    path: '/preparacion/plan',
    responses: { 200: { description: 'Plan vigente, o null si aún no hay objetivo', ...json(exito(Preparacion.nullable())) }, 401: Fallos[401] },
  }),
  completarActividad: createRoute({
    method: 'post',
    path: '/preparacion/plan/actividades/{actividadId}/completar',
    request: { params: ActividadId },
    responses: {
      200: { description: 'Actividad completada; la operación es idempotente', ...json(exito(Actividad)) },
      ...Fallos,
    },
  }),
  consultarSeguimiento: createRoute({
    method: 'get',
    path: '/preparacion/seguimiento',
    responses: {
      200: {
        description: 'Avance observable del plan, no predicción de rendimiento',
        ...json(
          exito(
            z.object({
              objetivo: Preparacion.shape.objetivo.nullable(),
              total: z.number().int(),
              completadas: z.number().int(),
              porcentaje: z.number().int(),
              areas: z.array(z.object({ areaCodigo: z.string(), total: z.number().int(), completadas: z.number().int(), porcentaje: z.number().int() })),
            }),
          ),
        ),
      },
      401: Fallos[401],
    },
  }),
};

export function crearRutasPreparacion(deps: { resolverActor: ResolverActor; casos: Casos }) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const actor = (c: { req: { raw: Request } }) => exigirActor(deps.resolverActor, c.req.raw.headers);
  const privado = (c: { header: (k: string, v: string) => void }) => c.header('Cache-Control', 'private, no-store');

  app.openapi(rutas.definirObjetivo, async (c) => {
    const resultado = await deps.casos.definirObjetivo(
      await actor(c),
      exigirClaveIdempotencia(c.req.raw.headers),
      c.req.valid('json'),
    );
    privado(c);
    return responderOk(c, { preparacion: resultado.resultado, repetida: resultado.repetida }, resultado.repetida ? 200 : 201) as never;
  });
  app.openapi(rutas.consultarPlan, async (c) => {
    const resultado = await deps.casos.consultarPlan(await actor(c));
    privado(c);
    return responderOk(c, resultado) as never;
  });
  app.openapi(rutas.completarActividad, async (c) => {
    const { actividadId } = c.req.valid('param');
    const resultado = await deps.casos.completarActividad(await actor(c), actividadId);
    privado(c);
    return responderOk(c, resultado) as never;
  });
  app.openapi(rutas.consultarSeguimiento, async (c) => {
    const resultado = await deps.casos.consultarSeguimiento(await actor(c));
    privado(c);
    return responderOk(c, resultado) as never;
  });
  return app;
}
