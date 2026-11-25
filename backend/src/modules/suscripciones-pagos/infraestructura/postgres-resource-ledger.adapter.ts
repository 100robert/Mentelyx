import { and, eq, gt, inArray, lte, sql } from 'drizzle-orm';
import type { BdDrizzle, TxDrizzle } from '../../../shared/bd/conexion';
import { registrarEnOutbox } from '../../../shared/bd/mensajeria';
import { ErrorAplicacion } from '../../../shared/errores';
import { claveReintegro, disponibles, situacionReserva, type ModuloOrigen, type SaldoRecurso, type TipoMovimiento } from '../dominio/recurso-plan';
import type { LibroRecursosPort, ResultadoMovimiento, ResultadoReserva } from '../dominio/libro-recursos.port';
import { inboxEvents, outboxEvents, resourceBalances as rb, resourceLedgerEntries as rle } from './schema';

const TABLAS_MENSAJERIA = { outboxEvents, inboxEvents };
const REINTENTABLES = new Set(['23505', '40001', '40P01']); // único, serialización, interbloqueo
const RESTRICCION_SIN_SOLAPE = 'rb_periodos_sin_solape_ex'; // migración 0002 (EXCLUDE USING gist)

export function codigoPg(e: unknown): string | undefined {
  let actual: unknown = e;
  for (let i = 0; i < 4 && actual; i++) {
    const code = (actual as { code?: unknown }).code;
    if (typeof code === 'string') return code;
    actual = (actual as { cause?: unknown }).cause;
  }
  return undefined;
}

/** Persistencia, sección 10.1: reintentar una transacción abortada como máximo 3 veces con la misma clave. */
async function conReintentos<T>(fn: () => Promise<T>, intentos = 3): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      const code = codigoPg(e);
      if (i < intentos && code && REINTENTABLES.has(code)) continue;
      throw e;
    }
  }
}

type FilaSaldo = typeof rb.$inferSelect;
type FilaMovimiento = typeof rle.$inferSelect;
type ClaveSaldo = Pick<FilaMovimiento, 'userId' | 'periodStart' | 'resourceCode'>;

const aSaldo = (f: Pick<FilaSaldo, 'limitQuantity' | 'grantedExtra' | 'reserved' | 'consumed'>): SaldoRecurso => ({
  limite: Number(f.limitQuantity),
  extra: Number(f.grantedExtra),
  reservado: Number(f.reserved),
  consumido: Number(f.consumed),
});

async function buscarMovimiento(tx: TxDrizzle, tipo: TipoMovimiento, operationKey: string): Promise<FilaMovimiento | undefined> {
  const [fila] = await tx.select().from(rle).where(and(eq(rle.entryType, tipo), eq(rle.operationKey, operationKey)));
  return fila;
}

/** Tipos de movimiento ya registrados con una clave (RESERVA, CONFIRMACION y LIBERACION comparten la clave). */
async function tiposConClave(tx: TxDrizzle, operationKey: string): Promise<Set<TipoMovimiento>> {
  const filas = await tx.select({ tipo: rle.entryType }).from(rle).where(eq(rle.operationKey, operationKey));
  return new Set(filas.map((f) => f.tipo as TipoMovimiento));
}

const clavePrimaria = (m: ClaveSaldo) => and(eq(rb.userId, m.userId), eq(rb.periodStart, m.periodStart), eq(rb.resourceCode, m.resourceCode));

/** Bloquea la fila de saldo del movimiento: serializa todos los movimientos de ese recurso y periodo. */
async function bloquearSaldo(tx: TxDrizzle, m: ClaveSaldo): Promise<FilaSaldo> {
  const [fila] = await tx.select().from(rb).where(clavePrimaria(m)).for('update');
  if (!fila) throw new ErrorAplicacion('ERROR_INTERNO', 'Movimiento sin saldo asociado.');
  return fila;
}

/** Solo el módulo que abrió la operación puede cerrarla (confirmar, liberar o reintegrar). */
function exigirMismoOrigen(m: Pick<FilaMovimiento, 'sourceModule'>, origen: ModuloOrigen): void {
  if (m.sourceModule !== origen) {
    throw new ErrorAplicacion('NO_AUTORIZADO', 'La operación pertenece a otro módulo.', { origen, propietario: m.sourceModule });
  }
}

export class PostgresLibroRecursos implements LibroRecursosPort {
  constructor(private readonly db: BdDrizzle) {}

