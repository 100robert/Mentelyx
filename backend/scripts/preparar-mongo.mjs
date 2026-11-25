#!/usr/bin/env node
// Crea (idempotente) los índices de `tutor_conversaciones` (persistencia, sección 8.3): conversación única,
// listado por propietario y actividad, y TTL de retención (90 días desde la última actividad, ADR-079).
// Uso: MONGODB_URL=... [MONGODB_DB=mentelyx] node backend/scripts/preparar-mongo.mjs
import { MongoClient } from 'mongodb';

const url = process.env.MONGODB_URL ?? 'mongodb://127.0.0.1:57017';
const nombre = process.env.MONGODB_DB ?? 'mentelyx';
const cliente = new MongoClient(url, { serverSelectionTimeoutMS: 10_000 });
try {
  await cliente.connect();
  const col = cliente.db(nombre).collection('tutor_conversaciones');
  await col.createIndex({ conversationId: 1 }, { unique: true, name: 'conversacion_uq' });
  await col.createIndex({ ownerUserId: 1, updatedAt: -1 }, { name: 'propietario_actividad' });
  await col.createIndex({ expiraEn: 1 }, { expireAfterSeconds: 0, name: 'retencion_ttl' });
  const indices = (await col.indexes()).map((i) => i.name);
  console.log(`tutor_conversaciones en «${nombre}»: ${indices.join(', ')}`);
} finally {
  await cliente.close();
}
