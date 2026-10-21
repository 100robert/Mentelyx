# 06. Drivers arquitectónicos — Mentelyx

> **Versión:** 1.6 (sincronización con actores v1.5) — revisión integral del análisis de Mentelyx (20 de octubre de 2026).  **Estado:** arquitectura de referencia definida; importes comerciales, cuotas y contratos sujetos a validación. No implica software ya desarrollado ni servicios contratados.


## 1. Definición

Un **driver** es un factor de negocio, restricción o atributo que condiciona la arquitectura. **No confundirlo** con una decisión (ADR). Se conservan **DA-01 a DA-25**, y se añaden **DA-26 a DA-31**.

## 2. Catálogo consolidado

| ID | Driver | Origen principal | Implicación |
|---|---|---|---|
| DA-01 | Crecimiento de estudiantes, docentes, contenidos heterogéneos y solicitudes. | AC-03; RF-05, RF-06, RF-10, RF-35, RF-47 | Capacidad, distribución de recursos, procesamiento de materiales, almacenamiento y despliegue escalable. |
| DA-02 | Tiempos de respuesta adecuados en consultas y actividades bajo carga documentada. | AC-01; RF-05, RF-09, RF-11 | Diseño de consultas, caché selectiva, tareas de procesamiento y medidas de carga. |
| DA-03 | Control de identidad, permisos y acceso a información académica y económica por recurso. | RF-02, RF-03, RF-04, RF-11, RF-31; AC-04; RC-07, RC-08 | Autenticación, autorización en backend, registros y protección de datos. |
| DA-04 | Pagos externos para tutorías y suscripciones, con resultados verificables. | RF-26, RF-27; RC-05; AC-08 | Puerto/adaptador de pagos, contratos, fallos e integración. |
| DA-05 | Evolución modular de cursos, estructuras pedagógicas, reglas de aprendizaje y políticas de negocio. | RF-05, RF-06, RF-08, RF-09, RF-12, RF-15, RF-35; AC-05, AC-09 | Separación de responsabilidades, límites de módulos y contratos que permitan agregar nuevos tipos de actividad sin afectar pagos o identidades. |
| DA-06 | Consistencia de resultados académicos, reservas, cupos y operaciones económicas. | RF-07, RF-11, RF-22, RF-23, RF-27, RF-28; AC-06 | Transacciones, validaciones, idempotencia y control de concurrencia. |
| DA-07 | Continuidad de funciones esenciales ante interrupciones en integraciones no críticas. | AC-02; RF-05, RF-11, RF-24, RF-30 | Aislamiento de fallos, timeouts y desacoplamiento de notificaciones. |
| DA-08 | Independencia de cuentas estudiantiles frente a instituciones y convenios. | RF-01, RF-15, RF-16, RF-17; RC-03, RC-04 | Separación entre identidades, elegibilidad y beneficios. |
| DA-09 | Administración inicial sencilla y evolución a permisos delegados. | RF-03, RF-04; RC-06; AC-04 | Control de permisos, trazabilidad administrativa y operación de bajo esfuerzo. |
| DA-10 | Un solo canal web mobile-first, instalable como PWA con identidad compartida. | RF-33, RF-34; AC-07; RC-01 | Organización de frontend, comunicación API y actualización de cliente. |
| DA-11 | Perfil individual y personalización de aprendizaje para distintas áreas y niveles. | RF-05, RF-07, RF-08, RF-09, RF-11; AC-05, AC-06, AC-09 | Separación del perfil, evaluación y motor de recomendaciones; posibilidad de sustituir estrategias sin rehacer módulos académicos. |
| DA-12 | Integraciones verificables y casos de uso probables sin proveedores reales. | AC-08, AC-09; RF-26, RF-27, RF-30 | Contratos explícitos, puertos/adaptadores, dobles de prueba y validaciones automatizadas. |
| DA-13 | Costos medibles y menor administración para operar Mentelyx comercialmente. | AC-10; RF-43, RF-44; objetivo empresarial de eficiencia operacional | Serverless y servicios administrados donde sean convenientes; presupuestos, alertas y cálculo del costo unitario por uso. |
| DA-14 | Distribuir videos grabados, clases magistrales uno-a-muchos y tutorías interactivas a escala. | RF-36, RF-37, RF-45, RF-47, RF-48; AC-01, AC-02, AC-03, AC-07 | Separación entre streaming/CDN, WebRTC-SFU y backend; sesiones, tokens y políticas de grabación. |
| DA-15 | Tutor pedagógico con IA y RAG sujeto a derechos, calidad y cuotas. | RF-35, RF-41, RF-42, RF-43; AC-04, AC-10, AC-11; RC-11, RC-12 | Corpus versionado y con ACL, búsqueda vectorial, LLM intercambiable y límites de consumo; evaluación no dependiente del LLM. |
| DA-16 | Financiar plan gratuito y visibilidad docente sin publicidad intrusiva. | RF-39, RF-40; AC-04, AC-07; RC-10, RC-15 | Módulo separado de anuncios, elegibilidad por plan/ubicación, sin datos académicos privados. |
| DA-17 | Gestionar derechos de contenidos, contratos editoriales y desindexación verificable. | RF-35, RF-41, RF-45, RF-46; AC-04, AC-11; RC-11, RC-12, RC-13 | Licencias y versiones, estados de autorización, revocación, auditoría y borrado del índice de recuperación. |
| DA-18 | Rentabilizar tutorías y clases docentes mediante comisiones y liquidaciones auditables. | RF-21 a RF-29, RF-36 a RF-38, RF-44; AC-06, AC-10; RC-05, RC-14 | Modelo de precios, estados contractuales, procesamiento idempotente, desglose contable por transacción y métricas de costo por sesión. |
| DA-19 | Gestionar de forma diferenciada **datos relacionales/transaccionales, contenidos pedagógicos semiestructurados y archivos de gran tamaño**, manteniendo coherencia y capacidad de evolución. | RF-05, RF-06, RF-07, RF-09, RF-11, RF-35, RF-41, RF-47; AC-03, AC-05, AC-06, AC-09; RC-11 | Definir propietarios de datos y límites de persistencia por módulo, identificadores y versionado de contenidos, vínculos entre registros y objetos, manejo de consistencia entre almacenes, índices, respaldos y escalado independiente. |
| DA-20 | Preparación configurable para exámenes escolares, preuniversitarios y universitarios sin crear otro módulo de negocio. | **RF-49 a RF-52; HU-36 a HU-40; AC-01, AC-03, AC-04, AC-05, AC-06, AC-07, AC-09, AC-11; RC-16, RC-17** | Reutilizar contenidos, diagnósticos y simulacros; versionar fichas/temarios y mantener resultados históricos, controlar simultaneidad y generar planes reproducibles, explicables y actualizables. |
| DA-21 | Registro de tres tipos de cuenta pública, modalidad docente y permisos de tutoría separados de la acreditación profesional/comercial. | HU-41 a HU-46; RF-53 a RF-59; RC-20, RC-21; AC-04 | Matriz de permisos, sesiones, estados de verificación diferenciados, protección de menores y controles por recurso. |
| DA-22 | Autoría interactiva y versionada, creación manual gratuita y generación por IA con cuota. | HU-43, HU-47, HU-48, HU-53; RF-56, RF-60, RF-61, RF-69; RC-11, RC-27 | Mentelyx Studio, modelo de documentos versionados, guardado local y remoto, ACL, licencias separadas. |
| DA-23 | Disponibilidad, recuperación y continuidad aun con proveedores externos. | AC-02, AC-06, AC-10; RF-63, RF-64, RF-66, RF-68, RF-72; RC-25 | Check de salud, DLQ, degradación selectiva, respaldos de ambas bases, restauración, medición RTO/RPO y reportes. |
| DA-24 | Reducción de costo y desarrollo offline/local con PostgreSQL estándar. | RF-65; RC-23, RC-24; AC-05, AC-10 | Configuración por entorno, migraciones reproducibles, Cloudflare-first, independencia de proveedor DB y escalado según medición. |
| DA-25 | Expansión del catálogo a nivel universitario y mantenimiento de planes comerciales sin convenios iniciales. | HU-52; RF-67, RF-49 a RF-52; RC-22; AC-05 | Taxonomía académica extensible, temarios verificables, convenios diferidos sin modificar identidad. |
| DA-26 | Planes separados y control de economía unitaria a cuota completa | RF-73, RF-79, RF-86–RF-87; RC-28, RC-29, RC-33; AC-10 | Productos/entitlements parametrizados, rate card de proveedores, simulación de gastos/beneficios y margen real por producto. |
| DA-27 | Aulas Live para estudiantes en distintas regiones y grupos de 1 a 35 | RF-74–RF-80, RF-89–RF-90; RC-30, RC-32; AC-02, AC-03, AC-07 | Saldo transaccional Live, SFU gestionado, reservas idempotentes, liquidación por modalidad y reprogramaciones. |
| DA-28 | Studio Free/Plus/Pro con UX de edición libre y cuotas generativas | RF-82–RF-85, RF-97; RC-27, RC-31; AC-07, AC-10 | Diferenciar operaciones manuales baratas y generativas, medir costo por función, movimientos de créditos idempotentes y UX clara. |
| DA-29 | Pagos, liquidaciones y conciliación con micropagos caros | RF-26–RF-29, RF-80, RF-86, RF-92; RC-05, RC-33–RC-35; AC-06 | PaymentPort, políticas versionadas y ledger SQL, outbox, webhook verificado y conciliación; no usar Redis para dinero. |
| DA-30 | Privacidad y derechos de clases y materiales digitales | RF-35, RF-41, RF-45, RF-90, RF-99; RC-11–RC-19, RC-36; AC-04, AC-11 | Versiones y permisos separados, autorización de grabación, retención y borrado, control de menores y acceso firmado. |
| DA-31 | Operación del producto completo con resiliencia y control de gasto | RF-63–RF-66, RF-71, RF-91, RF-94–RF-96; RC-25, RC-37; AC-02, AC-06, AC-10 | Observabilidad por proveedor, backoff y DLQ, recuperación y backup comprobado, fallback Redis seguro y alertas de presupuesto. |

