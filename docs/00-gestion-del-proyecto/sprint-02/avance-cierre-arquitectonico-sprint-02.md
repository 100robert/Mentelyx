# Reanudación y cierre de datos, seguridad e infraestructura

> **Fecha:** 17/11/2026 · **Responsable:** Codex · **Alcance:** primer prompt interrumpido; diseño documental, sin implementación, contratación, commits ni SDD consolidado.

## 1. Punto recuperado y conservación

Se recuperó el prompt y la ejecución `01a1ea1c-beb9-7972-ad61-72a0139348ae` del 17/11/2026. Terminó con `usage_limit_exceeded` durante la investigación oficial posterior a la lectura documental. El registro contiene lecturas, inspecciones y consultas web, **sin llamadas de escritura**. Por tanto, no hay archivos editados atribuibles a esa ejecución. Se reutiliza la base documental existente, no se reinicia su elaboración.

Estado Git al reanudar, sobre `3e136b2`: modificaciones en `.gitignore`, API v2.0, interfaces v2.0 y C4 nivel 4; sin seguimiento `.agents/`, `.claude/`, `.codex/`, siete documentos especializados, fuentes y exportaciones C4 nivel 4 y `mentelyx-ai-setup-README.md`. Se conserva ese trabajo. Git no acredita por sí solo su autoría. Persistencia v1.0 estaba sin modificaciones y contenía ER, catálogos y ejemplos, pero no dimensionamiento ni contratos físicos completos.

Las instrucciones actuales sustituyen la lectura integral del primer prompt por búsquedas dirigidas. No se ejecutan subagentes ni tareas en paralelo. Las cuatro skills locales se aplican por área. Se tomaron huellas SHA-256 iniciales en un archivo temporal para comprobar la conservación de los archivos ajenos al alcance.

## 2. Control de avance

| Tarea | Estado | Evidencia / siguiente punto |
|---|---|---|
| Recuperar interrupción y revisar Git | Completada | sección 1; inventario Markdown y diff inicial revisados |
| Auditoría de brechas y solicitudes | Completada (verificada por Claude Code) | Contrato de coordinación, secciones 2–3 |
| Caracterización y dimensionamiento | Completada (verificada) | Persistencia v2.0, sección 6; cálculos H0–H2 recomprobados |
| Modelo SQL/NoSQL y recuperación | Completada (verificada) | Persistencia v2.0, secciones 7–11 |
| Seguridad y autenticación | Completada (verificada) | `02-arquitectura-software/seguridad-y-autenticacion.md` |
| Despliegue, caché, escalabilidad y resiliencia | Completada (verificada) | `02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md` |
| Consolidar ADR y contrato de coordinación | Completada (verificada) | ADR, secciones 8–9; contrato de coordinación v1.0 |
| Sincronizar CO-01–CO-10 en archivos de Claude | Interrumpida por cuota; continúa Claude Code | Sección 5 de este registro |
| Validaciones documentales y conservación | Continúa Claude Code | Sección 5 de este registro |

## 3. Matriz de auditoría inicial

| Documento / sección | Contenido existente | Problema | Acción / responsable | Prioridad |
|---|---|---|---|---|
| Persistencia secciones 2–5 | ER conceptual, inventario SQL, dos ejemplos Mongo, cuatro claves Redis | Definición parcial; falta dimensionamiento, tipos y consistencia entre almacenes | Codex: completar el mismo documento | Alta |
| API v2.0 secciones 2.8 y 4–9 | Contratos, DTO, SSE, trabajos, errores y pruebas previstas | Suficiente como diseño funcional; requiere precisar atomicidad y persistencia | Codex: contrato de coordinación; preservar archivo de Claude | Alta |
| Interfaces v2.0 sección 5 en adelante | Recorridos, estados y accesibilidad | Diseño presente; validación UI no ejecutada | Conservar; pruebas al implementar | Media |
| ADR-033/044; arquitectura sección 4/6 | Better Auth candidato y controles generales | Falta elección justificada, revocación y amenazas | Codex: diseño de seguridad y actualización de estado ADR | Alta |
| ADR-013/036/041/054 | Workers, Neon, Atlas y recuperación como objetivo | Faltan conectividad, límites, RTO/RPO y procedimientos | Codex: diseño de infraestructura | Alta |
| Especializado, registro sección 3 | 17 SC, 4 SEG, 6 INF propuestas | No constituyen aprobación; varias requieren ajustes de integridad/privacidad | Codex: resolución razonada por ID | Alta |
| Especializado, registro PEND-01 | Retirada DeepSeek V4 Pro el 20/11/2026 | No consta sucesor oficial | Verificación oficial y regla de desactivación/degradación | Alta |
| README encabezado/sección 7 | Declara todo listo para desarrollo | Contradice pruebas y decisiones condicionadas | Codex: ajustar estado e índice | Alta |
| C4 niveles 1–4 | Vistas y recursos existentes | Revisar enlaces; referencias especializadas y diagramas no prueban implementación | Correcciones de enlaces únicamente; sin redibujar | Media |
| README enlace a auditoría terminológica | Enlace a archivo ausente | Fue eliminado en `3e136b2` | Sustituir por este registro de continuidad | Baja |

## 4. Resultados y bloqueantes

Se completará al terminar cada área. La existencia de documentos no acredita pruebas de carga, restauración, seguridad, integración o aprobación legal/comercial.

Resultado de Codex antes de la interrupción (recuperado por Claude Code a partir del diff): 6 archivos, 782 líneas añadidas y 10 eliminadas (ADR, persistencia, seguridad, infraestructura, contrato de coordinación y este registro). Codex no llegó a actualizar esta sección ni a sincronizar los ajustes CO.

## 5. Continuación por Claude Code (17/11/2026)

| Campo | Estado |
|---|---|
| Tareas completadas | Fase 1: recuperación del estado y verificación de los puntos 1–10 en los documentos de Codex (completos; no se rehacen). CO-03/04/06/07/10 en el orquestador v1.1. CO-01/05 en RAG v1.1, con la consulta híbrida reescrita para no materializar el filtro y anular HNSW. CO-02 en materiales v1.1. CO-02/04/05, INF-01 y SC-16 en API v2.1. CO-06 en interfaces v2.1. Pruebas API-05/06/09/14 ajustadas y API-15 a API-18 añadidas (calidad v1.1). CO-08 en diseño interno v3.2 (solo notas y contratos de la sección 10.1; código intacto). Registro especializado v1.1 (sección 8: resoluciones, CO, DS-01–DS-10, compatibilidad y pendientes). README v2.1 (estado, índice y enlace). Rutas de C4 nivel 4 corregidas. Clave R2 3D alineada. Nota de estado en el contrato de coordinación. Referencias con el símbolo de sección y con la palabra entre comillas angulares normalizadas a la palabra sección o secciones en 16 documentos (script local, sin cambiar saltos de línea). 12 rutas de imagen rotas del diseño interno, ya presentes en `3e136b2`, corregidas a los PNG existentes |
| Archivos modificados | Este registro; orquestador; RAG; 3D; motor visual (solo normalización); materiales; calidad; registro especializado; API; interfaces; diseño interno; persistencia (estado `PURGADO` y normalización); seguridad e infraestructura (solo normalización); contrato de coordinación (nota y normalización); ADR (solo normalización); README; C4 nivel 4 |
| Decisiones cerradas | Las de Codex se conservan sin cambios: SC (5 aceptadas, 11 modificadas, 1 diferida), SEG/INF, ADR-056–072 y DeepSeek V4.1 Flash como selección documental sujeta a BP-01. Nuevas de sincronización: respaldo de las rutas de razonamiento y degradación de la ruta profunda inactiva (DS-01/02) |
| Verificaciones ejecutadas | `git diff --check` sin errores; 0 enlaces relativos rotos en los archivos nuevos o modificados; bloques JSON válidos salvo el ejemplo intencional de la API v1.0 (sección 1); sin ADR/RF/HU/EQ/AC/RC/DA fuera de rango; sin términos retirados (solo la mención descriptiva del registro especializado, sección 7). No hay pruebas de software, SQL, BSON ni de proveedores |
| Tareas pendientes | Ninguna de definición arquitectónica. Fuera de esta etapa: CO-09 y lo indicado en el registro especializado, sección 8.5 |
| Bloqueantes | Ninguno documental. Legales, de producto y experimentales según el contrato de coordinación, sección 6, y el registro especializado, sección 8.5 |
| Siguiente acción exacta | Evaluación de atributos de calidad (skill `mentelyx-calidad-sdd`) sobre EQ-01–EQ-31; después, el SDD consolidado. Sin implementación, commits ni pushes |

## 6. Cierre definitivo de datos y decisiones (17/11/2026, Claude Code)

