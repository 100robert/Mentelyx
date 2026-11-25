import { and, eq, sql } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { ErrorAplicacion } from '../../../shared/errores';
import type { OperacionIa, UsoIaPort } from '../dominio/tutor';
import { aiBudgets, aiUsageRecords } from './schema';

export type ConfigPresupuesto = { mensualUsd: number; topeUsd: number; policyVersion: string };

/** Una consulta EN_CURSO más antigua que esto se considera abandonada para el límite de simultaneidad (timeout 60 s). */
const VIGENCIA_EN_CURSO_SEG = 90;

/** Primer y último día (exclusivo) del mes civil de `hoy` (AAAA-MM-DD). */
function mesDe(hoy: string) {
  const [a, m] = hoy.split('-').map(Number) as [number, number];
  const fin = m === 12 ? `${a + 1}-01-01` : `${a}-${String(m + 1).padStart(2, '0')}-01`;
  return { inicio: `${a}-${String(m).padStart(2, '0')}-01`, fin };
}

/**
 * Registro de uso (SC-03) y presupuestos técnicos (SC-11). La admisión bloquea en orden estable las filas GLOBAL y
 * del proveedor con un UPDATE condicional (reservado + gastado + estimado ≤ tope duro) y registra la operación
 * EN_CURSO en el mismo COMMIT, antes de invocar al proveedor (orquestación, sección 10.3).
 */
export class PostgresUsoIa implements UsoIaPort {
  constructor(
    private readonly db: BdDrizzle,
    private readonly presupuesto: ConfigPresupuesto,
  ) {}

  async buscar(operationKey: string): Promise<OperacionIa | undefined> {
    const [f] = await this.db
      .select({ operationKey: aiUsageRecords.operationKey, requestHash: aiUsageRecords.requestHash, status: aiUsageRecords.status, resultRef: aiUsageRecords.resultRef })
      .from(aiUsageRecords)
      .where(eq(aiUsageRecords.operationKey, operationKey));
    return f ? { ...f, status: f.status as OperacionIa['status'] } : undefined;
  }

  async admitir(op: Parameters<UsoIaPort['admitir']>[0]) {
    const { inicio, fin } = mesDe(op.hoy);
    const alcances = ['GLOBAL', `PROVEEDOR:${op.ruta.proveedor}`].sort();
    const estimado = String(op.estimadoUsd);
    try {
      await this.db.transaction(async (tx) => {
        // 1 consulta simultánea por usuario (sección 10.5): el candado transaccional serializa las admisiones del
        // mismo usuario, así dos peticiones concurrentes no pueden ver «ninguna EN_CURSO» a la vez.
        await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${`m6:tutor:${op.userId}`}, 0))`);
        const enCurso = await tx
          .select({ n: sql<number>`count(*)::int` })
          .from(aiUsageRecords)
          .where(
            and(
              eq(aiUsageRecords.userId, op.userId),
              eq(aiUsageRecords.status, 'EN_CURSO'),
              sql`${aiUsageRecords.createdAt} > now() - make_interval(secs => ${VIGENCIA_EN_CURSO_SEG})`,
            ),
          );
        if ((enCurso[0]?.n ?? 0) > 0) throw new ErrorAplicacion('LIMITE_TASA', 'Ya tienes una consulta en proceso: espera su respuesta.', { reintentarEnSeg: 5 });
        await tx
          .insert(aiBudgets)
          .values(
            alcances.map((scope) => ({
              scope,
              periodStart: inicio,
              periodEnd: fin,
              softLimitUsd: String(this.presupuesto.mensualUsd),
              hardLimitUsd: String(this.presupuesto.topeUsd),
              thresholds: { alerta: 0.7, degradacion: 0.9, detencion: 1 },
              policyVersion: this.presupuesto.policyVersion,
            })),
          )
          .onConflictDoNothing();
        for (const scope of alcances) {
          const admitidos = await tx
            .update(aiBudgets)
            .set({ reservedUsd: sql`${aiBudgets.reservedUsd} + ${estimado}::numeric`, updatedAt: sql`now()` })
            .where(
              and(
                eq(aiBudgets.scope, scope),
                eq(aiBudgets.periodStart, inicio),
                sql`${aiBudgets.reservedUsd} + ${aiBudgets.spentUsd} + ${estimado}::numeric <= ${aiBudgets.hardLimitUsd}`,
              ),
            )
            .returning({ scope: aiBudgets.scope });
          if (admitidos.length !== 1) throw new ErrorAplicacion('PRESUPUESTO_OPERACION_EXCEDIDO', 'El presupuesto técnico de IA del periodo está agotado.', { alcance: scope });
        }
        await tx.insert(aiUsageRecords).values({
          operationKey: op.operationKey,
          requestHash: op.requestHash,
          userId: op.userId,
          billingPeriod: inicio,
          usageDay: op.hoy,
          routeId: op.ruta.id,
          routeVersion: op.ruta.version,
          provider: op.ruta.proveedor,
          model: op.ruta.modelo,
          intent: op.recurso === 'CONSULTA_TECNICA' ? 'explicacion.tecnica' : 'explicacion.general',
          dataClass: 'D1',
          status: 'EN_CURSO',
          resourceCode: op.recurso,
          resourceReservationKey: op.operationKey,
          reservedBudgetUsd: estimado,
        });
      });
    } catch (e) {
      if ((e as { cause?: { code?: string }; code?: string }).code === '23505' || (e as { cause?: { code?: string } }).cause?.code === '23505') {
        throw new ErrorAplicacion('OPERACION_EN_CURSO', 'La consulta sigue en proceso.');
      }
      throw e;
    }
  }

  async finalizar(operationKey: string, r: Parameters<UsoIaPort['finalizar']>[1]) {
    const incierta = r.status === 'INCIERTA';
    await this.db.transaction(async (tx) => {
      const [uso] = await tx
        .update(aiUsageRecords)
        .set({
          status: r.status,
          // INCIERTA (CO-10): costo desconocido; lo reservado queda retenido en el presupuesto hasta conciliarse.
          actualCostUsd: incierta ? null : String(r.costoUsd),
          pendingReconciliation: incierta,
          inputTokens: r.tokensEntrada,
          outputTokens: r.tokensSalida,
          latencyMs: r.latenciaMs,
          resultRef: r.resultRef,
          finishedAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(and(eq(aiUsageRecords.operationKey, operationKey), eq(aiUsageRecords.status, 'EN_CURSO')))
        .returning({ reservado: aiUsageRecords.reservedBudgetUsd, periodo: aiUsageRecords.billingPeriod, proveedor: aiUsageRecords.provider });
      if (!uso || incierta) return; // ya finalizada (idempotente) o incierta (sin mover el presupuesto)
      for (const scope of ['GLOBAL', `PROVEEDOR:${uso.proveedor}`].sort()) {
        await tx
          .update(aiBudgets)
          .set({
            reservedUsd: sql`greatest(${aiBudgets.reservedUsd} - ${uso.reservado}::numeric, 0)`,
            spentUsd: sql`${aiBudgets.spentUsd} + ${String(r.costoUsd)}::numeric`,
            updatedAt: sql`now()`,
          })
          .where(and(eq(aiBudgets.scope, scope), eq(aiBudgets.periodStart, uso.periodo)));
      }
    });
  }
}
