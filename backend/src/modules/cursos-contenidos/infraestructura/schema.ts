import { sql } from 'drizzle-orm';
import { bigint, boolean, char, check, index, integer, pgSchema, primaryKey, text, timestamp, unique, uniqueIndex, uuid, varchar, type AnyPgColumn } from 'drizzle-orm/pg-core';
import { crearTablasMensajeria } from '../../../shared/bd/mensajeria';

/**
 * Esquema propietario de M2 (persistencia, secciones 3.2 y 7.9). MVP del Sprint 03: espacios privados y fuentes TXT/MD.
 * Lecciones, biblioteca, cuadernos, lienzos y Studio llegan en I-3, I-4 e I-6 sobre estas mismas tablas.
 */
export const m2Contents = pgSchema('m2_contents');
const ahora = (nombre: string) => timestamp(nombre, { withTimezone: true }).notNull().defaultNow();

export const studySpaces = m2Contents.table(
  'study_spaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    title: varchar('title', { length: 200 }).notNull(),
    educationLevel: text('education_level'),
    status: text('status').notNull().default('ACTIVO'),
    storageBytes: bigint('storage_bytes', { mode: 'number' }).notNull().default(0),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    index('study_spaces_owner_status_idx').on(t.ownerId, t.status),
    check('study_spaces_status_ck', sql`${t.status} in ('ACTIVO', 'ARCHIVADO', 'DELETE_PENDING')`),
    check('study_spaces_storage_ck', sql`${t.storageBytes} >= 0`),
  ],
);

export const contentItems = m2Contents.table(
  'content_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    courseId: uuid('course_id'),
    ownerId: uuid('owner_id').notNull(),
    itemType: text('item_type').notNull(),
    title: varchar('title', { length: 300 }).notNull(),
    sourceFormat: text('source_format'),
    visibility: text('visibility').notNull().default('PRIVADO'),
    currentVersion: integer('current_version'),
    accessVersion: bigint('access_version', { mode: 'number' }).notNull().default(1),
    status: text('status').notNull().default('ACTIVO'),
    /** Clave de idempotencia de la creación (Idempotency-Key del cliente, con el actor): un reintento no crea otra fuente. */
    creationOperationKey: text('creation_operation_key').unique('content_items_creation_operation_key_uq'),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    index('content_items_owner_status_idx').on(t.ownerId, t.status, t.id),
    check(
      'content_items_type_ck',
      sql`${t.itemType} in ('LESSON', 'STUDIO_PROJECT', 'PDF_ASSET', 'PERSONAL_NOTE', 'PRIVATE_SOURCE', 'CANVAS', 'NOTEBOOK', 'RESOURCE')`,
    ),
    check('content_items_format_ck', sql`${t.sourceFormat} is null or ${t.sourceFormat} in ('PDF', 'PDF_ESCANEADO', 'PPTX', 'DOCX', 'TXT', 'MD', 'IMAGEN')`),
    check('content_items_visibility_ck', sql`${t.visibility} in ('PRIVADO', 'COMPARTIDO', 'PUBLICO', 'INSTITUCIONAL')`),
    check('content_items_status_ck', sql`${t.status} in ('ACTIVO', 'ARCHIVADO', 'DELETE_PENDING')`),
  ],
);

export const contentVersions = m2Contents.table(
  'content_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id),
    versionNumber: integer('version_number').notNull(),
    mongoDocId: text('mongo_doc_id'),
    r2StorageKey: text('r2_storage_key'),
    contentHash: char('content_hash', { length: 64 }).notNull(),
    byteSize: bigint('byte_size', { mode: 'number' }).notNull(),
    schemaVersion: text('schema_version').notNull(),
    state: text('state').notNull().default('PENDING'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    createdAt: ahora('created_at'),
  },
  (t) => [
    unique('content_versions_content_version_uq').on(t.contentId, t.versionNumber),
    check('content_versions_version_ck', sql`${t.versionNumber} > 0`),
    check('content_versions_bytes_ck', sql`${t.byteSize} > 0`),
    check('content_versions_state_ck', sql`${t.state} in ('PENDING', 'STORED', 'PUBLISHED', 'RETIRED', 'DELETE_PENDING')`),
    check('content_versions_referencia_ck', sql`${t.mongoDocId} is not null or ${t.r2StorageKey} is not null`),
  ],
);

export const studySpaceSources = m2Contents.table(
  'study_space_sources',
  {
    spaceId: uuid('space_id')
      .notNull()
      .references(() => studySpaces.id),
    contentId: uuid('content_id')
      .notNull()
      .references(() => contentItems.id),
    selected: boolean('selected').notNull().default(true),
    addedAt: ahora('added_at'),
  },
  (t) => [primaryKey({ columns: [t.spaceId, t.contentId] })],
);

/**
 * Carpetas personales independientes por módulo (API, 12.1; ADR-093). M2 es dueña de la organización y de los permisos;
 * los elementos referencian recursos de su propietario (temas en M2, sesiones en M6, preparaciones en M3) sin FK entre
 * esquemas: M2 comprueba la propiedad mediante las API públicas de esos módulos.
 */
export const folders = m2Contents.table(
  'folders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').notNull(),
    module: text('module').notNull(),
    name: varchar('name', { length: 80 }).notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => folders.id),
    status: text('status').notNull().default('ACTIVA'),
    operationKey: varchar('operation_key', { length: 100 }),
    createdAt: ahora('created_at'),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    index('folders_owner_module_idx').on(t.ownerId, t.module, t.status),
    // Nombre único entre hermanas sin distinguir mayúsculas (409 NOMBRE_DUPLICADO); la raíz se representa con el uuid nulo.
    uniqueIndex('folders_hermanas_nombre_uq').on(t.ownerId, t.module, sql`coalesce(${t.parentId}, '00000000-0000-0000-0000-000000000000'::uuid)`, sql`lower(${t.name})`),
    unique('folders_owner_operation_uq').on(t.ownerId, t.operationKey),
    check('folders_module_ck', sql`${t.module} in ('APRENDIZAJE', 'EXAMENES')`),
    check('folders_status_ck', sql`${t.status} in ('ACTIVA', 'ARCHIVADA')`),
    check('folders_no_self_parent_ck', sql`${t.parentId} is null or ${t.parentId} <> ${t.id}`),
  ],
);

export const folderItems = m2Contents.table(
  'folder_items',
  {
    ownerId: uuid('owner_id').notNull(),
    itemType: text('item_type').notNull(),
    itemId: uuid('item_id').notNull(),
    folderId: uuid('folder_id')
      .notNull()
      .references(() => folders.id, { onDelete: 'cascade' }),
    updatedAt: ahora('updated_at'),
  },
  (t) => [
    // Un elemento está como máximo en una carpeta; sin fila, está en la raíz de su módulo.
    primaryKey({ columns: [t.ownerId, t.itemType, t.itemId] }),
    index('folder_items_folder_idx').on(t.folderId),
    check('folder_items_type_ck', sql`${t.itemType} in ('TEMA', 'SESION', 'PREPARACION')`),
  ],
);

export const { outboxEvents, inboxEvents } = crearTablasMensajeria(m2Contents);
