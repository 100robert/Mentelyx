# Matriz de trazabilidad — Mentelyx

> **Versión:** 1.2 — 26/11/2026 · **Cadena:** HU/RF y requisito → driver → ADR → componente → escenario → prueba → evidencia.
> **Origen:** traslada y actualiza la sección 9 del SDD v1.0. Las pruebas están en la [estrategia de pruebas](03-estrategia-de-pruebas.md) o en el documento indicado (SEC en seguridad; API, RAG-SEC-01–05, INY, MEN, COS-01–03, BP y UI en calidad IA e interfaces; PR-INF en infraestructura).
> **Evidencia actualizada el 26/11/2026:** existen pruebas locales y evidencia parcial por escenario. «Parcial local» no equivale a cumplir todos los umbrales del EQ; «Pendiente» conserva el significado de escenario no acreditado. Los 31 EQ originales conservan sus umbrales. Resultados F01–F09 fechados y limitados en el [registro de evidencias](../_auditoria/EVIDENCIAS.md).

> **Revisión documental 1.2:** conserva el cruce individual HU-01–HU-90 ↔ RF-01–RF-122 y actualiza la trazabilidad de I-0, la procedencia docente y los hallazgos F01–F09. Una relación expresa trazabilidad semántica, no prioridad, implementación ni aprobación de políticas pendientes. El cruce no sustituye la trazabilidad EQ de la sección 1.

> **Alcance de calidad:** la matriz describe el producto aprobado completo. ADR-093 delimita qué escenarios corresponden a V1; los vinculados a capacidades pospuestas son objetivos de diseño futuro, no criterios de disponibilidad o aceptación de V1.

## Trazabilidad HU → RF