| Campo | Estado |
|---|---|
| Tareas completadas | Revisión RF-01–RF-99 frente a persistencia; persistencia v2.1: campos añadidos (secciones 7.3–7.5), entidades complementarias (sección 7.8), MongoDB (sección 8.3), Redis (sección 9.3) y R2 (sección 9.4) |
| Completado además | Persistencia, secciones 13 (matriz), 14 (vectorial) y 15 (siete ER por módulo y esquema documental). Flujo RAG, sección 3, actualizado al modelo de generaciones. ADR v2.3, sección 10: clasificación, contingencias, ADR-073, P-01 a P-10 y banderas legales. CO-09 resuelto: `HabilitacionDocentePort` sin ciclo M1↔M4; fuentes draw.io y SVG corregidas; pies M2-S y M7-S. API: soporte, reembolsos, contratos M4→M7, cola transversal y `ConsultarCatalogoUseCase`. Infraestructura: cola transversal. Textos «candidato» alineados en C4 nivel 2, arquitectura inicial, componentes, diseño interno, principios y orquestador. README actualizado |
| Verificaciones ejecutadas | `git diff --check` sin errores; 0 enlaces relativos rotos; en persistencia, 85 entidades de la matriz definidas, 7 ER sin entidades huérfanas, vallas balanceadas y 6 bloques JSON válidos; sin identificadores fuera de rango (ADR hasta 073); P-01 a P-10 únicos; sin marcas de sección ni artefactos gramaticales de la normalización. No ejecutado: SQL, validadores BSON reales, renderizado Mermaid ni pruebas de software |
| Git | Commit `f9b8caa` de robert (17/11/2026 17:37), hecho durante esta tarea; incluye el trabajo hasta la sección 13 de persistencia. Lo posterior queda sin commit. Claude Code no hizo commits ni pushes |
| Pendiente | Reexportar 3 PNG desde sus fuentes corregidas (sin herramienta instalada). **Resuelto el 21/11/2026 (etapa I).** |
| Bloqueantes | Ninguno técnico. Producto: P-01 a P-10. Legal: banderas de ADR, sección 10.4 |
| Siguiente acción exacta | Evaluación de atributos de calidad (`mentelyx-calidad-sdd`) sobre EQ-01–EQ-31 y, después, SDD consolidado |

## 7. Evaluación de calidad y SDD consolidado (20/11/2026, Claude Code)

| Campo | Estado |
|---|---|
| Punto de reanudación | Sección 6 completa; sin commits nuevos desde `f9b8caa`; 21 archivos modificados sin commit |
| Completado | C4 niveles 1–3: pendientes sustituidos por su estado y proveedores nombrados en el texto (sin redibujar); P-11 (grupos privados docentes) añadido a ADR, sección 10.3 |
| Completado además | SDD v1.0 en `docs/06-SDD/documento-de-diseño-de-software.md`: evaluación inspirada en ATAM (no formal), trazabilidad de los 31 EQ, 33 pruebas nuevas (K6, FAL, CON, CAC, MIG, UNI, UX, PIL, ARQ, E2E), RTO/RPO, 16 criterios docentes sin puntaje, bloqueos, incrementos I-0 a I-7 y definición de terminado. ADR-073 añade k6 y reglas ESLint de arquitectura. Enlace desde `08-escenarios`, sección 3. README v2.2 |
| Verificaciones ejecutadas | `git diff --check` sin errores; 0 enlaces rotos en 21 archivos; trazabilidad del SDD: 31 EQ sin huecos ni duplicados, 11 AC cubiertos, todos los RF, DA, ADR y pruebas citadas definidos; persistencia sin regresiones; sin identificadores fuera de rango (ADR hasta 073, P hasta 11); sin marcas de sección. Ninguna prueba de software ejecutada |
| Pendiente | Reexportar 3 PNG (resuelto el 21/11/2026, etapa I); ejecutar las pruebas a partir de I-0; respuestas de producto P-01 a P-11 y legales |
| Siguiente acción exacta | Revisión del SDD por el responsable del proyecto y decisión sobre P-01 a P-11; después, incremento I-0 con instrucción explícita de implementar |

## 8. Corrección integral por la instrucción maestra (20/11/2026, Claude Code)

**Autoridad:** [instrucción maestra](instruccion-maestra.md), leída completa: 27 secciones y 1.557 líneas. Las resoluciones P-01 a P-11 de la sección 7 de este registro quedan sustituidas por su sección 20. Hay una sola copia canónica de los acuerdos: la propia instrucción maestra; no se crea un archivo de acuerdos duplicado (instrucción, sección 2).

| Etapa | Alcance | Estado |
|---|---|---|
| 0. Organización | Registro trasladado a `00-gestion-del-proyecto/sprint-02/`, SDD a `06-SDD/`, carpeta `05-evaluacion-arquitectonica/`; enlaces corregidos en 8 archivos; AGENTS.md (política permanente), CLAUDE.md y skill `mentelyx-calidad-sdd` actualizados | Completada |
| A. Análisis | Actores (planes, edad, permisos de grupos, BYOK y recompensas, sistemas externos); HU-54/55/60/63/69/70 reescritas y HU-71 a HU-90; 32 RF reescritos y RF-100 a RF-122; AC-06/07 y degradación de IA; 13 RC reescritas y RC-38 a RC-47; DA-26 a DA-29 reescritos y DA-32 a DA-35; ADR v2.4 con 19 ADR marcadas y ADR-074 a ADR-092, P-01 a P-11 resueltas y banderas; EQ-24/25/27 a 30 adaptados y EQ-32 a EQ-45. Redacciones anteriores conservadas como sustituidas | Completada |
| B. Arquitectura | Arquitectura inicial 1.7 (OpenNext, Workers AI, Culqi, modelo docente, Tutor/pizarra/biblioteca); componentes C01–C07; estilo; enfoque (cuatro niveles, Drizzle/Kysely); seguridad 1.1 (sección 8: edad, BYOK, Culqi, publicidad, pizarra, biblioteca, grupos, SSR; SEC-11 a SEC-17); infraestructura 1.1 (OpenNext, Browser Run, 4 colas nuevas, sección 9 con cotas por plan, tarifas por verificar y comisiones Culqi) | Completada |
| C. Diseño | Persistencia v2.2 (119 entidades, 7 ER, ciclo de vida de recursos); API v2.2 (endpoints nuevos, contratos 2.8 en recursos de plan, DTO 4.6, 5 colas, errores, autorización, 6 secuencias); interfaces v2.2 (lienzo principal en lugar de 40/60, lazo, capas, recorridos E11–E16 y D8–D9, UI-10 a UI-17); diseño interno 3.3 (inventarios M1–M7, código M5/M6 con `PlanResourcesPort`, contratos 10.1); principios (sección 5.8) y patrones (Envelope Encryption, reserva y compensación, verificación en servidor, Operation Log, Search-before-generate); contrato de coordinación con sección 7 de estado. Figuras PNG con nombres anteriores listadas para la etapa E | Completada |
| D. Especializado | Orquestador 2.0 (Workers AI, extensiones desactivadas, GENERAL/MIXTA, recursos en M5, 90 días, BYOK, falla común); RAG 2.0 (BGE-M3 1024, fuentes privadas, biblioteca, retiro); motor visual 2.0 (lienzo, lazo, capas); 3D 2.0 (todas las cuentas); materiales 2.0 (10 pasos, Browser Run, recursos); calidad 2.0 (API-04, API-18, MEN-02/03); registro con la resolución por la IM | Completada |
| E. Diagramas | Textos de C4 niveles 1–3 actualizados (OpenNext, Workers AI, CulqiOnline, recursos de plan); secuencias Mermaid de Culqi y renovación, consumo audiovisual y devolución, recompensas, BYOK, evaluaciones y grupos en la API, sección 10; lienzo y selección en interfaces, sección 8, y motor visual, sección 17. **Reexportación completada el 21/11/2026 en la etapa I** (sección 11). Lista original pendiente: `m2-interno`, `m2-secuencia`, `m4-interno`, `m5-interno`, `m5-clases`, `m5-secuencia`, `m6-interno`, `m6-clases`, `m6-secuencia`, `m7-interno`, `principios-solid-m1`, `principios-solid-mentelyx`, `principios-solid-m4`, `principios-solid-m6`, `principios-solid-m7`, `patrones-diseno-m5` y las figuras C4 de los niveles 1 a 4 | Completada (texto); exportación pendiente |
| F. Evaluación | `05-evaluacion-arquitectonica/` 01–04 creados con el contenido trasladado de las secciones 8–10 del SDD v1.0 y ampliado (EQ-32–EQ-45, R-11–R-20, T-09–T-11, TUT/PIZ/BIB/EVA/BYK/PUB/CUL/AUD/RET/EDA/GRU, COS-04, RAG-SEC-06, MIG-04, K6-07, FAL-09) | Completada |
| G. SDD | `06-SDD/documento-de-diseño-de-software.md` v2.0 con los 22 elementos, criterios docentes sin puntaje y secuencia I-0 a I-7 reordenada; Next.js híbrido en lugar de «estático en Pages» | Completada |
| H. Auditoría | README 3.0; verificación de decisiones prohibidas, enlaces, identificadores, JSON y `git diff --check`; matrices de las secciones 9 y 10 de este registro | Completada |

**Siguiente acción exacta:** revisión del responsable del proyecto; después, solo con instrucción explícita, el incremento I-0 (SDD, sección 22). Sin commits ni pushes.

## 9. Matriz de acuerdos de la instrucción maestra

