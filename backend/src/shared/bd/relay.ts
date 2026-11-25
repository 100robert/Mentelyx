import { sql } from 'drizzle-orm';
import type { BdDrizzle } from './conexion';
import type { TablasMensajeria } from './mensajeria';
import { registrar } from '../registro';

export type EventoPublicado = { id: string; tipo: string; payload: unknown };
export type Entregador = (evento: EventoPublicado) => Promise<void>;

/**
 * Relay del Transactional Outbox (persistencia, sección 7.7): entrega «al menos una vez». Cada evento se reclama con
 * un arrendamiento de 60 s (FOR UPDATE SKIP LOCKED), así dos relays concurrentes no lo toman a la vez; si la entrega
 * falla se reintenta con espera creciente y, tras `maxIntentos`, queda DEAD para revisión. Los consumidores son
 * Idempotent Receivers (inbox), de modo que una entrega repetida no repite el efecto.
 */
export async function publicarPendientes(
  db: BdDrizzle,
  tablas: TablasMensajeria,
  entregar: Entregador,
  opciones: { limite?: number; maxIntentos?: number; modulo?: string } = {},
): Promise<{ publicados: number; fallidos: number }> {
  const limite = opciones.limite ?? 20;
  const maxIntentos = opciones.maxIntentos ?? 5;
  const t = tablas.outboxEvents;
  const reclamados = await db.execute<{ id: string; event_type: string; payload: unknown; attempts: number }>(sql`
    update ${t} set next_retry_at = now() + interval '60 seconds', attempts = attempts + 1
    where id in (
      select id from ${t} where status = 'PENDING' and next_retry_at <= now()
      order by created_at limit ${limite} for update skip locked)
    returning id, event_type, payload, attempts`);
  let publicados = 0;
  let fallidos = 0;
  for (const e of reclamados.rows) {
    try {
      await entregar({ id: e.id, tipo: e.event_type, payload: e.payload });
      await db.execute(sql`update ${t} set status = 'PUBLISHED', published_at = now() where id = ${e.id}`);
      publicados++;
    } catch (error) {
      fallidos++;
      const muerto = e.attempts >= maxIntentos;
      await db.execute(
        muerto
          ? sql`update ${t} set status = 'DEAD' where id = ${e.id}`
          : sql`update ${t} set next_retry_at = now() + make_interval(secs => ${Math.min(3600, 2 ** e.attempts * 15)}) where id = ${e.id}`,
      );
      registrar(muerto ? 'error' : 'warn', 'outbox.entrega_fallida', { modulo: opciones.modulo, tipo: e.event_type, resultado: muerto ? 'DEAD' : 'REINTENTO', codigo: error instanceof Error ? error.name : 'desconocido' });
    }
  }
  return { publicados, fallidos };
}