| HU | RF relacionado(s) |
|---|---|
| HU-01 | RF-01, RF-53 |
| HU-02 | RF-07, RF-08 |
| HU-03 | RF-08 |
| HU-04 | RF-05 |
| HU-05 | RF-09 |
| HU-06 | RF-10, RF-11 |
| HU-07 | RF-11 |
| HU-08 | RF-12, RF-13, RF-43 |
| HU-09 | RF-15, RF-16, RF-17 |
| HU-10 | RF-20 |
| HU-11 | RF-21, RF-22, RF-23, RF-26, RF-27, RF-118 |
| HU-12 | RF-24, RF-25, RF-76 |
| HU-13 | RF-18, RF-58, RF-88 |
| HU-14 | RF-19, RF-20, RF-35 |
| HU-15 | RF-21, RF-36, RF-79 |
| HU-16 | RF-22, RF-24 |
| HU-17 | RF-28, RF-29 |
| HU-18 | RF-03, RF-04, RF-31, RF-93 |
| HU-19 | RF-06 |
| HU-20 | RF-18, RF-58, RF-59 |
| HU-21 | RF-12, RF-43, RF-73, RF-97 |
| HU-22 | RF-15, RF-16, RF-17 |
| HU-23 | RF-28, RF-29, RF-31, RF-86, RF-92, RF-122 |
| HU-24 | RF-31, RF-32, RF-63, RF-64, RF-95 |
| HU-25 | RF-33, RF-34 |
| HU-26 | RF-35, RF-41, RF-55, RF-60, RF-99 |
| HU-27 | RF-21, RF-36, RF-77, RF-80 |
| HU-28 | RF-37, RF-48, RF-75, RF-89 |
| HU-29 | RF-39, RF-40, RF-98 |
| HU-30 | RF-41, RF-99 |
| HU-31 | RF-42 |
| HU-32 | RF-40, RF-98 |
| HU-33 | RF-43, RF-44, RF-71 |
| HU-34 | RF-45, RF-90, RF-99 |
| HU-35 | RF-35, RF-46, RF-99 |
| HU-36 | RF-49 |
| HU-37 | RF-50 |
| HU-38 | RF-51, RF-103, RF-105 |
| HU-39 | RF-52 |
| HU-40 | RF-51 |
| HU-41 | RF-01, RF-53, RF-57 |
| HU-42 | RF-35, RF-55, RF-101 |
| HU-43 | RF-35, RF-56, RF-83 |
| HU-44 | RF-19, RF-20, RF-21 |
| HU-45 | RF-19, RF-20, RF-59 |
| HU-46 | RF-18, RF-59 |
| HU-47 | RF-56, RF-60, RF-114 |
| HU-48 | RF-61, RF-83 |
| HU-49 | RF-06, RF-18, RF-41, RF-58, RF-59 |
| HU-50 | RF-44, RF-63, RF-64, RF-71, RF-95 |
| HU-51 | RF-69, RF-96 |
| HU-52 | RF-05, RF-49, RF-67 |
| HU-53 | RF-35, RF-41, RF-60, RF-99 |
| HU-54 | RF-12, RF-14, RF-43, RF-73, RF-87 |
| HU-55 | RF-76, RF-80 |
| HU-56 | RF-25, RF-76, RF-97 |
| HU-57 | RF-21, RF-76, RF-79, RF-97 |
| HU-58 | RF-18, RF-58, RF-70, RF-88 |
| HU-59 | RF-21, RF-77 |
| HU-60 | RF-56, RF-60, RF-61, RF-83 |
| HU-61 | RF-56, RF-60, RF-61, RF-83 |
| HU-62 | RF-82, RF-85 |
| HU-63 | RF-44, RF-71, RF-86 |
| HU-64 | RF-14, RF-43, RF-82, RF-84, RF-87 |
| HU-65 | RF-45, RF-47, RF-90, RF-99 |
| HU-66 | RF-22, RF-23, RF-80 |
| HU-67 | RF-39, RF-81 |
| HU-68 | RF-27, RF-29, RF-31, RF-68, RF-86, RF-92, RF-122 |
| HU-69 | RF-21, RF-38, RF-80, RF-118 |
| HU-70 | RF-14, RF-43, RF-73, RF-87 |
| HU-71 | RF-100 |
| HU-72 | RF-42 |
| HU-73 | RF-42, RF-101, RF-102 |
| HU-74 | RF-112 |
| HU-75 | RF-49, RF-50 |
| HU-76 | RF-103, RF-104 |
| HU-77 | RF-105 |
| HU-78 | RF-106, RF-113 |
| HU-79 | RF-107 |
| HU-80 | RF-108 |
| HU-81 | RF-109, RF-111, RF-113 |
| HU-82 | RF-110 |
| HU-83 | RF-114 |
| HU-84 | RF-73, RF-74, RF-115 |
| HU-85 | RF-78, RF-116, RF-122 |
| HU-86 | RF-117 |
| HU-87 | RF-118, RF-121 |
| HU-88 | RF-119 |
| HU-89 | RF-120 |
| HU-90 | RF-40 |

Las relaciones se asignaron por el comportamiento descrito en la HU y el alcance explícito del RF. Los estados de fase posterior y de política propuesta se conservan: HU-09/HU-22 corresponden a RF posteriores; las reglas comerciales de HU-56 y HU-62 no quedan aprobadas por esta tabla.

**Cobertura funcional parcial detectada:**

- **HU-16:** RF-22 y RF-24 cubren reservas y estados de sesión, pero no especifican con precisión qué información constituye «registrar el desarrollo» de una sesión. El alcance de ese registro requiere aclaración; no se infiere asistencia ni un modelo de datos.
- **HU-51:** RF-96 exige persistencia antes de confirmar respuestas académicas y RF-69 explicita estados local/no sincronizado/confirmado únicamente para Studio. Falta un requisito que defina la identificación de cambios pendientes de aprendizaje fuera de Studio; la cobertura de HU-51 es parcial.

### Justificación individual de los RF sin asociación directa

