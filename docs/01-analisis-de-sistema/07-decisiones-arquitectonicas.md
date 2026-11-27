# 07. Decisiones arquitectónicas — Mentelyx

> **Versión:** 2.0 — 09/11/2026. **Base revisada:** v1.3 (sin fecha explícita en el encabezado). **Estado:** diseño documental sincronizado con dos tipos de cuenta públicos; requisitos y políticas comerciales sujetos a pruebas y validación. No supone código implementado ni servicios contratados.


> **Revisión terminológica:** 2.1 — 10/11/2026. Se conservan el alcance, los identificadores y la versión funcional 2.0.

> **Revisión de datos, seguridad e infraestructura:** 2.2 — 17/11/2026. Integra resolución razonada de ADR-056–072 y refinamientos de la sección 9. Diseño seleccionado no equivale a integración probada; SDD consolidado fuera de alcance.

> **Corrección integral:** 2.4 — 20/11/2026. Aplica la [instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md) (IM): sección 11 con ADR-074 a ADR-092; ADR sustituidas o modificadas marcadas en su fila; P-01 a P-11 resueltas (sección 10.3); banderas actualizadas (sección 10.4).

> **Alcance de V1:** 2.5 — 25/11/2026. Sección 12 con ADR-093: Mentelyx V1 se centra en aprendizaje y preparación de exámenes; Studio, docentes, aulas, tutorías humanas, gestión institucional y publicación de cursos se posponen sin borrar sus decisiones (marcadas en su fila).

> **Cierre de decisiones:** 2.3 — 17/11/2026. La sección 10 clasifica cada ADR condicionada (decidida, diferida, bloqueada para producción o pendiente de producto), con su contingencia y su criterio de reconsideración, y añade ADR-073 (herramientas de construcción).

## 1. Criterios de decisión y estados

**Adoptar** significa elegir el diseño objetivo, **NO** que esté desarrollado o desplegado; **Candidato** significa que la elección final requiere pruebas de conectividad, costos, contratos, funciones o seguridad. Se preservan **ADR-001 a ADR-010 y ADR-012 a ADR-044**; **ADR-011 queda reservado**. Se incorporan **ADR-045 a ADR-055**.

Criterios: trazabilidad RF/AC/RC/DA, seguridad/menores, disponibilidad y recuperación, TCO (no solo Free), portabilidad, capacidad de ensayo, costos de IA/video y márgenes a cuota completa.

## 2. Decisiones base existentes (ADR-001 a ADR-030)

