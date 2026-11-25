import type { CodigoProducto, CodigoRecursoPlan, ResultadoMovimiento, ResultadoReserva } from '@mentelyx/contratos';
import type { ModuloOrigen } from './recurso-plan';

export type { ResultadoMovimiento, ResultadoReserva };

export type RecursoVigente = {
  recurso: CodigoRecursoPlan;
  producto: CodigoProducto;
  policyVersion: string;
  inicio: string;
  fin: string;
  limite: number;
  extra: number;
  reservado: number;
  consumido: number;
};

/**
 * Puerto del libro de recursos de M5. La implementación debe ser atómica (saldo + movimiento + outbox en un COMMIT)
 * e idempotente por `operationKey` (UNIQUE(entry_type, operation_key)). Solo el módulo que reservó puede confirmar,
 * liberar o reintegrar esa operación (`origen`).
 */
export interface LibroRecursosPort {
  reservar(cmd: {
    actorId: string;
    recurso: CodigoRecursoPlan;
    cantidad: number;
    operationKey: string;
    origen: ModuloOrigen;
    hoy: string;
  }): Promise<ResultadoReserva>;
  confirmar(cmd: { operationKey: string; cantidadReal?: number | undefined; origen: ModuloOrigen }): Promise<ResultadoMovimiento>;
  liberar(cmd: { operationKey: string; origen: ModuloOrigen }): Promise<ResultadoMovimiento>;
  reintegrar(cmd: { operationKey: string; origen: ModuloOrigen }): Promise<ResultadoMovimiento>;
  iniciarPeriodo(cmd: {
    actorId: string;
    producto: CodigoProducto;
    policyVersion: string;
    inicio: string;
    fin: string;
  }): Promise<{ creados: number }>;
  /**
   * Plan Gratuito por defecto: si el usuario no tiene NINGÚN saldo vigente hoy, crea el periodo EST_GRATUITO del mes.
   * Seguro ante concurrencia (EXCLUDE como árbitro); no toca a quien ya tiene un periodo de otro producto.
   */
  asegurarPlanGratuito(cmd: { actorId: string; hoy: string; inicio: string; fin: string; policyVersion: string }): Promise<{ creados: number }>;
}

/** Consulta especializada de solo lectura (Kysely, ADR-075). */
export interface ConsultaRecursosPort {
  recursosVigentes(actorId: string, hoy: string): Promise<RecursoVigente[]>;
}