| RF | Relación cercana examinada | Justificación para no crear una asociación directa | Clasificación |
|---|---|---|---|
| RF-02 | HU-01 y HU-41 describen registro y selección de cuenta; RF-01 cubre registro. | Ninguna de esas historias solicita inicio/cierre de sesión, recuperación de credenciales o verificación de correo. Asociarlas a toda la capacidad de RF-02 exageraría la cobertura. | Requisito funcional definido, sin HU de ciclo de credenciales; producto decide si necesita una historia específica. |
| RF-30 | HU de cuentas, reservas, suscripciones y operaciones económicas son contextos posibles. | Ninguna HU activa pide explícitamente avisos o preferencias de notificación. La lista de eventos de RF-30 no demuestra por sí sola una necesidad de usuario trazada. | Requisito funcional transversal sin solicitud explícita; decisión de producto si requiere HU. |
| RF-54 | HU-01 y HU-41 tratan registro y tipo de cuenta; RF-54 fija umbrales de edad y salvaguardas. | Las historias no solicitan ni especifican mayoría de edad, consentimiento parental o elegibilidad del Estudiante universitario para tutorías. La relación se mantiene en RF, restricciones y decisiones de protección, no se infiere desde el registro. | Regla de elegibilidad/salvaguarda definida, sin HU directa. |
| RF-62 | HU-53 menciona licencias y autorizaciones diferenciadas para recuperar o entrenar modelos. | HU-53 no especifica la prohibición de usar datos identificables de menores ni el consentimiento/base jurídica diferenciados por edad. Vincularlas como equivalentes ocultaría esa obligación específica. | Requisito de privacidad definido, sin HU directa; sus condiciones siguen sujetas a las fuentes de privacidad aprobadas. |
| RF-65 | No se identificó una HU de usuario que describa el entorno PostgreSQL local y su migración a un servicio administrado. | El requisito describe compatibilidad de desarrollo/operación y migraciones, no comportamiento observable de una historia de usuario. | Requisito técnico de plataforma; no se fuerza una HU. |
| RF-66 | EQ-02 vincula disponibilidad con RF-30 y RF-66. | La continuidad ante fallas de correo, IA o publicidad es una propiedad transversal del sistema; ninguna HU la solicita como comportamiento independiente. | Requisito de resiliencia/operación; trazabilidad vía AC/EQ, no HU. |
| RF-72 | EQ-21 vincula recuperación de respaldos y colas con RF-72. | Ejecutar procedimientos de restauración y recuperación antes de operar flujos críticos es una tarea interna del equipo, no una interacción descrita por una HU. | Requisito operativo; trazabilidad vía AC/EQ, no HU. |
| RF-91 | HU-42 y HU-73 piden subir archivos/fuentes privadas; RF-101/102 describen espacios y fuentes. | Esas historias justifican administrar fuentes, pero no solicitan directamente almacenamiento de objetos, referencias en cola, reintentos, deduplicación o DLQ. RF-91 es un mecanismo técnico que puede habilitarlas; no se presenta como cobertura semántica directa. | Requisito de infraestructura/procesamiento; relación de apoyo, no asociación directa. |
| RF-94 | EQ-29 vincula caché/contadores temporales y degradación con RF-94. | Redis, sus TTL e invalidación son decisiones de plataforma; ninguna HU pide ese mecanismo, y el requisito explícitamente excluye que sea fuente oficial de saldos. | Requisito técnico transversal; trazabilidad vía AC/EQ, no HU. |

Estos nueve casos son **requisitos existentes sin HU directa**, no prueba de una necesidad de usuario sin requisito funcional. Por separado, HU-16 y HU-51 siguen con cobertura funcional parcial, según el análisis anterior. RF-02 y RF-30 mantienen abierta la decisión de producto sobre si conviene añadir historias específicas; no se inventan ni se vinculan historias en esta auditoría.

**Restricciones aplicables a los atributos de calidad:** los EQ heredan las restricciones vinculadas a su AC; la asociación no implica que cada RC aplique a todos los escenarios del atributo.

