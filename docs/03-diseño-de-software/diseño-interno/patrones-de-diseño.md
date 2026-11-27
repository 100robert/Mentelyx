# Patrones de diseño — Mentelyx

> **Actualización del 25/11/2026:** el contraste de backend confirma implementación parcial de Repository, Adapter, Composition Root, Outbox, controles de concurrencia, libro de recursos y procesamiento RAG. El estado por módulo y la evidencia se registran en la [auditoría](../../_auditoria/EVIDENCIAS.md); esta guía conserva el diseño del producto completo.
>
> **Actualización del 20/11/2026:** aplica la [instrucción maestra](../../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md): recursos de plan, saldo audiovisual, pagos directos con comisión, CulqiOnline, lienzo, biblioteca, BYOK y anuncios recompensados. Se añaden filas a las tablas B y C y a las pruebas; las redacciones sustituidas se resumen al final.

> **Alcance V1:** los patrones describen el producto completo; ADR-093 delimita V1 a aprendizaje y preparación de exámenes. Los mecanismos para módulos pospuestos son diseño futuro, no implementación ni requisito de habilitación inmediata.



## Objetivo

Definir **solo los patrones y mecanismos que resuelven problemas concretos de Mentelyx**, indicando el módulo responsable, el riesgo que controlan, la implementación prevista y las pruebas necesarias. Se documentan por separado las alternativas futuras para no confundir una posibilidad con una decisión adoptada.

**Criterio de selección:** un patrón se incorpora si existe un caso de uso identificado, un riesgo comprobable y una razón por la que una solución más sencilla no es suficiente. **No es obligatorio utilizar todos los patrones GoF.** No se da por hecho que una biblioteca o framework implementa automáticamente estas garantías.

## Contexto

| Elemento | Decisión aplicada a Mentelyx |
|---|---|
| **Estilo arquitectónico** | Arquitectura en capas y monolito modular: **siete módulos de negocio en una API**. |
| **Enfoque interno** | Clean Architecture; los casos de uso dependen de contratos y reglas de negocio, no de proveedores. |
| **Backend** | Hono + TypeScript sobre Cloudflare Workers como objetivo de despliegue. |
| **Persistencia** | PostgreSQL local / Neon PostgreSQL + pgvector en producción; MongoDB local / Atlas en producción. |
| **Integraciones** | Redis, Cloudflare R2, Cloudflare Queues y DLQ, Workers AI (LLM, BGE-M3 y FLUX.2), SFU/WebRTC (RealtimeKit candidato, ADR-046), Bunny Stream condicionado (ADR-014), CulqiOnline (ADR-082), proveedores BYOK y redes publicitarias externas (red por seleccionar). |
| **Prioridades de negocio** | Evitar cobros y consumos duplicados; conservar cupos correctos; respetar permisos, contenidos autorizados y presupuestos de IA. |

**Estados de diseño:** **Definido** = decidido para la funcionalidad indicada; **Condicionado** = se adoptará si una prueba o complejidad lo justifica; **Futuro** = previsto para una funcionalidad todavía no comprometida. Estos estados no describen por sí solos la implementación; algunas aplicaciones parciales ya existen y se distinguen en la auditoría enlazada.

## Patrones seleccionados: prioridad real

### A. Fundamentos de la arquitectura (definidos)

| Patrón / mecanismo | Dónde se usa | Problema que resuelve | Implementación prevista | Archivos orientativos | ADR |
|---|---|---|---|---|---|
| **Repository** | M1 Usuarios, M2 Contenidos, M3 Evaluaciones, M4 Clases, M5 Pagos | Evitar SQL o consultas MongoDB en el dominio y los casos de uso. | Interfaces por módulo + implementaciones PostgreSQL/MongoDB; cada módulo conserva la propiedad de sus datos. | `user.repository.ts`, `postgres-user.repository.ts`, `mongo-content.repository.ts` | 002, 006, 023 |
| **Adapter (Ports & Adapters)** | M5 Pasarela; M6 LLM/embeddings; M4 WebRTC; M2 R2/Bunny | Desacoplar protocolos, SDK y contratos externos. | Interfaces en aplicación y adaptadores TypeScript para cada proveedor. | `payment-gateway.port.ts`, `payment-gateway.adapter.ts`, `llm.adapter.ts` | 002, 005, 016, 019 |
| **Dependency Injection / Composition Root** | Backend completo | Evitar que los casos de uso creen repositorios o clientes externos. | Ensamblaje explícito por módulo en TypeScript; dependencias por constructor o función. | `bootstrap/container.ts`, `build-billing-module.ts` | 001, 002 |
| **Policy / Specification** | M1 permisos, M2 licencias, M4 docencia/reservas, M6 RAG | Proteger recursos de terceros y validar quién puede enseñar, cobrar, indexar o consultar. | Políticas reutilizables, comprobadas en cada caso de uso; middleware no sustituye autorización de negocio. | `can-teach.policy.ts`, `can-access-content.policy.ts`, `rag-access.policy.ts` | 004, 026, 034 |