## 3. Drivers más influyentes para estilo/enfoque

| Orden | Drivers | Por qué obliga a una decisión arquitectónica |
|---|---|---|
| **1 (crítico)** | DA-03, DA-06, DA-21, DA-29 | Permisos, saldos, pagos e integridad de créditos bajo concurrencia; elección de fuente de verdad y límites del dominio. |
| **2 (crítico)** | DA-07, DA-23, DA-31 | Disponibilidad real depende de varias plataformas: diseñar fallos parciales, recuperación y observabilidad. |
| **3 (alto)** | DA-05, DA-12, DA-19, DA-22, DA-28 | Monolito modular + puertos/adaptadores y versionado de documentos; facilidad para sustituir IA/proveedores. |
| **4 (alto)** | DA-13, DA-18, DA-26 | Sostenibilidad comercial bajo uso completo y tarifas reales; límites dinámicos y auditoría. |
| **5 (alto)** | DA-14, DA-27, DA-30 | Aula 35+1, salas/roles/grabaciones y derechos/menores; WebRTC/SFU fuera de Hono. |
| **6 (alto)** | DA-10, DA-20, DA-25 | Acceso PWA en cuatro niveles y preparación de exámenes con catálogo extensible. |

## 4. Trazabilidad drivers → decisiones

| Drivers | ADR principales |
|---|---|
| DA-03/DA-21 | ADR-004, ADR-033, ADR-034, ADR-044 |
| DA-05/DA-12/DA-19 | ADR-001, ADR-002, ADR-006, ADR-023, ADR-035, ADR-041 |
| DA-07/DA-23/DA-31 | ADR-008, ADR-020, ADR-022, ADR-036–ADR-038, ADR-042, ADR-054 |
| DA-14/DA-27/DA-30 | ADR-015, ADR-016, ADR-024, ADR-045, ADR-046, ADR-051 |
| DA-18/DA-26/DA-29 | ADR-005, ADR-007, ADR-027–ADR-028, ADR-043, ADR-047–ADR-052 |
| DA-22/DA-28 | ADR-019, ADR-035, ADR-050, ADR-053 |

## 5. Delimitación del diseño

No necesitamos Kafka, ocho microservicios ni una base de datos adicional para las aulas. Kafka puede reevaluarse cuando haya flujos de eventos independientes, consumidores múltiples y volumen que justifique el costo; Redis es caché, Queues son tareas y PostgreSQL administra dinero/créditos. El balanceador adicional depende de redundancia real, no del requisito genérico de seguridad.