| AC | EQ relacionados | RC aplicables |
|---|---|---|
| AC-01 Rendimiento | EQ-01, EQ-14, EQ-15, EQ-23, EQ-26, EQ-34 | RC-25, RC-32, RC-37, RC-46 |
| AC-02 Disponibilidad | EQ-02, EQ-14, EQ-19, EQ-20, EQ-21, EQ-26, EQ-29, EQ-30, EQ-31 | RC-23, RC-25, RC-34, RC-37, RC-39 |
| AC-03 Escalabilidad | EQ-03, EQ-14, EQ-15, EQ-26 | RC-25, RC-32, RC-37, RC-46 |
| AC-04 Seguridad | EQ-04, EQ-12, EQ-17, EQ-22, EQ-32, EQ-35, EQ-38, EQ-42, EQ-43, EQ-44 | RC-07, RC-08, RC-18–RC-20, RC-26, RC-36, RC-39, RC-41, RC-42, RC-44 |
| AC-05 Mantenibilidad | EQ-05, EQ-16, EQ-36 | RC-02, RC-23, RC-24, RC-37 |
| AC-06 Integridad y consistencia | EQ-06, EQ-13, EQ-15, EQ-20, EQ-21, EQ-24, EQ-25, EQ-29, EQ-31, EQ-36, EQ-37, EQ-39, EQ-40, EQ-41, EQ-42 | RC-30, RC-32–RC-34, RC-39, RC-40, RC-46 |
| AC-07 Usabilidad | EQ-07, EQ-12, EQ-18, EQ-23, EQ-27, EQ-34 | RC-01, RC-10, RC-27, RC-31, RC-42 |
| AC-08 Interoperabilidad | EQ-08, EQ-40 | RC-05, RC-24, RC-37, RC-39 |
| AC-09 Testabilidad | EQ-09, EQ-16, EQ-37 | RC-02, RC-23, RC-25, RC-37 |
| AC-10 Operabilidad y eficiencia económica | EQ-10, EQ-19, EQ-24, EQ-25, EQ-27, EQ-28, EQ-30, EQ-31, EQ-36, EQ-39, EQ-41, EQ-45 | RC-25, RC-29–RC-35, RC-37–RC-42, RC-45 |
| AC-11 Confiabilidad pedagógica y gobernanza de fuentes | EQ-11, EQ-16, EQ-17, EQ-32, EQ-33, EQ-35, EQ-37 | RC-11, RC-15–RC-19, RC-44, RC-47 |

## 1. Escenarios de calidad

