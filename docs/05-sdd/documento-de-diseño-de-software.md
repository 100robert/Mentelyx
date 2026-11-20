# Documento de diseño de software (SDD) — Mentelyx

> **Versión:** 1.0 — 20/11/2026 · **Sprint:** 02, cierre de diseño de arquitectura y evaluación de atributos de calidad
> **Estado:** SDD consolidado para iniciar la construcción. Es un documento de diseño: **no hay código, migraciones, despliegues ni pruebas ejecutadas**. Toda prueba citada está en estado **Pendiente**.
> **Método:** consolida por referencia los documentos vigentes; solo desarrolla aquí lo que no existía: evaluación inspirada en ATAM (sección 8), trazabilidad por escenario (sección 9), estrategia de verificación (sección 10), criterios docentes (sección 11), bloqueos (sección 12), backlog (sección 13) y definición de terminado (sección 14).

## 1. Introducción

### 1.1. Propósito y alcance

Describir de forma única y navegable la arquitectura y el diseño de Mentelyx, con estas condiciones fijas:
- plataforma educativa web/PWA de **siete módulos** (M1–M7) en un **monolito modular** con **Clean Architecture**;
- **dos cuentas públicas**, Estudiante y Docente, y un Superadministrador interno;
- Studio es una funcionalidad, no una cuenta.

Destinatarios: equipo de desarrollo, docentes evaluadores del curso y responsables de producto.

### 1.2. Documentos fuente y versión vigente

| Área | Documento | Versión |
|---|---|---|
| Visión, producto y estado | [README](../../README.md) | 2.1 |
| Análisis | [Actores](../01-analisis-de-sistema/01-actores.md), [HU](../01-analisis-de-sistema/02-historias-del-usuario.md), [RF](../01-analisis-de-sistema/03-requisitos-funcionales.md), [AC](../01-analisis-de-sistema/04-atributos-de-calidad.md), [RC](../01-analisis-de-sistema/05-restricciones.md), [DA](../01-analisis-de-sistema/06-drivers-arquitectonicos.md) | Vigentes |
| Decisiones | [ADR-001–ADR-073](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md) | 2.3 |
| Escenarios de calidad | [EQ-01–EQ-31](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md) | Vigente |
| Arquitectura | [Inicial](../02-arquitectura-software/arquitectura-inicial.md), [estilo](../02-arquitectura-software/estilo-arquitectonico.md), [enfoque](../02-arquitectura-software/enfoque-arquitectonico.md), [componentes](../02-arquitectura-software/componentes-arquitectonicos.md), [seguridad](../02-arquitectura-software/seguridad-y-autenticacion.md), [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) | Seguridad 1.0; infraestructura 1.0 |
| Diseño externo | [Persistencia](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), [API y contratos](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md), [interfaces y flujos](../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) | 2.1 / 2.1 / 2.1 |
| Diseño interno | [Módulos](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md), [principios SOLID](../03-diseño-de-software/diseño-interno/principios-de-diseño.md), [patrones](../03-diseño-de-software/diseño-interno/patrones-de-diseño.md) | 3.2 / vigente / vigente |
| Diseño especializado | [Tutor IA](../03-diseño-de-software/diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md), [RAG](../03-diseño-de-software/diseño-especializado/02-diseño-rag.md), [motor visual](../03-diseño-de-software/diseño-especializado/03-motor-visual-y-pizarra.md), [3D](../03-diseño-de-software/diseño-especializado/04-visualizaciones-3d.md), [materiales](../03-diseño-de-software/diseño-especializado/05-generacion-de-materiales-educativos.md), [calidad IA](../03-diseño-de-software/diseño-especializado/06-calidad-ia-criterios-y-pruebas.md), [registro](../03-diseño-de-software/diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md) | 1.1 |
| Coordinación | [Contrato datos/seguridad/infraestructura](../03-diseño-de-software/contrato-coordinacion-datos-seguridad-infraestructura.md) | 1.0 |
| C4 | [Nivel 1](../04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md), [nivel 2](../04-modelo-c4/Nivel2-DiagramadeContenedores.md), [nivel 3](../04-modelo-c4/Nivel3-DiagramadeComponentes.md), [nivel 4](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) | Vigentes |
| Continuidad | [Registro de avance](../avance-cierre-arquitectonico-sprint-02.md) | Vigente |

Si este SDD y un documento fuente discrepan, prevalece el documento fuente y se corrige este SDD.

### 1.3. Convenciones de estado

- **Decisiones** ([ADR, sección 10](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md)):
  - DECIDIDA;
  - DIFERIDA;
  - BLOQUEADA PARA PRODUCCIÓN: se construye, pero no se activa sin su condición;
  - REQUIERE DECISIÓN DE PRODUCTO.
- **Pruebas:**
  - **Pendiente:** diseñada, no ejecutada.
  - **Simulada:** ejecutada con dobles de proveedores o datos sintéticos.
  - **Pasada / Fallida:** ejecutada en el entorno acordado y registrada según la [política de aceptación](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md) (sección 4): fecha, commit, entorno, carga, datos, evidencia anonimizada, tasa de éxito, costo y responsable.
- **Al 20/11/2026 todas las pruebas están en Pendiente.**

## 2. Problema y contexto

