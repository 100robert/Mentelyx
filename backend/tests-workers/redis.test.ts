import { describe, expect, it } from 'vitest';

// PR-INF-01: Redis REST (Upstash) dentro de workerd. Datos sintéticos.
// MongoDB NO se prueba aquí: bajo el pool de Vitest el driver entra en recursión infinita al cargar `bson`
// (interoperabilidad CJS del arnés). Con el empaquetador real de Wrangler sí funciona: ver
// tests-workers/fixtures/mongo-worker.ts y la prueba de extremo a extremo de la API en `wrangler dev`.
describe('PR-INF-01 · Redis en workerd', () => {
  it('Redis REST (Upstash) por fetch: SET/GET con expiración', async () => {
    const { Redis } = await import('@upstash/redis/cloudflare');
    const redis = new Redis({ url: 'http://127.0.0.1:8079', token: 'token_local_mentelyx' });
    const clave = `prinf01:${crypto.randomUUID()}`;
    await redis.set(clave, 'ok', { ex: 30 });
    expect(await redis.get(clave)).toBe('ok');
    expect(await redis.ttl(clave)).toBeGreaterThan(0);
  });
});