| ID | Decisión | Drivers | Justificación | Implementación/consecuencia | Estado |
|---|---|---|---|---|---|
| ADR-001 | **Monolito modular**, no microservicios en el inicio | DA-05, DA-09 | Menos despliegues, menor complejidad de integración, módulos independientes de negocio | **Siete módulos lógicos agrupados:** Usuarios y Administración; Cursos y Contenidos; Evaluaciones y Aprendizaje; Docentes y Clases; Suscripciones y Pagos; Tutor IA y RAG; Publicidad y Patrocinios. Notificaciones = capacidad transversal asíncrona, no módulo de negocio adicional. | Adoptar |
| ADR-002 | **Clean Architecture y puertos/adaptadores por módulo** | DA-05, DA-11, DA-12 | Reglas educativas y comerciales independientes de HTTP, ORM, cloud e IA | Dominio → aplicación ← adaptadores de infraestructura y presentación; pruebas aisladas | Adoptar |
| ADR-003 | **TypeScript en Web/PWA y API REST** | DA-05, DA-10 | Un stack tipado con ecosistema web y posibilidad de compartir contratos | **Next.js** (exportación estática donde aplique) + API **Hono/Cloudflare Workers** sobre HTTPS; OpenAPI. Next.js dinámico/SSR será evaluado por separado | Adoptar con prueba del runtime · **Parte estática sustituida por ADR-074 (20/11/2026)** |
| ADR-004 | **Gestión de cuentas, autenticación y autorización en backend** | DA-03, DA-09, DA-21 | Impedir acceso a calificaciones y pagos ajenos; distinguir Estudiante/Docente de modalidad, autoría Studio, habilitación comercial y credenciales profesionales verificadas | Sesiones seguras, tipos de cuenta públicos restringidos, permisos por capacidad y autorización por recurso, controles de auditoría | Adoptar |
| ADR-005 | **Pasarela de pagos desacoplada** | DA-04, DA-06, DA-12 | Poder sustituir proveedor; evitar inconsistencias con tutorías y suscripciones | `PaymentPort` + adaptadores; evaluar Mercado Pago/Culqi Perú; webhooks firmados | Adoptar la interfaz, proveedor condicionado · **Proveedor resuelto por ADR-082: CulqiOnline** |
| ADR-006 | **PostgreSQL como fuente de verdad transaccional y de autorización** | DA-06, DA-11, DA-19 | Reservas, pagos, permisos, resultados oficiales y relaciones académicas requieren transacciones consistentes | PostgreSQL administrado para cuentas de usuario, catálogo de referencias, permisos, publicaciones, progresos y operaciones económicas; transacciones, índices, respaldos y `JSONB` cuando sea apropiado | Adoptar |
| ADR-007 | **Eventos externos y pagos idempotentes** | DA-04, DA-06 | Reintentos de webhooks no deben duplicar cobros o reservas | Claves únicas, máquina de estados, tabla de eventos procesados y operaciones transaccionales | Adoptar |
| ADR-008 | **Cola de tareas gestionada para trabajo asíncrono** | DA-07, DA-09, DA-12 | Los fallos de correo o tareas lentas no deben detener las operaciones principales | Cloudflare Queues + consumidores Workers, reintentos, dead-letter queue, tareas programadas | Adoptar si se usa Workers |
| ADR-009 | **Almacenamiento de objetos y streaming separado de SQL/NoSQL** | DA-01, DA-02, DA-19 | Archivos y videos binarios no pertenecen a las bases de datos operacionales | Cloudflare R2 para PDF, imágenes y adjuntos; Bunny Stream para videos; PostgreSQL mantiene permisos/metadatos y MongoDB la estructura pedagógica si aplica | Adoptar |
| ADR-010 | **Cuentas independientes de convenios** | DA-08 | Mantener cuenta, historial y permisos aun cuando venza un convenio | Gestión de cuentas de usuario separada de Convenios y Beneficios | Adoptar |
| ADR-012 | **Redis adoptado para caché y controles efímeros** | DA-01, DA-02, DA-06 | Evitar lecturas repetidas sin introducir inconsistencia de datos sensibles | CDN/caché HTTP para público; Redis local y Upstash REST como adaptador de producción, sin sesiones/cuotas autoritativas | Adoptada; Upstash seleccionado como diseño, contrato y pruebas pendientes (sección 9) |
| ADR-013 | **Despliegue serverless-first con bajo trabajo de operación** | DA-01, DA-02, DA-07, DA-09; DA-13, DA-19 | Evitar administración permanente de máquinas y pagar conforme al consumo | Cloudflare Workers (frontend con OpenNext, ADR-074), Queues, R2, Neon PostgreSQL y MongoDB Atlas; validar la conectividad segura con ambos motores y sus costos | Adoptar con pruebas de conectividad/carga |
| ADR-014 | **Videos grabados mediante plataforma de streaming** | DA-01, DA-02; DA-14 | Transcodificación y CDN son más económicos y sencillos si están gestionados | **Bunny Stream** (primera opción, región/tier sujeto a piloto), carga directa autenticada, HLS y enlaces firmados | Condicionada a pruebas en Perú |
| ADR-015 | **Separar clases masivas de tutorías interactivas** | DA-01, DA-02, DA-07; DA-14 | El patrón uno-a-muchos y la interacción bidireccional tienen exigencias/costos distintos | Aulas iniciales **hasta 35 alumnos + docente** por **WebRTC SFU moderado**; transmisiones de mayor audiencia o broadcast serán alternativa futura y requieren ADR específica y prueba de costos. Este refinamiento sustituye el supuesto anterior de clase magistral masiva como modalidad base. | Adoptar topología; proveedor condicionado |
| ADR-016 | **SFU gestionado; no servidor WebRTC propio** | DA-07, DA-09; DA-14 | Reducción de operación TURN/SFU y capacidad de conectar salas | **RealtimeKit como candidato SFU administrado**; validar tope de participantes, calidad en Perú, roles, costos, grabación y simultaneidad. Alternativas como LiveKit si pruebas lo justifican. | Condicionada a prueba de funciones/costo |
| ADR-017 | **No usar Kafka como bus inicial** | DA-05, DA-07, DA-09, DA-12 | No hay streams de eventos independientes que justifiquen cluster, particiones y operación adicionales | Cloudflare Queues + patrones Event/Outbox cuando corresponda; revaluar Kafka solo ante demanda demostrada | Adoptar (descartar por ahora) |
| ADR-018 | **Motor de dominio académico sin llamada obligatoria a LLM** | DA-11, DA-05, DA-06 | Diagnósticos, prerrequisitos y recomendaciones deben ser reproducibles, comprobables y baratos | Motor de reglas/estadísticas con `RecommendationPort`, estrategia sustituible; el LLM no decide unilateralmente calificaciones | Adoptar |
| ADR-019 | **Tutor IA con RAG separado de la evaluación** | DA-11, DA-12; DA-15, DA-19 | Las explicaciones requieren contexto académico y control de costos por tokens | Extracción autorizada desde objetos y contenido pedagógico versionado, `pgvector` en PostgreSQL para embeddings, ACL en cada recuperación, LLM intercambiable y límites por plan | Condicionada a pruebas pedagógicas y de indexación |
| ADR-020 | **Observabilidad, control de costos y privacidad** | DA-03, DA-07, DA-09; DA-13 | Permitir operar con poco personal y detectar crecimiento o errores de facturación | Logs estructurados sin datos sensibles, métricas p95/error/DB/colas/stream/IA, alertas y presupuestos | Adoptar |
| ADR-021 | **CI/CD y contenedores para pruebas y portabilidad** | DA-05, DA-07, DA-12 | Despliegue reproducible y posibilidad de cambiar de proveedor si el runtime edge no cumple | GitHub Actions, pruebas, previews y reversión; Docker Compose para desarrollo/testing; **Docker no es requisito para ejecutar Workers** | Adoptar |
| ADR-022 | **Disponibilidad proporcional; no afirmar HA de extremo a extremo** | DA-06, DA-07; DA-13, DA-19 | Una aplicación serverless todavía depende de las bases de datos y proveedores externos | Timeouts, reintentos selectivos, DLQ, respaldos y restauración **de PostgreSQL y MongoDB**, control de consistencia entre almacenes y pruebas de recuperación | Adoptar |
| ADR-023 | **Persistencia políglota: PostgreSQL + MongoDB por dominio** | DA-01, DA-05, DA-06, DA-11, **DA-19** | Los datos críticos necesitan integridad relacional y las lecciones/actividades admiten documentos flexibles y versionados; una sola BD para todo dificulta evolucionar cada modelo por separado | **PostgreSQL local → Neon PostgreSQL** (cuentas de usuario, créditos, notas, pagos, derechos, vectores); **MongoDB local → Atlas** (documentos pedagógicos y Studio); R2 binarios, Redis efímero. **Proveedores seleccionados** sin contratación aún; verificar conectividad y backups. | **Proveedores confirmados para producción: Neon y Atlas; validar compatibilidad Workers, costos y disponibilidad antes del despliegue** |
| ADR-024 | **Contratos para videoclases y grabaciones** | DA-03, DA-06; DA-14 | Salas, permisos docentes, aforo, moderación, grabación y visibilidad requieren reglas claras. | Crear/entrar/salir sala, rol, límites, grabación opcional, autorización, conservación y auditoría. | Propuesta vinculada a RF-36, RF-37, RF-45 y RF-48; pendiente de prueba |
| ADR-025 | **Publicidad contextual separada del aprendizaje** | DA-16, DA-03; RC-10, RC-15 | Financiar parcialmente la modalidad Gratuita sin usar información académica privada ni interrumpir actividades. | Componente `Publicidad/Patrocinios` con ubicaciones aprobadas, validación de plan/edad-contexto, campañas y métricas agregadas; no banners en exámenes, clases en vivo, editor, lecciones de pago o liquidaciones. | Adoptar política, proveedor condicionado · **Modificada por ADR-086: redes externas y recompensados** |
| ADR-026 | **Licenciamiento editorial e indexación RAG con ACL** | DA-15, DA-17, DA-19; RC-11, RC-12 | El permiso de publicación no equivale al de indexación, explotación comercial o entrenamiento. | Flujo de revisión/licencia en PostgreSQL, material estructurado versionado en MongoDB, indexación/desindexación en pgvector por ID/versión, ACL verificada al recuperar; sin fine-tuning automático. | Adoptar |
| ADR-027 | **Comisiones docentes con ledger y reglas versionadas** | DA-18, DA-06 | Separar precio, impuestos, comisión de cobro, porcentaje de reparto y costos para liquidaciones auditables. | Tablas de tarifas/versiones, transacciones, eventos y liquidaciones, saldos por docente y conciliación verificable. | Adoptar diseño; porcentajes condicionados · **Porcentajes y liquidación por créditos sustituidos por ADR-081** |
| ADR-028 | **Derechos de plan y cuotas medibles** | DA-13, DA-15, DA-16, DA-18 | Limitar consumos variables caros sin impedir el aprendizaje básico autorizado. | Separar venta directa y Live: condiciones de remuneración y márgenes por modalidad, historial versionado, liquidaciones idempotentes. Nunca suponer 70/30 para créditos Live. | Adoptar; cuotas/precios condicionados · **Cuotas y precios sustituidos por ADR-080** |
| ADR-029 | **Cursos comerciales docentes sujetos a acuerdo separado** | DA-17, DA-18 | Los videos demostrativos son promocionales y no generan regalías automáticas; los cursos integrales pueden requerir otra remuneración. | Registro de contratos, licencia por contenido, alcance de distribución y estados de liquidación diferenciados de tutorías. | Adoptar modelo contractual, condiciones condicionadas |
| ADR-030 | **Preparación para exámenes como modalidad transversal; reutilizar los siete módulos** | **DA-20, DA-05, DA-06, DA-11; RF-49 a RF-52; RC-16, RC-17** | Evitar duplicar evaluación, cursos y perfiles; permitir nuevas convocatorias y preservar la historia del estudiante con planes comprobables. | **Evaluaciones y Aprendizaje:** objetivos, planificación, simulacros, seguimiento; **Cursos y Contenidos:** fichas/temarios/preguntas versionadas; **Usuarios y Administración:** permisos; **Tutor IA y RAG:** explicaciones opcionales; **Docentes y Clases:** refuerzo. Reglas de planificación deterministas y verificables; resultados y versiones históricas en PostgreSQL; estructura de ejercicios en MongoDB según ADR-023. | **Adoptar como diseño; implementación y fuentes verificadas pendientes de prueba** |

## 3. Decisiones consolidadas del despliegue previo (ADR-031 a ADR-044)

Se reescriben en un único formato para eliminar anexos contradictorios. Los detalles operativos deberán materializarse con pruebas y ADR individuales cuando se implemente.

| ID | Decisión consolidada | Estado | Referencias / consecuencia verificable |
|---|---|---|
| ADR-031 | PostgreSQL en local; Neon para producción; migraciones repetibles | Adoptada como objetivo | DA-24, RC-23. Mismas restricciones e índices en local y remoto. |
| ADR-032 | Despliegue parcialmente híbrido: Workers/Hono y servicios externos | Adoptada como objetivo | DA-23/24. Pages export estática condicionada a necesidades SSR; Cloud Run solo trabajo pesado. · **Pages estático sustituido por ADR-074** |
| ADR-033 | Biblioteca de autenticación integrada y autorización propia | Better Auth seleccionado como diseño | DA-21. Sesión SQL, sin cookieCache/secondaryStorage de sesión; cookies, correo, MFA y revocación sobre Workers/Neon pendientes de prueba (sección 9). |
| ADR-034 | **Solo Estudiante y Docente en el registro público**; separar modalidad docente, permisos de Studio, habilitación para tutorías, acreditación y suscripción | Adoptada; modelo de cuentas definido | DA-21/DA-22; RF-01/RF-53/RF-56; RC-20/RC-21. Estudiante no cambia de tipo por crear contenidos o ser tutor adulto autorizado; Docente no presume título; Superadministrador es interno. |
| ADR-035 | Studio versionado: MongoDB; derechos y saldos: PostgreSQL; archivos R2 | Adoptada, validación pendiente | DA-19/22. No hay transacción global entre bases. |
| ADR-036 | Disponibilidad mediante detección, degradación, backups y pruebas | Adoptada, pruebas pendientes | DA-23. HA de DB no se presupone gratis. |
| ADR-037 | No añadir balanceador externo sin orígenes redundantes reales | Condicionada | DA-23/24. Workers ya tiene distribución administrada. |
| ADR-038 | Observabilidad, costos y alertas protegidas | Adoptada | DA-23/24. Costo por proveedor y producto; acceso administrativo auditado. |
| ADR-039 | Convenios institucionales después del lanzamiento | Adoptada | DA-25. HU-09/HU-22 y RF-15 a 17 POSTERIOR. |
| ADR-040 | Nivel universitario dentro de catálogo y evaluaciones actuales | Adoptada | DA-25. Sin octavo módulo. |
| ADR-041 | Neon PostgreSQL + MongoDB Atlas en producción | Proveedores elegidos, sin contrato | DA-19. PostgreSQL/MongoDB locales; conectividad/región/HA por validar. |
| ADR-042 | Cloudflare Queues/DLQ para procesamiento de documentos | Adoptada | DA-23. Entrega at-least-once; payload de referencias; consumidor idempotente. |
| ADR-043 | ACID + UNIQUE + webhook + outbox + reconciliación para pagos | Adoptada | DA-06/29. Redis/Queues NO ledger financiero. |
| ADR-044 | Better Auth como biblioteca de Hono; permisos propios | Seleccionado como diseño; integración pendiente | DA-03/21. Avisos oficiales revisados; versión estable exacta se fija al construir, cota de parches revisados ≥1.7.16. No criptografía propia (sección 9). |

