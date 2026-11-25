import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  char,
  check,
  customType,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgSchema,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
  vector,
} from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/**
 * Esquema propietario de M6 (persistencia, secciones 7.6 y 14.3). Índice RAG híbrido: `embedding vector(1024)` de
 * BGE-M3 con HNSW coseno parcial por modelo (ADR-076; RAG, sección 9) y `tsvector` en español; los índices creados
 * sin modelo de embeddings quedan en modo `lexico` (`embedding` nulo, degradación). Presupuestos técnicos (SC-11) y
 * registro de uso (SC-03). Las conversaciones viven en MongoDB (`tutor_conversaciones`).
 * Requiere la extensión `vector` (migración 0003).
 */
export const m6AiTutor = pgSchema('m6_ai_tutor');
const ahora = (nombre: string) => timestamp(nombre, { withTimezone: true }).notNull().defaultNow();
const tsvector = customType<{ data: string }>({ dataType: () => 'tsvector' });
const usd = (nombre: string) => numeric(nombre, { precision: 18, scale: 6 });
const ALCANCES = sql`('CATALOGO', 'LICENCIA', 'PRIVADO', 'COMPARTIDO', 'PUBLICO')`;

export const ragIndexDocuments = m6AiTutor.table(
  'rag_index_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id').notNull(),
    version: integer('version').notNull(),
    scope: text('scope').notNull(),
    ownerId: uuid('owner_id'),
    estado: text('estado').notNull(),
    etapaCompletada: text('etapa_completada'),
    intentos: integer('intentos').notNull().default(0),
    errorCode: text('error_code'),
    chunkerVersion: text('chunker_version').notNull(),
    embeddingModel: text('embedding_model').notNull(),
    generation: integer('generation').notNull(),
    chunksTotal: integer('chunks_total'),
    costoUsd: usd('costo_usd'),
    accessVersion: bigint('access_version', { mode: 'number' }).notNull(),
    solicitadoEn: ahora('solicitado_en'),
    vigenteDesde: timestamp('vigente_desde', { withTimezone: true }),
    revocadoEn: timestamp('revocado_en', { withTimezone: true }),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    unique('rag_index_documents_generacion_uq').on(t.documentId, t.version, t.embeddingModel, t.chunkerVersion, t.generation),
    unique('rag_index_documents_doc_id_uq').on(t.documentId, t.id),
    unique('rag_index_documents_ref_uq').on(t.id, t.documentId, t.version, t.embeddingModel, t.chunkerVersion),
    index('rag_index_estado').on(t.estado, t.solicitadoEn),
    check('rag_index_documents_version_ck', sql`${t.version} > 0`),
    check('rag_index_documents_scope_ck', sql`${t.scope} in ${ALCANCES}`),
    check(
      'rag_index_documents_estado_ck',
      sql`${t.estado} in ('SOLICITADO', 'EXTRAYENDO', 'FRAGMENTANDO', 'EMBEDDING', 'LISTO', 'ACTIVO', 'FALLIDO', 'REVOCADO', 'REEMPLAZADO', 'PURGADO')`,
    ),
    check('rag_index_documents_intentos_ck', sql`${t.intentos} >= 0`),
    check('rag_index_documents_generation_ck', sql`${t.generation} > 0`),
    check('rag_index_documents_privado_ck', sql`${t.scope} <> 'PRIVADO' or ${t.ownerId} is not null`),
  ],
);

export const ragDocumentChunks = m6AiTutor.table(
  'rag_document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    indexId: uuid('index_id').notNull(),
    documentId: uuid('document_id').notNull(),
    version: integer('version').notNull(),
    chunkIndex: integer('chunk_index').notNull(),
    scope: text('scope').notNull(),
    ownerId: uuid('owner_id'),
    courseId: uuid('course_id'),
    level: text('level'),
    estado: text('estado').notNull(),
    vigente: boolean('vigente').notNull().default(false),
    texto: text('texto').notNull(),
    ancla: jsonb('ancla').notNull(),
    titulo: varchar('titulo', { length: 300 }).notNull(),
    tokens: integer('tokens').notNull(),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    chunkerVersion: text('chunker_version').notNull(),
    embeddingModel: text('embedding_model').notNull(),
    idioma: varchar('idioma', { length: 8 }).notNull().default('es'),
    senalInyeccion: boolean('senal_inyeccion').notNull().default(false),
    embedding: vector('embedding', { dimensions: 1024 }),
    tsv: tsvector('tsv').generatedAlwaysAs(sql`to_tsvector('spanish'::regconfig, texto)`),
    createdAt: ahora('created_at'),
  },
  (t) => [
    unique('rag_document_chunks_index_chunk_uq').on(t.indexId, t.chunkIndex),
    foreignKey({
      name: 'rag_document_chunks_index_fk',
      columns: [t.indexId, t.documentId, t.version, t.embeddingModel, t.chunkerVersion],
      foreignColumns: [ragIndexDocuments.id, ragIndexDocuments.documentId, ragIndexDocuments.version, ragIndexDocuments.embeddingModel, ragIndexDocuments.chunkerVersion],
    }),
    index('rag_chunks_tsv').using('gin', t.tsv),
    // HNSW parcial por espacio vectorial (RAG, sección 9): filtrar el modelo después del ANN no haría comparables
    // vectores de espacios distintos.
    index('rag_chunks_hnsw_bgem3_1024')
      .using('hnsw', t.embedding.op('vector_cosine_ops'))
      .with({ m: 16, ef_construction: 64 })
      .where(sql`${t.embeddingModel} = 'bge-m3' and ${t.embedding} is not null`),
    index('rag_chunks_doc').on(t.documentId, t.estado),
    index('rag_chunks_privado').on(t.ownerId).where(sql`${t.scope} = 'PRIVADO'`),
    check('rag_document_chunks_index_ck', sql`${t.chunkIndex} >= 0`),
    check('rag_document_chunks_scope_ck', sql`${t.scope} in ${ALCANCES}`),
    check('rag_document_chunks_estado_ck', sql`${t.estado} in ('ACTIVO', 'REEMPLAZADO', 'REVOCADO')`),
    check('rag_document_chunks_tokens_ck', sql`${t.tokens} >= 0`),
    check('privado_con_propietario', sql`${t.scope} <> 'PRIVADO' or ${t.ownerId} is not null`),
    check('vector_segun_modelo', sql`(${t.embeddingModel} = 'lexico') = (${t.embedding} is null)`),
  ],
);

