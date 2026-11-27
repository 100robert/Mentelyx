# Documento de diseño de software (SDD) — Mentelyx

> **Versión:** 2.2 — 26/11/2026 · **Sprint:** 02, cierre de diseño de arquitectura y evaluación de atributos de calidad
> **Estado:** SDD actualizado según la [instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md) después de corregir los documentos fuente. Es la especificación de referencia de una **implementación incremental existente**, con migraciones y pruebas locales. El detalle de diseño está en la sección 22; la evidencia de auditoría F01–F09 está en [EVIDENCIAS](../_auditoria/EVIDENCIAS.md) y el estado activo en [ESTADO](../_auditoria/ESTADO.md). El build OpenNext no completó el bundle en Windows por un error de permisos de symlink; no se presenta como verificación de Worker/E2E. Las condiciones externas pendientes no se consideran aprobadas. Mentelyx **no está listo para producción**.
> **Método:** consolida por referencia; mantiene una sola fuente de verdad por especificación. La evaluación, la estrategia de pruebas y la trazabilidad, que en la v1.0 estaban en las secciones 8 a 10, viven ahora en [`05-evaluacion-arquitectonica/`](../05-evaluacion-arquitectonica/01-evaluacion-de-atributos-de-calidad.md).

## 1. Propósito y alcance

> **Alcance de V1 ([ADR-093](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md), 25/11/2026):** la primera versión construye el aprendizaje libre y la preparación de exámenes, con carpetas independientes por módulo. Studio (I-6), M4 docentes y aulas (I-7) y la publicación de cursos se posponen; su diseño se conserva y no se borra de este documento.

Describir de forma única y navegable la arquitectura y el diseño de Mentelyx:

- plataforma educativa web/PWA de **siete módulos** (M1–M7) en un **monolito modular** con **Clean Architecture**;
- **dos cuentas públicas**, Estudiante y Docente, y un Superadministrador interno;
- Tutor IA sobre una **pizarra inteligente** (lienzo extensible), fuentes privadas, biblioteca reutilizable, evaluaciones personalizadas, Studio como capacidad según el plan, clases humanas por horas y Docente Live.

Destinatarios: equipo de desarrollo, docentes evaluadores del curso y responsables de producto.

### 1.1. Documentos fuente

| Área | Documento | Versión |
|---|---|---|
| Autoridad y continuidad | [Instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md), [registro de continuidad](../00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md) | Definitiva / vigente |
| Visión y estado | [README](../../README.md) | Vigente |
| Análisis | [Actores](../01-analisis-de-sistema/01-actores.md), [HU-01–HU-90](../01-analisis-de-sistema/02-historias-del-usuario.md), [RF-01–RF-122](../01-analisis-de-sistema/03-requisitos-funcionales.md), [AC](../01-analisis-de-sistema/04-atributos-de-calidad.md), [RC-01–RC-47](../01-analisis-de-sistema/05-restricciones.md), [DA-01–DA-35](../01-analisis-de-sistema/06-drivers-arquitectonicos.md) | 2.2 |
| Decisiones | [ADR-001–ADR-092](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md) | 2.4 |
| Escenarios | [EQ-01–EQ-45](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md) | Vigente |
| Arquitectura | [Inicial](../02-arquitectura-software/arquitectura-inicial.md), [estilo](../02-arquitectura-software/estilo-arquitectonico.md), [enfoque](../02-arquitectura-software/enfoque-arquitectonico.md), [componentes](../02-arquitectura-software/componentes-arquitectonicos.md), [seguridad](../02-arquitectura-software/seguridad-y-autenticacion.md), [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) | 1.7 / vigentes / 1.1 / 1.1 |
| Diseño externo | [Persistencia](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), [API](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md), [interfaces](../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) | 2.2 / 2.2 / 2.2 |
| Diseño interno | [Módulos](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md), [SOLID](../03-diseño-de-software/diseño-interno/principios-de-diseño.md), [patrones](../03-diseño-de-software/diseño-interno/patrones-de-diseño.md) | 3.3 / 20/11/2026 / 20/11/2026 |
| Diseño especializado | [Tutor IA](../03-diseño-de-software/diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md), [RAG](../03-diseño-de-software/diseño-especializado/02-diseño-rag.md), [motor visual](../03-diseño-de-software/diseño-especializado/03-motor-visual-y-pizarra.md), [3D](../03-diseño-de-software/diseño-especializado/04-visualizaciones-3d.md), [materiales](../03-diseño-de-software/diseño-especializado/05-generacion-de-materiales-educativos.md), [calidad IA](../03-diseño-de-software/diseño-especializado/06-calidad-ia-criterios-y-pruebas.md), [registro](../03-diseño-de-software/diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md) | 2.0 |
| Coordinación | [Contrato](../03-diseño-de-software/contrato-coordinacion-datos-seguridad-infraestructura.md), sección 7 | 1.0 + estado |
| C4 | [Nivel 1](../04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md), [2](../04-modelo-c4/Nivel2-DiagramadeContenedores.md), [3](../04-modelo-c4/Nivel3-DiagramadeComponentes.md), [4](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) | Ver sección 7 |
| Evaluación | [Atributos](../05-evaluacion-arquitectonica/01-evaluacion-de-atributos-de-calidad.md), [riesgos](../05-evaluacion-arquitectonica/02-analisis-de-riesgos-y-compromisos.md), [pruebas](../05-evaluacion-arquitectonica/03-estrategia-de-pruebas.md), [trazabilidad](../05-evaluacion-arquitectonica/04-matriz-de-trazabilidad.md) | 1.0 |

Si este SDD y un documento fuente discrepan, prevalece el documento fuente.

### 1.2. Convenciones de estado

