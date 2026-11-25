CREATE SCHEMA "m2_contents";
--> statement-breakpoint
CREATE SCHEMA "m4_classes";
--> statement-breakpoint
CREATE SCHEMA "m3_evaluations";
--> statement-breakpoint
CREATE SCHEMA "m7_advertising";
--> statement-breakpoint
CREATE SCHEMA "m5_billing";
--> statement-breakpoint
CREATE SCHEMA "m6_ai_tutor";
--> statement-breakpoint
CREATE SCHEMA "m1_users";
--> statement-breakpoint
CREATE TABLE "m2_contents"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m2_contents"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m2_contents"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m2_contents"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m2_contents"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m4_classes"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m4_classes"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m4_classes"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m4_classes"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m4_classes"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m3_evaluations"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m3_evaluations"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m3_evaluations"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m7_advertising"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m7_advertising"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m7_advertising"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m7_advertising"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m7_advertising"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m5_billing"."commercial_plan_versions" (
	"product_code" text NOT NULL,
	"policy_version" text NOT NULL,
	"price_pen" numeric(12, 2) NOT NULL,
	"plan_features" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"valid_from" timestamp with time zone NOT NULL,
	"valid_until" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "commercial_plan_versions_product_code_policy_version_pk" PRIMARY KEY("product_code","policy_version"),
	CONSTRAINT "cpv_producto_ck" CHECK ("m5_billing"."commercial_plan_versions"."product_code" in ('EST_GRATUITO', 'EST_ESTANDAR', 'EST_PLUS', 'EST_PREMIUM', 'DOC_INICIAL', 'DOC_LIVE')),
	CONSTRAINT "cpv_precio_ck" CHECK ("m5_billing"."commercial_plan_versions"."price_pen" >= 0),
	CONSTRAINT "cpv_vigencia_ck" CHECK ("m5_billing"."commercial_plan_versions"."valid_until" is null or "m5_billing"."commercial_plan_versions"."valid_until" > "m5_billing"."commercial_plan_versions"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "m5_billing"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m5_billing"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m5_billing"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m5_billing"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m5_billing"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m5_billing"."plan_resource_limits" (
	"product_code" text NOT NULL,
	"policy_version" text NOT NULL,
	"resource_code" text NOT NULL,
	"monthly_quantity" numeric(20, 3) NOT NULL,
	"unit" text NOT NULL,
	CONSTRAINT "plan_resource_limits_product_code_policy_version_resource_code_pk" PRIMARY KEY("product_code","policy_version","resource_code"),
	CONSTRAINT "prl_recurso_ck" CHECK ("m5_billing"."plan_resource_limits"."resource_code" in ('CONSULTA_GENERAL', 'CONSULTA_TECNICA', 'RAZONAMIENTO_PROFUNDO', 'EVALUACION_EQUIVALENTE', 'ILUSTRACION_ESTANDAR', 'DOCUMENTO_EQUIVALENTE', 'ALMACENAMIENTO_BYTES', 'ALMACENAMIENTO_DOCUMENTAL_BYTES', 'ALMACENAMIENTO_VIDEO_BYTES', 'TRANSFERENCIA_AUDIOVISUAL_BYTES')),
	CONSTRAINT "prl_cantidad_ck" CHECK ("m5_billing"."plan_resource_limits"."monthly_quantity" >= 0),
	CONSTRAINT "prl_unidad_ck" CHECK ("m5_billing"."plan_resource_limits"."unit" in ('UNIDAD', 'BYTE'))
);
--> statement-breakpoint
CREATE TABLE "m5_billing"."resource_balances" (
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"resource_code" text NOT NULL,
	"product_code" text NOT NULL,
	"policy_version" text NOT NULL,
	"limit_quantity" numeric(20, 3) NOT NULL,
	"granted_extra" numeric(20, 3) DEFAULT '0' NOT NULL,
	"reserved" numeric(20, 3) DEFAULT '0' NOT NULL,
	"consumed" numeric(20, 3) DEFAULT '0' NOT NULL,
	"row_version" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "resource_balances_user_id_period_start_resource_code_pk" PRIMARY KEY("user_id","period_start","resource_code"),
	CONSTRAINT "rb_no_negativos_ck" CHECK ("m5_billing"."resource_balances"."limit_quantity" >= 0 and "m5_billing"."resource_balances"."granted_extra" >= 0 and "m5_billing"."resource_balances"."reserved" >= 0 and "m5_billing"."resource_balances"."consumed" >= 0),
	CONSTRAINT "rb_capacidad_ck" CHECK ("m5_billing"."resource_balances"."reserved" + "m5_billing"."resource_balances"."consumed" <= "m5_billing"."resource_balances"."limit_quantity" + "m5_billing"."resource_balances"."granted_extra"),
	CONSTRAINT "rb_periodo_ck" CHECK ("m5_billing"."resource_balances"."period_end" > "m5_billing"."resource_balances"."period_start")
);
--> statement-breakpoint
CREATE TABLE "m5_billing"."resource_ledger_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"resource_code" text NOT NULL,
	"entry_type" text NOT NULL,
	"quantity" numeric(20, 3) NOT NULL,
	"operation_key" text NOT NULL,
	"source_module" text NOT NULL,
	"source_ref" text,
	"original_entry_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rle_tipo_clave_uq" UNIQUE("entry_type","operation_key"),
	CONSTRAINT "rle_tipo_ck" CHECK ("m5_billing"."resource_ledger_entries"."entry_type" in ('RESERVA', 'CONFIRMACION', 'LIBERACION', 'CONCESION', 'REINTEGRO', 'AJUSTE')),
	CONSTRAINT "rle_cantidad_ck" CHECK ("m5_billing"."resource_ledger_entries"."quantity" > 0),
	CONSTRAINT "rle_origen_ck" CHECK ("m5_billing"."resource_ledger_entries"."source_module" in ('M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7')),
	CONSTRAINT "rle_reintegro_original_ck" CHECK ("m5_billing"."resource_ledger_entries"."entry_type" not in ('REINTEGRO', 'CONFIRMACION') or "m5_billing"."resource_ledger_entries"."original_entry_id" is not null)
);
--> statement-breakpoint
CREATE TABLE "m6_ai_tutor"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m6_ai_tutor"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m6_ai_tutor"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m6_ai_tutor"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m6_ai_tutor"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m1_users"."auth_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" uuid NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp with time zone,
	"refresh_token_expires_at" timestamp with time zone,
	"scope" text,
	"password_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "auth_accounts_proveedor_uq" UNIQUE("provider_id","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "m1_users"."auth_rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"count" integer NOT NULL,
	"last_request" bigint NOT NULL,
	CONSTRAINT "auth_rate_limits_key_uq" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "m1_users"."auth_verifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "m1_users"."inbox_events" (
	"source" text NOT NULL,
	"event_id" uuid NOT NULL,
	"payload_hash" char(64) NOT NULL,
	"status" text DEFAULT 'DONE' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "inbox_events_source_event_id_pk" PRIMARY KEY("source","event_id"),
	CONSTRAINT "inbox_events_status_ck" CHECK ("m1_users"."inbox_events"."status" in ('DONE'))
);
--> statement-breakpoint
CREATE TABLE "m1_users"."outbox_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"aggregate_id" uuid NOT NULL,
	"aggregate_version" bigint NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"next_retry_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "outbox_events_agregado_version_tipo_uq" UNIQUE("aggregate_id","aggregate_version","event_type"),
	CONSTRAINT "outbox_events_status_ck" CHECK ("m1_users"."outbox_events"."status" in ('PENDING', 'PUBLISHED', 'DEAD')),
	CONSTRAINT "outbox_events_attempts_ck" CHECK ("m1_users"."outbox_events"."attempts" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m1_users"."user_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_sessions_token_uq" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "m1_users"."users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"status" text DEFAULT 'ACTIVE' NOT NULL,
	"authz_version" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_uq" UNIQUE("email"),
	CONSTRAINT "users_status_ck" CHECK ("m1_users"."users"."status" in ('ACTIVE', 'SUSPENDED', 'DELETE_PENDING'))
);
--> statement-breakpoint
ALTER TABLE "m5_billing"."plan_resource_limits" ADD CONSTRAINT "plan_resource_limits_product_code_policy_version_commercial_plan_versions_product_code_policy_version_fk" FOREIGN KEY ("product_code","policy_version") REFERENCES "m5_billing"."commercial_plan_versions"("product_code","policy_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m5_billing"."resource_balances" ADD CONSTRAINT "resource_balances_product_code_policy_version_resource_code_plan_resource_limits_product_code_policy_version_resource_code_fk" FOREIGN KEY ("product_code","policy_version","resource_code") REFERENCES "m5_billing"."plan_resource_limits"("product_code","policy_version","resource_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m5_billing"."resource_ledger_entries" ADD CONSTRAINT "resource_ledger_entries_original_entry_id_resource_ledger_entries_id_fk" FOREIGN KEY ("original_entry_id") REFERENCES "m5_billing"."resource_ledger_entries"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m5_billing"."resource_ledger_entries" ADD CONSTRAINT "resource_ledger_entries_user_id_period_start_resource_code_resource_balances_user_id_period_start_resource_code_fk" FOREIGN KEY ("user_id","period_start","resource_code") REFERENCES "m5_billing"."resource_balances"("user_id","period_start","resource_code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m1_users"."auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "m1_users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m1_users"."user_sessions" ADD CONSTRAINT "user_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "m1_users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m2_contents"."outbox_events" USING btree ("next_retry_at") WHERE "m2_contents"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m4_classes"."outbox_events" USING btree ("next_retry_at") WHERE "m4_classes"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m3_evaluations"."outbox_events" USING btree ("next_retry_at") WHERE "m3_evaluations"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m7_advertising"."outbox_events" USING btree ("next_retry_at") WHERE "m7_advertising"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m5_billing"."outbox_events" USING btree ("next_retry_at") WHERE "m5_billing"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "rb_usuario_vigencia_idx" ON "m5_billing"."resource_balances" USING btree ("user_id","resource_code","period_start","period_end");--> statement-breakpoint
CREATE INDEX "rle_saldo_idx" ON "m5_billing"."resource_ledger_entries" USING btree ("user_id","period_start","resource_code");--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m6_ai_tutor"."outbox_events" USING btree ("next_retry_at") WHERE "m6_ai_tutor"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "auth_accounts_usuario_idx" ON "m1_users"."auth_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "auth_verifications_identificador_idx" ON "m1_users"."auth_verifications" USING btree ("identifier","expires_at");--> statement-breakpoint
CREATE INDEX "outbox_events_pendientes_idx" ON "m1_users"."outbox_events" USING btree ("next_retry_at") WHERE "m1_users"."outbox_events"."status" = 'PENDING';--> statement-breakpoint
CREATE INDEX "user_sessions_usuario_expira_idx" ON "m1_users"."user_sessions" USING btree ("user_id","expires_at");