  reservar(cmd: Parameters<LibroRecursosPort['reservar']>[0]): Promise<ResultadoReserva> {
    const cantidad = String(cmd.cantidad);
    return conReintentos(() =>
      this.db.transaction(async (tx): Promise<ResultadoReserva> => {
        const previa = await buscarMovimiento(tx, 'RESERVA', cmd.operationKey);
        if (previa) {
          // Misma clave, mismo efecto: no se toca el saldo; se informa la situación actual de esa reserva.
          if (
            previa.userId !== cmd.actorId ||
            previa.resourceCode !== cmd.recurso ||
            Number(previa.quantity) !== cmd.cantidad ||
            previa.sourceModule !== cmd.origen
          ) {
            throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La clave de operación ya se usó con otros datos.');
          }
          const [saldo] = await tx.select().from(rb).where(clavePrimaria(previa));
          return {
            estado: 'RESERVADO',
            disponibles: saldo ? disponibles(aSaldo(saldo)) : 0,
            situacion: situacionReserva(await tiposConClave(tx, cmd.operationKey)),
            repetida: true,
          };
        }
        const vigente = and(eq(rb.userId, cmd.actorId), eq(rb.resourceCode, cmd.recurso), lte(rb.periodStart, cmd.hoy), gt(rb.periodEnd, cmd.hoy));
        // UPDATE condicional (persistencia, sección 10.2): la comprobación y el incremento son un solo paso atómico.
        // Si dos llamadas con la misma clave llegan a la vez, la segunda choca con UNIQUE(entry_type, operation_key),
        // su transacción se deshace entera (también el incremento) y el reintento la resuelve como repetida.
        const actualizados = await tx
          .update(rb)
          .set({ reserved: sql`${rb.reserved} + ${cantidad}::numeric`, rowVersion: sql`${rb.rowVersion} + 1`, updatedAt: sql`now()` })
          .where(and(vigente, sql`${rb.reserved} + ${rb.consumed} + ${cantidad}::numeric <= ${rb.limitQuantity} + ${rb.grantedExtra}`))
          .returning();
        if (actualizados.length > 1) throw new ErrorAplicacion('ERROR_INTERNO', 'Periodos de recursos superpuestos.');
        const [saldo] = actualizados;
        if (!saldo) {
          const [actual] = await tx.select().from(rb).where(vigente);
          return { estado: 'SIN_CUOTA', disponibles: actual ? Math.max(0, disponibles(aSaldo(actual))) : 0 };
        }
        await tx.insert(rle).values({
          userId: cmd.actorId,
          periodStart: saldo.periodStart,
          resourceCode: cmd.recurso,
          entryType: 'RESERVA',
          quantity: cantidad,
          operationKey: cmd.operationKey,
          sourceModule: cmd.origen,
        });
        return { estado: 'RESERVADO', disponibles: disponibles(aSaldo(saldo)), situacion: 'PENDIENTE', repetida: false };
      }),
    );
  }

