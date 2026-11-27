# MongoDB Compass: procedimientos reproducibles de Mentelyx V1

**Conexión local:** `mongodb://127.0.0.1:57017` (Docker Compose, sin credenciales). Bases:
- `mentelyx`: funcional;
- `mentelyx_carga`: pruebas de carga;
- `mentelyx_pruebas`: integración.

**Atlas:** usar la URI guardada en `backend/.secretos/atlas.env` (*New connection* → pegar la URI). Hay que pegarla solo en Compass, nunca en documentos ni capturas.

Las colecciones son solo dos y ambas tienen dueño: `tutor_conversaciones` (M6) y `question_banks` (M3). Las demás entidades de V1 viven en PostgreSQL. Las razones están en el [diseño de persistencia](../../../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), sección «Análisis de comportamiento».

## 1. Índices, TTL y validador

- **`tutor_conversaciones` → pestaña *Indexes*.** Índices esperados:
  - `conversacion_uq` (único);
  - `propietario_actividad` (`ownerUserId`, `updatedAt -1`);
  - `retencion_ttl` (`expiraEn`, TTL de 0 s: el documento se borra al vencer, a los 90 días de inactividad, según ADR-079);
  - `propietario_preparacion` (parcial).
- **`question_banks` → pestaña *Indexes*:** `banco_version_uq` (`postgresEvaluationId`, `evaluationVersion`, único) y `banco_operacion_uq`.
- **`question_banks` → pestaña *Validation*:** `$jsonSchema` con nivel `strict`. Exige `postgresEvaluationId`, `evaluationVersion` ≥ 1, `ownerUserId`, `schemaVersion = mentelyx.pregunta/v1`, `questions` (≤ 500) y `operationKey`.

## 2. Consultas representativas y su plan

En *Documents*, escribir el filtro y pulsar *Explain*. El resultado esperado es `IXSCAN` sobre el índice indicado, nunca `COLLSCAN`.

| Operación de la API | Colección | Filtro, orden y proyección | Índice esperado |
|---|---|---|---|
| `GET /tutor-ia/conversaciones` | `tutor_conversaciones` | Filtro `{ "ownerUserId": "<uuid>", "deletedAt": null, "expiraEn": { "$gt": ISODate() } }`, orden `{ "updatedAt": -1 }` | `propietario_actividad` |
| `GET /tutor-ia/conversaciones/{id}` | `tutor_conversaciones` | Filtro `{ "conversationId": "<uuid>", "ownerUserId": "<uuid>" }` | `conversacion_uq` |
| `GET …/conversaciones?preparacionId=` | `tutor_conversaciones` | Filtro `{ "ownerUserId": "<uuid>", "preparacionId": "<uuid>" }` | `propietario_preparacion` |
| `GET /preparaciones/{id}/preguntas` | `question_banks` | Filtro `{ "postgresEvaluationId": "<uuid>", "ownerUserId": "<uuid>" }`, orden `{ "evaluationVersion": -1 }`, límite 1 | `banco_version_uq` |
| Calificación de un intento | `question_banks` | Filtro `{ "postgresEvaluationId": "<uuid>", "ownerUserId": "<uuid>", "evaluationVersion": 1 }` | `banco_version_uq` |

Los planes medidos con `explain('executionStats')` están en [explain-mongodb.json](explain-mongodb.json), generado por `scripts/analisis/explicar-mongo.mjs`.

## 3. Agregaciones para el análisis (pestaña *Aggregations*)

```js
// Conversaciones por estado de retención (sin contenido: solo conteos)
[{ $project: { vencida: { $lt: ['$expiraEn', '$$NOW'] }, conEstado: { $gt: ['$estadoSesion', null] }, mensajes: { $size: '$messages' } } },
 { $group: { _id: { vencida: '$vencida', conEstado: '$conEstado' }, conversaciones: { $sum: 1 }, mensajes: { $sum: '$mensajes' } } }]

// Bloques educativos guardados por tipo (respuestas del Tutor con bloques validados)
[{ $unwind: '$messages' }, { $unwind: '$messages.blocks' }, { $group: { _id: '$messages.blocks.tipo', bloques: { $sum: 1 } } }, { $sort: { bloques: -1 } }]

// Bancos: versiones por preparación y tamaño
[{ $group: { _id: '$postgresEvaluationId', versiones: { $sum: 1 }, preguntas: { $max: { $size: '$questions' } } } }, { $sort: { versiones: -1 } }]
```

## 4. Aislamiento entre estudiantes

Toda lectura de la aplicación filtra por `ownerUserId`, que sale de la sesión del servidor: los repositorios de `mongo-conversaciones.repository.ts` y `mongo-bancos.repository.ts` lo exigen en cada método.

Comprobación en Compass: filtrar `{ "conversationId": "<id de A>", "ownerUserId": "<id de B>" }` devuelve 0 documentos. La API responde 404, como verifican las pruebas de integración del Flujo C.

## 5. Local y Atlas

| Aspecto | Local (Docker) | Atlas (verificado el 27/11/2026) |
|---|---|---|
| Versión y topología | MongoDB 8.0, nodo único | Réplica gestionada (SRV) |
| Índices, TTL y validador | Creados por `preparar-mongo.mjs` | Creados por `preparar-mongo.mjs` desde este equipo |
| Acceso desde Workers desplegados | No aplica | **No verificado**: las IP de salida de Workers no son fijas y Network Access no se abrió a `0.0.0.0/0` |
| Usuario | Sin autenticación (solo 127.0.0.1) | Rol `atlasAdmin` (demasiado amplio: falta un usuario con solo `readWrite` sobre `mentelyx`) |
