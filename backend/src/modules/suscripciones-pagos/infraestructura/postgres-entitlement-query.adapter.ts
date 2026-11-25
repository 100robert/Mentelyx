import { sql, type Kysely } from 'kysely';
import type { CodigoProducto, CodigoRecursoPlan } from '@mentelyx/contratos';
import type { ConsultaRecursosPort, RecursoVigente } from '../dominio/libro-recursos.port';
import type { BdM5 } from './kysely';

/** Consulta especializada de lectura con Kysely (ADR-075): recursos del periodo vigente del actor. */
export class PostgresConsultaRecursos implements ConsultaRecursosPort {
  constructor(private readonly k: Kysely<BdM5>) {}

  async recursosVigentes(actorId: string, hoy: string): Promise<RecursoVigente[]> {
    const filas = await this.k
      .selectFrom('resource_balances')
      .select([
        'resource_code',
        'product_code',
        'policy_version',
        'limit_quantity',
        'granted_extra',
        'reserved',
        'consumed',
        sql<string>`period_start::text`.as('inicio'),
        sql<string>`period_end::text`.as('fin'),
      ])
      .where('user_id', '=', actorId)
      .where('period_start', '<=', hoy)
      .where('period_end', '>', hoy)
      .orderBy('resource_code')
      .execute();
    return filas.map((f) => ({
      recurso: f.resource_code as CodigoRecursoPlan,
      producto: f.product_code as CodigoProducto,
      policyVersion: f.policy_version,
      inicio: f.inicio,
      fin: f.fin,
      limite: Number(f.limit_quantity),
      extra: Number(f.granted_extra),
      reservado: Number(f.reserved),
      consumido: Number(f.consumed),
    }));
  }
}