- **Decisiones:** DECIDIDA, DIFERIDA, BLOQUEADA PARA PRODUCCIÓN (se construye, no se activa sin su condición) y REQUIERE DECISIÓN DE PRODUCTO ([ADR, sección 10](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md)).
- **Pruebas:** Pendiente (diseñada, no ejecutada), Simulada, Pasada o Fallida. **Estado al 25/11/2026:** hay verificaciones locales parciales de integración y Workerd; cada resultado y límite se identifica por escenario en la matriz y en [EVIDENCIAS](../_auditoria/EVIDENCIAS.md). No se declara cumplido un EQ por pruebas de alcance menor.

## 2. Contexto

Mentelyx atiende a estudiantes de Primaria a Universidad y a docentes. Su núcleo es un Tutor IA que enseña cualquier tema pertinente, con o sin fuentes propias, sobre un lienzo interactivo; lo acompañan preparación de exámenes, biblioteca reutilizable, Studio y clases humanas por horas. Restricciones dominantes: protección de menores, costo variable de IA y video, y operación con poco personal ([README](../../README.md), [actores](../01-analisis-de-sistema/01-actores.md), [RC](../01-analisis-de-sistema/05-restricciones.md)).

## 3. Requisitos

HU-01–HU-90 y RF-01–RF-122, con RF-100 a RF-122 añadidos por la instrucción maestra (edad, espacios, OCR, evaluaciones, lienzo, lazo, biblioteca BR-01–BR-12, 90 días, 3D, Studio, Docente Live, devoluciones, grupos, pagos directos, recompensas, BYOK, comisiones y CulqiOnline). Las redacciones anteriores se conservan marcadas como sustituidas en cada documento.

## 4. Drivers y atributos

Prioridades de [AC, sección 2](../01-analisis-de-sistema/04-atributos-de-calidad.md): críticas AC-02, AC-04 y AC-06; altas AC-01, AC-03, AC-05, AC-07 a AC-11. Drivers DA-01–DA-35 en [drivers](../01-analisis-de-sistema/06-drivers-arquitectonicos.md); DA-32 a DA-35 cubren Tutor y pizarra, reutilización, monetización complementaria y evaluación con protección de edad.

## 5. Arquitectura general

| Vista | Contenido | Referencia |
|---|---|---|
| Estilo y enfoque | Monolito modular en capas, Clean Architecture con puertos y adaptadores | [Estilo](../02-arquitectura-software/estilo-arquitectonico.md), [enfoque](../02-arquitectura-software/enfoque-arquitectonico.md) |
| Frontend | **Next.js híbrido** (SSR, ISR y estático) en Cloudflare Workers con OpenNext (ADR-074); PWA | [Infraestructura, sección 1](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) |
| Backend | Hono en Workers; Better Auth con adaptador Drizzle; colas con outbox/inbox | [Arquitectura inicial](../02-arquitectura-software/arquitectura-inicial.md) |
| Datos | Neon PostgreSQL + pgvector (BGE-M3 `vector(1024)`), MongoDB Atlas, Upstash Redis, R2; Drizzle ORM y Drizzle Kit como autoridad de migraciones; Kysely para consultas especializadas (ADR-075) | [Persistencia](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) |
| IA | Workers AI: DeepSeek V4.1 Flash, Gemma 4 26B A4B, BGE-M3, FLUX.2 Klein; extensiones externas desactivadas (ADR-077) | [Tutor IA](../03-diseño-de-software/diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md) |
| Integraciones | CulqiOnline, RealtimeKit, Bunny Stream, Cloudflare Browser Run, correo de referencia, redes publicitarias por seleccionar | [Componentes](../02-arquitectura-software/componentes-arquitectonicos.md) |

## 6. Decisiones y justificaciones

[ADR-001–ADR-092](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md). ADR-074 a ADR-092 aplican la instrucción maestra; 19 ADR anteriores quedan marcadas como sustituidas o modificadas. La sección 10.3 registra P-01 a P-11 resueltas según la instrucción (sección 20) y la 10.4 las banderas de producción.

## 7. Vistas C4

| Nivel | Documento | Estado de las figuras |
|---|---|---|
| 1 Contexto | [Nivel 1](../04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md) | Texto y figura actualizados (21/11/2026) |
| 2 Contenedores | [Nivel 2](../04-modelo-c4/Nivel2-DiagramadeContenedores.md) | Texto y figura actualizados (OpenNext, Workers AI, CulqiOnline) |
| 3 Componentes | [Nivel 3](../04-modelo-c4/Nivel3-DiagramadeComponentes.md) | Texto y figura actualizados (21/11/2026) |
| 4 Código | [Nivel 4](../04-modelo-c4/Nivel4-DiagramadeCodigo.md) y [diseño interno, sección 11](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md) | Figuras M5/M6 con nombres anteriores; texto normativo |

Los diagramas de secuencia de la instrucción (Culqi y renovación, consumo audiovisual y devolución, recompensas, BYOK, evaluaciones y grupos) están en Mermaid en la [API, sección 10](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md); el lienzo y la selección, en las [interfaces, sección 8](../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) y el [motor visual, sección 17](../03-diseño-de-software/diseño-especializado/03-motor-visual-y-pizarra.md).

## 8. Responsabilidades de módulos