| Acuerdo (IM) | RF | ADR | Evidencia (archivo y sección) | Datos | Contrato | EQ y prueba | Estado |
|---|---|---|---|---|---|---|---|
| Modelo educativo centrado en el Tutor (3, 6) | RF-42, RF-101–RF-108 | 078, 083 | Orquestador 2.0, secciones 12.2 y 20; interfaces 2.2, sección 8 | `tutor_conversaciones` | `POST /tutor-ia/consultas` | EQ-33, TUT-01–03 | Cumplido |
| Planes estudiantiles y precios (14) | RF-12–RF-14, RF-43, RF-73 | 080 | README, sección 3; infraestructura, sección 9 | `plan_resource_limits`, `resource_balances` | `GET /planes`, `reservarRecursoPlan` | EQ-24, EQ-45, CON-02, COS-04 | Cumplido |
| Docente Inicial y Live (15, 15.3) | RF-21, RF-115, RF-116 | 081 | API 2.2, secciones 2.4, 2.5 y 10.2; interfaces, recorrido D9 | `audiovisual_balances`, `live_period_closures` | `reservarCapacidadAudiovisual` | EQ-41, AUD-01–03 | Cumplido |
| CulqiOnline (19) | RF-121, RF-122 | 082 | API 2.2, secciones 2.5 y 10.1; seguridad, sección 8.3 | `payment_orders`, `payment_fee_records` | `POST /pagos/ordenes`, webhook | EQ-40, CUL-01–05 | Cumplido |
| Comisión mínima y reglas por medio (19.2) | RF-121 | 082 | Infraestructura, sección 9; persistencia 7.9 | `payment_fee_schedules` | `PaymentPort` | EQ-40, CUL-04 | Cumplido |
| Renovaciones y devoluciones (19.3, 19.4) | RF-116, RF-122 | 081, 082 | API, secciones 2.5 y 10.1–10.2 | `recurrence_authorizations`, `payment_receipts` | `/suscripciones/:id/renovacion-automatica`, `/pagos/devoluciones/me` | EQ-40, EQ-41, CUL-03, AUD-02 | Cumplido |
| Siete módulos (4.2) | — | 001 | SDD 2.0, sección 8; diseño interno 3.3 | — | API, sección 2.8 | EQ-05, ARQ-01 | Cumplido |
| Next.js híbrido (4.1) | — | 074 | Infraestructura, sección 1; C4 nivel 2; SDD, sección 5 | — | — | EQ-01, PR-INF-01 | Cumplido (compatibilidad por probar) |
| Hono (4.1) | — | 003 (modificada) | Arquitectura inicial 1.7 | — | API v2.2 | EQ-08, API-01 | Cumplido |
| Persistencia SQL, documental y vectorial (5) | — | 006, 023, 075, 076 | Persistencia v2.2, secciones 3, 7–9 y 13–15 | 119 entidades | Repositorios | EQ-05, EQ-20, MIG-01–04 | Cumplido |
| BGE-M3 con 1024 dimensiones (7.1) | RF-102 | 076 | RAG 2.0, sección 8; persistencia, sección 14 | `rag_document_chunks` `vector(1024)` | `EmbeddingPort` | EQ-11, BP-07 | Cumplido (Recall por medir) |
| Drizzle y Kysely (5.2) | — | 075 | Persistencia, sección 11; ADR, sección 10.2 | Drizzle Kit | — | MIG-04 | Cumplido |
| Seguridad y privacidad | RF-04, RF-100, RF-120 | 004, 085, 089 | Seguridad 1.1, sección 8 | `audit_logs` | — | EQ-04, SEC-01–17 | Cumplido |
| Perfil académico (5.4) | RF-100 | 089 | Seguridad 8.1; interfaces E1 | `user_academic_profiles` | `/usuarios/me/perfil-academico`, `consultarCondicionEdad` | EQ-43, EDA-01/02 | Cumplido |
| Tutor GENERAL (6) | RF-42 | 078 | Orquestador, sección 12.2; RAG, sección 10.4; calidad API-18 | — | `modoFuentes` | EQ-33, TUT-01 | Cumplido |
| Fuentes privadas (7) | RF-101, RF-102 | 090 | RAG 2.0, secciones 5, 10.1 y 18; interfaces E9 | `study_spaces`, `study_space_sources` | `/espacios/:id/fuentes` | EQ-32, RAG-SEC-06 | Cumplido |
| Evaluaciones personalizables (8) | RF-103, RF-105 | 092 | API, secciones 2.3 y 10.5; interfaces E12 | `assessment_generation_requests` | `/evaluaciones/generaciones` | EQ-37, EVA-01–03 | Cumplido |
| Mínimo de 15 preguntas (8) | RF-104 | 092 | DTO 4.6; diseño interno M3 | — | `GeneracionEvaluacionRequest` | EQ-37, EVA-01 | Cumplido |
| Pizarra extensible (9) | RF-106–RF-108 | 083 | Motor visual 2.0, sección 17; interfaces, sección 8 | `lienzos`, `lienzo_elementos`, `lienzo_operaciones` | `/lienzos/:id/operaciones`, `obtenerSeleccionLienzo` | EQ-34, EQ-35, PIZ-01–03 | Cumplido (prototipo pendiente) |
| Biblioteca BR-01 a BR-12 (10) | RF-109–RF-111 | 084 | RAG, sección 18; API 2.2; interfaces E13 | `resource_publications`, `resource_shares`, `recursos_biblioteca` | `/biblioteca`, `/recursos/:id/publicar|retirar` | EQ-36, BIB-01–03 | Cumplido |
| Historial de 90 días (11) | RF-112 | 079 | Orquestador, sección 10.7; persistencia 8.2; interfaces 8.6 | `tutor_conversaciones` (TTL) | `/tutor-ia/conversaciones` | EQ-42, RET-01/02 | Cumplido |
| Studio profesional (13) | RF-114 | 088 | Materiales 2.0, sección 12 | `studio_ai_quotes` | `/studio/cotizaciones-ia` | EQ-27, MAT-01–07 | Cumplido |
| Grupos privados docentes (15; P-11) | RF-117 | 087 | API, secciones 2.4 y 10.6; interfaces D8 | `private_groups`, `group_members`, `group_invitations` | `/grupos`, `verificarMembresiaGrupo` | EQ-44, GRU-01/02 | Cumplido |
| Publicidad recompensada (16) | RF-119 | 086 | API, secciones 2.7 y 10.3; patrones | `ad_reward_offers`, `ad_reward_events`, `resource_grants` | `/publicidad/recompensas/*`, `RecompensaVerificada` | EQ-39, PUB-01–03 | Cumplido (red por seleccionar) |
| BYOK (17) | RF-120 | 085 | Seguridad 8.2; orquestador, sección 20; API 10.4 | `byok_credentials` | `/tutor-ia/byok` | EQ-38, BYK-01–03 | Cumplido |
| Diagramas (22) | — | — | Etapas E e I de este registro | — | — | — | Cumplido el 21/11/2026: fuentes draw.io corregidas y PNG/SVG exportados con draw.io Desktop; tres fuentes duplicadas sin figura publicada (sección 11) |
| ATAM (24) | — | — | `05-evaluacion-arquitectonica/01` y `02` | — | — | EQ-01–EQ-45 | Cumplido (inspirado en ATAM, no formal) |
| Pruebas (25) | — | — | `05-evaluacion-arquitectonica/03` | — | — | Todas | Cumplido como diseño; **ninguna ejecutada** |
| Trazabilidad | — | — | `05-evaluacion-arquitectonica/04`; esta sección | — | — | EQ-01–EQ-45 | Cumplido |
| SDD (26) | — | — | `06-SDD/documento-de-diseño-de-software.md` v2.0 | — | — | — | Cumplido |
| Organización documental (23) | — | — | `00-gestion-del-proyecto`, `05-evaluacion-arquitectonica`, `06-SDD`; README, sección 8 | — | — | — | Cumplido |

## 10. Verificación de la sección 27 (20/11/2026)

| Comprobación | Resultado |
|---|---|
| Decisiones prohibidas vigentes (Next.js solo estático, Gemini Embedding 2, `vector(1536)`, GENERAL deshabilitado, 14/30 días, planes antiguos, cuatro créditos, S/8 por crédito, Kysely como autoridad de migraciones, pizarra subordinada al chat, grupos excluidos, pasarela indefinida) | 0 vigentes. Las menciones restantes están en secciones de historial, filas marcadas como sustituidas, el registro histórico de Codex (contrato, secciones 1–6, con estado en la sección 7) o el registro 07 (con su resolución final) |
| Enlaces relativos | 0 rotos |
| Identificadores (ADR ≤ 092, RF ≤ 122, HU ≤ 90, EQ ≤ 45, RC ≤ 47, DA ≤ 35) | 0 fuera de rango |
| JSON | Bloques `json` válidos; el ejemplo ilustrativo de la API, sección 1, se etiqueta `jsonc` |
| `git diff --check` | Sin errores |
| Duplicados | Una sola copia de los acuerdos (la instrucción maestra); la evaluación, las pruebas y la trazabilidad ya no se repiten en el SDD; `docs/05-sdd/` eliminada |
| Referencias gráficas | Todas las imágenes enlazadas existen; las figuras se regeneraron el 21/11/2026 (sección 11) |
| Consistencia de datos, contratos y flujos | Revisada a mano: recursos de plan (persistencia 7.9 ↔ API 2.8 ↔ diseño interno M5/M6 ↔ orquestador 10), devolución de Docente Live (IM 15.3 ↔ EQ-41 ↔ AUD-02: 2.000 pm → S/24 y S/21), lienzo (persistencia 8.4 ↔ API 4.6 ↔ motor visual 17 ↔ interfaces 8) |
| Observación | `docs.zip` figura como eliminado del árbol de trabajo frente al último commit; no se restauró ni se usó |

## 11. Etapa I: correcciones finales de auditoría antes de I-0 (21/11/2026, Claude Code)

Origen: auditoría del ZIP completo (Markdown, Git, SVG, PNG y draw.io). Fuentes de autoridad: la [instrucción maestra](instruccion-maestra.md) y el [SDD 2.0](../../06-SDD/documento-de-diseño-de-software.md). No se cambiaron precios, cuotas, condiciones comerciales, framework ni adaptador. No hay código, commits ni pushes.

