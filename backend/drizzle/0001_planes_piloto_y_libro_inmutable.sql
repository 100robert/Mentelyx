-- Migración personalizada creada con `drizzle-kit generate --custom` (ADR-075: Drizzle Kit sigue siendo la única autoridad).
-- 1) Versión comercial de piloto «piloto-2026-11-20»: precios y recursos de la instrucción maestra, secciones 14, 15.1 y 15.2
--    (ADR-080), como configuración versionada. Un cambio de valores exige una versión nueva, nunca editar esta.
--    Supuesto documentado: MB y GB se expresan en unidades SI (1 MB = 10^6 bytes; 1 GB = 10^9 bytes).
--    DOC_LIVE incluye las capacidades profesionales del plan Inicial (IM 15.2); su saldo audiovisual llega en I-7.
-- 2) El libro de recursos es de solo inserción (persistencia, sección 7.9).
INSERT INTO "m5_billing"."commercial_plan_versions" ("product_code", "policy_version", "price_pen", "plan_features", "valid_from") VALUES
  ('EST_GRATUITO', 'piloto-2026-11-20', 0.00, '{}'::jsonb, '2026-11-20T00:00:00-05:00'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 39.90, '{}'::jsonb, '2026-11-20T00:00:00-05:00'),
  ('EST_PLUS', 'piloto-2026-11-20', 59.90, '{}'::jsonb, '2026-11-20T00:00:00-05:00'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 89.90, '{}'::jsonb, '2026-11-20T00:00:00-05:00'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 55.00, '{}'::jsonb, '2026-11-20T00:00:00-05:00'),
  ('DOC_LIVE', 'piloto-2026-11-20', 100.00, '{}'::jsonb, '2026-11-20T00:00:00-05:00');
--> statement-breakpoint
INSERT INTO "m5_billing"."plan_resource_limits" ("product_code", "policy_version", "resource_code", "monthly_quantity", "unit") VALUES
  ('EST_GRATUITO', 'piloto-2026-11-20', 'CONSULTA_GENERAL', 60, 'UNIDAD'),
  ('EST_GRATUITO', 'piloto-2026-11-20', 'CONSULTA_TECNICA', 15, 'UNIDAD'),
  ('EST_GRATUITO', 'piloto-2026-11-20', 'RAZONAMIENTO_PROFUNDO', 2, 'UNIDAD'),
  ('EST_GRATUITO', 'piloto-2026-11-20', 'EVALUACION_EQUIVALENTE', 3, 'UNIDAD'),
  ('EST_GRATUITO', 'piloto-2026-11-20', 'ILUSTRACION_ESTANDAR', 4, 'UNIDAD'),
  ('EST_GRATUITO', 'piloto-2026-11-20', 'ALMACENAMIENTO_BYTES', 500000000, 'BYTE'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 'CONSULTA_GENERAL', 250, 'UNIDAD'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 'CONSULTA_TECNICA', 100, 'UNIDAD'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 'RAZONAMIENTO_PROFUNDO', 20, 'UNIDAD'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 'EVALUACION_EQUIVALENTE', 10, 'UNIDAD'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 'ILUSTRACION_ESTANDAR', 10, 'UNIDAD'),
  ('EST_ESTANDAR', 'piloto-2026-11-20', 'ALMACENAMIENTO_BYTES', 2000000000, 'BYTE'),
  ('EST_PLUS', 'piloto-2026-11-20', 'CONSULTA_GENERAL', 450, 'UNIDAD'),
  ('EST_PLUS', 'piloto-2026-11-20', 'CONSULTA_TECNICA', 200, 'UNIDAD'),
  ('EST_PLUS', 'piloto-2026-11-20', 'RAZONAMIENTO_PROFUNDO', 50, 'UNIDAD'),
  ('EST_PLUS', 'piloto-2026-11-20', 'EVALUACION_EQUIVALENTE', 20, 'UNIDAD'),
  ('EST_PLUS', 'piloto-2026-11-20', 'ILUSTRACION_ESTANDAR', 25, 'UNIDAD'),
  ('EST_PLUS', 'piloto-2026-11-20', 'ALMACENAMIENTO_BYTES', 5000000000, 'BYTE'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 'CONSULTA_GENERAL', 750, 'UNIDAD'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 'CONSULTA_TECNICA', 350, 'UNIDAD'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 'RAZONAMIENTO_PROFUNDO', 100, 'UNIDAD'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 'EVALUACION_EQUIVALENTE', 40, 'UNIDAD'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 'ILUSTRACION_ESTANDAR', 50, 'UNIDAD'),
  ('EST_PREMIUM', 'piloto-2026-11-20', 'ALMACENAMIENTO_BYTES', 10000000000, 'BYTE'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'DOCUMENTO_EQUIVALENTE', 30, 'UNIDAD'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'CONSULTA_GENERAL', 100, 'UNIDAD'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'CONSULTA_TECNICA', 50, 'UNIDAD'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'RAZONAMIENTO_PROFUNDO', 10, 'UNIDAD'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'ILUSTRACION_ESTANDAR', 30, 'UNIDAD'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'ALMACENAMIENTO_DOCUMENTAL_BYTES', 10000000000, 'BYTE'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'ALMACENAMIENTO_VIDEO_BYTES', 5000000000, 'BYTE'),
  ('DOC_INICIAL', 'piloto-2026-11-20', 'TRANSFERENCIA_AUDIOVISUAL_BYTES', 10000000000, 'BYTE'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'DOCUMENTO_EQUIVALENTE', 30, 'UNIDAD'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'CONSULTA_GENERAL', 100, 'UNIDAD'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'CONSULTA_TECNICA', 50, 'UNIDAD'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'RAZONAMIENTO_PROFUNDO', 10, 'UNIDAD'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'ILUSTRACION_ESTANDAR', 30, 'UNIDAD'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'ALMACENAMIENTO_DOCUMENTAL_BYTES', 10000000000, 'BYTE'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'ALMACENAMIENTO_VIDEO_BYTES', 5000000000, 'BYTE'),
  ('DOC_LIVE', 'piloto-2026-11-20', 'TRANSFERENCIA_AUDIOVISUAL_BYTES', 10000000000, 'BYTE');
--> statement-breakpoint
CREATE FUNCTION "m5_billing"."impedir_cambio_libro"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'resource_ledger_entries es de solo inserción (%).', TG_OP USING ERRCODE = 'restrict_violation';
END;
$$;
--> statement-breakpoint
CREATE TRIGGER "resource_ledger_entries_solo_insercion" BEFORE UPDATE OR DELETE ON "m5_billing"."resource_ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "m5_billing"."impedir_cambio_libro"();
--> statement-breakpoint
CREATE TRIGGER "resource_ledger_entries_sin_truncate" BEFORE TRUNCATE ON "m5_billing"."resource_ledger_entries"
  FOR EACH STATEMENT EXECUTE FUNCTION "m5_billing"."impedir_cambio_libro"();
