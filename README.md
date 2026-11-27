# Mentelyx — Plataforma educativa y arquitectura de software

> **Versión:** 3.0 — documento base del 20/11/2026; estado revisado el 26/11/2026. Incluye Análisis, Arquitectura, Diseño, Modelo C4, [evaluación arquitectónica](docs/05-evaluacion-arquitectonica/01-evaluacion-de-atributos-de-calidad.md) y [SDD 2.2](docs/06-SDD/documento-de-diseño-de-software.md), conforme a la [instrucción maestra](docs/00-gestion-del-proyecto/sprint-02/instruccion-maestra.md).\
> **Estado:** diseño definido según la instrucción maestra, con implementación incremental local en curso; evaluación inspirada en ATAM (sin taller formal con interesados). **Hay un MVP vertical local y pruebas ejecutadas; Mentelyx no está listo para producción.** Las pruebas F01–F04 y sus límites se registran en [EVIDENCIAS](docs/_auditoria/EVIDENCIAS.md); el punto activo y F05–F09 están en [ESTADO](docs/_auditoria/ESTADO.md). El build OpenNext compiló y pasó TypeScript, pero el empaquetado falló en Windows por permisos de symlink; WSL no dispone de Node en el entorno probado. CI remoto, ejecución limpia desde lockfile, runtime compatible, cloud/staging, pruebas experimentales, verificación de tarifas oficiales, condiciones legales para datos reales de menores y contratación de servicios siguen pendientes.

## 1. Propósito del proyecto

> **Alcance vigente de Mentelyx V1 ([ADR-093](docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md), 25/11/2026):** la primera versión se centra en el **aprendizaje libre** y la **preparación de exámenes**, para cualquier persona, estudie o no en una institución. Incluye Tutor IA, pizarra adaptativa, visualización 3D, visor de documentos, fuentes personales opcionales, recursos externos autorizados, carpetas independientes para aprendizaje y para exámenes, y seguimiento. **Studio, docentes, aulas, tutorías humanas, gestión institucional y publicación de cursos quedan pospuestos**: lo que este README describe sobre ellos se conserva como visión posterior, no como alcance de V1.

Mentelyx es un **centro educativo virtual independiente**, dirigido a **Primaria, Secundaria, Preuniversitario y Universitario**, que combina contenido educativo, diagnóstico, prácticas y simulacros, rutas adaptativas, preparación de exámenes, tutor IA con RAG, autoría en Mentelyx Studio y aulas virtuales con docentes habilitados y estudiantes universitarios tutores autorizados. Se desarrolla como **web mobile-first y PWA**; la inscripción no depende de colegios o dominios de correo institucional.

**Diferenciación:** existen **dos cuentas públicas** (Estudiante y Docente); el Superadministrador es una cuenta interna. Dentro de Docente se elige **perfil independiente/libre** (temas y experiencia, sin perfil de especialización acreditada) o **perfil por nivel académico** (niveles y materias, con formación acreditable tras verificación). Un estudiante universitario adulto puede solicitar autorización adicional para impartir tutorías sin convertirse en Docente. Autenticación, acreditación profesional, habilitación para cobrar y suscripción son estados **distintos**. Los menores requieren salvaguardas específicas.

## 2. Necesidad del negocio y propuesta de valor

- **Para estudiantes:** estudiar a su ritmo, reforzar áreas de dificultad, prepararse para exámenes y acceder a clases con profesores reales, desde cualquier región y sin requerir relación con institución educativa.
- **Para docentes y estudiantes tutores habilitados:** ofrecer clases por horas con tarifas propias, grupos privados y pagos directos, y preparar material profesional.
- **Para Estudiantes y Docentes con permisos de autoría:** utilizar Studio como entorno de autoría, publicación autorizada y herramientas de IA bajo límites claros.
- **Para Mentelyx:** ingresos por planes estudiantiles y docentes, comisiones sobre clases, publicidad en el plan Gratuito y anuncios recompensados; los costos de IA, cobros y audiovisuales se miden por plan.