### B. Integridad y operaciones críticas (definidos y obligatorios antes de operar)

| Patrón / mecanismo | Dónde se usa | Problema que resuelve | Implementación prevista | Archivos orientativos | ADR |
|---|---|---|---|---|---|
| **Idempotent Receiver (Receptor idempotente)** | **M5** webhooks de pago, recursos de plan, recompensas y uso audiovisual; **M2/M6** trabajos de Queues y operaciones de lienzo; reintentos HTTP con efectos | **El mismo evento o solicitud puede recibirse varias veces.** Evita crear dos suscripciones, consumir recursos dos veces, conceder dos veces una recompensa, duplicar cobros internos o procesar dos veces el mismo trabajo. | Identificador estable por operación; `UNIQUE` y tabla `processed_messages` o equivalente en PostgreSQL; registrar deduplicación y efectos locales **en una misma transacción**. El receptor reintentado devuelve el resultado anterior o confirma sin repetir la operación. Para pagos, usar también identificador estable de la **operación de negocio**, porque un proveedor podría emitir eventos distintos sobre el mismo cobro. | `idempotent-receiver.ts`, `processed-message.repository.ts`, `payment-webhook.handler.ts`, `queue-consumer.ts` | **007, 042, 043, 048, 052** |
| **Transactional Outbox** | **M5** confirmación de pagos, recursos, devoluciones y comisiones; **M7** recompensas verificadas; **M4** uso audiovisual; **M2** publicación y retiro de recursos, y cuando una operación SQL deba publicar un trabajo fiable | Evitar confirmar una operación en PostgreSQL y perder el evento si falla la publicación a Cloudflare Queues. | Guardar datos de negocio + evento Outbox **en la misma transacción PostgreSQL**; publicador separado reintenta el envío. El consumidor debe ser idempotente. | `outbox.repository.ts`, `outbox-publisher.ts` | **043, 052** |
| **Unit of Work / Transaction Script** | **M4** cupos, reservas y grupos; **M5** órdenes, recursos, movimientos, saldo audiovisual y comisiones | Evitar escrituras parciales en una misma operación de negocio. | Transacciones ACID en PostgreSQL que incluyan todas las escrituras críticas de esa operación. | `unit-of-work.port.ts`, `postgres-unit-of-work.ts` | **006, 043, 048** |
| **Control de concurrencia (optimista o bloqueo SQL)** | **M4** último cupo; **M5** consumo simultáneo de recursos y de capacidad audiovisual; **M2** operaciones del lienzo por `baseRevision` | Evitar sobreventa o gastar el mismo saldo dos veces bajo solicitudes concurrentes. | Actualizaciones condicionales, versionado de filas o bloqueo SQL cuando proceda; restricciones e índices. Selección concreta según prueba de concurrencia. | `reservation.repository.ts`, `resource-ledger.repository.ts`, `lienzo.repository.ts` | **006, 048, 083** |
| **State Machine / estados explícitos** | **M4** reservas, sesiones e invitaciones; **M5** órdenes, devoluciones, pagos directos y cierres de periodo; **M2** recursos (privado, compartido, público, retirado) | Impedir saltos inválidos y cambios repetidos de estado. | Tabla o función de transiciones permitidas y comprobación atómica del estado anterior. **No exige automáticamente usar clases GoF State.** | `reservation-transitions.ts`, `payment-transitions.ts` | **007, 024, 043** |
| **Ledger (libro de movimientos)** | **M5** recursos de plan por categoría, recompensas, saldo audiovisual y comisiones | Un saldo mutable aislado no explica reservas, consumos, liberaciones, reintegros, concesiones ni devoluciones. | Movimientos inmutables y verificables en PostgreSQL; saldo derivado o materializado de manera consistente; operación única por referencia. | `resource-ledger.repository.ts`, `audiovisual-ledger.repository.ts`, `ledger-entry.ts` | **048, 052, 080, 081** |
| **Versioned Policy / reglas comerciales versionadas** | **M5** planes, precios, recursos, parámetros de Docente Live, comisiones de pasarela por medio y comisión de Mentelyx; **M2** derechos Studio | Impedir que cambios de planes o comisiones alteren contratos y obligaciones históricas. | Versión de política/tarifa asociada a suscripción, reserva, pago directo o cierre de periodo; aplicar reglas vigentes a la operación específica. | `plan-policy.ts`, `pricing-policy.version.ts`, `fee-schedule.ts` | **055, 080, 081, 082** |
| **Envelope Encryption (cifrado en sobre)** | **M6** credenciales BYOK; **M1** fecha de nacimiento | Guardar secretos sin que una filtración de la base los exponga ni que la clave maestra conviva con los datos. | Clave de datos aleatoria por registro cifrada con la clave maestra del secreto del Worker; AES-256-GCM con Web Crypto y datos asociados; rotación por versión; borrado criptográfico al revocar. | `envelope-cipher.port.ts`, `webcrypto-envelope.adapter.ts` | **085, 089** |
| **Reserva y compensación local (orquestación)** | **M5** recursos de plan; **M2/M6** operaciones con efectos externos; **M4** reserva y pago directo | Una operación que combina una transacción SQL con un proveedor externo requiere acciones compensatorias explícitas. | Reservar → ejecutar → confirmar; liberar si no hubo ejecución; mantener la reserva si el resultado es incierto y conciliar; reintegrar una sola vez si la falla es imputable al servicio. Esta coordinación local no es una Saga distribuida. | `reservar-recurso.use-case.ts`, `liberar-recurso.use-case.ts`, `reintegrar-recurso.use-case.ts` | **043, 080, 081** |
| **Server-Side Verification (verificación en servidor)** | **M7** anuncios recompensados; **M5** pagos de CulqiOnline | Un evento del navegador o un webhook pueden ser falsificados o repetidos. | *Nonce* de un solo uso por oferta y verificación servidor a servidor de la red; para pagos, consulta del estado real del cargo antes de aplicar efectos. | `verificar-recompensa.use-case.ts`, `culqi-webhook.adapter.ts` | **082, 086** |

