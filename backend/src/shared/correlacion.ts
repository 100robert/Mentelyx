import type { MiddlewareHandler } from 'hono';
import { routePath } from 'hono/route';
import { registrar } from './registro';

const ID_VALIDO = /^[A-Za-z0-9_-]{8,64}$/;

/** Asigna `requestId` (o respeta uno entrante válido), lo devuelve en `X-Request-Id` y registra la petición sin PII. */
export const correlacion = (): MiddlewareHandler => async (c, next) => {
  const entrante = c.req.header('x-request-id');
  const requestId = entrante && ID_VALIDO.test(entrante) ? entrante : `req_${crypto.randomUUID().replaceAll('-', '')}`;
  c.set('requestId', requestId);
  const inicio = Date.now();
  await next();
  c.header('X-Request-Id', requestId);
  registrar('info', 'peticion', { requestId, metodo: c.req.method, ruta: routePath(c), estado: c.res.status, ms: Date.now() - inicio });
};