## 3. Modelo de producto y monetización

Fuente única: [instrucción maestra](docs/00-gestion-del-proyecto/sprint-02/instruccion-maestra.md), secciones 14 a 17 (ADR-080 a ADR-082, ADR-085 y ADR-086). Los recursos son configuración de piloto versionada.

| Recurso mensual | Gratuito | Estándar | Plus | Premium |
|---|---:|---:|---:|---:|
| Precio PEN | 0 | 39,90 | 59,90 | 89,90 |
| Consultas generales | 60 | 250 | 450 | 750 |
| Consultas técnicas | 15 | 100 | 200 | 350 |
| Razonamiento profundo | 2 | 20 | 50 | 100 |
| Evaluaciones equivalentes de 15 preguntas | 3 | 10 | 20 | 40 |
| Ilustraciones nuevas estándar | 4 | 10 | 25 | 50 |
| Almacenamiento | 500 MB | 2 GB | 5 GB | 10 GB |

Todos los planes incluyen Tutor IA, aprendizaje general, fuentes propias, preparación de exámenes, pizarra inteligente, biblioteca reutilizable y simulaciones deterministas. Los planes superiores amplían capacidad. Las clases humanas no están incluidas. BYOK para adultos elegibles; capacidad adicional con anuncios recompensados verificados (no para menores); sin publicidad obligatoria en los planes de pago.

**Docentes:** Docente Inicial **S/55 mensuales** (uso profesional y materiales, sin clases en vivo; 30 documentos PDF/PPTX equivalentes, 100 consultas generales, 50 técnicas, 10 profundas, 30 ilustraciones, 10 GB documentales, 5 GB de video y 10 GB de transferencia audiovisual, como recursos de piloto). Docente Live **S/100 como importe inicial mensual** (capacidades del Inicial y clases en vivo tras la habilitación): parámetros de piloto S/55 de acceso, S/45 de saldo audiovisual y S/12 por cada 1.000 participante-minutos (3.750 participante-minutos), avisos al 70, 90 y 100 % y devolución del saldo no usado según la fórmula de la sección 15.3. Las clases son por horas con tarifa del docente y pago directo (Yape, tarjeta o QR) con la comisión correspondiente, sin custodia de Mentelyx. Pagar una suscripción no acredita al docente.

**Pasarela:** CulqiOnline (ADR-082), con comisiones versionadas por medio de pago; sin contratar.

**Sustituido (no vigente):** Plus S/29,90 y Pro S/59,90 con 30/300/900 UTI; Aulas Live S/99,90 con 4 créditos; Studio Free/Plus/Pro con 300/900 créditos; S/8 por crédito; reparto 70/30; liquidación semanal obligatoria.

## 4. Siete módulos de negocio

| Módulo | Propiedad funcional |
|---|---|
| 1. Usuarios y Administración | Gestión de cuentas, autenticación, sesiones y control de acceso, protección de menores, moderación, auditoría y operación |
| 2. Cursos y Contenidos | Catálogo, licencias, Studio, espacios y fuentes, biblioteca reutilizable, lienzos y cuadernos |
| 3. Evaluaciones y Aprendizaje | Diagnóstico, ejercicios, simulacros, planes de examen y seguimiento |
| 4. Docentes y Clases | Perfiles, habilitación, tarifas, disponibilidad, clases por horas, grupos privados, grabaciones y reservas |
| 5. Suscripciones y Pagos | Planes, recursos de plan, recompensas concedidas, saldo audiovisual, CulqiOnline, comisiones, pagos directos, devoluciones y conciliación |
| 6. Tutor IA y RAG | Orquestación con modo de fuentes, RAG híbrido BGE-M3, fuentes privadas, BYOK y consumo técnico de IA |
| 7. Publicidad y Patrocinios | Redes externas, anuncios recompensados verificados, patrocinios y seguimiento agregado |