**Diferencia importante:** *Idempotent Receiver* es el nombre del patrón general. Cuando se aplica específicamente a un consumidor de mensajería también se le llama **Idempotent Consumer**. En Mentelyx debe abarcar **webhooks, endpoints reintentables y consumidores de Cloudflare Queues**; no son tres soluciones desconectadas.

### C. Procesamiento, rendimiento y servicios externos (definidos o condicionados)

| Patrón / mecanismo | Dónde se usa | Problema que resuelve | Implementación prevista | Estado | ADR |
|---|---|---|---|---|---|
| **Retry con backoff + Dead Letter Queue** | Workers consumidores de M2/M6; publicaciones asíncronas y notificaciones | Fallos transitorios sin bucles infinitos ni pérdida silenciosa de trabajos. | Reintentos acotados, diferenciación de errores permanentes y DLQ observable; combinar con Idempotent Receiver. | **Definido** | 008, 042, 054 |
| **Cache-Aside** | Lecturas públicas de M2 y consultas repetidas de M3 | Reducir latencia y carga sobre bases de datos. | Consultar Redis; ante fallo de caché, consultar fuente autorizada con límites de carga; TTL, invalidación y claves segregadas por ámbito. | **Definido** para consultas donde se mida beneficio | 012, 054 |
| **Timeout + Circuit Breaker** | M6 IA; M4 video; M5 pasarela; correo | Evitar que fallos del proveedor saturen la API o generen esperas indefinidas. | Tiempo máximo por operación; corte temporal y recuperación, si el runtime y las métricas lo justifican. Reintentar **solo** operaciones seguras o idempotentes. | **Timeout definido; Circuit Breaker condicionado** | 022, 054 |
| **Pipeline / Pipes and Filters** | M2 → M6: procesamiento documental para RAG | Separar extracción, limpieza, fragmentación, embeddings e indexación para repetir etapas y rastrear fallos. | Trabajos versionados y etapas acotadas mediante Queue/Worker; permisos y licencia antes de indexar; deduplicación por documento y versión. | **Definido** para indexación RAG | 019, 026, 042 |
| **Strategy (cuando haya alternativas reales)** | M3 recomendaciones deterministas; M5 cálculo por producto y comisión por medio de pago; M6 modalidad de fuentes y ruta de modelo | Varias reglas distintas no deben concentrarse en condicionales complejos. | Interfaz tipada + estrategias para políticas verdaderamente diferentes; si una tabla de reglas basta, no crear jerarquías de clases. | **Condicionado** por complejidad | 018, 047, 050, 053 |
| **Decorator (caché de lectura)** | M2 catálogo público, cuando haya un repositorio con búsquedas repetidas | Añadir caché sin incluir Redis en la lógica del caso de uso. | `CachedCourseRepository` implementa el mismo contrato que `CourseRepository` y delega al repositorio real; invalidación/TTL definidos. Es una **forma de aplicar Cache-Aside**, no otra caché independiente. | **Condicionado** a medición de latencia/carga | 012, 054 |
| **Audit Trail (registro de auditoría)** | M1 verificaciones y permisos; M5 movimientos y conciliación; M4 incidentes de clase | Reconstruir quién autorizó o modificó acciones sensibles, sin depender de logs efímeros. | Eventos de auditoría persistentes con actor, operación, resultado, fecha y correlación; acceso restringido y política de retención. No duplicar datos personales innecesarios. | **Definido** para acciones sensibles | 004, 043, 048 |
| **Operation Log + concurrencia optimista (lienzo)** | **M2** lienzos | Ediciones desde varios dispositivos y contribuciones de la IA sin perder trazos del usuario. | Operaciones con `opId` y `baseRevision`; `409 CONFLICTO_LIENZO` devuelve el estado del servidor; capas separadas; deshacer y rehacer como operaciones. | **Definido**; prototipo pendiente | 083 |
| **Search-before-generate (reutilizar antes de generar)** | **M6** con la biblioteca de **M2** | Generar de nuevo lo que ya existe aumenta costo y riesgo de error. | Búsqueda autorizada → pertinencia → reutilización o adaptación paramétrica → generación solo si es necesaria (BR-02). | **Definido** | 084 |

