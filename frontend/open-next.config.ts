import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache';
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue';

// Caché incremental en R2 (solo contenido público: SSG/ISR) y revalidación ISR con la cola en memoria, que usa el
// service binding WORKER_SELF_REFERENCE. Las páginas autenticadas son dinámicas y nunca entran en esta caché.
export default {
  ...defineCloudflareConfig({ incrementalCache: r2IncrementalCache, queue: memoryQueue }),
  // Binario de Next.js directo: el build no depende de que `pnpm` esté en el PATH (Windows con corepack, CI).
  buildCommand: 'node node_modules/next/dist/bin/next build',
};
