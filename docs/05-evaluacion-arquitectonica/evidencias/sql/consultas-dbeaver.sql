-- Análisis de PostgreSQL de Mentelyx V1 (Sprint 2, actividad 5). Consultas de SOLO LECTURA, reproducibles en DBeaver.
-- Conexión local: host 127.0.0.1, puerto 55432, base `mentelyx` (o `mentelyx_carga` para la base de pruebas de carga),
-- usuario y contraseña SINTÉTICOS de docker-compose.yml. Neon: crear la conexión en DBeaver con la URL DIRECTA (host sin
-- «-pooler») guardada en backend/.secretos/ — nunca pegarla en este archivo ni en capturas. SSL: require.
-- Los EXPLAIN ANALYZE ejecutan la consulta: se usan solo con SELECT. Reemplazar :actor y :prep por valores de prueba.

-- 1. Inventario: 7 esquemas de módulo + drizzle, tablas por esquema y tamaño.
select schemaname as esquema, count(*) as tablas, pg_size_pretty(sum(pg_total_relation_size(format('%I.%I', schemaname, tablename)))) as tamano
from pg_tables where schemaname ~ '^(m[1-7]_|drizzle)' group by 1 order by 1;

-- 2. Historial de migraciones (debe haber 8: 0000–0007).
select id, hash, to_timestamp(created_at / 1000) as aplicada from drizzle.__drizzle_migrations order by id;

-- 3. Índices de los flujos V1 (carpetas, preparaciones, intentos, tarjetas) y del RAG.
select schemaname, tablename, indexname, indexdef from pg_indexes
where schemaname in ('m2_contents', 'm3_evaluations', 'm6_ai_tutor') order by 1, 2, 3;

-- 4. Restricciones (CHECK, UNIQUE, FK, EXCLUDE) por módulo.
select n.nspname as esquema, c.relname as tabla, k.conname as restriccion,
       case k.contype when 'c' then 'CHECK' when 'u' then 'UNIQUE' when 'f' then 'FK' when 'x' then 'EXCLUDE' when 'p' then 'PK' end as tipo,
       pg_get_constraintdef(k.oid) as definicion
from pg_constraint k join pg_class c on c.oid = k.conrelid join pg_namespace n on n.oid = c.relnamespace
where n.nspname ~ '^m[1-7]_' order by 1, 2, 4;

-- 5. Triggers de M5 (libro solo inserción y coherencia saldo = libro) y EXCLUDE contra periodos superpuestos.
select tgname, c.relname, pg_get_triggerdef(t.oid) from pg_trigger t join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'm5_billing' and not t.tgisinternal;
select conname, pg_get_constraintdef(oid) from pg_constraint where contype = 'x';

-- 6. Conexiones activas por base y estado (pooling: cada petición del Worker abre su conexión por WebSocket).
select datname, state, count(*) from pg_stat_activity where datname like 'mentelyx%' group by 1, 2 order by 1, 2;
show max_connections;

-- 7. Planes de las consultas frecuentes (sustituir los identificadores).
-- 7.1 Lista de preparaciones de una cuenta (GET /preparaciones).
explain (analyze, buffers) select * from m3_evaluations.learning_goals where student_id = :actor order by created_at desc limit 200;
-- 7.2 Avance del plan vigente (resumen de cada preparación).
explain (analyze, buffers)
select p.goal_id, count(i.id), count(i.id) filter (where i.status = 'COMPLETADA')
from m3_evaluations.study_plans p join m3_evaluations.study_plan_items i on i.plan_id = p.id
where p.goal_id in (select id from m3_evaluations.learning_goals where student_id = :actor) and p.status = 'VIGENTE' group by p.goal_id;
-- 7.3 Historial de intentos de una preparación (GET /preparaciones/{id}/intentos).
explain (analyze, buffers) select * from m3_evaluations.evaluation_attempts where student_id = :actor and goal_id = :prep order by started_at desc limit 100;
-- 7.4 Carpetas de un módulo con su número de elementos (GET /carpetas).
explain (analyze, buffers)
select f.*, (select count(*) from m2_contents.folder_items fi where fi.folder_id = f.id)
from m2_contents.folders f where f.owner_id = :actor and f.module = 'EXAMENES' and f.status = 'ACTIVA' order by f.name limit 500;
-- 7.5 Saldo de recursos del periodo (reserva de cuota de M5).
explain (analyze, buffers) select * from m5_billing.resource_balances where user_id = :actor;

-- 8. Integridad: un intento calificado siempre tiene nota, máximo y resultados (debe devolver 0 filas).
select id from m3_evaluations.evaluation_attempts where status = 'CALIFICADO' and (score is null or max_score is null or results is null);
-- 9. Aislamiento: ningún intento apunta a una preparación de otro estudiante (debe devolver 0 filas).
select a.id from m3_evaluations.evaluation_attempts a join m3_evaluations.learning_goals g on g.id = a.goal_id where a.student_id <> g.student_id;
-- 10. Conciliación M5: saldo = libro para cada periodo (debe devolver 0 filas).
select b.user_id, b.resource_code from m5_billing.resource_balances b
where b.reserved <> coalesce((select sum(case e.entry_type when 'RESERVA' then e.quantity when 'CONFIRMACION' then -e.quantity when 'LIBERACION' then -e.quantity else 0 end)
  from m5_billing.resource_ledger_entries e where e.user_id = b.user_id and e.period_start = b.period_start and e.resource_code = b.resource_code), 0);
