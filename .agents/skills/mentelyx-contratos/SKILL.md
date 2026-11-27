---
name: mentelyx-contratos
description: "Completa contratos REST/OpenAPI, interfaces, DTO, streaming, flujos UI y APIs públicas entre módulos."
---

# mentelyx-contratos

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Leer docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md y 03-diseño-de-interfaces-y-flujos.md. Conservar rutas existentes compatibles; no crear duplicados.
2. Cada endpoint: método/ruta, caso de uso, entrada/salida, sesión/permisos, validaciones, errores HTTP, idempotencia, límites y trazabilidad. Contratos internos por API pública de módulo, sin acceder a repositorios ajenos.
3. Definir eventos streaming de Tutor IA, protocolo visual versionado y trabajos async para artefactos. Distinguir estados pendientes/completados/fallidos y recuperación.
4. Diseñar recorridos estudiante/docente/admin; móvil primero, estados carga/vacío/error y accesibilidad. Definir retención y eliminación de chats con política explícita.
5. Revisar OpenAPI, C4, UML, entidades y contratos entre módulos. Registrar solicitudes de cambio a otros responsables, no sobrescribir sus decisiones.