## 4. Nuevas decisiones comerciales, de aulas y Studio (ADR-045 a ADR-055)

| ID | Decisión | Estado | Drivers | Consecuencias y prueba |
|---|---|---|---|---|
| ADR-045 | Aulas Live por salón y roles moderados: aforo base 35 alumnos más docente | Adoptar como diseño; probar | DA-14, DA-27, DA-30 | Salas con roles, acceso temporal, participación moderada; no 36 cámaras permanentes ni promesa de 35 sin ensayo. · **«Aulas Live» designa las aulas en vivo de 35 + 1, no el plan sustituido; clases bajo el modelo de ADR-081**; Pospuesta después de V1 (ADR-093) |
| ADR-046 | WebRTC con SFU administrado; RealtimeKit como candidato inicial | Proveedor condicionado | DA-14, DA-23, DA-27 | El flujo audiovisual no pasa por Hono; medir minutos-participante, funciones, reconexión, regiones, grabación y varias aulas simultáneas.; Pospuesta después de V1 (ADR-093) |
| ADR-047 | Catálogo de productos y entitlements separados por línea de negocio | Adoptar | DA-18, DA-26 | Plus/Pro usan cuota de IA; Live usa créditos de clases; Studio tiene créditos IA distintos. Evitar descuentos/beneficios no presupuestados. · **Productos sustituidos por ADR-080** |
| ADR-048 | Ledger transaccional PostgreSQL para créditos Live y Studio | Adoptar | DA-06, DA-26, DA-27, DA-29 | Movimientos, reservas, consumos, reversos, expiración y unicidad mediante SQL ACID; Redis solo caché. · **Ledger vigente para recursos de plan, saldo audiovisual y recompensas (ADR-080/081); los créditos Live y Studio quedan sustituidos** |
| ADR-049 | Motor de viabilidad económica por clase antes de publicación | Adoptar política; calibrar números | DA-13, DA-18, DA-26, DA-29 | Simular ocupación, costos audiovisuales, pasarela, docentes, impuestos y margen; clases gratuitas requieren presupuesto autorizado. · **Parte basada en créditos sustituida por ADR-081** |
| ADR-050 | Créditos Studio con costos medidos por función y edición manual sin consumo | Adoptar política; calibrar tasas | DA-22, DA-26, DA-28 | Precios candidatos 29,90/69,90; 300/900 créditos hipótesis. Token/imagen/PDF medidos; reembolso idempotente por fallo elegible. · **Sustituida por ADR-080 y ADR-088** |
| ADR-051 | Grabaciones externas autorizadas y almacenamiento privado versionado | Adoptar política; proveedor condicionado | DA-14, DA-30 | No almacenar video en Redis/MongoDB; usar sistema de grabación de WebRTC, R2 y eventualmente Bunny según accesos, derechos y costes.; Pospuesta después de V1 (ADR-093) |
| ADR-052 | Conciliación de pagos y liquidaciones contractuales separadas | Adoptar | DA-18, DA-29 | Confirmación de pasarela distinta de transferencia al docente. SQL outbox, webhooks firmados, idempotencia, libro de movimientos y conciliación. |
| ADR-053 | Motor de atribución de costos de IA y límites operativos | Adoptar; benchmark pendiente | DA-13, DA-28, DA-31 | Monitorear costo por operación/plan/modelo, límites por solicitud, cuotas; no afirmar costos ficticios ni infinito. |
| ADR-054 | Resiliencia y continuidad de operaciones por dependencia | Adoptar; ensayos pendientes | DA-07, DA-23, DA-31 | Fallos Redis degradan, IA falla sin bloquear lectura, SQL caído bloquea escrituras críticas; backups y RTO/RPO probados; DLQ. |
| ADR-055 | Plan comercial versionado sin modificar obligaciones históricas | Adoptar | DA-18, DA-26, DA-29 | Guardar versión de condiciones y tarifa docente en cada reserva/suscripción/liquidación; cambios solo prospectivos y aceptados. |

## 5. Análisis de alternativas destacadas

### 5.1 Kafka vs Cloudflare Queues vs Redis

| Opción | Rol | Decisión |
|---|---|---|
| Kafka | Streaming duradero de eventos masivos con consumidores múltiples y replay | **No** en MVP; añade costo y complejidad sin mejorar audiovisual. |
| Cloudflare Queues | Trabajos asíncronos, extracción PDF, indexación, notificaciones y conciliaciones | **Sí**; DLQ e idempotencia con outbox SQL. |
| Redis | Caché, rate limits y estado temporal | **Sí**; no es cola autoritativa ni libro mayor. |
| WebRTC SFU | Audio/video bidireccional y pantalla en vivo | **Sí** con proveedor administrado candidato. |

### 5.2 Suscripción Live frente a pagos individuales con mínimo de pasarela

> **Sustituido (20/11/2026):** análisis histórico. Los créditos Live quedan sustituidos por el saldo audiovisual de Docente Live y los pagos directos al docente (ADR-080 y ADR-081; [persistencia, sección 7.9](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md)).

Clases con compra individual pequeña pueden perder margen cuando la pasarela aplica comisión fija por **cada transacción** (p. ej. mínimo referencial S/3,50). La suscripción Live cobra una vez por mes y registra créditos **por usuario**, aunque sean de regiones distintas. No exige compras grupales. Los pagos individuales siguen siendo posibles solo a precio/costo viable con reglas transparentes.

### 5.3 Persistencia e integridad comercial

> **Sustituido (20/11/2026):** los nombres tentativos siguientes son históricos. El modelo físico vigente de M5 está en la [persistencia, secciones 7.5 y 7.9](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), con su historial en la sección 7.5.1.

**Ledger PostgreSQL**: `subscriptions`, `product_entitlements`, `live_credit_ledger`, `studio_credit_ledger`, `class_reservations`, `class_attendance`, `payment_orders`, `payment_events`, `settlement_items`, `payouts`, `outbox_events` (nombres tentativos). Las tablas oficiales son fuente de verdad. Usar constraints SQL, transacción condicional, políticas versionadas y auditoría; no inventar un saldo Redis. MongoDB mantiene material interactivo; almacenar IDs relacionales, metadatos y permisos en PostgreSQL.

### 5.4 Arquitectura disponible sin garantía falsa

Cloudflare proporciona front/back distribuido y protección DDoS, pero un proveedor PostgreSQL indisponible **no** recupera automáticamente por tener WAF. Alta disponibilidad de BD depende del plan, backup, réplicas y procedimiento probado. Los costos mínimos de despliegue y las metas de disponibilidad se presupuestan por separado de cuotas IA/video.

## 6. Consecuencias para la futura documentación de estilo/enfoque

El **estilo** seleccionado es monolito modular en capas con despliegue parcialmente híbrido y servicios externos; **Clean Architecture** organiza dependencias internas (Dominio ← Aplicación ← Adaptadores/Frameworks). Reglas comerciales de créditos, rentabilidad y seguridad permanecen en Dominio/Aplicación; Redis, Better Auth, pagos y RealtimeKit son adaptadores. El siguiente entregable definirá interfaces y diagrama C4/capas a partir de las ADR existentes.

## 7. Pendientes antes de afirmar implementación o comercializar

- Probar Better Auth, drivers MongoDB, Neon, Redis y RealtimeKit en Workers.
- Medir al menos aula de 35 alumnos + docente, y varias aulas con roles moderados.
- Acordar pasarela, comisiones aplicables, suscripción/reembolso, pago a docentes y tratamiento fiscal.
- Medir consumos IA reales por función y validar 300/900 créditos Studio.
- Ensayar restauraciones SQL/NoSQL, colas, fallos de proveedor y reconexión.

## 8. Revisión de propuestas especializadas ADR-056 a ADR-072

