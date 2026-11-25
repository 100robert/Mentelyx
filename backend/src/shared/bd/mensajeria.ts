import { and, eq, sql } from 'drizzle-orm';
import { bigint, char, check, index, integer, jsonb, primaryKey, text, timestamp, unique, uuid, type PgSchema } from 'drizzle-orm/pg-core';
import type { TxDrizzle } from './conexion';
import { ErrorAplicacion } from '../errores';

/**
 * Persistencia, sección 7.7: `outbox_events` e `inbox_events` en el esquema de CADA módulo productor o consumidor
 * (copia local por esquema, nunca una tabla compartida). Esta fábrica evita duplicar la definición.
 */
export function crearTablasMensajeria(esquema: PgSchema) {
  const outboxEvents = esquema.table(
    'outbox_events',
    {
      id: uuid('id').primaryKey().defaultRandom(),
      eventType: text('event_type').notNull(),
      aggregateId: uuid('aggregate_id').notNull(),
      aggregateVersion: bigint('aggregate_version', { mode: 'number' }).notNull(),
      payload: jsonb('payload').notNull(),
      status: text('status').notNull().default('PENDING'),
      attempts: integer('attempts').notNull().default(0),
      nextRetryAt: timestamp('next_retry_at', { withTimezone: true }).notNull().defaultNow(),
      publishedAt: timestamp('published_at', { withTimezone: true }),
      createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    },
    (t) => [
      unique('outbox_events_agregado_version_tipo_uq').on(t.aggregateId, t.aggregateVersion, t.eventType),
      index('outbox_events_pendientes_idx').on(t.nextRetryAt).where(sql`${t.status} = 'PENDING'`),
      check('outbox_events_status_ck', sql`${t.status} in ('PENDING', 'PUBLISHED', 'DEAD')`),
      check('outbox_events_attempts_ck', sql`${t.attempts} >= 0`),
    ],
  );

  const inboxEvents = esquema.table(
    'inbox_events',
    {
      source: text('source').notNull(),
      eventId: uuid('event_id').notNull(),
      payloadHash: char('payload_hash', { length: 64 }).notNull(),
      status: text('status').notNull().default('DONE'),
      receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
      processedAt: timestamp('processed_at', { withTimezone: true }),
    },
    (t) => [primaryKey({ columns: [t.source, t.eventId] }), check('inbox_events_status_ck', sql`${t.status} in ('DONE')`)],
  );

  return { outboxEvents, inboxEvents };
}

export type TablasMensajeria = ReturnType<typeof crearTablasMensajeria>;

export type EventoSaliente = {
  tipo: string;
  agregadoId: string;
  versionAgregado: number;
  payload: Record<string, unknown>;
};

/** Transactional Outbox: se escribe en la MISMA transacción que el efecto de negocio; la publicación es posterior. */
export async function registrarEnOutbox(tx: TxDrizzle, tablas: TablasMensajeria, evento: EventoSaliente): Promise<void> {
  await tx
    .insert(tablas.outboxEvents)
    .values({ eventType: evento.tipo, aggregateId: evento.agregadoId, aggregateVersion: evento.versionAgregado, payload: evento.payload })
    .onConflictDoNothing();
}

export async function hashContenido(payload: unknown): Promise<string> {
  const datos = new TextEncoder().encode(JSON.stringify(payload));
  const resumen = await crypto.subtle.digest('SHA-256', datos);
  return [...new Uint8Array(resumen)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type EventoEntrante = { source: string; eventId: string; payload: unknown };

/**
 * Idempotent Receiver: registra el evento y aplica el efecto en la misma transacción.
 * Repetido con el mismo contenido → no repite el efecto. Repetido con otro contenido → error (alerta), sin efecto.
 */
export async function procesarUnaVez(
  tx: TxDrizzle,
  tablas: TablasMensajeria,
  evento: EventoEntrante,
  efecto: () => Promise<void>,
): Promise<'PROCESADO' | 'DUPLICADO'> {
  const payloadHash = await hashContenido(evento.payload);
  const insertado = await tx
    .insert(tablas.inboxEvents)
    .values({ source: evento.source, eventId: evento.eventId, payloadHash, processedAt: new Date() })
    .onConflictDoNothing()
    .returning({ eventId: tablas.inboxEvents.eventId });
  if (insertado.length === 0) {
    const [previo] = await tx
      .select({ payloadHash: tablas.inboxEvents.payloadHash })
      .from(tablas.inboxEvents)
      .where(and(eq(tablas.inboxEvents.source, evento.source), eq(tablas.inboxEvents.eventId, evento.eventId)));
    if (previo && previo.payloadHash !== payloadHash) {
      throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'El evento ya se recibió con otro contenido.', { source: evento.source });
    }
    return 'DUPLICADO';
  }
  await efecto();
  return 'PROCESADO';
}
