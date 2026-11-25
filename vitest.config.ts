import { defineConfig } from 'vitest/config';

/**
 * Proyectos de prueba (estrategia de pruebas, sección 1):
 * - unitarias: reglas puras y contratos, sin servicios externos;
 * - arquitectura: ARQ-01 con ESLint;
 * - integracion: PostgreSQL de Docker Compose a través del driver serverless de Neon (requiere `pnpm db:up` y migraciones).
 * Las pruebas en el runtime de Workers (PR-INF-01) usan backend/vitest.workers.config.ts.
 */
const entornoIntegracion = {
  DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://mentelyx:mentelyx_local@127.0.0.1:55432/mentelyx',
  NEON_WS_PROXY: process.env.NEON_WS_PROXY ?? '127.0.0.1:5488',
  MONGODB_URL: process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:57017',
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL ?? 'http://127.0.0.1:8079',
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN ?? 'token_local_mentelyx',
};

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unitarias',
          include: ['packages/*/tests/**/*.test.ts', 'backend/src/**/tests/**/*.unit.test.ts'],
          environment: 'node',
        },
      },
      {
        test: { name: 'arquitectura', include: ['tests/arquitectura/**/*.test.ts'], environment: 'node', testTimeout: 60_000 },
      },
      {
        test: {
          name: 'integracion',
          include: ['backend/src/**/tests/**/*.integration.test.ts', 'tests/integracion/**/*.test.ts'],
          environment: 'node',
          env: entornoIntegracion,
          testTimeout: 60_000,
          hookTimeout: 60_000,
          fileParallelism: false,
        },
      },
    ],
  },
});