**No se agregan módulos** por Redis, Queues, WebRTC o pagos: son servicios transversales o adaptadores técnicos.

## 5. Arquitectura objetivo y entornos

| Área | Desarrollo local | Despliegue comercial objetivo |
|---|---|---|
| Frontend | Next.js/React/TypeScript | **Next.js híbrido** (SSR, ISR y estático) en Cloudflare Workers con OpenNext (ADR-074) |
| Backend REST | Hono + TypeScript | Cloudflare Workers + Hono, monolito modular |
| Datos SQL | **PostgreSQL local** + migraciones | **Neon PostgreSQL + pgvector** (seleccionado, no contratado) |
| Documentos educativos | MongoDB local | **MongoDB Atlas** (seleccionado, conectividad Workers por validar) |
| Caché | Redis local | **Upstash Redis REST** (seleccionado como diseño, no contratado; ADR-012), sin sesiones ni cuotas autoritativas |
| Binarios/video | Carpeta/objeto de prueba | R2 para archivos; Bunny Stream para video publicado |
| Tareas y colas | Adaptador local / Worker de pruebas | Cloudflare Queues con DLQ y procesadores idempotentes |
| Aulas | WebRTC de prueba | Cloudflare RealtimeKit/SFU **candidato inicial** sujeto a prueba de 36 participantes |
| Autenticación | Integración Hono + biblioteca | **Better Auth seleccionado como diseño** (ADR-033/044), sesiones SQL revocables y permisos propios RBAC/ABAC; integración pendiente de prototipo |
| IA | Proveedor simulado o llamadas medidas | Rutas lógicas versionadas por Workers AI y AI Gateway (ADR-056); DeepSeek V4.1 Flash como sustituto seleccionado del modelo retirado, sujeto a BP-01; presupuestos y RAG autorizado |
| Extensión pesada | Proceso local/Docker | Cloud Run solo para tareas pesadas si Workers no basta |

**Persistencia:** PostgreSQL es fuente de verdad de pagos, cupos, recursos de plan, saldo audiovisual, permisos y resultados confirmados (Drizzle Kit como única autoridad de migraciones; Kysely para consultas especializadas; BGE-M3 `vector(1024)`); MongoDB almacena estructuras flexibles versionadas; Redis es solo caché/contadores efímeros. Objetos y video fuera de las BD. Entre motores no existe una transacción ACID global: usar outbox, identificadores y procesos idempotentes.

## 6. Disponibilidad, seguridad y control de costos

- **AC-02 disponibilidad** prioritaria: propuesta de **99,5 % mensual** para funciones educativas críticas, **meta de diseño y no SLA**. Caída de Redis debe degradar de manera segura; la de IA no debe bloquear contenido ordinario; pagos/exámenes no pueden confirmar acciones antes de persistirlas.
- **Recuperación:** monitoreo/alertas, salud de servicios, DLQ, compensaciones, backups con restauraciones ensayadas, métricas de RTO/RPO. Plan Free no implica HA automática de PostgreSQL/Atlas ni failover regional.
- **Seguridad:** TLS, Cloudflare WAF/DDoS, autorización estricta en API, sesiones, MFA administrativo, validación, límites, registros sin secretos, controles de derechos y consentimiento audiovisual.
- **Ingresos vs costos:** cada plan debe preservar contribución positiva **a uso completo**, separando IGV cuando corresponda, pasarela, pagos a docentes, IA, video, storage, soporte, devoluciones, infraestructura fija y tributos. Las estimaciones previas **no son utilidad neta**.
- **Balanceador dedicado:** solo se añadirá si hay destinos independientes con health checks y justificación operativa; no confundir CDN/WAF con balanceo de orígenes para recuperación de una BD.

## 7. Fases y límites

