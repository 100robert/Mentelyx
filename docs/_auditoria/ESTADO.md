# Auditoría documental de Mentelyx — estado

**Actualizado:** 26/11/2026
**Fase activa:** revisión de diseño externo — persistencia (AUD-03-05), después de completar la revisión documental del diseño interno M1–M7.
**Alcance:** fases 0–2 completadas; actores, HU, RF, AC, EQ, restricciones, drivers y ADR fueron leídos y cotejados. Se completó la revisión documental de M1–M7, SOLID, patrones y el contraste estático con backend; siguen abiertos bloqueos de autorización/compensación y decisiones funcionales. Arquitectura general, persistencia, API, interfaces, C4 y SDD no están auditados íntegramente. No se ejecutó el Prompt 3 de integración final.

## Continuidad — corrección de hallazgos originales Codex

- La tarea vigente suspende la auditoría general y verifica los nueve hallazgos F01–F09 del informe original; no se atribuye al informe ZIP el estado actual del árbol.
- F01: se implementó el límite compartido por correo e IP confiable en las rutas propias de registro/login. Las cuatro pruebas de integración PostgreSQL pasan y el typecheck de backend pasa. Cierre local conforme al criterio automatizable; staging debe validar la IP de la topología y el umbral provisional de 120 intentos/IP/minuto, especialmente en redes compartidas.
- F02: Origin/CSRF se revalidó con adaptador real en PostgreSQL, suite de Workers y navegador local. Cookies, preflight, rechazo sin mutación, operación autorizada y revocación pasan; se añadieron pruebas Workers y se aclaró el contrato documental. No se verificó un despliegue staging/producción.
- F03: la restricción PostgreSQL `EXCLUDE` y el adaptador como árbitro idempotente se revalidaron contra PostgreSQL local. La suite P0 pasó 12/12, con ventanas concurrentes distintas, repetición exacta, rechazos de solape y verificación de contigüidad/SQLSTATE.
- F04: ARQ-01 (`pnpm arq`), MIG-04 (13/13), PR-INF-01 en Workerd (5/5), autorización por recurso y presupuestos negativos (MVP vertical 22/22) pasan localmente según EVI-030. El build OpenNext se intentó el 26/11: Next compiló y TypeScript pasó, pero el bundle falló con `EPERM` al crear un symlink en Windows; WSL no permitió repetirlo (sesión systemd fallida y Node ausente). CI remota y reinstalación limpia desde lockfile/commit no ejecutadas; `0006` sigue sin rastrear. I-0 no se declara terminado (EVI-037).
- F05: README, SDD y matriz se alinearon a 25/11/2026; se corrigieron referencia al SDD 2.0 y enlaces erróneos a la sección 16 de continuidad. La matriz conserva los EQ pendientes y marca solo la evidencia parcial ejecutada; links de evidencia llevan a EVI-027–030.
- F06: la matriz delimita el alcance I-0 + MVP vertical y traza cada requisito funcional/técnico seleccionado a criterio, responsable, contrato/datos y prueba o pendiente explícito. Incluye denegación 404, límites 429 y estados de fallo `INCIERTA`/`FALLIDA`/`PARCIAL`.
- F07: la matriz enlaza fuentes y páginas/diapositivas con criterios, documentos de decisión/ADR y validaciones pendientes. Se aclara que no se registró descarte en las ubicaciones revisadas y que los libros se revisaron de forma dirigida, no integral (EVI-033).
- F08: el árbol activo apunta a `../img/enfoque-arquitectonico.png` y la imagen se abrió; escaneo local comprobó 402 destinos en 46 Markdown sin roturas. El destino nuevo aparece no rastreado y el nombre anterior eliminado staged; hallazgo resuelto en worktree, persistencia Git pendiente (EVI-034/037).
- F09: se separaron los porcentajes por cada medio, fijo publicado y mínimo de referencia; se marcó PagoEfectivo/Cuotéalo como medios asociados al mínimo según IM. La aritmética de porcentaje se verificó; contrato, FX, impuestos y combinación final siguen sin confirmar, por lo que no se declara viabilidad comercial (EVI-035).
- El 26/11 se releyó íntegramente el informe HTML y las evidencias complementarias focales; las aceptaciones F01–F09 se cotejaron con el JSON original. Verificación final consolidada en HALLAZGOS/PENDIENTES/EVIDENCIAS (EVI-036/037). F01/F02 requieren staging, F04 conserva gates remotos y un build OpenNext bloqueado por el entorno, F08 requiere preservar el destino no rastreado y F09 sigue bloqueado por datos contractuales. No se declara cerrado I-0 ni la viabilidad comercial.
- Siguiente paso: resolver esos bloqueos con sus responsables antes de afirmar cierre operativo. La auditoría documental general y el Prompt 3 siguen suspendidos.
- Esta revalidación de F01–F09 no completa la auditoría documental general. Mantener sus registros como antecedente; no continuar AUD-03-* en esta tarea.

