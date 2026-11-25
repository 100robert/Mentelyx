import { pgSchema } from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/** Esquema propietario de M4 con outbox e inbox base (SDD, sección 22, I-0). Las tablas de negocio llegan en I-7. */
export const m4Classes = pgSchema('m4_classes');

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m4Classes);
