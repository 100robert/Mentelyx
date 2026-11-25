CREATE TABLE "m2_contents"."content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid,
	"owner_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"title" varchar(300) NOT NULL,
	"source_format" text,
	"visibility" text DEFAULT 'PRIVADO' NOT NULL,
	"current_version" integer,
	"access_version" bigint DEFAULT 1 NOT NULL,
	"status" text DEFAULT 'ACTIVO' NOT NULL,
	"creation_operation_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_items_creation_operation_key_uq" UNIQUE("creation_operation_key"),
	CONSTRAINT "content_items_type_ck" CHECK ("m2_contents"."content_items"."item_type" in ('LESSON', 'STUDIO_PROJECT', 'PDF_ASSET', 'PERSONAL_NOTE', 'PRIVATE_SOURCE', 'CANVAS', 'NOTEBOOK', 'RESOURCE')),
	CONSTRAINT "content_items_format_ck" CHECK ("m2_contents"."content_items"."source_format" is null or "m2_contents"."content_items"."source_format" in ('PDF', 'PDF_ESCANEADO', 'PPTX', 'DOCX', 'TXT', 'MD', 'IMAGEN')),
	CONSTRAINT "content_items_visibility_ck" CHECK ("m2_contents"."content_items"."visibility" in ('PRIVADO', 'COMPARTIDO', 'PUBLICO', 'INSTITUCIONAL')),
	CONSTRAINT "content_items_status_ck" CHECK ("m2_contents"."content_items"."status" in ('ACTIVO', 'ARCHIVADO', 'DELETE_PENDING'))
);
--> statement-breakpoint
CREATE TABLE "m2_contents"."content_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"mongo_doc_id" text,
	"r2_storage_key" text,
	"content_hash" char(64) NOT NULL,
	"byte_size" bigint NOT NULL,
	"schema_version" text NOT NULL,
	"state" text DEFAULT 'PENDING' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "content_versions_content_version_uq" UNIQUE("content_id","version_number"),
	CONSTRAINT "content_versions_version_ck" CHECK ("m2_contents"."content_versions"."version_number" > 0),
	CONSTRAINT "content_versions_bytes_ck" CHECK ("m2_contents"."content_versions"."byte_size" > 0),
	CONSTRAINT "content_versions_state_ck" CHECK ("m2_contents"."content_versions"."state" in ('PENDING', 'STORED', 'PUBLISHED', 'RETIRED', 'DELETE_PENDING')),
	CONSTRAINT "content_versions_referencia_ck" CHECK ("m2_contents"."content_versions"."mongo_doc_id" is not null or "m2_contents"."content_versions"."r2_storage_key" is not null)
);
--> statement-breakpoint
CREATE TABLE "m2_contents"."study_space_sources" (
	"space_id" uuid NOT NULL,
	"content_id" uuid NOT NULL,
	"selected" boolean DEFAULT true NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_space_sources_space_id_content_id_pk" PRIMARY KEY("space_id","content_id")
);
--> statement-breakpoint
CREATE TABLE "m2_contents"."study_spaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"title" varchar(200) NOT NULL,
	"education_level" text,
	"status" text DEFAULT 'ACTIVO' NOT NULL,
	"storage_bytes" bigint DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_spaces_status_ck" CHECK ("m2_contents"."study_spaces"."status" in ('ACTIVO', 'ARCHIVADO', 'DELETE_PENDING')),
	CONSTRAINT "study_spaces_storage_ck" CHECK ("m2_contents"."study_spaces"."storage_bytes" >= 0)
);
--> statement-breakpoint
CREATE TABLE "m6_ai_tutor"."ai_budgets" (
	"scope" text NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"soft_limit_usd" numeric(18, 6) NOT NULL,
	"hard_limit_usd" numeric(18, 6) NOT NULL,
	"reserved_usd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"spent_usd" numeric(18, 6) DEFAULT '0' NOT NULL,
	"thresholds" jsonb NOT NULL,
	"policy_version" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_budgets_scope_period_uq" UNIQUE("scope","period_start"),
	CONSTRAINT "ai_budgets_limites_ck" CHECK ("m6_ai_tutor"."ai_budgets"."hard_limit_usd" >= "m6_ai_tutor"."ai_budgets"."soft_limit_usd" and "m6_ai_tutor"."ai_budgets"."soft_limit_usd" >= 0),
	CONSTRAINT "ai_budgets_no_negativos_ck" CHECK ("m6_ai_tutor"."ai_budgets"."reserved_usd" >= 0 and "m6_ai_tutor"."ai_budgets"."spent_usd" >= 0),
	CONSTRAINT "ai_budgets_periodo_ck" CHECK ("m6_ai_tutor"."ai_budgets"."period_end" > "m6_ai_tutor"."ai_budgets"."period_start")
);
--> statement-breakpoint
CREATE TABLE "m6_ai_tutor"."ai_usage_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"operation_key" text NOT NULL,
	"request_hash" char(64) NOT NULL,
	"user_id" uuid NOT NULL,
	"billing_period" date NOT NULL,
	"usage_day" date NOT NULL,
	"route_id" text NOT NULL,
	"route_version" text NOT NULL,
	"provider" text,
	"model" text,
	"intent" text NOT NULL,
	"data_class" text NOT NULL,
	"status" text NOT NULL,
	"resource_code" text NOT NULL,
	"resource_reservation_key" text NOT NULL,
	"billing_source" text DEFAULT 'MENTELYX' NOT NULL,
	"reserved_budget_usd" numeric(18, 6) NOT NULL,
	"actual_cost_usd" numeric(18, 6),
	"pending_reconciliation" boolean DEFAULT false NOT NULL,
	"input_tokens" bigint,
	"output_tokens" bigint,
	"latency_ms" bigint,
	"finished_at" timestamp with time zone,
	"result_ref" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai_usage_records_operation_key_uq" UNIQUE("operation_key"),
	CONSTRAINT "ai_usage_records_status_ck" CHECK ("m6_ai_tutor"."ai_usage_records"."status" in ('EN_CURSO', 'RESPONDIDA', 'FALLIDA', 'CANCELADA', 'INCIERTA', 'RECHAZADA_CUOTA')),
	CONSTRAINT "ai_usage_records_data_class_ck" CHECK ("m6_ai_tutor"."ai_usage_records"."data_class" in ('D0', 'D1', 'D2')),
	CONSTRAINT "ai_usage_records_billing_ck" CHECK ("m6_ai_tutor"."ai_usage_records"."billing_source" in ('MENTELYX', 'BYOK')),
	CONSTRAINT "ai_usage_records_costos_ck" CHECK ("m6_ai_tutor"."ai_usage_records"."reserved_budget_usd" >= 0 and ("m6_ai_tutor"."ai_usage_records"."actual_cost_usd" is null or "m6_ai_tutor"."ai_usage_records"."actual_cost_usd" >= 0))
);
--> statement-breakpoint
CREATE TABLE "m6_ai_tutor"."rag_document_chunks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"index_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"chunk_index" integer NOT NULL,
	"scope" text NOT NULL,
	"owner_id" uuid,
	"course_id" uuid,
	"level" text,
	"estado" text NOT NULL,
	"vigente" boolean DEFAULT false NOT NULL,
	"texto" text NOT NULL,
	"ancla" jsonb NOT NULL,
	"titulo" varchar(300) NOT NULL,
	"tokens" integer NOT NULL,
	"content_hash" char(64) NOT NULL,
	"chunker_version" text NOT NULL,
	"embedding_model" text NOT NULL,
	"idioma" varchar(8) DEFAULT 'es' NOT NULL,
	"senal_inyeccion" boolean DEFAULT false NOT NULL,
	"embedding" vector(1024),
	"tsv" "tsvector" GENERATED ALWAYS AS (to_tsvector('spanish'::regconfig, texto)) STORED,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rag_document_chunks_index_chunk_uq" UNIQUE("index_id","chunk_index"),
	CONSTRAINT "rag_document_chunks_index_ck" CHECK ("m6_ai_tutor"."rag_document_chunks"."chunk_index" >= 0),
	CONSTRAINT "rag_document_chunks_scope_ck" CHECK ("m6_ai_tutor"."rag_document_chunks"."scope" in ('CATALOGO', 'LICENCIA', 'PRIVADO', 'COMPARTIDO', 'PUBLICO')),
	CONSTRAINT "rag_document_chunks_estado_ck" CHECK ("m6_ai_tutor"."rag_document_chunks"."estado" in ('ACTIVO', 'REEMPLAZADO', 'REVOCADO')),
	CONSTRAINT "rag_document_chunks_tokens_ck" CHECK ("m6_ai_tutor"."rag_document_chunks"."tokens" >= 0),
	CONSTRAINT "privado_con_propietario" CHECK ("m6_ai_tutor"."rag_document_chunks"."scope" <> 'PRIVADO' or "m6_ai_tutor"."rag_document_chunks"."owner_id" is not null),
	CONSTRAINT "vector_segun_modelo" CHECK (("m6_ai_tutor"."rag_document_chunks"."embedding_model" = 'lexico') = ("m6_ai_tutor"."rag_document_chunks"."embedding" is null))
);
--> statement-breakpoint
CREATE TABLE "m6_ai_tutor"."rag_index_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"scope" text NOT NULL,
	"owner_id" uuid,
	"estado" text NOT NULL,
	"etapa_completada" text,
	"intentos" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"chunker_version" text NOT NULL,
	"embedding_model" text NOT NULL,
	"generation" integer NOT NULL,
	"chunks_total" integer,
	"costo_usd" numeric(18, 6),
	"access_version" bigint NOT NULL,
	"solicitado_en" timestamp with time zone DEFAULT now() NOT NULL,
	"vigente_desde" timestamp with time zone,
	"revocado_en" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "rag_index_documents_generacion_uq" UNIQUE("document_id","version","embedding_model","chunker_version","generation"),
	CONSTRAINT "rag_index_documents_doc_id_uq" UNIQUE("document_id","id"),
	CONSTRAINT "rag_index_documents_ref_uq" UNIQUE("id","document_id","version","embedding_model","chunker_version"),
	CONSTRAINT "rag_index_documents_version_ck" CHECK ("m6_ai_tutor"."rag_index_documents"."version" > 0),
	CONSTRAINT "rag_index_documents_scope_ck" CHECK ("m6_ai_tutor"."rag_index_documents"."scope" in ('CATALOGO', 'LICENCIA', 'PRIVADO', 'COMPARTIDO', 'PUBLICO')),
	CONSTRAINT "rag_index_documents_estado_ck" CHECK ("m6_ai_tutor"."rag_index_documents"."estado" in ('SOLICITADO', 'EXTRAYENDO', 'FRAGMENTANDO', 'EMBEDDING', 'LISTO', 'ACTIVO', 'FALLIDO', 'REVOCADO', 'REEMPLAZADO', 'PURGADO')),
	CONSTRAINT "rag_index_documents_intentos_ck" CHECK ("m6_ai_tutor"."rag_index_documents"."intentos" >= 0),
	CONSTRAINT "rag_index_documents_generation_ck" CHECK ("m6_ai_tutor"."rag_index_documents"."generation" > 0),
	CONSTRAINT "rag_index_documents_privado_ck" CHECK ("m6_ai_tutor"."rag_index_documents"."scope" <> 'PRIVADO' or "m6_ai_tutor"."rag_index_documents"."owner_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "m2_contents"."content_versions" ADD CONSTRAINT "content_versions_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "m2_contents"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m2_contents"."study_space_sources" ADD CONSTRAINT "study_space_sources_space_id_study_spaces_id_fk" FOREIGN KEY ("space_id") REFERENCES "m2_contents"."study_spaces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m2_contents"."study_space_sources" ADD CONSTRAINT "study_space_sources_content_id_content_items_id_fk" FOREIGN KEY ("content_id") REFERENCES "m2_contents"."content_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m6_ai_tutor"."rag_document_chunks" ADD CONSTRAINT "rag_document_chunks_index_fk" FOREIGN KEY ("index_id","document_id","version","embedding_model","chunker_version") REFERENCES "m6_ai_tutor"."rag_index_documents"("id","document_id","version","embedding_model","chunker_version") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "content_items_owner_status_idx" ON "m2_contents"."content_items" USING btree ("owner_id","status","id");--> statement-breakpoint
CREATE INDEX "study_spaces_owner_status_idx" ON "m2_contents"."study_spaces" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "ai_usage_records_usuario_periodo_idx" ON "m6_ai_tutor"."ai_usage_records" USING btree ("user_id","billing_period","status");--> statement-breakpoint
CREATE INDEX "rag_chunks_tsv" ON "m6_ai_tutor"."rag_document_chunks" USING gin ("tsv");--> statement-breakpoint
CREATE INDEX "rag_chunks_doc" ON "m6_ai_tutor"."rag_document_chunks" USING btree ("document_id","estado");--> statement-breakpoint
CREATE INDEX "rag_chunks_privado" ON "m6_ai_tutor"."rag_document_chunks" USING btree ("owner_id") WHERE "m6_ai_tutor"."rag_document_chunks"."scope" = 'PRIVADO';--> statement-breakpoint
CREATE INDEX "rag_index_estado" ON "m6_ai_tutor"."rag_index_documents" USING btree ("estado","solicitado_en");