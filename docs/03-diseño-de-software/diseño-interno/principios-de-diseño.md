# Principios de diseño (SOLID) — Mentelyx

> **Documento:** `principios-de-diseno.md`  
> **Actualización del 20/11/2026:** aplica la [instrucción maestra](../../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md): recursos de plan en M5, pagos directos y saldo audiovisual en lugar de créditos y liquidaciones, CulqiOnline, modelos de Workers AI, lienzo, biblioteca, BYOK y anuncios recompensados (secciones 2, 5, 6, 7 y 11; nueva sección 5.8). Las redacciones sustituidas se resumen en la sección 13.

> **Alcance V1:** los principios y ejemplos describen el producto completo; ADR-093 limita V1 a aprendizaje y preparación de exámenes. El resto de módulos/capacidades se conserva como diseño futuro y no implica implementación.


## 1. Objetivo

Definir **cómo se aplicarán y comprobarán los cinco principios SOLID en cada uno de los siete módulos de Mentelyx**, para mantener separados los procesos educativos, las políticas comerciales y los detalles tecnológicos. El propósito no es declarar SOLID de forma genérica, sino establecer responsabilidades, contratos y criterios que orienten la futura implementación con Hono y TypeScript.

En particular, se busca impedir que los controladores contengan reglas de negocio, que los casos de uso dependan de proveedores concretos y que un módulo acceda directamente a las tablas o implementaciones privadas de otro. **SOLID facilita la evolución y las pruebas, pero no sustituye los controles transaccionales, la idempotencia, la seguridad ni las pruebas de infraestructura.**

## 2. Contexto arquitectónico

| Elemento | Decisión aplicada a Mentelyx |
|---|---|
| **Estilo arquitectónico** | **Monolito modular en capas**: una API principal con siete módulos de negocio. |
| **Enfoque interno** | **Clean Architecture**: Presentación, Aplicación, Dominio e Infraestructura, con dependencias orientadas a políticas y contratos internos. |
| **Cliente** | Web/PWA con Next.js, React y TypeScript. |
| **Backend** | Hono + TypeScript sobre Cloudflare Workers (arquitectura objetivo; compatibilidad de integraciones pendiente de prueba). |
| **Datos** | PostgreSQL local / Neon PostgreSQL + pgvector en producción; MongoDB local / MongoDB Atlas en producción; Redis para caché y estados temporales. |
| **Archivos y tareas** | Cloudflare R2, Cloudflare Queues y consumidores con DLQ. |
| **Servicios integrados** | Workers AI con DeepSeek V4.1 Flash, Gemma 4 26B A4B, BGE-M3 y FLUX.2 (ADR-077); WebRTC/SFU administrado (RealtimeKit candidato, ADR-046); Bunny Stream condicionado (ADR-014); CulqiOnline como pasarela (ADR-082); proveedores BYOK autorizados (ADR-085); redes publicitarias externas, con la red concreta por seleccionar (ADR-086). |
| **Autenticación y control de acceso** | Biblioteca de autenticación seleccionada (Better Auth, ADR-033/044); reglas propias de autorización RBAC/ABAC y acceso por recurso. |
| **Tipos de cuenta públicos** | Estudiante y Docente; Superadministrador como actor interno. Docente independiente o por nivel académico son modalidades del mismo actor. |
| **Productos** | Planes Gratuito, Estándar, Plus y Premium; Docente Inicial y Docente Live; Studio como capacidad según el plan. Los recursos son configuración versionada de piloto (IM, secciones 14 y 15; ADR-080 y ADR-081). |

La elección de un **monolito modular** no implica que los módulos deban compartir lógica indiscriminadamente. Cada módulo es dueño de sus casos de uso y persistencia; otros módulos colaboran mediante **contratos públicos internos**. Los módulos tampoco son microservicios independientes.

## 3. Significado práctico de los principios SOLID

| Principio | Criterio que utilizaremos en Mentelyx | Error que debemos evitar |
|---|---|---|
| **S — Single Responsibility Principle (SRP)** | Una clase o función cohesiva tiene **una razón principal para cambiar**; se separan transporte HTTP, reglas, persistencia e integración. | Un `*.service.ts` gigante que valida, cobra, consulta SQL, envía correos y genera reportes. |
| **O — Open/Closed Principle (OCP)** | Permitir nuevas variantes **cuando exista un punto de extensión justificado**, sin editar innecesariamente los casos de uso estables. | Crear interfaces y fábricas sin una variación real o prometer que nunca cambiará ningún contrato. |
| **L — Liskov Substitution Principle (LSP)** | Las implementaciones de un puerto cumplen la **semántica**, precondiciones, poscondiciones, efectos y errores pactados. | Considerar intercambiables dos proveedores solo porque TypeScript acepta el mismo tipo de retorno. |
| **I — Interface Segregation Principle (ISP)** | Contratos pequeños, específicos para las necesidades de sus consumidores. | Forzar a un adaptador de IA a implementar almacenamiento, pagos y correo, o a una pasarela sin reembolsos a fingir que los soporta. |
| **D — Dependency Inversion Principle (DIP)** | Los casos de uso conocen **puertos propios**, no SDKs ni repositorios concretos; el Composition Root ensambla implementaciones. | Importar Neon, MongoDB, Cloudflare, Better Auth o el SDK de un proveedor directamente desde el dominio. |

**Nota sobre las interfaces:** los contratos que expresan necesidades de los casos de uso normalmente pueden vivir en `application/ports/`; los contratos que representan abstracciones genuinas del dominio pueden vivir en `domain/`. No es necesario ubicar todas las interfaces dentro del dominio. Las dependencias deben justificarse por responsabilidad, no por el nombre de una carpeta.

## 4. Representación gráfica de referencia

![Principios SOLID aplicados a M5 — Suscripciones y Pagos de Mentelyx](../../img/principios-solid-mentelyx.png)

**Figura 1.** Diagrama UML representativo de SOLID en **M5 — Suscripciones y Pagos**. Se muestran las cuatro responsabilidades de Clean Architecture y las relaciones entre controladores, casos de uso, entidades, puertos y adaptadores. Las letras S, O, L, I y D identifican ejemplos de principios en clases y contratos. **Además de este diagrama general de referencia, en la sección 5 se incluyen las vistas específicas de cada módulo (M1–M7).** Fuente: elaboración propia basada en el formato académico compartido por la docente. Fuente editable: [`principios-solid-m5.drawio`](../../img/fuente_drawio/principios-solid-m5.drawio), creada el 21/11/2026 sobre la plantilla de M4 porque la figura anterior no tenía fuente; conserva las mismas clases y sustituye el adaptador de Mercado Pago por CulqiOnline (ADR-082).


