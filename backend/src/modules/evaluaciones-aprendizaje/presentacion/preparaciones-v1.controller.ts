import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Fallo, exito } from '@mentelyx/contratos';
import { CabeceraIdempotencia, ganchoValidacion, responderOk, type VariablesBase } from '../../../shared/http';
import { exigirActor, exigirClaveIdempotencia, type ResolverActor } from '../../../shared/sesion';
import {
  AgregarPreguntasRequest,
  ArchivarRequest,
  CrearIntentoRequest,
  CrearPreparacionRequest,
  CrearTarjetaRequest,
  GuardarRespuestaRequest,
  RevisarTarjetaRequest,
  TemarioRequest,
  type CasosPreparacionesV1,
} from '../aplicacion/preparaciones-v1.use-cases';

/**
 * Rutas V1 de preparación de exámenes (diseño de API, 12.2 y 12.9; ADR-093). Todas exigen sesión; la propiedad se
 * comprueba en cada caso de uso y un recurso ajeno responde 404. Las operaciones que crean recursos exigen
 * `Idempotency-Key`. Las respuestas no incluyen soluciones antes del momento permitido (proyección de M3).
 */
const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const Fallos = {
  400: { description: 'Entrada inválida', ...json(Fallo) },
  401: { description: 'Sesión requerida', ...json(Fallo) },
  403: { description: 'Origen o CSRF inválido', ...json(Fallo) },
  404: { description: 'Recurso no disponible para esta cuenta', ...json(Fallo) },
};
const Datos = z.record(z.string(), z.unknown()).openapi({ description: 'Ver diseño de API, sección 12.9' });
const Lista = z.array(z.record(z.string(), z.unknown()));
const Id = z.object({ id: z.uuid() });

type Def = {
  method: 'get' | 'post' | 'put' | 'patch';
  path: string;
  params?: z.ZodObject;
  body?: z.ZodType;
  idem?: boolean;
  descripcion: string;
  respuesta?: z.ZodType;
  estado?: 200 | 201;
  extra?: Record<number, { description: string; content: { 'application/json': { schema: typeof Fallo } } }>;
};
const ruta = (d: Def) =>
  createRoute({
    method: d.method,
    path: d.path,
    request: {
      ...(d.params ? { params: d.params } : {}),
      ...(d.idem ? { headers: CabeceraIdempotencia } : {}),
      ...(d.body ? { body: { ...json(d.body), required: true } } : {}),
    },
    responses: { [d.estado ?? 200]: { description: d.descripcion, ...json(exito(d.respuesta ?? Datos)) }, ...Fallos, ...(d.extra ?? {}) },
  });

const conflicto = { 409: { description: 'Intento cerrado (entregado o vencido) o pregunta ya comprobada', ...json(Fallo) } };
const reutilizada = { 422: { description: 'Idempotency-Key reutilizada con otra entrada', ...json(Fallo) } };
const R = {
  listar: ruta({ method: 'get', path: '/preparaciones', descripcion: 'Preparaciones de la cuenta (varias; ADR-093)', respuesta: Lista }),
  crear: ruta({ method: 'post', path: '/preparaciones', body: CrearPreparacionRequest, idem: true, estado: 201, descripcion: 'Preparación creada con su plan determinista; ninguna otra se abandona', extra: reutilizada }),
  obtener: ruta({ method: 'get', path: '/preparaciones/{id}', params: Id, descripcion: 'Detalle de la preparación' }),
  archivar: ruta({ method: 'patch', path: '/preparaciones/{id}', params: Id, body: ArchivarRequest, descripcion: 'Archivar o restaurar' }),
  plan: ruta({ method: 'get', path: '/preparaciones/{id}/plan', params: Id, descripcion: 'Plan vigente de la preparación' }),
  temario: ruta({ method: 'put', path: '/preparaciones/{id}/temario', params: Id, body: TemarioRequest, descripcion: 'Temario editado: nueva versión del plan que conserva el avance de los temas que siguen' }),
  completar: ruta({
    method: 'post',
    path: '/preparaciones/{id}/plan/actividades/{actividadId}/completar',
    params: z.object({ id: z.uuid(), actividadId: z.uuid() }),
    descripcion: 'Actividad completada (idempotente)',
  }),
  seguimiento: ruta({ method: 'get', path: '/preparaciones/{id}/seguimiento', params: Id, descripcion: 'Avance del plan y rendimiento observado (sin dominio estimado)' }),
  resultados: ruta({ method: 'get', path: '/preparaciones/{id}/resultados', params: Id, descripcion: 'Rendimiento por tema e historial de intentos calificados' }),
  banco: ruta({ method: 'get', path: '/preparaciones/{id}/preguntas', params: Id, descripcion: 'Banco vigente (versión y proyección pública, sin soluciones)' }),
  agregarPreguntas: ruta({
    method: 'post',
    path: '/preparaciones/{id}/preguntas',
    params: Id,
    body: AgregarPreguntasRequest,
    idem: true,
    estado: 201,
    descripcion: 'Nueva versión del banco con las preguntas válidas (mentelyx.pregunta/v1 validado en el servidor)',
  }),
  crearIntento: ruta({ method: 'post', path: '/preparaciones/{id}/intentos', params: Id, body: CrearIntentoRequest, idem: true, estado: 201, descripcion: 'Intento iniciado con la hora del servidor', extra: reutilizada }),
  intentos: ruta({ method: 'get', path: '/preparaciones/{id}/intentos', params: Id, descripcion: 'Historial de intentos', respuesta: Lista }),
  intento: ruta({ method: 'get', path: '/intentos/{id}', params: Id, descripcion: 'Intento en curso (recuperable) o calificado con sus resultados' }),
  respuesta: ruta({
    method: 'put',
    path: '/intentos/{id}/respuestas/{preguntaId}',
    params: z.object({ id: z.uuid(), preguntaId: z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/) }),
    body: GuardarRespuestaRequest,
    descripcion: 'Respuesta guardada; en práctica, `comprobar` devuelve la corrección y la solución de esa pregunta',
    extra: conflicto,
  }),
  entrega: ruta({ method: 'post', path: '/intentos/{id}/entrega', params: Id, idem: true, descripcion: 'Calificación oficial en el servidor (única por intento)' }),
  tarjetas: ruta({ method: 'get', path: '/preparaciones/{id}/tarjetas', params: Id, descripcion: 'Tarjetas con la próxima revisión calculada por el servidor' }),
  crearTarjeta: ruta({ method: 'post', path: '/preparaciones/{id}/tarjetas', params: Id, body: CrearTarjetaRequest, idem: true, estado: 201, descripcion: 'Tarjeta creada' }),
  revisar: ruta({ method: 'post', path: '/tarjetas/{id}/revisiones', params: Id, body: RevisarTarjetaRequest, idem: true, descripcion: 'Revisión registrada (repetición espaciada sm2-mentelyx-v1)' }),
};

