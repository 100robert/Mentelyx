import type { Collection, Db, MongoClient } from 'mongodb';
import type { ConversacionesPort, ConversacionGuardada, EstadoSesionGuardado, MensajeGuardado } from '../dominio/tutor';

export const COLECCION_CONVERSACIONES = 'tutor_conversaciones';
const MAX_MENSAJES = 100; // persistencia, sección 8.1 (los segmentos de continuación llegan en I-2)

type Documento = ConversacionGuardada & { schemaVersion: 'mentelyx.conversacion/v1'; deletedAt: Date | null; estadoSesion?: EstadoSesionGuardado };

/**
 * Conversaciones del Tutor en MongoDB (persistencia, secciones 8.1–8.3). Cada consulta filtra por `ownerUserId`
 * (autorización por recurso) y por vigencia (`expiraEn > ahora`, `deletedAt` nulo); el índice TTL purga lo vencido.
 * La conexión se abre por petición y se cierra al terminar (Workers no comparte sockets entre peticiones).
 */
export class MongoConversaciones implements ConversacionesPort {
  private coleccionLista: Promise<Collection<Documento>> | undefined;

  constructor(private readonly conectar: () => Promise<Db>) {}

  private col() {
    this.coleccionLista ??= this.conectar().then((db) => db.collection<Documento>(COLECCION_CONVERSACIONES));
    return this.coleccionLista;
  }

  async crear(c: Parameters<ConversacionesPort['crear']>[0]) {
    const doc: Documento = {
      conversationId: c.conversationId,
      ownerUserId: c.ownerUserId,
      schemaVersion: 'mentelyx.conversacion/v1',
      titulo: c.titulo,
      espacioId: c.espacioId,
      ...(c.preparacionId ? { preparacionId: c.preparacionId, temaId: c.temaId ?? null } : {}),
      messages: [],
      createdAt: c.ahora,
      updatedAt: c.ahora,
      expiraEn: c.expiraEn,
      deletedAt: null,
      revision: 0,
    };
    await (await this.col()).insertOne({ ...doc });
    return doc;
  }

  async resumenes(ownerUserId: string, ids: string[], ahora: Date) {
    if (!ids.length) return [];
    const docs = await (await this.col())
      .find({ ownerUserId, conversationId: { $in: ids }, deletedAt: null, expiraEn: { $gt: ahora } }, { projection: { _id: 0, conversationId: 1, titulo: 1, updatedAt: 1 } })
      .toArray();
    return docs.map((d) => ({ id: d.conversationId, titulo: d.titulo, actualizadoEn: d.updatedAt }));
  }

  async obtenerEstado(ownerUserId: string, conversationId: string, ahora: Date) {
    const d = await (await this.col()).findOne({ conversationId, ownerUserId, deletedAt: null, expiraEn: { $gt: ahora } }, { projection: { _id: 0, estadoSesion: 1 } });
    if (!d) return undefined;
    return d.estadoSesion ?? null;
  }

  async guardarEstado(ownerUserId: string, conversationId: string, versionEsperada: number, estado: Omit<EstadoSesionGuardado, 'version' | 'actualizadoEn'>, ahora: Date) {
    const col = await this.col();
    const vigente = { conversationId, ownerUserId, deletedAt: null, expiraEn: { $gt: ahora } };
    const nuevo: EstadoSesionGuardado = { ...estado, version: versionEsperada + 1, actualizadoEn: ahora };
    // CAS: solo si la versión guardada es la que la pestaña leyó (0 = nunca se guardó).
    const condicion = versionEsperada === 0 ? { estadoSesion: { $exists: false } } : { 'estadoSesion.version': versionEsperada };
    const r = await col.updateOne({ ...vigente, ...condicion }, [{ $set: { estadoSesion: { $literal: nuevo } } }]);
    if (r.modifiedCount === 1) return nuevo;
    return (await col.countDocuments(vigente, { limit: 1 })) ? ('CONFLICTO' as const) : ('NO_ENCONTRADA' as const);
  }

