# Enfoque arquitectónico de Mentelyx: Clean Architecture

## 1. Descripción del enfoque

Para **Mentelyx**, plataforma educativa virtual dirigida a estudiantes de **Primaria, Secundaria y Preuniversitario**, se propone aplicar **Clean Architecture (Arquitectura Limpia)** para separar las reglas académicas y comerciales de la interfaz de usuario, los frameworks y las tecnologías externas.

Este documento describe **el enfoque de organización interna y la dirección de las dependencias del código**. Complementa, pero no reemplaza, el documento `estilo-arquitectonico.md`, donde se representa el **monolito modular en tres capas** y su despliegue serverless-first.

| Elemento | Descripción aplicada a Mentelyx |
|---|---|
| **Patrón / enfoque arquitectónico** | **Clean Architecture (Arquitectura Limpia)**, con puertos y adaptadores para desacoplar tecnología y negocio. |
| **Objetivo** | Separar responsabilidades y orientar las dependencias del código hacia los casos de uso y el dominio educativo y comercial. |
| **¿Qué problema resuelve?** | Evita que las reglas de evaluaciones, tutorías, suscripciones, pagos y acceso a contenidos dependan directamente de Next.js, Hono, Cloudflare Workers, PostgreSQL, MongoDB, servicios de IA o proveedores audiovisuales. |
| **Capas o zonas conceptuales** | **Presentación, Aplicación, Dominio e Infraestructura**; los **puertos** son contratos internos definidos donde los necesitan los casos de uso. |
| **Beneficios esperados** | Permite hacer pruebas unitarias con adaptadores simulados; facilita sustituir proveedores y aislar cambios técnicos; mejora la organización de los siete módulos y la mantenibilidad. |
| **Relación con el estilo principal** | Mentelyx sigue siendo un **monolito modular**: Clean Architecture organiza las dependencias **dentro de ese backend**, no obliga a crear microservicios. |
| **Tecnologías de referencia** | Cliente Next.js + React + TypeScript; backend Hono + TypeScript sobre Cloudflare Workers; PostgreSQL + pgvector, MongoDB, Redis y R2 mediante adaptadores. |

## 2. Diagrama del enfoque arquitectónico

![Diagrama de Clean Architecture de Mentelyx](../img/fuentes-svg/estilo-arquitectonico.svg)

**Figura 1.** Enfoque Clean Architecture aplicado al backend de Mentelyx: presentación, aplicación, dominio, contratos, adaptadores y sistemas externos. **Fuente:** elaboración propia.



> **Alcance del diagrama:** se muestran **casos de uso representativos**, uno por cada uno de los siete módulos, y ejemplos de sus puertos y adaptadores. No son todas las clases ni todas las operaciones previstas. Los nombres de clases y rutas constituyen una **propuesta de organización**, no un código ya implementado.

## 3. Responsabilidad de cada capa

### 3.1. Presentación

Es la entrada HTTP del backend. Incluye las rutas `*.routes.ts`, los controladores `*.controller.ts`, DTO, validación, manejo de errores y middlewares transversales de Hono. Recibe solicitudes de la **Web/PWA** de Mentelyx, pero **no decide las reglas académicas o económicas**.

Por ejemplo, una petición `POST /api/v1/evaluaciones/{id}/intentos` valida su entrada y llama a un caso de uso. El controlador no consulta directamente la base de datos. La autenticación y los controles HTTP se aplican aquí, mientras que los permisos contextuales (inscripción, plan, licencia del material o derecho a participar) también se verifican en la capa de aplicación o dominio.

### 3.2. Aplicación: casos de uso

Orquesta los procesos de negocio. Para mostrar que Clean Architecture se aplica a todo Mentelyx y no solo a un módulo, la figura incluye **un caso de uso representativo de cada módulo**:

| Módulo de Mentelyx | Caso de uso ilustrativo | Qué coordina |
|---|---|---|
| Usuarios y Administración | Registrar o autenticar estudiante | Credenciales, identidad y permisos. |
| Cursos y Contenidos | Publicar una lección | Metadatos, licencias y material pedagógico. |
| Evaluaciones y Aprendizaje | Resolver una evaluación | Reglas de intento, calificación y progreso. |
| Docentes y Clases | Reservar una tutoría | Disponibilidad, cupo y condiciones de reserva. |
| Suscripciones y Pagos | Activar plan y registrar cobro | Beneficios, confirmaciones idempotentes y registros económicos. |
| Tutor IA y RAG | Responder una consulta educativa | Autorización de fuentes, recuperación semántica y proveedor de IA. |
| Publicidad y Patrocinios | Gestionar una campaña | Ubicaciones permitidas, publicación y condiciones de visualización. |

Los casos de uso **dependen de entidades y contratos**, y reciben sus colaboradores mediante inyección de dependencias; no instancian clientes concretos de bases de datos ni llaman SDK de proveedores directamente.

### 3.3. Dominio: núcleo del negocio

Contiene entidades, objetos de valor e invariantes de Mentelyx: usuarios y roles; cursos y contenidos; evaluaciones y progreso; reservas de tutorías; suscripciones y pagos; y reglas para publicidad permitida. Las reglas deben expresarse en **TypeScript puro**, sin importar Hono, React, ORM, clientes de MongoDB ni SDK de Cloudflare.

Ejemplos: impedir una reserva cuando se agotaron los cupos; calcular el estado de un intento de evaluación; determinar si una suscripción está vigente; o impedir la publicación de un contenido sin autorización suficiente. Las comprobaciones que requieren datos se coordinan desde la aplicación mediante puertos.

### 3.4. Puertos: contratos internos

Los puertos son **interfaces** que representan capacidades requeridas por un caso de uso, independientemente de su implementación. La figura muestra ejemplos como `ContenidoRepositoryPort`, `EvaluacionesRepositoryPort`, `PagosRepositoryPort`, `VideoStoragePort`, `IAProviderPort` y `NotificacionesPort`.

**Aclaración técnica:** aunque se dibujan cerca del dominio para facilitar la lectura, los puertos de salida pueden definirse en la **capa de Aplicación** o, cuando representen abstracciones propias del modelo, en el Dominio. No se obliga a que todos los contratos de servicios externos pertenezcan al núcleo de entidades.

### 3.5. Infraestructura: adaptadores y frameworks

Incluye las implementaciones concretas de puertos, clientes y servicios técnicos. Por ejemplo, un adaptador PostgreSQL implementa la persistencia transaccional; un adaptador MongoDB gestiona documentos de lecciones; R2 almacena archivos; Bunny Stream distribuye videos; y los adaptadores de pago o IA llaman a los proveedores externos mediante interfaces internas.

Este diseño permite cambiar un proveedor de pagos o la biblioteca ORM **sin reescribir necesariamente las reglas del dominio**, siempre que se conserve el contrato y se satisfagan los comportamientos esperados. Las dependencias e integraciones deben validarse en Cloudflare Workers antes del despliegue real.

## 4. Flujo de ejecución frente a dirección de dependencias

**Flujo de ejecución (flechas continuas):**

`Web/PWA → Middleware → Ruta → Controlador → Caso de uso → Puerto → Adaptador → Base de datos o servicio externo`

**Dependencias del código (flechas discontinuas hacia dentro):**

- Presentación depende de los casos de uso o de sus contratos públicos.
- Los casos de uso conocen entidades y puertos internos.
- Infraestructura implementa los puertos internos y depende de sus interfaces.
- **Dominio no depende de infraestructura, frameworks ni interfaz HTTP.**

La flecha de ejecución hacia una base de datos **no debe interpretarse como un `import` desde el dominio hacia el driver**. La figura diferencia ambas direcciones para aplicar correctamente el principio de inversión de dependencias.

## 5. Ejemplo aplicado: reservar una tutoría