Mentelyx atiende a estudiantes de Primaria a Universidad y a docentes con:
- contenidos versionados y evaluaciones con preparación para exámenes;
- Tutor IA con fuentes autorizadas;
- Studio de autoría;
- aulas Live de hasta 35 + 1;
- planes y créditos separados (Live y Studio).

Las restricciones que más pesan en el diseño son la protección de menores, el costo variable de la IA y del video, y la operación con poco personal.

Referencias: [README, secciones 1–4](../../README.md), [actores](../01-analisis-de-sistema/01-actores.md), [HU-01–HU-70](../01-analisis-de-sistema/02-historias-del-usuario.md), [RF-01–RF-99](../01-analisis-de-sistema/03-requisitos-funcionales.md) y [RC-01–RC-37](../01-analisis-de-sistema/05-restricciones.md).

## 3. Atributos, drivers y prioridades

Las prioridades vigentes ([AC, sección 2](../01-analisis-de-sistema/04-atributos-de-calidad.md)) son:
- **Críticas:** AC-02 disponibilidad, AC-04 seguridad y AC-06 consistencia.
- **Altas:** AC-01, AC-03, AC-05, AC-07, AC-08, AC-09, AC-10 y AC-11.

Los drivers DA-01–DA-31 y su relación con las ADR están en [drivers](../01-analisis-de-sistema/06-drivers-arquitectonicos.md). Los umbrales de los EQ se conservan sin cambios; las cifras siguen siendo **propuestas** hasta medirlas.

## 4. Decisiones arquitectónicas

[ADR-001–ADR-073](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md). Resumen de cierre:
- **Sección 10.1:** cada decisión condicionada, con su clasificación, contingencia y criterio de reconsideración.
- **Sección 10.2:** ADR-073 (herramientas de construcción).
- **Sección 10.3:** preguntas P-01 a P-11 para producto.
- **Sección 10.4:** banderas legales.

No quedan alternativas sin selección ni sin criterio de sustitución.

## 5. Diseño de alto nivel (HLD)

| Vista | Contenido | Referencia |
|---|---|---|
| Estilo y enfoque | Monolito modular en capas, Clean Architecture con puertos y adaptadores, despliegue serverless-first parcialmente híbrido | [Estilo](../02-arquitectura-software/estilo-arquitectonico.md), [enfoque](../02-arquitectura-software/enfoque-arquitectonico.md) |
| Contexto (C4-1) | Personas y sistemas externos; proveedores concretos en el texto | [Nivel 1](../04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md) |
| Contenedores (C4-2) | Web/PWA (Next.js estático en Pages), API Hono en Workers, colas, PostgreSQL/Neon + pgvector, MongoDB Atlas, Redis Upstash, R2, Bunny, SFU | [Nivel 2](../04-modelo-c4/Nivel2-DiagramadeContenedores.md), [infraestructura, sección 1](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) |
| Componentes (C4-3) | C01–C07 por módulo | [Nivel 3](../04-modelo-c4/Nivel3-DiagramadeComponentes.md), [componentes](../02-arquitectura-software/componentes-arquitectonicos.md) |
| Despliegue y entornos | Local, CI, staging y producción separados; DNS/CDN/TLS; colas | [Infraestructura, secciones 2 y 4](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) |

| Módulo | Responsabilidad | Datos (persistencia, sección 13) | Contratos públicos |
|---|---|---|---|
| M1 Usuarios y Administración | Cuentas, autenticación, sesiones, control de acceso, auditoría, avisos, soporte | Sección 13.1 | `obtenerUsuarioAutenticado`, `verificarPermiso`, `registrarHabilitacionAprobada` |
| M2 Cursos y Contenidos / Studio | Catálogo, versiones, licencias, revisión editorial, Studio, exportaciones | Sección 13.2 | `consultarTemarioVersionado`, `listarRecursosConsultables`, `verificarLicenciaYAcceso`… |
| M3 Evaluaciones y Aprendizaje | Evaluaciones, intentos, dominio por tema, objetivos y planes | Sección 13.3 | `consultarProgresoAutorizado`, `consultarRestriccionesTutor` |
| M4 Docentes y Clases | Perfiles, habilitación, clases, reservas, asistencia, grabaciones | Sección 13.4 | `buscarOfertasTutoria`; consume M1, M5 y M7 |
| M5 Suscripciones y Pagos | Planes, pagos, derechos, créditos, liquidaciones, costos | Sección 13.5 | `consultarDerecho*`, `reservarCreditoLive`…, `cotizar/consumir/reembolsarOperacionStudio` |
| M6 Tutor IA y RAG | Orquestación, cuotas, RAG autorizado, conversaciones | Sección 13.6 | Consume M2, M3, M4 y M5; eventos de Studio |
| M7 Publicidad y Patrocinios | Campañas, ubicaciones, creatividades, fondos de aulas | Sección 13.7 | `reservar/confirmar/liberarFinanciamientoAula` |

Todos los contratos están en [API, sección 2.8](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md) y en el [diseño interno, sección 10.1](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md). No hay ciclos de importación.

## 6. Diseño de bajo nivel (LLD)

