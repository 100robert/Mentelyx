#!/usr/bin/env node
// Planes de ejecución reales de las consultas frecuentes de Mentelyx V1 (Sprint 2, actividad 5). SOLO LECTURA.
// PostgreSQL: EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) en la base indicada. MongoDB: explain('executionStats').
//   node scripts/analisis/explicar-bases.mjs [base_pg=mentelyx_carga] [base_mongo=mentelyx_carga]
// Usa los servicios LOCALES de Docker Compose (credenciales sintéticas). Los identificadores se toman de la base.
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';

const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const BASE_PG = process.argv[2] ?? 'mentelyx_carga';
const BASE_MONGO = process.argv[3] ?? 'mentelyx_carga';
const SAL = 'docs/05-evaluacion-arquitectonica/evidencias';

const pg = new Client({ connectionString: `postgres://mentelyx:mentelyx_local@127.0.0.1:55432/${BASE_PG}` });
await pg.connect();
const { rows: [m] } = await pg.query(`select g.student_id::text actor, g.id::text prep from m3_evaluations.learning_goals g
  join m3_evaluations.evaluation_attempts a on a.goal_id = g.id group by 1, 2 order by count(*) desc limit 1`);
const consultas = {
  'GET /preparaciones': ['select * from m3_evaluations.learning_goals where student_id = $1 order by created_at desc limit 200', [m.actor]],
  'avance del plan vigente': [`select p.goal_id, count(i.id), count(i.id) filter (where i.status = 'COMPLETADA') from m3_evaluations.study_plans p join m3_evaluations.study_plan_items i on i.plan_id = p.id where p.goal_id in (select id from m3_evaluations.learning_goals where student_id = $1) and p.status = 'VIGENTE' group by p.goal_id`, [m.actor]],
  'GET /preparaciones/{id}/intentos': ['select * from m3_evaluations.evaluation_attempts where student_id = $1 and goal_id = $2 order by started_at desc limit 100', [m.actor, m.prep]],
  'respuestas de un intento (calificación)': ['select * from m3_evaluations.attempt_answers where attempt_id = (select id from m3_evaluations.evaluation_attempts where goal_id = $1 limit 1)', [m.prep]],
  'GET /carpetas': [`select f.*, (select count(*) from m2_contents.folder_items fi where fi.folder_id = f.id) from m2_contents.folders f where f.owner_id = $1 and f.module = 'EXAMENES' and f.status = 'ACTIVA' order by f.name limit 500`, [m.actor]],
  'saldo de recursos (M5)': ['select * from m5_billing.resource_balances where user_id = $1', [m.actor]],
};
const planesPg = {};
for (const [nombre, [sql, params]] of Object.entries(consultas)) {
  const { rows } = await pg.query(`explain (analyze, buffers, format json) ${sql}`, params);
  const plan = rows[0]['QUERY PLAN'][0];
  const nodos = [];
  (function recorrer(n) {
    nodos.push(`${n['Node Type']}${n['Index Name'] ? ` (${n['Index Name']})` : ''}${n['Relation Name'] ? ` en ${n['Relation Name']}` : ''}`);
    for (const h of n.Plans ?? []) recorrer(h);
  })(plan.Plan);
  planesPg[nombre] = { ejecucion_ms: plan['Execution Time'], planificacion_ms: plan['Planning Time'], filas: plan.Plan['Actual Rows'], nodos };
}
const { rows: tam } = await pg.query(`select relname tabla, n_live_tup filas from pg_stat_user_tables where schemaname in ('m2_contents','m3_evaluations','m5_billing','m1_users') order by n_live_tup desc limit 12`);
await pg.end();

const mc = new MongoClient('mongodb://127.0.0.1:57017');
await mc.connect();
const db = mc.db(BASE_MONGO);
const conv = await db.collection('tutor_conversaciones').findOne({}, { projection: { ownerUserId: 1, conversationId: 1 } });
const banco = await db.collection('question_banks').findOne({}, { projection: { ownerUserId: 1, postgresEvaluationId: 1 } });
const resumen = (e) => {
  const s = e.executionStats;
  const etapas = [];
  (function r(n) {
    if (!n) return;
    etapas.push(`${n.stage}${n.indexName ? ` (${n.indexName})` : ''}`);
    r(n.inputStage);
  })(e.queryPlanner.winningPlan.queryPlan ?? e.queryPlanner.winningPlan);
  return { ejecucion_ms: s.executionTimeMillis, documentosExaminados: s.totalDocsExamined, clavesExaminadas: s.totalKeysExamined, devueltos: s.nReturned, etapas };
};
const planesMongo = {
  'GET /tutor-ia/conversaciones': resumen(await db.collection('tutor_conversaciones').find({ ownerUserId: conv.ownerUserId, deletedAt: null, expiraEn: { $gt: new Date() } }).sort({ updatedAt: -1 }).limit(50).explain('executionStats')),
  'GET /tutor-ia/conversaciones/{id}': resumen(await db.collection('tutor_conversaciones').find({ conversationId: conv.conversationId, ownerUserId: conv.ownerUserId }).explain('executionStats')),
  'GET /preparaciones/{id}/preguntas': resumen(await db.collection('question_banks').find({ postgresEvaluationId: banco.postgresEvaluationId, ownerUserId: banco.ownerUserId }).sort({ evaluationVersion: -1 }).limit(1).explain('executionStats')),
  'acceso de otro estudiante (0 docs)': resumen(await db.collection('tutor_conversaciones').find({ conversationId: conv.conversationId, ownerUserId: 'otro-estudiante' }).explain('executionStats')),
};
const conteos = { conversaciones: await db.collection('tutor_conversaciones').countDocuments(), bancos: await db.collection('question_banks').countDocuments() };
await mc.close();

mkdirSync(`${SAL}/sql`, { recursive: true });
mkdirSync(`${SAL}/mongodb`, { recursive: true });
writeFileSync(`${SAL}/sql/explain-postgres.json`, JSON.stringify({ base: BASE_PG, fecha: new Date().toISOString(), tablasMasPobladas: tam, planes: planesPg }, null, 2) + '\n');
writeFileSync(`${SAL}/mongodb/explain-mongodb.json`, JSON.stringify({ base: BASE_MONGO, fecha: new Date().toISOString(), conteos, planes: planesMongo }, null, 2) + '\n');
console.log(JSON.stringify({ postgres: planesPg, mongodb: planesMongo }, null, 1));
