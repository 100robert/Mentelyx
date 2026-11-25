import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { registrarEnOutbox } from '../../../shared/bd/mensajeria';
import type { EspacioRegistro, EspaciosRepositorio, FormatoTexto, FuenteRegistro } from '../dominio/espacios';
import { contentItems, contentVersions, inboxEvents, outboxEvents, studySpaceSources, studySpaces } from './schema';

const TABLAS_MENSAJERIA = { outboxEvents, inboxEvents };
const iso = (d: Date | string) => new Date(d).toISOString();

export class PostgresEspaciosRepositorio implements EspaciosRepositorio {
  constructor(private readonly db: BdDrizzle) {}

  private conteoFuentes = sql<number>`(select count(*)::int from ${studySpaceSources} where ${studySpaceSources.spaceId} = ${studySpaces.id})`;

  private aEspacio(f: typeof studySpaces.$inferSelect & { fuentes: number }): EspacioRegistro {
    return {
      id: f.id,
      propietarioId: f.ownerId,
      titulo: f.title,
      estado: f.status === 'ARCHIVADO' ? 'ARCHIVADO' : 'ACTIVO',
      almacenamientoBytes: f.storageBytes,
      fuentes: f.fuentes,
      creadoEn: iso(f.createdAt),
    };
  }

  async crear(e: { propietarioId: string; titulo: string }) {
    const [fila] = await this.db.insert(studySpaces).values({ ownerId: e.propietarioId, title: e.titulo }).returning();
    return this.aEspacio({ ...fila!, fuentes: 0 });
  }

  async listar(propietarioId: string) {
    const filas = await this.db
      .select({ espacio: studySpaces, fuentes: this.conteoFuentes })
      .from(studySpaces)
      .where(and(eq(studySpaces.ownerId, propietarioId), eq(studySpaces.status, 'ACTIVO')))
      .orderBy(desc(studySpaces.createdAt))
      .limit(100);
    return filas.map((f) => this.aEspacio({ ...f.espacio, fuentes: f.fuentes }));
  }

  async obtener(espacioId: string) {
    const [fila] = await this.db
      .select({ espacio: studySpaces, fuentes: this.conteoFuentes })
      .from(studySpaces)
      .where(and(eq(studySpaces.id, espacioId), eq(studySpaces.status, 'ACTIVO')));
    if (!fila) return undefined;
    const fuentes = await this.consultarFuentes(and(eq(studySpaceSources.spaceId, espacioId)));
    return { ...this.aEspacio({ ...fila.espacio, fuentes: fila.fuentes }), listaFuentes: fuentes };
  }

  private async consultarFuentes(condicion: ReturnType<typeof and>): Promise<Array<FuenteRegistro & { espacioId: string }>> {
    const filas = await this.db
      .select({ item: contentItems, version: contentVersions, vinculo: studySpaceSources })
      .from(studySpaceSources)
      .innerJoin(contentItems, eq(contentItems.id, studySpaceSources.contentId))
      .innerJoin(contentVersions, and(eq(contentVersions.contentId, contentItems.id), eq(contentVersions.versionNumber, contentItems.currentVersion)))
      .where(and(condicion, eq(contentItems.status, 'ACTIVO'), eq(contentItems.itemType, 'PRIVATE_SOURCE')))
      .orderBy(desc(studySpaceSources.addedAt));
    return filas.map(({ item, version, vinculo }) => ({
      contentId: item.id,
      version: version.versionNumber,
      titulo: item.title,
      formato: item.sourceFormat as FormatoTexto,
      bytes: version.byteSize,
      seleccionada: vinculo.selected,
      agregadaEn: iso(vinculo.addedAt),
      claveObjeto: version.r2StorageKey ?? '',
      espacioId: vinculo.spaceId,
    }));
  }

  async buscarFuentePorClave(operationKey: string) {
    const [fila] = await this.db
      .select({ contentId: contentItems.id, espacioId: studySpaceSources.spaceId })
      .from(contentItems)
      .innerJoin(studySpaceSources, eq(studySpaceSources.contentId, contentItems.id))
      .where(eq(contentItems.creationOperationKey, operationKey));
    return fila;
  }

  async registrarFuente(f: Parameters<EspaciosRepositorio['registrarFuente']>[0]) {
    await this.db.transaction(async (tx) => {
      await tx.insert(contentItems).values({
        id: f.contentId,
        ownerId: f.propietarioId,
        itemType: 'PRIVATE_SOURCE',
        title: f.titulo,
        sourceFormat: f.formato,
        currentVersion: 1,
        creationOperationKey: f.operationKey,
      });
      await tx.insert(contentVersions).values({
        contentId: f.contentId,
        versionNumber: 1,
        r2StorageKey: f.claveObjeto,
        contentHash: f.hash,
        byteSize: f.bytes,
        schemaVersion: `fuente-${f.formato.toLowerCase()}/v1`,
        state: 'STORED',
      });
      await tx.insert(studySpaceSources).values({ spaceId: f.espacioId, contentId: f.contentId });
      await tx
        .update(studySpaces)
        .set({ storageBytes: sql`${studySpaces.storageBytes} + ${f.bytes}`, updatedAt: sql`now()` })
        .where(eq(studySpaces.id, f.espacioId));
      // Transactional Outbox: M6 indexará la fuente cuando el relay entregue el evento (al menos una vez).
      await registrarEnOutbox(tx, TABLAS_MENSAJERIA, {
        tipo: 'FuenteRegistrada',
        agregadoId: f.contentId,
        versionAgregado: 1,
        payload: { contentId: f.contentId, version: 1, propietarioId: f.propietarioId, espacioId: f.espacioId, titulo: f.titulo, formato: f.formato },
      });
    });
  }

  async seleccionarFuente(espacioId: string, contentId: string, seleccionada: boolean) {
    const filas = await this.db
      .update(studySpaceSources)
      .set({ selected: seleccionada })
      .where(and(eq(studySpaceSources.spaceId, espacioId), eq(studySpaceSources.contentId, contentId)))
      .returning({ contentId: studySpaceSources.contentId });
    return filas.length === 1;
  }

  fuentesDelPropietario(propietarioId: string, filtro: { espacioId?: string | undefined; contentIds?: string[] | undefined }) {
    const condiciones = [eq(contentItems.ownerId, propietarioId)];
    if (filtro.espacioId) condiciones.push(eq(studySpaceSources.spaceId, filtro.espacioId));
    if (filtro.contentIds?.length) condiciones.push(inArray(contentItems.id, filtro.contentIds));
    return this.consultarFuentes(and(...condiciones));
  }
}