Origen: [registro de Claude, sección 2](../03-diseño-de-software/diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md). Resolución del 17/11/2026 bajo responsabilidad de Codex: evaluar integración y condiciones sin atribuir pruebas al diseño. Las alternativas originales se conservan allí; esta tabla registra motivo y resultado, no aprobación automática.

| ID | Resolución y decisión vigente | Justificación / alternativa / condición y trazabilidad |
|---|---|---|
| ADR-056 | **Adoptar con modificación:** alias/rutas versionadas, Workers AI alojado y Gateway para externos; reemplazar Pro-0813 por V4.1 Flash como objetivo de razonamiento profundo | Acoplar ID retirado rompe servicio. Reemplazo recomendado por Cloudflare verificado en infraestructura sección 5; BP-01 y PEND-05 pendientes. ADR-019/053, EQ-10/30 · **Modelos actualizados por ADR-077** |
| ADR-057 | **Adoptar controles, activación condicionada:** D0–D3, D3 prohibido, API directa DeepSeek solo D0; menores SOLO_ZDR como mínimo | ZDR no equivale a autorización legal ni contrato. Datos reales de menores bloqueados hasta PEND-02; matriz de privacidad también para embeddings/ingesta y fallback. Seguridad secciones 5–6; RC-18/19 |
| ADR-058 | **Diferida a producto:** modo GENERAL no habilitado | Amplía comportamiento de RF-42; no aprobar unilateralmente por conveniencia de fallback. Ante falta de autorización/contexto, SIN_CONTEXTO o indisponibilidad. Alternativa actual: solo FUNDAMENTADA · **Diferición sustituida por ADR-078: GENERAL habilitado** |
| ADR-059 | **Adoptar diseño por fases, condicionar runtime:** parser restringido/math.js; SymPy Python Worker en fase 2 | Se rechaza eval/código libre. Runtime/arranque/costo no medidos; Cloud Run alternativa si no cumple. INF-02, AC-04/11 |
| ADR-060 | **Adoptar:** verificar afirmaciones matemáticas y etiquetar límites antes de presentarlas | Una salida estructurada no prueba corrección. Conjunto de pruebas especializado y verificador pendiente; sin transferir notas de M3 a M6. AC-11, ADR-018 |
| ADR-061 | **Adoptar separación declarativa/resuelta como diseño; motor pendiente de prototipo** | Geometría/cálculos reproducibles; no afirmar ausencia de costos/licencias de todas las dependencias. Excalidraw queda alternativa del lápiz, no sustitución del contrato. PEND-VIS-01/02, AC-05/11 |
| ADR-062 | **Adoptar:** esquemas inmutables/versionados y lectores compatibles | Controla evolución entre cliente/servidor/almacenes. Validar JSON Schema y semántica por prototipo; no aprobar ejemplos solo por JSON sintáctico. SC-05, ADR-035 |
| ADR-063 | **Adoptar distinción, proveedores condicionados:** simulación verificable vs objeto ilustrativo adulto en Studio | No equiparar malla generada a exactitud científica. Stability/Meshy requieren licencia, contrato, costo y BP; no se contratan. AC-11, PEND-04 · **Restricción a Studio y adultos sustituida por ADR-091** |
| ADR-064 | **Adoptar modelo objetivo gemini-embedding-2/1536 con restricciones** | Verificación oficial de dimensión en persistencia sección 7.6; texto pequeño 1536 en alternativa no comparte espacio. Menores/datos no elegibles: modo léxico también en ingesta. SC-15 diferida a BP-07; no alterar vector silenciosamente · **Sustituida por ADR-076: BGE-M3 y vector(1024)** |
| ADR-065 | **Adoptar con modificación:** híbrido autorizado, RRF/MMR y generaciones; ≤60 s para proyección de revocación | Revalidación de autoridad protege aun con índice atrasado; no autorización vía caché. EXPLAIN/Recall y pgvector instalado pendientes; consultas de ejemplo no garantizan HNSW. SC-01/02, INF-06, EQ-11 |
| ADR-066 | **Adoptar con modificación:** PDF Browser Rendering; PPTX PptxGenJS/Cloud Run de respaldo | Hash incluye audiencia/formato y ámbito; excluir notas/soluciones físicamente de entrega estudiante. Compatibilidad y calidad exportadas pendientes PEND-MAT-01/PEND-05; INF-03/04, SC-06 |
| ADR-067 | **Adoptar con modificación:** UTI y admisión SQL M6 más reservas global/proveedor | Candado solo por usuario no protege presupuesto común. Límite duro bloquea toda admisión; costo incierto retenido. Pesos/cuotas no aprobados. SC-03/08/10/11, EQ-10/27/30 · **Cuotas UTI sustituidas por ADR-080 (cuotas comerciales en M5)** |
| ADR-068 | **Adoptar con modificación técnica:** clave obligatoria, GET recuperable, cancelación explícita | Ejecución duradera separada de SSE; no confiar en vida del request. CO-04, pruebas desconexión/duplicados/lease pendientes; no reintentar inferencia incierta |
| ADR-069 | **Diferida la política legal; adoptado mecanismo de minimización** | 30/14 días y otras retenciones propuestas requieren PEND-02. TTL asíncrono, revocación inmediata y purga verificable; historial real desactivado hasta resolución. SC-04/12, SEG-04 · **Sustituida por ADR-079: 90 días** |
| ADR-070 | **Adoptar:** tres procesos separados bajo habilitación | SC-09 integra estados y evidencia en M4; evento a M1 no convierte credencial en habilitación. RF-18/58/59, ADR-034; pruebas por perfil pendientes |
| ADR-071 | **Condicionada, no activada:** imágenes ilustrativas estándar/premium propuestas por Claude | Preservar selección especializada y fuentes del 17/11; faltan BP-06, contrato y límites; no para menores ni gráficos científicos. No se aprueba por tener tarifa publicada · **Sustituida por ADR-077: FLUX.2 Klein** |
| ADR-072 | **Condicionada, no activada:** rutas de explicación propuestas por Claude | Reutilizar evidencia vigente de su sección 19 sin repetir investigación; BP-03 y acuerdos de tratamiento/ZDR condicionan cada ruta. Ningún fallback amplía datos permitidos · **Sustituida por ADR-077: Gemma 4 26B A4B y DeepSeek V4.1 Flash** |

Se aprueban invariantes de integración bajo responsabilidad de Codex; condiciones de producto/legal y benchmarks permanecen explícitas. La [matriz SC/SEG/INF y contrato de coordinación](../03-diseño-de-software/contrato-coordinacion-datos-seguridad-infraestructura.md) define los ajustes a sincronizar con el diseño especializado.

## 9. Consolidación de decisiones propias y evidencia

| ADR existentes refinadas | Cierre de diseño del 17/11/2026 | Alternativa / riesgo / aceptación |
|---|---|---|
| ADR-006/023/031/035/041 | PostgreSQL 17/Neon + Mongo/Atlas mantenidos; SQL para autoridad, Mongo versiones; JSONB para ai_policy; pgvector ligado al modelo (1024 dimensiones con BGE-M3 desde ADR-076) | JSONB para documentos completos es viable y se compara en persistencia sección 6.3, pero no se sustituye Atlas sin ADR y medición. Sin transacción ACID entre motores |
| ADR-007/043/048/052 | Outbox/inbox por dueño, saga durable M4/M5 y M2/M5/M6, créditos/quotes/presupuestos con locks/UNIQUE | Rechazar saldo Redis, retry ciego y publicación antes de persistencia; pruebas EQ-06/24/31 pendientes |
| ADR-004/033/044 | Better Auth seleccionado, sesiones SQL revocables, MFA admin y autorización propia; documentos M4 aislados | Auth.js/IdP evaluados; versiones/parches y compatibilidad detallados en seguridad secciones 1–3. Selección no es instalación |
| ADR-003/013/032/037 | Frontend Next.js híbrido en Workers con OpenNext (ADR-074, sustituye «estático en Pages») y API Workers; sin balanceador dedicado | Guía oficial actualiza opciones dinámicas; no migrar a vinext automáticamente. Orígenes redundantes inexistentes no aportan failover |
| ADR-012/020/038 | Upstash REST seleccionado como caché efímera, límites/TTL y observabilidad sin PII | Contrato/región pendientes; falla Redis no autoriza sesiones ni saldo |
| ADR-008/021/042/054 | Colas/DLQ, límites, ejecución Tutor duradera y relay por operación; CI/CD con promoción revisada | Costos DO/cola y continuidad SSE deben probarse; no despliegue automático. Kafka/Kubernetes descartados al inicio |
| ADR-022/036/054 | RPO/RTO diferenciados, backups independientes, restauración ensayada y conciliación externa | Metas no medidas ni SLA; tiers/costos pendientes. Redis se reconstruye; originales no se presumen regenerables |