| Tema | Referencia |
|---|---|
| Paquetes M1–M7, UML de M5 y M6, código de referencia | [Diseño interno v3.2](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md), [C4 nivel 4](../04-modelo-c4/Nivel4-DiagramadeCodigo.md), [SOLID](../03-diseño-de-software/diseño-interno/principios-de-diseño.md), [patrones](../03-diseño-de-software/diseño-interno/patrones-de-diseño.md) |
| Endpoints, DTO, SSE, trabajos, errores, autorización | [API v2.1](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md) |
| Modelo conceptual, lógico y físico; MongoDB, Redis, R2, vectorial; matriz y ER por módulo | [Persistencia v2.1](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), secciones 2, 7–9 y 13–15 |
| Tutor IA, RAG, motor visual, 3D, materiales | [Diseño especializado](../03-diseño-de-software/diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md) 01–05 |
| Recorridos, estados, accesibilidad y PWA | [Interfaces v2.1](../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) |

## 7. Vistas transversales

| Tema | Decisión resumida | Referencia |
|---|---|---|
| Seguridad y autenticación | Better Auth con sesiones SQL revocables, CSRF, MFA administrativo, RBAC/ABAC propio, STRIDE e IA, menores, secretos | [Seguridad](../02-arquitectura-software/seguridad-y-autenticacion.md) |
| Escalabilidad frontend | CDN, activos inmutables, carga diferida de 3D y Studio, sin SSR en v1 | [Infraestructura, sección 3](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md); ADR-003 |
| Escalabilidad backend y BD | Workers sin estado, admisión y backpressure, pooling acotado, índices, paginación keyset; réplica solo para datos no sensibles al retraso | Infraestructura, sección 3; persistencia, secciones 6 y 10 |
| DNS, CDN, HTTPS | DNS de Cloudflare, TLS estricto, HSTS, `private, no-store` en datos privados | Infraestructura, sección 2 |
| Caché | CDN para lo público; Redis `cache`/`control` no autoritativo; espacio de nombres por versión del catálogo | [Persistencia, sección 9.3](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) |
| Balanceo | Sin balanceador de orígenes (ADR-037) | Infraestructura, sección 3 |
| Consistencia e idempotencia | ACID local, outbox/inbox, sagas reparables, UNIQUE y locks | Persistencia, sección 10 |
| Recuperación | RTO/RPO por clase, runbook trimestral de restauración | Persistencia, sección 11; infraestructura, sección 6 |
| Observabilidad | Logs y trazas sin PII, métricas en SQL, alertas | Infraestructura, sección 6; ADR-073 |
| CI/CD | Lint/tipos → unitarias/contrato → integración → dependencias → build → staging → revisión humana → promoción | Infraestructura, sección 7; ADR-021/073 |

## 8. Evaluación de la arquitectura inspirada en ATAM

**Alcance del método:** es una evaluación inspirada en ATAM realizada por el arquitecto sobre la documentación. **No es un ATAM formal**: no hubo taller con interesados, votación de escenarios ni presentación del equipo evaluador. Las prioridades salen de AC, sección 2, y los escenarios de EQ-01–EQ-31, sin modificarlos.

### 8.1. Objetivos de negocio que guían la evaluación

| Objetivo | Atributos dominantes |
|---|---|
| OB-1 Aprender con IA confiable y fuentes autorizadas | AC-11, AC-04 |
| OB-2 Proteger a menores y datos personales | AC-04 |
| OB-3 Cobrar, acreditar créditos y liquidar sin errores | AC-06, AC-10 |
| OB-4 Operar con poco personal y costos acotados | AC-10, AC-02, AC-05 |
| OB-5 Usarse en móvil con redes inestables | AC-07, AC-01 |

### 8.2. Árbol de utilidad

Importancia (I) según la prioridad AC; dificultad (D) según la incertidumbre técnica documentada. A = alta, M = media, B = baja.

| Atributo | Refinamiento | Escenario | I | D |
|---|---|---|:-:|:-:|
| Consistencia | Dinero y créditos sin duplicados | EQ-06, EQ-24, EQ-31 | A | A |
| Consistencia | Respuestas académicas no se pierden | EQ-15, EQ-20 | A | M |
| Consistencia | Liquidaciones según versión | EQ-13, EQ-25 | A | M |
| Seguridad | Acceso ajeno denegado; dos cuentas | EQ-04, EQ-22 | A | M |
| Seguridad / pedagogía | RAG sin fuga y con revocación | EQ-11, EQ-17 | A | A |
| Disponibilidad | Falla de API, BD o restauración | EQ-19, EQ-20, EQ-21 | A | A |
| Disponibilidad | Redis o correo caídos | EQ-29, EQ-02 | A | B |
| Rendimiento / escalabilidad | Catálogo y carga escalonada | EQ-01, EQ-03 | A | M |
| Operabilidad | Costo IA y cuotas | EQ-10, EQ-30, EQ-27 | A | M |
| Audiovisual | Aula 35 + 1 | EQ-14, EQ-26 | A | A |
| Economía | Oferta no viable bloqueada | EQ-28 | M | M |
| Usabilidad | Móvil, Studio sin conexión | EQ-07, EQ-18, EQ-23 | M | M |
| Mantenibilidad / testabilidad | Curso nuevo, motor y plan reproducibles | EQ-05, EQ-09, EQ-16 | M | B |
| Interoperabilidad | Contratos externos | EQ-08 | M | B |
| Experiencia | Publicidad no intrusiva | EQ-12 | M | B |

