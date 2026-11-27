CREATE TABLE "m3_evaluations"."learning_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"goal_source" text NOT NULL,
	"source_refs" jsonb NOT NULL,
	"target_date" date,
	"weekly_minutes" integer NOT NULL,
	"operation_key" varchar(100) NOT NULL,
	"request_hash" text NOT NULL,
	"status" text DEFAULT 'ACTIVO' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_goals_student_operation_uq" UNIQUE("student_id","operation_key"),
	CONSTRAINT "learning_goals_source_ck" CHECK ("m3_evaluations"."learning_goals"."goal_source" in ('PERSONAL', 'FUENTES')),
	CONSTRAINT "learning_goals_status_ck" CHECK ("m3_evaluations"."learning_goals"."status" in ('ACTIVO', 'CUMPLIDO', 'ABANDONADO')),
	CONSTRAINT "learning_goals_weekly_minutes_ck" CHECK ("m3_evaluations"."learning_goals"."weekly_minutes" between 15 and 1680)
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."study_plan_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"plan_id" uuid NOT NULL,
	"item_order" integer NOT NULL,
	"area_code" varchar(60) NOT NULL,
	"topic_code" varchar(60) NOT NULL,
	"title" varchar(160) NOT NULL,
	"activity_type" text NOT NULL,
	"due_date" date,
	"estimated_minutes" integer NOT NULL,
	"status" text DEFAULT 'PENDIENTE' NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "study_plan_items_order_uq" UNIQUE("plan_id","item_order"),
	CONSTRAINT "study_plan_items_type_ck" CHECK ("m3_evaluations"."study_plan_items"."activity_type" in ('LECCION', 'PRACTICA', 'SIMULACRO', 'REPASO')),
	CONSTRAINT "study_plan_items_status_ck" CHECK ("m3_evaluations"."study_plan_items"."status" in ('PENDIENTE', 'COMPLETADA', 'OMITIDA')),
	CONSTRAINT "study_plan_items_minutes_ck" CHECK ("m3_evaluations"."study_plan_items"."estimated_minutes" > 0),
	CONSTRAINT "study_plan_items_completed_ck" CHECK ("m3_evaluations"."study_plan_items"."status" <> 'COMPLETADA' or "m3_evaluations"."study_plan_items"."completed_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "m3_evaluations"."study_plans" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"goal_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"rule_version" text NOT NULL,
	"inputs_hash" text NOT NULL,
	"generated_from" jsonb NOT NULL,
	"status" text DEFAULT 'VIGENTE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "study_plans_goal_version_uq" UNIQUE("goal_id","version"),
	CONSTRAINT "study_plans_status_ck" CHECK ("m3_evaluations"."study_plans"."status" in ('VIGENTE', 'REEMPLAZADO'))
);
--> statement-breakpoint
ALTER TABLE "m3_evaluations"."study_plan_items" ADD CONSTRAINT "study_plan_items_plan_id_study_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "m3_evaluations"."study_plans"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "m3_evaluations"."study_plans" ADD CONSTRAINT "study_plans_goal_id_learning_goals_id_fk" FOREIGN KEY ("goal_id") REFERENCES "m3_evaluations"."learning_goals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_goals_active_student_uq" ON "m3_evaluations"."learning_goals" USING btree ("student_id") WHERE "m3_evaluations"."learning_goals"."status" = 'ACTIVO';--> statement-breakpoint
CREATE INDEX "study_plan_items_plan_status_idx" ON "m3_evaluations"."study_plan_items" USING btree ("plan_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "study_plans_current_goal_uq" ON "m3_evaluations"."study_plans" USING btree ("goal_id") WHERE "m3_evaluations"."study_plans"."status" = 'VIGENTE';