| Módulo | Responsabilidad | Contratos públicos principales |
|---|---|---|
| M1 Usuarios y Administración | Cuentas, sesiones, permisos, auditoría, perfil académico y condición de edad | `obtenerUsuarioAutenticado`, `verificarPermiso`, `consultarCondicionEdad` |
| M2 Cursos y Contenidos / Studio | Catálogo, licencias, Studio, espacios y fuentes, biblioteca, lienzos y cuadernos | `verificarLicenciaYAcceso`, `listarRecursosConsultables`, `buscarRecursosBiblioteca`, `obtenerSeleccionLienzo` |
| M3 Evaluaciones y Aprendizaje | Evaluaciones de catálogo y generadas, intentos, notas reproducibles, progreso | `consultarProgresoAutorizado`, `consultarRestriccionesTutor` |
| M4 Docentes y Clases | Habilitación, tarifas, disponibilidad, clases por horas, grupos privados, pagos directos declarados | `buscarOfertasTutoria`, `verificarMembresiaGrupo` |
| M5 Suscripciones y Pagos | Planes, recursos de plan, recompensas concedidas, saldo audiovisual, CulqiOnline, comisiones, devoluciones | `reservar/confirmar/liberar/reintegrarRecursoPlan`, `reservarCapacidadAudiovisual`, `registrarPagoDirecto` |
| M6 Tutor IA y RAG | Orquestación y modalidad de fuentes, RAG híbrido, BYOK, consumo técnico | Consume M1, M2, M3, M4 y M5 |
| M7 Publicidad y Patrocinios | Redes externas, anuncios recompensados verificados, financiamiento de clases gratuitas | Evento `RecompensaVerificada`; `reservar/confirmar/liberarFinanciamientoAula` |

Contratos completos: [API, sección 2.8](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md) y [diseño interno, sección 10.1](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md). Sin ciclos de importación.

## 9. a 16. Referencias por tema

| # | Tema | Fuente única |
|---|---|---|
| 9 | Persistencia | [Persistencia v2.2](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md): 119 entidades, ER por módulo, vectorial BGE-M3, protocolos de consistencia, retención |
| 10 | API y contratos | [API v2.2](../03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md): endpoints, DTO, SSE, colas, errores, autorización, secuencias |
| 11 | Diseño interno | [Módulos 3.3](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md), [SOLID](../03-diseño-de-software/diseño-interno/principios-de-diseño.md), [patrones](../03-diseño-de-software/diseño-interno/patrones-de-diseño.md) |
| 12 | Tutor IA y RAG | [Orquestador 2.0](../03-diseño-de-software/diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md), [RAG 2.0](../03-diseño-de-software/diseño-especializado/02-diseño-rag.md) |
| 13 | Pizarra | [Motor visual 2.0](../03-diseño-de-software/diseño-especializado/03-motor-visual-y-pizarra.md), [interfaces, sección 8](../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) |
| 14 | Biblioteca | [RAG, sección 18](../03-diseño-de-software/diseño-especializado/02-diseño-rag.md), ADR-084, persistencia 7.9 y 8.4 |
| 15 | Studio | [Materiales 2.0](../03-diseño-de-software/diseño-especializado/05-generacion-de-materiales-educativos.md), [3D 2.0](../03-diseño-de-software/diseño-especializado/04-visualizaciones-3d.md) |
| 16 | Seguridad y privacidad | [Seguridad 1.1](../02-arquitectura-software/seguridad-y-autenticacion.md), sección 8 (edad, BYOK, Culqi, publicidad, pizarra, biblioteca, grupos, SSR) |

## 17. Modelo comercial y CulqiOnline

Planes estudiantiles (IM, sección 14): Gratuito S/0, Estándar S/39,90, Plus S/59,90 y Premium S/89,90, con recursos mensuales por categoría como configuración de piloto versionada. Docentes (IM, sección 15): Docente Inicial S/55 y Docente Live S/100 inicial mensual, con saldo audiovisual en participante-minutos, avisos 70/90/100 % y devolución según la fórmula de la sección 15.3. Pagos directos al docente con comisión registrada, sin custodia. Pasarela: CulqiOnline (ADR-082) con comisiones por medio, mínima y umbral ([infraestructura, sección 9](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md)); sin contratación.

## 18. Infraestructura y dimensionamiento

[Infraestructura 1.1](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md): entornos, DNS/CDN, OpenNext, colas, observabilidad, CI/CD, recuperación y sección 9 con cotas de costo por plan calculadas con tarifas de referencia **no verificadas en esta intervención** (no son costos medidos).

## 19. Evaluación arquitectónica

[Evaluación de atributos](../05-evaluacion-arquitectonica/01-evaluacion-de-atributos-de-calidad.md) y [riesgos y compromisos](../05-evaluacion-arquitectonica/02-analisis-de-riesgos-y-compromisos.md). Inspirada en ATAM; no es un ATAM formal.

## 20. Estrategia de pruebas

[Estrategia de pruebas](../05-evaluacion-arquitectonica/03-estrategia-de-pruebas.md): niveles, k6 con las cargas vigentes, FAL/CON/MIG/CAC/ARQ y las familias nuevas (TUT, PIZ, BIB, EVA, BYK, PUB, CUL, AUD, RET, EDA, GRU, COS-04, RAG-SEC-06, MIG-04). Estado por escenario: hay evidencia local parcial, sin aprobación global de todas las familias. Consultar la matriz de trazabilidad, secciones 1 y 2, y [EVIDENCIAS](../_auditoria/EVIDENCIAS.md).

## 21. Trazabilidad

[Matriz EQ-01–EQ-45](../05-evaluacion-arquitectonica/04-matriz-de-trazabilidad.md) (requisito → driver → ADR → componente → escenario → prueba → evidencia) y [matriz de acuerdos](../00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md) (sección 9 del registro).

## 22. Secuencia incremental de desarrollo

Reordenada según la instrucción maestra, sección 26. Autorización, recursos de plan, persistencia y observabilidad se integran desde I-0; el Tutor IA no queda después de Studio.

