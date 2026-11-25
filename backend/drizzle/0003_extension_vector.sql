-- Migración personalizada (drizzle-kit generate --custom; ADR-075). pgvector ≥ 0.8.0 para `rag_document_chunks.embedding`
-- (persistencia, sección 14.3). Debe existir antes de la migración que crea las tablas RAG de M6.
CREATE EXTENSION IF NOT EXISTS vector;