  async listar(ownerUserId: string, ahora: Date, filtro?: { preparacionId?: string }) {
    const docs = await (await this.col())
      .aggregate<Omit<ConversacionGuardada, 'messages'> & { mensajes: number }>([
        { $match: { ownerUserId, deletedAt: null, expiraEn: { $gt: ahora }, ...(filtro?.preparacionId ? { preparacionId: filtro.preparacionId } : {}) } },
        { $sort: { updatedAt: -1 } },
        { $limit: 50 },
        {
          $project: {
            _id: 0,
            conversationId: 1,
            ownerUserId: 1,
            titulo: 1,
            espacioId: 1,
            preparacionId: 1,
            temaId: 1,
            createdAt: 1,
            updatedAt: 1,
            expiraEn: 1,
            revision: 1,
            mensajes: { $size: '$messages' },
          },
        },
      ])
      .toArray();
    return docs;
  }

  async obtener(ownerUserId: string, conversationId: string, ahora: Date) {
    const doc = await (await this.col()).findOne({ conversationId, ownerUserId, deletedAt: null, expiraEn: { $gt: ahora } }, { projection: { _id: 0 } });
    return doc ?? undefined;
  }

  async agregarIntercambio(ownerUserId: string, conversationId: string, mensajes: MensajeGuardado[], ahora: Date, expiraEn: Date) {
    const col = await this.col();
    const operationKey = mensajes[0]?.operationKey ?? '';
    const titulo = mensajes.find((m) => m.role === 'user')?.text.slice(0, 80) ?? 'Conversación';
    // La condición `messages.operationKey $ne` hace el $push idempotente ante reintentos con la misma clave.
    const r = await col.updateOne(
      { conversationId, ownerUserId, deletedAt: null, expiraEn: { $gt: ahora }, 'messages.operationKey': { $ne: operationKey }, [`messages.${MAX_MENSAJES - mensajes.length}`]: { $exists: false } },
      [
        {
          $set: {
            // $literal: un texto que empieza por «$» (p. ej. LaTeX) no debe interpretarse como ruta de campo.
            messages: { $concatArrays: ['$messages', { $literal: mensajes }] },
            updatedAt: ahora,
            expiraEn,
            revision: { $add: ['$revision', 1] },
            titulo: { $cond: [{ $eq: [{ $size: '$messages' }, 0] }, titulo, '$titulo'] },
          },
        },
      ],
    );
    if (r.modifiedCount === 1) return 'AGREGADO' as const;
    const existe = await col.findOne({ conversationId, ownerUserId, deletedAt: null }, { projection: { _id: 0, messages: { $elemMatch: { operationKey } } } });
    if (!existe) return 'NO_ENCONTRADA' as const;
    return existe.messages?.length ? ('YA_EXISTIA' as const) : ('NO_ENCONTRADA' as const);
  }

  async eliminar(ownerUserId: string, conversationId: string) {
    const r = await (await this.col()).deleteOne({ conversationId, ownerUserId });
    return r.deletedCount === 1;
  }
}

/** Índices de la colección (persistencia, sección 8.3). Idempotente: lo ejecuta el script de preparación de Mongo. */
export async function asegurarIndicesConversaciones(db: Db) {
  const col = db.collection(COLECCION_CONVERSACIONES);
  await col.createIndex({ conversationId: 1 }, { unique: true, name: 'conversacion_uq' });
  await col.createIndex({ ownerUserId: 1, updatedAt: -1 }, { name: 'propietario_actividad' });
  await col.createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0, name: 'retencion_ttl' });
  // V1 (API 12.9): sesiones de estudio de una preparación de examen.
  await col.createIndex({ ownerUserId: 1, preparacionId: 1, updatedAt: -1 }, { name: 'propietario_preparacion', partialFilterExpression: { preparacionId: { $type: 'string' } } });
}

/** Cliente por petición: se crea perezosamente (también la carga del driver) y se cierra al terminar. */
export function clienteMongoPerezoso(crear: () => Promise<MongoClient>, baseDatos: string) {
  let cliente: Promise<MongoClient> | undefined;
  return {
    db: async () => {
      cliente ??= crear().then(async (c) => {
        await c.connect();
        return c;
      });
      return (await cliente).db(baseDatos);
    },
    cerrar: async () => {
      if (cliente) await (await cliente.catch(() => undefined))?.close().catch(() => {});
    },
  };
}