## Cómo funciona el Receptor idempotente en Mentelyx

**Escenario A — pago:** una pasarela envía dos veces el mismo evento `pago_confirmado`.

1. El controlador verifica la firma del webhook y construye un identificador estable del evento **dentro del ámbito del proveedor**.
2. `ConfirmarPagoUseCase` inicia una transacción PostgreSQL y comprueba/registra la clave de deduplicación mediante una operación respaldada por `UNIQUE`.
3. Si el evento ya quedó procesado, devuelve éxito sin volver a acreditar una suscripción ni generar movimientos.
4. Si es nuevo, valida la transición de estado, actualiza orden/suscripción, inicia los recursos del periodo o el saldo audiovisual aplicables y escribe el evento Outbox en la **misma transacción**.
5. Al confirmar la transacción, una publicación posterior a Queues puede reintentarse. El receptor del evento también es idempotente.

**Escenario B — Queues:** un mensaje `indexar_documento` se vuelve a entregar después de un fallo. El Worker comprueba la clave `documentoId + version + tipoTrabajo`; si esa versión ya fue indexada correctamente, no vuelve a crear fragmentos ni embeddings duplicados. Si el proceso quedó incompleto, reanuda o sustituye los resultados de forma segura.

**Reglas de implementación importantes:**

- Un `SELECT` seguido de `INSERT` sin restricción `UNIQUE` **no garantiza** idempotencia con dos ejecuciones concurrentes.
- El registro de deduplicación **no** debe depender únicamente de Redis o memoria local de Workers.
- Dos eventos distintos del mismo pago (por ejemplo, confirmación y posterior reembolso) **no** deben confundirse con un duplicado. Usar identificador de evento, tipo y reglas de transición; además, aplicar restricciones únicas de negocio sobre la acreditación o movimiento para resistir eventos distintos con el mismo efecto.
- El mismo `idempotencyKey` debe reutilizarse en los reintentos de una operación hacia la pasarela cuando el proveedor lo soporte; la protección interna no garantiza por sí sola que no existan dos cargos externos.
- Para efectos externos como enviar correos, combinar deduplicación local con clave idempotente del proveedor cuando exista o con un registro de entrega recuperable.

