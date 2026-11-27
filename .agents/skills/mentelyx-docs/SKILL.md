---
name: mentelyx-docs
description: Refinar o completar documentación arquitectónica de Mentelyx conservando secciones y decisiones existentes. Usar solo para tareas documentales.
---

# Documentación de Mentelyx

## Cuándo usar
Usa esta skill para actualizar requisitos, diseño interno, UML, ADR, trazabilidad o documentación del proyecto. No usar para programar funcionalidades.

## Método
1. Localiza **el archivo exacto** y la versión vigente. Lee solo ese archivo y las fuentes de verdad necesarias para el cambio solicitado; no recorras todo el repositorio sin motivo.
2. Anota el alcance permitido y los elementos intocables. Conserva títulos, texto válido, identificadores, imágenes, tablas, código y enlaces originales.
3. Realiza un cambio **incremental**, no un reemplazo ni un resumen. Nunca elimines material útil solo para acortar el documento.
4. En `diseño-interno-de-modulos`, conserva los siete módulos M1–M7 y sus diagramas. **M6 — Tutor IA y RAG** es el caso funcional educativo central; **M5 — Suscripciones y Pagos** es un ejemplo técnico comercial complementario, no la esencia de Mentelyx.
5. En `## 6. Código de referencia`, conserva íntegro el ejemplo existente de M5 y completa ejemplos coherentes de **los siete módulos**, separando dominio, aplicación, infraestructura, presentación y composición. M6 puede tener mayor profundidad. No declares archivos o clases propuestos como implementados.
6. Contrasta nuevos nombres y flujos con requisitos y decisiones vigentes. No inventes funcionalidades, cifras ni estados de implementación.
7. Revisa `git diff --check` y `git diff -- <archivo>`; comprueba que solo tocaste el alcance solicitado y que no se rompieron enlaces locales.

## Respuesta final
Indica solo: archivos modificados, cambios esenciales, material conservado, verificaciones y pendientes reales. Evita repetir el documento entero en el chat.
