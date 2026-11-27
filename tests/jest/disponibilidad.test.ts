import { Hono } from 'hono';
import { esFalloDeDependencia, manejarErrores } from '../../backend/src/shared/http';

/**
 * EQ-20 (AC-02/AC-06): con PostgreSQL o MongoDB caídos, la API responde 503 SERVICIO_NO_DISPONIBLE (recuperable, con
 * Retry-After) sin confirmar nada. Hallazgo de la prueba de carga del 27/11/2026: antes respondía 500 ERROR_INTERNO.
 */
const app = (error: unknown) => {
  const a = new Hono();
  a.onError(manejarErrores);
  a.get('/x', () => {
    throw error;
  });
  return a;
};
const conCausa = (mensaje: string, cause: unknown) => Object.assign(new Error(mensaje), { name: 'DrizzleQueryError', cause });

describe('EQ-20 · dependencia de datos no disponible', () => {
  it.each([
    ['MongoServerSelectionError', Object.assign(new Error('Server selection timed out'), { name: 'MongoServerSelectionError' })],
    ['red perdida en workerd', new Error('Uncaught Error: Network connection lost.')],
    ['consulta Drizzle con causa de conexión', conCausa('Failed query: select …', new Error('connect ECONNREFUSED 127.0.0.1:5432'))],
    ['PostgreSQL sin conexiones libres (53300)', Object.assign(new Error('sorry, too many clients already'), { code: '53300' })],
  ])('%s → 503 recuperable con Retry-After', async (_n, error) => {
    const r = await app(error).request('/x');
    expect(r.status).toBe(503);
    expect(r.headers.get('retry-after')).toBe('5');
    expect(await r.json()).toMatchObject({ ok: false, error: { code: 'SERVICIO_NO_DISPONIBLE', recuperable: true } });
  });

  it('un error de programación sigue siendo 500 y no se confunde con una caída', async () => {
    expect(esFalloDeDependencia(new TypeError('x is undefined'))).toBe(false);
    expect((await app(new TypeError('x is undefined')).request('/x')).status).toBe(500);
  });
});
