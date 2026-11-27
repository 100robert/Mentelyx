# Mentelyx — instrucciones permanentes

Trabaja sobre la carpeta raíz abierta. Fase actual: Sprint 02 (diseño de arquitectura y evaluación de atributos de calidad). No iniciar código de producción sin tarea explícita y SDD suficiente.

- Leer README.md y únicamente los documentos relevantes de docs/; usar búsqueda dirigida antes de leer carpetas enteras. Mantener enlaces y versiones; no duplicar ni sobrescribir contenido correcto.
- M1 Usuarios y Administración; M2 Cursos y Contenidos; M3 Evaluaciones y Aprendizaje; M4 Docentes y Clases; M5 Suscripciones y Pagos; M6 Tutor IA y RAG; M7 Publicidad y Patrocinios. Monolito modular, Clean Architecture. Dos cuentas públicas: Estudiante y Docente; Superadministrador interno. Studio es funcionalidad, no cuenta.
- Conservar HU/RF/AC/RC/DA/ADR/EQ. Usar gestión de cuentas, autenticación, sesiones, autorización, verificación documental y validación de credenciales académicas según contexto; evitar «identidad» ambiguo.
- Fuente de autoridad del Sprint 02: `docs/00-gestion-del-proyecto/sprint-02/instruccion-maestra.md` (20/11/2026). Consultarla antes de continuar cualquier tarea del Sprint 02; prevalece sobre decisiones anteriores contradictorias. El registro de continuidad está en `docs/00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md`.
- Decisiones vigentes de partida: PostgreSQL (Neon), MongoDB (Atlas), pgvector con BGE-M3 de 1024 dimensiones, Redis/Upstash temporal, R2 para objetos; Drizzle ORM y Drizzle Kit como única autoridad de esquema y migraciones, Kysely solo para consultas especializadas; Next.js híbrido (SSG/SSR/ISR/CSR) en Workers mediante OpenNext; Hono/TypeScript en Workers; CulqiOnline como pasarela. Revisar contra las ADR vigentes.
- Política documental permanente: no crear documentos sueltos; no duplicar especificaciones (una sola fuente de verdad por tema); no modificar decisiones aprobadas sin autorización del propietario; mantener referencias y enlaces coherentes al mover o renombrar; conservar decisiones sustituidas solo marcadas como «sustituidas».
- Distinguir decisión de diseño, hipótesis, propuesta de modificación y prueba ejecutada. No inventar métricas, fuentes, precios, tecnologías implementadas ni garantías. Citar fuentes oficiales fechadas cuando se requiera verificación externa.
- No alterar código, migraciones, presupuestos, secretos, configuraciones externas ni instalar herramientas por defecto. Sin commits/pushes/despliegues automáticos. No usar datos reales de estudiantes.
- Trabajar una tarea acotada por turno. No delegar a subagentes sin petición expresa; no releer todo el repositorio para cada tarea. Antes de editar, comprobar git status si existe Git; no eliminar cambios ajenos.
- Cada entrega: archivos modificados, decisiones cerradas, cuestiones bloqueantes, trazabilidad, verificaciones realmente ejecutadas y siguiente tarea. Documentar resultados y cambios de forma concisa.

## Flujo Git y publicación (política acordada el 27/11/2026)

- `main` es la única rama habitual de desarrollo. No crear ramas ni worktrees sin autorización del propietario.
- Ningún commit sin autorización expresa; ningún push sin autorización expresa (autorizar un commit no autoriza el push). Preparar los archivos por rutas explícitas, nunca `git add .` ni `git add -A`.
- Sin operaciones destructivas: nada de `reset --hard`, `checkout --`, `clean`, `stash drop`, rebase, squash, `--force`, `--no-verify` ni reescritura del historial.
- Preservar los avances de otras sesiones de Claude Code y de Codex: antes de editar o hacer commit, revisar `git status`, `git log`, ramas, worktrees y stashes; no sobrescribir ni revertir lo ajeno.
- Antes de publicar: ejecutar la regresión (typecheck, lint, build, Vitest y Jest; integración y Workers cuando haya Docker) y auditar credenciales con Gitleaks sobre lo preparado (`gitleaks git --staged --redact`) y sobre los commits que se van a publicar.
- Mantener la documentación y el código sincronizados: todo cambio de comportamiento actualiza su documento y el registro de continuidad.