> El diagrama es conceptual: la ubicación visual de los puertos junto al dominio no obliga a ubicar sus archivos en `domain/`; los puertos de casos de uso se definirán preferentemente en `application/ports/`. Los adaptadores externos **implementan** esos puertos; el dominio no importa los adaptadores.

## 5. Aplicación de SOLID por módulo

Los nombres de clases y rutas son **propuestas de implementación TypeScript**, que se validarán cuando diseñemos contratos y persistencia. Cada tabla y diagrama identifica cómo se aplicará **cada uno de los cinco principios** en M1–M7.

### 5.1. M1 — Usuarios y Administración

**Responsabilidad:** gestión de cuentas, autenticación, sesiones y control de acceso; perfiles, tipos de cuenta, modalidad docente, permisos y estados comunicados por M4, y operaciones del Superadministrador. La solicitud de tutorías de un universitario adulto autorizado no cambia por sí misma el tipo de cuenta Estudiante.

![Principios SOLID aplicados a M1 — Usuarios y Administración](../../img/principios-solid-m1.png)

**Figura 2.** Aplicación de principios SOLID en **M1 — Usuarios y Administración**. La fuente editable [`principios-solid-m1.drawio`](../../img/fuente_drawio/principios-solid-m1.drawio) usa `HabilitacionDocentePort` (CO-09); el PNG se reexportó desde ella el 21/11/2026.

| SOLID | Aplicación concreta en M1 | Elementos de código previstos |
|---|---|---|
| **S** | Separar registro, edición de perfiles, solicitud de habilitación, registro de las decisiones de habilitación recibidas de M4 y autorización de recursos. El controlador no valida títulos ni ejecuta consultas SQL. | `register-user.use-case.ts`, `update-profile.use-case.ts`, `approve-teaching-permission.use-case.ts`, `users.controller.ts` |
| **O** | Permitir incorporar nuevos tipos de decisión de habilitación comunicados por M4 o nuevos adaptadores de correo, sin mezclar esos resultados con la autenticación ni modificar las reglas de autorización del usuario. | `HabilitacionDocentePort`, `MailPort`, `habilitar-docente.use-case.ts` |
| **L** | Un repositorio PostgreSQL y un doble de prueba deben respetar las mismas reglas sobre usuario inexistente, identificadores y unicidad; el adaptador de autenticación debe conservar la asociación entre sesión y cuenta y los estados de autenticación; no debe inferir verificaciones documentales ni habilitaciones. | `UserRepository`, `PostgresUserRepository`, `user-repository.contract.spec.ts` |
| **I** | Separar `UserRepository`, `SessionPort`, `HabilitacionDocentePort` y `MailPort`; quien consulta permisos no debe depender del servicio de correo ni de recuperación de contraseña. | `application/ports/*.port.ts` |
| **D** | Casos de uso dependen de puertos y políticas internas; adaptadores PostgreSQL, correo y biblioteca de autenticación se conectan en composición. | `check-resource-access.use-case.ts`, `bootstrap/container.ts` |

**Contrato resuelto (CO-09, 17/11/2026):** `HabilitacionDocentePort` sustituye a `CredentialVerificationPort`. Es el **puerto de entrada** de M1 por el que M4 comunica cada decisión: `registrarHabilitacionAprobada` ([API, sección 2.8](../diseño-externo/02-diseño-de-api-y-contratos.md)) y el evento de revocación. Lo implementa `habilitar-docente.use-case.ts`. Cada decisión trae su `decisionId` y conserva separados tres resultados:
- verificación documental;
- credenciales académicas validadas (solo modalidad `NIVEL_ACADEMICO`);
- habilitación de tutoría con vigencia.

M1 actualiza permisos y `authz_version`, pero no lee documentos, no valida títulos y no consulta a M4. Así se evita el ciclo M1↔M4 que prohíbe el [diseño interno, sección 10.1](diseño-interno-de-modulos.md). La revalidación antes de publicar o cobrar la hace M4 sobre su propia decisión. El puerto no representa validación de contraseñas ni permite exigir títulos a docentes independientes. `SessionPort` se limita a las sesiones de autenticación.

**Reglas que deben permanecer protegidas:** una cuenta Docente puede registrar una modalidad libre o académica; declarar una licenciatura o doctorado **no equivale a una acreditación verificada**; ofrecer tutorías remuneradas exige habilitación; el Superadministrador no obtiene acceso indiscriminado a información sensible fuera de políticas auditables.

**Pruebas necesarias:** impedir elevación de privilegios, impedir suplantación de recurso y evitar que cambios de modalidad otorguen automáticamente insignias o permisos; verificar que un Estudiante habilitado conserva el tipo de cuenta inicial. Una suite de contratos debe validar repositorios reales y dobles de prueba.

### 5.2. M2 — Cursos y Contenidos (Mentelyx Studio)

**Responsabilidad:** cursos, lecciones, materiales, estructura de presentaciones y recursos interactivos; publicación, versionado, archivos, derechos de acceso y gestión de contenido de Studio.

![Principios SOLID aplicados a M2 — Cursos y Contenidos](../../img/principios-solid-m2.png)

**Figura 3.** Aplicación de principios SOLID en **M2 — Cursos y Contenidos (Mentelyx Studio)**.

| SOLID | Aplicación concreta en M2 | Elementos de código previstos |
|---|---|---|
| **S** | Diferenciar editar material, publicar una versión, comprobar derechos, guardar metadatos y subir archivos; generar una imagen con IA es un caso de uso distinto de editar manualmente. | `edit-material.use-case.ts`, `publish-material.use-case.ts`, `generate-studio-asset.use-case.ts` |
| **O** | Nuevos tipos de exportación o almacenamiento podrán incorporarse por adaptadores cuando estén definidos los formatos soportados, sin cambiar reglas de publicación. | `FileStoragePort`, `MaterialExporterPort`, `R2StorageAdapter` |
| **L** | Cualquier exportador debe devolver un resultado válido para el formato declarado o un error explícito; ningún adaptador debe devolver archivos corruptos simulando éxito. | `MaterialExporterPort`, `exporter.contract.spec.ts` |
| **I** | Separar lectura/edición documental, carga de archivos, exportación y publicación de videos. No convertir `ContentRepository` en una interfaz que gestione todos los servicios. | `ContentRepository`, `FileStoragePort`, `VideoCatalogPort`, `MaterialExporterPort` |
| **D** | El editor y los casos de uso no deben importar el driver MongoDB, R2 ni Bunny Stream: se comunican mediante puertos. | `MongoContentRepository`, `R2StorageAdapter`, `BunnyVideoAdapter` |