Fuentes, fecha y precondiciones en [seguridad](../02-arquitectura-software/seguridad-y-autenticacion.md), [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) y [persistencia](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md). Las tareas y verificaciones ejecutadas constan en el [registro de avance](../00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md). No se alteran HU/RF/AC/RC/DA/EQ ni se redacta el SDD consolidado.

## 10. Cierre de decisiones condicionadas o pendientes (17/11/2026)

Clasificación aplicada a toda ADR que figuraba como candidata, condicionada, recomendada o pendiente:

- **DECIDIDA:** selección concreta sobre la que se construye.
- **DIFERIDA:** excluida de la versión actual.
- **BLOQUEADA PARA PRODUCCIÓN:** decisión definida cuya activación requiere una condición legal, contractual o experimental. Se desarrolla igual, con datos sintéticos y servicios simulados o de prueba.
- **REQUIERE DECISIÓN DE PRODUCTO:** cifra o política que el arquitecto no puede fijar. Se presenta una recomendación (sección 10.3), no una aprobación.

Quedan **DECIDIDAS sin condición pendiente**: ADR-001, 002, 004, 006, 007, 008 (Workers ya está seleccionado), 009, 010, 017, 018, 020, 021, 022, 024 (contratos en la API, sección 2.4), 026, 030 (datos en persistencia, sección 7.8), 031, 032, 034, 038, 040, 042, 043, 047, 048, 052, 055, 060, 062 y 070. Los nombres tentativos de tablas de la sección 5.3 quedan sustituidos por los de la [matriz de persistencia, sección 13](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md).

### 10.1. Clasificación, contingencia y criterio de reconsideración

| ADR | Clasificación | Decisión cerrada | Contingencia seleccionada | Criterio que obliga a reconsiderar |
|---|---|---|---|---|
| 003, 074 | DECIDIDA (ADR-074) | Next.js híbrido SSG/SSR/ISR/CSR en Workers mediante OpenNext; Next.js sin reglas de negocio | Exportación estática de las rutas públicas si OpenNext falla en PR-INF-01, sin mover reglas de negocio a Next.js | OpenNext incompatible en Workers con una ruta requerida; la decisión vuelve al propietario |
| 005, 082 | DECIDIDA (ADR-082); BLOQUEADA PARA PRODUCCIÓN (afiliación y contrato) | `PaymentPort` con `CulqiPaymentAdapter` | Adaptador simulado hasta la afiliación; Mercado Pago queda como alternativa futura no implementada | Afiliación o condiciones contractuales de Culqi inviables |
| 012 | BLOQUEADA PARA PRODUCCIÓN (contrato y región) | Upstash REST con dos bases, `cache` con evicción y `control` sin evicción (persistencia, sección 9.3) | Operar sin Redis: límites en SQL y caché solo en CDN (el diseño no depende de Redis para la corrección) | p95 de Upstash desde Workers > 50 ms o errores > 1 % en PR-INF-01 |
| 013, 023, 041 | BLOQUEADA PARA PRODUCCIÓN (contrato, plan con respaldo y región) | Neon PostgreSQL 17 + pgvector ≥0.8.0 y MongoDB Atlas. Región: la común Neon/Atlas de menor RTT medido desde Lima en PR-INF-01. Plan Atlas con Cloud Backup y Neon con restauración en ventana ≥7 días | Mongo: conexión por Durable Object particionado o adaptador privado con salida controlada (infraestructura, sección 1). Si Atlas falla: documentos en JSONB de Neon (alternativa ya comparada en persistencia, sección 6.3), por ADR | Acceso documental p95 > 500 ms, imposibilidad de restringir la red o costo fijo dominante en PR-INF-01 o PR-INF-02 |
| 014 | BLOQUEADA PARA PRODUCCIÓN (prueba en Perú y contrato) | Bunny Stream para video publicado, con URL firmadas | Cloudflare Stream detrás del mismo puerto de video | Inicio o rebuferización fuera de meta en el piloto, o URL firmadas insuficientes |
| 015 | DECIDIDA / DIFERIDA (emisión masiva) | Aulas de 35 + 1 por SFU | — | La emisión uno a muchos requiere una ADR nueva |
| 016, 045, 046 | BLOQUEADA PARA PRODUCCIÓN (prueba 35 + 1 y costo) | RealtimeKit como SFU administrado | LiveKit Cloud detrás del mismo puerto de sala audiovisual | Falla la prueba 35 + 1, faltan roles o grabación, o el costo por minuto-participante supera el de ADR-049 |
| 019, 065, 076 | BLOQUEADA PARA PRODUCCIÓN (BP-07, PEND-RAG-01) | RAG híbrido con BGE-M3 y `vector(1024)` (ADR-076) | Modo léxico si la ruta de embeddings no está disponible | Recall@8 por debajo del umbral en BP-07: decisión del propietario, sin cambiar de modelo unilateralmente |
| 025, 086 | DECIDIDA (ADR-086); red concreta por seleccionar | Redes publicitarias externas compatibles y anuncios recompensados; M7 verifica y M5 concede | Sin publicidad disponible, el acceso educativo fundamental se conserva | La red no permite verificación en servidor o no es compatible con la protección de menores |
| 027, 028, 049, 050, 067 | Sustituidas por ADR-080 y ADR-081 (cifras aprobadas por el propietario, IM, secciones 14 y 15) | Matriz de planes, modelo docente y cuotas comerciales en M5 | — | Cambios solo con autorización del propietario |
| 029 | DECIDIDA | Cursos comerciales docentes con acuerdo separado | — | — |
| 033, 044 | BLOQUEADA PARA PRODUCCIÓN (prototipo) | Better Auth ≥1.7.16 en Hono/Workers, adaptador Drizzle (ADR-075), sesiones SQL, MFA administrativo y límites de tasa en base de datos | El mismo Better Auth en un runtime Node (Cloud Run) servido bajo `app.<dominio>/api/v1/auth/*` mediante un proxy del Worker, con la misma base de datos y las mismas sesiones | El prototipo falla en el hashing dentro de los límites de CPU o memoria, en las transacciones interactivas o en las pruebas de revocación |
| 035, 036, 054 | BLOQUEADA PARA PRODUCCIÓN (PR-INF-03) | Persistencia políglota, degradación y RTO/RPO por clase | Las metas por clase se rebajan por decisión explícita si el plan no las cumple (persistencia, sección 11) | La restauración ensayada incumple RTO/RPO |
| 037 | DECIDIDA | Sin balanceador de orígenes | — | Aparece un segundo origen independiente |
| 039 | DIFERIDA | Convenios institucionales (RF-15 a 17) | — | Fase POSTERIOR |
| 051 | BLOQUEADA PARA PRODUCCIÓN (consentimiento audiovisual, PEND-02) | Grabación del SFU → R2 restringido de M4 → revisión → Bunny Stream; desactivada por defecto | — | Aprobación legal del consentimiento |
| 053 | BLOQUEADA PARA PRODUCCIÓN (COS-01) | Atribución de costos por operación y tarifa histórica | Presupuesto por operación y tope duro global | Error mediano del estimador > 20 % |
| 056, 077 | DECIDIDA / BLOQUEADA (rutas por benchmark) | Rutas por alias: DeepSeek V4.1 Flash, Gemma 4 26B A4B, BGE-M3 y FLUX.2 Klein 4B/9B (ADR-077) | Falla común de Workers AI: herramientas deterministas y biblioteca; las extensiones externas solo si el propietario las autoriza | BP-01 a BP-06 bajo umbral: decisión del propietario |
| 057 | BLOQUEADA PARA PRODUCCIÓN (PEND-02) | Matriz D0–D3 y `SOLO_ZDR` para menores | Solo datos sintéticos y rutas de Workers AI | Aprobación legal y contratos de tratamiento |
| 058, 078 | DECIDIDA (ADR-078) | Aprendizaje general habilitado y complementación de fuentes decidida por el orquestador | — | — |
| 059 | DECIDIDA (fase 1) / DIFERIDA (SymPy) | Parser restringido + math.js | SymPy en Cloud Run si el Python Worker falla (INF-02) | Fase 2 |
| 061 | BLOQUEADA PARA PRODUCCIÓN (PEND-VIS-01/02) | Motor visual determinista propio | Excalidraw solo para el lápiz, sin sustituir el contrato de escena | El prototipo no cumple VIS-01 a VIS-06 |
| 063, 071, 091 | DECIDIDA (3D para todas las cuentas, ADR-091); BLOQUEADA la generación externa (sin integración autorizada) | Simulaciones deterministas, modelos verificados y biblioteca; FLUX.2 para ilustraciones (ADR-077) | Biblioteca y plantillas deterministas | Calidad o licencia insuficientes de una integración externa |
| 066 | BLOQUEADA PARA PRODUCCIÓN (PEND-05, PEND-MAT-01) | PDF con Browser Rendering; PPTX con PptxGenJS en Worker | Cloud Run Jobs para PPTX (INF-04) | PptxGenJS incompatible o fuera de límites en Workers |
| 068 | BLOQUEADA PARA PRODUCCIÓN (PR-INF-04) | Ejecución por cola con lease y relay SSE | — | Duplicados o pérdidas en la prueba de desconexión |
| 069, 079 | DECIDIDA (90 días, ADR-079); tratamiento de datos reales sujeto a condiciones legales | TTL de 90 días con aviso previo, revocación inmediata y purga verificable | — | — |
| 072 | Sustituida por ADR-077 | — | — | — |

