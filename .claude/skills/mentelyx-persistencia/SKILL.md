---
name: mentelyx-persistencia
description: "Completa diseño SQL/NoSQL, dimensionamiento, entidades, índices, transacciones, recuperación y relación entre almacenamientos."
---

# mentelyx-persistencia

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Leer ADR-006/019/023/026/031/035/041 si existen, atributos y escenarios EQ pertinentes, y docs/03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md. Actualizar el archivo existente, no duplicarlo.
2. Responder cinco preguntas docentes con supuestos explícitos: usuarios/crecimiento, lecturas/escrituras, datos críticos, latencia y costos. Separar carga API, archivos, audiovisual e IA.
3. Precisar propietario y fuente oficial: PostgreSQL para cuentas/sesiones/permisos, metadatos/licencias, resultados, reservas, pagos/créditos, campañas y registros de uso; MongoDB para bloques pedagógicos y Studio versionados; pgvector para índice RAG; Redis efímero; R2 binarios. Conversaciones y pizarra guardada: coordinar conservación/propiedad con diseño IA, sin guardar todo por defecto.
4. Comparar JSONB con MongoDB conforme a consultas y costos. Documentar decisión, alternativa, riesgo y prueba. No atribuir FK o transacciones distribuidas a SQL/NoSQL. Definir orden de publicación, idempotencia, reparación y estados intermedios.
5. Entregar entidades/campos/tipos/PK/FK/cardinalidades/constraints/índices, colecciones JSON Schema y ejemplos, claves Redis/TTL/invalidez, objetos privados R2, migraciones expand-contract y respaldo/restauración. Definir vector/dimensión solo según modelo seleccionado. No crear migraciones productivas sin autorización.
6. Modelos ER editables si la tarea lo requiere; señalar diferencias entre propuesta y medición.