| Bloque | Resultado | Estado |
|---|---|---|
| 1. Modelo físico M5 | [Persistencia 2.3](../../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md): secciones 3.4, 3.5, 7.5, 7.8, 7.9 y ER de las secciones 2 y 15.5 unificados en recursos de plan, saldo audiovisual, CulqiOnline, pagos directos y comisiones. Créditos Live/Studio, `credit_lots`, liquidación por crédito y `CLASE_DIRECTA` pasan al historial de la nueva sección 7.5.1. Alineados la API (`STUDIO_AI_REFUND` → REINTEGRO con `refund:{operationKey}`; medio de pago directo `YAPE`/`TARJETA`/`QR` según la IM), el diseño interno (`CONFIRMACION` y `AJUSTE`; estados HOLD…ASISTIDA), materiales, calidad (API-10/11), el contrato (SC-07 y SC-08) y la ADR, secciones 5.2 y 5.3 | Completado |
| 2. Diagramas | 40 draw.io, 30 SVG y 38 PNG auditados. Se corrigieron 28 fuentes draw.io (incluida la nueva `principios-solid-m5.drawio`, creada sobre la plantilla de M4 porque la figura 1 no tenía fuente) y se exportaron 27 PNG y 19 SVG con draw.io Desktop 32.6.10 ya instalado. Revisión visual de las exportaciones principales | Completado |
| 3. Git | Revisión de `.gitignore`, instrucciones locales, `docs.zip` y respaldos de draw.io; recomendaciones abajo. Sin cambios en `.gitignore` | Completado (recomendaciones) |
| 4. Evidencia técnica | ADR-077 y orquestador 5.7: `@cf/black-forest-labs/flux-2-klein-4b` verificado con su tarifa publicada. Infraestructura, sección 8 (PR-INF-01), ADR-074, riesgo R-02 y SDD I-0: Cloudflare recomienda vinext (beta) para aplicaciones nuevas; OpenNext se mantiene hasta la prueba comparativa | Completado |
| 5. Verificación | 0 enlaces rotos, 0 JSON inválidos, 0 identificadores fuera de rango, `git diff --check` sin errores (con `core.autocrlf=true`; los avisos LF→CRLF no son errores), 0 EOL mixtos; búsqueda de decisiones prohibidas con 46 coincidencias, todas en historial o falsos positivos ya revisados | Completado |

**Diagramas editados y exportados:** C4 nivel 1 (`nivel1-contexto` PNG y SVG), nivel 2 (`nivel2-contenedores` PNG y SVG), nivel 3 (`mentelyx-componentes-arquitectonicos` PNG y `nivel3-componentes.svg`) y nivel 4 (`nivel4-clases-m6`, `nivel4-secuencia` PNG y SVG); `m2-interno`, `m4-clases`, `m4-interno`, `m4-secuencia`, `m5-clases`, `m5-interno`, `m5-secuencia`, `m6-clases`, `m6-interno`, `m6-secuencia` y `m7-interno` (PNG y SVG); `estilo-arquitectonico` (PNG y SVG), `enfoque-arquitectonico` (PNG; antes `enfoque-arquitectonico-mentelyx.png`, renombrada después por el responsable junto con su SVG `fuentes-svg/enfoque-arquitectonico.svg`), `patrones-diseno-m5` y `patrones-diseno-transversales` (PNG y SVG); `principios-solid-mentelyx.png` (desde la nueva `principios-solid-m5.drawio`) y `principios-solid-m1/m2/m4/m6/m7.png`. Además se reexportó `m2-secuencia.png`, que llevaba una ruta anterior.

**Sin cambios por estar correctos:** M1 (clases, interno y secuencia), `m2-clases`, M3 (clases, interno y secuencia), `m7-clases`, `m7-secuencia`, `nivel4-clases-m3` y `principios-solid-m3`. Su SVG coincidía con la fuente.

**Fuentes corregidas sin figura publicada (resuelto el 21/11/2026):** `enfoque-arquitectonico.drawio` es ahora la fuente editable homónima de `enfoque-arquitectonico.png` y de `fuentes-svg/enfoque-arquitectonico.svg`; el responsable retiró `mentelyx-estilo-arquitectonico.drawio` y `mentelyx-enfoque-arquitectonico.drawio` (la fuente vigente del estilo es `estilo-arquitectonico.drawio`); `nivel4-clases.drawio` se eliminó en la etapa I (sección 12). Las referencias de `estilo-arquitectonico.md` y `enfoque-arquitectonico.md` apuntan a `../img/estilo-arquitectonico.png` y `../img/enfoque-arquitectonico.png`, que existen.

**Git (sin commits ni pushes):**

- `.gitignore` excluye `/AGENTS.md`, `/CLAUDE.md`, `/.claude/`, `/.agents/` y `/.codex/`. Por eso las instrucciones comunes y las skills compartidas no viajan con el repositorio. Recomendación: versionar `AGENTS.md`, `CLAUDE.md`, `.claude/skills/` y `.agents/skills/`, que no contienen secretos; conservar locales `.codex/`, cualquier `settings.local.json`, `INSTALACION.md`, `instalar-mentelyx.ps1` y `mentelyx-skills.zip`. Requiere modificar `.gitignore`, lo que queda a decisión del responsable.
- La instrucción maestra, la evaluación y el SDD están sin seguimiento, pero **no** están ignorados, así que están listos para `git add`. Hay dos traslados (`docs/05-sdd/…` → `docs/06-SDD/…` y `docs/avance-…` → `docs/00-gestion-del-proyecto/sprint-02/…`): conviene añadirlos con `git add -A docs` para que Git los registre como renombrados.
- `docs.zip` existe en `560de05` y falta en el árbol de trabajo. Contiene 43 Markdown de `docs/` con fecha de modificación máxima del 20/11/2026 a las 12:06, anterior a la corrección. Duplica el repositorio y está desactualizado, por lo que se recomienda registrar su eliminación en el próximo commit. No se restauró ni se eliminó definitivamente; el historial conserva la copia.
- Cuatro respaldos de draw.io (`docs/img/fuente_drawio/.$*.drawio.bkp`) están versionados. Se recomienda retirarlos del índice y añadir `*.bkp` a `.gitignore`, a decisión del responsable.

**Bloqueantes reales para comenzar I-0:** solo la instrucción explícita del responsable y las decisiones de Git anteriores (qué instrucciones se versionan y el destino de `docs.zip`). Para I-0 se trabaja con adaptadores simulados y datos sintéticos, por lo que no bloquean la contratación de CulqiOnline, Workers Paid, Neon, Atlas, Upstash, RealtimeKit, Resend, el dominio ni la red publicitaria, ni la validación legal del tratamiento real de menores. Sí bloquean producción y piloto con datos reales. PR-INF-01 (incluida la comparación OpenNext frente a vinext) es una tarea de I-0, no un requisito previo.

**Siguiente acción exacta:** revisión del responsable; después, solo con instrucción explícita, el incremento I-0 (SDD, sección 22). Sin commits ni pushes.

## 12. Decisiones del propietario e incremento I-0 en curso (21/11/2026, Claude Code)

**Decisiones del propietario aplicadas:** se retira `OTRO` de los pagos directos; `reference_id` según ADR-081; `qr_provider`/`proveedorQr` para el medio subyacente de un QR (persistencia 7.9 y API); CulqiOnline sigue como pasarela; sin pagos divididos automáticos de Culqi y bandera de producción `pagosDirectos.tarjetaDocente` (ADR-081 y ADR, sección 10.4).

**Git (sin commits ni pushes):** `.gitignore` permite versionar `AGENTS.md`, `CLAUDE.md`, `.claude/skills/` y `.agents/skills/` (revisados sin secretos); `.codex/` sigue local; `*.bkp` excluido y los 4 respaldos retirados del índice con copia local; `nivel4-clases.drawio` eliminado (sin información única ni referencias); `enfoque-arquitectonico.drawio` y `mentelyx-estilo-arquitectonico.drawio` se conservan porque tienen contenido propio; `docs.zip` retirado del índice tras comprobar que sus 34 archivos existen idénticos en el historial.

**I-0 en curso; NO terminado.** Implementado y verificado:

| Elemento | Estado verificado |
|---|---|
| Monorepo pnpm 10.34.9 (Corepack): `frontend/`, `backend/`, `packages/contratos` | Instalado; `frontend/` solo con `package.json` |
| Backend Hono + 7 módulos con capas, `index.ts` y raíz de composición | Typecheck OK |
| Docker Compose: PostgreSQL 17 + pgvector 0.8.1, wsproxy de Neon, MongoDB 8, Redis 8 y emulador REST de Upstash | En marcha; puertos 55432, 57017, 56379, 5488, 8079 (hay PostgreSQL y MongoDB nativos en 5432 y 27017) |
| Drizzle Kit: `0000_esquemas_base_i0` y `0001_planes_piloto_y_libro_inmutable` | Aplicadas desde base vacía: 7 esquemas, 23 tablas, 6 versiones y 40 límites de piloto, libro de solo inserción |
| M5: reservar, confirmar, liberar, reintegrar e iniciar periodo; Kysely con tipos `Kyselify` | 11/11 pruebas de integración (CON-02: 50 reservas concurrentes → 15) |
| Outbox/inbox por esquema | Pruebas de atomicidad y duplicados en verde |
| Zod `jitless` y contratos compartidos | Pruebas unitarias en verde |
| ESLint ARQ-01 (`no-cycle`, imports entre módulos, capas, dominio sin frameworks) | Lint 0 errores; 6 pruebas que demuestran que las reglas detectan infracciones |

**Pendiente para cerrar I-0:** frontend Next.js y OpenNext; pruebas en el runtime de Workers con `@cloudflare/vitest-plugin`; PR-INF-01 (OpenNext, Workers, Better Auth en workerd y comparación con vinext); script `db:verificar` y prueba automatizada de migración desde base vacía (MIG-04 completo); GitHub Actions; fijar por digest las imágenes `latest` (wsproxy y emulador de Upstash); presupuestos técnicos de M6 y autorización por recurso según SDD, sección 22. Better Auth está implementado (M1) pero **no** se ha probado todavía en ejecución.

