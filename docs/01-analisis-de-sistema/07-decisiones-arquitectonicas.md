# 07. Decisiones arquitectónicas — Mentelyx

> **Versión:** 1.3 


## 1. Criterios de decisión y estados

**Adoptar** significa elegir el diseño objetivo, **NO** que esté desarrollado o desplegado; **Candidato** significa que la elección final requiere pruebas de conectividad, costos, contratos, funciones o seguridad. Se preservan **ADR-001 a ADR-010 y ADR-012 a ADR-044**; **ADR-011 queda reservado**. Se incorporan **ADR-045 a ADR-055**.

Criterios: trazabilidad RF/AC/RC/DA, seguridad/menores, disponibilidad y recuperación, TCO (no solo Free), portabilidad, capacidad de ensayo, costos de IA/video y márgenes a cuota completa.

## 2. Decisiones base existentes (ADR-001 a ADR-030)

| ID | Decisión | Drivers | Justificación | Implementación/consecuencia | Estado |
|---|---|---|---|---|---|
| ADR-001 | **Monolito modular**, no microservicios en el inicio | DA-05, DA-09 | Menos despliegues, menor complejidad de integración, módulos independientes de negocio | **Siete módulos lógicos agrupados:** Usuarios y Administración; Cursos y Contenidos; Evaluaciones y Aprendizaje; Docentes y Clases; Suscripciones y Pagos; Tutor IA y RAG; Publicidad y Patrocinios. Notificaciones = capacidad transversal asíncrona, no módulo de negocio adicional. | Adoptar |
| ADR-002 | **Clean Architecture y puertos/adaptadores por módulo** | DA-05, DA-11, DA-12 | Reglas educativas y comerciales independientes de HTTP, ORM, cloud e IA | Dominio → aplicación ← adaptadores de infraestructura y presentación; pruebas aisladas | Adoptar |
| ADR-003 | **TypeScript en Web/PWA y API REST** | DA-05, DA-10 | Un stack tipado con ecosistema web y posibilidad de compartir contratos | **Next.js** (exportación estática donde aplique) + API **Hono/Cloudflare Workers** sobre HTTPS; OpenAPI. Next.js dinámico/SSR será evaluado por separado | Adoptar con prueba del runtime |
| ADR-004 | **Identidad y autorización en backend** | DA-03, DA-09 | Impedir acceso a calificaciones y pagos ajenos; diferenciar rol Docente inicial de habilitación comercial y credenciales profesionales verificadas | Sesiones seguras, roles, permisos y autorización por recurso, controles de auditoría | Adoptar |
| ADR-005 | **Pasarela de pagos desacoplada** | DA-04, DA-06, DA-12 | Poder sustituir proveedor; evitar inconsistencias con tutorías y suscripciones | `PaymentPort` + adaptadores; evaluar Mercado Pago/Culqi Perú; webhooks firmados | Adoptar la interfaz, proveedor condicionado |
| ADR-006 | **PostgreSQL como fuente de verdad transaccional y de autorización** | DA-06, DA-11, DA-19 | Reservas, pagos, permisos, resultados oficiales y relaciones académicas requieren transacciones consistentes | PostgreSQL administrado para identidad, catálogo de referencias, permisos, publicaciones, progresos y operaciones económicas; transacciones, índices, respaldos y `JSONB` cuando sea apropiado | Adoptar |
| ADR-007 | **Eventos externos y pagos idempotentes** | DA-04, DA-06 | Reintentos de webhooks no deben duplicar cobros o reservas | Claves únicas, máquina de estados, tabla de eventos procesados y operaciones transaccionales | Adoptar |
| ADR-008 | **Cola de tareas gestionada para trabajo asíncrono** | DA-07, DA-09, DA-12 | Los fallos de correo o tareas lentas no deben detener las operaciones principales | Cloudflare Queues + consumidores Workers, reintentos, dead-letter queue, tareas programadas | Adoptar si se usa Workers |
| ADR-009 | **Almacenamiento de objetos y streaming separado de SQL/NoSQL** | DA-01, DA-02, DA-19 | Archivos y videos binarios no pertenecen a las bases de datos operacionales | Cloudflare R2 para PDF, imágenes y adjuntos; Bunny Stream para videos; PostgreSQL mantiene permisos/metadatos y MongoDB la estructura pedagógica si aplica | Adoptar |
| ADR-010 | **Cuentas independientes de convenios** | DA-08 | Mantener cuenta, historial y permisos aun cuando venza un convenio | Dominio Identidad separado de Convenios y Beneficios | Adoptar |
| ADR-012 | **Redis adoptado para caché y controles efímeros** | DA-01, DA-02, DA-06 | Evitar lecturas repetidas sin introducir inconsistencia de datos sensibles | CDN/caché HTTP para público; Redis compatible en local y servicio administrado compatible en producción para caché y rate limiting | Adoptada para Redis; proveedor pendiente |
| ADR-013 | **Despliegue serverless-first con bajo trabajo de operación** | DA-01, DA-02, DA-07, DA-09; DA-13, DA-19 | Evitar administración permanente de máquinas y pagar conforme al consumo | Cloudflare Workers/Pages, Queues, R2, Neon PostgreSQL y MongoDB Atlas; validar la conectividad segura con ambos motores y sus costos | Adoptar con pruebas de conectividad/carga |
| ADR-014 | **Videos grabados mediante plataforma de streaming** | DA-01, DA-02; DA-14 | Transcodificación y CDN son más económicos y sencillos si están gestionados | **Bunny Stream** (primera opción, región/tier sujeto a piloto), carga directa autenticada, HLS y enlaces firmados | Condicionada a pruebas en Perú |
| ADR-015 | **Separar clases masivas de tutorías interactivas** | DA-01, DA-02, DA-07; DA-14 | El patrón uno-a-muchos y la interacción bidireccional tienen exigencias/costos distintos | Aulas iniciales **hasta 35 alumnos + docente** por **WebRTC SFU moderado**; transmisiones de mayor audiencia o broadcast serán alternativa futura y requieren ADR específica y prueba de costos. Este refinamiento sustituye el supuesto anterior de clase magistral masiva como modalidad base. | Adoptar topología; proveedor condicionado |
| ADR-016 | **SFU gestionado; no servidor WebRTC propio** | DA-07, DA-09; DA-14 | Reducción de operación TURN/SFU y capacidad de conectar salas | **RealtimeKit como candidato SFU administrado**; validar tope de participantes, calidad en Perú, roles, costos, grabación y simultaneidad. Alternativas como LiveKit si pruebas lo justifican. | Condicionada a prueba de funciones/costo |
| ADR-017 | **No usar Kafka como bus inicial** | DA-05, DA-07, DA-09, DA-12 | No hay streams de eventos independientes que justifiquen cluster, particiones y operación adicionales | Cloudflare Queues + patrones Event/Outbox cuando corresponda; revaluar Kafka solo ante demanda demostrada | Adoptar (descartar por ahora) |
| ADR-018 | **Motor de dominio académico sin llamada obligatoria a LLM** | DA-11, DA-05, DA-06 | Diagnósticos, prerrequisitos y recomendaciones deben ser reproducibles, comprobables y baratos | Motor de reglas/estadísticas con `RecommendationPort`, estrategia sustituible; el LLM no decide unilateralmente calificaciones | Adoptar |
| ADR-019 | **Tutor IA con RAG separado de la evaluación** | DA-11, DA-12; DA-15, DA-19 | Las explicaciones requieren contexto académico y control de costos por tokens | Extracción autorizada desde objetos y contenido pedagógico versionado, `pgvector` en PostgreSQL para embeddings, ACL en cada recuperación, LLM intercambiable y límites por plan | Condicionada a pruebas pedagógicas y de indexación |
| ADR-020 | **Observabilidad, control de costos y privacidad** | DA-03, DA-07, DA-09; DA-13 | Permitir operar con poco personal y detectar crecimiento o errores de facturación | Logs estructurados sin datos sensibles, métricas p95/error/DB/colas/stream/IA, alertas y presupuestos | Adoptar |
| ADR-021 | **CI/CD y contenedores para pruebas y portabilidad** | DA-05, DA-07, DA-12 | Despliegue reproducible y posibilidad de cambiar de proveedor si el runtime edge no cumple | GitHub Actions, pruebas, previews y reversión; Docker Compose para desarrollo/testing; **Docker no es requisito para ejecutar Workers** | Adoptar |
| ADR-022 | **Disponibilidad proporcional; no afirmar HA de extremo a extremo** | DA-06, DA-07; DA-13, DA-19 | Una aplicación serverless todavía depende de las bases de datos y proveedores externos | Timeouts, reintentos selectivos, DLQ, respaldos y restauración **de PostgreSQL y MongoDB**, control de consistencia entre almacenes y pruebas de recuperación | Adoptar |
| ADR-023 | **Persistencia políglota: PostgreSQL + MongoDB por dominio** | DA-01, DA-05, DA-06, DA-11, **DA-19** | Los datos críticos necesitan integridad relacional y las lecciones/actividades admiten documentos flexibles y versionados; una sola BD para todo dificulta evolucionar cada modelo por separado | **PostgreSQL local → Neon PostgreSQL** (identidad, créditos, notas, pagos, derechos, vectores); **MongoDB local → Atlas** (documentos pedagógicos y Studio); R2 binarios, Redis efímero. **Proveedores seleccionados** sin contratación aún; verificar conectividad y backups. | **Proveedores confirmados para producción: Neon y Atlas; validar compatibilidad Workers, costos y disponibilidad antes del despliegue** |
| ADR-024 | **Contratos para videoclases y grabaciones** | DA-03, DA-06; DA-14 | Salas, permisos docentes, aforo, moderación, grabación y visibilidad requieren reglas claras. | Crear/entrar/salir sala, rol, límites, grabación opcional, autorización, conservación y auditoría. | Propuesta vinculada a RF-36, RF-37, RF-45 y RF-48; pendiente de prueba |
| ADR-025 | **Publicidad contextual separada del aprendizaje** | DA-16, DA-03; RC-10, RC-15 | Financiar parcialmente la modalidad Gratuita sin usar información académica privada ni interrumpir actividades. | Componente `Publicidad/Patrocinios` con ubicaciones aprobadas, validación de plan/edad-contexto, campañas y métricas agregadas; no banners en exámenes, clases en vivo, editor, lecciones de pago o liquidaciones. | Adoptar política, proveedor condicionado |
| ADR-026 | **Licenciamiento editorial e indexación RAG con ACL** | DA-15, DA-17, DA-19; RC-11, RC-12 | El permiso de publicación no equivale al de indexación, explotación comercial o entrenamiento. | Flujo de revisión/licencia en PostgreSQL, material estructurado versionado en MongoDB, indexación/desindexación en pgvector por ID/versión, ACL verificada al recuperar; sin fine-tuning automático. | Adoptar |
| ADR-027 | **Comisiones docentes con ledger y reglas versionadas** | DA-18, DA-06 | Separar precio, impuestos, comisión de cobro, porcentaje de reparto y costos para liquidaciones auditables. | Tablas de tarifas/versiones, transacciones, eventos y liquidaciones, saldos por docente y conciliación verificable. | Adoptar diseño; porcentajes condicionados |
| ADR-028 | **Derechos de plan y cuotas medibles** | DA-13, DA-15, DA-16, DA-18 | Limitar consumos variables caros sin impedir el aprendizaje básico autorizado. | Separar venta directa y Live: condiciones de remuneración y márgenes por modalidad, historial versionado, liquidaciones idempotentes. Nunca suponer 70/30 para créditos Live. | Adoptar; cuotas/precios condicionados |
| ADR-029 | **Cursos comerciales docentes sujetos a acuerdo separado** | DA-17, DA-18 | Los videos demostrativos son promocionales y no generan regalías automáticas; los cursos integrales pueden requerir otra remuneración. | Registro de contratos, licencia por contenido, alcance de distribución y estados de liquidación diferenciados de tutorías. | Adoptar modelo contractual, condiciones condicionadas |
| ADR-030 | **Preparación para exámenes como modalidad transversal; reutilizar los siete módulos** | **DA-20, DA-05, DA-06, DA-11; RF-49 a RF-52; RC-16, RC-17** | Evitar duplicar evaluación, cursos y perfiles; permitir nuevas convocatorias y preservar la historia del estudiante con planes comprobables. | **Evaluaciones y Aprendizaje:** objetivos, planificación, simulacros, seguimiento; **Cursos y Contenidos:** fichas/temarios/preguntas versionadas; **Usuarios y Administración:** permisos; **Tutor IA y RAG:** explicaciones opcionales; **Docentes y Clases:** refuerzo. Reglas de planificación deterministas y verificables; resultados y versiones históricas en PostgreSQL; estructura de ejercicios en MongoDB según ADR-023. | **Adoptar como diseño; implementación y fuentes verificadas pendientes de prueba** |