/** SC-11: presupuesto técnico global y por proveedor, por periodo mensual. La admisión es un UPDATE condicional. */
export const aiBudgets = m6AiTutor.table(
  'ai_budgets',
  {
    scope: text('scope').notNull(),
    periodStart: date('period_start').notNull(),
    periodEnd: date('period_end').notNull(),
    softLimitUsd: usd('soft_limit_usd').notNull(),
    hardLimitUsd: usd('hard_limit_usd').notNull(),
    reservedUsd: usd('reserved_usd').notNull().default('0'),
    spentUsd: usd('spent_usd').notNull().default('0'),
    thresholds: jsonb('thresholds').notNull(),
    policyVersion: text('policy_version').notNull(),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    unique('ai_budgets_scope_period_uq').on(t.scope, t.periodStart),
    check('ai_budgets_limites_ck', sql`${t.hardLimitUsd} >= ${t.softLimitUsd} and ${t.softLimitUsd} >= 0`),
    check('ai_budgets_no_negativos_ck', sql`${t.reservedUsd} >= 0 and ${t.spentUsd} >= 0`),
    check('ai_budgets_periodo_ck', sql`${t.periodEnd} > ${t.periodStart}`),
  ],
);

/** SC-03: medición auditable por operación; sin texto de la consulta ni de la respuesta (D0/D1/D2, nunca D3). */
export const aiUsageRecords = m6AiTutor.table(
  'ai_usage_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    operationKey: text('operation_key').notNull().unique('ai_usage_records_operation_key_uq'),
    requestHash: char('request_hash', { length: 64 }).notNull(),
    userId: uuid('user_id').notNull(),
    billingPeriod: date('billing_period').notNull(),
    usageDay: date('usage_day').notNull(),
    routeId: text('route_id').notNull(),
    routeVersion: text('route_version').notNull(),
    provider: text('provider'),
    model: text('model'),
    intent: text('intent').notNull(),
    dataClass: text('data_class').notNull(),
    status: text('status').notNull(),
    resourceCode: text('resource_code').notNull(),
    resourceReservationKey: text('resource_reservation_key').notNull(),
    billingSource: text('billing_source').notNull().default('MENTELYX'),
    reservedBudgetUsd: usd('reserved_budget_usd').notNull(),
    actualCostUsd: usd('actual_cost_usd'),
    pendingReconciliation: boolean('pending_reconciliation').notNull().default(false),
    inputTokens: bigint('input_tokens', { mode: 'number' }),
    outputTokens: bigint('output_tokens', { mode: 'number' }),
    latencyMs: bigint('latency_ms', { mode: 'number' }),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    resultRef: text('result_ref'),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    index('ai_usage_records_usuario_periodo_idx').on(t.userId, t.billingPeriod, t.status),
    check('ai_usage_records_status_ck', sql`${t.status} in ('EN_CURSO', 'RESPONDIDA', 'FALLIDA', 'CANCELADA', 'INCIERTA', 'RECHAZADA_CUOTA')`),
    check('ai_usage_records_data_class_ck', sql`${t.dataClass} in ('D0', 'D1', 'D2')`),
    check('ai_usage_records_billing_ck', sql`${t.billingSource} in ('MENTELYX', 'BYOK')`),
    check('ai_usage_records_costos_ck', sql`${t.reservedBudgetUsd} >= 0 and (${t.actualCostUsd} is null or ${t.actualCostUsd} >= 0)`),
  ],
);

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m6AiTutor);
