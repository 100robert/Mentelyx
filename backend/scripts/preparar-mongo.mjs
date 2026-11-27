#!/usr/bin/env node
// Prepara (idempotente) MongoDB según persistencia, secciones 4.2, 8.1 y 8.3:
//  - `tutor_conversaciones` (M6): conversación única, listado por propietario, sesiones de una preparación y TTL de
//    retención (90 días desde la última actividad, ADR-079). El estado de la sesión vive en el mismo documento.
//  - `question_banks` (M3): validador $jsonSchema, versión única por preparación y operación idempotente.
// Uso: MONGODB_URL=... [MONGODB_DB=mentelyx] node backend/scripts/preparar-mongo.mjs
// La URL de Atlas es un secreto: se pasa por variable de entorno, nunca en un archivo versionado.
import { MongoClient } from 'mongodb';

const url = process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:57017';
const nombre = process.env.MONGODB_DB ?? 'mentelyx';
const cliente = new MongoClient(url, { serverSelectionTimeoutMS: 10_000 });
try {
  await cliente.connect();
  const db = cliente.db(nombre);

  const col = db.collection('tutor_conversaciones');
  await col.createIndex({ conversationId: 1 }, { unique: true, name: 'conversacion_uq' });
  await col.createIndex({ ownerUserId: 1, updatedAt: -1 }, { name: 'propietario_actividad' });
  await col.createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0, name: 'retencion_ttl' });
  await col.createIndex({ ownerUserId: 1, preparacionId: 1, updatedAt: -1 }, { name: 'propietario_preparacion', partialFilterExpression: { preparacionId: { $type: 'string' } } });
  console.log(`tutor_conversaciones en «${nombre}»: ${(await col.indexes()).map((i) => i.name).join(', ')}`);

  const BANCOS = 'question_banks';
  const validator = {
    $jsonSchema: {
      bsonType: 'object',
      required: ['postgresEvaluationId', 'evaluationVersion', 'ownerUserId', 'schemaVersion', 'questions', 'createdAt', 'operationKey'],
      properties: {
        postgresEvaluationId: { bsonType: 'string' },
        evaluationVersion: { bsonType: 'int', minimum: 1 },
        ownerUserId: { bsonType: 'string' },
        schemaVersion: { enum: ['mentelyx.pregunta/v1'] },
        operationKey: { bsonType: 'string' },
        questions: { bsonType: 'array', maxItems: 500, items: { bsonType: 'object', required: ['id', 'tipo', 'version'] } },
        createdAt: { bsonType: 'date' },
      },
    },
  };
  if ((await db.listCollections({ name: BANCOS }).toArray()).length) await db.command({ collMod: BANCOS, validator, validationLevel: 'strict' });
  else await db.createCollection(BANCOS, { validator, validationLevel: 'strict' });
  const bancos = db.collection(BANCOS);
  await bancos.createIndex({ postgresEvaluationId: 1, evaluationVersion: 1 }, { unique: true, name: 'banco_version_uq' });
  await bancos.createIndex({ postgresEvaluationId: 1, ownerUserId: 1, operationKey: 1 }, { unique: true, name: 'banco_operacion_uq' });
  console.log(`${BANCOS} en «${nombre}»: validador $jsonSchema; ${(await bancos.indexes()).map((i) => i.name).join(', ')}`);
} finally {
  await cliente.close();
}