| EQ | AC | RF principales | DA | ADR | Componente | Pruebas | Evidencia |
|---|---|---|---|---|---|---|---|
| EQ-01 | AC-01 | RF-05 | DA-01, DA-02 | 006, 012, 013, 074 | C02 catálogo; CDN | K6-01, API-01, CAC-01 | Pendiente |
| EQ-02 | AC-02 | RF-30, RF-66 | DA-07, DA-23 | 008, 022, 054 | C01 avisos | FAL-06 | Pendiente |
| EQ-03 | AC-03 | RF-10, RF-91 | DA-01 | 013, 037 | Workers; BD | K6-02 | Pendiente |
| EQ-04 | AC-04 | RF-04, RF-11 | DA-03 | 004, 033 | C01 sesiones | SEC-01, SEC-04, SEC-06, CAC-02 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-05 | AC-05 | RF-06, RF-67 | DA-05, DA-25 | 001, 002, 073, 075 | Todos | ARQ-01, MIG-01–04 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-06 | AC-06 | RF-22, RF-23, RF-75 | DA-04, DA-06 | 007, 043, 048 | C04 reservas; C05 | CON-01, K6-05 | Pendiente |
| EQ-07 | AC-07 | RF-33, RF-34 | DA-10 | 074 | Web/PWA | UX-01, UI-09 | Pendiente |
| EQ-08 | AC-08 | RF-26, RF-27 | DA-12 | 005, 042, 082 | C05 `PaymentPort` | API-01, CON-03 | Pendiente |
| EQ-09 | AC-09 | RF-07, RF-08 | DA-11, DA-12 | 002, 018 | C03 | UNI-01 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-10 | AC-10 | RF-44, RF-84 | DA-13, DA-31 | 053, 077, 080 | C06 presupuestos | API-09, API-17, COS-01–03 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-11 | AC-11 | RF-41, RF-42 | DA-15, DA-17 | 019, 026, 065, 076 | C06 RAG | RAG-SEC-01–05, INY-01–07, API-18, BP-07 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-12 | AC-07, AC-04 | RF-40, RF-98 | DA-16 | 025, 086 | C07 | UI-01 | Pendiente |
| EQ-13 | AC-06 | RF-28, RF-38 | DA-18, DA-29 | 052, 081 | C05 pagos directos | CON-04 | Pendiente |
| EQ-14 | AC-01/02/03 | RF-36, RF-37, RF-48 | DA-14, DA-27 | 015, 016, 024 | C04 sala | PIL-01 | Pendiente |
| EQ-15 | AC-01/03/06 | RF-10, RF-96 | DA-02, DA-06, DA-20 | 006, 030 | C03 intentos | K6-03 | Pendiente |
| EQ-16 | AC-05/09/11 | RF-50 | DA-11, DA-20 | 018, 030 | C03 plan | UNI-02 | Pendiente |
| EQ-17 | AC-04/11 | RF-51 | DA-03, DA-20 | 030 | C03, C02 | SEC-06, CON-05 | Pendiente |
| EQ-18 | AC-07 | RF-52 | DA-10, DA-20 | 074 | Web/PWA | UX-02 | Pendiente |
| EQ-19 | AC-02/10 | RF-63, RF-64 | DA-23 | 020, 036, 054 | Operación | FAL-01 | Pendiente |
| EQ-20 | AC-02/06 | RF-96 | DA-19, DA-23 | 022, 054 | BD | FAL-02, FAL-03 | Pendiente |
| EQ-21 | AC-02/06 | RF-72 | DA-23 | 022, 036 | Respaldos | FAL-08, PR-INF-03 | Pendiente |
| EQ-22 | AC-04 | RF-01, RF-53, RF-54 | DA-21 | 034, 070 | C01, C04 | SEC-06, API-13, UI-08 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-23 | AC-01/07 | RF-69 | DA-22, DA-28 | 035 | Studio | E2E-01 | Pendiente |
| EQ-24 | AC-06/10 | RF-74, RF-75 | DA-26, DA-29 | 048, 080 | C05 recursos | CON-01, CON-02, K6-05 | Pendiente |
| EQ-25 | AC-06/10 | RF-78, RF-97 | DA-18 | 055, 081 | C05 comisiones | CON-04 | Pendiente |
| EQ-26 | AC-01/02/03 | RF-77, RF-89 | DA-27 | 045, 046, 081 | C04 sala | PIL-01 | Pendiente |
| EQ-27 | AC-07/10 | RF-82, RF-83 | DA-28 | 080, 088 | Studio; C05 | API-10, API-11, SEC-02, UI-03 | Pendiente |
| EQ-28 | AC-10 | RF-79, RF-80 | DA-26 | 049, 081 | C05 viabilidad | UNI-03 | Pendiente |
| EQ-29 | AC-02/06 | RF-94, RF-95 | DA-23 | 012 | Redis | FAL-04, API-08, K6-04 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-30 | AC-02/10 | RF-61 | DA-31 | 068, 077 | C06 | API-09, FAL-05, FAL-09 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-31 | AC-02/06/10 | RF-27, RF-92 | DA-29 | 043, 052, 082 | C05 conciliación | CON-03, FAL-07 | Pendiente |
| EQ-32 | AC-04/11 | RF-101, RF-102 | DA-32 | 076, 090 | C02 espacios; C06 RAG | RAG-SEC-06 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-33 | AC-11 | RF-42 | DA-32 | 078 | C06 orquestador | TUT-01–03, API-18 | Parcial local; véanse sección 2 y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); umbral completo pendiente |
| EQ-34 | AC-01/07 | RF-106, RF-108 | DA-32 | 083 | C02 lienzo; Web/PWA | PIZ-01, K6-07, UI-10 | Pendiente |
| EQ-35 | AC-04/11 | RF-107 | DA-32 | 083 | C02 lienzo; C06 | PIZ-02, PIZ-03, UI-11, UI-12 | Pendiente |
| EQ-36 | AC-05/06/10 | RF-109–RF-111 | DA-33 | 084 | C02 biblioteca; C06 | BIB-01–03, UI-13 | Pendiente |
| EQ-37 | AC-06/09/11 | RF-103–RF-105 | DA-35 | 092 | C03; C06 | EVA-01–03, UI-14 | Pendiente |
| EQ-38 | AC-04 | RF-120 | DA-34 | 085 | C06 BYOK | BYK-01–03, UI-15 | Pendiente |
| EQ-39 | AC-06/10 | RF-119 | DA-34 | 086 | C07; C05 | PUB-01–03, UI-16 | Pendiente |
| EQ-40 | AC-06/08 | RF-121, RF-122 | DA-29 | 082 | C05 Culqi | CUL-01–05 | Pendiente |
| EQ-41 | AC-06/10 | RF-115, RF-116 | DA-27, DA-29 | 081 | C04; C05 saldo audiovisual | AUD-01–03, UI-17 | Pendiente (EQ no acreditado); devolución del saldo no utilizado aprobada, distribución contractual de costos pendiente (IM §15.3 y §19.4) |
| EQ-42 | AC-04/06 | RF-112 | DA-32 | 079 | C06 conversaciones | RET-01, RET-02, UI-05 | Pendiente |
| EQ-43 | AC-04 | RF-100 | DA-35 | 089 | C01 perfil académico | EDA-01, EDA-02 | Pendiente |
| EQ-44 | AC-04 | RF-117 | DA-27 | 087 | C04 grupos | GRU-01, GRU-02 | Pendiente |
| EQ-45 | AC-10 | RF-44, RF-86 | DA-26, DA-31 | 080 | C06; C05 | COS-04 | Pendiente |