Los pendientes de la sección 7 quedan así: Better Auth, Mongo, Neon, Redis y RealtimeKit en PR-INF-01; aulas de 35 en ADR-045; pasarela y fiscalidad en P-06, P-07 y P-09; créditos Studio en P-04; restauraciones en PR-INF-03.

### 10.2. ADR-073 — Herramientas de construcción del monorepo (nueva, DECIDIDA)

Sin esta decisión, la primera tarea de código tendría que improvisarlas. Cada versión exacta se fija en el lockfile al iniciar la construcción, sin betas, con SBOM y revisión de avisos (seguridad, sección 2).

| Elemento | Decisión | Justificación | Contingencia / criterio |
|---|---|---|---|
| Repositorio | pnpm workspaces: `frontend/` (Next.js), `backend/` (Worker Hono y consumidores de colas), `packages/motor-visual`, `packages/contratos` (esquemas compartidos) | Un solo stack TypeScript (ADR-003) y paquetes compartidos sin publicar | Añadir caché de tareas si la CI supera 10 min |
| Runtime y despliegue | Wrangler; `compatibility_date` y `nodejs_compat` fijados al construir; Node.js LTS activa para herramientas, fijada en `.nvmrc` | Herramienta oficial de Workers | — |
| Acceso SQL | **Sustituido por ADR-075:** Drizzle ORM para esquema, CRUD, repositorios, escrituras y transacciones; Kysely solo para consultas especializadas, RAG híbrido cuando se justifique, reportes, agregaciones y proyecciones. Ambos sobre el driver serverless de Neon, con transacciones interactivas en una sola conexión por petición | Una sola autoridad de esquema | — |
| Migraciones | **Sustituido por ADR-075:** Drizzle Kit es la única autoridad de migraciones, ejecutadas desde un trabajo de CI con rol de migración y nunca desde el Worker. El esquema de Better Auth se integra en el esquema Drizzle. Kysely no tiene migraciones propias. Validadores Mongo aplicados por el mismo trabajo | Expand-contract y reversión (persistencia, sección 11) | — |
| Frontend | Next.js con `@opennextjs/cloudflare` en Workers (ADR-074) | Renderizado híbrido aprobado | — |
| Mongo / Redis / R2 | Driver oficial `mongodb`; `@upstash/redis`; binding R2 nativo de Workers | Compatibilidad documentada (infraestructura, sección 1) | Las de ADR-012 y ADR-041 |
| Validación y OpenAPI | Zod en modo `jitless` (sin `new Function`) con `@hono/zod-openapi` para los DTO HTTP y OpenAPI 3.1. Documentos `mentelyx.*/v1` con JSON Schema compilado en build por Ajv (código standalone) | Cumple la API (sección 1) y el motor visual (sin compilación en tiempo de ejecución) | Valibot si Zod falla en Workers |
| Pruebas | Vitest con `@cloudflare/vitest-pool-workers`; PostgreSQL 17 + pgvector y MongoDB efímeros en CI con Docker Compose (ADR-021); Playwright para E2E y PWA; k6 para carga (SDD, sección 10.2) | Las pruebas corren en el mismo runtime que producción | — |
| Reglas de arquitectura | ESLint con `import/no-cycle` y `no-restricted-imports` por módulo: solo se importa el `index.ts` de otro módulo y el dominio no importa infraestructura ni frameworks | Hace automática la comprobación de ciclos exigida en el diseño interno, sección 10.1 (prueba ARQ-01) | — |
| Observabilidad | Logs y trazas de Workers con `correlationId` y sin PII; métricas de negocio en tablas SQL (persistencia, sección 13); alertas del proveedor y un monitor sintético externo (P-08) | ADR-020/038 sin una base de series temporales | — |

### 10.3. Preguntas de producto P-01 a P-11: resueltas

Las recomendaciones del 17/11/2026 quedan **sustituidas** por las resoluciones del propietario ([instrucción maestra, sección 20](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md)). Ya no son preguntas abiertas.

| ID | Resolución vigente | ADR |
|---|---|---|
| P-01 | Aprendizaje GENERAL habilitado y complementación de fuentes | ADR-078 |
| P-02 | Matriz estudiantil aprobada (IM, sección 14) | ADR-080 |
| P-03 | Presupuestos configurables, medidos y controlados; el 120 % no queda aprobado | ADR-080 |
| P-04 | Productos Studio anteriores sustituidos por los recursos de los planes vigentes | ADR-080, ADR-088 |
| P-05 | Aulas Live de cuatro créditos y S/8 por crédito sustituidos por el modelo docente aprobado | ADR-081 |
| P-06 | Renovación automatizable (con autorización y medio compatible) y manual | ADR-082 |
| P-07 | CulqiOnline como proveedor principal | ADR-082 |
| P-08 | Proveedores tecnológicos objetivo seleccionados; contratación pendiente | ADR-077, ADR-082; IM, sección 18 |
| P-09 | Pagos docentes directos y conciliación, con condiciones fiscales y contractuales explícitas | ADR-081 |
| P-10 | Protección de menores y bloqueo de publicidad incompatible | ADR-086 |
| P-11 | Grupos privados docentes incluidos; RF-117 añadido | ADR-087 |

### 10.4. Cuestiones legales: restricción de producción y comportamiento seguro

Las banderas viven en la configuración versionada del despliegue, no en Redis ni en la base de datos. Cambiar una bandera de producción exige un despliegue revisado y auditado.

| Bandera | Desarrollo y *staging* | Producción hasta resolver | Condición para activar |
|---|---|---|---|
| `tutor.historial` | Activa (90 días) con datos sintéticos | Activa con la política de 90 días solo cuando se habilite el tratamiento de datos reales | Condiciones legales de tratamiento (PEND-02) |
| `ia.rutasExternas.menores` | Desactivada | Desactivada | PEND-02 y contratos de tratamiento |
| `ia.extensionesExternas` (Claude, Gemini, Nano Banana, Stability, Meshy) | Desactivadas | Desactivadas | Autorización del propietario, contrato y benchmark (ADR-077) |
| `rag.embeddings` (BGE-M3 en Workers AI) | Activa | Activa para contenido autorizado; datos reales de menores bloqueados | PEND-02 para datos reales de menores |
| `clases.grabacion` | Desactivada | Desactivada | Consentimiento audiovisual aprobado |
| `habilitacion.documentosReales` | Solo sintéticos | Desactivada | PEND-02 (retención de 90 días) |
| `tutor.avisoATerceros` | Desactivada | Desactivada | PEND-03 |
| `ia.ilustraciones` (FLUX.2 Klein) / `ia.objetos3dExternos` | Proveedor simulado | Ilustraciones tras BP-06; objetos 3D externos desactivados | BP-06; integración 3D autorizada |
| `pagos.reales` | Sandbox de Culqi o adaptador simulado | Desactivada | Afiliación y contrato CulqiOnline (ADR-082) |
| `byok` | Simulado | Desactivada | Proveedores compatibles autorizados y pruebas BYK |
| `publicidad.recompensada` | Simulada | Desactivada para menores; adultos tras seleccionar una red compatible | Red seleccionada con verificación en servidor (ADR-086) |
| `docenteLive.devoluciones` | Sandbox | Desactivada | Condiciones contractuales de distribución de costos de devolución (IM, sección 19.4) |
| `pagosDirectos.tarjetaDocente` | Simulado | Desactivada | Integración verificada para cobrar con tarjeta en favor del docente o liquidar a terceros; Culqi no divide pagos automáticamente (ADR-081) |

## 11. Decisiones de la instrucción maestra (ADR-074 a ADR-092)

Todas fueron aprobadas por el propietario el 20/11/2026 ([IM](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md)). «Aprobada» significa decisión de diseño, no implementación. La compatibilidad, el rendimiento y los costos se miden durante la construcción.

