import { sql } from 'drizzle-orm';
import { boolean, check, date, index, integer, jsonb, numeric, pgSchema, primaryKey, text, timestamp, unique, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/** Esquema propietario de M3 (persistencia, sección 7.3) con outbox e inbox. */
export const m3Evaluations = pgSchema('m3_evaluations');

const ahora = (nombre: string) => timestamp(nombre, { withTimezone: true }).notNull().defaultNow();

export const learningGoals = m3Evaluations.table(
  'learning_goals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id').notNull(),
    goalSource: text('goal_source', { enum: ['PERSONAL', 'FUENTES'] }).notNull(),
    sourceRefs: jsonb('source_refs').notNull(),
    targetDate: date('target_date'),
    weeklyMinutes: integer('weekly_minutes').notNull(),
    operationKey: varchar('operation_key', { length: 100 }).notNull(),
    requestHash: text('request_hash').notNull(),
    status: text('status', { enum: ['ACTIVO', 'CUMPLIDO', 'ABANDONADO'] }).notNull().default('ACTIVO'),
    /** V1 (ADR-093, API 12.2): varias preparaciones por cuenta con nombre y asignatura. Nulos en las anteriores a 0007. */
    name: varchar('name', { length: 120 }),
    subject: varchar('subject', { length: 120 }),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    unique('learning_goals_student_operation_uq').on(t.studentId, t.operationKey),
    // 0007 sustituye el índice único parcial «una ACTIVO por estudiante» (0006) por uno de consulta: ADR-093 pide varias.
    index('learning_goals_student_status_idx').on(t.studentId, t.status, t.createdAt),
    check('learning_goals_source_ck', sql`${t.goalSource} in ('PERSONAL', 'FUENTES')`),
    check('learning_goals_status_ck', sql`${t.status} in ('ACTIVO', 'CUMPLIDO', 'ABANDONADO')`),
    check('learning_goals_weekly_minutes_ck', sql`${t.weeklyMinutes} between 15 and 1680`),
  ],
);

export const studyPlans = m3Evaluations.table(
  'study_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    goalId: uuid('goal_id').notNull().references(() => learningGoals.id),
    version: integer('version').notNull(),
    ruleVersion: text('rule_version').notNull(),
    inputsHash: text('inputs_hash').notNull(),
    generatedFrom: jsonb('generated_from').notNull(),
    status: text('status', { enum: ['VIGENTE', 'REEMPLAZADO'] }).notNull().default('VIGENTE'),
    createdAt: ahora('created_at'),
  },
  (t) => [
    unique('study_plans_goal_version_uq').on(t.goalId, t.version),
    uniqueIndex('study_plans_current_goal_uq').on(t.goalId).where(sql`${t.status} = 'VIGENTE'`),
    check('study_plans_status_ck', sql`${t.status} in ('VIGENTE', 'REEMPLAZADO')`),
  ],
);

export const studyPlanItems = m3Evaluations.table(
  'study_plan_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    planId: uuid('plan_id').notNull().references(() => studyPlans.id),
    itemOrder: integer('item_order').notNull(),
    areaCode: varchar('area_code', { length: 60 }).notNull(),
    topicCode: varchar('topic_code', { length: 60 }).notNull(),
    title: varchar('title', { length: 160 }).notNull(),
    activityType: text('activity_type', { enum: ['LECCION', 'PRACTICA', 'SIMULACRO', 'REPASO'] }).notNull(),
    dueDate: date('due_date'),
    estimatedMinutes: integer('estimated_minutes').notNull(),
    status: text('status', { enum: ['PENDIENTE', 'COMPLETADA', 'OMITIDA'] }).notNull().default('PENDIENTE'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (t) => [
    unique('study_plan_items_order_uq').on(t.planId, t.itemOrder),
    index('study_plan_items_plan_status_idx').on(t.planId, t.status),
    check('study_plan_items_type_ck', sql`${t.activityType} in ('LECCION', 'PRACTICA', 'SIMULACRO', 'REPASO')`),
    check('study_plan_items_status_ck', sql`${t.status} in ('PENDIENTE', 'COMPLETADA', 'OMITIDA')`),
    check('study_plan_items_minutes_ck', sql`${t.estimatedMinutes} > 0`),
    check('study_plan_items_completed_ck', sql`${t.status} <> 'COMPLETADA' or ${t.completedAt} is not null`),
  ],
);

/**
 * Intentos de práctica, simulacro y diagnóstico (persistencia, 7.3: `evaluation_attempts`). En V1 el intento pertenece a
 * una preparación (no a una evaluación de catálogo) y fija la versión del banco (Mongo `question_banks`) con la que se
 * califica. La nota oficial la calcula M3 al entregar, con la hora del servidor; un intento calificado es inmutable.
 */
export const evaluationAttempts = m3Evaluations.table(
  'evaluation_attempts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id').notNull(),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => learningGoals.id),
    mode: text('mode', { enum: ['PRACTICA', 'SIMULACRO', 'DIAGNOSTICO'] }).notNull(),
    bankVersion: integer('bank_version').notNull(),
    questionIds: jsonb('question_ids').notNull(),
    /** Permutaciones de la proyección (relación): se aplican al calificar; nunca salen del servidor. */
    projection: jsonb('projection').notNull().default(sql`'{}'::jsonb`),
    operationKey: varchar('operation_key', { length: 100 }).notNull(),
    requestHash: text('request_hash').notNull(),
    status: text('status', { enum: ['EN_CURSO', 'CALIFICADO'] }).notNull().default('EN_CURSO'),
    startedAt: ahora('started_at'),
    deadlineAt: timestamp('deadline_at', { withTimezone: true }),
    submittedAt: timestamp('submitted_at', { withTimezone: true }),
    lateSubmission: boolean('late_submission'),
    score: numeric('score', { precision: 10, scale: 4 }),
    maxScore: numeric('max_score', { precision: 10, scale: 4 }),
    pendingCount: integer('pending_count'),
    results: jsonb('results'),
    scoringVersion: text('scoring_version'),
    submitKey: varchar('submit_key', { length: 100 }),
  },
  (t) => [
    unique('evaluation_attempts_student_operation_uq').on(t.studentId, t.operationKey),
    index('evaluation_attempts_student_goal_idx').on(t.studentId, t.goalId, t.startedAt),
    check('evaluation_attempts_mode_ck', sql`${t.mode} in ('PRACTICA', 'SIMULACRO', 'DIAGNOSTICO')`),
    check('evaluation_attempts_status_ck', sql`${t.status} in ('EN_CURSO', 'CALIFICADO')`),
    check('evaluation_attempts_deadline_ck', sql`${t.deadlineAt} is null or ${t.deadlineAt} > ${t.startedAt}`),
    check(
      'evaluation_attempts_graded_ck',
      sql`${t.status} <> 'CALIFICADO' or (${t.submittedAt} is not null and ${t.score} is not null and ${t.maxScore} is not null and ${t.results} is not null and ${t.submitKey} is not null)`,
    ),
    check('evaluation_attempts_score_ck', sql`${t.score} is null or (${t.score} >= 0 and ${t.score} <= ${t.maxScore})`),
  ],
);

