import { and, eq, inArray, sql } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { ErrorAplicacion } from '../../../shared/errores';
import type { Carpeta, CarpetasRepositorio, EstadoCarpeta, ModuloCarpeta, TipoElemento } from '../dominio/carpetas';
import { folderItems, folders, studySpaces } from './schema';

const aCarpeta = (r: typeof folders.$inferSelect, elementos = 0): Carpeta => ({
  id: r.id,
  modulo: r.module as ModuloCarpeta,
  nombre: r.name,
  padreId: r.parentId,
  estado: r.status as EstadoCarpeta,
  elementos,
  actualizadaEn: r.updatedAt.toISOString(),
});

/** SQLSTATE 23505 del índice de nombres entre hermanas → 409 NOMBRE_DUPLICADO. */
function duplicado(e: unknown): boolean {
  const x = e as { code?: string; constraint?: string; cause?: { code?: string; constraint?: string } };
  const codigo = x.code ?? x.cause?.code;
  const restriccion = x.constraint ?? x.cause?.constraint;
  return codigo === '23505' && restriccion === 'folders_hermanas_nombre_uq';
}
const errorDuplicado = () => new ErrorAplicacion('NOMBRE_DUPLICADO', 'Ya hay una carpeta con ese nombre en ese lugar.');

export class PostgresCarpetasRepositorio implements CarpetasRepositorio {
  constructor(private readonly db: BdDrizzle) {}

  async listar(ownerId: string, modulo: ModuloCarpeta, estado: EstadoCarpeta) {
    const filas = await this.db
      .select({ f: folders, n: sql<number>`(select count(*)::int from ${folderItems} fi where fi.folder_id = ${folders.id})` })
      .from(folders)
      .where(and(eq(folders.ownerId, ownerId), eq(folders.module, modulo), eq(folders.status, estado)))
      .orderBy(folders.name)
      .limit(500);
    return filas.map((r) => aCarpeta(r.f, r.n));
  }

  async obtener(ownerId: string, id: string) {
    const r = await this.db.execute<{ id: string; profundidad: number; altura: number }>(sql`
      with recursive arriba as (
        select id, parent_id, 1 as nivel from ${folders} where id = ${id}::uuid and owner_id = ${ownerId}::uuid
        union all select f.id, f.parent_id, a.nivel + 1 from ${folders} f join arriba a on f.id = a.parent_id where a.nivel < 10
      ), abajo as (
        select id, 1 as nivel from ${folders} where id = ${id}::uuid and owner_id = ${ownerId}::uuid
        union all select f.id, b.nivel + 1 from ${folders} f join abajo b on f.parent_id = b.id where b.nivel < 10
      )
      select ${id}::uuid as id, (select max(nivel) from arriba)::int as profundidad, (select max(nivel) from abajo)::int as altura`);
    const meta = r.rows[0];
    if (!meta?.profundidad) return null;
    const [f] = await this.db.select().from(folders).where(and(eq(folders.id, id), eq(folders.ownerId, ownerId))).limit(1);
    if (!f) return null;
    const [n] = await this.db.select({ n: sql<number>`count(*)::int` }).from(folderItems).where(eq(folderItems.folderId, id));
    return { ...aCarpeta(f, n?.n ?? 0), profundidad: meta.profundidad, alturaSubarbol: meta.altura };
  }

  async ancestros(ownerId: string, id: string) {
    const r = await this.db.execute<{ id: string }>(sql`
      with recursive arriba as (
        select id, parent_id, 1 as nivel from ${folders} where id = ${id}::uuid and owner_id = ${ownerId}::uuid
        union all select f.id, f.parent_id, a.nivel + 1 from ${folders} f join arriba a on f.id = a.parent_id where a.nivel < 10
      ) select id from arriba`);
    return r.rows.map((x) => x.id);
  }

  async crear(ownerId: string, c: { modulo: ModuloCarpeta; nombre: string; padreId: string | null }, operationKey: string, ahora: Date) {
    try {
      const [nueva] = await this.db
        .insert(folders)
        .values({ ownerId, module: c.modulo, name: c.nombre, parentId: c.padreId, operationKey, createdAt: ahora, updatedAt: ahora })
        .onConflictDoNothing({ target: [folders.ownerId, folders.operationKey] })
        .returning();
      if (nueva) return { carpeta: aCarpeta(nueva), repetida: false };
    } catch (e) {
      if (duplicado(e)) throw errorDuplicado();
      throw e;
    }
    const [previa] = await this.db.select().from(folders).where(and(eq(folders.ownerId, ownerId), eq(folders.operationKey, operationKey))).limit(1);
    if (!previa || previa.name !== c.nombre || previa.module !== c.modulo) throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La clave ya se usó para otra carpeta.');
    return { carpeta: aCarpeta(previa), repetida: true };
  }