| ID | Decisión | Sustituye o modifica | IM | Consecuencias y condiciones | Estado |
|---|---|---|---|---|---|
| ADR-074 | Frontend Next.js, React y TypeScript como PWA con renderizado híbrido SSG/SSR/ISR/CSR en Cloudflare Workers mediante OpenNext (`@opennextjs/cloudflare`). Next.js no asume reglas de negocio: consume la API Hono | Parte estática de ADR-003 y ADR-032 | 4.1 | Catálogo y biblioteca pública con SSG/ISR; páginas autenticadas con CSR o SSR sin caché compartida; llamadas a Hono por *service binding*; PR-INF-01. Al 21/11/2026 Cloudflare recomienda vinext (beta) para aplicaciones Next.js nuevas en Workers; OpenNext se mantiene como selección hasta la prueba comparativa de PR-INF-01, y cambiar de adaptador exige autorización del propietario | DECIDIDA; compatibilidad por probar |
| ADR-075 | Drizzle ORM y Drizzle Kit: esquema físico, única autoridad de migraciones, CRUD, repositorios, escrituras y transacciones. Kysely: consultas especializadas, RAG híbrido cuando se justifique, reportes, agregaciones y proyecciones, con tipos derivados del esquema Drizzle y sin migraciones propias | «Acceso SQL» y «Migraciones» de ADR-073 | 5.2 | Better Auth con su adaptador Drizzle sobre el mismo esquema; transacciones interactivas en una sola conexión compatible; tipos comprobados en CI (MIG-04) | DECIDIDA |
| ADR-076 | Embeddings con BGE-M3 en Workers AI y `vector(1024)` en pgvector; HNSW coseno parcial por modelo; dimensión real comprobada por el adaptador | ADR-064; resuelve SC-15 como adoptada | 7.1 | Un solo espacio vectorial; las consultas de menores pueden recibir embeddings (Workers AI no retiene ni entrena con el contenido), con los bloqueos legales de datos reales vigentes; el umbral de similitud es experimental | DECIDIDA; Recall por medir (BP-07) |
| ADR-077 | Modelos aprobados: DeepSeek V4.1 Flash (matemático, físico, técnico y complejo; esfuerzo alto para el razonamiento profundo), Gemma 4 26B A4B (explicaciones generales), BGE-M3 (recuperación) y FLUX.2 Klein 4B, y 9B cuando se justifique (ilustraciones). Claude, Nano Banana, Stability, Meshy y otros solo como extensiones futuras. Dos configuraciones del mismo modelo no son redundancia; ante una falla común de Workers AI se degrada a herramientas deterministas y a la biblioteca | Modifica ADR-056; sustituye ADR-071 y ADR-072 | 6.1 | FLUX.2 Klein 4B verificado el 21/11/2026: `@cf/black-forest-labs/flux-2-klein-4b`, publicado en Workers AI el 15/01/2026 (changelog de Cloudflare); texto a imagen y edición con hasta 4 imágenes de referencia menores de 512 × 512 px y 4 pasos fijos; tarifa publicada de USD 0,000287 por mosaico de salida de 512 × 512 px y USD 0,000059 por mosaico de entrada (26,05 y 5,37 neuronas a USD 0,011 por 1 000 neuronas; página de precios modificada el 18/11/2026). Es precio publicado, no costo medido; los términos de Black Forest Labs enlazados en la ficha quedan por revisar. Los demás identificadores se comprueban en PR-INF-01; separación de cuotas M5 y consumo M6 | DECIDIDA; activación por BP-01 a BP-06 |
| ADR-078 | Tutor con aprendizaje general habilitado y complementación de fuentes: el orquestador decide la modalidad según intención, fuentes y contexto; diferencia lo recuperado de lo complementario; respeta la exclusividad; no exige elegir un modo | Diferición de ADR-058; CO-05 | 6; P-01 | `modoFuentes` FUNDAMENTADA, MIXTA o GENERAL lo fija el orquestador; `SIN_CONTEXTO` solo cuando el usuario exige exclusividad y no hay fragmentos | DECIDIDA |
| ADR-079 | Conversaciones conservadas 90 días con aviso previo; parámetros de piloto: cómputo desde la última actividad y aviso 7 días antes; se eliminan los derivados privados; lienzos, cuadernos y recursos guardados tienen ciclo propio | ADR-069 (30/14 días) | 11 | No se aplica a pagos ni calificaciones; tratamiento de datos reales sujeto a condiciones legales | DECIDIDA |
| ADR-080 | Planes y cuotas: matriz estudiantil Gratuito, Estándar S/39,90, Plus S/59,90 y Premium S/89,90, y planes docentes Inicial S/55 y Live S/100, como configuración de piloto versionada. M5 es la autoridad de cuotas comerciales, con reserva, confirmación y liberación idempotentes; M6 registra el consumo técnico. Los presupuestos son configurables, medidos y controlados | ADR-028, ADR-047, ADR-050 y la parte UTI de ADR-067 | 14, 15, 18.1; P-02 a P-04 | Retira Plus S/29,90, Pro S/59,90, UTI 30/300/900, Studio Plus/Pro y Aulas Live; el 120 % no queda aprobado | DECIDIDA; planes docentes pospuestos después de V1 (ADR-093) |
| ADR-081 | Modelo docente: contratación por horas con tarifa del docente; pagos directos (Yape, tarjeta o QR) registrados, verificados y conciliados con comisión configurable, sin custodia de dinero. Docente Live mide participante-minutos, reserva capacidad antes de cada clase, avisa al 70/90/100 %, devuelve el saldo no usado y solo cobra adicionales con autorización. Parámetros de piloto de la IM, sección 15.3 | ADR-027, la parte de ADR-049 basada en créditos y la RC-35 anterior | 15; P-05, P-09 | Condiciones fiscales, de cobro de la comisión y de distribución de costos de devolución por resolver antes de cobrar a usuarios reales. No se asume que CulqiOnline divida automáticamente un pago entre Mentelyx y el docente: el cobro con tarjeta en favor de un docente o su liquidación a terceros requiere una integración verificada y queda bloqueado para producción (decisión del propietario, 21/11/2026). Un pago por QR conserva el proveedor o medio subyacente cuando corresponda | DECIDIDA; BLOQUEADA PARA PRODUCCIÓN (contrato, fiscal y cobro con tarjeta a docentes); POSPUESTA DESPUÉS DE V1 (ADR-093) |
| ADR-082 | CulqiOnline como pasarela principal: `PaymentPort` y `CulqiPaymentAdapter`, API REST, checkout y tokenización, pagos únicos, recurrentes con autorización del comprador, renovación manual (Yape y medios no recurrentes), webhooks con consulta de estado, devoluciones totales y parciales, conciliación y comprobantes. Comisiones configurables por proveedor y medio (IM, sección 19.2). Mercado Pago como alternativa futura no implementada | Proveedor de ADR-005 (P-07) | 19 | Tarifario publicado consultado por el propietario el 20/11/2026; alcance contractual de la comisión mínima por confirmar; afiliación, credenciales y pruebas de integración pendientes | DECIDIDA; BLOQUEADA PARA PRODUCCIÓN (afiliación y contrato) |
| ADR-083 | Pizarra inteligente: lienzo 2D extensible como interfaz principal, barra flotante de consulta y panel de conversación secundario; selección por lazo, región y objeto con preguntas contextualizadas; capas separadas (original, usuario e IA); coordenadas de mundo independientes del zoom, versiones, concurrencia y operaciones recuperables; ciclo de vida propio en MongoDB M2 | Layout 40/60 de interfaces, sección 8; superficie de ADR-061 | 9 | Conserva el motor visual declarativo, sus esquemas y algoritmos; sin ejecución de código de IA | DECIDIDA; prototipo pendiente |
| ADR-084 | Biblioteca reutilizable BR-01 a BR-12: M2 es propietario de recursos, publicación, permisos y versiones; M6 hace la búsqueda autorizada (BGE-M3/pgvector), la recuperación y la adaptación. Flujo: consulta → búsqueda → pertinencia → reutilización o adaptación → generación solo si es necesaria | Nueva | 10 | Privado por defecto; publicación voluntaria; retiro con revocación, invalidación de cachés y eliminación de embeddings | DECIDIDA; publicación por usuarios pospuesta después de V1 (ADR-093) |
| ADR-085 | BYOK para adultos elegibles: credenciales en PostgreSQL M6 con cifrado autenticado AES-256-GCM (Web Crypto) y clave maestra separada en el gestor de secretos; acceso solo de adaptadores autorizados; sin fallback facturado por Mentelyx | Nueva | 17 | Los proveedores compatibles se autorizan uno a uno; BYOK no cubre almacenamiento, embeddings, OCR, renderizado, video ni infraestructura | DECIDIDA; proveedores por autorizar |
| ADR-086 | Publicidad: redes externas compatibles con web y PWA y anuncios recompensados voluntarios. M7 verifica eventos y elegibilidad con los mecanismos antifraude disponibles; M5 concede los recursos de forma transaccional e idempotente. Sin segmentación con datos académicos ni privados; obligatoria solo en el plan Gratuito; anuncios recompensados no disponibles para menores | Modifica ADR-025 y sustituye su «sin redes de terceros» | 16; P-10 | La red concreta queda por seleccionar entre las compatibles (verificación en servidor y políticas para menores); no se prometen ingresos | DECIDIDA (arquitectura); red por seleccionar |
| ADR-087 | Grupos privados docentes en M4: grupos, membresías, invitaciones, roles, materiales y clases del grupo, privacidad y protección de menores | Resuelve P-11 | 15, 20 | Tablas, endpoints y permisos propios de M4 (RF-117) | DECIDIDA; POSPUESTA DESPUÉS DE V1 (ADR-093) |
| ADR-088 | Studio profesional con un proceso de diez pasos: PptxGenJS (PPTX editable), HTML/CSS con Cloudflare Browser Run (PDF; antes «Browser Rendering»), KaTeX, SVG y motores deterministas, FLUX.2 para ilustraciones y Three.js; controles de calidad documental | Modifica ADR-066; sustituye los productos Studio de ADR-050 | 13 | La salida DOCX no tiene tecnología aprobada; Cloud Run Jobs sigue como contingencia de PPTX (ADR-066) | DECIDIDA; compatibilidad por probar; POSPUESTA DESPUÉS DE V1 (ADR-093) |
| ADR-089 | Perfil académico y edad en M1: nivel educativo; fecha de nacimiento cifrada, de acceso restringido y con fuente de verificación; condición de edad derivada y recalculada; consentimiento y minimización; nunca pública | Precisa RF-54 | 5.4 | `is_minor` deja de ser el único dato permanente | DECIDIDA |
| ADR-090 | Fuentes privadas y espacios de estudio: M2 es propietario de espacios, documentos, versiones y permisos; extracción estructurada con OCR cuando corresponda; referencias a página, diapositiva y sección; M6 indexa por generación | Amplía ADR-019 y ADR-065 | 7 | OCR con la conversión de Workers AI y el modelo con visión aprobado (DeepSeek V4.1 Flash); calidad por medir | DECIDIDA |
| ADR-091 | Visualizaciones 3D en Tutor IA y Studio para todas las cuentas: Three.js, GLB/glTF, simulaciones deterministas, modelos verificados y adaptaciones de la biblioteca. La generación externa solo se activa con una integración autorizada | Modifica ADR-063 | 12 | Stability y Meshy no se contratan | DECIDIDA; parte de Studio pospuesta después de V1 (ADR-093) |
| ADR-092 | Evaluaciones personalizadas y generación rápida: M3 es la autoridad de intentos, resultados y calificaciones; M6 genera preguntas versionadas con verificación; siete tipos; mínimo predeterminado de 15 preguntas; modos aprendizaje y evaluación; calificación oficial reproducible; retroalimentación formativa con rúbricas | Amplía ADR-018 y ADR-030 | 8 | Preguntas versionadas en MongoDB M3; consumo de «evaluaciones equivalentes» en M5 | DECIDIDA |