**Reglas protegidas:** solo el autor o un usuario autorizado puede editar y publicar; los materiales conservan versión y política de acceso; **la edición manual no consume recursos de IA**; la IA nunca modifica la capa del usuario de un lienzo; los recursos son privados por defecto y su publicación es voluntaria y retirable (BR-06, BR-07, BR-11); los materiales no se incorporan automáticamente a conjuntos de entrenamiento de proveedores ni a RAG sin autorización válida.

**Pruebas necesarias:** un usuario no edita materiales ajenos; una publicación no altera accidentalmente versiones anteriores; falla de R2 no produce una publicación confirmada con un archivo inexistente; un trabajo de IA reintentado no aplica múltiples descuentos por la misma operación lógica.

**Alcance 3D:** un futuro editor 3D se evaluará por separado. Tinkercad es una referencia de experiencia de usuario, no un SDK, proveedor ni tecnología elegida; no se introducen aquí clases de modelado 3D que todavía no tengan requisitos aprobados.

### 5.3. M3 — Evaluaciones y Aprendizaje

**Responsabilidad:** diagnósticos, ejercicios, simulacros, calificaciones, evidencias y progreso académico. La evaluación oficial debe ser reproducible y no depender de una respuesta generativa no verificable.

![Principios SOLID aplicados a M3 — Evaluaciones y Aprendizaje](../../img/principios-solid-m3.png)

**Figura 4.** Aplicación de principios SOLID en **M3 — Evaluaciones y Aprendizaje**.

| SOLID | Aplicación concreta en M3 | Elementos de código previstos |
|---|---|---|
| **S** | Separar entrega de evaluación, corrección, registro de resultado y actualización de progreso; el controlador no calcula notas. | `submit-evaluation.use-case.ts`, `grade-evaluation.use-case.ts`, `record-progress.use-case.ts` |
| **O** | Si existen criterios de corrección realmente diferentes (opción múltiple, rúbrica, etc.), usar estrategias tipadas para añadir una nueva sin reescribir el flujo común. | `GradingPolicy`, `MultipleChoiceGrader`, `RubricGrader` (condicionados al alcance) |
| **L** | Cada corrector aplicable respeta un contrato de entrada, escala, redondeo y errores; no sustituir silenciosamente una corrección determinista por un LLM. | `GradingPolicy`, `grading-policy.contract.spec.ts` |
| **I** | Separar consulta de bancos de preguntas, persistencia de resultados y seguimiento de progreso, evitando interfaces que mezclen lectura y escritura no relacionadas. | `QuestionBankPort`, `EvaluationResultRepository`, `ProgressRepository` |
| **D** | Los casos de uso reciben repositorios y políticas como contratos; el almacenamiento concreto PostgreSQL o MongoDB queda fuera del dominio. | `PostgresResultRepository`, `MongoQuestionBankAdapter` |

**Reglas protegidas:** las calificaciones y los resultados persistidos deben estar vinculados con el estudiante autorizado, la versión de la evaluación y los criterios correspondientes. PostgreSQL conserva resultados oficiales; MongoDB puede contener estructuras flexibles de preguntas y actividades.

**Pruebas necesarias:** mismo conjunto de respuestas y reglas produce el mismo resultado; no se puede enviar una evaluación en nombre de otro alumno; no se modifica un intento cerrado sin una operación auditada; doble envío no duplica el resultado oficial.

### 5.4. M4 — Docentes y Clases

**Responsabilidad:** oferta de sesiones, horarios, cupos, reservas, tutorías, asistencia y conexión controlada con la plataforma audiovisual. Aforo inicial de diseño: hasta **35 estudiantes y un docente** por aula, sujeto a pruebas del proveedor.

![Principios SOLID aplicados a M4 — Docentes y Clases](../../img/principios-solid-m4.png)

**Figura 5.** Aplicación de principios SOLID en **M4 — Docentes y Clases**.

| SOLID | Aplicación concreta en M4 | Elementos de código previstos |
|---|---|---|
| **S** | Separar creación de clase, disponibilidad, reserva, validación de habilitación, acceso al aula y registro de asistencia. | `create-class.use-case.ts`, `reserve-class.use-case.ts`, `join-class.use-case.ts` |
| **O** | Integrar otro proveedor WebRTC/SFU a través de `VideoRoomPort` cuando pueda cumplir roles, credenciales, acceso y eventos requeridos. | `VideoRoomPort`, `RealtimeKitRoomAdapter` (candidato, condicionado a prueba; ADR-046) |
| **L** | Un adaptador audiovisual alternativo debe preservar caducidad de accesos, permisos y semántica de sesión; si carece de funciones obligatorias, **no es sustituto válido**. | `video-room.contract.spec.ts`, `VideoRoomPort` |
| **I** | Distinguir `ClassRepository`, `VideoRoomPort`, `TeachingEligibilityPort`, `AudiovisualCapacityPort`, `DirectPaymentPort` y `GroupRepository`. Reservar un cupo no requiere métodos de grabación ni de comisiones. | `application/ports/` y contratos públicos de M1/M5 |
| **D** | `ReservarClaseUseCase` depende de contratos públicos de Usuarios y Pagos, nunca de sus tablas privadas ni de SDK del proveedor audiovisual. | `reserve-class.use-case.ts`, `teaching-eligibility.port.ts`, `live-entitlement.port.ts` |

**Reglas protegidas:** reservar una clase exige cupo disponible, sesión válida, participante autorizado y derecho de acceso; verificar títulos o habilitaciones corresponde a M1, y reservar la capacidad audiovisual y registrar pagos directos, a M5. Un caso de uso de M4 puede orquestar esas verificaciones mediante sus contratos públicos, manteniendo un diseño transaccional consistente para reserva, pago directo y capacidad.

**Pruebas necesarias:** dos reservas simultáneas del último cupo no confirman ambas; un estudiante sin reserva no obtiene credenciales válidas; el mismo intento no reserva dos veces capacidad audiovisual ni registra dos veces un pago; retirar a un miembro de un grupo revoca su acceso de inmediato; si falla el proveedor de video no se considera impartida una clase; la conexión de audio/video ocurre entre el cliente y el SFU, no a través de Hono.

### 5.5. M5 — Suscripciones y Pagos

**Responsabilidad:** planes y beneficios, órdenes de pago con CulqiOnline, webhooks, activación de suscripciones, recursos de plan por categoría, recompensas concedidas, saldo audiovisual de Docente Live, devoluciones, comisiones, registro de pagos directos y conciliación. **PostgreSQL es la fuente de verdad** para pagos, recursos y movimientos; Redis no se usa como libro mayor. Mentelyx no custodia el dinero de los docentes. *(Diagrama detallado en la Figura 1 de la sección 4).*