1. **Diseño del Sprint 02 (completado según su alcance):** análisis de sistema (`01`), arquitectura de software (`02`), diseño interno/externo y especializado (`03`), modelo C4 (`04`), evaluación arquitectónica (`05-evaluacion-arquitectonica`) y SDD (`06-SDD`). La corrección de hallazgos originales F01–F09 sigue en curso; no se confunde con cierre de implementación.
2. **Construcción local (en curso, I-0 y MVP vertical):** los siguientes incrementos I-0 a I-7 siguen la secuencia del [SDD, sección 22](docs/06-SDD/documento-de-diseño-de-software.md): fundaciones y controles; autenticación, perfiles, espacios y fuentes; RAG y Tutor IA; pizarra; biblioteca; evaluaciones; Studio y comercial; docentes, audiovisual, Culqi, publicidad y operación. I-0 y el MVP están verificados solo parcialmente en local; CI remota, nube, staging y condiciones de producción siguen pendientes.
3. **Piloto limitado:** medir IA real por generación, pruebas docentes, verificaciones de capacidad WebRTC (35+1), funcionamiento pasarela, conciliación, costos y restauración.
4. **Lanzamiento comercial:** solo servicios cuyos permisos, seguridad, capacidad, costos, términos y disponibilidad hayan sido verificados; activación progresiva de planes.
5. **Posterior:** convenios escolares, Studio Equipos, clases masivas más allá de 35, modelos IA propios, eventual Kafka y alta disponibilidad superior contratada.

## 8. Estructura documental completa y estado

### 8.1. `docs/01-analisis-de-sistema/` — Análisis del Sistema
| Archivo | Propósito | Estado |
|---|---|---|
| [`01-actores.md`](docs/01-analisis-de-sistema/01-actores.md) | Usuarios, sistemas externos y permisos por cuenta | Completado |
| [`02-historias-del-usuario.md`](docs/01-analisis-de-sistema/02-historias-del-usuario.md) | Catálogo HU-01–HU-90, sin perder identificadores originales | Completado |
| [`03-requisitos-funcionales.md`](docs/01-analisis-de-sistema/03-requisitos-funcionales.md) | RF-01–RF-122 con reglas, trazabilidad y prioridad operativa del primer alcance; etapas posteriores por planificar | Completado |
| [`04-atributos-de-calidad.md`](docs/01-analisis-de-sistema/04-atributos-de-calidad.md) | AC-01–AC-11 y objetivos verificables | Completado |
| [`05-restricciones.md`](docs/01-analisis-de-sistema/05-restricciones.md) | RC-01–RC-37 y límites comerciales, regulatorios y técnicos | Completado |
| [`06-drivers-arquitectonicos.md`](docs/01-analisis-de-sistema/06-drivers-arquitectonicos.md) | DA-01–DA-31, relación RF/AC/RC ↔ decisiones | Completado |
| [`07-decisiones-arquitectonicas.md`](docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md) | ADR-001–ADR-093 (ADR-011 reservado; ADR-093 fija el alcance de V1) con alternativas y estados; ADR-056–072 resueltas (sección 8); clasificación de cierre, contingencias, ADR-073 y preguntas de producto (sección 10) | Completado; decisiones bloqueadas para producción o pendientes de producto identificadas |
| [`08-escenarios-atributos-calidad.md`](docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) | EQ-01–EQ-31 con pruebas y métricas; resultados pendientes | Completado |

