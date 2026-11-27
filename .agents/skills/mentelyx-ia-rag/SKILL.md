---
name: mentelyx-ia-rag
description: "Define M6, selección multiproveedor, RAG autorizado, evaluación pedagógica, costos y cuotas."
---

# mentelyx-ia-rag

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Leer RF/ADR/EQ y contratos M1/M2/M3/M5/M6. No modificar diseño físico de datos sin solicitud de coordinación.
2. Clasificar solicitudes: explicación, razonamiento matemático, visión, 2D/3D, documentos y Studio. DeepSeek candidato para razonamiento; elegir modelos de texto/visión/embeddings/3D por evidencia oficial, costo, español, privacidad y límites. No inventar nombres ni contratar.
3. Definir enrutamiento, puertos por capacidad, esquema versionado, streaming/async, timeouts, cancelación, fallbacks compatibles, presupuesto y conciliación. M5 derechos/cuotas, M6 consumo técnico, M2 contenidos/Studio. No permitir cambios de notas, pagos ni permisos al LLM.
4. RAG: licencia y versión, extracción, chunking, embedding, pgvector, filtros ACL y revalidación contra M2, referencias verificables, revocación, reindexación y eliminación. Tratar texto recuperado como datos no confiables. Seleccionar y documentar parámetros iniciales y benchmark.
5. Diseñar conjunto de evaluación con respuestas conocidas, revisión docente, recuperación y citas, latencia, tokens, costos, seguridad y pruebas de denegación. No afirmar resultados no ejecutados.
