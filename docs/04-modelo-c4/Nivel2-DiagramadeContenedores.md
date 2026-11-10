

> **Proyecto:** Mentelyx  
> **Modelo:** C4 · Nivel 2 de 4 · **Versión:** 2.0  
> **Estado:** Diseño arquitectónico previo a la implementación

---

## 1. Objetivo

Abrir la caja «Mentelyx» del nivel 1 y mostrar los **contenedores que conforman el sistema**: aplicaciones, procesos ejecutables y almacenes de datos, indicando sus tecnologías, responsabilidades y mecanismos de comunicación.

Esta vista presenta la estructura técnica general de Mentelyx, una plataforma educativa virtual que integra aprendizaje, evaluaciones, preparación académica, tutorías, clases virtuales, Mentelyx Studio y asistencia pedagógica mediante inteligencia artificial.

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿Qué aplicaciones y almacenes de datos componen Mentelyx, qué tecnologías utilizan y cómo se comunican? |
| Audiencia | Arquitectos de software, desarrolladores y responsables de operaciones |
| Qué es un contenedor | Una aplicación ejecutable, proceso o almacén de datos con un límite propio de ejecución o almacenamiento. No equivale necesariamente a un contenedor Docker. |
| Estilo arquitectónico | Monolito modular para el backend principal, con frontend separado y procesamiento asíncrono auxiliar |
| Enfoque de diseño | Clean Architecture dentro de los módulos del backend |
| Qué **no** muestra | Clases, métodos, interfaces internas, controladores específicos ni la implementación detallada de los siete módulos |
| Nivel anterior | `Nivel1-DiagramadeContextodelSistema.md` |
| Siguiente nivel | `Nivel3-DiagramadeComponentes.md` |

---

## 2. Diagrama

![Diagrama de contenedores de Mentelyx](../img/fuentes-svg/nivel2-contenedores.svg)

> Archivo editable: [nivel2-contenedores.drawio](../img/fuente_drawio/nivel2-contenedores.drawio)

**Figura 2.** Diagrama de contenedores del sistema Mentelyx mediante el modelo C4, nivel 2.

El diagrama debe representar el límite del sistema **Mentelyx** y, dentro de él, los contenedores de aplicación, procesamiento y almacenamiento.

Los actores Estudiante, Docente y Superadministrador se mantienen fuera del límite del sistema, así como las plataformas externas de pagos, videoconferencia, streaming, inteligencia artificial y notificaciones.

No se representan los siete módulos del backend como contenedores independientes, porque forman parte de una misma aplicación lógica y unidad principal de despliegue.

---

## 3. Contenedores

| Contenedor | Tecnología | Responsabilidad | Datos que maneja |
|---|---|---|---|
| **Aplicación Web/PWA Mentelyx** | Next.js, React y TypeScript | Proporciona la interfaz de aprendizaje, panel docente, Mentelyx Studio y administración. Se utiliza desde el navegador y podrá instalarse como PWA en dispositivos compatibles. Su modalidad de entrega estática o dinámica debe validarse. | Estado de interfaz, información consultada y borradores locales pendientes de sincronización. |
| **API Backend Mentelyx** | TypeScript + Hono, con Cloudflare Workers como entorno objetivo | Expone la API REST, autentica solicitudes, comprueba autorizaciones, ejecuta reglas de negocio y coordina integraciones. Es un **monolito modular de siete módulos lógicos**, no siete microservicios. | No constituye el almacén permanente de información. Consulta y modifica datos mediante adaptadores y contratos. |
| **Base de datos transaccional** | PostgreSQL + pgvector; PostgreSQL local en desarrollo y Neon como proveedor objetivo de producción | Conserva datos relacionales, integridad de operaciones y registros oficiales. Permite transacciones para pagos, reservas, permisos y resultados. pgvector ofrece búsqueda vectorial para fuentes RAG autorizadas. | Cuentas, perfiles, autorizaciones, catálogo referencial, resultados, progreso confirmado, suscripciones, reservas, créditos, pagos, liquidaciones, licencias y vectores autorizados. |
| **Base de datos documental** | MongoDB local en desarrollo y MongoDB Atlas como proveedor objetivo de producción | Conserva estructuras pedagógicas y documentos educativos flexibles, versionados y editables. | Lecciones estructuradas, actividades interactivas, preguntas heterogéneas y documentos de Mentelyx Studio. |
| **Caché temporal** | Redis compatible; proveedor administrado pendiente de selección | Reduce lecturas repetidas y permite gestionar información temporal, contadores y determinados límites de solicitudes. | Copias temporales de consultas, claves de caché y contadores con vencimiento. No almacena saldos ni pagos oficiales. |
| **Almacenamiento de objetos** | Cloudflare R2 | Almacena archivos binarios y recursos educativos que no deben guardarse directamente en las bases de datos operacionales. | PDF, imágenes, archivos adjuntos, documentos originales y recursos educativos. |
| **Cola de trabajos** | Cloudflare Queues | Recibe tareas y eventos para ejecución diferida, desacoplando operaciones que no requieren completar su procesamiento dentro de una solicitud HTTP. | Mensajes de procesamiento documental, indexación, notificaciones y referencias de trabajos pendientes. |
| **Procesador de tareas asíncronas** | Cloudflare Workers consumidores | Procesa los trabajos recibidos por la cola, aplica reintentos controlados y utiliza adaptadores para acceder a los recursos necesarios. | Referencias de documentos, estados de trabajo y resultados de procesamiento; la información duradera se guarda en los almacenes correspondientes. |