## 12. Alcance de Mentelyx V1 (ADR-093, 25/11/2026)

Aprobada por el propietario el 25/11/2026 («Mentelyx V1: consolidación de la landing y continuación del frontend»). Fija el alcance de la primera versión; no borra ninguna decisión anterior. Lo pospuesto conserva su diseño como visión futura y vuelve a activarse con una ADR nueva.

| ID | Decisión | Sustituye o modifica | Consecuencias y condiciones | Estado |
|---|---|---|---|---|
| ADR-093 | **Mentelyx V1** se centra en el aprendizaje y la preparación de exámenes, para cualquier persona con curiosidad o una evaluación que preparar. Incluye: aprendizaje libre, Tutor IA, pizarra adaptativa, visualización 3D, visor de documentos, fuentes personales opcionales, recursos externos autorizados, preparación de exámenes, carpetas independientes para aprendizaje y para exámenes, y seguimiento y continuidad. **Se posponen** Studio, la cuenta y las funciones docentes, las aulas y las clases en vivo, las tutorías humanas, la gestión institucional y la publicación de cursos | Pospone, sin sustituir, las decisiones de la tabla siguiente | La landing, la navegación y el producto no presentan lo pospuesto como disponible. Los módulos M1–M7 y la arquitectura no cambian: M4 y las partes docentes de M5 quedan sin construir en V1. Las carpetas son una capacidad nueva de organización (contrato propuesto en el [diseño de API, sección 12](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md)). Alcance del frontend en el [diseño de interfaces, sección 1.3](../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) | DECIDIDA |
| ADR-094 | **NVIDIA API Catalog como proveedor adicional del Tutor (patrón Adapter).** El adaptador `NvidiaProveedor` (`backend/src/modules/tutor-ia-rag/infraestructura/nvidia.adapter.ts`) implementa el mismo `ProveedorIaPort` que Workers AI. Se elige con `IA_PROVEEDOR=nvidia` y `NVIDIA_MODELO`, y la clave es un secreto. Se conservan Workers AI (Gemma 4 y BGE-M3), el simulado (solo desarrollo y CI) y `deshabilitado`. Modelo: `moonshotai/kimi-k3.1-pro` sin razonamiento. Los Gemma del catálogo (`google/gemma-3-12b-it`, `google/gemma-3-4b-it`) respondían 404 para la cuenta el 26/11/2026. Kimi es la alternativa autorizada por el propietario (DeepSeek, Kimi o Qwen); DeepSeek y Qwen no figuraban | Modifica, por instrucción del propietario del 26/11/2026, el «sin proveedores externos» de ADR-077 solo para la ruta `explicacion.*`. No sustituye ADR-077 | Dominio, casos de uso, presupuestos, cuotas de M5, validación de bloques y persistencia sin cambios. Errores 401, 403, 404 y 429 se tratan como rechazos sin ejecución; timeout, red y 5xx como INCIERTOS (CO-10); nunca se recurre al simulado. Verificado con una inferencia real (Neon, Atlas y NVIDIA): respuesta FUNDAMENTADA con cita, bloque `pasos` y acción válidos, en 81 s. Por esa latencia, Workers AI sigue como alternativa en cuanto la cuenta registre su subdominio workers.dev. NVIDIA no publica tarifa por token: el costo técnico se registra en 0 y el consumo lo limitan las cuotas de M5 y el límite de tasa de M6. Falta el acuerdo de tratamiento de datos con NVIDIA (PEND) | DECIDIDA (propietario, 26/11/2026) |

**Decisiones afectadas** (se conservan; su estado queda condicionado a una versión posterior):

| ADR | Tema | Efecto de ADR-093 |
|---|---|---|
| ADR-045, ADR-046 y ADR-051 | Aulas Live, SFU y grabaciones | Pospuestas después de V1 |
| ADR-081 | Modelo docente, pagos directos y Docente Live | Pospuesta después de V1 |
| ADR-087 | Grupos privados docentes | Pospuesta después de V1 |
| ADR-088 | Studio profesional (PPTX y PDF) | Pospuesta después de V1 |
| ADR-080 | Planes y cuotas | Parcial: en V1 se ofrecen solo los planes estudiantiles; los planes docentes Inicial y Live se posponen |
| ADR-084 | Biblioteca reutilizable | Parcial: se mantienen la búsqueda, la reutilización y los recursos autorizados; la publicación por usuarios se pospone |
| ADR-091 | Visualizaciones 3D | Parcial: se mantienen en el Tutor y la pizarra; la parte de Studio se pospone |
| ADR-092 | Evaluaciones personalizadas | Se mantiene; en V1 sirve a la preparación de exámenes (diagnóstico, práctica, simulacros y retroalimentación) |

**Conflicto detectado entre contratos (25/11/2026):** el backend en curso define una sola preparación vigente por cuenta (`/preparacion/objetivos`, `/preparacion/plan`, `/preparacion/seguimiento`, en `evaluaciones-aprendizaje`). V1 pide varias preparaciones por examen, organizadas en carpetas. La propuesta de solución está en el [diseño de API, sección 12](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md): conservar el plan determinista e identificarlo por preparación (`preparacionId`). **Resuelto el 26/11/2026:** `/preparaciones` admite varias por cuenta; la migración `0007` sustituye el índice único parcial de `0006` y `/preparacion/*` queda como alias de la más reciente (registro de continuidad, sección 23).
