import { sql } from 'drizzle-orm';
import { bigint, boolean, check, index, integer, jsonb, pgSchema, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/**
 * Esquema propietario de M1 (persistencia, sección 7.1). Las claves TypeScript siguen los campos de Better Auth
 * (su adaptador Drizzle las usa) y los nombres de columna siguen el diseño físico. Los campos de perfil, edad,
 * tipo de cuenta, roles y MFA se añaden en I-1 mediante migraciones expand-contract.
 */
export const m1Users = pgSchema('m1_users');
const ahora = (nombre: string) => timestamp(nombre, { withTimezone: true }).notNull().defaultNow();

export const users = m1Users.table(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('display_name').notNull(),
    email: text('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    image: text('image'),
    status: text('status').notNull().default('ACTIVE'),
    authzVersion: bigint('authz_version', { mode: 'number' }).notNull().default(0),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [unique('users_email_uq').on(t.email), check('users_status_ck', sql`${t.status} in ('ACTIVE', 'SUSPENDED', 'DELETE_PENDING')`)],
);

export const userSessions = m1Users.table(
  'user_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    token: text('session_token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [unique('user_sessions_token_uq').on(t.token), index('user_sessions_usuario_expira_idx').on(t.userId, t.expiresAt)],
);

export const authAccounts = m1Users.table(
  'auth_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: text('provider_account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password_hash'),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [unique('auth_accounts_proveedor_uq').on(t.providerId, t.accountId), index('auth_accounts_usuario_idx').on(t.userId)],
);

export const authVerifications = m1Users.table(
  'auth_verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [index('auth_verifications_identificador_idx').on(t.identifier, t.expiresAt)],
);

/** Persistencia, sección 7.8: límites de Better Auth en base de datos (no en memoria, inútil entre isolates). */
export const authRateLimits = m1Users.table(
  'auth_rate_limits',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    key: text('key').notNull(),
    count: integer('count').notNull(),
    lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
  },
  (t) => [unique('auth_rate_limits_key_uq').on(t.key)],
);

/**
 * Preferencias de aprendizaje (API, 12.10; V1, ADR-093): valores por omisión que se proponen al empezar un tema o una
 * preparación y que la persona cambia en cada uno. `depth` nulo = «elegir cada vez» (nunca un nivel fijo impuesto).
 */
export const learningPreferences = m1Users.table(
  'learning_preferences',
  {
    userId: uuid('user_id')
      .primaryKey()
      .references(() => users.id, { onDelete: 'cascade' }),
    depth: text('depth'),
    visualTools: jsonb('visual_tools').notNull().default(sql`'[]'::jsonb`),
    language: text('language').notNull().default('es'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    check('learning_preferences_depth_ck', sql`${t.depth} is null or ${t.depth} in ('inicial', 'intermedio', 'avanzado')`),
    check('learning_preferences_language_ck', sql`${t.language} = 'es'`),
    check('learning_preferences_tools_ck', sql`jsonb_typeof(${t.visualTools}) = 'array' and jsonb_array_length(${t.visualTools}) <= 14`),
  ],
);

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m1Users);
