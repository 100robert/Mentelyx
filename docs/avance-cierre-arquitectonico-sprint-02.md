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
| Pendiente | Reexportar 3 PNG desde sus fuentes corregidas (sin herramienta instalada) |
| Bloqueantes | Ninguno técnico. Producto: P-01 a P-10. Legal: banderas de ADR, sección 10.4 |
| Siguiente acción exacta | Evaluación de atributos de calidad (`mentelyx-calidad-sdd`) sobre EQ-01–EQ-31 y, después, SDD consolidado |

## 7. Evaluación de calidad y SDD consolidado (20/11/2026, Claude Code)

| Campo | Estado |
|---|---|
| Punto de reanudación | Sección 6 completa; sin commits nuevos desde `f9b8caa`; 21 archivos modificados sin commit |
| Completado | C4 niveles 1–3: pendientes sustituidos por su estado y proveedores nombrados en el texto (sin redibujar); P-11 (grupos privados docentes) añadido a ADR, sección 10.3 |
| Completado además | SDD v1.0 en `docs/05-sdd/documento-de-diseño-de-software.md`: evaluación inspirada en ATAM (no formal), trazabilidad de los 31 EQ, 33 pruebas nuevas (K6, FAL, CON, CAC, MIG, UNI, UX, PIL, ARQ, E2E), RTO/RPO, 16 criterios docentes sin puntaje, bloqueos, incrementos I-0 a I-7 y definición de terminado. ADR-073 añade k6 y reglas ESLint de arquitectura. Enlace desde `08-escenarios`, sección 3. README v2.2 |
| Verificaciones ejecutadas | `git diff --check` sin errores; 0 enlaces rotos en 21 archivos; trazabilidad del SDD: 31 EQ sin huecos ni duplicados, 11 AC cubiertos, todos los RF, DA, ADR y pruebas citadas definidos; persistencia sin regresiones; sin identificadores fuera de rango (ADR hasta 073, P hasta 11); sin marcas de sección. Ninguna prueba de software ejecutada |
| Pendiente | Reexportar 3 PNG; ejecutar las pruebas a partir de I-0; respuestas de producto P-01 a P-11 y legales |
| Siguiente acción exacta | Revisión del SDD por el responsable del proyecto y decisión sobre P-01 a P-11; después, incremento I-0 con instrucción explícita de implementar |
