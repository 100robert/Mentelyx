import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { CrearEspacioRequest, Espacio, EspacioDetalle, Fallo, RegistrarFuenteTextoRequest, SeleccionarFuenteRequest, exito } from '@mentelyx/contratos';
import { CabeceraIdempotencia, ganchoValidacion, responderOk, type VariablesBase } from '../../../shared/http';
import { exigirActor, exigirClaveIdempotencia, type ResolverActor } from '../../../shared/sesion';

type CasosDeUso = {
  crear: (actorId: string, entrada: unknown) => Promise<unknown>;
  listar: (actorId: string) => Promise<unknown>;
  obtener: (actorId: string, espacioId: string) => Promise<unknown>;
  registrarFuente: (actorId: string, espacioId: string, clave: string, entrada: unknown) => Promise<{ contentId: string; repetida: boolean }>;
  seleccionarFuente: (actorId: string, espacioId: string, contentId: string, entrada: unknown) => Promise<unknown>;
};

const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const errores = { 400: { description: 'Entrada inválida', ...json(Fallo) }, 401: { description: 'Sin sesión', ...json(Fallo) }, 404: { description: 'No encontrado', ...json(Fallo) } };
const IdEspacio = z.object({ id: z.uuid() });

const rutas = {
  crear: createRoute({ method: 'post', path: '/espacios', request: { body: { ...json(CrearEspacioRequest), required: true } }, responses: { 201: { description: 'Espacio creado', ...json(exito(Espacio)) }, ...errores } }),
  listar: createRoute({ method: 'get', path: '/espacios', responses: { 200: { description: 'Espacios del actor', ...json(exito(z.array(Espacio))) }, ...errores } }),
  obtener: createRoute({ method: 'get', path: '/espacios/{id}', request: { params: IdEspacio }, responses: { 200: { description: 'Detalle con fuentes', ...json(exito(EspacioDetalle)) }, ...errores } }),
  fuente: createRoute({
    method: 'post',
    path: '/espacios/{id}/fuentes',
    request: { params: IdEspacio, headers: CabeceraIdempotencia, body: { ...json(RegistrarFuenteTextoRequest), required: true } },
    responses: { 202: { description: 'Fuente registrada; la lectura (indexación) continúa en segundo plano', ...json(exito(z.object({ contentId: z.uuid(), repetida: z.boolean() }))) }, ...errores, 429: { description: 'Almacenamiento agotado', ...json(Fallo) } },
  }),
  seleccionar: createRoute({
    method: 'patch',
    path: '/espacios/{id}/fuentes/{contentId}',
    request: { params: z.object({ id: z.uuid(), contentId: z.uuid() }), body: { ...json(SeleccionarFuenteRequest), required: true } },
    responses: { 200: { description: 'Selección actualizada', ...json(exito(z.object({ contentId: z.uuid(), seleccionada: z.boolean() }))) }, ...errores },
  }),
};

export function crearRutasEspacios(deps: { resolverActor: ResolverActor; casos: CasosDeUso; trasRegistrarFuente: () => void }) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const actor = (c: { req: { raw: Request } }) => exigirActor(deps.resolverActor, c.req.raw.headers);
  const privado = (c: { header: (k: string, v: string) => void }) => c.header('Cache-Control', 'private, no-store');

  app.openapi(rutas.crear, async (c) => {
    const r = await deps.casos.crear(await actor(c), c.req.valid('json'));
    privado(c);
    return responderOk(c, r, 201) as never;
  });
  app.openapi(rutas.listar, async (c) => {
    const r = await deps.casos.listar(await actor(c));
    privado(c);
    return responderOk(c, r) as never;
  });
  app.openapi(rutas.obtener, async (c) => {
    const r = await deps.casos.obtener(await actor(c), c.req.valid('param').id);
    privado(c);
    return responderOk(c, r) as never;
  });
  app.openapi(rutas.fuente, async (c) => {
    const actorId = await actor(c);
    const clave = exigirClaveIdempotencia(c.req.raw.headers);
    const r = await deps.casos.registrarFuente(actorId, c.req.valid('param').id, clave, c.req.valid('json'));
    deps.trasRegistrarFuente();
    privado(c);
    return responderOk(c, r, 202) as never;
  });
  app.openapi(rutas.seleccionar, async (c) => {
    const { id, contentId } = c.req.valid('param');
    const r = await deps.casos.seleccionarFuente(await actor(c), id, contentId, c.req.valid('json'));
    privado(c);
    return responderOk(c, r) as never;
  });
  return app;
}