### 8.2. `docs/02-arquitectura-software/` — Arquitectura de Software
| Archivo | Propósito | Estado |
|---|---|---|
| [`arquitectura-inicial.md`](docs/02-arquitectura-software/arquitectura-inicial.md) | Modelo general, entornos y flujos prioritarios de Mentelyx | Completado |
| [`estilo-arquitectonico.md`](docs/02-arquitectura-software/estilo-arquitectonico.md) | Estilo monolito modular en tres capas y despliegue serverless-first | Completado |
| [`enfoque-arquitectonico.md`](docs/02-arquitectura-software/enfoque-arquitectonico.md) | Enfoque Clean Architecture, puertos/adaptadores y dirección de dependencias | Completado |
| [`componentes-arquitectonicos.md`](docs/02-arquitectura-software/componentes-arquitectonicos.md) | Vista de los 7 componentes principales del backend (`C01–C07`) | Completado |
| [`seguridad-y-autenticacion.md`](docs/02-arquitectura-software/seguridad-y-autenticacion.md) | Better Auth, sesiones SQL revocables, CSRF, MFA, autorización, STRIDE/IA, menores, eliminación y secretos | Diseño seleccionado; pruebas pendientes |
| [`infraestructura-escalabilidad-y-recuperacion.md`](docs/02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) | Topología y compatibilidad, DNS/CDN/TLS, caché, escalado, colas, DeepSeek, disponibilidad, recuperación y CI/CD | Diseño seleccionado; sin servicios contratados |

### 8.3. `docs/03-diseño-de-software/` — Diseño Interno y Externo
| Subcarpeta / Archivo | Propósito | Estado |
|---|---|---|
| [`diseño-interno/principios-de-diseño.md`](docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md) | Aplicación de principios SOLID con diagramas por módulo (`M1–M7`) | Completado |
| [`diseño-interno/patrones-de-diseño.md`](docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md) | Patrones GoF y de integración (Repository, Adapter, Idempotent Receiver, Outbox, Ledger) | Completado |
| [`diseño-interno/diseño-interno-de-modulos.md`](docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md) | Estructura de código de `M1–M7`, vistas de paquetes y UML/TypeScript detallado de `M5` | Completado |
| [`diseño-externo/01-diseño-de-persistencia-y-datos.md`](docs/03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) | Modelo conceptual, lógico y físico por módulo, MongoDB, Redis, R2, diseño vectorial, matriz de asignación (sección 13) y diagramas ER por módulo (sección 15) | Completado (v2.1); migraciones no ejecutadas |
| [`diseño-externo/02-diseño-de-api-y-contratos.md`](docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md) | Endpoints REST `/api/v1/*`, payloads, idempotencia, webhooks y eventos de Queues | Completado |
| [`diseño-externo/03-diseño-de-interfaces-y-flujos.md`](docs/03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) | Mapa de navegación Next.js Web/PWA, vistas por actor y salvaguardas de UI | Completado |
| [`contrato-coordinacion-datos-seguridad-infraestructura.md`](docs/03-diseño-de-software/contrato-coordinacion-datos-seguridad-infraestructura.md) | Resolución SC-01–SC-17, SEG-01–SEG-04 e INF-01–INF-06; ajustes CO-01–CO-10 | Resuelto |
| [`diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md`](docs/03-diseño-de-software/diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md) | Proveedores, privacidad D0–D3, rutas, cuotas, costos, verificación y cancelación del Tutor IA | Diseño propuesto; benchmarks pendientes |
| [`diseño-especializado/02-diseño-rag.md`](docs/03-diseño-de-software/diseño-especializado/02-diseño-rag.md) | Ingestión, generaciones de índice, recuperación híbrida autorizada, citas y revocación | Diseño propuesto; BP-07 pendiente |
| [`diseño-especializado/03-motor-visual-y-pizarra.md`](docs/03-diseño-de-software/diseño-especializado/03-motor-visual-y-pizarra.md) | Primitivas, esquemas de escena, validación, reproductor y pizarra | Diseño propuesto; prototipo pendiente |
| [`diseño-especializado/04-visualizaciones-3d.md`](docs/03-diseño-de-software/diseño-especializado/04-visualizaciones-3d.md) | Simulaciones verificables y objetos ilustrativos | Diseño propuesto; proveedores condicionados |
| [`diseño-especializado/05-generacion-de-materiales-educativos.md`](docs/03-diseño-de-software/diseño-especializado/05-generacion-de-materiales-educativos.md) | Contenido, plantillas y renderizado PDF/PPTX por audiencia | Diseño propuesto; compatibilidad pendiente |
| [`diseño-especializado/06-calidad-ia-criterios-y-pruebas.md`](docs/03-diseño-de-software/diseño-especializado/06-calidad-ia-criterios-y-pruebas.md) | Criterios y pruebas pedagógicas, visuales, funcionales, de costo y de latencia | Criterios propuestos; no ejecutados |
| [`diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md`](docs/03-diseño-de-software/diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md) | Decisiones ADR-056–072, solicitudes de cambio, resolución y pendientes | Integrado |