### 8.3. Enfoques arquitectónicos de los escenarios A/A

| Escenario | Enfoque y ADR | Por qué satisface |
|---|---|---|
| EQ-06/24/31 | Ledger SQL con saldo materializado, lock por fila, UNIQUE de operación, lotes FIFO, outbox/inbox, webhook firmado y conciliación (ADR-007/043/048/052) | El doble gasto exige violar un UNIQUE o el CHECK del saldo, que la base rechaza |
| EQ-11/17 | Conjunto consultable de M2, filtro SQL antes del ranking, revalidación previa al modelo y a la entrega, revocación ≤60 s (ADR-026/065) | Un índice atrasado no concede permiso |
| EQ-19/20/21 | Degradación por dependencia, 503 sin confirmaciones falsas, RTO/RPO por clase, restauración con *tombstones* (ADR-022/036/054) | La corrección no depende de Redis ni de la IA |
| EQ-14/26 | SFU administrado fuera de Hono, credenciales por rol (ADR-015/016/045) | El audio y el video no pasan por la API |

### 8.4. Puntos de sensibilidad

| ID | Punto | Escenarios |
|---|---|---|
| S-01 | Latencia API ↔ RTT entre Workers y Neon/Atlas y número de viajes por petición (sesión SQL + consulta) | EQ-01, EQ-03, EQ-15 |
| S-02 | Integridad del saldo ↔ un único lock por `credit_balances` y UNIQUE `operation_key` | EQ-06, EQ-24 |
| S-03 | Fuga RAG ↔ revalidación antes del modelo y de la entrega; latencia del evento de revocación | EQ-11 |
| S-04 | Costo IA ↔ `presupuestoOperacionUSD`, pesos de UTI y tope duro | EQ-10, EQ-30 |
| S-05 | Conexiones de BD ↔ concurrencia de consumidores de colas | EQ-03, EQ-15 |
| S-06 | Continuidad ↔ PostgreSQL como dependencia única de escrituras críticas | EQ-19, EQ-20 |

### 8.5. Compromisos (*trade-offs*)

| ID | Compromiso | Resolución actual |
|---|---|---|
| T-01 | Sesión SQL consultada en cada petición (AC-04, revocación inmediata) frente a latencia (AC-01) | Se prioriza AC-04; se mide en K6-01 |
| T-02 | Persistencia políglota (AC-05) frente a falta de ACID entre motores (AC-06) | Protocolo PENDING→PUBLISHED y conciliación; JSONB como contingencia |
| T-03 | Ejecución del Tutor por cola y lease (AC-02/06) frente a primer token y complejidad (AC-01) | Se acepta; PR-INF-04 |
| T-04 | Monolito modular (AC-05/10) frente a escalado independiente por módulo (AC-03) | Escalado horizontal de Workers; límite en BD |
| T-05 | Sin SSR (costo, simplicidad) frente a primer render y SEO (AC-01/07) | Contingencia y criterio en ADR-003 |
| T-06 | Solo fuentes autorizadas (AC-11) frente a utilidad percibida (AC-07) | P-01 (modo `GENERAL`) |
| T-07 | `SOLO_ZDR` para menores (AC-04) frente a calidad de respuesta (AC-11) | Rutas de Workers AI; BP-03 |
| T-08 | Un solo proveedor principal de plataforma (AC-10) frente a riesgo de proveedor (AC-02) | Riesgo aceptado con criterio (persistencia, sección 9.4) |

### 8.6. Riesgos, no riesgos y temas de riesgo

| ID | Riesgo | Mitigación / verificación |
|---|---|---|
| R-01 | Caída de Neon detiene las escrituras críticas (región única) | Degradación, RTO 2 h, FAL-02, PR-INF-03; riesgo aceptado |
| R-02 | Compatibilidad en Workers no probada (hashing de Better Auth, driver Mongo, PptxGenJS, Zod) | PR-INF-01; contingencias de ADR, sección 10.1 |
| R-03 | Aula 35 + 1 y costo por minuto-participante no medidos | PIL-01; contingencia LiveKit |
| R-04 | Calidad pedagógica de los modelos no medida | BP-01 a BP-07; rutas desactivadas hasta superarlos |
| R-05 | Retenciones legales pendientes: el historial del Tutor queda desactivado | PEND-02; banderas de ADR, sección 10.4 |
| R-06 | Respaldos en el mismo proveedor que los originales | Riesgo aceptado con criterio de reconsideración |
| R-07 | Cifras comerciales no aprobadas | P-02 a P-05 |
| R-08 | Sagas M2/M5/M6 y M4/M5/M7 con compensaciones complejas | CON-01 a CON-04, outbox/inbox, conciliación diaria |
| R-09 | El estimador de tokens puede subestimar el costo | COS-01; tope duro y déficit registrado |
| R-10 | Tres PNG desactualizados frente a sus fuentes | Reexportar desde draw.io; documental |

**No riesgos:**
- NR-01: el doble gasto queda impedido por restricciones SQL.
- NR-02: la caída de Redis no compromete la integridad.
- NR-03: los duplicados de las colas son idempotentes.
- NR-04: los datos D3 están aislados en el bucket de M4.
- NR-05: el dominio no depende de proveedores (Clean Architecture con puertos).

