import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle Kit es la ÚNICA autoridad de esquema y migraciones (ADR-075). Las migraciones se ejecutan desde un trabajo
 * de CI con rol de migración, nunca desde el Worker. Kysely no tiene migraciones propias.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/modules/*/infraestructura/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL ?? 'postgres://mentelyx:mentelyx_local@127.0.0.1:55432/mentelyx' },
  schemaFilter: ['m1_users', 'm2_contents', 'm3_evaluations', 'm4_classes', 'm5_billing', 'm6_ai_tutor', 'm7_advertising'],
  migrations: { schema: 'drizzle', table: '__drizzle_migrations' },
  strict: true,
  verbose: true,
});
