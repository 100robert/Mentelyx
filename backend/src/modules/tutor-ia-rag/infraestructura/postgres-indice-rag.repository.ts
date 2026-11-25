import { inArray, sql, type SQL } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { procesarUnaVez } from '../../../shared/bd/mensajeria';
import { CHUNKER_VERSION, type Fragmento, type IndexadorPort, type IndiceRagPort } from '../dominio/tutor';
import { inboxEvents, outboxEvents, ragDocumentChunks, ragIndexDocuments } from './schema';

const TABLAS_MENSAJERIA = { outboxEvents, inboxEvents };

/** Parámetros de la recuperación (RAG, secciones 10.2 y 10.4). τ es un marcador POR CALIBRAR con BP-07. */
export const PARAMETROS_RRF = { k: 60, candidatosPorRama: 40, efSearch: 100, umbralSimilitud: 0.4 } as const;

type FilaBusqueda = { id: string; document_id: string; version: number; titulo: string; texto: string; rrf: number; similitud: number | null };

export class PostgresIndiceRag implements IndiceRagPort, IndexadorPort {
  constructor(private readonly db: BdDrizzle) {}

  async indexarUnaVez(e: Parameters<IndexadorPort['indexarUnaVez']>[0]) {
    const conVector = e.embeddingModel === 'bge-m3';
    if (conVector && e.fragmentos.some((f) => !f.embedding)) throw new Error('Índice bge-m3 con fragmentos sin vector');
    return this.db.transaction((tx) =>
      procesarUnaVez(tx, TABLAS_MENSAJERIA, { source: e.source, eventId: e.eventId, payload: e.payload }, async () => {
        const [indice] = await tx
          .insert(ragIndexDocuments)
          .values({
            documentId: e.documentId,
            version: e.version,
            scope: 'PRIVADO',
            ownerId: e.ownerId,
            estado: 'ACTIVO',
            etapaCompletada: conVector ? 'EMBEDDING' : 'FRAGMENTANDO',
            chunkerVersion: CHUNKER_VERSION,
            embeddingModel: e.embeddingModel,
            generation: 1,
            chunksTotal: e.fragmentos.length,
            costoUsd: String(e.costoUsd),
            accessVersion: 1,
            vigenteDesde: sql`now()`,
          })
          .returning({ id: ragIndexDocuments.id });
        if (e.fragmentos.length === 0) return;
        await tx.insert(ragDocumentChunks).values(
          e.fragmentos.map((f) => ({
            indexId: indice!.id,
            documentId: e.documentId,
            version: e.version,
            chunkIndex: f.indice,
            scope: 'PRIVADO',
            ownerId: e.ownerId,
            estado: 'ACTIVO',
            vigente: true,
            texto: f.texto,
            ancla: { bloqueId: `p${f.indice}` },
            titulo: e.titulo.slice(0, 300),
            tokens: f.tokens,
            contentHash: f.hash,
            chunkerVersion: CHUNKER_VERSION,
            embeddingModel: e.embeddingModel,
            senalInyeccion: f.senalInyeccion,
            embedding: conVector ? f.embedding : null,
          })),
        );
      }),
    );
  }