**Temas de riesgo:**
1. Dependencia de proveedores aún no probados en el runtime (R-02, R-03).
2. Condiciones legales y de protección de menores (R-05).
3. Economía unitaria sin calibrar (R-07, R-09).

## 9. Trazabilidad RF → DA → ADR → EQ → prueba → evidencia

Ninguna prueba se ha ejecutado, así que la evidencia de todas las filas es **Pendiente**. Los identificadores de prueba se definen en la sección 10 o en el documento indicado (SEC en seguridad, sección 5; API, RAG-SEC, INY, COS, UI y BP en el diseño especializado y en interfaces; PR-INF en infraestructura, sección 8).

| EQ | AC | RF principales | DA | ADR | Pruebas | Nivel |
|---|---|---|---|---|---|---|
| EQ-01 | AC-01 | RF-05 | DA-01, DA-02 | 006, 012, 013 | K6-01, API-01, CAC-01 | k6, contrato |
| EQ-02 | AC-02 | RF-30, RF-66 | DA-07, DA-23 | 008, 022, 054 | FAL-06 | Fallo |
| EQ-03 | AC-03 | RF-10, RF-91 | DA-01 | 013, 037 | K6-02 | k6 |
| EQ-04 | AC-04 | RF-04, RF-11 | DA-03 | 004, 033 | SEC-04, SEC-06 | Integración, E2E |
| EQ-05 | AC-05 | RF-06, RF-67 | DA-05, DA-25 | 001, 002, 073 | ARQ-01, MIG-01 | Estática, integración |
| EQ-06 | AC-06 | RF-22, RF-23, RF-75 | DA-04, DA-06 | 007, 043, 048 | CON-01, K6-05 | Integración, k6 |
| EQ-07 | AC-07 | RF-33, RF-34 | DA-10 | 003 | UX-01, UI-09 | Usabilidad, E2E |
| EQ-08 | AC-08 | RF-26, RF-27 | DA-12 | 005, 042 | API-01, CON-03 | Contrato |
| EQ-09 | AC-09 | RF-07, RF-08 | DA-11, DA-12 | 002, 018 | UNI-01 | Unitaria |
| EQ-10 | AC-10 | RF-44, RF-84 | DA-13, DA-31 | 053, 067 | API-09, API-17, COS-01–COS-03 | Integración |
| EQ-11 | AC-11 | RF-41, RF-42 | DA-15, DA-17 | 019, 026, 065 | RAG-SEC-01–05, INY-01–07, API-18, BP-07 | Integración, IA |
| EQ-12 | AC-07, AC-04 | RF-40, RF-98 | DA-16 | 025 | UI-01 | E2E |
| EQ-13 | AC-06 | RF-28, RF-38 | DA-18, DA-29 | 027, 052 | CON-04 | Integración |
| EQ-14 | AC-01/02/03 | RF-36, RF-37, RF-48 | DA-14, DA-27 | 015, 016, 024 | PIL-01 (incluye acceso no autorizado a la sala) | Piloto |
| EQ-15 | AC-01/03/06 | RF-10, RF-96 | DA-02, DA-06, DA-20 | 006, 030 | K6-03 | k6 + auditoría SQL |
| EQ-16 | AC-05/09/11 | RF-50 | DA-11, DA-20 | 018, 030 | UNI-02 | Unitaria |
| EQ-17 | AC-04/11 | RF-51 | DA-03, DA-20 | 030 | SEC-06, CON-05 | Integración |
| EQ-18 | AC-07 | RF-52 | DA-10, DA-20 | 003 | UX-02 | Usabilidad |
| EQ-19 | AC-02/10 | RF-63, RF-64 | DA-23 | 020, 036, 054 | FAL-01 | Recuperación |
| EQ-20 | AC-02/06 | RF-96 | DA-19, DA-23 | 022, 054 | FAL-02, FAL-03 | Fallo |
| EQ-21 | AC-02/06 | RF-72 | DA-23 | 022, 036 | FAL-08, PR-INF-03 | Recuperación |
| EQ-22 | AC-04 | RF-01, RF-53, RF-54 | DA-21 | 034, 070 | SEC-06, API-13, UI-08 | Integración, E2E |
| EQ-23 | AC-01/07 | RF-69 | DA-22, DA-28 | 035 | E2E-01 | E2E |
| EQ-24 | AC-06/10 | RF-74, RF-75 | DA-26, DA-29 | 047, 048 | CON-01, CON-02, K6-05 | Integración, k6 |
| EQ-25 | AC-06/10 | RF-78, RF-97 | DA-18 | 027, 055 | CON-04 | Integración |
| EQ-26 | AC-01/02/03 | RF-77, RF-89 | DA-27 | 045, 046 | PIL-01 | Piloto |
| EQ-27 | AC-07/10 | RF-82, RF-83 | DA-28 | 050 | API-10, API-11, SEC-02, UI-03 | Integración, E2E |
| EQ-28 | AC-10 | RF-79, RF-80 | DA-26 | 049 | UNI-03 | Unitaria |
| EQ-29 | AC-02/06 | RF-94, RF-95 | DA-23 | 012 | FAL-04, API-08, K6-04 | Fallo, k6 |
| EQ-30 | AC-02/10 | RF-61 | DA-31 | 067, 068 | API-09, FAL-05 | Integración, fallo |
| EQ-31 | AC-02/06/10 | RF-27, RF-92 | DA-29 | 043, 052 | CON-03, FAL-07 | Integración, fallo |