/** Respuestas guardadas durante el intento: la última por pregunta, con revisión creciente (PK intento+pregunta). */
export const attemptAnswers = m3Evaluations.table(
  'attempt_answers',
  {
    attemptId: uuid('attempt_id')
      .notNull()
      .references(() => evaluationAttempts.id),
    questionId: varchar('question_id', { length: 32 }).notNull(),
    answer: jsonb('answer').notNull(),
    revision: integer('revision').notNull().default(1),
    checked: boolean('checked').notNull().default(false),
    savedAt: ahora('saved_at'),
  },
  (t) => [primaryKey({ columns: [t.attemptId, t.questionId] }), check('attempt_answers_revision_ck', sql`${t.revision} > 0`)],
);

/** Tarjetas de estudio con repetición espaciada calculada por el servidor (API 12.9; regla `sm2-mentelyx-v1`). */
export const studyCards = m3Evaluations.table(
  'study_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    studentId: uuid('student_id').notNull(),
    goalId: uuid('goal_id')
      .notNull()
      .references(() => learningGoals.id),
    topic: varchar('topic', { length: 120 }),
    front: varchar('front', { length: 500 }).notNull(),
    back: varchar('back', { length: 1500 }).notNull(),
    origin: text('origin', { enum: ['persona', 'tutor', 'material'] }).notNull(),
    operationKey: varchar('operation_key', { length: 100 }).notNull(),
    dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
    intervalDays: integer('interval_days').notNull().default(0),
    ease: numeric('ease', { precision: 4, scale: 2 }).notNull().default('2.50'),
    repetitions: integer('repetitions').notNull().default(0),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    unique('study_cards_student_operation_uq').on(t.studentId, t.operationKey),
    index('study_cards_goal_due_idx').on(t.studentId, t.goalId, t.dueAt),
    check('study_cards_origin_ck', sql`${t.origin} in ('persona', 'tutor', 'material')`),
    check('study_cards_interval_ck', sql`${t.intervalDays} >= 0 and ${t.repetitions} >= 0 and ${t.ease} between 1.30 and 3.00`),
  ],
);

export const cardReviews = m3Evaluations.table(
  'card_reviews',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cardId: uuid('card_id')
      .notNull()
      .references(() => studyCards.id),
    rating: text('rating', { enum: ['OTRA_VEZ', 'DIFICIL', 'BIEN', 'FACIL'] }).notNull(),
    operationKey: varchar('operation_key', { length: 100 }).notNull(),
    reviewedAt: ahora('reviewed_at'),
    nextDueAt: timestamp('next_due_at', { withTimezone: true }).notNull(),
    ruleVersion: text('rule_version').notNull(),
  },
  (t) => [unique('card_reviews_card_operation_uq').on(t.cardId, t.operationKey), check('card_reviews_rating_ck', sql`${t.rating} in ('OTRA_VEZ', 'DIFICIL', 'BIEN', 'FACIL')`)],
);

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m3Evaluations);