  /**
   * Recuperación autorizada (RAG, secciones 10.1–10.4). Los filtros de seguridad se repiten en cada rama (CO-01):
   * PRIVADO, propietario, documentos autorizados por M2, vigentes, activos y sin señal de inyección (RAG-SEC).
   *  - Rama léxica: términos de la pregunta unidos con OR, rango `ts_rank_cd` (siempre).
   *  - Rama vectorial (si hay vector): KNN coseno sobre el índice HNSW parcial `bge-m3` (ORDER BY … LIMIT).
   *  - Fusión RRF (k = 60) y umbral: un fragmento que no aparece en la rama léxica se descarta si su similitud < τ.
   * La pregunta y el vector van como parámetros, nunca concatenados.
   */
  async buscar(ownerId: string, documentIds: string[], consulta: { texto: string; vector: number[] | null }, limite: number): Promise<Fragmento[]> {
    if (documentIds.length === 0) return [];
    const { k, candidatosPorRama, efSearch, umbralSimilitud } = PARAMETROS_RRF;
    const filtro = (alias: string): SQL => sql`
        ${sql.raw(alias)}.scope = 'PRIVADO' and ${sql.raw(alias)}.owner_id = ${ownerId}
        and ${sql.raw(alias)}.document_id in (${sql.join(documentIds.map((id) => sql`${id}::uuid`), sql`, `)})
        and ${sql.raw(alias)}.vigente and ${sql.raw(alias)}.estado = 'ACTIVO' and not ${sql.raw(alias)}.senal_inyeccion`;
    const lex = sql`
      lex as (
        select c.id, row_number() over (order by ts_rank_cd(c.tsv, q.consulta) desc, c.chunk_index) as r
        from ${ragDocumentChunks} c,
             (select nullif(replace(plainto_tsquery('spanish', ${consulta.texto})::text, '&', '|'), '')::tsquery as consulta) q
        where q.consulta is not null and c.tsv @@ q.consulta and ${filtro('c')}
        order by ts_rank_cd(c.tsv, q.consulta) desc
        limit ${sql.raw(String(candidatosPorRama))}
      )`;
    const vectorTexto = consulta.vector ? JSON.stringify(consulta.vector) : null;
    // El literal 'bge-m3' (no un parámetro) permite al planificador usar el índice HNSW parcial (RAG, sección 10.2).
    const vec = vectorTexto
      ? sql`
      vec as (
        select knn.id, row_number() over (order by knn.dist) as r, 1 - knn.dist as similitud
        from (
          select c.id, c.embedding <=> ${vectorTexto}::vector as dist
          from ${ragDocumentChunks} c
          where c.embedding_model = 'bge-m3' and c.embedding is not null and ${filtro('c')}
          order by c.embedding <=> ${vectorTexto}::vector
          limit ${sql.raw(String(candidatosPorRama))}
        ) knn
      )`
      : sql`vec as (select null::uuid as id, null::bigint as r, null::float8 as similitud where false)`;
    const consultaSql = sql`
      with ${lex}, ${vec},
      fusion as (
        select id, sum(1.0 / (${sql.raw(String(k))} + r)) as rrf
        from (select id, r from lex union all select id, r from vec) u
        group by id
      )
      select c.id, c.document_id, c.version, c.titulo, c.texto, f.rrf::float8 as rrf, v.similitud::float8 as similitud
      from fusion f
      join ${ragDocumentChunks} c on c.id = f.id
      left join lex l on l.id = f.id
      left join vec v on v.id = f.id
      where l.id is not null or v.similitud >= ${sql.raw(String(umbralSimilitud))}
      order by f.rrf desc, c.chunk_index
      limit ${limite}`;
    const filas = await this.db.transaction(async (tx) => {
      if (vectorTexto) {
        await tx.execute(sql.raw(`set local hnsw.ef_search = ${efSearch}`));
        await tx.execute(sql.raw(`set local hnsw.iterative_scan = relaxed_order`)); // pgvector ≥ 0.8 (MIG-04 lo comprueba)
      }
      return tx.execute<FilaBusqueda>(consultaSql);
    });
    return filas.rows.map((f) => ({
      chunkId: f.id,
      documentId: f.document_id,
      version: f.version,
      titulo: f.titulo,
      texto: f.texto,
      rango: Number(f.rrf),
      similitud: f.similitud === null ? null : Number(f.similitud),
    }));
  }

  async estados(documentIds: string[]) {
    const resultado = new Map<string, 'INDEXANDO' | 'LISTA' | 'FALLIDA'>();
    if (documentIds.length === 0) return resultado;
    const filas = await this.db
      .select({ documentId: ragIndexDocuments.documentId, estado: ragIndexDocuments.estado })
      .from(ragIndexDocuments)
      .where(inArray(ragIndexDocuments.documentId, documentIds));
    for (const f of filas) resultado.set(f.documentId, f.estado === 'ACTIVO' || f.estado === 'LISTO' ? 'LISTA' : f.estado === 'FALLIDO' ? 'FALLIDA' : 'INDEXANDO');
    return resultado;
  }
}