## 10. Estrategia de verificación

### 10.1. Niveles, herramientas y reglas

Herramientas según [ADR-073](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md): Vitest en el pool de Workers, PostgreSQL 17 + pgvector y MongoDB efímeros, Playwright, k6.

| Nivel | Qué verifica | Dónde corre | Puerta |
|---|---|---|---|
| Estática (ARQ-01) | Ciclos de importación, imports fuera del `index.ts`, dominio sin frameworks | CI en cada PR | Bloquea el merge |
| Unitarias (UNI) | Reglas de dominio puras: recomendaciones, plan, viabilidad, cotización, verificador matemático, compilador de escenas | CI en cada PR | Bloquea el merge |
| Integración (CON, CAC, MIG) | Transacciones, locks, UNIQUE, outbox/inbox, adaptadores reales de BD | CI con BD efímeras | Bloquea el merge |
| Contrato (API-01) | Cada endpoint frente a su esquema Zod/OpenAPI; contratos internos del consumidor | CI | Bloquea el merge |
| Seguridad (SEC, RAG-SEC, INY, PII) | Autorización, IDOR, CSRF, revocación, inyección, PII | CI y staging | Bloquea la promoción |
| E2E (UI, E2E) | Recorridos de interfaces (sección 7) y PWA | Staging con datos sintéticos | Bloquea la promoción |
| Carga (K6) | EQ de rendimiento y escalabilidad | Staging aislado | Evidencia de EQ |
| Fallo y recuperación (FAL) | Degradación y restauración | Staging o entorno aislado | Evidencia de EQ |
| Calidad IA (BP, MAT, VIS, 3D, LAT, MEN) | [Calidad IA](../03-diseño-de-software/diseño-especializado/06-calidad-ia-criterios-y-pruebas.md) | CI con respuestas grabadas; BP con presupuesto aprobado | Activa cada ruta |

**Reglas:**
- Solo datos sintéticos; nunca datos reales de estudiantes.
- La CI no llama a proveedores pagados: usa dobles y respuestas grabadas.
- No hay pruebas de carga ni de estrés contra producción.
- Cada ejecución se registra según la política de aceptación.

### 10.2. Plan k6

Las cargas son las vigentes de los EQ. Un usuario virtual (VU) **no equivale a un usuario real**: se documenta el tiempo de espera entre peticiones y la tasa ofrecida. Por ejemplo, 100 VU con una petición cada 5 s ofrecen unas 20 RPS ([persistencia, sección 6.1](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md)). IA y audiovisual quedan fuera de k6: se usan proveedores simulados o el piloto con presupuesto.

| ID | EQ | Escenario k6 | Umbrales (vigentes) | Registro adicional |
|---|---|---|---|---|
| K6-01 | EQ-01 | `constant-vus` 100 durante 10 min; 70 % `GET /api/v1/cursos` con filtros y 30 % detalle; espera 5 s | p95 ≤ 2 s; 5xx < 1 % | Aciertos de caché, p95 SQL, RPS |
| K6-02 | EQ-03 | `ramping-vus` 50 → 100 → 200 (5 min por etapa y 5 min en 200); lectura, lección, evaluación y respuestas | En 200 VU: p95 ≤ 3 s; 5xx < 1 % | Punto de saturación, tiempo de CPU del Worker, conexiones y consultas lentas |
| K6-03 | EQ-15 | 100 VU, simulacro de 30 min: iniciar intento, guardar respuestas periódicamente y entregar | Guardado p95 ≤ 3 s; 5xx < 1 % | Auditoría SQL posterior: 0 respuestas confirmadas perdidas y 0 intentos de otro estudiante |
| K6-04 | EQ-29 | K6-01 con Redis indisponible en staging | 0 operaciones sensibles sin control; lecturas degradadas con control de carga | p95 degradado comparado con K6-01 |
| K6-05 | EQ-06/24 | `shared-iterations` 50 VU contra una sesión de 35 cupos y saldos limitados | Confirmadas ≤ 35; Σ débitos = reservas confirmadas; 0 duplicados | Conflictos y reintentos |
| K6-06 | API-04/17 | 50 consultas concurrentes al Tutor con proveedor simulado | Nunca se supera la cuota ni el tope duro | Rechazos `429` correctos |

```js
// Esquema de K6-01 (diseño; no ejecutado). Solo cuentan los 5xx: un 4xx esperado no es fallo técnico.
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { sleep } from 'k6';
const errores5xx = new Rate('errores_5xx');
export const options = {
  scenarios: { catalogo: { executor: 'constant-vus', vus: 100, duration: '10m' } },
  thresholds: { 'http_req_duration{grupo:catalogo}': ['p(95)<2000'], errores_5xx: ['rate<0.01'] },
};
export default function () {
  const r = http.get(`${__ENV.BASE_URL}/api/v1/cursos?nivel=SECUNDARIA&pagina=1`, { tags: { grupo: 'catalogo' } });
  errores5xx.add(r.status >= 500);
  sleep(5);
}
```

### 10.3. Fallos, duplicación, migración y recuperación

