import { z } from 'zod';

// ADR-073 y API, sección 1, punto 7: Workers prohíbe generar código en tiempo de ejecución,
// por eso Zod se configura sin JIT (sin `new Function`) antes de declarar cualquier esquema.
z.config({ jitless: true });

export { z };