### 8.4. `docs/04-modelo-c4/` — Modelo C4 Completo (Niveles 1 al 4)
| Archivo | Propósito | Estado |
|---|---|---|
| [`Nivel1-DiagramadeContextodelSistema.md`](docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md) | Nivel 1: Actores, sistema central Mentelyx y proveedores externos | Completado |
| [`Nivel2-DiagramadeContenedores.md`](docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md) | Nivel 2: Web/PWA, Edge, API Hono/Workers, Queues y bases de datos | Completado |
| [`Nivel3-DiagramadeComponentes.md`](docs/04-modelo-c4/Nivel3-DiagramadeComponentes.md) | Nivel 3: Componentes `C01–C07` del backend, contratos y adaptadores | Completado |
| [`Nivel4-DiagramadeCodigo.md`](docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md) | Nivel 4: Paquetes `M1–M7`, SOLID y diagramas UML de clases y secuencia | Completado |

### 8.5. `docs/00-gestion-del-proyecto/` — Gestión del proyecto

| Archivo | Propósito | Estado |
|---|---|---|
| [`sprint-02/instruccion-maestra.md`](docs/00-gestion-del-proyecto/sprint-02/instruccion-maestra.md) | Fuente de autoridad y única copia de los acuerdos aprobados | Definitiva |
| [`sprint-02/avance-cierre-arquitectonico-sprint-02.md`](docs/00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md) | Registro de continuidad, matriz de acuerdos y verificación de la sección 27 | Vigente |

### 8.6. `docs/05-evaluacion-arquitectonica/` — Evaluación arquitectónica

| Archivo | Propósito | Estado |
|---|---|---|
| [`01-evaluacion-de-atributos-de-calidad.md`](docs/05-evaluacion-arquitectonica/01-evaluacion-de-atributos-de-calidad.md) | Objetivos, evaluación por atributo y árbol de utilidad (inspirado en ATAM) | 1.0 |
| [`02-analisis-de-riesgos-y-compromisos.md`](docs/05-evaluacion-arquitectonica/02-analisis-de-riesgos-y-compromisos.md) | Sensibilidad, compromisos, riesgos y no riesgos | 1.0 |
| [`03-estrategia-de-pruebas.md`](docs/05-evaluacion-arquitectonica/03-estrategia-de-pruebas.md) | Niveles, k6, fallos, pruebas nuevas, RTO/RPO | 1.0; todas pendientes |
| [`04-matriz-de-trazabilidad.md`](docs/05-evaluacion-arquitectonica/04-matriz-de-trazabilidad.md) | EQ-01–EQ-45 → RF → DA → ADR → componente → prueba | 1.0 |

### 8.7. `docs/06-SDD/` — Documento de diseño de software

| Archivo | Propósito | Estado |
|---|---|---|
| [`documento-de-diseño-de-software.md`](docs/06-SDD/documento-de-diseño-de-software.md) | SDD por referencias con sus 22 elementos, criterios docentes y secuencia incremental | 2.0; pruebas pendientes |

### Glosario breve