| Incremento | Contenido | Puertas de salida |
|---|---|---|
| I-0 Fundaciones y controles | Monorepo (ADR-073), CI con ARQ-01, Drizzle Kit y esquemas base con outbox/inbox, OpenNext, PR-INF-01 (incluye la comparación con vinext), autorización por recurso, libro de recursos de M5 y presupuestos técnicos de M6, observabilidad | PR-INF-01 o contingencia; MIG-04; ARQ-01 |
| I-1 Autenticación, perfiles, espacios y fuentes | M1 (registro, sesiones, consentimiento, perfil académico y edad); M2 espacios y fuentes privadas con OCR | EQ-04, EQ-22, EQ-43; SEC-01; EDA-01/02 |
| I-2 RAG y Tutor IA | M6 con Workers AI simulado en CI: orquestador, modalidad, RAG híbrido BGE-M3, conversaciones de 90 días, SSE | EQ-10, EQ-11, EQ-30, EQ-32, EQ-33, EQ-42; RAG-SEC-06; TUT; PR-INF-04 |
| I-3 Pizarra inteligente | Lienzo, capas, lazo, operaciones y exportación de regiones | EQ-34, EQ-35; PIZ-01–03 |
| I-4 Biblioteca reutilizable | Recursos, compartir, publicar, retirar y valorar; búsqueda antes de generar | EQ-36; BIB-01–03 |
| I-5 Evaluaciones y progreso | M3 catálogo y generación personalizada o rápida; simulacros | EQ-09, EQ-15, EQ-16, EQ-17, EQ-37; EVA-01–03 |
| I-6 Studio y capacidades comerciales | Studio de 10 pasos, PDF/PPTX, planes con CulqiOnline simulado, renovación, BYOK | EQ-23, EQ-27, EQ-38, EQ-40; CUL; BYK |
| I-7 Docentes, audiovisual, publicidad y operación | Tarifas, grupos, pagos directos, Docente Live con saldo audiovisual y devoluciones, M7 con recompensas, monitoreo, restauración y carga escalonada | EQ-12, EQ-13, EQ-14, EQ-19–EQ-21, EQ-25, EQ-26, EQ-28, EQ-39, EQ-41, EQ-44, EQ-45; K6-02; PIL-01 |

I-0 se autorizó el 21/11/2026 y el propietario priorizó después el MVP vertical del Sprint 03, con el Tutor en Workers AI (Gemma) y RAG híbrido BGE-M3. La tabla conserva el estado histórico del incremento y refleja verificaciones locales ejecutadas el 25–26/11/2026. Los resultados F01–F09 están en [EVIDENCIAS](../_auditoria/EVIDENCIAS.md); no equivalen a CI remota ni a despliegue:

| Elemento | Código, migración o prueba | Estado |
|---|---|---|
| Monorepo, 7 módulos con Clean Architecture | `frontend/`, `backend/`, `packages/contratos`; `backend/src/modules/*` | Implementado; el registro previo informa typecheck de los 3 proyectos en verde. En esta revalidación pasó el typecheck del backend; el monorepo completo no se repitió |
| ARQ-01 | `eslint.config.mjs`, `tests/arquitectura/arq-01.test.ts`; `pnpm arq` | Pasada local el 25/11/2026: ESLint sin errores y 6/6 pruebas de detección. En CI GitHub: flujo configurado, **no ejecutado** |
| Drizzle Kit, esquemas, outbox/inbox | Migraciones `0000` a `0006`; 7 entradas del diario | MIG-04 reconstruyó las 7 migraciones desde una base temporal vacía. La migración `0006` está sin rastrear en Git; no se acredita reconstrucción desde un commit que la incluya |
| MIG-04 | `backend/scripts/verificar-migraciones.mjs` (`pnpm db:verificar`) | Pasada local el 25/11/2026: 13/13 comprobaciones, incluida la detección de deriva y segunda ejecución idempotente |
| Libro de recursos de M5 (P0) | `postgres-resource-ledger.adapter.ts`; migración `0002`; `idempotencia-p0.integration.test.ts` | Pasada local el 25/11/2026: 12/12 pruebas PostgreSQL de idempotencia, concurrencia y atomicidad; periodos solapados protegidos por `EXCLUDE` |
| Autenticación y CSRF M1 | Better Auth real, límite compartido y middleware Origin/token CSRF; EVI-027/028 | Pasada local: integración PostgreSQL 4/4, CSRF unitarias 7/7, Workers 5/5 y navegador; cookies, 429, rechazo sin mutación y revocación verificados |
| Autorización por recurso | M2 y M6 (propietario en cada consulta; 404 para recursos ajenos) | Pasada en integración local el 25/11/2026: MVP vertical 22/22; denegación entre cuentas con 404. El alcance completo de roles/edad sigue pendiente |
| Presupuestos técnicos de M6 | `ai_budgets`, `ai_usage_records`; admisión atómica antes de invocar | Pasada en integración local el 25/11/2026: 429 sin invocar al proveedor y M5 libera la reserva; estados de fallo y límites operativos mantienen sus condiciones |
| Límite de tasa y simultaneidad (sección 10.5) | `limite-tasa.adapters.ts` (Upstash REST con respaldo SQL); candado transaccional en la admisión | Pasada: 7.ª consulta del minuto → 429 con `Retry-After` en Node (Redis y respaldo SQL) y en workerd con Redis; 2 consultas concurrentes → una admitida |
| Tutor en Workers AI (ADR-077) | `workers-ai.adapter.ts`, `rutas-ia.ts` (versión `2026-11-20.1`), `prompts/tutor-sistema.ts`; binding `AI` solo en `env.demostracion` | Implementado y probado con un **binding simulado** (formato de Gemma 4, `usage`, timeout, códigos de rechazo). **Sin llamadas reales**: no hay cuenta de Cloudflare |
| RAG híbrido BGE-M3 + texto (ADR-076) | `postgres-indice-rag.repository.ts` (KNN coseno + `ts_rank_cd`, RRF k = 60, τ = 0,40); degradación solo léxica | Pasada con **embeddings sintéticos deterministas** en pgvector real; BP-07 (Recall@8) y el plan con datos reales en Neon (PEND-RAG-01) **pendientes** |
| Contrato OpenAPI 3.1 | `/api/v1/openapi.json`; `openapi-contrato.unit.test.ts` | Pasada: rutas implementadas = rutas documentadas; `Idempotency-Key` obligatoria documentada |
| OpenNext y PR-INF-01 | `frontend/`; `backend/tests-workers/`; `scripts/humo-e2e.mjs` | PR-INF-01 local en Workerd pasó 5/5 el 25/11/2026. El build local del 26/11 compiló Next.js y pasó TypeScript, pero el empaquetado OpenNext falló con `EPERM` al crear un symlink en Windows; WSL no permitió una alternativa (fallo de sesión systemd y Node no instalado). No se obtuvo bundle ni se ejecutó E2E en esta revalidación. La nube (Neon, Atlas, Upstash, Workers AI, región, límites de CPU) sigue **pendiente** |
| Observabilidad | Registro JSON sin PII y `X-Request-Id` | Implementado; tableros y alertas pendientes |
| MVP vertical del Sprint 03 | Inicio de sesión → espacio → fuente → Tutor → persistencia y recuperación | Pasada en integración (22 pruebas) y en E2E local (16 pasos); **no desplegado** |