| SOLID | Aplicación concreta en M5 | Elementos de código previstos |
|---|---|---|
| **S** | Diferenciar crear el cargo, verificar el evento y consultar su estado, confirmar el pago, reservar recursos, registrar pagos directos y cerrar el periodo de Docente Live. Evitar un `billing.service` que concentre todos los procesos. | `create-charge.use-case.ts`, `process-payment-webhook.use-case.ts`, `reserve-plan-resource.use-case.ts`, `register-direct-payment.use-case.ts`, `close-live-period.use-case.ts` |
| **O** | CulqiOnline es la pasarela aprobada (ADR-082). Las reglas comerciales no dependen de sus códigos específicos; una pasarela futura autorizada entraría por el mismo puerto sin cambiarlas. | `PaymentPort`, `CulqiPaymentAdapter` |
| **L** | Las implementaciones deben respetar importe, moneda, identificador de la orden, estados, errores, idempotencia y garantías de evento. Que dos pasarelas devuelvan `{approved: true}` no las convierte en equivalentes. | `checkout-adapter.contract.spec.ts`, `PaymentEventVerifierPort` |
| **I** | Puertos separados para cargos, verificación de eventos, devoluciones, recurrencia, repositorios, recursos de plan, saldo audiovisual y transacción. Un caso de uso de confirmación no debe conocer métodos para abrir videollamadas ni generar facturas. | `PaymentPort`, `PaymentEventVerifierPort`, `ResourceLedgerRepository`, `AudiovisualBalanceRepository`, `FeeScheduleRepository`, `UnitOfWork` |
| **D** | Los casos de uso dependen de `PaymentRepository`, `UnitOfWork` y `OutboxRepository`, no de drivers SQL ni clientes de Queues. El Composition Root inyecta adaptadores. | `PostgresPaymentRepository`, `PostgresUnitOfWork`, `PostgresOutboxRepository`, `bootstrap/container.ts` |

**Reglas protegidas:** activar una suscripción **solo después de una confirmación válida**; registrar una única activación por compra; realizar movimientos de recursos con identificador único, razón y versión de la política; distinguir el pago de la suscripción, el pago directo al docente y la comisión; no hacer cargos adicionales sin autorización; calcular la devolución de Docente Live con la fórmula versionada sin margen arbitrario; prohibir saldos negativos y movimientos duplicados. Los precios, tarifas y condiciones de planes deben versionarse para no alterar obligaciones previas.

**Flujo de referencia:**

1. `CrearCheckoutUseCase` registra la orden en PostgreSQL y solicita iniciar el checkout mediante `PaymentCheckoutPort`; abrir el checkout **no confirma** un pago.
2. `PaymentWebhookController` recibe el evento y utiliza `PaymentEventVerifierPort` para validarlo según el contrato de CulqiOnline y consultar el estado real del cargo.
3. `ConfirmarPagoUseCase` valida orden, evento, estado e idempotencia.
4. `UnitOfWork` persiste en **una misma transacción SQL** la transición de orden, el movimiento de recursos o beneficio, la deduplicación y el evento de Outbox cuando correspondan.
5. Un publicador independiente entrega el Outbox a Cloudflare Queues; un consumidor idempotente procesa las notificaciones y tareas posteriores.

**Pruebas necesarias:** enviar un mismo webhook diez veces —también en paralelo— no duplica acreditaciones; dos eventos distintos que acreditan la misma compra no generan dos movimientos; un fallo entre commit y publicación no pierde el evento de Outbox; dos consumos simultáneos no dejan saldo negativo; la conciliación detecta estados inciertos del proveedor.

> **Límite de SOLID:** integridad de pagos requiere adicionalmente **ACID, índices `UNIQUE`, actualizaciones condicionales, Idempotent Receiver, Transactional Outbox, reconciliación y pruebas de concurrencia**. Son patrones y controles complementarios, no consecuencias automáticas de usar SOLID.

### 5.6. M6 — Tutor IA y RAG

**Responsabilidad:** tutor educativo, decisión de la modalidad de fuentes (FUNDAMENTADA, MIXTA o GENERAL), recuperación híbrida autorizada (BGE-M3 de 1024 dimensiones y texto), extracción y OCR de fuentes privadas, búsqueda en la biblioteca, generación de explicaciones y evaluaciones, BYOK, uso de contexto verificable y consumo técnico y costos de IA. Las cuotas comerciales son de M5 (ADR-080).

![Principios SOLID aplicados a M6 — Tutor IA y RAG](../../img/principios-solid-m6.png)

**Figura 6.** Aplicación de principios SOLID en **M6 — Tutor IA y RAG**.

| SOLID | Aplicación concreta en M6 | Elementos de código previstos |
|---|---|---|
| **S** | Separar autorización y selección de material, clasificación de la consulta, decisión de la modalidad, generación de embeddings, recuperación de fragmentos, construcción de contexto, llamada al LLM y medición de consumo. | `answer-with-rag.use-case.ts`, `source-mode.policy.ts`, `retrieve-context.service.ts`, `record-ai-usage.use-case.ts` |
| **O** | Nuevos modelos de embeddings o LLM se integran mediante adaptadores si satisfacen el contrato y los requisitos de costo, seguridad y calidad. | `EmbeddingPort`, `LlmPort`, `LlmProviderAdapter` |
| **L** | Proveedores alternativos mantienen contrato de entrada/salida, errores, límites, semántica de consumo y protección de datos; diferencias de capacidad se negocian expresamente. | `llm-provider.contract.spec.ts`, `embedding-provider.contract.spec.ts` |
| **I** | Puertos separados para generar embeddings, buscar vectores, invocar LLM, reservar recursos de plan, descifrar credenciales BYOK y registrar uso. No mezclar en una interfaz universal `AIService`. | `EmbeddingPort`, `SemanticSearchPort`, `LlmPort`, `ContentAccessPort`, `PlanResourcesPort`, `ByokCipherPort`, `AiUsagePort` |
| **D** | Casos de uso no importan SDK de proveedor LLM ni SQL de pgvector; RAG se ensambla sobre puertos con adaptadores externos. | `PgvectorSearchAdapter`, `LlmProviderAdapter`, `EmbeddingProviderAdapter` |

**Reglas protegidas:** la recuperación de contexto debe aplicar permisos de acceso **antes y durante la búsqueda** de fragmentos; no incluir documentos de otro usuario o no autorizados; reservar el recurso de plan en M5 antes de costos y registrar el gasto técnico por operación; con BYOK, no hacer fallback facturado por Mentelyx ni eludir restricciones de menores; diferenciar la información recuperada del complemento general; separar consulta educativa de una decisión oficial de calificación; no autorizar uso de materiales para entrenamiento solo por haberlos cargado a la plataforma.