  async actualizar(ownerId: string, id: string, cambios: { nombre?: string | undefined; padreId?: string | null | undefined; estado?: EstadoCarpeta | undefined }, ahora: Date) {
    try {
      const [f] = await this.db
        .update(folders)
        .set({
          ...(cambios.nombre !== undefined ? { name: cambios.nombre } : {}),
          ...(cambios.padreId !== undefined ? { parentId: cambios.padreId } : {}),
          ...(cambios.estado !== undefined ? { status: cambios.estado } : {}),
          updatedAt: ahora,
        })
        .where(and(eq(folders.id, id), eq(folders.ownerId, ownerId)))
        .returning();
      if (!f) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Carpeta no encontrada.');
      const [n] = await this.db.select({ n: sql<number>`count(*)::int` }).from(folderItems).where(eq(folderItems.folderId, id));
      return aCarpeta(f, n?.n ?? 0);
    } catch (e) {
      if (duplicado(e)) throw errorDuplicado();
      throw e;
    }
  }

  async eliminar(ownerId: string, id: string) {
    return this.db.transaction(async (tx) => {
      const [f] = await tx.select().from(folders).where(and(eq(folders.id, id), eq(folders.ownerId, ownerId))).for('update').limit(1);
      if (!f) return false;
      // Las subcarpetas pasan a la raíz; si su nombre ya existe allí, se les añade un sufijo para no perder ninguna.
      const hijas = await tx.select().from(folders).where(and(eq(folders.parentId, id), eq(folders.ownerId, ownerId)));
      const enRaiz = new Set(
        (await tx.select({ n: folders.name }).from(folders).where(and(eq(folders.ownerId, ownerId), eq(folders.module, f.module), sql`${folders.parentId} is null`))).map((x) => x.n.toLowerCase()),
      );
      for (const h of hijas) {
        let nombre = h.name;
        for (let k = 2; enRaiz.has(nombre.toLowerCase()); k++) nombre = `${h.name.slice(0, 72)} (${k})`;
        enRaiz.add(nombre.toLowerCase());
        await tx.update(folders).set({ parentId: null, name: nombre }).where(eq(folders.id, h.id));
      }
      await tx.delete(folderItems).where(eq(folderItems.folderId, id)); // los elementos vuelven a la raíz (no se borran)
      await tx.delete(folders).where(eq(folders.id, id));
      return true;
    });
  }

  async elementos(ownerId: string, carpetaId: string) {
    const filas = await this.db.select().from(folderItems).where(and(eq(folderItems.ownerId, ownerId), eq(folderItems.folderId, carpetaId)));
    return filas.map((f) => ({ tipo: f.itemType as TipoElemento, id: f.itemId }));
  }

  async ubicar(ownerId: string, carpetaId: string, tipo: TipoElemento, id: string, ahora: Date) {
    await this.db
      .insert(folderItems)
      .values({ ownerId, itemType: tipo, itemId: id, folderId: carpetaId, updatedAt: ahora })
      .onConflictDoUpdate({ target: [folderItems.ownerId, folderItems.itemType, folderItems.itemId], set: { folderId: carpetaId, updatedAt: ahora } });
  }

  async ubicacion(ownerId: string, tipo: TipoElemento, ids: string[]) {
    if (!ids.length) return new Map<string, string>();
    const filas = await this.db
      .select({ id: folderItems.itemId, carpeta: folderItems.folderId })
      .from(folderItems)
      .where(and(eq(folderItems.ownerId, ownerId), eq(folderItems.itemType, tipo), inArray(folderItems.itemId, ids)));
    return new Map(filas.map((f) => [f.id, f.carpeta]));
  }
}

/** Títulos de los temas propios (study_spaces) para los elementos de carpetas de Aprendizaje. */
export async function resumenTemas(db: BdDrizzle, ownerId: string, ids: string[]) {
  if (!ids.length) return [];
  const filas = await db
    .select({ id: studySpaces.id, titulo: studySpaces.title, actualizadoEn: studySpaces.updatedAt })
    .from(studySpaces)
    .where(and(eq(studySpaces.ownerId, ownerId), inArray(studySpaces.id, ids), sql`${studySpaces.status} <> 'DELETE_PENDING'`));
  return filas.map((f) => ({ id: f.id, titulo: f.titulo, actualizadoEn: f.actualizadoEn.toISOString() }));
}