**I-0 no se declara terminado:** faltan la ejecución de CI en GitHub, una reinstalación limpia desde un commit que incluya todos los archivos, completar el bundle OpenNext y E2E en un entorno con permisos de symlink (el WSL disponible no tenía Node y falló al iniciar la sesión systemd), y la parte en la nube de PR-INF-01. En local y CI el Tutor usa el proveedor **simulado** y la recuperación es solo léxica (sin cuenta ni costo). El entorno de demostración está configurado para Workers AI, pero no se ha ejecutado ninguna inferencia real.

**Revalidación documental del 26/11/2026:** autenticación con límite SQL compartido y token CSRF ligado a sesión; concurrencia M5 revalidada; ARQ-01, MIG-04, Workerd, autorización y presupuesto cuentan con resultados locales previos. El build OpenNext se intentó en Windows, pero no completó el empaquetado por `EPERM` al crear un symlink. El cotejo integral de las aceptaciones F01–F09, el escaneo de enlaces y la evidencia del build están en [EVIDENCIAS](../_auditoria/EVIDENCIAS.md). La procedencia docente se documenta en la [matriz, sección 3](../05-evaluacion-arquitectonica/04-matriz-de-trazabilidad.md). Los escenarios de producción, carga y calidad pedagógica conservan sus condiciones de salida.

## 23. Criterios docentes

No se asignan puntajes ni se declara cumplimiento de criterios que dependen de implementación inexistente.

| # | Criterio | Dónde se cubre | Estado |
|---|---|---|---|
| 1 | Problema y requisitos | README; análisis | Documentado |
| 2 | Análisis y diseño | `01`, `02` y `03` | Documentado |
| 3 | Arquitectura de alto y bajo nivel | Secciones 5 a 16 | Documentado |
| 4 | Desarrollo basado en SDD | Este documento y la sección 22 | En desarrollo: I-0 parcial y MVP vertical implementado (sección 22) |
| 5 | Pruebas unitarias e integración | Estrategia de pruebas, sección 5 | Ejecutadas en local: 39 unitarias y de arquitectura, 45 de integración, 5 en workerd; en CI, sin ejecutar |
| 6 | E2E | UI-01–UI-17, E2E-01, PIZ | Prueba de humo HTTP de 16 pasos ejecutada en local; E2E con navegador, pendiente |
| 7 | UI/UX | Interfaces v2.2 | Documentado; UX-01/02 pendientes |
| 8 | Escalabilidad frontend/backend | Infraestructura; OpenNext; Workers | Documentado; K6-02 pendiente |
| 9 | Escalabilidad de base de datos | Persistencia v2.2 | Documentado; migraciones `0000`–`0005` aplicadas y verificadas (MIG-04) en local |
| 10 | DNS, CDN, dominio y subdominios | Infraestructura, sección 2 (`app.<dominio>`) | Documentado; dominio no contratado |
| 11 | Caché | Persistencia 9.3; infraestructura | Documentado; CAC pendientes |
| 12 | CI/CD | Infraestructura, sección 7; `.github/workflows/ci.yml` y `despliegue.yml` | Flujos escritos y validados como YAML; sin ejecutar en GitHub (no hay push) |
| 13 | Carga con k6 | Estrategia de pruebas, sección 2 | Diseñado; no ejecutado |
| 14 | GitHub, esquema, migraciones y datos de prueba | Repositorio; persistencia; Drizzle Kit | Worktree actual: 7 migraciones (`0000`–`0006`); `0006` no está rastreada en Git, por lo que la secuencia completa no se acredita desde un commit; datos sintéticos generados por las pruebas |
| 15 | Informe final | No existe en el repositorio | Pendiente |
| 16 | Presentación y sustentación | Fuera del repositorio | Pendiente |

## 24. Bloqueos, pendientes y definición de terminado

| Tipo | Pendiente | Efecto |
|---|---|---|
| Legal | Tratamiento real de menores, transferencias, términos de proveedores (banderas de ADR, sección 10.4) | Funciones desactivadas en producción |
| Experimental | PR-INF-01 a 05, BP-01 a 07, PIL-01 y todas las pruebas | Activación de rutas y proveedores |
| Comercial | Verificación de tarifas oficiales, parámetros de piloto de Docente Live y del documento equivalente, red publicitaria | Comercialización |
| Contratación | CulqiOnline, dominio, correo, redes publicitarias | Producción |
| Documental | Figuras regeneradas el 21/11/2026; tres fuentes duplicadas sin figura publicada, corregidas y pendientes de decidir si se conservan ([registro](../00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md), etapa I) | Ninguno funcional |