| ID | Caso | Inyección en staging | Resultado esperado | EQ |
|---|---|---|---|---|
| FAL-01 | Worker/API con error | Versión defectuosa o fallo forzado en `/health/ready` | Detección ≤ 5 min, reversión de versión, RTO registrado | EQ-19 |
| FAL-02 | PostgreSQL indisponible | Credencial inválida o endpoint pausado | `503` en operaciones privadas, 0 confirmaciones falsas; lo público en CDN sigue | EQ-20 |
| FAL-03 | MongoDB indisponible | Corte de red al clúster de prueba | No se confirma guardado ni publicación; borrador local visible | EQ-20 |
| FAL-04 | Redis indisponible | Host inválido en ambas bases | Límites en SQL, sin salto de cuota | EQ-29 |
| FAL-05 | IA caída o incierta | Proveedor simulado con timeout antes y después del primer token | `INCIERTA` sin reintento ciego ni cobro duplicado | EQ-30 |
| FAL-06 | Correo caído | Proveedor simulado devuelve 500 | La operación de negocio sigue; aviso FALLIDA y reintentado | EQ-02 |
| FAL-07 | Pago incierto | Webhook retrasado y timeout de la consulta | Orden PENDIENTE; sin cargo nuevo; conciliación | EQ-31 |
| FAL-08 | Restauración | Runbook de [persistencia, sección 11](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) en entorno aislado | RTO/RPO observados; ledger = saldos; *tombstones* reaplicados | EQ-21 |
| SEC-01 | Sesión revocada | Revocar en una instancia y usar en otra | Rechazo inmediato ([seguridad, sección 5](../02-arquitectura-software/seguridad-y-autenticacion.md)) | EQ-04 |
| CON-01 | Reservas concurrentes | N transacciones sobre el mismo cupo | Sin sobrecupo ni doble débito | EQ-06/24 |
| CON-02 | Lotes de créditos | Consumo FIFO y vencimiento concurrentes | Saldo = Σ lotes vigentes | EQ-24 |
| CON-03 | Webhook duplicado o fuera de orden | Repetir y desordenar eventos firmados | Un solo efecto; APROBADA no vuelve a PENDIENTE | EQ-08/31 |
| CON-04 | Liquidación | Repetir el cálculo con un cambio de política posterior | Mismo importe por versión; sin pago doble | EQ-13/25 |
| CON-05 | Ficha de examen | Publicar sin fuente o modificar una ficha publicada | Rechazo; los intentos conservan su versión | EQ-17 |
| CAC-01 | Invalidación de catálogo | Publicar o retirar y consultar | Contenido nuevo tras incrementar `catalog_state` | EQ-01 |
| CAC-02 | No caché de privados | Inspeccionar cabeceras y *service worker* | `private, no-store`; nada privado en la PWA | EQ-04 |
| MIG-01 | Expand-contract | Versiones N y N−1 a la vez durante una migración | Lectura compatible; sin pérdida | EQ-05 |
| MIG-02 | Reversión de aplicación | Volver a N−1 tras expandir el esquema | Funciona sin una migración *down* destructiva | EQ-05 |
| MIG-03 | Eventos y documentos versionados | vN lee `schemaVersion` vN−1 | Sin DLQ por esquema conocido | EQ-05 |
| E2E-01 | Studio sin conexión | Cortar y restablecer la red en 5 casos | Nunca «guardado remoto» sin ACK | EQ-23 |
| UNI-01/02/03 | Motor de recomendaciones, plan y viabilidad | Mismos datos y versión de reglas | Resultado idéntico | EQ-09/16/28 |
| UX-01/02 | Pruebas guiadas | 5 participantes adultos con cuentas sintéticas | ≥ 4 de 5 sin asistencia | EQ-07/18 |
| PIL-01 | Aula 35 + 1 | Cuenta de prueba del SFU con presupuesto aprobado | Aforo, acceso y métricas audiovisuales registrados | EQ-14/26 |
| ARQ-01 | Reglas de dependencia | ESLint en CI | 0 ciclos y 0 imports prohibidos | EQ-05 |

**RTO/RPO explícitos** (metas de diseño no medidas, [persistencia, sección 11](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md)):

| Clase | RPO | RTO |
|---|---|---|
| SQL crítico | ≤ 15 min | ≤ 2 h |
| Mongo, contenido confirmado | ≤ 1 h | ≤ 4 h |
| R2, originales | ≤ 24 h | ≤ 8 h |
| RAG y exportaciones derivadas | La versión fuente recuperada | ≤ 24 h |
| Redis | Sin RPO de negocio | ≤ 30 min |

## 11. Revisión de los 16 criterios docentes

No se asignan puntajes: el repositorio no contiene la rúbrica ni sus ponderaciones.