**Aclaraciones arquitectónicas:**

- **PostgreSQL y MongoDB son almacenes diferentes**, con responsabilidades diferenciadas. No debe suponerse una transacción ACID distribuida entre ambos.
- **pgvector no es otro contenedor**: es una extensión del contenedor PostgreSQL.
- **Better Auth es una biblioteca candidata de autenticación integrada**, no un servicio o contenedor adicional.
- **Redis no sustituye PostgreSQL**, especialmente para pagos, cupos, créditos y calificaciones.
- **Cloudflare Queues no es un octavo módulo de negocio**. Es infraestructura de mensajería, atendida por uno o varios procesos consumidores.
- **Neon, Atlas y los servicios administrados están previstos para producción**, sin que su representación implique contratación o despliegue ya realizados.

### Sistemas externos relacionados

Se conservan fuera del límite de Mentelyx los sistemas identificados en el nivel 1:

| Sistema externo | Responsabilidad |
|---|---|
| **Pasarela de pagos** | Procesamiento de cobros y comunicación de sus resultados |
| **Servicio de videoconferencia** | Comunicación interactiva en tiempo real mediante un proveedor audiovisual |
| **Plataforma de videos grabados** | Procesamiento y reproducción de videos educativos |
| **Proveedor de inteligencia artificial** | Inferencia de modelos, asistencia pedagógica y capacidades generativas autorizadas |
| **Servicio de notificaciones** | Entrega de correos u otras comunicaciones según los canales que se definan |

---

## 4. Relaciones

