import { cloudflareTest } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

// PR-INF-01 (parte local): el Worker real (src/worker.ts, wrangler.jsonc) se ejecuta en workerd mediante Miniflare.
// Usa el PostgreSQL de Docker Compose a través del wsproxy de Neon. Sin cuenta de Cloudflare ni credenciales reales.
export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: './wrangler.jsonc' },
      miniflare: {
        bindings: {
          ENTORNO: 'ci',
          AUTH_URL: 'http://localhost',
          AUTH_SECRET: 'secreto-solo-para-pruebas-en-workerd-0123456789',
        },
      },
    }),
  ],
  test: {
    name: 'workers',
    include: ['tests-workers/**/*.test.ts'],
    testTimeout: 60_000,
  },
});
