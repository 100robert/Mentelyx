-- 0007 (26/11/2026): integración Full Stack de Mentelyx V1. Aditiva: carpetas (M2), preferencias (M1), intentos,
-- respuestas y tarjetas (M3), nombre y asignatura de la preparación. Única baja: el índice único parcial de 0006
-- «una preparación ACTIVO por estudiante», sustituido por un índice de consulta porque ADR-093 (sección 12) pide
-- varias preparaciones por cuenta. No se borra ni modifica ningún dato existente.
CREATE TABLE "m2_contents"."folder_items" (
	"owner_id" uuid NOT NULL,
	"item_type" text NOT NULL,
	"item_id" uuid NOT NULL,
	"folder_id" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folder_items_owner_id_item_type_item_id_pk" PRIMARY KEY("owner_id","item_type","item_id"),
	CONSTRAINT "folder_items_type_ck" CHECK ("m2_contents"."folder_items"."item_type" in ('TEMA', 'SESION', 'PREPARACION'))
);
--> statement-breakpoint
CREATE TABLE "m2_contents"."folders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"module" text NOT NULL,
	"name" varchar(80) NOT NULL,
	"parent_id" uuid,
	"status" text DEFAULT 'ACTIVA' NOT NULL,
	"operation_key" varchar(100),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "folders_owner_operation_uq" UNIQUE("owner_id","operation_key"),
	CONSTRAINT "folders_module_ck" CHECK ("m2_contents"."folders"."module" in ('APRENDIZAJE', 'EXAMENES')),
	CONSTRAINT "folders_status_ck" CHECK ("m2_contents"."folders"."status" in ('ACTIVA', 'ARCHIVADA')),
	CONSTRAINT "folders_no_self_parent_ck" CHECK ("m2_contents"."folders"."parent_id" is null or "m2_contents"."folders"."parent_id" <> "m2_contents"."folders"."id")
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."attempt_answers" (
	"attempt_id" uuid NOT NULL,
	"question_id" varchar(32) NOT NULL,
	"answer" jsonb NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "attempt_answers_attempt_id_question_id_pk" PRIMARY KEY("attempt_id","question_id"),
	CONSTRAINT "attempt_answers_revision_ck" CHECK ("m3_evaluations"."attempt_answers"."revision" > 0)
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."card_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"card_id" uuid NOT NULL,
	"rating" text NOT NULL,
	"operation_key" varchar(100) NOT NULL,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"next_due_at" timestamp with time zone NOT NULL,
	"rule_version" text NOT NULL,
	CONSTRAINT "card_reviews_card_operation_uq" UNIQUE("card_id","operation_key"),
	CONSTRAINT "card_reviews_rating_ck" CHECK ("m3_evaluations"."card_reviews"."rating" in ('OTRA_VEZ', 'DIFICIL', 'BIEN', 'FACIL'))
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."evaluation_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"mode" text NOT NULL,
	"bank_version" integer NOT NULL,
	"question_ids" jsonb NOT NULL,
	"projection" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"operation_key" varchar(100) NOT NULL,
	"request_hash" text NOT NULL,
	"status" text DEFAULT 'EN_CURSO' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deadline_at" timestamp with time zone,
	"submitted_at" timestamp with time zone,
	"late_submission" boolean,
	"score" numeric(10, 4),
	"max_score" numeric(10, 4),
	"pending_count" integer,
	"results" jsonb,
	"scoring_version" text,
	"submit_key" varchar(100),
	CONSTRAINT "evaluation_attempts_student_operation_uq" UNIQUE("student_id","operation_key"),
	CONSTRAINT "evaluation_attempts_mode_ck" CHECK ("m3_evaluations"."evaluation_attempts"."mode" in ('PRACTICA', 'SIMULACRO', 'DIAGNOSTICO')),
	CONSTRAINT "evaluation_attempts_status_ck" CHECK ("m3_evaluations"."evaluation_attempts"."status" in ('EN_CURSO', 'CALIFICADO')),
	CONSTRAINT "evaluation_attempts_deadline_ck" CHECK ("m3_evaluations"."evaluation_attempts"."deadline_at" is null or "m3_evaluations"."evaluation_attempts"."deadline_at" > "m3_evaluations"."evaluation_attempts"."started_at"),
	CONSTRAINT "evaluation_attempts_graded_ck" CHECK ("m3_evaluations"."evaluation_attempts"."status" <> 'CALIFICADO' or ("m3_evaluations"."evaluation_attempts"."submitted_at" is not null and "m3_evaluations"."evaluation_attempts"."score" is not null and "m3_evaluations"."evaluation_attempts"."max_score" is not null and "m3_evaluations"."evaluation_attempts"."results" is not null and "m3_evaluations"."evaluation_attempts"."submit_key" is not null)),
	CONSTRAINT "evaluation_attempts_score_ck" CHECK ("m3_evaluations"."evaluation_attempts"."score" is null or ("m3_evaluations"."evaluation_attempts"."score" >= 0 and "m3_evaluations"."evaluation_attempts"."score" <= "m3_evaluations"."evaluation_attempts"."max_score"))
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."study_cards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"goal_id" uuid NOT NULL,
	"topic" varchar(120),
	"front" varchar(500) NOT NULL,
	"back" varchar(1500) NOT NULL,
	"origin" text NOT NULL,
	"operation_key" varchar(100) NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"interval_days" integer DEFAULT 0 NOT NULL,
	"ease" numeric(4, 2) DEFAULT '2.50' NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_cards_student_operation_uq" UNIQUE("student_id","operation_key"),
	CONSTRAINT "study_cards_origin_ck" CHECK ("m3_evaluations"."study_cards"."origin" in ('persona', 'tutor', 'material')),
	CONSTRAINT "study_cards_interval_ck" CHECK ("m3_evaluations"."study_cards"."interval_days" >= 0 and "m3_evaluations"."study_cards"."repetitions" >= 0 and "m3_evaluations"."study_cards"."ease" between 1.30 and 3.00)
);
--> statement-breakpoint
CREATE TABLE "m1_users"."learning_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"depth" text,
	"visual_tools" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"language" text DEFAULT 'es' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_preferences_depth_ck" CHECK ("m1_users"."learning_preferences"."depth" is null or "m1_users"."learning_preferences"."depth" in ('inicial', 'intermedio', 'avanzado')),
	CONSTRAINT "learning_preferences_language_ck" CHECK ("m1_users"."learning_preferences"."language" = 'es'),
	CONSTRAINT "learning_preferences_tools_ck" CHECK (jsonb_typeof("m1_users"."learning_preferences"."visual_tools") = 'array' and jsonb_array_length("m1_users"."learning_preferences"."visual_tools") <= 14)
);
--> statement-breakpoint
DROP INDEX "m3_evaluations"."learning_goals_active_student_uq";--> statement-breakpoint
ALTER TABLE "m3_evaluations"."learning_goals" ADD COLUMN "name" varchar(120);--> statement-breakpoint
ALTER TABLE "m3_evaluations"."learning_goals" ADD COLUMN "subject" varchar(120);--> statement-breakpoint
ALTER TABLE "m2_contents"."folder_items" ADD CONSTRAINT "folder_items_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "m2_contents"."folders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m2_contents"."folders" ADD CONSTRAINT "folders_parent_id_folders_id_fk" FOREIGN KEY ("parent_id") REFERENCES "m2_contents"."folders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m3_evaluations"."attempt_answers" ADD CONSTRAINT "attempt_answers_attempt_id_evaluation_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "m3_evaluations"."evaluation_attempts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m3_evaluations"."card_reviews" ADD CONSTRAINT "card_reviews_card_id_study_cards_id_fk" FOREIGN KEY ("card_id") REFERENCES "m3_evaluations"."study_cards"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m3_evaluations"."evaluation_attempts" ADD CONSTRAINT "evaluation_attempts_goal_id_learning_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "m3_evaluations"."learning_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m3_evaluations"."study_cards" ADD CONSTRAINT "study_cards_goal_id_learning_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "m3_evaluations"."learning_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m1_users"."learning_preferences" ADD CONSTRAINT "learning_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "m1_users"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "folder_items_folder_idx" ON "m2_contents"."folder_items" USING btree ("folder_id");--> statement-breakpoint
CREATE INDEX "folders_owner_module_idx" ON "m2_contents"."folders" USING btree ("owner_id","module","status");--> statement-breakpoint
CREATE UNIQUE INDEX "folders_hermanas_nombre_uq" ON "m2_contents"."folders" USING btree ("owner_id","module",coalesce("parent_id", '00000000-0000-0000-0000-000000000000'::uuid),lower("name"));--> statement-breakpoint
CREATE INDEX "evaluation_attempts_student_goal_idx" ON "m3_evaluations"."evaluation_attempts" USING btree ("student_id","goal_id","started_at");--> statement-breakpoint
CREATE INDEX "study_cards_goal_due_idx" ON "m3_evaluations"."study_cards" USING btree ("student_id","goal_id","due_at");--> statement-breakpoint
CREATE INDEX "learning_goals_student_status_idx" ON "m3_evaluations"."learning_goals" USING btree ("student_id","status","created_at");