Un estudiante solicita una tutoría desde la Web/PWA. El controlador recibe y valida la petición; `ReservarTutoriaCasoUso` comprueba, mediante contratos internos, la identidad autorizada del estudiante, la disponibilidad del docente, los cupos y las reglas de la reserva. Para guardar el resultado, solicita una operación a una interfaz de repositorio, implementada por un adaptador sobre PostgreSQL. Si es necesario cobrar una sesión, se utiliza un puerto de pagos y su adaptador correspondiente. Las reglas de disponibilidad y reserva no importan ni dependen del SDK del proveedor de pagos ni de Hono.

El mismo criterio se aplica a la publicación de cursos, ejecución de evaluaciones, pagos recurrentes, recuperación RAG autorizada y campañas de publicidad.

## 6. Organización de carpetas propuesta

```text
backend/src/
├── modules/
│   ├── usuarios-admin/
│   ├── cursos-contenidos/
│   ├── evaluaciones-aprendizaje/
│   ├── docentes-clases/
│   ├── suscripciones-pagos/
│   ├── tutor-ia-rag/
│   └── publicidad/
├── shared/
│   └── infrastructure/
└── bootstrap/
    └── container.ts
```

En **cada módulo**, una organización interna posible es:

```text
src/modules/docentes-clases/
├── presentation/
│   ├── docentes.routes.ts
│   └── docentes.controller.ts
├── application/
│   ├── use-cases/
│   │   └── reservar-tutoria.use-case.ts
│   └── ports/
│       └── tutoria-repository.port.ts
├── domain/
│   ├── entities/
│   └── rules/
└── infrastructure/
    ├── persistence/
    └── providers/
```

La **raíz de composición** (`src/bootstrap/container.ts`, ruta propuesta) ensambla casos de uso y adaptadores al iniciar el backend. Es el lugar adecuado para escoger implementaciones concretas, en vez de hacerlo dentro de las reglas del dominio.

## 7. Reglas arquitectónicas

1. El dominio no importa componentes de Next.js, Hono, Workers, ORM, MongoDB ni proveedores externos.
2. Los controladores y middlewares no implementan reglas de negocio complejas.
3. Los casos de uso trabajan con contratos y entidades; los adaptadores implementan los puertos.
4. Cada módulo expone interfaces o casos de uso públicos para colaborar con otros módulos; se evita acceder a repositorios privados de otros módulos.
5. Los registros financieros, permisos, progreso y otros datos transaccionales conservan PostgreSQL como fuente de verdad; el contenido flexible usa MongoDB y los archivos R2 según los contratos aprobados.
6. El procesamiento asíncrono mediante Workers y colas se conecta por adaptadores y no obliga a convertir los módulos en microservicios.
7. Las pruebas unitarias del dominio y de los casos de uso pueden emplear implementaciones simuladas de los puertos.

## 8. Relación con las decisiones arquitectónicas

El enfoque se alinea con **ADR-001** (monolito modular), **ADR-002** (Clean Architecture y puertos/adaptadores), **ADR-013** (serverless-first) y **ADR-023** (persistencia PostgreSQL + MongoDB). El diagrama refleja principalmente **responsabilidades y dependencias internas**, mientras que `estilo-arquitectonico.md` refleja también la infraestructura, la distribución de datos y los Workers auxiliares.

## 9. Conclusión

Clean Architecture permite estructurar Mentelyx de modo que sus reglas educativas y comerciales puedan evolucionar sin depender directamente de una tecnología específica. Al combinar este enfoque con el **monolito modular**, los **siete módulos** mantienen fronteras claras y comparten un despliegue principal, pero separan interfaces, casos de uso, entidades y adaptadores. Esta decisión favorece la mantenibilidad, las pruebas y la sustitución controlada de integraciones durante la evolución de la plataforma.

**Nota:** el diagrama y las rutas son una propuesta de diseño; no representan una implementación ya terminada. Este documento no modifica los entregables anteriores.