**Trazabilidad de la instrucción maestra:** la correspondencia acuerdo → RF → ADR → documento → persistencia → contrato → EQ y prueba está en el [registro de continuidad](../00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md), sección 9.


## 2. Primer alcance implementable: criterio, responsable y evidencia

Prioridad operativa del alcance ya autorizado: I-0 y MVP vertical del Sprint 03. El responsable indica el módulo propietario, no una persona asignada. No se declaran completos los RF que incluyen edad, recuperación, OCR o modos aún no implementados. La prioridad de entregas posteriores se determina al seleccionar su incremento del SDD §22.

| RF / alcance | Responsable y prioridad | Criterio de aceptación observable | Contrato / datos | Prueba ejecutable y estado |
|---|---|---|---|---|
| RF-01, RF-02: registro y sesión local | M1; Crítica I-0/I-1 | Registro/login correctos conservan cookie; origen o token inválido devuelve 403; el 31.º intento por correo devuelve 429; límites por cuenta e IP se comparten entre instancias | `/auth/registro`, `/auth/login`, `/auth/logout`, `/auth/csrf`; `m1_users.users`, `user_sessions`, `auth_rate_limits` | [Autenticación real](../../backend/src/modules/usuarios-admin/tests/autenticacion-segura.integration.test.ts), [CSRF](../../backend/src/shared/tests/csrf.unit.test.ts). PostgreSQL 4/4, CSRF 7/7 y Workerd 5/5; navegador confirma cookie, preflight y revocación (EVI-027/028). Correo verificado, recuperación, edad y consentimiento pendientes |
| RF-04, RF-41: autorización y fuentes privadas | M1/M2/M6; Crítica I-1/I-2 | Un usuario no puede leer espacios, fuentes ni conversaciones de otro; respuesta 404 sin revelar existencia | `/espacios/{id}`, fuentes autorizadas M2, conversaciones M6 | [MVP vertical](../../backend/src/tests/mvp-vertical.integration.test.ts). 22/22 local con datos sintéticos; denegación 404 comprobada. Alcance completo de roles/edad pendiente (EVI-030) |
| RF-12, RF-14: derechos y períodos | M5; Crítica I-0 | Periodos simultáneos incompatibles no coexisten; repetición idéntica no duplica; reservas no exceden cuota | `PlanResourcesPort`; `resource_balances`, `resource_ledger_entries`; migración `0002` | [P0 M5](../../backend/src/modules/suscripciones-pagos/tests/idempotencia-p0.integration.test.ts). 12/12 PostgreSQL: solapes, idempotencia, cuota y atomicidad (EVI-029) |
| RF-42: Tutor sobre fuentes propias | M6; Alta I-2 | Respuesta persistida con citas autorizadas; una consulta consume una vez; fallo no confirma éxito ficticio; timeout queda `INCIERTA`, rechazo explícito `FALLIDA` y salida truncada `PARCIAL` | `/tutor-ia/consultas`; índice RAG, conversaciones y recursos M5 | [MVP vertical](../../backend/src/tests/mvp-vertical.integration.test.ts). 22/22 local: timeout retiene presupuesto estimado, rechazo devuelve presupuesto y M5 libera recurso; respuesta parcial queda etiquetada. Simulación/embeddings sintéticos; calidad pedagógica y BP-07 pendientes (EVI-030) |
| RF-44: control de consumo técnico | M6; Crítica I-0/I-2 | Presupuesto insuficiente devuelve 429 antes de invocar proveedor y libera reserva M5; fallos siguen sus estados definidos | `ai_budgets`, `ai_usage_records`; orquestación §10.4–10.5 | [MVP vertical](../../backend/src/tests/mvp-vertical.integration.test.ts). 22/22, incluido proveedor no invocado y reserva liberada; costo facturado y alertas operativas pendientes (EVI-030) |
| RF-06, RF-67: integridad de arquitectura y esquema | Todos; Crítica I-0 | Cero infracciones de capas/ciclos; migraciones desde vacío sin deriva | `eslint.config.mjs`, Drizzle Kit y outbox/inbox | [ARQ-01](../../tests/arquitectura/arq-01.test.ts), [MIG-04](../../backend/scripts/verificar-migraciones.mjs). ARQ 6/6 y MIG-04 13/13 local; CI remoto y reinstalación limpia no ejecutados (EVI-030) |
| I-0: runtime OpenNext/Worker y observabilidad | Plataforma; Crítica I-0 | PR-INF-01 se ejecuta en Workerd; humo E2E recorre frontend→API; las respuestas conservan `X-Request-Id`; alertas/tableros se habilitan antes de operar | `.github/workflows/ci.yml`, `backend/tests-workers/`, `scripts/humo-e2e.mjs`, `/api/v1/salud` | PR-INF-01 local 5/5 y `X-Request-Id` comprobado (EVI-030). Build OpenNext del 26/11 compiló y pasó TypeScript, pero falló al empaquetar por `EPERM` creando symlink en Windows; WSL tampoco permitió el build (sin Node y fallo de sesión systemd). Humo E2E y CI remota no ejecutados; alertas/tableros pendientes (EVI-037) |