**Pruebas necesarias:** documentos privados no aparecen en el contexto; un modelo alternativo satisface las pruebas de contrato; las cuotas se comprueban antes de invocar costos altos y se concilian con el uso real; una falla o reintento de generación no descuenta dos veces el mismo trabajo; la ausencia de contexto autorizado se comunica sin inventar citas.

### 5.7. M7 — Publicidad y Patrocinios

**Responsabilidad:** redes publicitarias externas compatibles, anuncios recompensados verificados en el servidor, propuestas de campañas, aprobación, ubicaciones permitidas, patrocinios educativos y métricas agregadas sin exposición de datos educativos individuales (ADR-086). M7 verifica eventos y elegibilidad; M5 concede los recursos.

![Principios SOLID aplicados a M7 — Publicidad y Patrocinios](../../img/principios-solid-m7.png)

**Figura 7.** Aplicación de principios SOLID en **M7 — Publicidad y Patrocinios**.

| SOLID | Aplicación concreta en M7 | Elementos de código previstos |
|---|---|---|
| **S** | Separar revisión de campaña, validación de política, autorización de patrocinio y métricas permitidas. | `approve-campaign.use-case.ts`, `validate-placement.service.ts`, `campaign.repository.ts` |
| **O** | Las reglas de publicación pueden ampliarse por políticas bien definidas cuando existan varios canales o tipos de campaña; no añadir estrategias artificiales si una regla simple basta. | `CampaignPlacementPolicy` (condicionado), `CampaignRepository` |
| **L** | Si existen varios evaluadores de campañas, todos deben respetar el contrato de resultados: aprobado/rechazado, motivos y criterios mínimos de privacidad. | `CampaignPolicy`, `campaign-policy.contract.spec.ts` (condicionado) |
| **I** | Separar repositorio de campañas, validador de política, verificador de la red publicitaria y estadísticas agregadas, evitando puertos que permitan consultar calificaciones personales para segmentar anuncios. | `CampaignRepository`, `CampaignPolicyPort`, `AdNetworkVerifierPort`, `AggregatedMetricsPort` |
| **D** | El caso de uso de aprobación depende de política y repositorio abstractos, no de SQL ni plataformas publicitarias. | `approve-campaign.use-case.ts`, `PostgresCampaignRepository` |

**Reglas protegidas:** una campaña requiere aprobación; no obtiene acceso a información académica individual ni perfiles de menores; un patrocinio de una clase gratuita exige presupuesto autorizado y política de publicación. No crear un actor público Patrocinador. La red publicitaria externa concreta queda por seleccionar entre las compatibles (ADR-086); los anuncios recompensados no se ofrecen a menores y un evento del navegador no concede nada.

**Pruebas necesarias:** no aprobar campañas prohibidas; no exponer datos individuales en métricas; cambios de política requieren nuevas pruebas; el módulo deshabilitado no afecta el aprendizaje esencial ni pagos.

### 5.8. Capacidades añadidas por la instrucción maestra

| Capacidad | Módulo dueño | Principio clave | Elementos previstos |
|---|---|---|---|
| Pizarra inteligente y selección por lazo | M2 (persistencia y capas), M6 (explicación) | **S**: capas ORIGINAL, USUARIO e IA separadas; **I**: M6 solo recibe la selección mínima | `lienzo.ts`, `operacion-lienzo.ts`, `obtener-seleccion-lienzo.use-case.ts` |
| Biblioteca reutilizable | M2 (recursos y publicación), M6 (búsqueda y adaptación) | **S**: publicar, retirar y valorar son casos distintos; **D**: búsqueda por puerto | `publicar-recurso.use-case.ts`, `library-search.port.ts` |
| Evaluaciones personalizadas | M3 (autoridad), M6 (generación) | **S**: generar no es calificar; **D**: M3 recibe el resultado por cola | `solicitar-generacion.use-case.ts`, `generar-evaluacion.use-case.ts` |
| Recursos de plan | M5 | **I**: reservar, confirmar, liberar y reintegrar como contratos pequeños; **D**: los consumidores usan puertos | `PlanResourcesPort`, `resource-ledger.ts` |
| BYOK | M6 | **L**: un proveedor BYOK respeta el contrato de `LlmPort` sin fallback facturado; **D**: el cifrado va detrás de un puerto | `ByokCipherPort`, `byok-provider.adapter.ts` |
| Anuncios recompensados | M7 (verificación), M5 (concesión) | **S**: verificar y conceder están en módulos distintos | `verificar-recompensa.use-case.ts`, `conceder-recompensa.use-case.ts` |
| Docente Live y pagos directos | M4 (clases), M5 (saldo y comisiones) | **S**: capacidad, pago directo y devolución separados | `iniciar-clase.use-case.ts`, `cerrar-periodo-live.use-case.ts` |

## 6. Matriz general de SOLID en Mentelyx

Esta matriz sintetiza qué problema justifica SOLID **en cada módulo**, no declara que todas las clases implementen los cinco principios simultáneamente.

| Módulo | SRP: separación principal | OCP/LSP: variación controlada | ISP: puertos focalizados | DIP: dependencia de abstracciones |
|---|---|---|---|---|
| **M1 Usuarios** | Registro, perfil, habilitación, credenciales | Verificadores y repositorios compatibles | Cuentas y sesiones / permisos / correo | Casos de uso ↔ interfaces propias |
| **M2 Contenidos** | Edición, publicación, exportación, archivos | Almacenamiento y exportadores compatibles | Contenido / archivos / video | Sin dependencias directas de MongoDB/R2 |
| **M3 Evaluaciones** | Respuesta, corrección, resultado, progreso | Corrección variable cuando exista | Preguntas / resultados / progreso | Sin drivers SQL en calificación |
| **M4 Clases** | Oferta, reserva, acceso, asistencia, grupos, pago directo | Proveedores de aula equivalentes | Reservas / video / habilitación / capacidad audiovisual / pagos directos | Contratos M1 y M5, no tablas ajenas |
| **M5 Pagos** | Cargo, webhook, recursos, saldo audiovisual, comisiones | Pasarelas que cumplen la semántica de `PaymentPort` | Cargos / verificador / libro de recursos / transacción | Adaptadores SQL y CulqiOnline inyectados |
| **M6 Tutor IA** | Embedding, búsqueda, contexto, generación | LLM/embeddings con contrato verificable | Embedding / búsqueda / LLM / cuotas | RAG independiente de SDK concreto |
| **M7 Publicidad** | Revisión, política, difusión | Políticas por canal si se necesitan | Campaña / validación / métricas | Repositorio y política inyectados |

## 7. Reglas de dependencias y colaboración entre módulos