**Definición de terminado** (se conserva de la v1.0): código ligado a HU/RF y a su módulo sin imports fuera del `index.ts`; unitarias, integración y contrato en verde; migraciones expand-contract con Drizzle Kit; autorización por recurso probada, sin secretos ni PII en logs; UI con estados de carga, vacío y error y accesibilidad (UI-09); evidencia de EQ registrada con su estado real; banderas de producción respetadas; documentación actualizada (ADR, OpenAPI y este SDD).

## 25. Control de versiones

| Versión | Fecha | Cambio |
|---|---|---|
| 1.0 | 20/11/2026 | Consolidación inicial (sin la instrucción maestra) |
| 2.0 | 20/11/2026 | Aplica la instrucción maestra: Next.js híbrido con OpenNext (sustituye «Next.js estático en Pages»), Workers AI, BGE-M3 1024, modo GENERAL, 90 días, planes y Docente Live, CulqiOnline, lienzo, biblioteca, BYOK y recompensas; evaluación, pruebas y trazabilidad trasladadas a `05-evaluacion-arquitectonica/`; secuencia I-0 a I-7 reordenada |
| 2.1 | 21/11/2026 | Sección 22: estado de implementación verificado de I-0 y del MVP vertical del Sprint 03 (sin cambio de arquitectura, precios, cuotas ni modelos) |
| 2.2 | 26/11/2026 | Actualiza evidencia y límites de F01–F09; registra el intento de build OpenNext en Windows, su bloqueo de symlink, y aclara que la migración 0006 no rastreada no acredita reproducibilidad desde commit |

## 26. Sprint 2: implementación y validación de la arquitectura (27/11/2026)

En esta sección se distinguen cuatro planos:
- **diseño objetivo**: las secciones anteriores y las ADR;
- **alcance V1**: ADR-093;
- **implementado**: lo que el código hace hoy;
- **verificado**: lo que una prueba ejecutada demuestra.

Las evidencias están en `docs/05-evaluacion-arquitectonica/evidencias/` (ver su `README.md`).

### 26.1. Correspondencia entre la arquitectura y el código

| Decisión | Implementación real | Verificación |
|---|---|---|
| Monolito modular, M1–M7 (ADR-001, ADR-073) | `backend/src/modules/<módulo>/` con `index.ts` como API pública. M4 y M7 están montados como esqueletos (ADR-093) | ARQ-01: `eslint.config.mjs` y `tests/arquitectura/arq-01.test.ts`. `GET /api/v1/salud` lista los 7 módulos |
| Clean Architecture por módulo | Carpetas `dominio/` (reglas y puertos), `aplicacion/` (casos de uso), `infraestructura/` (adaptadores) y `presentacion/` (Hono) | ARQ-01 rechaza las dependencias `dominio → aplicacion/infraestructura` y `aplicacion → infraestructura` |
| Contratos públicos y puertos | M3 usa `FuentesAutorizadasPort` y `CarpetasPort` de M2; M6 usa `PreparacionPropiaPort` de M3; M2 usa `ElementosPort` de M3 y M6 | Composición y enlaces tardíos en `backend/src/app.ts` (`crearApp`); ningún módulo importa el interior de otro |
| Persistencia políglota | PostgreSQL: cuentas, carpetas, preparaciones, intentos, tarjetas, libro de recursos, RAG (pgvector). MongoDB: conversaciones y su estado (M6), bancos de preguntas versionados (M3). R2: originales de fuentes | `pnpm test:integracion` contra PostgreSQL 17 y MongoDB 8 reales. Neon y Atlas verificados desde el equipo local (registro de continuidad, sección 24) |
| Hono y TypeScript en Workers; Next.js con OpenNext | `backend/src/worker.ts` y `frontend/` (OpenNext); *service binding* `API` | `pnpm test:workers` (workerd), `humo-e2e.mjs` 16/16 y `flujos-v1-e2e.mjs` 9/9 |
| REST versionado y OpenAPI | `/api/v1`. OpenAPI 3.1 generado desde los esquemas Zod de cada ruta y enriquecido con módulos y seguridad (`backend/src/shared/openapi.ts`). Swagger UI en `/api/v1/docs` | `backend/src/tests/openapi-contrato.unit.test.ts`: rutas implementadas = rutas documentadas. Exportación en `evidencias/openapi/openapi.json` |
| ADR-093 (alcance V1) | Aprendizaje y exámenes; Studio, docentes, aulas y pagos sin construir | Matriz 12.11 del diseño de API |
| ADR-094 (NVIDIA mediante Adapter) | `nvidia.adapter.ts` implementa `ProveedorIaPort`; `IA_PROVEEDOR=nvidia` | Jest y Vitest con dobles; una inferencia real (sección 24 del registro) |

**Desviaciones conocidas:**
- La IA real en el despliegue no está verificada (no hay Worker publicado).
- La conexión a PostgreSQL es por petición, sin un *pooler* propio. En carga es el cuello de botella observado (sección 26.3).
- No hay Redis ni caché de datos de aplicación: está diseñado (ADR-012, RF-94) pero no implementado.

### 26.2. Especificaciones de las funcionalidades implementadas

Formato común para cada especificación:
- **identificador**;
- **trazabilidad**: HU, RF, EQ y ADR;
- **módulo** responsable;
- **actores, precondiciones y reglas**;
- **flujos** principal y alternativo, y **poscondición**;
- **componentes, *endpoints* y persistencia**;
- **seguridad**;
- **criterios de aceptación (CA)**;
- **tareas técnicas**;
- **pruebas, evidencias y estado**.