## Resumen verificable

- Rama actual: `reorganizacion-frontend`, HEAD `8883a42`. `main` y `origin/main` apuntan a `560de05`; la rama actual tiene dos commits posteriores. El árbol de trabajo contiene cambios staged, unstaged y untracked, incluidos cambios concurrentes de frontend, backend y documentación.
- No se revirtieron ni sobrescribieron cambios. Se observan eliminaciones ya staged de `docs.zip`, del SDD bajo `docs/05-sdd/` y del registro antiguo en `docs/`; no se alteraron.
- Se localizaron 39 Markdown en `docs/` y se verificó el índice de `README.md`. La estructura vigente es `00-gestion-del-proyecto`, `01-analisis-de-sistema`, `02-arquitectura-software`, `03-diseño-de-software`, `04-modelo-c4`, `05-evaluacion-arquitectonica` y `06-SDD`.
- En el inventario inicial se comprobaron 349 referencias locales entre los 39 documentos y `README.md`; comprobaciones posteriores dieron 350 y, tras las revisiones documentales, 351 referencias en los 45 Markdown actuales más README, todas con destino existente. La comprobación no valida anclas, renderizado ni exactitud arquitectónica.
- El SDD vigente existe en `docs/06-SDD/` y se presenta como versión 2.1. Los tres documentos de diseño externo existen y son extensos. Persistencia (01) fue leída íntegramente §§1–15 y cotejada parcialmente con esquemas/migraciones actuales; API e interfaces siguen pendientes de revisión íntegra.
- La fuente de autoridad del Sprint 02 es la instrucción maestra. ADR-093 (25/11/2026) resolvió el alcance V1 y se registró en las fuentes de análisis; H-AUD-002 conserva la normalización de versiones pendiente.
- H-AUD-009 tiene justificación semántica individual para los nueve RF sin HU directa; HU-16/HU-51 conservan cobertura funcional parcial. H-AUD-010 mantiene separadas la idempotencia técnica y las políticas comerciales no aprobadas.
- Diseño interno M1–M7 revisado frente al backend: implementación parcial solo en M1/M2/M3/M5/M6; M4/M7 son esqueletos. No se ejecutaron pruebas; se registran límites de actor Estudiante, compensaciones silenciosas y el límite actual de una preparación por cuenta.
- Persistencia v2.4: se corrigieron afirmaciones obsoletas de versión/migraciones y Better Auth, referencias incondicionales a Bunny Stream, revocación inmediata de URL firmadas y referencias de origen del ledger M5. Se confirmó estáticamente el límite M3 de PERSONAL/FUENTES y una preparación activa; Mongo M6 tiene conversación e índices TTL, pero no se hallaron validadores `$jsonSchema`, segmentos ni adaptador Mongo M2. Migraciones 0001/0002/0004/0005/0006 leídas, no ejecutadas; falta cotejo entidad por entidad.
- No se puede atribuir a Codex cada cambio local sin confirmar. El registro de continuidad documenta trabajo histórico de Codex y Claude Code; el diff actual mezcla cambios no confirmados y no proporciona autoría por archivo.

## Registro de tareas