**Notas:** `@cloudflare/vitest-pool-workers` está obsoleto y se usa su sucesor `@cloudflare/vitest-plugin` (mismo producto renombrado). TypeScript 6.0, Vitest 4.1 y ESLint 10 por compatibilidad entre dependencias.

## 13. P0, plataforma y MVP vertical del Sprint 03 (21/11/2026, Claude Code)

**Instrucción:** prioridades aprobadas por el propietario (P0 seguridad e idempotencia; P1 plataforma; P2 documentación) y continuar con el MVP vertical para el Sprint 03 (presentación del 25/11/2026). Sin commits ni pushes. Datos sintéticos y proveedor de IA simulado; sin compras ni consumos de pago.

**P0 · seguridad, integridad e idempotencia.**

- Docker Compose publica todos los puertos solo en `127.0.0.1`. Las imágenes sin versión (wsproxy de Neon y emulador de Upstash) se fijan por digest.
- El wsproxy pasa de `ALLOW_ADDR_REGEX: ".*"`, que era un reenviador TCP abierto, a `^postgres:5432$`. Comprobado: los destinos `redis:6379`, `mongo:27017` y `example.com:80` se rechazan (`allowed=false`) y el PostgreSQL de Compose se acepta.
- M5, defectos corregidos:
  - un reintento de reserva tras confirmar o liberar devolvía un `RESERVADO` sin más información; ahora añade `situacion` y `repetida`;
  - una confirmación repetida con otra cantidad devolvía `YA_APLICADO`;
  - no se comprobaba el módulo de origen al confirmar, liberar o reintegrar;
  - los periodos se validaban con un `count` previo a la inserción.
- M5, garantías nuevas en PostgreSQL (migración `0002`):
  - `EXCLUDE USING gist` contra periodos superpuestos;
  - restricciones diferidas que exigen saldo = libro al COMMIT.

| Escenario P0 (PostgreSQL 17 real, 25 llamadas concurrentes por escenario) | Operaciones | Efectos persistidos | Verificaciones |
|---|---:|---|---|
| Reserva duplicada con la misma clave | 27 | 1 RESERVA; reservado +2 | 24 repetidas; 2 rechazos (otros datos, otro módulo); saldo y libro |
| Confirmación duplicada | 29 | 1 CONFIRMACION(2) + 1 LIBERACION(1) | 24 `YA_APLICADO`; 4 rechazos; saldo y libro |
| Liberación duplicada | 27 | 1 LIBERACION(2) | 24 `YA_APLICADO`; 2 rechazos |
| Reserva reintentada tras confirmarse | 25 | 0 | situación CONFIRMADA; saldos, libro y outbox sin cambios |
| Reserva reintentada tras liberarse | 25 | 0 | situación LIBERADA; sin cambios |
| Reintegro duplicado | 26 | 1 REINTEGRO(2) + 1 evento en el outbox | 24 `YA_APLICADO`; 1 rechazo |
| Conciliación final | — | — | 6 saldos reconstruidos desde el libro |
| Periodos superpuestos concurrentes | 20 | 1 periodo (6 saldos) | 19 rechazos `PERIODO_SUPERPUESTO`; 0 pares solapados |
| Solape insertado por SQL directo | 3 | 2 periodos contiguos | SQLSTATE 23P01 |
| Transacción fallida tras modificar el saldo (reservar, confirmar, liberar, reintegrar; fallo en el libro y en el outbox) | 7 | 0 parciales; después 1 CONFIRMACION + 1 REINTEGRO | estado idéntico tras cada fallo; conciliación |
| Saldo ≠ libro por SQL directo | 2 | 0 | SQLSTATE 23000 al COMMIT |
| Entrega duplicada outbox → inbox (10 concurrentes + 2 tardías) | 12 | 1 efecto; 1 fila de inbox | 1 `PROCESADO`; 11 `DUPLICADO` |

**MIG-04:** `pnpm db:verificar` crea una base vacía, aplica las 5 migraciones con Drizzle Kit, comprueba 13 condiciones y elimina la base. Las condiciones incluyen:
- tablas y columnas iguales a la instantánea;
- semilla de piloto;
- triggers y EXCLUDE;
- pgvector 0.8.1;
- segunda ejecución sin efecto;
- ausencia de deriva.

El control de deriva se probó con una deriva inyectada, y la prueba también reveló un fallo inicial que se corrigió: una ruta relativa entre unidades distintas de Windows.

**P1 · plataforma.**
- **Frontend:** Next.js 16.4.6 con OpenNext 1.20.18.
  - Rutas SSG: `/`, `/planes`, `/auth/*`.
  - Ruta ISR: `/biblioteca`.
  - Rutas SSR autenticadas: `/espacios`, `/espacios/[id]`, `/tutor`, `/tutor/[id]`.
  - Middleware edge, PWA básica y la pasarela `/api/v1/*`, que llega a Hono por un *service binding*.
- **Backend:**
  - M2: espacios y fuentes TXT/MD con R2, reserva de `ALMACENAMIENTO_BYTES` y evento `FuenteRegistrada`.
  - M6: índice léxico, conversaciones en MongoDB con retención de 90 días, presupuestos técnicos (`ai_budgets`, `ai_usage_records`), proveedor simulado y consulta idempotente por `Idempotency-Key`.
  - M5: plan Gratuito por defecto.
  - Relay del outbox, con un cron de reintentos.
- **CSRF:** como Better Auth no aplica `trustedOrigins` a `auth.api.*`, se añadió `verificarOrigen` (403).
- **CI:** `.github/workflows/ci.yml` con calidad, integración (MIG-04 y workerd) y build con prueba de humo E2E. `despliegue.yml` es manual, con confirmación y secretos.

**PR-INF-01:** solo se ejecutó la parte local; el resultado por ruta está en infraestructura, sección 8. Hallazgos:
1. scrypt de Better Auth: unos 83 ms de CPU por hash, más que los 10 ms de Workers Free.
2. El driver de MongoDB funciona en workerd con Wrangler, pero no bajo el pool de Vitest; se carga de forma diferida.
3. OpenNext no empaqueta en Windows sin permiso para crear enlaces simbólicos; el build se hace en Linux (contenedor `node:24.15.0-bookworm-slim` en la red de Compose, o en CI).
4. `vinext check`: 93 % compatible y sin migrar.
5. Los Workers comprimidos ocupan 1,08 MiB y 0,78 MiB.

**Pruebas ejecutadas (todas en verde):**

| Suite | Resultado |
|---|---|
| `pnpm typecheck` | 3 proyectos |
| `pnpm lint` | 0 errores |
| `pnpm test` | 22/22 |
| `pnpm test:integracion` | 33/33 (M5 base 11, P0 12, MVP 10) |
| `pnpm test:workers` | 5/5 |
| `pnpm db:verificar` | 13/13 |
| `node scripts/humo-e2e.mjs http://127.0.0.1:8788` | 16/16 |

**Errores encontrados y corregidos:**
- el fragmento con señal de inyección contaminaba todo el documento; ahora se aísla;
- los textos con `$` en el `$push` de Mongo se interpretaban como rutas de campo; ahora van con `$literal`;
- `mongodb` estaba en `devDependencies`;
- los scripts raíz invocaban `pnpm` de forma anidada, lo que provocaba recursión y fallaba sin `pnpm` en el PATH;
- el Pool emitía errores de clientes ociosos sin oyente en workerd;
- quedaban procesos `workerd` huérfanos de sesiones locales.

**Comandos:**
- Servicios y datos: `corepack pnpm db:up`, `corepack pnpm db:migrate`, `corepack pnpm db:verificar`.
- Pruebas: `corepack pnpm typecheck`, `corepack pnpm lint`, `corepack pnpm test`, `corepack pnpm test:integracion`, `corepack pnpm --filter @mentelyx/backend test:workers`.
- Índices de Mongo: `node backend/scripts/preparar-mongo.mjs`.
- Build de OpenNext (en Linux): `corepack pnpm exec opennextjs-cloudflare build`.
- Recorrido E2E: `node scripts/humo-e2e.mjs <URL>`.

**Estado de I-0: NO terminado.** Faltan:
- **CI en GitHub:** requiere push, que está pendiente de tu autorización.
- **PR-INF-01 en la nube:** Neon, Atlas, Upstash, Workers AI, región desde Lima y el límite real de CPU.

**MVP del Sprint 03:** funciona de extremo a extremo en local (workerd), pero **NO está desplegado**. No existe ninguna URL pública verificada.

**Para desplegar hacen falta decisiones y acciones del propietario:**
1. Una cuenta de Cloudflare (`wrangler login`, o `CLOUDFLARE_API_TOKEN` y `CLOUDFLARE_ACCOUNT_ID`) con R2 habilitado.
2. Un proyecto en Neon (cadena de la aplicación y de migración).
3. Un clúster de MongoDB Atlas.
4. Una decisión sobre el límite de CPU de Workers Free para el login. Las opciones son Workers Paid (USD 5 mensuales, tarifa de referencia de la IM 18.2 por verificar) o aceptar el riesgo en la demostración.
5. Una autorización para hacer push y ejecutar CI.

**Siguiente acción exacta:**
1. Con las cuentas creadas, ejecutar `despliegue.yml` o los pasos equivalentes con Wrangler.
2. Correr `scripts/humo-e2e.mjs` contra la URL pública.
3. Registrar el resultado aquí.

Sin commits ni pushes.

## 14. Tutor con Workers AI, RAG híbrido BGE-M3 y límites de M6 (21/11/2026, Claude Code)