**SDD-V1-01 · Registro, inicio y cierre de sesión**
- **Trazabilidad:** HU-01 · RF-01, RF-02, RF-93 · EQ-04 · ADR-075. **Módulo:** M1.
- **Actor:** Estudiante (V1 solo crea cuentas de Estudiante). **Precondición:** correo no registrado.
- **Reglas:** contraseña de 8 a 128 caracteres guardada como hash (Better Auth); límite de 30 intentos por correo cada 60 s y de 120 por IP y minuto; cookie HttpOnly y SameSite=Lax; Origin permitido y token CSRF en toda mutación.
- **Flujo principal:** CSRF → registro (201) o login (200) → cookie. **Flujo alternativo:** credenciales inválidas (401), cuenta duplicada (400), exceso de intentos (429 con `Retry-After`), sin CSRF (403).
- **Poscondición:** sesión vigente, consultada en SQL en cada petición.
- **Componentes:** `usuarios-admin/infraestructura/better-auth.adapter.ts` y `presentacion/auth.controller.ts`. ***Endpoints*:** `/auth/csrf`, `/auth/registro`, `/auth/login`, `/auth/logout`, `/auth/sesion`. **Persistencia:** PostgreSQL `m1_users`.
- **CA:** (1) sin CSRF, ninguna cuenta se crea; (2) tras salir, la sesión responde 401; (3) el intento 31 en 60 s responde 429.
- **Tareas técnicas:** adaptador de Better Auth y límite PostgreSQL de intentos.
- **Pruebas:** `tests/jest/seguridad-sesion.test.ts`; `usuarios-admin/tests/autenticacion-segura.integration.test.ts`; humo E2E.
- **Estado:** implementado y verificado. **Pendiente:** recuperación y verificación por correo (no hay proveedor de correo).

**SDD-V1-02 · Perfil, preferencias y seguridad de la cuenta**
- **Trazabilidad:** HU-01 · RF-04, RF-42 · API 12.10. **Módulo:** M1.
- **Precondición:** sesión.
- **Reglas:** el usuario sale siempre de la sesión, nunca del cuerpo; las preferencias son valores por omisión; el cambio de contraseña exige la actual y revoca las demás sesiones; los tokens de sesión nunca se exponen.
- ***Endpoints*:** `GET/PATCH /cuenta/me`, `GET/PUT /cuenta/me/preferencias`, `GET /auth/sesiones`, `DELETE /auth/sesiones/{id}`, `POST /auth/contrasena/cambio`. **Persistencia:** `m1_users.users`, `learning_preferences` y `user_sessions`.
- **CA:** la otra sesión queda revocada tras cambiar la contraseña; las preferencias de A no son visibles para B.
- **Pruebas:** Flujo C en `backend/src/tests/v1-full-stack.integration.test.ts`; recorrido en Chrome (Configuración).
- **Estado:** implementado y verificado. **Pendiente:** eliminación de la cuenta.

**SDD-V1-03 · Carpetas por módulo**
- **Trazabilidad:** ADR-093 · API 12.1 · EQ-04. **Módulo:** M2.
- **Reglas:** una carpeta pertenece a APRENDIZAJE o a EXAMENES y sus elementos son del mismo módulo; hasta 3 niveles; sin ciclos; nombre único entre hermanas sin distinguir mayúsculas (409); al eliminarla, sus elementos pasan a la raíz.
- **Flujo alternativo:** carpeta ajena (404), cuarto nivel o ciclo (400).
- **Componentes:** `cursos-contenidos/aplicacion/carpetas.use-cases.ts` y `infraestructura/postgres-carpetas.repository.ts` (CTE recursiva). **Persistencia:** `m2_contents.folders` (índice único funcional `folders_hermanas_nombre_uq`) y `folder_items`.
- **CA:** una carpeta de Exámenes nunca contiene temas; otra cuenta recibe 404.
- **Pruebas:** `tests/jest/m2-carpetas.test.ts`; Flujo A en integración; `flujos-v1-e2e.mjs`.
- **Estado:** implementado y verificado.

**SDD-V1-04 · Temas y fuentes privadas (TXT, MD y texto de PDF)**
- **Trazabilidad:** HU-73 · RF-101, RF-102 · EQ-32 · ADR-076, ADR-078. **Módulos:** M2 (registro) y M6 (indexación).
- **Reglas:** hasta 200 KB de texto; el PDF se extrae en el navegador con PDF.js por página y el archivo no se sube; las páginas sin texto se avisan (sin OCR); se reserva `ALMACENAMIENTO_BYTES` de M5; evento `FuenteRegistrada` por outbox.
- ***Endpoints*:** `POST /espacios`, `POST /espacios/{id}/fuentes` (con `Idempotency-Key`). **Persistencia:** PostgreSQL (`content_items`, `rag_document_chunks`) y R2.
- **CA:** el Tutor cita la fuente propia; otra cuenta no puede usarla (404).
- **Pruebas:** integración (PDF citado y aislamiento).
- **Estado:** implementado; verificado con un proveedor doble. **Pendiente:** RAG sobre PDF con el modelo real, citas con página y OCR.

**SDD-V1-05 · Tutor IA con fuentes y salida estructurada**
- **Trazabilidad:** HU-31, HU-72 · RF-42, RF-112 · EQ-11, EQ-33, EQ-45 · ADR-077, ADR-094. **Módulo:** M6.
- **Reglas:**
  - la cuota de M5 se reserva antes de invocar; 6 consultas por minuto por usuario;
  - se redactan los datos personales;
  - la sección `mentelyx` se valida con el mismo validador del cliente (14 tipos de bloque y 9 acciones);
  - un fallo del proveedor nunca produce una respuesta falsa (503, cuota liberada);
  - el simulado solo se permite en desarrollo y CI.