| ID | Fuente | Criterio de aceptación | Estado |
|---|---|---|---|
| AUD-00-01 | Git y registro de continuidad del Sprint 02 | Registrar rama, HEAD, cambios existentes e historial relevante sin alterar el árbol | Completada |
| AUD-00-02 | Registro de continuidad, secciones 1–4 | Identificar las evidencias disponibles sobre la ejecución histórica de Codex y separar hechos de atribuciones no verificadas | Completada con límite de atribución documentado |
| AUD-01-01 | Árbol real de `docs/` y README | Inventariar todos los Markdown y expresar qué fue revisado y qué sigue sin lectura íntegra | Completada como inventario inicial |
| AUD-01-02 | Markdown de `docs/` y `README.md` | Comprobar destinos de enlaces locales | Completada inicialmente con 349; última comprobación 351, 0 destinos inexistentes |
| AUD-01-03 | Tres diseños externos, C4 y SDD | Registrar existencia, estado declarado y discrepancias observables; no certificar suficiencia sin lectura íntegra | Diagnóstico inicial completado; auditoría de contenido pendiente |
| AUD-01-04 | Instrucción maestra, README, interfaces y SDD | Registrar contradicciones y autoridad aplicable sin cambiar decisiones | Completada como diagnóstico inicial |
| AUD-02-01 | Este directorio | Mantener estado, inventario, hallazgos, trazabilidad, evidencias y pendientes con IDs estables | Completada |
| AUD-03-01 | `docs/01-analisis-de-sistema/` | Auditar actores, HU, RF, AC, RC, DA, ADR y EQ con trazabilidad y criterios verificables | Análisis documental completado; quedan decisiones funcionales y comerciales explícitamente pendientes |
| AUD-03-02 | Arquitectura, diseño externo/interno, C4, calidad y SDD | Verificar integridad, consistencia y brechas con evidencia por sección | En curso — revisión detallada del diseño interno M1–M7 completada; arquitectura, diseño externo, C4 y SDD pendientes |
| AUD-03-01A | Actores; instrucción maestra §3; HU y RF relacionados | Leer completo el catálogo, confirmar tipos/IDs y distinguir modelo general de disponibilidad V1 | Completada; corrección documental en `01-actores.md` |
| AUD-03-01B | Historias de usuario; reglas aprobadas en instrucción maestra | Leer HU-01–HU-90, verificar IDs activos y referencias RF citadas; conservar historias sustituidas | Completada con correcciones documentales; políticas comerciales no aprobadas siguen explícitas |
| AUD-03-01C | Requisitos funcionales RF-01–RF-122; historias | Leer el catálogo, comprobar continuidad de IDs, corregir términos obsoletos sustentados y registrar límites del cruce HU↔RF | Completada; cruce individual consolidado en la matriz |
| AUD-03-01D | `04-atributos-de-calidad.md`, `08-escenarios-atributos-calidad.md` | Leer íntegramente AC/EQ; comprobar IDs y referencias; separar metas propuestas de mediciones y registrar dependencias con reglas/decisiones | Completada documentalmente; cruce AC/EQ/RC/DA/ADR registrado; no se ejecutaron mediciones |
| AUD-03-01E | `05-restricciones.md`, `06-drivers-arquitectonicos.md`, `07-decisiones-arquitectonicas.md` | Leer íntegramente y cotejar identificadores, referencias y estado con actores, HU, RF, AC y EQ | Completada; ADR-093 resuelve alcance V1; políticas comerciales pendientes preservadas |
| AUD-03-02-DI | Diseño interno M1–M7, SOLID, patrones, contratos públicos y backend en modo de lectura | Revisar responsabilidades, límites, casos de uso, entidades, puertos/adaptadores, persistencia, eventos, estados, reglas, autorización, patrones y pruebas; clasificar implementación y registrar brechas sin modificar código | Completada documentalmente con hallazgos abiertos; sin ejecución de pruebas |
| AUD-03-17 | Persistencia §§13–15; esquemas Drizzle y migraciones actuales | Clasificar entidades e invariantes con evidencia; revisar Mongo/BSON sin ejecutar migraciones | En curso — lectura completa del documento y contraste inicial de M1/M2/M3/M5/M6; cotejo entidad por entidad pendiente |

## Estado por fases

| Fase | Resultado |
|---|---|
| 0. Recuperación | Estado de Git, ramas, commits, trabajo no confirmado y registros previos inspeccionados. No se accedió a conversaciones de Codex; se usaron solo evidencias locales. |
| 1. Diagnóstico y análisis | Inventario de 39 Markdown preexistentes; AUD-03-01 cubre actores, HU, RF, AC, EQ, RC, DA y ADR, con brechas explícitas. Diseño interno M1–M7 revisado documentalmente; arquitectura restante y diseño externo siguen parciales. |
| 2. Registro persistente | Se creó este directorio con los seis registros solicitados. |

## Próximo paso exacto

Continuar `AUD-03-17` en [01-diseño-de-persistencia-y-datos.md](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md), §13.1: completar el cruce entidad por entidad con Drizzle/migraciones para M1 y seguir M2, M3, M5 y M6; distinguir lo diseñado de lo implementado y revisar contratos. Luego cotejar Mongo/BSON sin ejecutar migraciones ni pruebas. Mantener como bloqueos la autorización Estudiante en M3/M6, compensaciones M2/M6, preparaciones múltiples y políticas comerciales.

**Sin porcentaje de avance:** la cobertura completa aún no está medida y no hay base para declarar cierre.