## 3. Decisiones consolidadas del despliegue previo (ADR-031 a ADR-044)

Se reescriben en un único formato para eliminar anexos contradictorios. Los detalles operativos deberán materializarse con pruebas y ADR individuales cuando se implemente.

| ID | Decisión consolidada | Estado | Referencias / consecuencia verificable |
|---|---|---|
| ADR-031 | PostgreSQL en local; Neon para producción; migraciones repetibles | Adoptada como objetivo | DA-24, RC-23. Mismas restricciones e índices en local y remoto. |
| ADR-032 | Despliegue parcialmente híbrido: Workers/Hono y servicios externos | Adoptada como objetivo | DA-23/24. Pages export estática condicionada a necesidades SSR; Cloud Run solo trabajo pesado. |
| ADR-033 | Biblioteca de autenticación integrada y autorización propia | Better Auth candidato | DA-21. Validar sesión, cookies, correo, MFA y revocación sobre Workers/Neon. |
| ADR-034 | Separar tipo de cuenta, permiso de tutor, acreditación y suscripción | Adoptada | DA-21. Cuenta Estudiante no cambia por publicar; Docente no presume título. |
| ADR-035 | Studio versionado: MongoDB; derechos y saldos: PostgreSQL; archivos R2 | Adoptada, validación pendiente | DA-19/22. No hay transacción global entre bases. |
| ADR-036 | Disponibilidad mediante detección, degradación, backups y pruebas | Adoptada, pruebas pendientes | DA-23. HA de DB no se presupone gratis. |
| ADR-037 | No añadir balanceador externo sin orígenes redundantes reales | Condicionada | DA-23/24. Workers ya tiene distribución administrada. |
| ADR-038 | Observabilidad, costos y alertas protegidas | Adoptada | DA-23/24. Costo por proveedor y producto; acceso administrativo auditado. |
| ADR-039 | Convenios institucionales después del lanzamiento | Adoptada | DA-25. HU-09/HU-22 y RF-15 a 17 POSTERIOR. |
| ADR-040 | Nivel universitario dentro de catálogo y evaluaciones actuales | Adoptada | DA-25. Sin octavo módulo. |
| ADR-041 | Neon PostgreSQL + MongoDB Atlas en producción | Proveedores elegidos, sin contrato | DA-19. PostgreSQL/MongoDB locales; conectividad/región/HA por validar. |
| ADR-042 | Cloudflare Queues/DLQ para procesamiento de documentos | Adoptada | DA-23. Entrega at-least-once; payload de referencias; consumidor idempotente. |
| ADR-043 | ACID + UNIQUE + webhook + outbox + reconciliación para pagos | Adoptada | DA-06/29. Redis/Queues NO ledger financiero. |
| ADR-044 | Better Auth como biblioteca de Hono; permisos propios | Candidato técnico | DA-03/21. No crear criptografía propia; sí código de experiencia y autorización. |