**Ejemplo conceptual de la regla:** «Procesar el mismo evento una o diez veces produce **un solo movimiento** de recursos, una sola activación de suscripción y un único evento lógico de confirmación».

## Decisiones críticas que deben quedar especificadas antes de programar

| Caso | Decisión concreta | Qué **no** debemos asumir |
|---|---|---|
| **Webhook de pago** | Deducción persistente por evento **y** protección de la operación lógica de acreditación; verificación de firma, transición válida y transacción local. | Que recibir un HTTP 200 signifique que la pasarela cobrará una sola vez; la idempotencia externa depende de su API. |
| **Compra de plan / renovación** | `idempotencyKey` estable por intento lógico; movimientos únicos por operación; registrar la versión de política comercial que corresponde a la compra. | Que Redis o una comprobación previa de saldo impidan por sí solos descuentos concurrentes. |
| **Reserva del último cupo** | Actualización condicional/transacción SQL y restricción de unicidad adecuada para estudiante + sesión; separar reserva provisional y confirmación según contrato. | Que consultar primero el aforo y guardar después sea suficiente en concurrencia. |
| **Trabajo de indexación RAG** | Clave documento + versión + etapa; permisos de contenido antes de recuperar/indexar; resultados reintentables y deduplicables. | Que ejecutar dos veces el Worker produzca siempre el mismo costo o embeddings sin duplicados. |
| **Generación Studio con IA** | Presupuesto de consumo, registro de trabajo y resultado, límite de reintentos y política para fallos parciales; no descontar dos veces el mismo trabajo. | Que todas las generaciones tengan costo fijo o que el timeout signifique que el proveedor no procesó nada. |
| **Acciones sensibles** | Auditoría persistente para validación docente, cambios de permisos, reembolsos, movimientos y anulaciones. | Que logs del runtime sustituyan una evidencia de negocio o que todos los eventos deban retener datos personales completos. |

**Separación importante:** *Idempotent Receiver* garantiza que los **efectos bajo nuestro control** no se apliquen dos veces; no puede garantizar por sí solo que un proveedor externo no haya ejecutado dos cargos. Para esa incertidumbre se necesitan claves idempotentes del proveedor (si están disponibles), consultas de estado y conciliación.

## Matriz de decisiones por módulo

| Módulo | Patrones realmente prioritarios | Riesgo que se controla |
|---|---|---|
| **M1 Usuarios y Administración** | Repository, Adapter, Dependency Injection, Policy/Specification y Audit Trail | Permisos erróneos, suplantación, falsos títulos y acceso a cuentas ajenas. |
| **M2 Cursos y Contenidos / Studio** | Repository documental, Adapter, Policy, Pipeline RAG, Idempotent Receiver en trabajos, Operation Log del lienzo, State Machine de recursos, Cache-Aside/Decorator selectivo | Archivos privados, duplicación de indexación, inconsistencias entre versiones y caché. |
| **M3 Evaluaciones y Aprendizaje** | Repository, Policy y Strategy **solo si hay varios algoritmos** | Resultados correctos, historial y reglas reproducibles. |
| **M4 Docentes y Clases** | Repository, Unit of Work, control de concurrencia, State Machine, Policy, Adapter audiovisual y Audit Trail de incidentes | Cupos duplicados, reservas inconsistentes, accesos no autorizados y estados inválidos. |
| **M5 Suscripciones y Pagos** | **Idempotent Receiver, Transactional Outbox, Unit of Work, Ledger, control de concurrencia, State Machine**, Repository, Adapter y Audit Trail | Cobros duplicados, doble consumo de recursos, recompensas concedidas dos veces, devoluciones incorrectas y movimientos perdidos. |
| **M6 Tutor IA y RAG** | Adapter LLM/embeddings/BYOK, Policy de modalidad, Pipeline RAG, Search-before-generate, Envelope Encryption, Idempotent Receiver en trabajos, límites de tiempo | Fugas de documentos, costos no controlados, indexaciones repetidas y dependencia del proveedor IA. |
| **M7 Publicidad y Patrocinios** | Policy/Specification, Repository, Server-Side Verification, Transactional Outbox; Adapter de la red seleccionada | Campañas indebidas, datos de menores expuestos o autorizaciones incorrectas. |