**Regla general:** `Presentación → Aplicación → Dominio` describe dependencias admitidas hacia las políticas internas. Los adaptadores de infraestructura implementan puertos definidos internamente; el Composition Root ensambla las implementaciones. Las flechas de ejecución o llamadas a servicios externos no deben confundirse con importaciones del código fuente.

| Colaboración | Contrato público propuesto | Prohibición expresa |
|---|---|---|
| **M4 → M1** | `TeachingEligibilityPort`: verifica que la persona pueda enseñar la sesión. | Leer directamente tablas de perfiles o credenciales privadas de M1. |
| **M4 → M5** | `AudiovisualCapacityPort` y `DirectPaymentPort`: reservan capacidad y registran pagos directos con operación identificada. | Escribir el saldo audiovisual o las comisiones mediante SQL desde M4. |
| **M3 → M2** | `QuestionCatalogPort`: consulta preguntas o materiales autorizados. | Usar directamente la colección MongoDB de M2. |
| **M6 → M2** | `ContentAccessPort`: solicita contenidos indexables y permitidos. | Recorrer todos los archivos sin filtros de propiedad y autorización. |
| **M6 → M5** | `PlanResourcesPort`: reserva, confirma o libera recursos de plan; el presupuesto técnico es de M6. | Consultar o mutar el libro de recursos desde el módulo IA. |
| **M7 → M5** | Evento `RecompensaVerificada`: M5 concede una sola vez. | Escribir recursos desde M7. |
| **M6 → M2** | `obtenerSeleccionLienzo`, `buscarRecursosBiblioteca`: solo objetos y recursos autorizados. | Leer las colecciones de lienzos o la biblioteca directamente. |
| **M7 → M2** | `CampaignPlacementPort`: consulta ubicaciones de contenido habilitadas. | Utilizar datos académicos individuales o colecciones privadas. |

Los contratos entre módulos pertenecen a su **superficie pública de aplicación**; no son APIs HTTP entre microservicios. Cada módulo conserva la propiedad de sus reglas y persistencia. Si una transacción coordina recursos de más de un módulo dentro del mismo PostgreSQL, su responsable debe definirse explícitamente para preservar límites y atomicidad; no se asume una transacción distribuida entre PostgreSQL y MongoDB.

### Ejemplo ilustrativo de DIP + ISP para una reserva

```ts
// Contratos de aplicación: formas ilustrativas, no API ya implementada.
export interface TeachingEligibilityPort {
  canTeach(teacherId: string, classId: string): Promise<boolean>;
}

export interface DirectPaymentPort {
  registerDeclared(input: {
    reservationId: string;
    payerId: string;
    amountPen: string;
    operationId: string;
  }): Promise<{ paymentId: string }>;
}

export interface ClassRepository {
  findById(classId: string): Promise<{ id: string; capacity: number } | null>;
}

export class ReservarClaseUseCase {
  constructor(
    private readonly teaching: TeachingEligibilityPort,
    private readonly payments: DirectPaymentPort,
    private readonly classes: ClassRepository,
  ) {}

  // La implementación completa debe coordinar aforo, transacción,
  // idempotencia y compensación en sus servicios propietarios.
}
```

No se presentan aquí SQL ni SDKs externos dentro del caso de uso. El ejemplo **no constituye un algoritmo transaccional completo**: el diseño definitivo de los efectos concurrentes debe regirse por ADR-043, ADR-048 (libro vigente para recursos y saldo audiovisual) y ADR-081, pruebas de integración y contratos de M4/M5. La reserva queda en espera hasta que el pago directo se verifica.

## 8. Relación entre SOLID, Clean Architecture y patrones de diseño

| Elemento | Cómo contribuye | Qué NO garantiza por sí solo |
|---|---|---|
| **SOLID** | Cohesión, puntos de extensión justificados, sustitución contractual, interfaces específicas e inversión de dependencias. | Integridad financiera, autorización correcta o disponibilidad del proveedor. |
| **Clean Architecture** | Dirección de las dependencias e independencia del dominio respecto de infraestructura y presentación. | Implementar SOLID automáticamente al crear cuatro carpetas. |
| **Repository / Adapter** | Abstraer persistencia e integraciones por contratos de aplicación. | Que dos bases de datos o dos proveedores tengan semántica idéntica. |
| **Dependency Injection** | Ensamblar implementaciones sin importarlas en los casos de uso. | Que usar un contenedor DI vuelva correcto el diseño. |
| **Strategy / Policy** | Seleccionar algoritmos o reglas realmente distintos. | Justificación de una jerarquía si solo existe una alternativa. |
| **Unit of Work + índices UNIQUE** | Transacciones y protección contra carreras cuando se implementan y prueban correctamente. | Transacciones atómicas entre proveedores externos o entre PostgreSQL y MongoDB. |
| **Idempotent Receiver** | Evitar repetir efectos bajo control de Mentelyx ante reintentos HTTP, webhooks o colas. | Impedir por sí solo un doble cargo ya realizado en una pasarela externa. |
| **Transactional Outbox** | Registrar eventos pendientes en la misma transacción SQL que sus cambios de negocio. | Publicación exactamente una vez: consumidores también deben ser idempotentes. |

### Qué cambia respecto a un diseño sin SOLID

| Situación | Diseño acoplado | Diseño SOLID propuesto |
|---|---|---|
| Se cambia el proveedor de videoconferencia | M4 modifica reservas para hablar con el nuevo SDK. | Se evalúa y modifica el adaptador `VideoRoomPort`, validando sus capacidades. |
| Se cambia la pasarela de pagos | M5 modifica las entidades y mezcla webhooks con checkout. | Adaptadores específicos para checkout y verificación; contratos y reglas estables. |
| Se cambia el LLM o los embeddings | M6 incorpora API keys y formatos del proveedor en el dominio. | Modelos y búsqueda detrás de puertos, con pruebas de compatibilidad. |
| Se añade una evaluación con otra rúbrica | Se agregan condiciones a un método monolítico. | Se introduce una política intercambiable **si** hay variantes reales. |
| Cambian recursos de plan o derechos de suscripción | M4/M6 actualizan directamente las tablas financieras. | M5 mantiene el libro de recursos y expone contratos públicos a los demás módulos. |
| Falla Redis | Una regla crítica deja de funcionar por depender del caché. | Fuente autoritativa sigue en PostgreSQL y la caché es un adaptador prescindible donde proceda. |

## 9. Criterios de verificación durante el desarrollo

La calidad de la propuesta se medirá mediante revisiones de dependencias, pruebas de contrato y ensayos de negocio. **Un archivo con el nombre `*.port.ts` o una interfaz TypeScript no demuestra por sí mismo el cumplimiento de SOLID**.

