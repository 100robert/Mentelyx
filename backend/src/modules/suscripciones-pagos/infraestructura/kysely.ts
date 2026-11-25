import { Kysely, PostgresDialect, type PostgresPool } from 'kysely';
import type { Kyselify } from 'drizzle-orm/kysely';
import type { planResourceLimits, resourceBalances, resourceLedgerEntries } from './schema';

/**
 * Tipos de Kysely DERIVADOS del esquema canónico de Drizzle (ADR-075, MIG-04): si cambia una columna en Drizzle,
 * las consultas de Kysely dejan de compilar. Kysely no tiene migraciones propias.
 */
export interface BdM5 {
  plan_resource_limits: Kyselify<typeof planResourceLimits>;
  resource_balances: Kyselify<typeof resourceBalances>;
  resource_ledger_entries: Kyselify<typeof resourceLedgerEntries>;
}

/** Comparte el Pool del driver de Neon con Drizzle (una conexión por petición). */
export const crearKyselyM5 = (pool: unknown): Kysely<BdM5> =>
  new Kysely<BdM5>({ dialect: new PostgresDialect({ pool: pool as PostgresPool }) }).withSchema('m5_billing');