## Pruebas obligatorias antes de habilitar funcionalidades críticas

| Escenario de prueba | Criterio de aceptación | Patrón principal |
|---|---|---|
| Enviar el mismo webhook 10 veces, incluso en paralelo | Una sola transición válida y un único movimiento/activación; las repeticiones reciben respuesta segura. | **Idempotent Receiver + UNIQUE + Unit of Work** |
| Enviar dos eventos de pago diferentes que intenten acreditar la misma compra | La compra se acredita una sola vez por su identificador lógico; no se confunden confirmaciones y reembolsos. | Idempotent Receiver + Ledger + estados |
| Reintentar dos veces la creación de un cobro | La misma operación lógica no solicita otro cargo cuando el proveedor soporta clave idempotente; reconciliar si hay estado incierto. | Adapter + Idempotent Receiver |
| Reservar simultáneamente el último cupo | Solo una reserva se confirma; el cupo nunca baja de cero. | Control de concurrencia + Unit of Work |
| Reservar dos veces el mismo recurso de plan o la misma capacidad audiovisual | Un único movimiento por `operationKey`; saldo consistente, sin consumo duplicado. | Ledger + Idempotent Receiver |
| Recibir dos veces la verificación de una recompensa | Una sola concesión en `resource_grants`. | Server-Side Verification + Idempotent Receiver |
| Editar el mismo lienzo desde dos dispositivos | No se pierden operaciones del usuario; la IA no modifica su capa. | Operation Log + concurrencia optimista |
| Revocar una credencial BYOK | La clave deja de poder descifrarse desde el commit; ningún log la contiene. | Envelope Encryption |
| Fallar después de confirmar SQL, antes de publicar en Queue | El evento queda pendiente en Outbox y puede publicarse después. | Transactional Outbox |
| Entregar el mismo mensaje de Queue varias veces | No se duplican notificaciones críticas, fragmentos, recursos ni cambios de estado. | Idempotent Receiver |
| Generación Studio reintentada tras un timeout | Se conserva trazabilidad del trabajo y del gasto real, sin descontar dos veces; se concilia si el proveedor ejecutó la petición. | Idempotent Receiver + Policy de presupuesto |
| Cambiar un permiso docente o aprobar un reembolso | Queda evidencia persistente de actor, acción y resultado, sin exponer más datos de los necesarios. | Audit Trail |
| Intentar acceder a contenido RAG de otro usuario | La recuperación y la respuesta excluyen fragmentos no autorizados. | Policy + Pipeline RAG |
| Fallo de Redis o proveedor IA | El sistema degrada funciones permitidas, sin aceptar operaciones críticas inseguras ni consumir recursos por trabajos fallidos; ante la falla común de Workers AI, herramientas deterministas y biblioteca. | Cache-Aside + Timeout/Policy |

## Patrones previstos para funciones futuras (no adoptados todavía)

| Patrón | Caso de uso que justificaría su adopción | Condición concreta |
|---|---|---|
| **Command + Memento** | Deshacer/rehacer operaciones del editor de presentaciones o futuro modelador 3D de Mentelyx Studio. | Que exista edición reversible con historial, y se definan memoria, persistencia y límites. |
| **Composite** | Jerarquías de grupos, transformaciones y objetos en escenas 3D editables. | Que Studio incorpore un editor de escenas, no solo un visor 3D. |
| **Factory / Builder** | Materiales educativos con múltiples estructuras o generación compleja de actividades. | Que la variedad real de objetos o pasos justifique una construcción especializada. |
| **Facade entre módulos** | Publicar contratos de aplicación simplificados para M4↔M5 o M6↔M2. | Que los consumidores necesiten coordinar varias llamadas; un puerto público sencillo basta mientras tanto. |
| **CQRS ligero / proyecciones** | Informes académicos o búsquedas complejas sin cargar escrituras críticas. | Medidas de rendimiento que justifiquen separar modelos de lectura y escritura. |
| **Saga / compensaciones** | Operaciones que crucen proveedores o almacenes y requieran reversiones de pasos. | Necesidad real de un proceso distribuido; no reemplaza las transacciones locales. |
| **Bulkhead** | Aislar generación IA pesada y video de solicitudes esenciales. | Evidencia de saturación compartida o necesidad de separar cuotas/capacidad. |