| Módulo | Pruebas prioritarias | Principio/s verificados |
|---|---|---|
| **M1** | Diferenciar tipo de cuenta, modalidad docente y habilitación; impedir acceso a cuentas ajenas; contratos de cuentas, sesiones y repositorio. | SRP, LSP, ISP, DIP |
| **M2** | Edición manual sin descuento IA; publicación autorizada; fallos de almacenamiento; pruebas de exportación. | SRP, OCP, LSP, DIP |
| **M3** | Misma evaluación y rúbrica producen resultado repetible; permisos; guardar una sola vez el intento. | SRP, OCP/LSP cuando haya varias estrategias, DIP |
| **M4** | Reservas concurrentes del último cupo; credenciales temporales solo para usuarios autorizados; sustitución controlada de SFU. | SRP, LSP, ISP, DIP + consistencia |
| **M5** | Webhook repetido diez veces; eventos equivalentes distintos; Outbox tras fallo; no duplicar movimiento; pruebas comunes de pasarelas. | Todos + idempotencia/ACID |
| **M6** | Un documento privado no entra en contexto RAG; cuotas y costos; proveedor LLM alternativo bajo mismo contrato. | SRP, OCP, LSP, ISP, DIP |
| **M7** | Campañas requieren autorización y no acceden a datos académicos individuales; módulo apagado sin afectar estudio. | SRP, ISP, DIP; OCP/LSP si existen variantes |

**Revisión automática de importaciones (objetivo):**

- `domain/` no importa `application/`, `adapters/`, `infrastructure/`, Hono, drivers de BD ni SDKs externos.
- `application/` no importa implementaciones `infrastructure/` o dependencias concretas de otros módulos.
- `adapters/` y `infrastructure/` implementan interfaces internas; pueden depender de frameworks y SDKs externos.
- `bootstrap/` es el lugar donde se construyen implementaciones concretas y se inyectan en casos de uso.
- Ningún módulo importa repositorios internos o tablas privadas de otro módulo.

**Pruebas de contrato LSP:** utilizar la misma batería de casos para cada implementación de un puerto. Comprobar entradas válidas e inválidas, semántica de errores, tiempos de expiración cuando importen, estados, reintentos y capacidades declaradas. No exigir una funcionalidad no prevista en el contrato.

## 10. Organización prevista de archivos

Las rutas son ilustrativas y pueden ajustarse antes del desarrollo, manteniendo sus responsabilidades.

```text
src/
├── modules/
│   ├── users/
│   ├── courses/
│   ├── evaluations/
│   ├── classes/
│   ├── billing/
│   ├── ai-tutor/
│   └── advertising/
│       └── ...
├── shared/
│   └── technical/
└── bootstrap/
    └── container.ts
```

Cada uno de los siete módulos utilizará, cuando tenga complejidad suficiente, la siguiente organización:

```text
modules/<modulo>/
├── domain/                # entidades, objetos de valor, reglas
├── application/
│   ├── use-cases/         # orquestación del negocio
│   └── ports/             # contratos necesarios por casos de uso
├── adapters/
│   ├── inbound/           # controladores HTTP, handlers
│   └── outbound/          # repositorios, clientes de proveedores
└── infrastructure/        # configuración y detalles técnicos
```

No convertir los contratos en capas vacías o complejidad accidental: agrupar archivos relacionados sigue siendo aceptable en módulos simples, siempre que las dependencias y responsabilidades se mantengan correctas.

## 11. Relación con las decisiones arquitectónicas de Mentelyx

| ADR | Decisión relevante | Implicación para SOLID |
|---|---|---|
| **ADR-001** | Monolito modular de siete módulos. | SRP entre módulos; contratos públicos y separación de responsabilidades. |
| **ADR-002** | Clean Architecture y puertos/adaptadores. | DIP e ISP; dominio independiente de SDKs y HTTP. |
| **ADR-004** | Gestión de cuentas, autenticación y autorización en backend. | SRP de autenticación frente a autorización y políticas por recurso. |
| **ADR-005** | Pasarela de pagos desacoplada. | OCP, LSP, ISP y DIP para adaptar checkout, eventos y reembolsos. |
| **ADR-006 / ADR-007** | Fuente transaccional e idempotencia. | Contratos separados que permiten transacciones y deduplicación. |
| **ADR-019 / ADR-026** | Tutor IA y RAG autorizado. | SRP entre recuperación, embeddings y generación; puertos de IA. |
| **ADR-023** | PostgreSQL y MongoDB con responsabilidades distintas. | Repositorios especializados sin exponer drivers al dominio. |
| **ADR-042 / ADR-043** | Queues, DLQ, webhooks y Outbox. | SRP entre negocio y publicación; DIP de eventos y persistencia. |
| **ADR-045 / ADR-046** | Aulas en vivo de 35 + 1 y proveedor SFU administrado; modelo comercial de ADR-081. | Puertos audiovisuales, pruebas de contrato y reserva independiente del video. |
| **ADR-047 / ADR-048 / ADR-050** | Productos de ADR-047 y créditos Studio de ADR-050 sustituidos por ADR-080 y ADR-088; ADR-048 vigente como libro de recursos y saldo audiovisual. | Políticas y repositorios acotados, sin lógica de cuotas dispersa. |
| **ADR-078 / ADR-080 / ADR-085** | Modalidad de fuentes decidida por el orquestador; cuotas comerciales en M5; BYOK. | `PlanResourcesPort`, `source-mode.policy.ts`, `ByokCipherPort`; ISP entre comercial y técnico. |
| **ADR-083 / ADR-084 / ADR-087** | Lienzo, biblioteca y grupos privados. | SRP entre capas del lienzo, publicación y permisos; contratos de solo lectura hacia M6. |
| **ADR-081 / ADR-082 / ADR-086** | Modelo docente, CulqiOnline y publicidad. | `PaymentPort`, `DirectPaymentPort`, `AdNetworkVerifierPort`; M5 como único escritor de recursos. |
| **ADR-051 / ADR-052** | Grabaciones y conciliación separada; las liquidaciones por créditos quedan sustituidas por pagos directos con comisión (ADR-081). | SRP entre video, contabilidad y publicación; contratos especializados. |
| **ADR-053 / ADR-054** | Costos IA y resiliencia. | Interfaces medibles y fallos externos aislados sin contaminar reglas. |
| **ADR-055** | Políticas comerciales versionadas. | Reglas cohesionadas, independientes de controladores y adaptadores. |

## 12. Beneficios y límites

La aplicación de SOLID a los siete módulos permite organizar el trabajo por responsabilidades, probar casos de uso sin todos los proveedores desplegados y evolucionar integraciones sin cambios innecesarios en las reglas educativas y comerciales. También ayuda a evitar dependencias circulares dentro del monolito y a mantener una separación clara entre **cuenta**, **habilitación**, **derechos de suscripción** y **procesos de negocio**.

