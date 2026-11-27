---
name: mentelyx-check
description: Revisar un cambio puntual de Mentelyx para detectar regresiones, incoherencias y pérdidas de documentación, sin modificar archivos. Usar en auditorías.
---

# Revisión focalizada de Mentelyx

## Cuándo usar
Usar cuando se pida revisar cambios antes de aceptarlos, terminar documentación o integrar una funcionalidad. Esta skill es **solo lectura**.

## Método
1. Lee `git status --short` y el `git diff` del alcance indicado; si no hay diff, revisa archivos explícitamente solicitados.
2. Documentación: identifica eliminación de apartados, pérdida de diagramas/archivos/identificadores, cambios injustificados de alcance o protagonismo erróneo de M5 frente a M6. Comprueba que `## 6. Código de referencia` cubre M1–M7 si ese apartado está en revisión.
3. Código: confirma propietario de cada regla, dependencia hacia interfaces, consistencia de contratos y separación de capas; valida permisos para recuperación RAG, autoridad de corrección en M3 e integridad en M5 cuando apliquen.
4. Ejecuta verificaciones locales de bajo costo **solo si se pidió revisar código** y existen comandos configurados; no hagas llamadas a proveedores pagos o servicios externos sin autorización.
5. Reporta hallazgos en orden de gravedad, con archivo y línea, y luego pruebas y asuntos abiertos. Evita recomendaciones estilísticas no relacionadas.

## Restricción
No edites archivos, no reinstales dependencias y no reformatees el repositorio durante la revisión.