**Singleton:** se **evalúa, pero no se adopta como patrón general**. Cloudflare Workers puede reutilizar o crear varios *isolates*; un objeto de módulo no representa una instancia global única. La configuración inmutable o servicios sin estado pueden reutilizarse dentro de un ámbito controlado con Dependency Injection. **Nunca** se guardarán usuarios, sesiones, saldos, locks ni datos de una solicitud en un Singleton global.

**Patrones GoF no incluidos sin caso de uso:** Abstract Factory, Bridge, Flyweight, Interpreter, Iterator especializado, Mediator, Prototype, Proxy, Template Method y Visitor. No son requisitos implícitos. Se documentarán únicamente si aparece una necesidad que los justifique.

**Studio 3D:** Tinkercad permanece como referencia de experiencia de usuario; no es una decisión de integración ni obliga a introducir patrones de escenas antes de diseñar el editor.

## Relación con las decisiones arquitectónicas

| Decisiones existentes | Patrones derivados |
|---|---|
| **ADR-001, ADR-002 y ADR-023** | Repository, Adapter, Dependency Injection y contratos por módulo. |
| **ADR-004, ADR-026 y ADR-034** | Policy / Specification y autorización de recursos. |
| **ADR-007, ADR-042 y ADR-043** | **Idempotent Receiver**, Transactional Outbox, Retry/DLQ y persistencia transaccional. |
| **ADR-027, ADR-048 y ADR-052** | Ledger, Unit of Work, control de concurrencia e idempotencia de recursos, saldo audiovisual y comisiones (las liquidaciones por créditos de ADR-027 quedan sustituidas por ADR-081). |
| **ADR-080 a ADR-086** | Reserva y compensación de recursos, comisiones versionadas, verificación en servidor de pagos y recompensas, Operation Log del lienzo, Search-before-generate y Envelope Encryption. |
| **ADR-018, ADR-019 y ADR-026** | Strategy condicionado, Pipeline RAG y validación de ACL. |
| **ADR-012 y ADR-054** | Cache-Aside, posible Decorator de caché, timeouts, degradación segura y Circuit Breaker cuando corresponda. |
| **ADR-050 y ADR-053** | Políticas de costos versionadas y medición de consumo IA en Studio. |

## Estado de aprobación y alcance

Estos patrones son **decisiones de diseño propuestas** para la fase previa al desarrollo. Los mecanismos de integridad de pagos, reservas, recursos y recompensas son **condiciones de salida obligatorias** antes de activar dichas funcionalidades para clientes reales. Los patrones marcados como condicionados no requieren crear clases adicionales sin evidencia de necesidad. En la práctica, *Repository*, *Adapter* o *Policy* pueden materializarse mediante interfaces y funciones TypeScript sencillas.

Los archivos nombrados son convenciones orientativas; el diseño final de carpetas debe seguir los límites de los siete módulos y las interfaces del documento de Clean Architecture.

## Beneficios

- **Integridad:** los reintentos de solicitudes y mensajes no duplican operaciones financieras, reservas ni trabajos.
- **Mantenibilidad:** contratos explícitos protegen los casos de uso de cambios de Hono, bases de datos o proveedores.
- **Seguridad:** las políticas de autorización se comprueban en las operaciones de negocio y las decisiones sensibles dejan auditoría verificable.
- **Rendimiento controlado:** la caché y el procesamiento asíncrono se utilizan donde aportan valor, sin sustituir la persistencia crítica.
- **Evolución gradual:** los patrones para edición avanzada, 3D y análisis quedan previstos, pero no contaminan el MVP.

## Referencias técnicas