No obstante, SOLID **no garantiza** que la plataforma sea segura, rentable, disponible o correcta por sí sola. Son indispensables validaciones de concurrencia, privacidad de menores, costos de IA y video, integridad SQL, contratos con proveedores, observabilidad y pruebas de recuperación.

**Conclusión:** Mentelyx utilizará SOLID como **criterio transversal verificable en M1–M7**. M5 sirve como caso de estudio de la **figura UML general (Figura 1)**, acompañada de las vistas específicas para cada uno de los demás módulos (Figuras 2–7), estableciendo los contratos, responsabilidades, puntos de extensión y pruebas que orientarán el desarrollo.

## Documentos relacionados

- `07-decisiones-arquitectonicas.md`: ADR vigentes y estados de adopción.
- `enfoque-arquitectonico.md`: Clean Architecture y dirección de dependencias.
- `componentes-arquitectonicos.md`: componentes C4 nivel 3 y relaciones del backend.
- `patrones-de-diseno.md`: patrones de implementación, idempotencia, consistencia y resiliencia.

## 12 bis. Evidencia en el código: Sprint 2 (27/11/2026)

Cada fila remite a un archivo real y a la prueba que lo demuestra. Las rutas son relativas a la raíz del repositorio.

| Principio | Problema resuelto | Archivo y componente | Implementación | Justificación y beneficio | Evidencia |
|---|---|---|---|---|---|
| **S** Responsabilidad única | Mezclar reglas de calificación con acceso a datos impedía probarlas sin base de datos | `backend/src/modules/evaluaciones-aprendizaje/dominio/evaluacion.ts` (`proyectar`, `calificar`, `repasar`) frente a `infraestructura/postgres-intentos.repository.ts` | El dominio solo calcula; el repositorio solo persiste. El caso de uso (`aplicacion/preparaciones-v1.use-cases.ts`) los coordina | La regla oficial de nota cambia en un solo lugar, sin tocar SQL | `tests/jest/m3-evaluaciones.test.ts` (dominio sin base) y `backend/src/tests/v1-full-stack.integration.test.ts` (con PostgreSQL) |
| **O** Abierto/cerrado | Incorporar NVIDIA sin reescribir el Tutor | `backend/src/modules/tutor-ia-rag/infraestructura/nvidia.adapter.ts` implementa `ProveedorIaPort` (`dominio/tutor.ts`) | Se añadió una clase nueva. `aplicacion/responder-consulta.use-case.ts` no cambió por NVIDIA: solo la composición (`tutor-ia-rag.module.ts`, `configIa` en `backend/src/app.ts`) | Cada proveedor es una extensión (ADR-094); el flujo de cuotas, presupuesto y validación sigue intacto | `tests/jest/m6-tutor.test.ts`, `backend/src/modules/tutor-ia-rag/tests/nvidia.unit.test.ts` e inferencia real (registro, sección 24) |
| **L** Sustitución de Liskov | El caso de uso no debe distinguir qué proveedor responde | `WorkersAiProveedor`, `NvidiaProveedor`, `ProveedorSimulado` y los dobles de prueba | Los cuatro cumplen el mismo contrato `responder(SolicitudIa)` → `RespuestaProveedor`, y sus fallos se expresan como `FalloProveedorIa` (incierto o no) | Se intercambian por configuración sin código condicional en el caso de uso | Las pruebas de integración usan un doble; producción usa NVIDIA o Workers AI con la misma orquestación |
| **I** Segregación de interfaces | Un módulo no debe depender de todo lo que ofrece otro | `FuentesAutorizadasPort` (M3 ← M2, una función), `CarpetasPort` (`validar`, `asignar`, `ubicacion`), `ElementosPort` (M2 ← M3/M6) y `PreparacionPropiaPort` (M6 ← M3) | Puertos mínimos declarados por el módulo que los consume | M3 no ve los repositorios de M2; los dobles de prueba son triviales | `tests/jest/m2-carpetas.test.ts` (repositorio en memoria) y `tests/jest/m3-evaluaciones.test.ts` (puertos en memoria) |
| **D** Inversión de dependencias | La aplicación no debe conocer Drizzle, MongoDB ni Hono | Interfaces en `dominio/` (p. ej. `BancoPreguntasPort`, `IntentosRepositorio` en `dominio/preparacion.ts`) e implementaciones en `infraestructura/` | Los casos de uso reciben los puertos; la raíz de composición (`evaluaciones-aprendizaje.module.ts`, `backend/src/app.ts`) inyecta los adaptadores | Cambiar de motor (Mongo local o Atlas, PostgreSQL local o Neon) solo cambia la configuración. Verificado el 27/11 | ARQ-01: `eslint.config.mjs` (zonas por capa y módulo) y `tests/arquitectura/arq-01.test.ts`, que demuestra que una infracción se detecta |

**Desviaciones documentadas, sin ocultar:**
- Algunos controladores (`presentacion/preparaciones-v1.controller.ts`) convierten tipos con `as never` para adaptar Hono y OpenAPI. Es un compromiso de tipado: no saltan capas.
- `postgres-carpetas.repository.ts` también expone `resumenTemas`, una consulta de lectura que usa el módulo M2 para los títulos de sus propios temas.
- El dominio de M3 importa `ErrorAplicacion` de `shared/`, la utilidad transversal permitida por ARQ-01.

## 13. Redacciones sustituidas (20/11/2026)

Fuente: la [instrucción maestra](../../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md). Se conservan como referencia; no son diseño vigente.

- Productos «Suscripciones estudiantiles, Aulas Live y Studio» y pasarela «por contratar (P-07)».
- M4: `LiveEntitlementPort` con `reserveCredits` y «consumir créditos a M5».
- M5: créditos de Aulas Live y Studio, liquidaciones docentes, `consume-credit.use-case.ts`, `calculate-settlement.use-case.ts`, `CreditLedgerRepository`, `CulqiCheckoutAdapter` y `MercadoPagoCheckoutAdapter`.
- M6: `AiEntitlementPort` y el «registro de cuotas» dentro de M6.
- M7: «no crear un sistema publicitario externo sin decisión posterior».

**Figuras regeneradas (21/11/2026):** `principios-solid-mentelyx.png` (figura 1, desde la nueva fuente `principios-solid-m5.drawio`), `principios-solid-m1.png`, `principios-solid-m2.png`, `principios-solid-m4.png` (`DirectPaymentPort`), `principios-solid-m6.png` (Workers AI) y `principios-solid-m7.png`, exportadas con draw.io Desktop desde sus fuentes corregidas.
