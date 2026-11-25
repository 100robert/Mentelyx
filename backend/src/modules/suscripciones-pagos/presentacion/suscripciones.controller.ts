import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { DerechosDelPeriodo, Fallo, exito } from '@mentelyx/contratos';
import { ganchoValidacion, responderFallo, responderOk, type VariablesBase } from '../../../shared/http';
import type { ResolverActor } from '../../../shared/sesion';

const rutaDerechos = createRoute({
  method: 'get',
  path: '/suscripciones/me/derechos',
  summary: 'Recursos del periodo vigente por categoría (M5)',
  responses: {
    200: { description: 'Recursos del periodo', content: { 'application/json': { schema: exito(DerechosDelPeriodo) } } },
    401: { description: 'Sin sesión', content: { 'application/json': { schema: Fallo } } },
    404: { description: 'Sin periodo vigente', content: { 'application/json': { schema: Fallo } } },
  },
});

export function crearRutasSuscripciones(deps: {
  resolverActor: ResolverActor;
  consultarDerechos: (actorId: string) => Promise<DerechosDelPeriodo | null>;
}) {
  const rutas = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  rutas.openapi(rutaDerechos, async (c) => {
    const actor = await deps.resolverActor(c.req.raw.headers);
    if (!actor) return responderFallo(c, 'NO_AUTENTICADO', 'Inicia sesión para continuar.') as never;
    const derechos = await deps.consultarDerechos(actor.actorId);
    if (!derechos) return responderFallo(c, 'RECURSO_NO_ENCONTRADO', 'No hay un periodo de recursos vigente.') as never;
    c.header('Cache-Control', 'private, no-store');
    return responderOk(c, derechos) as never;
  });
  return rutas;
}