Los nombres de pruebas en la matriz EQ son requisitos de verificación. Los enlaces de esta sección identifican código ejecutable; los resultados fechados se registran una sola vez en [EVIDENCIAS](../_auditoria/EVIDENCIAS.md). La evidencia de un recorrido no aprueba automáticamente el RF completo ni todos los EQ relacionados.

## 3. Procedencia y contraste con materiales docentes

Contraste realizado durante la auditoría del 21–22/11 e incorporado el 25/11/2026. Clases en `E:\Semestre_2026_II\teoria\Arquitectura de software`; libros en su subcarpeta `libros`; sílabo en Descargas. Las ubicaciones son páginas del PDF o diapositivas, no páginas inventadas del libro. Se revisaron las siete hojas de contacto de los PPT y secciones dirigidas de los libros; no se afirma lectura integral ni cumplimiento de una rúbrica desconocida.

| Fuente / ubicación | Criterio aplicado | Decisión y evidencia de Mentelyx | Validación pendiente |
|---|---|---|---|
| `IntroArquitectura.pptx`, diap. 12–20 | Saturación, recursos y puntos de fallo | Aplicado: [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) §§1/9; EQ-01–03 | Carga y recuperación medidas |
| `Diseño y Arquitectura.pptx`, diap. 2–6 | Estructura e interacciones, alto y bajo nivel complementarios | Aplicado: [C4 niveles 1–4](../04-modelo-c4/); [diseño interno M1–M7](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md); ADR-073 | Mantener vistas sincronizadas al ampliar código |
| `diseno_Alto_bajo nivel.pptx`, diap. 2–10 y 16–26 | Vistas macro, detalle funcional y compromisos de calidad | Aplicado: [drivers](../01-analisis-de-sistema/06-drivers-arquitectonicos.md), [ADR](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md), [API](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md) y escenarios EQ | Prueba experimental de los umbrales |
| `diseno_Inicio.pptx`, diap. 11–15 | Usuarios/crecimiento, lecturas/escrituras, datos críticos, latencia y costo | Aplicado: [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) §9 y [persistencia](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) §6 | Sustituir supuestos por mediciones de piloto |
| `Monolito_vs_Microservicios.pptx`, diap. 5–14 y 24–29 | Distribuir solo con necesidad y equipo que lo justifiquen | Aplicado: monolito modular, ADR-073 y [ARQ-01](../../tests/arquitectura/arq-01.test.ts) | Extracción futura solo por evidencia |
| `sem4.pptx`, diap. 2–8, 12–15, 21, 23–28 | DNS/TLS, latencia, disponibilidad y estado compartido | Aplicado: [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md), sesiones SQL y ADR-074/075 | Topología pública, disponibilidad y carga |
| `base de datos.pptx`, diap. 5–12, 17 y 22–23 | Accesos y modelo antes que motor; transacciones | Aplicado: [persistencia](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), ADR-075/076 y restricción de solape M5 | Distribución real de carga y planes de ejecución |
| Cervantes y colaboradores, `Arquitectura De Software.pdf`, PDF 38/61/99/118 (impresas 19/42/80/99) | Aceptación, ADD, riesgos/compromisos y verificación | Aplicado: [drivers](../01-analisis-de-sistema/06-drivers-arquitectonicos.md), ADR, [evaluación](./01-evaluacion-de-atributos-de-calidad.md) inspirada en ATAM y estrategia de pruebas | Taller formal con interesados si se requiere; no se afirma realizado |
| Blancarte, `Introducción a la arquitectura de software.pdf`, PDF 55/60/113 | Acoplamiento, cohesión y encapsulación | Aplicado: puertos e interfaces en [diseño interno](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md); [ARQ-01](../../tests/arquitectura/arq-01.test.ts) | Mantener las reglas conforme crezca el sistema |
| `Silabo_IS488_Arquitectura_de_Software.pdf`, PDF 1–2 | Desarrollo incremental, documentación y demostración | Aplicado: [SDD §§22–23](../06-SDD/documento-de-diseño-de-software.md), trazabilidad y MVP local | Sustentación y criterios dependientes de despliegue |

En las ubicaciones revisadas no se registra un descarte de criterio específico; los criterios seleccionados se muestran como aplicados y las validaciones pendientes se separan por fila. Estas fuentes no son mandatos: no se añaden patrones ni tecnologías solo por aparecer en clase. Los PDF de Drive inventariados solo por metadatos no se usan como evidencia de contenido. La revisión de libros fue dirigida, no integral; no se afirma cobertura de secciones no citadas.
