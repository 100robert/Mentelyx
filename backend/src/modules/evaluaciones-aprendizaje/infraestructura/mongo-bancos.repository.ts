import type { Collection, Db } from 'mongodb';
import type { Pregunta } from '@mentelyx/contratos/educacion/pregunta-esquema';
import type { BancoPreguntasPort, VersionBanco } from '../dominio/preparacion';

export const COLECCION_BANCOS = 'question_banks';
export const ESQUEMA_PREGUNTA = 'mentelyx.pregunta/v1';

/** Documento de persistencia 4.2 (`question_banks`, M3). En V1, `postgresEvaluationId` es la preparación (learning_goals.id). */
type Documento = {
  postgresEvaluationId: string;
  evaluationVersion: number;
  ownerUserId: string;
  schemaVersion: typeof ESQUEMA_PREGUNTA;
  origin: 'PERSONALIZADA';
  operationKey: string;
  questions: Pregunta[];
  createdAt: Date;
};

const aVersion = (d: Documento): VersionBanco => ({ version: d.evaluationVersion, preguntas: d.questions, creadaEn: d.createdAt, operationKey: d.operationKey });

/**
 * Banco de preguntas versionado e inmutable (persistencia 4.2 y 13; ADR de MongoDB para documentos de M3). Cada cambio
 * publica la versión siguiente completa; un intento califica siempre con la versión con la que empezó. Toda lectura
 * filtra por `ownerUserId`. No hay transacciones distribuidas con PostgreSQL: el intento guarda la versión usada.
 */
export class MongoBancosPreguntas implements BancoPreguntasPort {
  private lista: Promise<Collection<Documento>> | undefined;
  constructor(private readonly conectar: () => Promise<Db>) {}

  private col() {
    this.lista ??= this.conectar().then((db) => db.collection<Documento>(COLECCION_BANCOS));
    return this.lista;
  }

  async ultima(ownerUserId: string, preparacionId: string) {
    const d = await (await this.col()).find({ postgresEvaluationId: preparacionId, ownerUserId }, { projection: { _id: 0 } }).sort({ evaluationVersion: -1 }).limit(1).next();
    return d ? aVersion(d) : null;
  }

  async version(ownerUserId: string, preparacionId: string, version: number) {
    const d = await (await this.col()).findOne({ postgresEvaluationId: preparacionId, ownerUserId, evaluationVersion: version }, { projection: { _id: 0 } });
    return d ? aVersion(d) : null;
  }

  async porClave(ownerUserId: string, preparacionId: string, operationKey: string) {
    const d = await (await this.col()).findOne({ postgresEvaluationId: preparacionId, ownerUserId, operationKey }, { projection: { _id: 0 } });
    return d ? aVersion(d) : null;
  }

  async publicar(ownerUserId: string, preparacionId: string, base: number, preguntas: Pregunta[], operationKey: string) {
    try {
      await (await this.col()).insertOne({
        postgresEvaluationId: preparacionId,
        evaluationVersion: base + 1,
        ownerUserId,
        schemaVersion: ESQUEMA_PREGUNTA,
        origin: 'PERSONALIZADA',
        operationKey,
        questions: preguntas,
        createdAt: new Date(),
      });
      return 'OK' as const;
    } catch (e) {
      if ((e as { code?: number }).code === 11000) return 'CONFLICTO' as const;
      throw e;
    }
  }
}

/** Índices y validador documental (persistencia 4.2 y 8.3). Idempotente: lo ejecuta `backend/scripts/preparar-mongo.mjs`. */
export async function asegurarIndicesBancos(db: Db) {
  const existe = (await db.listCollections({ name: COLECCION_BANCOS }).toArray()).length > 0;
  const validador = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['postgresEvaluationId', 'evaluationVersion', 'ownerUserId', 'schemaVersion', 'questions', 'createdAt', 'operationKey'],
      properties: {
        postgresEvaluationId: { bsonType: 'string' },
        evaluationVersion: { bsonType: 'int', minimum: 1 },
        ownerUserId: { bsonType: 'string' },
        schemaVersion: { enum: [ESQUEMA_PREGUNTA] },
        operationKey: { bsonType: 'string' },
        questions: { bsonType: 'array', maxItems: 500, items: { bsonType: 'object', required: ['id', 'tipo', 'version'] } },
        createdAt: { bsonType: 'date' },
      },
    },
  };
  if (existe) await db.command({ collMod: COLECCION_BANCOS, validator: validador, validationLevel: 'strict' });
  else await db.createCollection(COLECCION_BANCOS, { validator: validador, validationLevel: 'strict' });
  const col = db.collection(COLECCION_BANCOS);
  await col.createIndex({ postgresEvaluationId: 1, evaluationVersion: 1 }, { unique: true, name: 'banco_version_uq' });
  await col.createIndex({ postgresEvaluationId: 1, ownerUserId: 1, operationKey: 1 }, { unique: true, name: 'banco_operacion_uq' });
}
