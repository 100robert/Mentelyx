import { and, eq, sql } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { registrar } from '../../../shared/registro';
import type { LimiteTasaPort } from '../dominio/tutor';
import { aiUsageRecords } from './schema';

/** Orquestación, sección 10.5: 6 consultas por minuto por usuario. */
export const LIMITE_CONSULTAS_POR_MINUTO = 6;
const VENTANA_SEG = 60;

const segundosRestantes = (ahora: Date) => VENTANA_SEG - (Math.floor(ahora.getTime() / 1000) % VENTANA_SEG);

/**
 * Respaldo SQL (API-08, EQ-29: «rate limit por consulta SQL de respaldo»): cuenta las consultas ADMITIDAS del usuario
 * en los últimos 60 s. Conservador y no atómico: la simultaneidad la garantiza la admisión (candado transaccional).
 */
export class SqlLimiteTasa implements LimiteTasaPort {
  constructor(
    private readonly db: BdDrizzle,
    private readonly limite = LIMITE_CONSULTAS_POR_MINUTO,
  ) {}

  async consumir(actorId: string, ahora: Date) {
    const [f] = await this.db
      .select({ n: sql<number>`count(*)::int`, primera: sql<string | null>`min(${aiUsageRecords.createdAt})::text` })
      .from(aiUsageRecords)
      .where(and(eq(aiUsageRecords.userId, actorId), sql`${aiUsageRecords.createdAt} > ${ahora.toISOString()}::timestamptz - make_interval(secs => ${VENTANA_SEG})`));
    if ((f?.n ?? 0) < this.limite) return { permitido: true as const };
    const transcurrido = f?.primera ? Math.floor((ahora.getTime() - new Date(f.primera).getTime()) / 1000) : 0;
    return { permitido: false as const, reintentarEnSeg: Math.max(1, VENTANA_SEG - transcurrido) };
  }
}

/**
 * Límite de tasa en Redis por la API REST de Upstash (ADR-012; persistencia, sección 5). Ventana fija de 60 s con
 * `INCR` + `EXPIRE` en una transacción `multi-exec` (atómica con TTL, nunca GET+SET). La clave lleva entorno, versión
 * de política y un HMAC del actor (persistencia, sección 5: sin identificadores en claro). Si Redis falla o tarda,
 * se usa el respaldo SQL; ningún recurso de plan se decide aquí.
 */
export class RedisLimiteTasa implements LimiteTasaPort {
  private claveHmac: Promise<CryptoKey> | undefined;

  constructor(
    private readonly cfg: { url: string; token: string; entorno: string; secreto: string; limite?: number; timeoutMs?: number },
    private readonly respaldo: LimiteTasaPort,
  ) {}

  private async actorCifrado(actorId: string) {
    this.claveHmac ??= crypto.subtle.importKey('raw', new TextEncoder().encode(`mentelyx:rl:v1:${this.cfg.secreto}`), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const firma = await crypto.subtle.sign('HMAC', await this.claveHmac, new TextEncoder().encode(actorId));
    return [...new Uint8Array(firma).slice(0, 16)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async consumir(actorId: string, ahora: Date) {
    const ventana = Math.floor(ahora.getTime() / 1000 / VENTANA_SEG);
    try {
      const clave = `rl:${this.cfg.entorno}:v1:usr:${await this.actorCifrado(actorId)}:tutor.consulta:${ventana}`;
      const r = await fetch(`${this.cfg.url.replace(/\/$/, '')}/multi-exec`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.cfg.token}`, 'content-type': 'application/json' },
        body: JSON.stringify([
          ['INCR', clave],
          ['EXPIRE', clave, String(VENTANA_SEG + 1)],
        ]),
        signal: AbortSignal.timeout(this.cfg.timeoutMs ?? 1500),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const [incr] = (await r.json()) as Array<{ result?: unknown; error?: string }>;
      const n = Number(incr?.result);
      if (!Number.isInteger(n)) throw new Error(incr?.error ?? 'respuesta inesperada');
      return n > (this.cfg.limite ?? LIMITE_CONSULTAS_POR_MINUTO) ? { permitido: false as const, reintentarEnSeg: segundosRestantes(ahora) } : { permitido: true as const };
    } catch (e) {
      registrar('warn', 'limite_tasa.redis_no_disponible', { tipo: e instanceof Error ? e.name : typeof e });
      return this.respaldo.consumir(actorId, ahora);
    }
  }
}
