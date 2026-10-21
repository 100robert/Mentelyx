# 04. Atributos de calidad — Mentelyx

> **Versión:** 1.3 — revisión integral del análisis de Mentelyx (20 de octubre de 2026).  **Estado:** arquitectura de referencia definida; importes comerciales, cuotas y contratos sujetos a validación. No implica software ya desarrollado ni servicios contratados.


## 1. Catálogo vigente

Se conservan **AC-01 a AC-11**. Los atributos expresan propiedades del sistema, no prestaciones de suscripción ni cifras de rentabilidad. Escenarios EQ en `08-escenarios-atributos-calidad.md`.

| ID | Atributo | Definición orientada al producto actualizado | Requisitos clave |
|---|---|---|---|
| AC-01 | Rendimiento | Consultar contenidos, resultados, perfiles docentes y operaciones autorizadas con tiempos adecuados bajo carga conocida. | RF-05, RF-37, RF-60, RF-84, RF-89 |
| AC-02 | Disponibilidad | Garantizar continuidad proporcional de flujos esenciales, detección y recuperación de fallas, y degradación selectiva cuando fallen servicios no esenciales; documentar dependencias y límites de los niveles gratuitos. | RF-63, RF-64, RF-66, RF-90, RF-95, RF-96 |
| AC-03 | Escalabilidad | Poder incrementar capacidad al crecer la cantidad de estudiantes, contenidos y solicitudes, especialmente durante evaluaciones y simulacros. | RF-10, RF-48, RF-77, RF-89, RF-91 |
| AC-04 | Seguridad | Proteger datos personales, resultados, sesiones y operaciones económicas, con autorización por usuario y recurso. | RF-02, RF-04, RF-54, RF-58, RF-90, RF-93, RF-99 |
| AC-05 | Mantenibilidad | Cambiar o añadir áreas, cursos, políticas comerciales y estrategias de personalización sin afectar innecesariamente módulos independientes. | RF-43, RF-65, RF-73, RF-97 |
| AC-06 | Integridad y consistencia | Preservar resultados académicos y coherencia de reservas, cupos, pagos y liquidaciones; prevenir efectos duplicados. | RF-22, RF-27, RF-68, RF-74–RF-85, RF-92, RF-96 |
| AC-07 | Usabilidad | Permitir realizar los flujos principales desde celulares, tabletas y computadoras, tanto en navegador como en PWA compatible. | RF-33, RF-34, RF-55, RF-69, RF-76, RF-83 |
| AC-08 | Interoperabilidad | Integrar clientes y proveedores mediante contratos claros, verificables y desacoplados de implementaciones específicas. | RF-26, RF-27, RF-48, RF-90, RF-93 |
| AC-09 | Testabilidad | Poder comprobar casos de uso y reglas del negocio mediante pruebas reproducibles y dependencias sustituibles. | RF-07, RF-50, RF-68, RF-91–RF-96 |
| AC-10 | Operabilidad y eficiencia económica | Medir y controlar consumo de IA, clases en vivo, streaming y servicios administrados; detectar aumentos de gasto sin requerir intervención diaria del operador. | RF-38, RF-44, RF-63, RF-71, RF-79, RF-84–RF-87 |
| AC-11 | Confiabilidad pedagógica y gobernanza de fuentes | Las explicaciones asistidas por IA deben usar fuentes autorizadas y trazables, distinguir incertidumbre y no alterar resultados académicos sin un caso de uso verificado. | RF-35, RF-41, RF-42, RF-62, RF-99 |

## 2. Prioridad y métricas preliminares

| Prioridad | Atributo | Medida de referencia por verificar |
|---|---|---|
| **Crítica** | AC-02 Disponibilidad | **Meta 99,5 % mensual** para API educativa esencial (solo objetivo, no SLA), pruebas de fallos y restauración; definir RTO/RPO por servicio con presupuestos reales. |
| **Crítica** | AC-04 Seguridad | 100 % de accesos no autorizados previstos denegados en pruebas; secretos en backend; MFA para administración y protección para menores. |
| **Crítica** | AC-06 Consistencia | 0 pagos dobles, 0 créditos Live/Studio gastados dos veces y 0 sobrecupos en conjunto de pruebas concurrentes; confirmaciones duraderas. |
| **Alta** | AC-01 Rendimiento | API catálogo p95 ≤ 2 s con 100 usuarios de prueba; 5xx <1 %; Studio y llamadas IA se miden aparte sin prometer tiempos del proveedor. |
| **Alta** | AC-03 Escalabilidad | Ensayos graduados hasta 200 usuarios API; sesión audiovisual de **35 alumnos + 1 docente**, y varios grupos simultáneos bajo pruebas específicas. |
| **Alta** | AC-07 Usabilidad | Pruebas móviles de inscripción Live y generación Studio; mostrar saldo, tipo de crédito, precio/uso, estado de guardado y errores. |
| **Alta** | AC-10 Operabilidad / costo | Costo por generación IA, por participante-minuto, por alumno y por plan; alertas y límite duro de uso en backend; margen calculado con utilización completa. |
| **Alta** | AC-05/08/09 | Sustituir proveedor de IA/pagos/video mediante adaptador sin modificar núcleo de dominio; CI y pruebas de contratos. |
| **Alta** | AC-11 Confiabilidad pedagógica | Recuperación autorizada y atribuible; sin usar IA para inventar notas o adjudicar resultados académicos. |

## 3. Disponibilidad y degradación — criterios diferenciados

| Falla | Comportamiento seguro esperado |
|---|---|
| Redis | Caché deja de funcionar; consulta pública podrá ir a origen con protección de carga. Autenticación/limitación sensible mantendrá controles conservadores o denegará operación riesgosa. |
| Proveedor IA | Mantener material ya publicado y edición manual; informar que generación no está disponible y no consumir créditos sin resultado válido. |
| PostgreSQL/Neon | No aceptar pagos, cambios de créditos ni respuestas confirmadas sin escritura duradera; modo lectura solo si existe fuente coherente y autorizada. |
| MongoDB Atlas | Bloquear edición/publicación documental que requiera confirmación; preservar borrador local indicando estado. |
| RealtimeKit | Intentar reconexión, preservar reserva y facilitar compensación/reprogramación; no prometer continuidad sin cortes. |
| Pasarela | Resultado incierto permanece pendiente y se concilia; no reintentar el cargo con otra clave de idempotencia sin determinar estado. |
| Queues | Eventos de outbox durables y reintentos; DLQ revisable; no perder notificaciones críticas de negocio. |

## 4. Experiencia Studio y aulas (calidad percibida)

- **Créditos transparentes:** la UI explica antes de ejecutar cuánto descuenta y muestra historial. Cambiar colores o modificar gráficos deterministas no consume IA.
- **Trabajo recuperable:** guardado local y servidor diferenciados; conflictos y reconexión explicados sin falsa confirmación.
- **Calidad de enseñanza:** en sala, controlar emisores simultáneos para no saturar 36 mosaicos; audio/video separado de API.
- **Sostenibilidad:** el plan debe soportar usuarios que realmente utilicen todas las cuotas; un bajo uso no es un atributo de calidad ni garantía de rentabilidad.

## 5. Validación

Toda cifra anterior está **propuesta**. Debe pasar pruebas reproducibles con k6, pruebas de integración, simulaciones de pagos, pruebas de reconexión y piloto de generación con costo real, registrando fecha, región, proveedor, plan contratado, carga y evidencia.