| Origen | Destino | Descripción | Protocolo |
|---|---|---|---|
| Estudiante | Aplicación Web/PWA | Consulta contenidos, realiza evaluaciones, utiliza el Tutor IA y accede a clases autorizadas. | HTTPS |
| Docente | Aplicación Web/PWA | Gestiona su perfil, prepara materiales, programa clases y consulta sus operaciones. | HTTPS |
| Superadministrador | Aplicación Web/PWA | Administra usuarios, contenidos, permisos, planes e incidencias. | HTTPS |
| Aplicación Web/PWA | API Backend Mentelyx | Solicita operaciones, consulta información y envía modificaciones autorizadas. | HTTPS/JSON · REST |
| API Backend | PostgreSQL | Lee y escribe información transaccional, comprueba permisos y confirma operaciones críticas. | Conexión SQL segura mediante driver o conector compatible |
| API Backend | MongoDB | Consulta y administra documentos pedagógicos estructurados y versionados. | Conexión segura mediante driver o interfaz compatible |
| API Backend | Redis | Consulta y actualiza datos temporales y contadores. | Protocolo o interfaz Redis compatible, con transporte seguro |
| API Backend | Cloudflare R2 | Registra, obtiene y administra objetos educativos. | Binding del runtime de Cloudflare o API compatible cuando corresponda |
| API Backend | Cloudflare Queues | Envía mensajes y referencias de trabajos pendientes. | Binding de Cloudflare Queues |
| Cloudflare Queues | Worker consumidor | Entrega trabajos para procesamiento asíncrono. | Activación gestionada por Cloudflare |
| Worker consumidor | Almacenes autorizados | Procesa documentos y registra resultados mediante adaptadores. | Según el servicio de destino |
| API Backend | Pasarela de pagos | Solicita operaciones económicas y recibe sus confirmaciones verificables. | HTTPS/API y webhooks verificados; contrato pendiente |
| API Backend | Servicio de videoconferencia | Crea salas, gestiona sesiones y proporciona credenciales temporales a participantes autorizados. | HTTPS/API del proveedor |
| Aplicación Web/PWA | Servicio de videoconferencia | Transmite y recibe audio y video después de obtener autorización de Mentelyx. | WebRTC y señalización del proveedor |
| API Backend | Plataforma de videos grabados | Gestiona videos y autoriza la reproducción de contenidos protegidos. | HTTPS/API del proveedor |
| Aplicación Web/PWA | Plataforma de videos grabados | Reproduce contenido audiovisual autorizado. | HTTPS y protocolo de streaming del proveedor |
| API Backend | Proveedor de inteligencia artificial | Solicita inferencia y generación conforme a los permisos, cuotas y fuentes autorizadas. | HTTPS/API |
| Worker consumidor | Servicio de notificaciones | Solicita la entrega asíncrona de comunicaciones. | Integración por definir |

**Consideraciones sobre las relaciones:**

1. La **API Backend** constituye el punto de control de las reglas de negocio, autenticación y autorización de Mentelyx.
2. El tráfico audiovisual de las clases no debe pasar por Hono como si el backend fuera un servidor de video.
3. La aplicación web puede comunicarse directamente con proveedores audiovisuales mediante credenciales temporales previamente autorizadas.
4. Los archivos pueden utilizar mecanismos de carga directa con permisos temporales cuando el diseño de R2 lo justifique.
5. Los mensajes de la cola deben ser procesados de forma idempotente, porque pueden producirse reintentos y entregas repetidas.
6. Las operaciones críticas se consideran confirmadas únicamente después de su persistencia correcta.

---

## 5. Decisiones arquitectónicas reflejadas

| Decisión | Alternativa descartada o diferida | Motivo |
|---|---|---|
| **Monolito modular como backend principal** | Microservicios independientes desde el inicio | Reduce complejidad de despliegue, operación e integración. Los siete módulos mantienen límites lógicos propios. |
| **Frontend Web/PWA separado de la API** | Aplicación móvil nativa independiente en la primera versión | Permite utilizar la plataforma desde dispositivos compatibles con un solo canal principal de desarrollo. |
| **Cloudflare Workers + Hono como objetivo de backend** | VPS administrada manualmente como infraestructura inicial obligatoria | Se busca reducir las tareas operativas y aprovechar una plataforma administrada, condicionada a pruebas de compatibilidad y costo. |
| **PostgreSQL como fuente de verdad transaccional** | Utilizar Redis o MongoDB como único registro de pagos y reservas | Las operaciones económicas, autorizaciones y resultados confirmados requieren transacciones y restricciones de integridad. |
| **MongoDB para documentos pedagógicos flexibles** | Almacenar todas las estructuras pedagógicas en tablas relacionales rígidas | Permite modelar materiales educativos versionados con estructuras variables. Se deben gestionar referencias coherentes entre almacenes. |
| **Redis para información temporal** | Usarlo como almacenamiento definitivo | Una caché puede expirar, invalidarse o perder datos; no debe almacenar la única copia de información crítica. |
| **R2 para archivos educativos** | Guardar archivos binarios directamente en PostgreSQL o MongoDB | Se separan los archivos de gran tamaño de los datos operacionales. |
| **Queues y Workers auxiliares para procesamiento diferido** | Ejecutar extracción de documentos, indexación y notificaciones dentro de cada solicitud HTTP | Evita bloquear peticiones y permite reintentos y recuperación de trabajos. |
| **Proveedores especializados para servicios audiovisuales** | Desarrollar un servidor WebRTC/SFU y plataforma de streaming propios desde el inicio | Reduce la complejidad técnica y operativa de transmitir audio y video. |
| **Clean Architecture dentro de los módulos** | Acoplar las reglas de negocio directamente a frameworks, SDK y bases de datos | Facilita las pruebas y permite sustituir implementaciones técnicas sin modificar innecesariamente el dominio. |
| **Autenticación integrada y autorización propia** | Confiar exclusivamente en controles de la interfaz | Las sesiones y los permisos sobre recursos deben comprobarse en el backend. |