- ***Endpoints*:** `POST /tutor-ia/conversaciones` y `POST /tutor-ia/consultas`. **Persistencia:** MongoDB `tutor_conversaciones` (TTL de 90 días) y PostgreSQL (`ai_usage_records`).
- **CA:** una respuesta real FUNDAMENTADA con cita y bloque `pasos` validado (verificado con NVIDIA el 27/11); un bloque inválido se descarta con aviso.
- **Pruebas:** `tests/jest/m6-tutor.test.ts`; `tutor-ia-rag/tests/*.unit.test.ts`; `scripts/tutor-real-e2e.mjs`.
- **Estado:** implementado; verificado con un modelo real (81 s por respuesta).

**SDD-V1-06 · Estado de la sesión educativa**
- **Trazabilidad:** HU-74, HU-80 · RF-112 · API 12.5. **Módulo:** M6.
- **Reglas:** se guarda el último estado completo (≤ 64 KB) con `If-Match`; si otra pestaña guardó antes, responde 412.
- ***Endpoints*:** `GET/PUT /tutor-ia/conversaciones/{id}/estado`. **Persistencia:** el mismo documento de Mongo y la misma retención.
- **CA:** pasos y parámetros reaparecen tras recargar.
- **Pruebas:** integración (Flujo A) y E2E.
- **Estado:** implementado y verificado. **Pendiente:** anotaciones de PDF y obras.

**SDD-V1-07 · Preparaciones de examen y plan**
- **Trazabilidad:** HU-36, HU-37, HU-75 · RF-08, RF-103 · EQ-16 · ADR-093. **Módulo:** M3.
- **Reglas:** varias por cuenta; nombre y asignatura; plan determinista (`plan-determinista-v1`); el temario crea una versión nueva del plan y conserva el avance de los temas que siguen; operación idempotente por clave.
- ***Endpoints*:** `GET/POST /preparaciones`, `GET/PATCH /preparaciones/{id}`, `GET …/plan`, `PUT …/temario`, `POST …/actividades/{id}/completar`. **Persistencia:** `m3_evaluations.learning_goals`, `study_plans` y `study_plan_items`.
- **CA:** dos preparaciones conviven; con iguales datos, el plan es idéntico; la versión anterior se conserva como REEMPLAZADO.
- **Pruebas:** integración (Flujo B) y Jest M3.
- **Estado:** implementado y verificado.

**SDD-V1-08 · Banco, intentos y calificación oficial**
- **Trazabilidad:** HU-02, HU-06, HU-38, HU-76 · RF-07, RF-09, RF-10, RF-96, RF-105 · EQ-15, EQ-37 · persistencia 4.2. **Módulo:** M3.
- **Reglas:**
  - preguntas validadas con `mentelyx.pregunta/v1` en el servidor; el origen lo fija el servidor;
  - banco inmutable por versión;
  - el intento fija la versión del banco y la hora del servidor; un simulacro vencido no admite respuestas;
  - soluciones ocultas hasta la entrega (en práctica, solo la pregunta comprobada, que queda bloqueada);
  - entrega idempotente con una sola calificación; las abiertas quedan PENDIENTE fuera del máximo.
- ***Endpoints*:** `GET/POST …/preguntas`, `GET/POST …/intentos`, `GET /intentos/{id}`, `PUT /intentos/{id}/respuestas/{p}` y `POST /intentos/{id}/entrega`. **Persistencia:** MongoDB `question_banks` y PostgreSQL `evaluation_attempts` y `attempt_answers`.
- **CA:** entregas concurrentes producen un solo resultado; responder tras la entrega devuelve 409; otra cuenta recibe 404.
- **Pruebas:** Jest M3; integración (Flujo B); k6 EQ-15.
- **Estado:** implementado y verificado. **Pendiente:** la generación rápida de 15 preguntas por IA (RF-104) no está implementada.

**SDD-V1-09 · Resultados, seguimiento y tarjetas**
- **Trazabilidad:** HU-07, HU-39 · RF-11 · API 12.9. **Módulo:** M3.
- **Reglas:** rendimiento observado por tema (no es un «dominio estimado»); tarjetas con SM-2 calculado en el servidor (`sm2-mentelyx-v1`); revisión idempotente.
- ***Endpoints*:** `GET …/seguimiento`, `GET …/resultados`, `GET/POST …/tarjetas` y `POST /tarjetas/{id}/revisiones`. **Persistencia:** `evaluation_attempts`, `study_cards` y `card_reviews`.
- **Pruebas:** integración, Jest M3 y E2E.
- **Estado:** implementado y verificado.

**SDD-V1-10 · Derechos y recursos del plan**
- **Trazabilidad:** HU-54, HU-70 · RF-14, RF-43, RF-92 · EQ-24, EQ-30, EQ-31 · ADR-080. **Módulo:** M5.
- **Reglas:**
  - reserva, confirmación, liberación y reintegro idempotentes;
  - el libro solo admite inserciones;
  - saldo = libro al hacer COMMIT;
  - `EXCLUDE` impide periodos superpuestos;
  - plan Gratuito automático.
- ***Endpoint*:** `GET /suscripciones/me/derechos` (los demás son API interna entre módulos). **Persistencia:** `m5_billing`.
- **Pruebas:** P0 de M5 (12/12, concurrentes) y Jest M5.
- **Estado:** implementado y verificado. **Fuera de V1:** pagos reales.

### 26.3. Validación de los atributos de calidad

La matriz AC/EQ con resultados reales está en la [evaluación de atributos de calidad, sección 6](../05-evaluacion-arquitectonica/01-evaluacion-de-atributos-de-calidad.md).