**Instrucción:** el propietario corrigió las prioridades: continuar el desarrollo antes de las evidencias finales.
1. Terminar I-0.
2. Completar el flujo educativo real, con el Tutor en Gemma mediante Workers AI y el RAG híbrido BGE-M3.
3. Preparar el despliegue.
4. Pruebas y documentación según las Guías 05–07.

Sin commits ni pushes. Sin consumos pagados.

**Implementado:**
- **Rutas de Workers AI** (`rutas-ia.ts`, versión `2026-11-20.1` de la orquestación, sección 16):
  - `explicacion.general` usa `@cf/google/gemma-4-26b-a4b-it`, sin «pensamiento».
  - `explicacion.tecnica` usa `@cf/deepseek-ai/deepseek-v4.1-flash-1017` solo con `IA_RUTA_TECNICA=deepseek`, porque requiere Workers Paid o créditos. Por defecto se atiende con Gemma y un aviso de menor profundidad (*fallback* de la sección 5.11).
  - El costo se calcula con el `usage` del modelo y la tarifa de la ruta.
  - Un timeout o un error sin código de Workers AI → `INCIERTA` (CO-10). Un código explícito → `FALLIDA`.
- **Instrucciones del sistema versionadas** (`prompts/tutor-sistema.ts`, sección 13.2): bloques `<<<FUENTE …>>>` y `<<<PREGUNTA …>>>` con los delimitadores neutralizados dentro del contenido, citas `[[cN]]` → `[N]`, modo PISTA y redacción determinista previa de correo, teléfono, DNI y URL (sección 4.3).
- **Presupuesto por operación** (sección 10.4): estimación previa y ajuste (contexto a la mitad y ruta estándar; si nada cabe, 429) con las cotas de la IM 18.1.
  - **Supuesto por calibrar:** con 0,001 USD por consulta general, la salida de Gemma se acota a 1500 tokens (política técnica de M6, no una cuota).
- **RAG híbrido** (RAG, secciones 8–10):
  - BGE-M3 en lotes de 100, con la dimensión comprobada (1024) y vectores normalizados.
  - Migración `0005` con el HNSW parcial `rag_chunks_hnsw_bgem3_1024`.
  - Consulta KNN coseno + `ts_rank_cd` con RRF (k = 60) y τ = 0,40 (marcador por calibrar).
  - Sin embeddings, en la consulta o en la ingesta, se degrada a solo léxica y se avisa.
- **Modos de fuente** (ADR-078, API-18):
  - `GENERAL`: sin fuentes.
  - `MIXTA`: con fuentes sin citar.
  - `SIN_CONTEXTO`: con `fuentes.exclusivas` y sin fragmentos, sin inferencia y con la cuota liberada.
  - `PARCIAL`: la salida llega al tope de tokens.
- **Límite de tasa** (sección 10.5): 6 consultas por minuto en Upstash REST, con `INCR`+`EXPIRE` atómicos, clave con HMAC del actor y respaldo SQL (API-08). La simultaneidad se limita a 1 por usuario con un candado transaccional en la admisión. La respuesta es `429 LIMITE_TASA` con `Retry-After`.
- **Configuración:**
  - `IA_PROVEEDOR` (`simulado` en local y CI; `workers-ai` en `env.demostracion`, que declara el binding `AI`).
  - `IA_RUTA_TECNICA`.
  - `UPSTASH_REDIS_REST_URL` y `UPSTASH_REDIS_REST_TOKEN` (este último, secreto).
- **OpenAPI:**
  - `Idempotency-Key` documentada como obligatoria, con `400 CLAVE_IDEMPOTENCIA_REQUERIDA` cuando falta.
  - `/salud` documentada.
  - Una prueba compara las rutas implementadas con las documentadas.
  - `PROVEEDOR_NO_DISPONIBLE` (503) se añade al catálogo.
- **Frontend:** el panel del Tutor muestra el modelo que respondió y los avisos; el número de cita coincide con el `[N]` del texto; hay mensajes para `LIMITE_TASA` y `PROVEEDOR_NO_DISPONIBLE`.

**Pruebas ejecutadas (todas en verde, datos sintéticos):**

| Suite | Resultado |
|---|---|
| `pnpm typecheck` (3 proyectos) y `pnpm lint` | OK |
| `pnpm test` | 39/39 |
| `pnpm test:integracion` | 45/45 (M5 base 11, P0 12, MVP y M6 22); estable en 3 ejecuciones seguidas |
| `pnpm test:workers` | 5/5 |
| `pnpm db:verificar` | 13/13 (6 migraciones) |
| `node scripts/humo-e2e.mjs http://127.0.0.1:8788` (OpenNext en workerd, contenedor Linux) | 16/16 |
| Límite de tasa en workerd con Redis REST, por el frontend | 6 × 200 y 429 con `Retry-After: 50`; consumidas 6 |
| `EXPLAIN` del KNN con `enable_seqscan = off` | Usa `rag_chunks_hnsw_bgem3_1024` |
| `wrangler deploy --dry-run --env demostracion` | 804,59 KiB comprimido, con `env.AI` |

**Errores encontrados y corregidos:**
- `ci.yml` no era YAML válido: el nombre de un paso tenía `: ` sin comillas, así que GitHub no habría aceptado el flujo. Se corrigió y ambos flujos se validaron con un analizador YAML.
- `GET /salud` no estaba documentada en OpenAPI; la detectó la nueva prueba de contrato.
- El costo cero devolvía `-0`.
- La prueba de simultaneidad dependía de un retardo fijo y falló una vez (dos 200): la segunda petición llegaba a la admisión cuando la primera ya había terminado. Ahora usa una barrera, de modo que si se admitieran ambas, ninguna terminaría.

**Lo que NO se ha ejecutado:**
- Ninguna llamada real a Workers AI: no hay cuenta de Cloudflare (`wrangler whoami`: sin autenticar).
- BP-07 (Recall@8) y el conjunto adversarial del Tutor con el modelo real.
- El plan HNSW con datos reales en Neon (PEND-RAG-01).
- MMR (λ = 0,7), el circuito de la sección 13.1 y la moderación con Llama Guard: pendientes.
- Swagger UI y la colección Postman con Newman: se generan y ejecutan contra la API real cuando exista una URL pública. Instalar Newman requiere autorización.

**Estado de I-0: NO terminado.** Faltan:
- CI en GitHub, que requiere push.
- PR-INF-01 en la nube: Neon, Atlas, Upstash, Workers AI, región y límite de CPU (scrypt de unos 83 ms frente a 10 ms en Workers Free).

**El MVP NO está desplegado:** no existe ninguna URL pública verificada.

**Comandos:**
- Verificación: `corepack pnpm typecheck`, `lint`, `test`, `test:integracion`, `db:migrate`, `db:verificar`, `--filter @mentelyx/backend test:workers`.
- Tipos y build de demostración: `wrangler types --env-interface Env` y `wrangler deploy --dry-run --env demostracion`.
- Build de OpenNext en el contenedor `mentelyx-build`.
- Recorrido E2E: `node scripts/humo-e2e.mjs http://127.0.0.1:8788`.

**Siguiente acción exacta:**
1. Con la cuenta de Cloudflare, el proyecto de Neon y el clúster de Atlas (y opcionalmente Upstash), configurar los secretos y la variable `URL_PUBLICA`.
2. Hacer push con autorización (ejecuta CI) y lanzar `despliegue.yml`.
3. Ejecutar `humo-e2e.mjs` contra la URL pública y registrar latencias, `usage` y costo reales de Gemma y BGE-M3.
4. Después, generar Swagger UI y la colección Postman y ejecutarlas contra la API desplegada.

## 15. Rediseño UX/UI del frontend con Hallmark y Figma (21/11/2026, Claude Code)

**Instrucción:** el propietario pidió un rediseño profesional del frontend con `/hallmark redesign ./frontend/src`, conservando la identidad de Mentelyx, el funcionamiento, las rutas, la conexión a Hono y los contratos REST. Sin commits, pushes ni consumos pagados. No se tocaron M5/M6, migraciones, esquemas, adaptadores de Workers AI ni la configuración de despliegue.

**Punto de control:** `frontend/` no tiene seguimiento en git. Antes de editar se copió en `.hallmark/punto-control-2026-11-21/` (`src`, `public`, `package.json` y `next.config.ts`, con `SHA256SUMS`). Ninguna otra sesión había modificado el frontend en las dos horas previas.

**Herramientas:**

| Herramienta | Estado |
|---|---|
| Hallmark | Usada en modo `redesign full`: registro previo, tokens, sello, `sloplint` estático y `--kept` |
| Render de Hallmark | No disponible: requiere `puppeteer-core`, cuya instalación necesita autorización. Lo sustituye un cliente propio de Chrome DevTools sin dependencias |
| `frontend-design` | No figura entre las skills instaladas |
| Figma | Autenticado (plan Starter). Se creó un archivo editable |
| Higgsfield | No hay herramientas conectadas en esta sesión. No se generaron imágenes ni se consumieron créditos |
| `cli-hub-meta-skill` | Disponible; no fue necesaria |

