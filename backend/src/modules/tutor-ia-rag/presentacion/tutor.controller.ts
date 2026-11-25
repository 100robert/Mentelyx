import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { ConsultaTutorRequest, ConversacionDetalle, ConversacionResumen, CrearConversacionRequest, Fallo, RespuestaTutor, exito } from '@mentelyx/contratos';
import { CabeceraIdempotencia, ganchoValidacion, responderOk, type VariablesBase } from '../../../shared/http';
import { exigirActor, exigirClaveIdempotencia, type ResolverActor } from '../../../shared/sesion';

type CasosDeUso = {
  crearConversacion: (actorId: string, entrada: unknown) => Promise<unknown>;
  listarConversaciones: (actorId: string) => Promise<unknown>;
  obtenerConversacion: (actorId: string, id: string) => Promise<unknown>;
  eliminarConversacion: (actorId: string, id: string) => Promise<unknown>;
  responderConsulta: (actorId: string, clave: string, entrada: unknown) => Promise<unknown>;
};

const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const errores = { 400: { description: 'Entrada inválida', ...json(Fallo) }, 401: { description: 'Sin sesión', ...json(Fallo) }, 404: { description: 'No encontrado', ...json(Fallo) } };
const Id = z.object({ id: z.uuid() });
const base = '/tutor-ia';

const rutas = {
  crear: createRoute({ method: 'post', path: `${base}/conversaciones`, request: { body: { ...json(CrearConversacionRequest), required: true } }, responses: { 201: { description: 'Conversación creada', ...json(exito(ConversacionResumen)) }, ...errores } }),
  listar: createRoute({ method: 'get', path: `${base}/conversaciones`, responses: { 200: { description: 'Conversaciones vigentes', ...json(exito(z.array(ConversacionResumen))) }, ...errores } }),
  obtener: createRoute({ method: 'get', path: `${base}/conversaciones/{id}`, request: { params: Id }, responses: { 200: { description: 'Mensajes y citas', ...json(exito(ConversacionDetalle)) }, ...errores } }),
  eliminar: createRoute({ method: 'delete', path: `${base}/conversaciones/{id}`, request: { params: Id }, responses: { 200: { description: 'Eliminada', ...json(exito(z.object({ eliminada: z.boolean() }))) }, ...errores } }),
  consulta: createRoute({
    method: 'post',
    path: `${base}/consultas`,
    request: { headers: CabeceraIdempotencia, body: { ...json(ConsultaTutorRequest), required: true } },
    responses: {
      200: { description: 'Respuesta del Tutor (JSON; SSE en I-2): FUNDAMENTADA con citas, MIXTA, GENERAL, SIN_CONTEXTO o PARCIAL', ...json(exito(RespuestaTutor)) },
      ...errores,
      409: { description: 'Operación en curso', ...json(Fallo) },
      422: { description: 'Clave reutilizada con otra consulta', ...json(Fallo) },
      429: { description: 'CUOTA_AGOTADA, PRESUPUESTO_OPERACION_EXCEDIDO o LIMITE_TASA (6/min y 1 simultánea, con Retry-After)', ...json(Fallo) },
      503: { description: 'PROVEEDOR_NO_DISPONIBLE (Workers AI) o SERVICIO_NO_DISPONIBLE (verificación de fuentes)', ...json(Fallo) },
    },
  }),
};

export function crearRutasTutor(deps: { resolverActor: ResolverActor; casos: CasosDeUso }) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const actor = (c: { req: { raw: Request } }) => exigirActor(deps.resolverActor, c.req.raw.headers);
  const privado = (c: { header: (k: string, v: string) => void }) => c.header('Cache-Control', 'private, no-store');

  app.openapi(rutas.crear, async (c) => {
    const r = await deps.casos.crearConversacion(await actor(c), c.req.valid('json'));
    privado(c);
    return responderOk(c, r, 201) as never;
  });
  app.openapi(rutas.listar, async (c) => {
    const r = await deps.casos.listarConversaciones(await actor(c));
    privado(c);
    return responderOk(c, r) as never;
  });
  app.openapi(rutas.obtener, async (c) => {
    const r = await deps.casos.obtenerConversacion(await actor(c), c.req.valid('param').id);
    privado(c);
    return responderOk(c, r) as never;
  });
  app.openapi(rutas.eliminar, async (c) => {
    const r = await deps.casos.eliminarConversacion(await actor(c), c.req.valid('param').id);
    privado(c);
    return responderOk(c, r) as never;
  });
  app.openapi(rutas.consulta, async (c) => {
    const actorId = await actor(c);
    const clave = exigirClaveIdempotencia(c.req.raw.headers);
    const r = await deps.casos.responderConsulta(actorId, clave, c.req.valid('json'));
    privado(c);
    return responderOk(c, r) as never;
  });
  return app;
}