Estas decisiones son de **arquitectura objetivo**. No representan funcionalidades ya desarrolladas ni prestaciones medidas en producción.

---

## 6. Seguridad entre contenedores

| Comunicación | Medida |
|---|---|
| Navegador → Aplicación Web/PWA | HTTPS, recursos servidos de forma segura y controles apropiados para una PWA pública. |
| Aplicación Web/PWA → API Backend | HTTPS, autenticación mediante sesiones seguras y verificación de permisos en backend. El uso de cookies seguras y HttpOnly se priorizará según la integración definitiva. |
| API Backend → PostgreSQL | Conexión cifrada, credenciales privadas, permisos mínimos y operaciones críticas realizadas mediante transacciones. |
| API Backend → MongoDB | Autenticación del cliente, transporte cifrado y controles sobre documentos y versiones. |
| API Backend → Redis | Acceso autenticado y protegido; los datos temporales no sustituyen las verificaciones de seguridad ni la información oficial. |
| API Backend → R2 | Acceso mediante credenciales o bindings del runtime; autorización previa para archivos privados y mecanismos temporales para cargas o descargas directas cuando corresponda. |
| API Backend → Cloudflare Queues | Publicación de mensajes mediante bindings autorizados; datos sensibles mínimos y referencias en lugar de documentos completos cuando sea viable. |
| Queues → Worker consumidor | Validación de mensajes, reintentos acotados, operaciones idempotentes y tratamiento de fallos mediante cola de mensajes fallidos (DLQ). |
| API Backend → Pasarela de pagos | Credenciales protegidas, comprobación de firmas o mecanismos equivalentes, idempotencia y verificación de eventos antes de confirmar operaciones. |
| API Backend → Proveedor de IA | Claves privadas, límites de consumo, control de datos enviados y verificación de autorización sobre las fuentes utilizadas. |
| Aplicación Web/PWA → Videoconferencia | Acceso mediante credenciales temporales vinculadas a participantes y sesiones autorizados; control de roles y grabaciones. |
| Aplicación Web/PWA → Videos grabados | Acceso mediante mecanismos temporales o firmados para contenidos protegidos. |
| Superadministrador → API Backend | Autenticación reforzada, MFA administrativo, autorización específica y auditoría de operaciones sensibles. |

**Reglas transversales de seguridad:**

- Ninguna clave privada de IA, pagos o bases de datos debe incluirse en el código entregado al navegador.
- El registro público admite únicamente cuentas **Estudiante** y **Docente**.
- La modalidad docente, la habilitación para impartir tutorías y la acreditación académica se verifican independientemente.
- Las cuentas de menores requieren controles de acceso y privacidad específicos.
- La pérdida de Redis no debe permitir operaciones no autorizadas.
- Ante fallos de PostgreSQL, no deben confirmarse pagos, créditos ni resultados cuya escritura no haya sido persistida.
- La protección de Cloudflare frente a ataques no equivale por sí sola a alta disponibilidad de los proveedores de datos.

---

**Trazabilidad:** `03-requisitos-funcionales.md`, `04-atributos-de-calidad.md`, `05-restricciones.md`, `06-drivers-arquitectonicos.md`, `07-decisiones-arquitectonicas.md` y `08-escenarios-atributos-calidad.md`.

**Decisiones principales:** ADR-001, ADR-002, ADR-003, ADR-006, ADR-008, ADR-009, ADR-012, ADR-013, ADR-015, ADR-016, ADR-019, ADR-021, ADR-023, ADR-031, ADR-032, ADR-041, ADR-042, ADR-043, ADR-046, ADR-048 y ADR-054.