| Término normalizado | Significado y estado asociado | No implica por sí solo |
|---|---|---|
| Gestión de cuentas y perfiles | Registro de usuarios, administración de datos y estados de cuenta, perfiles y recuperación de acceso. Una cuenta registrada existe en el sistema. | Una sesión autenticada, permisos de publicación o habilitación docente. |
| Autenticación (AuthN) | Validación de credenciales de acceso, inicio de sesión, MFA y gestión, renovación o cierre de sesiones. Una sesión autenticada vincula una solicitud con una cuenta. | Autorización para operar sobre cualquier recurso. |
| Autorización y control de acceso (AuthZ) | Comprobación de roles, permisos y condiciones por recurso y operación, incluidas las capacidades de Studio e IA. | Verificación documental ni acreditación académica. |
| Verificación documental del solicitante | Comprobación de que la persona corresponde a los documentos personales oficiales presentados; produce el estado de documentación personal verificada. | Validación de títulos ni habilitación para cobrar tutorías. |
| Validación de credenciales académicas | Verificación de títulos, grados y certificados; permite acreditar la formación demostrada del perfil Docente por nivel académico. | Habilitación docente automática; no es requisito general para la modalidad independiente. |
| Habilitación docente | Autorización aprobada y vigente para impartir tutorías remuneradas según las condiciones aplicables. Un Estudiante universitario adulto habilitado conserva su tipo de cuenta. | Cambio de cuenta, título profesional o suscripción activa. |
| Derecho de uso o suscripción activa | Beneficio o cuota de un producto, con alcance y vigencia propios; para productos de pago se activa tras la confirmación válida correspondiente. | Autorización para enseñar ni acceso irrestricto a recursos. |
| Pago confirmado | Operación económica validada y registrada conforme a las reglas de la pasarela y de Mentelyx. | Acreditación académica, habilitación docente ni pago directo verificado de una clase aún no prestada. |
| Identificador de cuenta, orden o movimiento | Clave que referencia de forma inequívoca un registro del dominio correspondiente. | Verificación documental o autenticación. |

El registro y el inicio de sesión son posibles sin habilitación docente. La verificación documental, la validación académica y la habilitación mantienen resultados separados; no forman una aprobación única. Esta terminología precisa las reglas vigentes sin añadir documentos obligatorios, requisitos legales ni condiciones comerciales.

La descripción de **M1 — Usuarios y Administración** es «gestión de cuentas, autenticación, sesiones y control de acceso». M4 tramita los expedientes docentes y comunica a M1 las decisiones que afectan a los permisos, conforme al diseño interno.

El informe de auditoría terminológica se retiró en `3e136b2`. Sus pendientes vigentes se registran en el [registro especializado, sección 4](docs/03-diseño-de-software/diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md) y en el [registro de avance](docs/00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md).

- **Hono:** framework TypeScript de API HTTP; **Better Auth:** biblioteca que integraríamos en el código para credenciales/sesiones; **RBAC/ABAC:** permisos por roles y contexto.
- **WebRTC/SFU:** comunicación audiovisual en tiempo real; **Queues/DLQ:** tareas y cola de fallidos, con posible redelivery; **Redis:** caché, no billetera ni base financiera.
- **RAG:** recuperación de documentos autorizados para responder; **outbox:** registro transaccional de eventos pendientes de publicar; **idempotencia:** evitar efectos duplicados ante reintentos.

## Demostración local de Mentelyx V1 (27/11/2026)

Entorno reproducible con Docker Desktop y Git Bash. Usa solo datos ficticios y no requiere ningún secreto. El Tutor usa el proveedor **simulado**, que la interfaz rotula como «Demostración (sin IA real)». Para usar Gemma real hace falta `wrangler login` y `wrangler dev --env local-ia`.

1. **Servicios y puertos.** `bash scripts/levantar-local.sh` levanta:
   - PostgreSQL en 55432, MongoDB en 57017, Redis REST en 8079 y el proxy de Neon en 5488;
   - la API en http://localhost:8787 y la web en http://localhost:8788.

   El script espera hasta que el frontend llega a la API.
