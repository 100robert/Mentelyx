---
name: mentelyx-build
description: Implementar un incremento pequeño y verificable del software Mentelyx siguiendo su arquitectura vigente. Usar solo para tareas de desarrollo.
---

# Desarrollo incremental de Mentelyx

## Cuándo usar
Usa esta skill al implementar o corregir una funcionalidad, prueba o contrato del código. No usar para reescribir la documentación de arquitectura.

## Método
1. Identifica el caso de uso solicitado, su requisito y el módulo propietario en documentos vigentes. Lee únicamente archivos relevantes del proyecto.
2. Mantén la arquitectura acordada: **monolito modular**, **Clean Architecture** dentro de módulos y contratos públicos entre módulos. Tecnologías de referencia: TypeScript, Hono y Cloudflare Workers; confirma el stack definitivo en el repositorio antes de tocar dependencias.
3. Módulos: M1 identidad/autorización; M2 cursos/contenidos; M3 evaluaciones/progreso; M4 docentes/clases; M5 pagos/derechos; M6 tutor IA/RAG; M7 publicidad/patrocinios. No muevas reglas de negocio a otro módulo por conveniencia.
4. Construye **una sola rebanada vertical pequeña** por tarea: contrato y reglas de dominio → caso de uso → adaptador → presentación → prueba pertinente. No crees siete módulos completos a la vez.
5. Evita dependencias de Hono, SQL y SDK externos en dominio; inyecta adaptadores mediante composición. Para Tutor IA, recupera solo fuentes autorizadas, preserva permisos y distingue explicaciones de calificaciones oficiales. Para pagos, no simules verificación real ni confirmaciones sin persistencia segura.
6. Prioriza pruebas locales necesarias: unitarias y de integración afectadas, más TypeScript/lint si están configurados. No ejecutes toda la batería si una verificación focalizada basta.
7. No añadas servicios, costos, claves reales, migraciones destructivas ni cambios amplios de infraestructura sin necesidad aprobada. Usa `.env.example`, nunca secretos en Git.

## Respuesta final
Explica: qué flujo quedó implementado, archivos afectados, comandos y resultados de prueba, límites o decisiones pendientes. No generes una explicación extensa sobre código que no cambió.
