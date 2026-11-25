import { sql } from 'drizzle-orm';
import {
  bigint,
  check,
  date,
  foreignKey,
  index,
  jsonb,
  numeric,
  pgSchema,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/** Esquema propietario de M5 (persistencia, secciones 3.5, 7.5 y 7.9). Sin tablas de créditos (historial 7.5.1). */
export const m5Billing = pgSchema('m5_billing');

const PRODUCTOS = sql`('EST_GRATUITO', 'EST_ESTANDAR', 'EST_PLUS', 'EST_PREMIUM', 'DOC_INICIAL', 'DOC_LIVE')`;
const RECURSOS = sql`('CONSULTA_GENERAL', 'CONSULTA_TECNICA', 'RAZONAMIENTO_PROFUNDO', 'EVALUACION_EQUIVALENTE', 'ILUSTRACION_ESTANDAR', 'DOCUMENTO_EQUIVALENTE', 'ALMACENAMIENTO_BYTES', 'ALMACENAMIENTO_DOCUMENTAL_BYTES', 'ALMACENAMIENTO_VIDEO_BYTES', 'TRANSFERENCIA_AUDIOVISUAL_BYTES')`;
const ahora = (nombre: string) => timestamp(nombre, { withTimezone: true }).notNull().defaultNow();

export const commercialPlanVersions = m5Billing.table(
  'commercial_plan_versions',
  {
    productCode: text('product_code').notNull(),
    policyVersion: text('policy_version').notNull(),
    pricePen: numeric('price_pen', { precision: 12, scale: 2 }).notNull(),
    planFeatures: jsonb('plan_features').notNull().default({}),
    validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
    validUntil: timestamp('valid_until', { withTimezone: true }),
    createdAt: ahora('created_at'),
  },
  (t) => [
    primaryKey({ columns: [t.productCode, t.policyVersion] }),
    check('cpv_producto_ck', sql`${t.productCode} in ${PRODUCTOS}`),
    check('cpv_precio_ck', sql`${t.pricePen} >= 0`),
    check('cpv_vigencia_ck', sql`${t.validUntil} is null or ${t.validUntil} > ${t.validFrom}`),
  ],
);

export const planResourceLimits = m5Billing.table(
  'plan_resource_limits',
  {
    productCode: text('product_code').notNull(),
    policyVersion: text('policy_version').notNull(),
    resourceCode: text('resource_code').notNull(),
    monthlyQuantity: numeric('monthly_quantity', { precision: 20, scale: 3 }).notNull(),
    unit: text('unit').notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.productCode, t.policyVersion, t.resourceCode] }),
    foreignKey({ columns: [t.productCode, t.policyVersion], foreignColumns: [commercialPlanVersions.productCode, commercialPlanVersions.policyVersion] }),
    check('prl_recurso_ck', sql`${t.resourceCode} in ${RECURSOS}`),
    check('prl_cantidad_ck', sql`${t.monthlyQuantity} >= 0`),
    check('prl_unidad_ck', sql`${t.unit} in ('UNIDAD', 'BYTE')`),
  ],
);

/**
 * Además de lo declarado aquí, la migración 0002 añade (Drizzle ORM no los modela):
 * - `rb_periodos_sin_solape_ex`: EXCLUDE USING gist (usuario, recurso, daterange) — sin periodos superpuestos.
 * - `rb_coherente_con_libro` / `rle_coherente_con_saldo`: CONSTRAINT TRIGGER diferidos — saldo = libro al COMMIT.
 */
export const resourceBalances = m5Billing.table(
  'resource_balances',
  {
    userId: uuid('user_id').notNull(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    resourceCode: text('resource_code').notNull(),
    productCode: text('product_code').notNull(),
    policyVersion: text('policy_version').notNull(),
    limitQuantity: numeric('limit_quantity', { precision: 20, scale: 3 }).notNull(),
    grantedExtra: numeric('granted_extra', { precision: 20, scale: 3 }).notNull().default('0'),
    reserved: numeric('reserved', { precision: 20, scale: 3 }).notNull().default('0'),
    consumed: numeric('consumed', { precision: 20, scale: 3 }).notNull().default('0'),
    rowVersion: bigint('row_version', { mode: 'number' }).notNull().default(0),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.periodStart, t.resourceCode] }),
    foreignKey({
      columns: [t.productCode, t.policyVersion, t.resourceCode],
      foreignColumns: [planResourceLimits.productCode, planResourceLimits.policyVersion, planResourceLimits.resourceCode],
    }),
    check('rb_no_negativos_ck', sql`${t.limitQuantity} >= 0 and ${t.grantedExtra} >= 0 and ${t.reserved} >= 0 and ${t.consumed} >= 0`),
    check('rb_capacidad_ck', sql`${t.reserved} + ${t.consumed} <= ${t.limitQuantity} + ${t.grantedExtra}`),
    check('rb_periodo_ck', sql`${t.periodEnd} > ${t.periodStart}`),
    index('rb_usuario_vigencia_idx').on(t.userId, t.resourceCode, t.periodStart, t.periodEnd),
  ],
);

export const resourceLedgerEntries = m5Billing.table(
  'resource_ledger_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull(),
    periodStart: date('period_start').notNull(),
    resourceCode: text('resource_code').notNull(),
    entryType: text('entry_type').notNull(),
    quantity: numeric('quantity', { precision: 20, scale: 3 }).notNull(),
    operationKey: text('operation_key').notNull(),
    sourceModule: text('source_module').notNull(),
    sourceRef: text('source_ref'),
    originalEntryId: uuid('original_entry_id').references((): AnyPgColumn => resourceLedgerEntries.id),
    createdAt: ahora('created_at'),
  },
  (t) => [
    unique('rle_tipo_clave_uq').on(t.entryType, t.operationKey),
    foreignKey({ columns: [t.userId, t.periodStart, t.resourceCode], foreignColumns: [resourceBalances.userId, resourceBalances.periodStart, resourceBalances.resourceCode] }),
    index('rle_saldo_idx').on(t.userId, t.periodStart, t.resourceCode),
    check('rle_tipo_ck', sql`${t.entryType} in ('RESERVA', 'CONFIRMACION', 'LIBERACION', 'CONCESION', 'REINTEGRO', 'AJUSTE')`),
    check('rle_cantidad_ck', sql`${t.quantity} > 0`),
    check('rle_origen_ck', sql`${t.sourceModule} in ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7')`),
    check('rle_reintegro_original_ck', sql`${t.entryType} not in ('REINTEGRO', 'CONFIRMACION') or ${t.originalEntryId} is not null`),
  ],
);

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m5Billing);