2. **Salud.** `curl http://localhost:8788/api/v1/salud` debe responder `estado: ok` con los 7 módulos.
3. **Migraciones e índices** (solo la primera vez): `corepack pnpm db:migrate` (8 migraciones) y `node backend/scripts/preparar-mongo.mjs`.
4. **Datos de demostración:** `node scripts/sembrar-demo.mjs http://127.0.0.1:8787`. Es idempotente y crea:
   - las cuentas `demo.ana@ejemplo.test` y `demo.beto@ejemplo.test`, con la contraseña ficticia `Demo-Mentelyx-2026`;
   - la carpeta «Cálculo» con el tema «Derivadas» y sus apuntes;
   - la preparación «Parcial de Cálculo I», con 12 preguntas y 3 tarjetas.
5. **Verificación previa:** `node scripts/humo-e2e.mjs http://127.0.0.1:8788` (16 pasos) y `node scripts/flujos-v1-e2e.mjs http://127.0.0.1:8788` (9 pasos).
6. **Guion:**
   - **Aprendizaje libre:**
     1. Ingresar como Ana y abrir Aprendizaje → carpeta «Cálculo» → tema «Derivadas».
     2. Preguntar «Resume los pasos de la regla de la potencia».
     3. La respuesta llega con citas y un bloque de pasos validado por el servidor. Revelar un paso y recargar la página: el estado se conserva.
   - **Exámenes:**
     1. Abrir Exámenes → «Parcial de Cálculo I» y revisar el temario y el plan.
     2. Hacer un simulacro: el tiempo lo controla el servidor. Entregarlo para ver la calificación oficial y su revisión.
     3. Ir a Resultados (historial) y a Práctica (comprobar una respuesta).
   - **Seguridad:**
     1. Ingresar como Beto y abrir la URL de la preparación de Ana: responde 404.
     2. En Configuración, mostrar el perfil, las sesiones abiertas y las preferencias.
7. **Reinicio:**
   1. `docker restart mentelyx-build mentelyx-postgres-1 mentelyx-mongo-1`.
   2. Volver a ejecutar `bash scripts/levantar-local.sh`. La primera petición tras arrancar tarda unos segundos (compilación en frío).
   3. Los datos persisten. **No ejecutar `pnpm db:down`**: MongoDB usa un volumen anónimo y se perderían las conversaciones y el banco.

### Perfil con servicios externos: Neon, MongoDB Atlas y Tutor real con NVIDIA

Los secretos están en `backend/.secretos/`, ignorado por Git. Se ejecuta desde Windows, con Wrangler ya autenticado.

1. `node scripts/preparar-perfil-externo.mjs`: genera `backend/.dev.vars.externo` sin imprimir valores.
2. API: `cd backend && npx wrangler dev --env externo --port 8790 --ip 127.0.0.1`.
3. Web, con el *bundle* compilado en el contenedor:
   - copiar el *bundle*: `docker exec mentelyx-build sh -c 'cd /app/frontend && tar -chf - .open-next' | (cd frontend && tar -xf -)`;
   - servirlo: `cd frontend && npx wrangler dev --port 8791 --ip 127.0.0.1`;
   - abrir http://localhost:8791.
4. Datos y comprobaciones:
   - `node scripts/sembrar-demo.mjs http://127.0.0.1:8790`;
   - `node scripts/flujos-v1-e2e.mjs http://localhost:8791`;
   - `node scripts/tutor-real-e2e.mjs`: hace **una** inferencia real y consume créditos de NVIDIA.

El Tutor con NVIDIA (Kimi K3.1 Pro) tardó unos 80 s por respuesta. En la demostración en vivo conviene usar el perfil local y mostrar la respuesta real ya guardada.

**Limitaciones conocidas:**
- Sin Workers AI real ni MongoDB Atlas verificados.
- Los PDF no se aceptan como fuente.
- La vista de tarjetas todavía no está conectada.
- No hay recuperación de contraseña por correo.
- Faltan las páginas legales.

El detalle está en el [registro de continuidad, sección 23](docs/00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md).
