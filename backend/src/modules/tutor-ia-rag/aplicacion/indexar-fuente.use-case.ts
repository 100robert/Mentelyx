import { FuenteRegistrada } from '@mentelyx/contratos';
import { hashContenido } from '../../../shared/bd/mensajeria';
import { registrar } from '../../../shared/registro';
import { costoUsd, estimarTokens, fragmentar, tieneSenalInyeccion, type EmbeddingsPort, type IndexadorPort, type LeerContenidoPort } from '../dominio/tutor';

/**
 * Consumidor de `FuenteRegistrada` (M2 → M6). Lee el original mediante M2, lo fragmenta y lo indexa con BGE-M3
 * (`vector(1024)`, ADR-076). Si el modelo de embeddings no está configurado o falla, indexa en modo solo léxico
 * (degradación, RAG sección 10.3): la fuente queda consultable por texto y nunca bloquea al estudiante.
 * Una entrega repetida del mismo evento no crea un segundo índice (inbox). Si la lectura falla, lanza: el relay
 * reintenta con espera creciente.
 */
export const crearIndexarFuente =
  (deps: { leerContenido: LeerContenidoPort; indexador: IndexadorPort; embeddings: EmbeddingsPort | null }) =>
  async (evento: { id: string; tipo: string; payload: unknown }): Promise<'PROCESADO' | 'DUPLICADO' | 'IGNORADO'> => {
    if (evento.tipo !== 'FuenteRegistrada') return 'IGNORADO';
    const f = FuenteRegistrada.parse(evento.payload);
    const leido = await deps.leerContenido(f.propietarioId, f.contentId);
    if (!leido) throw new Error('FUENTE_NO_DISPONIBLE');
    const textos = fragmentar(leido.texto);

    let vectores: number[][] | null = null;
    let costo = 0;
    if (deps.embeddings && textos.length) {
      try {
        const e = await deps.embeddings.embeber(textos);
        vectores = e.vectores;
        costo = costoUsd({ entradaUsdPorM: deps.embeddings.precioUsdPorM, salidaUsdPorM: 0 }, e.tokens, 0);
      } catch (e) {
        registrar('warn', 'rag.embeddings_no_disponibles', { contentId: f.contentId, tipo: e instanceof Error ? e.name : typeof e });
      }
    }

    const fragmentos = await Promise.all(
      textos.map(async (texto, indice) => ({
        indice,
        texto,
        tokens: estimarTokens(texto),
        hash: await hashContenido(texto),
        senalInyeccion: tieneSenalInyeccion(texto),
        embedding: vectores?.[indice] ?? null,
      })),
    );
    return deps.indexador.indexarUnaVez({
      source: 'M2',
      eventId: evento.id,
      payload: evento.payload,
      documentId: f.contentId,
      version: f.version,
      ownerId: f.propietarioId,
      titulo: f.titulo,
      embeddingModel: vectores ? 'bge-m3' : 'lexico',
      costoUsd: costo,
      fragmentos,
    });
  };