  confirmar(cmd: Parameters<LibroRecursosPort['confirmar']>[0]): Promise<ResultadoMovimiento> {
    return conReintentos(() =>
      this.db.transaction(async (tx) => {
        const reserva = await buscarMovimiento(tx, 'RESERVA', cmd.operationKey);
        if (!reserva) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'No existe una reserva con esa clave.');
        exigirMismoOrigen(reserva, cmd.origen);
        await bloquearSaldo(tx, reserva);
        const reservado = Number(reserva.quantity);
        const real = cmd.cantidadReal ?? reservado;
        const previa = await buscarMovimiento(tx, 'CONFIRMACION', cmd.operationKey);
        if (previa) {
          // Reintento: mismo efecto si los datos coinciden; con otra cantidad es otra operación con la misma clave.
          if (Number(previa.quantity) !== real) {
            throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La reserva ya se confirmó con otra cantidad.', { confirmada: Number(previa.quantity) });
          }
          return { estado: 'YA_APLICADO' };
        }
        if (await buscarMovimiento(tx, 'LIBERACION', cmd.operationKey)) {
          throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La reserva ya fue liberada.', { motivo: 'RESERVA_LIBERADA' });
        }
        if (!(real > 0) || real > reservado) {
          throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La cantidad confirmada debe ser positiva y no superar la reservada.');
        }
        await tx
          .update(rb)
          .set({
            reserved: sql`${rb.reserved} - ${reserva.quantity}::numeric`,
            consumed: sql`${rb.consumed} + ${String(real)}::numeric`,
            rowVersion: sql`${rb.rowVersion} + 1`,
            updatedAt: sql`now()`,
          })
          .where(clavePrimaria(reserva));
        const base = { userId: reserva.userId, periodStart: reserva.periodStart, resourceCode: reserva.resourceCode, operationKey: cmd.operationKey, sourceModule: reserva.sourceModule, originalEntryId: reserva.id };
        await tx.insert(rle).values({ ...base, entryType: 'CONFIRMACION', quantity: String(real) });
        if (real < reservado) {
          await tx.insert(rle).values({ ...base, entryType: 'LIBERACION', quantity: sql`${reserva.quantity}::numeric - ${String(real)}::numeric` });
        }
        return { estado: 'APLICADO' } as const;
      }),
    );
  }

  liberar(cmd: Parameters<LibroRecursosPort['liberar']>[0]): Promise<ResultadoMovimiento> {
    return conReintentos(() =>
      this.db.transaction(async (tx) => {
        const reserva = await buscarMovimiento(tx, 'RESERVA', cmd.operationKey);
        if (!reserva) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'No existe una reserva con esa clave.');
        exigirMismoOrigen(reserva, cmd.origen);
        await bloquearSaldo(tx, reserva);
        // Primero la confirmación: una confirmación parcial también registra la LIBERACION de su remanente.
        if (await buscarMovimiento(tx, 'CONFIRMACION', cmd.operationKey)) {
          throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La reserva ya se confirmó; corresponde un reintegro.', { motivo: 'RESERVA_CONFIRMADA' });
        }
        if (await buscarMovimiento(tx, 'LIBERACION', cmd.operationKey)) return { estado: 'YA_APLICADO' } as const;
        await tx
          .update(rb)
          .set({ reserved: sql`${rb.reserved} - ${reserva.quantity}::numeric`, rowVersion: sql`${rb.rowVersion} + 1`, updatedAt: sql`now()` })
          .where(clavePrimaria(reserva));
        await tx.insert(rle).values({
          userId: reserva.userId,
          periodStart: reserva.periodStart,
          resourceCode: reserva.resourceCode,
          entryType: 'LIBERACION',
          quantity: reserva.quantity,
          operationKey: cmd.operationKey,
          sourceModule: reserva.sourceModule,
          originalEntryId: reserva.id,
        });
        return { estado: 'APLICADO' } as const;
      }),
    );
  }

  reintegrar(cmd: Parameters<LibroRecursosPort['reintegrar']>[0]): Promise<ResultadoMovimiento> {
    return conReintentos(() =>
      this.db.transaction(async (tx) => {
        const confirmacion = await buscarMovimiento(tx, 'CONFIRMACION', cmd.operationKey);
        if (!confirmacion) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'No hay un consumo confirmado para reintegrar.');
        exigirMismoOrigen(confirmacion, cmd.origen);
        await bloquearSaldo(tx, confirmacion);
        const clave = claveReintegro(cmd.operationKey);
        if (await buscarMovimiento(tx, 'REINTEGRO', clave)) return { estado: 'YA_APLICADO' } as const;
        await tx
          .update(rb)
          .set({ consumed: sql`${rb.consumed} - ${confirmacion.quantity}::numeric`, rowVersion: sql`${rb.rowVersion} + 1`, updatedAt: sql`now()` })
          .where(clavePrimaria(confirmacion));
        const [reintegro] = await tx
          .insert(rle)
          .values({
            userId: confirmacion.userId,
            periodStart: confirmacion.periodStart,
            resourceCode: confirmacion.resourceCode,
            entryType: 'REINTEGRO',
            quantity: confirmacion.quantity,
            operationKey: clave,
            sourceModule: confirmacion.sourceModule,
            originalEntryId: confirmacion.id,
          })
          .returning({ id: rle.id });
        if (!reintegro) throw new ErrorAplicacion('ERROR_INTERNO', 'No se registró el reintegro.');
        // Evento transversal de auditoría (API, sección 3.1) en la misma transacción que el efecto.
        await registrarEnOutbox(tx, TABLAS_MENSAJERIA, {
          tipo: 'AuditoriaRegistrada',
          agregadoId: reintegro.id,
          versionAgregado: 1,
          payload: {
            modulo: 'M5',
            accion: 'RECURSO_REINTEGRADO',
            actorId: confirmacion.userId,
            recurso: confirmacion.resourceCode,
            cantidad: confirmacion.quantity,
            operationKey: cmd.operationKey,
            motivo: 'FALLA_IMPUTABLE_SERVICIO',
          },
        });
        return { estado: 'APLICADO' } as const;
      }),
    );
  }

  asegurarPlanGratuito(cmd: Parameters<LibroRecursosPort['asegurarPlanGratuito']>[0]): Promise<{ creados: number }> {
    return conReintentos(async () => {
      const r = await this.db.execute<{ resource_code: string }>(sql`
        insert into m5_billing.resource_balances
          (user_id, period_start, period_end, resource_code, product_code, policy_version, limit_quantity)
        select ${cmd.actorId}::uuid, ${cmd.inicio}::date, ${cmd.fin}::date, resource_code, product_code, policy_version, monthly_quantity
        from m5_billing.plan_resource_limits
        where product_code = 'EST_GRATUITO' and policy_version = ${cmd.policyVersion}
          and not exists (
            select 1 from m5_billing.resource_balances
            where user_id = ${cmd.actorId}::uuid and period_start <= ${cmd.hoy}::date and period_end > ${cmd.hoy}::date)
        order by resource_code
        on conflict on constraint ${sql.identifier(RESTRICCION_SIN_SOLAPE)} do nothing
        returning resource_code`);
      return { creados: r.rows.length };
    });
  }

  /**
   * La garantía contra periodos superpuestos es la restricción EXCLUDE de PostgreSQL (usuario, recurso, rango de
   * fechas), no una consulta previa. Se usa como árbitro de ON CONFLICT: un intento concurrente o repetido no inserta
   * nada y, después, se comprueba que lo existente sea exactamente el periodo pedido (reintento idempotente) o se rechaza.
   */
  iniciarPeriodo(cmd: Parameters<LibroRecursosPort['iniciarPeriodo']>[0]): Promise<{ creados: number }> {
    if (!(cmd.fin > cmd.inicio)) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'El fin del periodo debe ser posterior al inicio.');
    return conReintentos(() =>
      this.db.transaction(async (tx) => {
        const plan = await tx.execute<{ resource_code: string }>(sql`
          select resource_code from m5_billing.plan_resource_limits
          where product_code = ${cmd.producto} and policy_version = ${cmd.policyVersion}`);
        const recursos = plan.rows.map((f) => f.resource_code);
        if (recursos.length === 0) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'No existe esa versión comercial del producto.');
        // Orden estable por recurso: dos inserciones concurrentes esperan en el mismo orden y no se interbloquean.
        const insertados = await tx.execute<{ resource_code: string }>(sql`
          insert into m5_billing.resource_balances
            (user_id, period_start, period_end, resource_code, product_code, policy_version, limit_quantity)
          select ${cmd.actorId}::uuid, ${cmd.inicio}::date, ${cmd.fin}::date, resource_code, product_code, policy_version, monthly_quantity
          from m5_billing.plan_resource_limits
          where product_code = ${cmd.producto} and policy_version = ${cmd.policyVersion}
          order by resource_code
          on conflict on constraint ${sql.identifier(RESTRICCION_SIN_SOLAPE)} do nothing
          returning resource_code`);
        const creados = insertados.rows.length;
        if (creados === recursos.length) return { creados };
        // Algo ya ocupaba esas fechas: solo se acepta si es exactamente el mismo periodo del mismo producto y versión.
        const existentes = await tx
          .select()
          .from(rb)
          .where(and(eq(rb.userId, cmd.actorId), inArray(rb.resourceCode, recursos), sql`daterange(${rb.periodStart}, ${rb.periodEnd}) && daterange(${cmd.inicio}::date, ${cmd.fin}::date)`));
        const identico = (f: FilaSaldo) => f.periodStart === cmd.inicio && f.periodEnd === cmd.fin && f.productCode === cmd.producto && f.policyVersion === cmd.policyVersion;
        if (existentes.length !== recursos.length || !existentes.every(identico)) {
          throw new ErrorAplicacion('ENTRADA_INVALIDA', 'El periodo se superpone con otro periodo de recursos.', { motivo: 'PERIODO_SUPERPUESTO' });
        }
        return { creados };
      }),
    );
  }
}