**Marca:**
- No existe `Mentelyx-logo-aprobado.png` ni otro recurso de marca en el repositorio, en `E:\` ni en las carpetas del usuario. Solo aparecieron logos universitarios.
- No se dibujó ni se generó un logotipo: la interfaz muestra el nombre, y `components/marca.tsx` tiene un único punto para conectar el archivo aprobado.
- La paleta (#0A1F44, #84CC16, #969BA3, blanco y negro auxiliar) es la oficial de la marca, confirmada tal cual. Está registrada en diseño de interfaces, sección 1.2.
- `icono.svg` (el monograma «M» provisional) se recoloreó a la paleta. Sigue sin ser el búho.

**Sistema implementado:**
- `tokens.css` en OKLCH, con modo oscuro derivado.
- Lexend para la interfaz y Source Serif 4 para el material de estudio, autoalojadas con `next/font`.
- Componentes propios: botones con sus estados, campos, interruptor, mensajes por estado, etiquetas, contadores e íconos SVG propios.
- El verde limón es la acción principal con tinta azul marino (8,2:1). El foco es azul marino sobre superficies claras y limón sobre el azul marino.

**Pantallas:**
- Marco de aplicación con barra lateral contraíble (cajón en móvil), en la que se listan los espacios.
- Panel del estudiante en `/espacios`:
  - «Continuar» con la conversación más reciente.
  - Espacios privados en filas.
  - Conversaciones recientes.
  - Recursos reales del mes con medidores.
- Espacio de trabajo en `/espacios/[id]` y `/tutor/[id]`:
  - fuentes a la izquierda, con el formulario de carga plegable y la lista que se actualiza sola mientras se leen;
  - lienzo central con la explicación como objeto y citas pulsables;
  - barra de consulta flotante (Ctrl + Enter, contador 0/4000);
  - panel contextual de conversación o del pasaje citado; en móvil, cajón y hoja inferior.
- Las funciones del motor visual figuran como pendientes (I-2).
- Inicio público con la captura real del producto, planes en tabla (apilados en móvil), biblioteca, acceso en dos paneles y 404.

**Defectos encontrados y corregidos:**
- **Ya existía:** `<main id="contenido">` duplicaba el `id` del campo de texto de la fuente, y la etiqueta «Contenido» no se asociaba a él. El `main` pasó a `id="principal"`.
- **Ya existía:** con `action` de React 19, un error borraba lo escrito. Afectaba al correo del ingreso, a crear espacio y al contenido de una fuente. Los tres formularios usan ahora `onSubmit` con el mismo manejador.
- **Texto inexacto:** el inicio afirmaba «el Tutor funciona con un proveedor simulado», falso en `env.demostracion` (Workers AI). Ahora dice: «Cada respuesta indica qué proveedor la generó».
- **Introducido y corregido:** la barra lateral no mostraba un espacio recién creado. Ahora refresca el diseño una vez al abrir un espacio que no tenía listado.

**Pruebas ejecutadas:**

| Suite | Resultado |
|---|---|
| `pnpm typecheck` (3 proyectos) | OK |
| `pnpm lint` | OK. Se añadió `.claude/**` a los ignorados de ESLint porque los scripts de la skill Hallmark no son código de la aplicación |
| `pnpm test` | 39/39 |
| Build de OpenNext en el contenedor | OK (modos SSG, ISR y SSR sin cambios) |
| `node scripts/humo-e2e.mjs http://127.0.0.1:8788` | 16/16 |
| `sloplint` (Hallmark), estático y `--kept` | 0 FAIL y 0 WARN (antes: 3 FAIL y 1 REFLEX). Enlaces 11/12 (1 sustituido y registrado), campos 7/7, manejadores 3/3 |
| Capturas en Chrome: 13 pantallas × 375, 768, 1280 y 1440 px | 0 desbordamientos, 0 objetivos menores de 24 px, 0 controles sin nombre, 0 saltos de encabezado, 0 pares de contraste bajo AA a 1280, 0 errores de consola |
| Recorrido funcional en Chrome (18 pasos) | 18/18 |

Los 18 pasos del recorrido funcional cubren:
- teclado y enlace para saltar al contenido;
- error de ingreso con el correo conservado;
- registro y creación de un espacio;
- carga de una fuente hasta «Lista»;
- pregunta con Ctrl + Enter;
- cita abierta con el foco en el panel y cierre con Esc;
- persistencia tras recargar;
- cambio de selección de fuentes;
- límite de tasa con «Reintentar»;
- barra contraíble;
- menú y paneles móviles;
- movimiento reducido;
- contraste en modo oscuro de 4 pantallas.

**Evidencias** (locales, ignoradas por git):
- `.hallmark/before/` y `.hallmark/after/`, con 52 capturas cada una.
- `.hallmark/recorrido/`.
- `.hallmark/compare.html`, la comparación antes y después.

**Figma:** el archivo editable «Mentelyx: rediseño UX/UI Sprint 03» (`VRGGWdEn6jLrERlIQPYj74`) contiene:
- 8 pantallas reales capturadas como capas: inicio, crear cuenta, planes, panel, espacio con cita y conversaciones a 1440 px, y panel y espacio a 375 px.
- 7 láminas del sistema de diseño generadas con el CSS de producción.

Limitaciones del archivo:
- Son capas planas, no componentes de Figma con variantes ni variables.
- La conversión superpone el texto con chips de cita en línea y pierde las marcas de las casillas y el fondo de puntos.

**Pendiente:**
- El logotipo aprobado.
- La validación de la tipografía (Lexend y Source Serif 4).
- La revisión final de Hallmark en un contexto nuevo (requiere un subagente, que no se lanzó por la regla de CLAUDE.md).
- La auditoría con axe-core: no está instalada; se usaron comprobaciones propias de contraste, nombres, foco y objetivos.
- El modo oscuro solo se revisó en 4 pantallas.
- Componentes de Figma con variantes.
- El lienzo real del motor visual (I-2).

**Ajuste posterior (misma fecha), por indicación del propietario:** se retiraron de la interfaz los avisos «Demostración del Sprint 03» y «datos ficticios», y las referencias a incrementos (I-1, I-2, I-4, I-7). Lo pendiente ahora se presenta como «Próximamente». La biblioteca pública deja de mostrar recursos de ejemplo y presenta un estado vacío. Se mantiene la etiqueta de proveedor de cada respuesta del Tutor («Demostración (sin IA real)» con el proveedor simulado local), porque informa un hecho. Sigue vigente el bloqueo legal para datos reales (seguridad y autenticación, sección 7: términos, menores, retenciones y DPA). Verificado de nuevo en `http://localhost:8788`: recorrido de interfaz 18/18 y `humo-e2e.mjs` 16/16. Las láminas de Figma conservan los textos anteriores.

**Marca oficial (misma fecha):** se confirmó que la paleta es la oficial tal cual: #0A1F44, #84CC16, #969BA3, #FFFFFF y #000000 auxiliar. Los logotipos oficiales se entregaron en `marca/`.
- Integración: el búho acompaña al nombre en la cabecera, el pie, la barra lateral (también contraída) y la barra móvil, sobre una placa blanca en el azul marino. El logotipo completo aparece junto al formulario de acceso. El favicon es el `.ico` oficial y los iconos de la PWA ponen el búho sobre blanco.
- Se eliminó el monograma provisional `icono.svg`.
- Reglas y valores registrados en diseño de interfaces, sección 1.2.
- Verificado en `http://localhost:8788`: 52 capturas sin hallazgos, recorrido 18/18, `humo-e2e.mjs` 16/16 y sloplint con 0 FAIL.
- Observación para el equipo: los píxeles de los archivos del logotipo usan tonos cercanos pero no idénticos a la paleta, y los `.svg` no son vectoriales. No se modificaron.

**Dirección oficial de la interfaz (22/11/2026):** la UI se presenta como producto real, con prioridad en la calidad visual y la coherencia de marca. Esta dirección queda registrada en diseño de interfaces, sección 1.1, y sustituye a la regla anterior de mostrar las funciones pendientes.
- Se retiraron los últimos textos de avance: «Próximamente» en el lienzo y en la carga de fuentes, y «estará disponible próximamente» en el pago y en la nota de Docente Live.
- La imagen de la portada se encuadró en las citas y el pasaje citado.
- Siguen visibles los estados vacíos reales, los errores, los límites, la retención y la etiqueta del proveedor de cada respuesta del Tutor.

**Rediseño premium de la interfaz (22/11/2026, Claude Code, con Hallmark y frontend-design):**
- **Portada:** rehecha. Hero en azul marino con un búho 3D generado con Higgsfield a partir del logotipo oficial: una sola generación de 2 créditos (de 10), original en `marca/generado/`. Le siguen una captura real del cuaderno, los pasos, la privacidad, los planes y el cierre. Lleva entrada orquestada, apariciones al desplazar, transición entre páginas e inclinación del búho al mover el puntero, todo sin movimiento con `prefers-reduced-motion`.
- **Acceso:** panel con el búho 3D y hechos reales del producto, logotipo completo junto al formulario y botón para mostrar u ocultar la contraseña.
- **Panel del estudiante:**
  - continuar en el Tutor;
  - accesos rápidos reales (nuevo espacio, agregar fuente con `?agregar=1`, preguntar con `?preguntar=1`, conversaciones);
  - espacios en tarjetas, tus fuentes con su estado, conversaciones recientes y recursos del mes.
- **Marco de la aplicación:** barra superior con la ruta y un buscador (Ctrl + K) sobre los espacios y las secciones. La barra lateral se agrupa en Estudio, Espacios privados, Explorar y Cuenta.
- **Tutor como cuaderno:**
  - las citas fijan su pasaje junto a la hoja, unido por el hilo de cita;
  - resaltados con la API CSS Custom Highlight y notas por párrafo, guardados en este navegador y borrados al cerrar sesión;
  - selección por región o lazo, cuyos fragmentos viajan en la pregunta;
  - barra contextual sobre la selección: resaltar, anotar, preguntar y copiar.
- **Fallos corregidos:**
  - «Salir» no cerraba sesión desde el 21/11: el `onClickCapture` deshabilitaba el botón y React omitía el `onClick`. Lo detectó el recorrido de interfaz.
  - Antes de la hidratación, los formularios con `onSubmit` podían enviarse de forma nativa con los datos en la URL. Ahora el botón se habilita al hidratar y los formularios declaran `method="post"`.
- **Verificación en `http://localhost:8788`:**
  - typecheck (3 proyectos), lint y 39/39 pruebas unitarias;
  - `humo-e2e.mjs` 16/16;
  - sloplint con 0 FAIL, conservando campos 7/7, manejadores 3/3 y enlaces 10/12, con 2 sustituciones registradas;
  - 52 capturas sin desbordamientos ni controles sin nombre;
  - recorrido de interfaz 22/22;
  - ningún texto de proceso visible en 9 rutas.
- **Pendiente:**
  - la selección por región y lazo no tiene equivalente de teclado;
  - los resaltados y las notas no se sincronizan entre dispositivos;
  - las láminas de Figma no se actualizaron en esta pasada;
  - en local, el Tutor responde con el proveedor simulado («Respuesta de demostración»), un texto que genera el backend y que desaparece con Gemma;
  - la frase que verifica `humo-e2e.mjs` en `/` se conserva solo en la meta descripción.

**Ajuste de la portada y el acceso (22/11/2026), por indicación del propietario:**
- **Copy:** reescrito con tono inspirador. El titular pasa a «Convierte tus apuntes en conocimiento».
- **Hero:** se retiraron el fondo de puntos y el búho 3D (rechazado: era el logotipo extruido). El hero queda centrado, con luz de estudio en azul marino y el producto real en una pantalla en perspectiva.
- **Acceso:** login y registro centrados.
- **Rutas:** alias `/dashboard`, `/login` y `/registro` en `next.config.ts`, y script `scripts/levantar-local.sh` para levantar el entorno local.
- **Pendiente:** el render esculpido estilo Blender con Higgsfield. La generación fue bloqueada por el control de permisos de consumo de créditos y espera la autorización explícita del propietario (2 créditos; quedan 8).
- **Verificación:** recorrido de interfaz 22/22, `humo-e2e.mjs` 16/16, typecheck y lint correctos, y ningún texto de proceso visible.

**Búho esculpido en el hero (23/11/2026), con autorización expresa del propietario:**
- **Generación:** una sola imagen con Higgsfield (`gpt_image_2_6`, 2k, fondo transparente), con el logotipo oficial como referencia de estilo. Costó 2 créditos y quedan 6. Es un render tipo Blender: figura volumétrica de placas de cerámica azul marino, cejas en V de esmalte verde limón y un cerebro de vidrio azul y metal gris con trazas de circuito.
- **Archivos:**
  - el original está en `marca/generado/buho-esculpido-higgsfield.png`;
  - los derivados WebP recortados con transparencia son `frontend/public/marca/buho-esculpido-960.webp` (188 KB) y `-560.webp` (77 KB).
- **Diseño:**
  - **Escritorio:** hero en dos columnas, con el texto a la izquierda y el búho a la derecha.
  - **Móvil y tableta:** el búho va sobre el titular.
  - **Luz y sombra:** un foco de estudio detrás de la figura y una sombra de apoyo, con los tokens `--color-foco-figura` y `--color-sombra-piso`. Sin halo ni brillo.
  - **Movimiento:** entrada suave y flotación lenta; ambas se desactivan con `prefers-reduced-motion`.
  - **Captura del producto:** sigue debajo y ahora carga en diferido.
  - **Accesibilidad y marca:** la imagen es decorativa (`alt=""`, `aria-hidden`) y no sustituye al logotipo.
- **Verificación:**
  - typecheck, lint y `pnpm test` (39/39) correctos;
  - sloplint sin FAIL; se conservan los 7 de 7 campos, los 3 de 3 manejadores y 10 de 12 enlaces, con 2 retirados y registrados;
  - `humo-e2e.mjs` 16/16;
  - 52 capturas en 375, 768, 1280 y 1440 px sin desbordes ni errores de consola;
  - ningún texto de proceso visible en 9 rutas;
  - recorrido de interfaz 22/22 en la segunda ejecución. En la primera, justo después de reiniciar la web, el paso «contraseña incorrecta» no encontró el mensaje en 8 s; la API respondió 401 correctamente.

**Pruebas manuales de la API con Thunder Client (23/11/2026):**
- **Colección:** `tests/api/thunder-client/mentelyx-api.thunder-collection.json`, con 37 solicitudes en 6 carpetas: cuenta y sesión, espacios y fuentes, Tutor, plan, casos de error y autorización, y cierre.
- **Entorno:** `mentelyx-local.thunder-environment.json`, con base `http://localhost:8787/api/v1`, correos sintéticos `@example.com` e identificadores que se guardan en cada respuesta.
- **Verificación:** un ejecutor equivalente (variables, cookie de sesión y pruebas de código y de `json.error.code`) dio 36 de 37 contra la API local.
- **Hallazgo:** `POST /espacios/{id}/fuentes` con la misma `Idempotency-Key` y otro cuerpo responde `202` con `repetida: true` y devuelve la fuente anterior.
  - El diseño de la API (sección 7, catálogo de errores) exige `422 CLAVE_IDEMPOTENCIA_REUTILIZADA`.
  - `POST /tutor-ia/consultas` sí cumple.
  - Causa: `espacios.use-cases.ts` solo compara el espacio de la operación previa, no el cuerpo.
  - Queda pendiente de autorización para tocar el backend.

**Reorganización del frontend por funcionalidades (25/11/2026), aprobada por el propietario:**
- **Respaldo:** commit local `5ab6a0e` en la rama `reorganizacion-frontend`, sin push. Es la primera vez que el código entra en git: 188 archivos de `frontend`, `backend`, `packages`, `scripts`, `tests`, `.github` y la configuración del monorepo.
  - Quedaron fuera la documentación en curso, `.hallmark`, `marca` y `backend/src/atlas-credentials.env`.
  - Ese archivo tiene credenciales reales de MongoDB Atlas. Se añadió `*.env` a `.gitignore` para que no se versione.
- **Movimientos:** 14 archivos con `git mv`, según la tabla aprobada:
  - componentes de cuenta → `features/auth`;
  - `espacios.tsx` → `features/espacios`;
  - `panel-tutor.tsx` y `markdown.tsx` → `features/tutor`;
  - `cuaderno.tsx` → `features/lienzo`;
  - marco, buscador y cabecera → `features/navegacion`;
  - `lib/planes.ts` → `features/planes`;
  - íconos, marca y movimiento → `components/ui`;
  - `hidratado.ts` → `hooks`.
- **Lo que no cambió:** las rutas de `src/app`, `middleware.ts` y `lib/api-cliente.ts` y `lib/api-servidor.ts`.
- **Código nuevo:** un `index.ts` por funcionalidad como API pública. Solo se actualizaron los imports, sin cambios de lógica.
- **No se crearon** carpetas vacías (opción A). La separación de `features/*/api` y Three.js o R3F quedan para después.
- **Documentación:** la sección 4 del [diseño de interfaces](../../03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) pasa a la versión 2.3, con la estructura vigente, las reglas de importación y la correspondencia con la propuesta anterior.
- **Verificación:**
  - typecheck de los 3 proyectos, lint y `pnpm test` (39/39) correctos;
  - sloplint sin FAIL y con los elementos conservados intactos;
  - `opennextjs-cloudflare build` sin errores;
  - `humo-e2e.mjs` 16/16;
  - recorrido de interfaz 22/22;
  - 52 capturas sin desbordes ni errores de consola;
  - ningún texto de proceso visible en 9 rutas.
- **Incidencia:** Docker Desktop se cerró solo durante una primera ejecución del recorrido (4/22, el navegador no alcanzaba la web). Se reinició y la repetición dio 22/22.

**Limpieza del frontend (25/11/2026), aprobada por el propietario (10 de 10 puntos):**
- **Archivos y carpetas eliminados:**
  - `public/marca/mentelyx-buho.png`: copia PNG sin uso; el logo usa la `.webp`.
  - `frontend/.next` (110 MB) y `frontend/.open-next` (1,6 MB): builds del 21/11, hechas en Windows y ya obsoletas. Como `next-env.d.ts` importa `.next/types`, esos tipos se regeneraron con `next typegen` (29 KB).
- **Reglas CSS sin uso eliminadas:**
  - `.mensaje-aviso, .aviso`, `.pie-pagina` y `.panel-titulo` en `globals.css`;
  - `.container` y `.figure` en `base.css`.
  - Ninguna se construía de forma dinámica.
  - Los tokens `--color-warning-wash`, `--color-warning-edge` y `--container` quedan sin uso. Se conservan como parte de las escalas del sistema de diseño, igual que `--color-success`, `--text-display-s` y `--z-base`.
- **Fuera del repositorio versionado:**
  - las capturas de pasadas anteriores (`.hallmark/after` a `after4` y `recorrido` a `recorrido4`, unos 30 MB);
  - el render rechazado `marca/generado/buho-3d-higgsfield.png`.
- **Se conservan:**
  - `.hallmark/punto-control-2026-11-21`, `before`, `before.json`, `after5` y `recorrido5`;
  - `tsconfig.tsbuildinfo`, `next-env.d.ts`, `cloudflare-env.d.ts` y `node_modules`.
- **Verificación:**
  - typecheck, lint y `pnpm test` (39/39) correctos;
  - sloplint sin FAIL y con los elementos conservados intactos;
  - build sin errores;
  - `humo-e2e.mjs` 16/16;
  - recorrido de interfaz 22/22;
  - 52 capturas sin desbordes ni errores de consola;
  - 9 rutas sin texto de proceso.