## 4. Nuevas decisiones comerciales, de aulas y Studio (ADR-045 a ADR-055)

| ID | Decisión | Estado | Drivers | Consecuencias y prueba |
|---|---|---|---|---|
| ADR-045 | Aulas Live por salón y roles moderados: aforo base 35 alumnos más docente | Adoptar como diseño; probar | DA-14, DA-27, DA-30 | Salas con roles, acceso temporal, participación moderada; no 36 cámaras permanentes ni promesa de 35 sin ensayo. |
| ADR-046 | WebRTC con SFU administrado; RealtimeKit como candidato inicial | Proveedor condicionado | DA-14, DA-23, DA-27 | El flujo audiovisual no pasa por Hono; medir minutos-participante, funciones, reconexión, regiones, grabación y varias aulas simultáneas. |
| ADR-047 | Catálogo de productos y entitlements separados por línea de negocio | Adoptar | DA-18, DA-26 | Plus/Pro usan cuota de IA; Live usa créditos de clases; Studio tiene créditos IA distintos. Evitar descuentos/beneficios no presupuestados. |
| ADR-048 | Ledger transaccional PostgreSQL para créditos Live y Studio | Adoptar | DA-06, DA-26, DA-27, DA-29 | Movimientos, reservas, consumos, reversos, expiración y unicidad mediante SQL ACID; Redis solo caché. |
| ADR-049 | Motor de viabilidad económica por clase antes de publicación | Adoptar política; calibrar números | DA-13, DA-18, DA-26, DA-29 | Simular ocupación, costos audiovisuales, pasarela, docentes, impuestos y margen; clases gratuitas requieren presupuesto autorizado. |
| ADR-050 | Créditos Studio con costos medidos por función y edición manual sin consumo | Adoptar política; calibrar tasas | DA-22, DA-26, DA-28 | Precios candidatos 29,90/69,90; 300/900 créditos hipótesis. Token/imagen/PDF medidos; reembolso idempotente por fallo elegible. |
| ADR-051 | Grabaciones externas autorizadas y almacenamiento privado versionado | Adoptar política; proveedor condicionado | DA-14, DA-30 | No almacenar video en Redis/MongoDB; usar sistema de grabación de WebRTC, R2 y eventualmente Bunny según accesos, derechos y costes. |
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

Clases con compra individual pequeña pueden perder margen cuando la pasarela aplica comisión fija por **cada transacción** (p. ej. mínimo referencial S/3,50). La suscripción Live cobra una vez por mes y registra créditos **por usuario**, aunque sean de regiones distintas. No exige compras grupales. Los pagos individuales siguen siendo posibles solo a precio/costo viable con reglas transparentes.

### 5.3 Persistencia e integridad comercial

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
