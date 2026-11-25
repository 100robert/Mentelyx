import { pgSchema } from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/** Esquema propietario de M3 con outbox e inbox base (SDD, sección 22, I-0). Las tablas de negocio llegan en I-5. */
export const m3Evaluations = pgSchema('m3_evaluations');

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m3Evaluations);
