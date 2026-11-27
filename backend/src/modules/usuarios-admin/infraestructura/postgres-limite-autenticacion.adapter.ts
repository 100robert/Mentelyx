import { sql } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { ErrorAplicacion } from '../../../shared/errores';
import type { LimiteAutenticacionPort } from '../dominio/limite-autenticacion.port';

/** 30 intentos por correo y 120 por IP confiable en ventanas de 60 s desde el primer intento.
 * UPSERT atómico y reloj SQL: se comparte entre Workers. Ambas claves son HMAC; no almacena correo ni IP en claro.
 * Solo acepta CF-Connecting-IP, que Cloudflare fija en la frontera confiable. Falla cerrado si falta.
 */
export class PostgresLimiteAutenticacion implements LimiteAutenticacionPort {
  private clave: Promise<CryptoKey> | undefined;
  constructor(private readonly db: BdDrizzle, private readonly secreto: string) {}

  async consumir(correo: string, direccionIpConfiable: string | undefined): Promise<void> {
    try {
      if (!direccionIpConfiable || direccionIpConfiable.length > 64 || !/^[0-9a-fA-F:.]+$/.test(direccionIpConfiable)) {
        throw new Error('CF-Connecting-IP ausente o inválida');
      }
      this.clave ??= crypto.subtle.importKey('raw', new TextEncoder().encode(this.secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const hmac = async (mensaje: string) => {
        const firma = await crypto.subtle.sign('HMAC', await this.clave!, new TextEncoder().encode(mensaje));
        return [...new Uint8Array(firma)].map((b) => b.toString(16).padStart(2, '0')).join('');
      };
      const correoKey = `m1-auth:v1:${await hmac(`account:${correo.trim().toLowerCase()}`)}`;
      const ipKey = `m1-auth:v1:${await hmac(`ip:${direccionIpConfiable}`)}`;
      const r = await this.db.execute<{ limitado: boolean; restante: number | null }>(sql`
        with reloj as (select floor(extract(epoch from statement_timestamp()) * 1000)::bigint as ms),
        claves(key, limite) as (values (${correoKey}, 30), (${ipKey}, 120)),
        purga as (
          delete from m1_users.auth_rate_limits where id in (
            select id from m1_users.auth_rate_limits, reloj
            where key like 'm1-auth:v1:%' and key not in (${correoKey}, ${ipKey}) and last_request < reloj.ms - 86400000 limit 100
          )
            returning id
        ), consumo as (
          insert into m1_users.auth_rate_limits (key, count, last_request)
          select claves.key, 1, reloj.ms from claves cross join reloj cross join (select count(*) from purga) as limpieza
          on conflict (key) do update set
            count = case when auth_rate_limits.last_request <= excluded.last_request - 60000 then 1 else least(auth_rate_limits.count + 1, 121) end,
            last_request = case when auth_rate_limits.last_request <= excluded.last_request - 60000 then excluded.last_request else auth_rate_limits.last_request end
          returning key, count, last_request
        )
        select bool_or(consumo.count > claves.limite) as limitado,
          min(greatest(1, ceil((consumo.last_request + 60000 - reloj.ms) / 1000.0))::int)
            filter (where consumo.count > claves.limite) as restante
        from consumo join claves using (key) cross join reloj`);
      const fila = r.rows[0];
      if (!fila) throw new Error('Sin resultado de admisión');
      if (fila.limitado) throw new ErrorAplicacion('LIMITE_TASA', 'Demasiados intentos. Espera antes de volver a intentarlo.', { reintentarEnSeg: fila.restante ?? 1 });
    } catch (e) {
      if (e instanceof ErrorAplicacion) throw e;
      // No continuar con scrypt si no se puede comprobar la admisión. No registrar correo, contraseña o clave.
      throw new ErrorAplicacion('SERVICIO_NO_DISPONIBLE', 'No se puede comprobar el límite de autenticación.');
    }
  }
}