export function crearRutasPreparacionesV1(deps: { resolverActor: ResolverActor; casos: CasosPreparacionesV1 }) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const c$ = deps.casos;
  type Ctx = { req: { raw: Request; valid: (t: never) => never }; header: (k: string, v: string) => void };
  const actor = (c: Ctx) => exigirActor(deps.resolverActor, c.req.raw.headers);
  const clave = (c: Ctx) => exigirClaveIdempotencia(c.req.raw.headers);
  const ok = (c: Ctx, datos: unknown, estado: 200 | 201 = 200) => {
    c.header('Cache-Control', 'private, no-store');
    return responderOk(c as never, datos, estado) as never;
  };
  const p = (c: Ctx) => (c.req.valid as unknown as (t: 'param') => { id: string; actividadId?: string; preguntaId?: string })('param');
  const b = (c: Ctx) => (c.req.valid as unknown as (t: 'json') => unknown)('json');

  app.openapi(R.listar, async (c) => ok(c as never, await c$.listar(await actor(c as never))));
  app.openapi(R.crear, async (c) => {
    const r = await c$.crear(await actor(c as never), clave(c as never), b(c as never));
    return ok(c as never, { ...r.preparacion, repetida: r.repetida }, r.repetida ? 200 : 201);
  });
  app.openapi(R.obtener, async (c) => ok(c as never, await c$.obtener(await actor(c as never), p(c as never).id)));
  app.openapi(R.archivar, async (c) => ok(c as never, await c$.archivar(await actor(c as never), p(c as never).id, b(c as never))));
  app.openapi(R.plan, async (c) => ok(c as never, await c$.plan(await actor(c as never), p(c as never).id)));
  app.openapi(R.temario, async (c) => ok(c as never, await c$.temario(await actor(c as never), p(c as never).id, b(c as never))));
  app.openapi(R.completar, async (c) => {
    const { id, actividadId } = p(c as never);
    return ok(c as never, await c$.completarActividad(await actor(c as never), id, actividadId!));
  });
  app.openapi(R.seguimiento, async (c) => ok(c as never, await c$.seguimiento(await actor(c as never), p(c as never).id)));
  app.openapi(R.resultados, async (c) => ok(c as never, await c$.rendimiento(await actor(c as never), p(c as never).id)));
  app.openapi(R.banco, async (c) => ok(c as never, await c$.banco(await actor(c as never), p(c as never).id)));
  app.openapi(R.agregarPreguntas, async (c) => {
    const r = await c$.agregarPreguntas(await actor(c as never), p(c as never).id, clave(c as never), b(c as never));
    return ok(c as never, r, r.repetida ? 200 : 201);
  });
  app.openapi(R.crearIntento, async (c) => {
    const r = await c$.crearIntento(await actor(c as never), p(c as never).id, clave(c as never), b(c as never));
    return ok(c as never, r, r.repetido ? 200 : 201);
  });
  app.openapi(R.intentos, async (c) => ok(c as never, await c$.intentos(await actor(c as never), p(c as never).id)));
  app.openapi(R.intento, async (c) => ok(c as never, await c$.intento(await actor(c as never), p(c as never).id)));
  app.openapi(R.respuesta, async (c) => {
    const { id, preguntaId } = p(c as never);
    return ok(c as never, await c$.guardarRespuesta(await actor(c as never), id, preguntaId!, b(c as never)));
  });
  app.openapi(R.entrega, async (c) => ok(c as never, await c$.entregar(await actor(c as never), p(c as never).id, clave(c as never))));
  app.openapi(R.tarjetas, async (c) => ok(c as never, await c$.tarjetas(await actor(c as never), p(c as never).id)));
  app.openapi(R.crearTarjeta, async (c) => {
    const r = await c$.crearTarjeta(await actor(c as never), p(c as never).id, clave(c as never), b(c as never));
    return ok(c as never, r, r.repetida ? 200 : 201);
  });
  app.openapi(R.revisar, async (c) => ok(c as never, await c$.revisarTarjeta(await actor(c as never), p(c as never).id, clave(c as never), b(c as never))));
  return app;
}
