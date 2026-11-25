import { pgSchema } from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/** Esquema propietario de M7 con outbox e inbox base (SDD, sección 22, I-0). Las tablas de negocio llegan en I-7. */
export const m7Advertising = pgSchema('m7_advertising');

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m7Advertising);