| # | Criterio | Dónde se cubre | Estado |
|---|---|---|---|
| 1 | Problema | README, secciones 1–3; actores; HU | Documentado |
| 2 | Análisis y diseño | `01-analisis-de-sistema`, `02-arquitectura-software`, `03-diseño-de-software` | Documentado |
| 3 | HLD y LLD | Secciones 5 y 6 de este SDD | Documentado |
| 4 | SDD | Este documento | Consolidado v1.0 |
| 5 | Pruebas unitarias e integración | Sección 10; calidad IA | Diseñadas; no ejecutadas (no hay código) |
| 6 | E2E | UI-01–UI-09, E2E-01, recorridos de interfaces | Diseñadas; no ejecutadas |
| 7 | UI/UX | Interfaces v2.1 | Documentado; UX-01/02 pendientes |
| 8 | Escalabilidad frontend y backend | Infraestructura, sección 3; sección 7 de este SDD | Documentado; K6-02 pendiente |
| 9 | Base de datos | Persistencia v2.1 | Documentado; migraciones no ejecutadas |
| 10 | DNS/CDN | Infraestructura, sección 2 | Documentado; dominio no contratado (P-08) |
| 11 | Caché | Persistencia, sección 9.3; infraestructura, sección 2 | Documentado; CAC-01/02 pendientes |
| 12 | CI/CD | Infraestructura, sección 7; ADR-021/073 | Diseñado; flujo de CI no creado (no existe `.github/`) |
| 13 | k6 | Sección 10.2 | Diseñado; no ejecutado |
| 14 | GitHub | Remoto `origin` en GitHub con historial de commits | Repositorio activo; faltan flujos de CI y reglas de rama |
| 15 | Informe | No existe en el repositorio | Pendiente (responsable del proyecto) |
| 16 | Sustentación | Fuera del repositorio | Pendiente (responsable del proyecto) |

## 12. Bloqueos y pendientes

| Tipo | Pendiente | Efecto |
|---|---|---|
| Producto | [P-01 a P-11](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md) (sección 10.3) | Se construye con los valores recomendados solo en entornos de prueba |
| Legal | PEND-02, PEND-03, consentimiento audiovisual, contratos de tratamiento (banderas de ADR, sección 10.4) | Funcionalidades desactivadas en producción |
| Experimental | PR-INF-01 a 05, BP-01 a 07, PEND-05, PEND-VIS-01/02, PEND-MAT-01, PEND-RAG-01, PIL-01 y todas las pruebas de la sección 10 | Activación de cada ruta, proveedor y EQ |
| Contratación | P-07, P-08 | Producción |
| Documental | Reexportar `m2-secuencia.png`, `m6-secuencia.png` y `principios-solid-m1.png` desde sus fuentes corregidas | Ninguno funcional; los documentos ya muestran el SVG corregido o lo advierten |

**Ningún bloqueo impide iniciar el incremento I-0.**

## 13. Backlog incremental

| Incremento | Contenido | Puertas de salida |
|---|---|---|
| I-0 Fundaciones | Monorepo ADR-073, CI con ARQ-01, migraciones base (esquemas, outbox/inbox), prototipo de compatibilidad PR-INF-01 (Better Auth, Neon, Mongo, Upstash, Zod) | PR-INF-01 aprobado o contingencia activada |
| I-1 Cuentas y catálogo | M1 (registro, sesiones, permisos, consentimientos) y catálogo M2 | EQ-01 (K6-01), EQ-04, EQ-22, CAC-01/02 |
| I-2 Evaluación y preparación | M3 (intentos, simulacros, fichas, planes, dominio) | EQ-09, EQ-15 (K6-03), EQ-16, EQ-17 |
| I-3 Economía | M5 con pasarela simulada, lotes, ledger y reembolsos; reservas M4 | EQ-06, EQ-24, EQ-25, EQ-31 (CON, K6-05) |
| I-4 Studio y materiales | Studio M2, motor visual, exportación PDF/PPTX | EQ-23, EQ-27, PEND-05/PEND-MAT-01 |
| I-5 Tutor IA y RAG | M6 con proveedores simulados; indexación, admisión y relay SSE | EQ-10, EQ-11, EQ-30, PR-INF-04; BP con presupuesto |
| I-6 Live y publicidad | Prototipo SFU, grabación desactivada, M7 y fondos | EQ-12, EQ-14, EQ-26 (PIL-01), EQ-28 |
| I-7 Operación | Monitores, alertas, respaldos, ensayo de restauración, carga escalonada | EQ-02, EQ-03 (K6-02), EQ-19, EQ-20, EQ-21, EQ-29 |

## 14. Definición de terminado

Una historia o incremento está **terminado** cuando cumple todo lo siguiente:

1. Código con su HU/RF y su módulo; sin imports fuera del `index.ts` (ARQ-01).
2. Pruebas unitarias, de integración y de contrato en verde en CI. Un fallo no se oculta ni se omite.
3. Migraciones expand-contract revisadas, reversibles en la aplicación y aplicadas por el trabajo de CI.
4. Seguridad: autorización por recurso probada, sin secretos ni PII en logs, cabeceras de caché correctas y dependencias revisadas (SBOM).
5. UI: estados de carga, vacío y error; accesibilidad sin violaciones serias (UI-09); funcionamiento móvil.
6. Si el incremento cubre un EQ, su evidencia está registrada según la política de aceptación, con el estado Simulada, Pasada o Fallida declarado tal cual.
7. Las banderas de producción de ADR, sección 10.4, se respetan; nada bloqueado se activa.
8. Documentación actualizada: una ADR nueva si cambia una decisión, API/OpenAPI si cambia un contrato, y este SDD si cambia una referencia.

## 15. Control de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 20/11/2026 | Consolidación inicial tras el cierre arquitectónico del Sprint 02 |