- Enterprise Integration Patterns: [Idempotent Receiver](https://www.enterpriseintegrationpatterns.com/patterns/messaging/IdempotentReceiver.html).
- Cloudflare: [Queues — Delivery guarantees](https://developers.cloudflare.com/queues/reference/delivery-guarantees/) (entrega *at least once*).
- Microservices.io: [Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html).
- Cloudflare: [Workers Best Practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/) (estado global y aislamiento entre solicitudes).

> **Conclusión:** no utilizaremos patrones para llenar una lista. Adoptaremos los que protegen problemas reales de Mentelyx, comenzando por **Idempotent Receiver, Transactional Outbox, Unit of Work, control de concurrencia, Ledger, Adapter, Repository y Policy**; añadimos auditoría verificable para acciones sensibles y Decorator únicamente donde la caché aporte beneficios medibles. Los demás quedan condicionados a funciones o pruebas concretas.

## Patrones implementados: evidencia en el código (Sprint 2, 27/11/2026)

Esta tabla recoge solo los patrones presentes en el código actual; los «previstos» de la sección anterior siguen sin adoptarse.

| Patrón | Dónde (archivo y componente) | Qué resuelve | Evidencia |
|---|---|---|---|
| **Adapter** (puertos y adaptadores) | `tutor-ia-rag/infraestructura/nvidia.adapter.ts` y `workers-ai.adapter.ts` (`ProveedorIaPort`); `evaluaciones-aprendizaje/infraestructura/mongo-bancos.repository.ts` (`BancoPreguntasPort`); `cursos-contenidos/infraestructura/almacen-objetos.adapters.ts` (R2 o memoria) | Aísla los proveedores externos (NVIDIA, Workers AI, MongoDB, R2) del dominio | Pruebas Jest de los adaptadores; ADR-094 |
| **Repository** | `postgres-preparacion.repository.ts`, `postgres-intentos.repository.ts`, `postgres-carpetas.repository.ts`, `mongo-conversaciones.repository.ts` | Encapsula SQL y Mongo; cada consulta filtra por el propietario | Integración con PostgreSQL y MongoDB reales (62/62) |
| **Composition Root / Factory** | `backend/src/app.ts` (`crearApp`, `configIa`) y `crear*Module` de cada módulo | Ensambla los módulos y resuelve los enlaces tardíos M2 ↔ M3 ↔ M6 sin imports entre módulos | ARQ-01 y la prueba de contrato OpenAPI, que construye la app sin bases |
| **Strategy** | `configIa` (simulado, Workers AI, NVIDIA o deshabilitado) y `parametrosModelo` en `nvidia.adapter.ts` | Elige el comportamiento del proveedor por entorno o por familia de modelo | `estructura-y-proveedor.unit.test.ts` y `nvidia.unit.test.ts` |
| **Idempotency Key / Idempotent Receiver** | `operation_key` y `request_hash` en `learning_goals`, `evaluation_attempts`, `study_cards`, `card_reviews`, `folders`, `question_banks` e inbox de M6 | Un reintento no crea duplicados ni aplica dos veces un efecto | Pruebas P0 de M5 (12/12), entregas concurrentes en el Flujo B y Jest M3 |
| **Transactional Outbox** | `backend/src/shared/bd/mensajeria.ts` y `relay.ts`, con el evento `FuenteRegistrada` de M2 a M6 | Publica eventos en la misma transacción que el cambio de estado | Integración (indexación por evento) y prueba de humo E2E |
| **Optimistic Concurrency (CAS)** | Estado de la sesión (`If-Match`, versión en `mongo-conversaciones.repository.ts`); calificación (`update … where status = 'EN_CURSO'`) | Evita pisar cambios entre pestañas y calificar dos veces | 412 `CONFLICTO_VERSION` y entregas concurrentes con un solo resultado |
| **DTO / proyección** | `proyectar()` en `dominio/evaluacion.ts` | Entrega preguntas sin solución antes del momento permitido | Jest M3 y E2E (banco sin `correcta`) |
| **Middleware en cadena** | `correlacion` → `verificarOrigen` → `csrf.verificar` en `backend/src/app.ts` | Controles transversales antes de cualquier caso de uso | `tests/jest/seguridad-sesion.test.ts` (Origin, CSRF y sesión) |
| **Facade (API pública del módulo)** | `backend/src/modules/*/index.ts` | Única superficie que otros módulos pueden importar | ARQ-01 (`import-x/no-restricted-paths`) |

## Redacciones sustituidas (20/11/2026)

Fuente: la [instrucción maestra](../../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md). Se conservan como referencia; no son diseño vigente: pasarela «por seleccionar»; Ledger de «créditos Aulas Live / Studio y liquidaciones» con `credit-ledger.repository.ts`; prueba «consumir dos veces la misma cantidad de créditos Live»; «compra de plan / créditos». Las figuras `patrones-diseno-m5` (CulqiOnline) y `patrones-diseno-transversales` (`DirectPaymentPort`) se regeneraron el 21/11/2026 desde sus fuentes corregidas.
