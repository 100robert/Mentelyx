import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Fallo, exito } from '@mentelyx/contratos';
import { CabeceraIdempotencia, ganchoValidacion, responderOk, type VariablesBase } from '../../../shared/http';
import { exigirActor, exigirClaveIdempotencia, type ResolverActor } from '../../../shared/sesion';
import { CambiarCarpetaRequest, CrearCarpetaRequest, Modulo, MoverElementoRequest, type crearCasosCarpetas } from '../aplicacion/carpetas.use-cases';

const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const errores = {
  400: { description: 'Entrada inválida (módulo, profundidad o ciclo)', ...json(Fallo) },
  401: { description: 'Sin sesión', ...json(Fallo) },
  403: { description: 'Origen o CSRF inválido', ...json(Fallo) },
  404: { description: 'No encontrada (o de otra cuenta)', ...json(Fallo) },
};
const Carpeta = z.object({ id: z.uuid(), modulo: Modulo, nombre: z.string(), padreId: z.uuid().nullable(), estado: z.enum(['ACTIVA', 'ARCHIVADA']), elementos: z.number().int(), actualizadaEn: z.string() });
const Elemento = z.object({ id: z.uuid(), tipo: z.enum(['TEMA', 'SESION', 'PREPARACION']), titulo: z.string(), carpetaId: z.uuid().nullable(), actualizadoEn: z.string() });
const Id = z.object({ id: z.uuid() });
const duplicado = { 409: { description: 'Nombre repetido entre hermanas (NOMBRE_DUPLICADO)', ...json(Fallo) } };

const rutas = {
  listar: createRoute({
    method: 'get',
    path: '/carpetas',
    request: { query: z.object({ modulo: Modulo, estado: z.enum(['ACTIVA', 'ARCHIVADA']).default('ACTIVA') }) },
    responses: { 200: { description: 'Árbol plano de carpetas del módulo', ...json(exito(z.array(Carpeta))) }, ...errores },
  }),
  crear: createRoute({
    method: 'post',
    path: '/carpetas',
    request: { headers: CabeceraIdempotencia, body: { ...json(CrearCarpetaRequest), required: true } },
    responses: { 201: { description: 'Carpeta creada', ...json(exito(Carpeta)) }, ...errores, ...duplicado },
  }),
  cambiar: createRoute({
    method: 'patch',
    path: '/carpetas/{id}',
    request: { params: Id, body: { ...json(CambiarCarpetaRequest), required: true } },
    responses: { 200: { description: 'Renombrada, movida o archivada', ...json(exito(Carpeta)) }, ...errores, ...duplicado },
  }),
  eliminar: createRoute({
    method: 'delete',
    path: '/carpetas/{id}',
    request: { params: Id },
    responses: { 200: { description: 'Eliminada: subcarpetas y elementos pasan a la raíz del módulo', ...json(exito(z.object({}))) }, ...errores },
  }),
  elementos: createRoute({
    method: 'get',
    path: '/carpetas/{id}/elementos',
    request: { params: Id },
    responses: { 200: { description: 'Elementos de la carpeta', ...json(exito(z.array(Elemento))) }, ...errores },
  }),
  mover: createRoute({
    method: 'put',
    path: '/carpetas/{id}/elementos/{elementoId}',
    request: { params: z.object({ id: z.uuid(), elementoId: z.uuid() }), body: { ...json(MoverElementoRequest), required: true } },
    responses: { 200: { description: 'Elemento ubicado en la carpeta', ...json(exito(Elemento)) }, ...errores },
  }),
};

/** Carpetas por módulo (API 12.1). `DELETE` responde 200 con `{}` (envoltorio común) para el cliente actual. */
export function crearRutasCarpetas(deps: { resolverActor: ResolverActor; casos: ReturnType<typeof crearCasosCarpetas> }) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const actor = (c: { req: { raw: Request } }) => exigirActor(deps.resolverActor, c.req.raw.headers);
  const ok = <T>(c: { header: (k: string, v: string) => void }, datos: T, estado: 200 | 201 = 200) => {
    c.header('Cache-Control', 'private, no-store');
    return responderOk(c as never, datos, estado) as never;
  };
  app.openapi(rutas.listar, async (c) => {
    const q = c.req.valid('query');
    return ok(c, await deps.casos.listar(await actor(c), q.modulo, q.estado));
  });
  app.openapi(rutas.crear, async (c) => {
    const r = await deps.casos.crear(await actor(c), exigirClaveIdempotencia(c.req.raw.headers), c.req.valid('json'));
    return ok(c, r.carpeta, r.repetida ? 200 : 201);
  });
  app.openapi(rutas.cambiar, async (c) => ok(c, await deps.casos.cambiar(await actor(c), c.req.valid('param').id, c.req.valid('json'))));
  app.openapi(rutas.eliminar, async (c) => ok(c, await deps.casos.eliminar(await actor(c), c.req.valid('param').id)));
  app.openapi(rutas.elementos, async (c) => ok(c, await deps.casos.elementos(await actor(c), c.req.valid('param').id)));
  app.openapi(rutas.mover, async (c) => {
    const { id, elementoId } = c.req.valid('param');
    return ok(c, await deps.casos.moverElemento(await actor(c), id, elementoId, c.req.valid('json')));
  });
  return app;
}
