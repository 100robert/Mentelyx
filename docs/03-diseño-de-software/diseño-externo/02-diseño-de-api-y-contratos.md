# Diseño de API REST y contratos de integración — Mentelyx

> **Proyecto:** Mentelyx · **Ubicación:** `docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md`  
> **Framework Backend:** Hono + TypeScript sobre Cloudflare Workers · **Prefijo base:** `/api/v1`  
> **Versión:** 2.1 — 17/11/2026 · **Estado:** especificación de contratos externos e internos para desarrollo; contratos propuestos, no implementados.
>
> **Cambios de la versión 2.1:** sincronización con el [contrato de coordinación](../contrato-coordinacion-datos-seguridad-infraestructura.md). CO-02: claves de render y audiencia (secciones 3.1 y 4.4). CO-04: la ejecución del Tutor queda separada del SSE (secciones 3.1 y 5.3). CO-05: modo `GENERAL` reservado (sección 4.3). INF-01: cola de mantenimiento (sección 3.1). SC-16: `202` solo tras un trabajo durable (sección 6). Cierre de datos (persistencia v2.1): endpoints de soporte (RF-32) y de reembolsos (RF-25), contratos de financiamiento de aulas M4→M7 (RF-81), cola transversal de auditoría, supresión y avisos (sección 3.1), y el caso de uso del catálogo alineado con el diseño interno (`ConsultarCatalogoUseCase`). Las rutas públicas existentes no cambian.
>
> **Cambios de la versión 2.0:** se conservan los contratos de la 1.0. Se añaden las convenciones 6 a 13 de la sección 1, los endpoints nuevos de cada módulo (sección 2), los contratos internos entre módulos (sección 2.8), los eventos nuevos de cola (sección 3.1), los DTO (sección 4), el *streaming* SSE (sección 5), los trabajos asíncronos (sección 6), el catálogo de errores (sección 7), la matriz de autorización (sección 8) y las pruebas de contrato (sección 9). También se resuelven los pendientes del informe de auditoría terminológica sobre `/docentes/acreditaciones` y el método del endpoint de permisos. Las especificaciones de IA están en `../diseño-especializado/`.

## 1. Convenciones generales de la API HTTP

1. **Formato y transporte:** HTTPS obligatorio (TLS 1.3 en Cloudflare Edge), cuerpo JSON en UTF-8 (`application/json`), excepto en webhooks de pasarela donde se lee el cuerpo crudo (`Uint8Array`) para verificar la firma criptográfica.
2. **Autenticación y sesiones:** gestión de sesión mediante cookies seguras (`HttpOnly`, `Secure`, `SameSite=Lax`) o token Bearer emitido por el adaptador de autenticación (Better Auth candidato).
3. **Autenticación (AuthN) y autorización (AuthZ) diferenciadas (ADR-004, ADR-034):**
   - **Middleware HTTP:** autentica mediante una sesión válida y aplica controles iniciales de acceso según el estado de cuenta y el rol base; una sesión autenticada no concede todos los permisos.
   - **Caso de uso / Política de dominio:** autoriza la operación verificando propiedad del recurso y los permisos aplicables; comprueba por separado, cuando corresponda, vigencia de suscripción, saldo de créditos (`LIVE` vs `STUDIO`), mayoría de edad y habilitación docente (`can_charge_classes`).
4. **Idempotencia en operaciones mutables:** las peticiones de creación de órdenes, reserva de clases, envío de evaluaciones y consumo de créditos Studio aceptan la cabecera `Idempotency-Key: <uuid-v4>`.
5. **Estructura estándar de respuesta y error:**

```json
// Respuesta exitosa estándar
{
  "ok": true,
  "data": { ... },
  "meta": {
    "requestId": "req_01jc8x9p2m",
    "timestamp": "2026-11-03T15:00:00Z"
  }
}

// Respuesta de error estándar (sin filtrar trazas ni secretos)
{
  "ok": false,
  "error": {
    "code": "INSUFFICIENT_LIVE_CREDITS",
    "message": "No cuentas con créditos Live suficientes para esta modalidad de clase (requiere 2 créditos).",
    "details": { "required": 2, "available": 1, "pool": "LIVE" }
  },
  "meta": {
    "requestId": "req_01jc8x9p2m"
  }
}
```

6. **Versionado y compatibilidad:**
   - el prefijo `/api/v1` cambia solo ante cambios incompatibles;
   - añadir campos opcionales o códigos de error nuevos es compatible; los clientes deben ignorar los campos desconocidos;
   - un endpoint retirado responde `410 RECURSO_RETIRADO` durante 90 días antes de eliminarse;
   - la especificación OpenAPI 3.1 se genera desde los mismos esquemas de validación del backend (ADR-003).
7. **Validación de entrada:**
   - cada endpoint valida cuerpo, parámetros y cabeceras con esquemas estrictos que rechazan propiedades desconocidas;
   - las cadenas se recortan y se normalizan a Unicode NFC; los identificadores son UUID v4 salvo que se indique otra cosa;
   - se usan validadores que no generan código en tiempo de ejecución, porque Cloudflare Workers restringe esa técnica (por confirmar en el prototipo);
   - tamaño máximo del cuerpo JSON: 256 KB. Los binarios se suben siempre a R2 mediante URL prefirmada, nunca por la API.
8. **Paginación y filtros:**
   - paginación por cursor opaco: `?limite=20&cursor=…`, con `limite` de 1 a 100;
   - la respuesta incluye `meta.paginacion.siguienteCursor` (o `null`);
   - los filtros se pasan como parámetros de consulta en español (`nivel`, `estado`, `desde`, `hasta`);
   - el orden por defecto es el más reciente primero.
9. **Concurrencia optimista:** los recursos editables (proyectos Studio, configuración de rutas IA, presupuestos) devuelven `ETag: "v{n}"`. Las modificaciones exigen `If-Match` y responden `412 CONFLICTO_VERSION` si la versión cambió.
10. **Idempotencia detallada** (amplía el punto 4):
    - la clave es obligatoria en las operaciones que crean efectos económicos, académicos o de costo IA: órdenes, reservas, cancelaciones, entregas de evaluación, consultas al Tutor, cotizaciones confirmadas y exportaciones;
    - el ámbito de la clave es `actor + ruta`; se guarda el hash del cuerpo normalizado durante al menos 24 h (en el Tutor, durante la retención de la conversación);
    - si la clave ya existe con el mismo cuerpo, se devuelve el resultado original. Si sigue en curso → `409 OPERACION_EN_CURSO`. Si el cuerpo es distinto → `422 CLAVE_IDEMPOTENCIA_REUTILIZADA`.
11. **Límites de tasa:**
    - las respuestas incluyen `RateLimit-Limit`, `RateLimit-Remaining` y `RateLimit-Reset`;
    - un `429` incluye `Retry-After`;
    - los límites del Tutor IA están en `../diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md` sección 10.5.
12. **Respuestas largas y trabajos:**
    - el Tutor IA admite `Accept: text/event-stream` (sección 5);
    - las operaciones lentas (generación IA de Studio, exportaciones, reindexación) responden `202 Accepted` con un recurso de trabajo (sección 6).
13. **Códigos de error:**
    - se escriben en español con MAYÚSCULAS_SNAKE (sección 7);
    - el campo nuevo `error.recuperable` (booleano) indica si el cliente puede reintentar;
    - el código del ejemplo anterior, `INSUFFICIENT_LIVE_CREDITS`, se normaliza como `CREDITOS_LIVE_INSUFICIENTES` y se acepta como alias durante la v1.

---

## 2. Catálogo de Endpoints REST por Módulo (M1–M7)

### 2.1. Módulo 1 — Usuarios y Administración (`/api/v1/auth` y `/api/v1/usuarios`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/registro` | Público | `RegistrarCuentaUseCase` | Registra cuenta (`ESTUDIANTE`, `DOCENTE`) sin exigir correo institucional. Si es Docente, define modalidad `LIBRE` o `NIVEL_ACADEMICO`. |
| `POST` | `/api/v1/auth/login` | Público | `IniciarSesionUseCase` | Autentica credenciales y establece sesión segura. |
| `POST` | `/api/v1/auth/logout` | Autenticado | `CerrarSesionUseCase` | Revoca la sesión activa. |
| `GET` | `/api/v1/usuarios/me` | Autenticado | `ConsultarPermisosUseCase` | Devuelve perfil, tipo de cuenta, modalidad docente, estado de habilitación y banderas de protección de menor. |
| `PATCH` | `/api/v1/admin/usuarios/:id/permisos` | Superadministrador (MFA) | `GestionarPermisosUseCase` | Modifica permisos o suspensiones dejando registro obligatorio en `audit_logs`. *(v2.0: método unificado a `PATCH`, igual que la secuencia M1; antes figuraba `POST`. Cuerpo: `{agregar: Permiso[], revocar: Permiso[], motivo}`.)* |

**Endpoints añadidos en la v2.0 (M1):**

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/correo/verificar` | Público (con token) | `VerificarCorreoUseCase` | Confirma el correo con un token de un solo uso (RF-02) |
| `POST` | `/api/v1/auth/recuperacion` | Público | `SolicitarRecuperacionUseCase` | Siempre responde `202`, sin revelar si el correo existe |
| `POST` | `/api/v1/auth/recuperacion/confirmar` | Público (con token) | `ConfirmarRecuperacionUseCase` | Nueva contraseña; revoca las demás sesiones |
| `PATCH` | `/api/v1/usuarios/me` | Autenticado | `ActualizarPerfilPropioUseCase` | Datos de perfil editables. No cambia el tipo de cuenta ni la modalidad (que tiene su propio procedimiento) |
| `POST` | `/api/v1/usuarios/me/consentimientos-parentales` | Cuenta de menor | `SolicitarConsentimientoParentalUseCase` | Envía una invitación al adulto responsable (`parental_consents`) |
| `POST` | `/api/v1/consentimientos-parentales/:token/decision` | Adulto responsable (con token) | `RegistrarDecisionConsentimientoUseCase` | Otorga o rechaza los consentimientos por finalidad (uso de la plataforma, audiovisual, Tutor IA) |
| `GET` | `/api/v1/admin/auditoria` | Superadministrador (MFA) | `ConsultarAuditoriaUseCase` | Filtros por actor, operación y fechas; paginado (RF-31) |
| `POST` | `/api/v1/soporte/incidencias` | Autenticado; `Idempotency-Key` | `RegistrarIncidenciaUseCase` | `{categoria, asunto, mensaje, referencia?}` → `201`; mensaje redactado, sin datos D3 (`support_tickets`, RF-32) |
| `GET` | `/api/v1/soporte/incidencias/me` | Autenticado | `ListarIncidenciasPropiasUseCase` | Paginado por `(created_at, id)` |
| `GET` | `/api/v1/admin/soporte/incidencias` | Superadministrador o permiso `atender_soporte` | `ListarIncidenciasUseCase` | Filtros por estado y prioridad |
| `PATCH` | `/api/v1/admin/soporte/incidencias/:id` | Ídem | `AtenderIncidenciaUseCase` | Cambio de estado o respuesta; `If-Match` con la versión; evento INSERT-only |

### 2.2. Módulo 2 — Cursos, Contenidos y Mentelyx Studio (`/api/v1/cursos` y `/api/v1/studio`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/cursos` | Público / Estudiante | `ConsultarCatalogoUseCase` | Lista cursos publicados por nivel (`PRIMARIA`, `SECUNDARIA`, `PREUNI`, `UNIVERSITARIO`) con filtros `area`, `tema` y `pagina` (RF-05) y caché Redis. Se llamaba `ListarCatalogoUseCase` en la v2.0 y se alinea con el diseño interno |
| `POST` | `/api/v1/studio/proyectos` | Estudiante / Docente con permiso de Studio | `CrearProyectoStudioUseCase` | Crea o guarda edición manual en Studio (**0 créditos IA consumidos**). |
| `POST` | `/api/v1/studio/proyectos/:id/archivos/url-subida` | Propietario del proyecto | `EmitirUrlSubidaR2UseCase` | Genera URL pre-firmada temporal hacia Cloudflare R2 y registra metadatos en PostgreSQL. |
| `POST` | `/api/v1/studio/proyectos/:id/publicar` | Estudiante / Docente con autorización editorial | `PublicarVersionContenidoUseCase` | Sella una versión inmutable en MongoDB/PostgreSQL y encola indexación RAG si la licencia lo permite. |
| `POST` | `/api/v1/studio/proyectos/:id/generar-ia` | Usuario con cuota Studio | `SolicitarGeneracionStudioUseCase` | Muestra/valida el costo en **créditos Studio** (ej. 5 créditos presentación, 10 imagen estándar) y descuenta de forma idempotente vía M5. *(v2.0: exige una cotización previa: cuerpo `{cotizacionId}` + `Idempotency-Key`; responde `202` con el trabajo, sección 6.)* |

**Endpoints añadidos en la v2.0 (M2):**

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/cursos/:cursoId` | Público / Estudiante | `ObtenerCursoUseCase` | Ficha del curso y temario publicado |
| `GET` | `/api/v1/cursos/:cursoId/lecciones/:leccionId` | Según licencia, plan y nivel | `ObtenerLeccionUseCase` | `?version=` opcional; por defecto la vigente. Responde con `ETag` |
| `GET` | `/api/v1/studio/proyectos` | Propietario | `ListarProyectosStudioUseCase` | Paginado |
| `GET` | `/api/v1/studio/proyectos/:id` | Propietario | `ObtenerProyectoStudioUseCase` | Documento completo + `ETag: "v{n}"` |
| `PUT` | `/api/v1/studio/proyectos/:id` | Propietario; `If-Match` | `GuardarProyectoStudioUseCase` | Guarda una nueva versión manual (**0 créditos**); `412` ante un conflicto (RF-69) |
| `PUT` | `/api/v1/studio/proyectos/:id/versiones/:version/permisos` | Propietario con permiso editorial | `ConfigurarPermisosVersionUseCase` | Permisos **separados**: `publicar`, `comercializar`, `indexarRAG`, `entrenamiento` (este último siempre `false` para menores) (HU-53, RC-11, RC-12) |
| `POST` | `/api/v1/studio/cotizaciones-ia` | Usuario con permiso Studio IA | `CotizarGeneracionStudioUseCase` | Modera el pedido y devuelve los créditos, el saldo y la expiración (10 min) sin debitar |
| `GET` | `/api/v1/studio/trabajos/:id` | Propietario | `ConsultarTrabajoStudioUseCase` | Estado del trabajo (sección 6) |
| `GET` | `/api/v1/studio/trabajos/:id/eventos` | Propietario | — | Progreso por SSE (sección 6) |
| `POST` | `/api/v1/studio/proyectos/:id/exportaciones` | Propietario | `SolicitarExportacionUseCase` | `{formato: PDF\|PPTX, plantilla, audiencia}` → `202` con el trabajo; **0 créditos** |
| `GET` | `/api/v1/studio/exportaciones/:id` | Propietario o licenciatario | `ObtenerDescargaUseCase` | URL R2 firmada de 300 s (`05-generacion-de-materiales-educativos.md` sección 8) |
| `GET` | `/api/v1/studio/plantillas` | Usuario con Studio | `ListarPlantillasUseCase` | Plantillas publicadas con su versión |
| `POST` | `/api/v1/escenas/validar` | Usuario con Studio | `ValidarEscenaUseCase` | Valida y compila `mentelyx.escena/v1` de forma determinista (0 créditos); devuelve la escena resuelta o los errores |
| `POST` | `/api/v1/apuntes` | Estudiante / Docente | `SubirApunteUseCase` | Crea el apunte y devuelve la URL de subida R2 (RF-55, HU-42) |
| `GET` | `/api/v1/apuntes` | Propietario | `ListarApuntesUseCase` | Paginado |
| `PUT` | `/api/v1/apuntes/:id/tutor` | Propietario | `ActivarApunteParaTutorUseCase` | `{activo: boolean}` → emite `ApunteActivadoParaTutor` / `ApunteDesactivadoParaTutor` |
| `DELETE` | `/api/v1/apuntes/:id` | Propietario | `EliminarApunteUseCase` | Elimina el documento y purga su índice |

### 2.3. Módulo 3 — Evaluaciones y Aprendizaje (`/api/v1/evaluaciones`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/evaluaciones/:id/intentos` | Estudiante | `IniciarIntentoEvaluacionUseCase` | Abre un intento asociado a la versión exacta de la evaluación. |
| `POST` | `/api/v1/evaluaciones/:id/intentos/:intentoId/entregar` | Estudiante propietario | `EntregarYCalificarEvaluacionUseCase` | Califica de forma determinista y reproducible, guarda nota oficial en PostgreSQL y actualiza ruta de estudio. |
| `GET` | `/api/v1/evaluaciones/progreso/me` | Estudiante | `ConsultarProgresoUseCase` | Devuelve historial de diagnósticos, simulacros y áreas a reforzar. |

**Endpoints añadidos en la v2.0 (M3):**

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/evaluaciones/:id` | Estudiante con acceso | `ObtenerEvaluacionUseCase` | Metadatos y estructura sin soluciones |
| `PUT` | `/api/v1/evaluaciones/:id/intentos/:intentoId/respuestas` | Estudiante propietario; `If-Match` | `GuardarRespuestasParcialesUseCase` | Guardado parcial remoto; la PWA indica «guardado local» frente a «confirmado» |
| `POST` | `/api/v1/preparacion/objetivos` | Estudiante | `DefinirObjetivoExamenUseCase` | Ficha de examen, fecha y horas disponibles (RF-49) |
| `GET` | `/api/v1/preparacion/plan` | Estudiante | `ConsultarPlanPreparacionUseCase` | Plan determinista vigente (RF-50) |
| `GET` | `/api/v1/preparacion/seguimiento` | Estudiante | `ConsultarSeguimientoUseCase` | Avance por área sin presentarlo como predicción (RF-52, RC-17) |

### 2.4. Módulo 4 — Docentes y Clases (`/api/v1/docentes` y `/api/v1/clases`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/docentes/acreditaciones` | Docente / Est. Universitario adulto | `SolicitarHabilitacionDocenteUseCase` | Envía una solicitud de habilitación docente con verificación documental del solicitante; la validación de credenciales académicas se tramita por separado y solo corresponde al perfil Docente por nivel académico. No se acredita un título por aprobar la habilitación. |
| `POST` | `/api/v1/clases/sesiones` | Docente / Tutor habilitado | `ProgramarSesionLiveUseCase` | Crea sesión grupal (6–35 alumnos, 1 crédito), reforzamiento (2–5, 2 créditos) o individual (1, 3 créditos), validando viabilidad con M5. |
| `POST` | `/api/v1/clases/sesiones/:id/reservar` | Estudiante | `ReservarClaseUseCase` | Verifica cupo con control de concurrencia SQL y descuenta **créditos Live** (1, 2 o 3) mediante contrato con M5. |
| `POST` | `/api/v1/clases/sesiones/:id/ingresar` | Estudiante con reserva / Docente | `EmitirCredencialAulaUseCase` | Verifica permiso y consentimiento audiovisual (menores) y devuelve token efímero para conectarse directo al SFU/WebRTC. |
| `POST` | `/api/v1/clases/sesiones/:id/cerrar-asistencia` | Docente / Sistema | `ConfirmarPrestacionClaseUseCase` | Registra asistencia efectiva y emite evento `ClasePrestadaValidada` hacia M5 para habilitar liquidación. |

**Contrato pendiente de revisión:** la ruta propuesta `/api/v1/docentes/acreditaciones` y el caso `SolicitarHabilitacionDocenteUseCase` nombran procesos distintos. Deben definirse contratos diferenciados para verificación documental, validación de credenciales académicas y habilitación docente antes de implementarlos. Se conserva la ruta como propuesta pendiente, sin asumir un contrato público ya desplegado.

**Resolución (v2.0):** la ruta `/api/v1/docentes/acreditaciones` **no se implementa**. Se sustituye por tres solicitudes con estados separados bajo el prefijo neutro `/api/v1/habilitacion`. El prefijo es neutro porque un Estudiante universitario adulto también puede solicitar la habilitación sin ser Docente. La implementación exige la solicitud de cambio SC-09 sobre `teaching_accreditations`.

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/habilitacion/me` | Docente / Estudiante | `ConsultarEstadosHabilitacionUseCase` | Devuelve **tres estados independientes**: verificación documental, credenciales académicas (lista vacía para modalidad libre y para Estudiante) y habilitación para tutorías |
| `POST` | `/api/v1/habilitacion/documentos/url-subida` | Solicitante | `EmitirUrlDocumentoHabilitacionUseCase` | URL R2 prefirmada en un espacio privado. Los documentos son datos D3: **nunca** se envían a proveedores de IA |
| `POST` | `/api/v1/habilitacion/verificaciones-documentales` | Docente ≥ 18 o Estudiante universitario ≥ 18 | `SolicitarVerificacionDocumentalUseCase` | Verificación documental del solicitante. No valida títulos |
| `POST` | `/api/v1/habilitacion/credenciales-academicas` | **Solo** Docente con modalidad `NIVEL_ACADEMICO` | `SolicitarValidacionCredencialUseCase` | Validación de una credencial académica; para otra modalidad responde `409 MODALIDAD_NO_ADMITE_CREDENCIALES` (RF-59) |
| `POST` | `/api/v1/habilitacion/solicitudes-tutoria` | Docente (cualquier modalidad) o Estudiante universitario ≥ 18 | `SolicitarHabilitacionTutoriaUseCase` | Habilitación para impartir tutorías remuneradas sobre los temas declarados. Se aprueba solo con la verificación documental `APROBADA` (RF-58, RF-88) |
| `GET` | `/api/v1/admin/habilitacion/:cola` | Superadministrador (MFA) | `ListarSolicitudesHabilitacionUseCase` | `cola` ∈ {`verificaciones-documentales`, `credenciales-academicas`, `solicitudes-tutoria`}; filtro `?estado=` |
| `POST` | `/api/v1/admin/habilitacion/:cola/:id/decision` | Superadministrador (MFA) | `DecidirSolicitudHabilitacionUseCase` | `{decision: APROBAR\|RECHAZAR\|SOLICITAR_SUBSANACION, motivo}`. Si se aprueba una tutoría, M4 invoca `registrarHabilitacionAprobada` de M1. Cada decisión queda en `audit_logs` |

**Otros endpoints añadidos en la v2.0 (M4):**

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `PUT` | `/api/v1/docentes/me/perfil` | Docente | `ConfigurarPerfilDocenteUseCase` | El DTO depende de la modalidad: `LIBRE` (temas, experiencia) o `NIVEL_ACADEMICO` (niveles, asignaturas, formación declarada) (RF-19, RF-57) |
| `GET` | `/api/v1/docentes/:id` | Público | `ConsultarPerfilPublicoUseCase` | Muestra credenciales **solo** si están `APROBADA` (RF-20) |
| `GET` | `/api/v1/clases/sesiones` | Público / Estudiante | `ListarSesionesUseCase` | Filtros `tema`, `nivel`, `modalidad`, `desde`; también lo usa el contrato `buscarOfertasTutoria` del Tutor IA |
| `GET` | `/api/v1/clases/reservas/me` | Estudiante | `ListarReservasPropiasUseCase` | — |
| `POST` | `/api/v1/clases/reservas/:id/cancelar` | Estudiante propietario; `Idempotency-Key` | `CancelarReservaUseCase` | Restitución según la versión comercial (HU-56) |
| `POST` | `/api/v1/clases/sesiones/:id/grabacion` | Docente habilitado de la sesión | `AutorizarGrabacionUseCase` | Desactivada por defecto; exige consentimientos (RF-45, RC-13) |

### 2.5. Módulo 5 — Suscripciones, Pagos y Créditos (`/api/v1/pagos` y `/api/v1/suscripciones`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/pagos/ordenes` | Usuario autenticado | `ComprarPlanUseCase` | Crea orden en estado `PENDIENTE` fijando la `policy_version` del plan (`EST_PLUS`, `EST_PRO`, `AULAS_LIVE`, `STUDIO_PLUS`, `STUDIO_PRO`). |
| `POST` | `/api/v1/pagos/webhook` | Pasarela externa (Firmado) | `ConfirmarPagoWebhookUseCase` | Verifica firma, deduplica `(provider, eventId)` en PostgreSQL, activa derechos/créditos correspondientes y registra Outbox en una sola transacción ACID. |
| `GET` | `/api/v1/suscripciones/me/derechos` | Usuario autenticado | `ConsultarEntitlementsUseCase` | Retorna suscripción activa, saldo de **créditos Live**, saldo de **créditos Studio** (separados) y cuotas de Tutor IA. |
| `GET` | `/api/v1/pagos/liquidaciones/me` | Docente / Tutor habilitado | `ConsultarLiquidacionesDocenteUseCase` | Consulta liquidaciones calculadas sobre créditos efectivamente consumidos en clases impartidas (referencia candidata S/8/crédito sujeta a contrato). |

**Endpoints añadidos en la v2.0 (M5):**

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/planes` | Público | `ListarPlanesUseCase` | Versión comercial vigente de cada producto, con derechos y cuotas **en lenguaje claro** (consultas de Tutor, créditos Live y créditos Studio por separado) |
| `GET` | `/api/v1/suscripciones/me/movimientos` | Autenticado | `ConsultarMovimientosUseCase` | `?pool=LIVE\|STUDIO` obligatorio; los dos historiales nunca se mezclan (RC-34) |
| `POST` | `/api/v1/suscripciones/:id/cancelar` | Titular; `Idempotency-Key` | `CancelarSuscripcionUseCase` | Cancelación al final del periodo según la versión comercial (RF-13) |
| `POST` | `/api/v1/pagos/ordenes/:id/reembolso` | Titular; `Idempotency-Key` | `SolicitarReembolsoUseCase` | Crea `refund_requests` en SOLICITADO si la política versionada lo admite (RF-25). Cancelar una reserva o una suscripción usa el mismo caso de uso cuando corresponde reembolsar |
| `POST` | `/api/v1/admin/pagos/reembolsos/:id/decision` | Superadministrador (MFA) | `DecidirReembolsoUseCase` | Aprueba o rechaza; el reembolso aprobado se ejecuta por `PaymentPort` y revierte créditos por el ledger, una sola vez |

### 2.6. Módulo 6 — Tutor IA y RAG (`/api/v1/tutor-ia`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/tutor-ia/consultas` | Estudiante con cuota | `ResponderConsultaUseCase` | Verifica cuota en M5, filtra fragmentos en `pgvector` según ACL/licencia de M2, genera respuesta pedagógica con citas y registra tokens/costo. |
| `GET` | `/api/v1/tutor-ia/consumo/me` | Autenticado | `ConsultarUsoIaUseCase` | Muestra el consumo acumulado de consultas IA del periodo frente al límite del plan. |

*(v2.0: `POST /api/v1/tutor-ia/consultas` exige `Idempotency-Key` y admite `Accept: text/event-stream`. Su DTO está en la sección 4.3 y sus eventos en la sección 5. Orquestación: `../diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md`.)*

**Endpoints añadidos en la v2.0 (M6):**

| Método | Ruta | Actor / Permiso | Caso de uso | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/tutor-ia/conversaciones` | Usuario con derecho Tutor IA | `CrearConversacionUseCase` | Contexto: superficie, recurso, ejercicio o curso; `usarApuntes` |
| `GET` | `/api/v1/tutor-ia/conversaciones` | Propietario | `ListarConversacionesUseCase` | Solo las vigentes dentro de la retención (30 días adultos / 14 días menores) |
| `GET` | `/api/v1/tutor-ia/conversaciones/:id` | Propietario | `ObtenerConversacionUseCase` | Mensajes, escenas y citas (las citas a materiales retirados muestran «no disponible») |
| `DELETE` | `/api/v1/tutor-ia/conversaciones/:id` | Propietario | `EliminarConversacionUseCase` | Borrado inmediato de los mensajes y adjuntos |
| `GET` | `/api/v1/tutor-ia/consultas/:operationKey` | Propietario | `ConsultarOperacionTutorUseCase` | Estado o resultado tras un corte del *stream*; nunca dispara una nueva inferencia |
| `POST` | `/api/v1/tutor-ia/consultas/:operationKey/cancelar` | Propietario | `CancelarConsultaUseCase` | Aborta la inferencia en curso y deja la operación `CANCELADA`. Consumo: 0 UTI si no se había emitido ningún token; el peso de la ruta si la respuesta ya había comenzado. Idempotente; sobre una operación terminada responde `200` con su estado final |
| `POST` | `/api/v1/tutor-ia/consultas/:operationKey/valoracion` | Propietario | `ValorarRespuestaUseCase` | `{util: boolean, categoria?: INCORRECTA\|CONFUSA\|INADECUADA\|OTRA, comentario?}` → `ai_quality_reports` (SC-12) |
| `POST` | `/api/v1/tutor-ia/adjuntos/url-subida` | Usuario con la función de visión | `EmitirUrlAdjuntoUseCase` | JPEG/PNG/WebP ≤ 8 MB; se elimina junto con la conversación |
| `POST` | `/api/v1/tutor-ia/transcripciones` | Usuario con la función de visión; `Idempotency-Key` | `TranscribirImagenUseCase` | Imagen → `{latex, texto, confianza}` para que el usuario confirme antes de resolver (2 UTI) |
| `GET` | `/api/v1/admin/rag/documentos` | Superadministrador (MFA) | `ListarIndexacionesUseCase` | Estados de `rag_index_documents`; filtros `estado`, `scope` |
| `POST` | `/api/v1/admin/rag/documentos/:contentId/reindexar` | Superadministrador (MFA); `Idempotency-Key` | `SolicitarReindexacionUseCase` | `202` con el trabajo |
| `POST` | `/api/v1/admin/rag/documentos/:contentId/retirar` | Superadministrador (MFA) | `RetirarDeRagUseCase` | Retiro de emergencia (`REVOCADO`) con motivo; informa a M2 |
| `GET` | `/api/v1/admin/ia/estado` | Superadministrador (MFA) | `ConsultarEstadoIaUseCase` | Rutas, circuitos, latencia, errores y costo del periodo (RF-71) |
| `GET` / `PUT` | `/api/v1/admin/ia/rutas` | Superadministrador (MFA); `If-Match` | `GestionarRutasIaUseCase` | Configuración `mentelyx.rutas-ia/v1`, prospectiva y auditada |
| `GET` / `PUT` | `/api/v1/admin/ia/presupuestos` | Superadministrador (MFA); `If-Match` | `GestionarPresupuestosIaUseCase` | Presupuestos y umbrales 70/90/100 % (SC-11) |
| `GET` | `/api/v1/admin/ia/reportes-calidad` | Superadministrador (MFA) | `ListarReportesCalidadUseCase` | Cola de revisión de respuestas valoradas negativamente |
| `PATCH` | `/api/v1/admin/ia/reportes-calidad/:id` | Superadministrador (MFA) | `ResolverReporteCalidadUseCase` | `{estado: CONFIRMADO\|DESCARTADO, accion}` |

### 2.7. Módulo 7 — Publicidad y Patrocinios (`/api/v1/publicidad`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/publicidad/espacios/:ubicacion` | Público / Plan Gratuito | `SeleccionarAnuncioUseCase` | Devuelve patrocinio permitido solo en superficies autorizadas (nunca en evaluaciones, clases Live, Studio ni cobros, y sin perfilar menores). |
| `POST` | `/api/v1/publicidad/campanias` | Superadministrador | `CrearCampaniaUseCase` | Registra campaña o patrocinio de aula gratuita con presupuesto verificado. |

*(v2.0: las superficies del Tutor IA, la pizarra, las escenas 3D, el editor de Studio y la descarga de materiales se añaden a las ubicaciones excluidas: `SeleccionarAnuncioUseCase` responde `403 UBICACION_NO_PERMITIDA`.)*

### 2.8. Contratos internos entre módulos (API pública `index.ts`)

Estas son llamadas TypeScript dentro del monolito modular (`diseño-interno-de-modulos.md` sección 10.1), no endpoints HTTP. Las marcadas **nuevo** se añaden en la v2.0 para el Tutor IA, el RAG y Studio.

```ts
// M1 — Usuarios y Administración
obtenerUsuarioAutenticado(c: Credenciales): Promise<{ id: string; tipoCuenta: 'ESTUDIANTE' | 'DOCENTE' | 'SUPERADMIN';
  esMenor: boolean; nivel?: Nivel; modalidadDocente?: 'LIBRE' | 'NIVEL_ACADEMICO'; estado: 'ACTIVE' | 'SUSPENDED' }>;
verificarPermiso(actorId: string, accion: AccionProtegida, recursoId?: string): Promise<boolean>;
registrarHabilitacionAprobada(cmd: { usuarioId: string; temas: TemaHabilitado[]; vigenteHasta?: string;
  decisionId: string }): Promise<void>;                                                     // consumidor: M4

// M2 — Cursos y Contenidos
consultarTemarioVersionado(cursoId: string, version?: number): Promise<Temario>;           // M3
consultarMaterialEvaluable(recursoId: string, version: number): Promise<MaterialEvaluable>; // M3
verificarLicenciaYAcceso(actorId: string, recursoId: string, version?: number): Promise<boolean>; // M6
obtenerFuenteVersionada(actorId: string, recursoId: string): Promise<FuenteAutorizada>;   // M6
listarRecursosConsultables(actorId: string, ctx: ContextoConsulta): Promise<string[]>;    // M6 (nuevo, ≤ 200)
obtenerFuenteParaIndexar(contentId: string, version: number): Promise<FuenteIndexable>;   // M6 (nuevo; solo versiones con RAG autorizado)

// M3 — Evaluaciones y Aprendizaje
consultarProgresoAutorizado(actorId: string, alcance: AlcanceProgreso): Promise<ResumenProgreso>; // M6
consultarRestriccionesTutor(actorId: string, recursoId?: string, ejercicioId?: string):
  Promise<{ bloqueado: boolean; motivo?: 'EVALUACION_EN_CURSO' | 'SIMULACRO_EN_CURSO'; modoPista: boolean;
            nivelPistaMax: 1 | 2 | 3 | 4 }>;                                                // M6 (nuevo)

// M4 — Docentes y Clases
buscarOfertasTutoria(f: { tema: string; nivel: Nivel; limite: number }):
  Promise<Array<{ sesionId: string; titulo: string; modalidad: string; creditosLive: number; inicio: string }>>; // M6 (nuevo, solo lectura)

// M5 — Suscripciones y Pagos
reservarCreditoLive / confirmarConsumoLive / revertirCreditoLive / evaluarViabilidadClase   // M4 (existentes)
consultarDerechoTutorIA(actorId: string): Promise<DerechoTutorIA>;                         // M6 (existente; campos en 01-…orquestacion sección 10.2)
consultarDerechoStudio(actorId: string): Promise<{ habilitado: boolean; saldo: number; funciones: FuncionesStudio;
  policyVersion: string }>;                                                                 // M2 / M6
cotizarOperacionStudio(actorId: string, op: OperacionStudio): Promise<Cotizacion>;         // M2 (nuevo)
consumirOperacionStudio(actorId: string, cotizacionId: string, operationKey: string):
  Promise<{ movimientoId: string; saldo: number }>;                                         // M2 (existente, se precisa la firma)
reembolsarOperacionStudio(operationKey: string, motivo: 'FALLA_IMPUTABLE_SERVICIO'):
  Promise<{ reintegrado: boolean; saldo: number }>;                                         // M2 / M6 (nuevo; idempotente por refund:{operationKey})

// M7 — Publicidad y Patrocinios (RF-81)
reservarFinanciamientoAula(cmd: { sesionId: string; montoPen: string; operationKey: string }):
  Promise<{ asignacionId: string; estado: 'RESERVADA' | 'SIN_FONDOS' }>;                   // M4 (nuevo)
confirmarFinanciamientoAula(asignacionId: string): Promise<void>;                          // M4 (nuevo; al validar la prestación)
liberarFinanciamientoAula(asignacionId: string, motivo: 'CANCELADA' | 'NO_PUBLICADA'): Promise<void>; // M4 (nuevo; idempotente)
```

**Regla:** ningún contrato expone tablas, repositorios ni DTO de base de datos. Los nuevos contratos se prueban con pruebas de contrato del módulo consumidor (sección 9).

---

## 3. Contratos de Mensajería Asíncrona (Cloudflare Queues + Outbox)

Todos los mensajes publicados a **Cloudflare Queues** transportan únicamente identificadores y metadatos ligeros (nunca archivos binarios ni secretos) y son procesados por consumidores que implementan **Idempotent Receiver**.

| Cola / Tópico | Evento (`type`) | Productor | Consumidor | Clave de idempotencia | Acción en fallo agudo (DLQ) |
|---|---|---|---|---|---|
| `mentelyx-billing-events` | `PagoConfirmado` | Outbox M5 | Worker Notificaciones / Conciliación | `outbox_event_id` | Enviar a `mentelyx-billing-dlq` + alerta administrativa. |
| `mentelyx-rag-indexing` | `DocumentoPublicadoParaRAG` | Outbox M2 | `queue-indexer.worker.ts` (M6) | `docId + version + stage` | Reintento con backoff exponencial (máx. 3) → `mentelyx-rag-dlq`. |
| `mentelyx-studio-ai` | `StudioGenerationRequested` | Aplicación M2/M5 | Worker Generación IA (M6) | `studio_operation_key` | Si falla antes de inferencia, revertir reserva de crédito Studio en M5. |
| `mentelyx-settlements` | `ClasePrestadaValidada` | Outbox M4 | Liquidador M5 | `session_id + settlement_type` | Conservar en DLQ para conciliación financiera sin duplicar pagos. |

### Ejemplo de payload JSON en Cloudflare Queues (`DocumentoPublicadoParaRAG`)
```json
{
  "messageId": "msg_992817263",
  "eventType": "DocumentoPublicadoParaRAG",
  "occurredAt": "2026-11-03T15:10:00Z",
  "idempotencyKey": "rag-idx:550e8400-e29b-41d4-a716-446655440000:v3",
  "payload": {
    "contentId": "550e8400-e29b-41d4-a716-446655440000",
    "version": 3,
    "courseId": "440e8400-e29b-41d4-a716-446655440999",
    "r2StorageKey": "courses/440e/v3/material.pdf",
    "licenseAllowsRag": true
  }
}
```

### 3.1. Eventos y colas añadidos en la v2.0

| Cola | Evento (`type`) | Productor | Consumidor | Clave de idempotencia | Fallo agudo (DLQ) |
|---|---|---|---|---|---|
| `mentelyx-rag-indexing` | `DocumentoRetiradoDeRAG` | Outbox M2 (despublicación, revocación de licencia o retiro del permiso RAG) | Indexador M6 | `rag-ret:{contentId}:v{version}` | `mentelyx-rag-dlq` + alerta **crítica** (la revalidación con M2 sigue protegiendo mientras tanto) |
| `mentelyx-rag-indexing` | `ApunteActivadoParaTutor` / `ApunteDesactivadoParaTutor` | Outbox M2 | Indexador M6 | `apunte:{id}:v{version}:{estado}` | `mentelyx-rag-dlq` |
| `mentelyx-rag-indexing` | `ReindexacionSolicitada` | M6 (administración o cambio de modelo o *chunker*) | Indexador M6 | `reidx:{contentId}:{embeddingModel}:{chunker}` | `mentelyx-rag-dlq` |
| `mentelyx-studio-ai` | `StudioGenerationRequested` (amplía la 1.0 con `tipo`: `DOCUMENTO`, `ESCENA`, `IMAGEN`, `OBJETO_3D`) | Aplicación M2 tras el débito M5 | Worker M6 | `studio_operation_key` | Reintegro idempotente (`STUDIO_AI_REFUND`) si la falla es imputable |
| `mentelyx-studio-ai-resultados` (nueva) | `StudioGenerationCompleted` / `StudioGenerationFailed` | Worker M6 | M2 (guarda el borrador o registra la falla) | `studio_operation_key + estado` | `mentelyx-studio-ai-dlq` + alerta |
| `mentelyx-renders` (nueva) | `MaterialRenderRequested` | Outbox M2 | Worker de renderizado M2 | `render:{renderJobId}`. El `input_hash` incluye formato, audiencia y política de exclusión; la reutilización se limita al mismo propietario y proyecto (CO-02) | `mentelyx-renders-dlq`; el trabajo pasa a `FALLIDO` con un código |
| `mentelyx-mantenimiento` (nueva, programada) | `PurgaConversacionesTutor`, `PurgaIndicesRevocados`, `PurgaExportacionesNoVigentes`, `PurgaDocumentosHabilitacion` | Cron Trigger cada 15 min, borrado a petición y barrido diario | Dueño M2 / M4 / M6 | `purga:{tipo}:{fecha}:{cursor}` (INF-01) | `mentelyx-mantenimiento-dlq` + alerta; la denegación de acceso no espera a la purga |
| `mentelyx-tutor-execution` (nueva, CO-04) | `ConsultaTutorAdmitida` | Outbox M6 tras la admisión | Ejecutor M6 con *lease* SQL | `operationKey` | `mentelyx-tutor-execution-dlq`; la operación queda `INCIERTA` y se concilia, nunca se reinvoca al proveedor a ciegas |
| `mentelyx-transversal` (nueva) | `AuditoriaRegistrada`, `SupresionSolicitada`, `AvisoSolicitado` | Outbox de M1–M7 | M1 (`audit_logs`, `deletion_requests`, `notification_deliveries`) | `eventId` del productor | `mentelyx-transversal-dlq` + alerta; un aviso fallido no revierte la operación de negocio |

**Mensajes:** solo identificadores, versiones y metadatos de acceso; nunca contenido de usuarios, prompts ni archivos (se conserva la regla de la sección 3).

---

## 4. DTO principales

### 4.1. Envoltorio común

```ts
export type Meta = {
  requestId: string; timestamp: string;
  paginacion?: { siguienteCursor: string | null; limite: number };
};
export type Exito<T> = { ok: true; data: T; meta: Meta };
export type Fallo = {
  ok: false;
  error: { code: CodigoError; message: string; recuperable: boolean; details?: Record<string, unknown> };
  meta: Meta;
};
```

### 4.2. Registro de cuenta (M1)

```ts
export type RegistroRequest =
  | { tipoCuenta: 'ESTUDIANTE'; correo: string; contrasena: string; nombres: string; fechaNacimiento: string /* AAAA-MM-DD */;
      nivel: 'PRIMARIA' | 'SECUNDARIA' | 'PREUNI' | 'UNIVERSITARIO'; aceptaTerminos: { version: string };
      correoAdultoResponsable?: string /* obligatorio si es menor de 18 */ }
  | { tipoCuenta: 'DOCENTE'; correo: string; contrasena: string; nombres: string; fechaNacimiento: string;
      modalidad: 'LIBRE' | 'NIVEL_ACADEMICO'; aceptaTerminos: { version: string } };
```

| Validación | Error |
|---|---|
| `tipoCuenta` distinto de `ESTUDIANTE` o `DOCENTE` (incluido `SUPERADMIN`) | `400 TIPO_CUENTA_NO_PERMITIDO` |
| Docente menor de 18 años | `422 EDAD_INSUFICIENTE_DOCENTE` |
| Estudiante menor sin `correoAdultoResponsable` | `422 CONSENTIMIENTO_PARENTAL_REQUERIDO` |
| Contraseña fuera de la política de la biblioteca de autenticación (mínimo propuesto: 10 caracteres) | `400 ENTRADA_INVALIDA` |
| Correo ya registrado | **`202`** igual que un alta nueva; el aviso llega por correo (evita la enumeración) |

### 4.3. Tutor IA (M6)

```ts
export type CrearConversacionRequest = {
  contexto: { superficie: 'TUTOR' | 'LECCION' | 'EJERCICIO'; cursoId?: string; recursoId?: string; version?: number; ejercicioId?: string };
  usarApuntes?: boolean;
};

export type ConsultaTutorRequest = {               // POST /api/v1/tutor-ia/consultas  (Idempotency-Key obligatoria)
  conversacionId: string;
  pregunta: string;                               // 1–4000 caracteres
  adjuntos?: Array<{ tipo: 'IMAGEN'; assetId: string }>;               // ≤ 1 en v1
  transcripcionConfirmada?: { latex: string; origenOperationKey: string };
  modo?: 'AUTO' | 'PISTA';
  preferencias?: { modalidades?: Array<'TEXTO' | 'PIZARRA' | 'ESCENA_3D'>; nivelDetalle?: 'BREVE' | 'NORMAL' | 'DETALLADO' };
};

export type EstadoVerificacion = 'VERIFICADA_SIMBOLICA' | 'VERIFICADA_NUMERICA' | 'NO_VERIFICABLE' | 'DISCREPANCIA';

export type Cita = {
  id: string; chunkId: string; recursoId: string; version: number; titulo: string; seccion?: string;
  enlace: string; fragmento: string; tipoFuente: 'CATALOGO' | 'LICENCIA' | 'PRIVADO' | 'PUBLICO'; oficial?: boolean | null;
};

export type RespuestaTutor = {                     // cuerpo con Accept: application/json, o resultado de GET /consultas/:operationKey
  operationKey: string; conversacionId: string; mensajeId: string;
  estado: 'RESPONDIDA' | 'SIN_CONTEXTO' | 'PARCIAL';
  intencion: string; modoFuentes: 'FUNDAMENTADA' | 'GENERAL';   // GENERAL reservado: no se emite mientras ADR-058 esté diferida (CO-05)
  segmentos: Array<{ id: string; markdown: string }>;
  escena?: unknown /* mentelyx.escena-resuelta/v1 */; escena3d?: unknown /* mentelyx.escena3d/v1 */;
  verificacion?: { estado: EstadoVerificacion; pasos: Array<{ pasoId: string; estado: EstadoVerificacion }> };
  citas: Cita[];
  sugerencias: Array<{ tipo: 'TUTORIA_HUMANA' | 'EJERCICIO' | 'LECCION'; titulo: string; enlace: string }>;
  uso: { utiConsumidas: number; utiRestantesPeriodo: number; ruta: { etiqueta: string; proveedor: string } };
  avisos: string[];                                // p. ej. «Explicación general: no proviene de materiales del curso»
};

export type TranscripcionResponse = { operationKey: string; latex: string; texto: string; confianza: number; ilegible: boolean };
```

### 4.4. Studio: cotización, generación, trabajos y exportación (M2)

```ts
export type CotizacionIARequest = {
  proyectoId: string;
  tipo: 'PRESENTACION' | 'GUIA' | 'FICHA_EJERCICIOS' | 'RESUMEN' | 'ESCENA' | 'IMAGEN' | 'OBJETO_3D';
  prompt: string;                                  // 1–2000; moderado antes de cotizar
  parametros?: { nivel?: string; extension?: number; calidad?: 'ESTANDAR' | 'PREMIUM'; usarFuentesPropias?: boolean };
};
export type Cotizacion = {
  cotizacionId: string; creditos: number; saldoStudio: number; saldoTras: number;
  policyVersion: string; expiraEn: string; desglose: Array<{ concepto: string; creditos: number }>;
};
export type GenerarIARequest = { cotizacionId: string };          // + Idempotency-Key → 202 TrabajoStudio
export type ExportacionRequest = {
  formato: 'PDF' | 'PPTX'; plantilla: { id: string; version?: number };
  audiencia: 'ESTUDIANTE' | 'DOCENTE'; version?: number;           // DOCENTE incluye notas docentes y soluciones NUNCA;
                                                                   // ESTUDIANTE las elimina físicamente del archivo (CO-02)
};
export type TrabajoStudio = {
  id: string; tipo: 'GENERACION_IA' | 'EXPORTACION';
  estado: 'PENDIENTE' | 'EN_CURSO' | 'LISTO' | 'FALLIDO' | 'CANCELADO';
  progreso?: { fase: string; porcentaje?: number };
  resultado?: { proyectoId: string; version: number } | { exportacionId: string };
  error?: { code: string; imputableAlServicio: boolean; creditosReintegrados?: number };
  creadoEn: string; actualizadoEn: string;
};
export type Descarga = { url: string; expiraEn: string; nombreArchivo: string; sha256: string; tamanoBytes: number };
```

### 4.5. Habilitación (M4)

```ts
export type SolicitudVerificacionDocumental = {
  documentos: Array<{ tipoDocumento: string /* catálogo configurado por la administración */; assetId: string }>;
  declaracionVeracidad: true;
};
export type SolicitudCredencialAcademica = {                      // solo Docente NIVEL_ACADEMICO
  grado: 'BACHILLER' | 'LICENCIATURA' | 'MAESTRIA' | 'DOCTORADO' | 'OTRO';
  denominacion: string; institucion: string; pais: string; anio: number; documentos: Array<{ assetId: string }>;
};
export type SolicitudHabilitacionTutoria = {
  temas: Array<{ area: string; tema: string; nivel: 'PRIMARIA' | 'SECUNDARIA' | 'PREUNI' | 'UNIVERSITARIO' }>; // 1–10
  experienciaDeclarada: string;                                   // ≤ 1000
  atenderaMenores: boolean;                                       // activa los controles adicionales
  aceptaCondiciones: { version: string };
};
type EstadoSolicitud = 'NO_SOLICITADA' | 'PENDIENTE' | 'SUBSANACION' | 'APROBADA' | 'RECHAZADA' | 'VENCIDA';
export type EstadosHabilitacion = {
  verificacionDocumental: { estado: EstadoSolicitud; actualizadoEn?: string };
  credencialesAcademicas: Array<{ id: string; grado: string; denominacion: string; estado: EstadoSolicitud }>;
  habilitacionTutoria: { estado: EstadoSolicitud; temas: string[]; vigenteHasta?: string;
                         controlesMenores: 'NO_APLICA' | 'PENDIENTE' | 'APROBADO' };
};
```

Los documentos de habilitación se guardan en un espacio R2 privado. Se eliminan **90 días después de la decisión final**, salvo una obligación legal de conservarlos (propuesta sujeta a revisión legal). La decisión, su motivo y la auditoría se conservan.

---

## 5. *Streaming* del Tutor IA (SSE)

### 5.1. Protocolo

- **Solicitud:** `POST /api/v1/tutor-ia/consultas` con `Accept: text/event-stream` e `Idempotency-Key`.
- **Respuesta:** `200` con `Content-Type: text/event-stream`. Cada evento lleva `event:`, `id:` incremental y `data:` en JSON.
- Se envía un comentario `: ping` cada 15 s para mantener viva la conexión.
- **Errores previos al flujo:** los de autorización, validación, cuota o bloqueo se devuelven como una respuesta JSON `Fallo` normal, sin abrir el flujo.

### 5.2. Eventos

| Evento | Datos | Orden |
|---|---|---|
| `meta` | `{operationKey, conversacionId, mensajeId, intencion, modoFuentes, ruta: {etiqueta, proveedor}}` | Siempre el primero |
| `estado` | `{fase: CLASIFICANDO \| RECUPERANDO \| RAZONANDO \| VERIFICANDO \| DIBUJANDO \| REDACTANDO}` | Cualquier momento |
| `texto.delta` | `{segmentoId, delta}` (Markdown + LaTeX) | — |
| `texto.segmento_fin` | `{segmentoId}` | Tras el último delta del segmento |
| `escena.inicio` | `{escenaId, lienzo, titulo}` | Antes del primer `escena.paso` |
| `escena.paso` | `{escenaId, paso}` (paso **ya validado y compilado**, con su `anclaChat`) | Tras completar el segmento anclado |
| `escena.fin` | `{escenaId, accesibilidad}` | — |
| `escena.error` | `{codigo}` | La respuesta continúa solo con texto |
| `escena3d` | `{escena3d}` (`mentelyx.escena3d/v1`, ya verificada) | — |
| `verificacion` | `{pasoId?, estado, detalle?}` | Tras cada paso verificable o al final |
| `citas` | `{citas: Cita[]}` | Antes de `uso` |
| `sugerencia` | `{tipo, titulo, enlace}` | — |
| `uso` | `{utiConsumidas, utiRestantesPeriodo}` | Justo antes de `fin` |
| `error` | `{code, message, recuperable}` | Termina el flujo |
| `fin` | `{estado: RESPONDIDA \| SIN_CONTEXTO \| PARCIAL}` | Siempre el último, salvo que el flujo termine con `error`. Solo se emite **después** de persistir el mensaje y el uso |

### 5.3. Corte y reconexión

El servidor no reanuda un flujo interrumpido. El cliente:

- conserva lo recibido;
- consulta `GET /api/v1/tutor-ia/consultas/{operationKey}`;
  - si está `COMPLETADA` → recibe el `RespuestaTutor` completo;
  - si está `EN_CURSO` → reintenta la consulta de estado con `Retry-After`;
  - si está `INCIERTA` o `FALLIDA` → muestra un error recuperable y **no** reenvía la pregunta con otra clave sin la acción del usuario.

**Corte frente a cancelación:**

- Una pérdida de conexión **no** cancela la operación. La ejecución no depende de la vida de la conexión SSE (CO-04). Tras la admisión, la ejecuta un consumidor de la cola `mentelyx-tutor-execution` con *lease* SQL. El SSE es un *relay* efímero por operación, sin historial ni autoridad ([infraestructura, sección 4](../../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md)). El resultado y el consumo se persisten, y el usuario de una red móvil inestable los recupera con `GET` sin nueva inferencia. `waitUntil` no se usa como garantía de completar.
- Si el ejecutor cae o vence su *lease*, la operación se concilia con el proveedor antes de volver a invocarlo. Mientras tanto `GET` devuelve `EN_CURSO` o `INCIERTA`.
- Si el resultado ya expiró por retención, `GET` devuelve el estado sin contenido y no cobra de nuevo. Un reintento voluntario requiere una operación nueva.
- Solo `POST /api/v1/tutor-ia/consultas/{operationKey}/cancelar` (botón «Detener») aborta la inferencia. El estado pasa a `CANCELADA` con las reglas de consumo de la sección 2.6.
- Tiempos máximos por ruta: `../diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md` sección 13.1.

### 5.4. Ejemplo completo (EJ-15)

**Solicitud:**

```http
POST /api/v1/tutor-ia/consultas
Accept: text/event-stream
Content-Type: application/json
Idempotency-Key: 3f2b9c1e-7d4a-4c1b-9a51-0e6f2a7c8d11

{"conversacionId":"9a0c5f8e-2b1d-4e7a-8c3f-61d2e4b7a990",
 "pregunta":"¿Por qué la derivada de x^2 es 2x?",
 "preferencias":{"modalidades":["TEXTO","PIZARRA"]}}
```

**Contexto:** adulto con plan Plus. La conversación está vinculada a la lección «Derivadas» v2 (licencia RAG vigente).

**Clasificación:**

- `m` = 0,25 (`^`) + 0,30 («derivada» contiene «deriva») = 0,55;
- `c` = 0,40 («por qué»);
- la diferencia es 0,15, que no es menor que el umbral → `RESOLUCION_MATEMATICA`;
- modalidad `PIZARRA` por preferencia; ruta `razonamiento.rapido`.

**Flujo esperado (resumido):**

```text
event: meta
id: 1
data: {"operationKey":"tutor:u_51:3f2b9c1e-…","conversacionId":"9a0c…","mensajeId":"m_88","intencion":"RESOLUCION_MATEMATICA","modoFuentes":"FUNDAMENTADA","ruta":{"etiqueta":"Razonamiento matemático rápido","proveedor":"DeepSeek vía Cloudflare Workers AI"}}

event: estado
id: 2
data: {"fase":"RECUPERANDO"}

event: estado
id: 3
data: {"fase":"VERIFICANDO"}

event: texto.delta
id: 4
data: {"segmentoId":"s1","delta":"Usamos la definición de derivada: $f'(x)=\\lim_{h\\to 0}\\frac{(x+h)^2-x^2}{h}$ [1]."}

event: texto.segmento_fin
id: 5
data: {"segmentoId":"s1"}

event: escena.inicio
id: 6
data: {"escenaId":"e1","titulo":"Recta tangente a y = x²","lienzo":{"sistema":"cartesiano","vista":{"xMin":-1,"xMax":3,"yMin":-1,"yMax":5}}}

event: escena.paso
id: 7
data: {"escenaId":"e1","paso":{"id":"p1","anclaChat":"s1","inicioMs":0,"finMs":1500,"acciones":["…compiladas…"]}}

event: verificacion
id: 8
data: {"pasoId":"p2","estado":"VERIFICADA_NUMERICA"}

event: texto.delta
id: 9
data: {"segmentoId":"s2","delta":"Al desarrollar, $(x+h)^2-x^2=2xh+h^2$, de modo que el cociente es $2x+h$; cuando $h\\to 0$ queda $2x$."}

event: escena.paso
id: 10
data: {"escenaId":"e1","paso":{"id":"p2","anclaChat":"s2","inicioMs":1500,"finMs":2700,"acciones":["…tangente en x = 1, pendiente 2…"]}}

event: escena.fin
id: 11
data: {"escenaId":"e1","accesibilidad":{"descripcion":"Parábola y = x² con su recta tangente en x = 1, de pendiente 2."}}

event: citas
id: 12
data: {"citas":[{"id":"c1","recursoId":"550e…","version":2,"titulo":"Derivadas","seccion":"Definición por límite","enlace":"/estudiante/cursos/440e…/lecciones/550e…?v=2#b-04","tipoFuente":"CATALOGO"}]}

event: uso
id: 13
data: {"utiConsumidas":1,"utiRestantesPeriodo":211}

event: fin
id: 14
data: {"estado":"RESPONDIDA"}
```

**Afirmaciones verificadas:**

- `igualdad(((x+h)^2-x^2)/h, 2*x+h)` sobre 12 muestras con h ≠ 0 → `VERIFICADA_NUMERICA`;
- `limite(2*x+h, h→0) = 2*x` → `VERIFICADA_NUMERICA`.

**Repetición:** la misma solicitud con la misma clave devuelve el `RespuestaTutor` guardado, sin inferencia y sin un segundo consumo.

---

## 6. Trabajos asíncronos

| Aspecto | Contrato |
|---|---|
| Creación | `202 Accepted` + `Location: /api/v1/studio/trabajos/{id}` + cuerpo `TrabajoStudio` en estado `PENDIENTE`. El `202` se emite **solo después** de confirmar en SQL el trabajo y su *outbox* (SC-16), no tras un envío a la cola sin *outbox*. Los subestados internos `PAYMENT_PENDING` y `UNCERTAIN` ([persistencia, sección 7.2](01-diseño-de-persistencia-y-datos.md)) no se exponen y se muestran como `PENDIENTE` o `EN_CURSO` |
| Estados | `PENDIENTE → EN_CURSO → LISTO` · `EN_CURSO → FALLIDO` · `PENDIENTE → CANCELADO` (solo antes de empezar; reintegra los créditos) |
| Sondeo | `GET /api/v1/studio/trabajos/{id}` con `Retry-After` (2–10 s) mientras no termina |
| Progreso | `GET /api/v1/studio/trabajos/{id}/eventos` (SSE: `progreso`, `listo`, `fallido`) |
| Idempotencia | Crear con la misma `Idempotency-Key` devuelve el mismo trabajo |
| Resultado | Generación IA → `{proyectoId, version}` (borrador). Exportación → `{exportacionId}` para la descarga |
| Falla | `error.imputableAlServicio` determina el reintegro (`STUDIO_AI_REFUND`, idempotente) |
| Retención del registro | Trabajos terminados visibles 30 días. Los resultados (versiones y archivos) siguen sus propias reglas |
| Administración | La reindexación RAG usa el mismo modelo en `/api/v1/admin/rag/trabajos/{id}` |

---

## 7. Catálogo de errores

| Código | HTTP | Recuperable | Significado |
|---|---|---|---|
| `ENTRADA_INVALIDA` | 400 | No | El cuerpo, los parámetros o las cabeceras no cumplen el esquema (`details.campos`) |
| `CLAVE_IDEMPOTENCIA_REQUERIDA` | 400 | No | Falta `Idempotency-Key` en una operación que la exige |
| `TIPO_CUENTA_NO_PERMITIDO` | 400 | No | Tipo de cuenta distinto de Estudiante o Docente en el registro |
| `NO_AUTENTICADO` | 401 | No | Sin sesión válida |
| `MFA_REQUERIDO` | 401 | No | Operación administrativa sin MFA reciente |
| `FIRMA_WEBHOOK_INVALIDA` | 401 | No | Notificación de la pasarela no verificable |
| `CREDITOS_LIVE_INSUFICIENTES` (alias `INSUFFICIENT_LIVE_CREDITS`) | 402 | No | Saldo Live insuficiente para la modalidad |
| `CREDITOS_STUDIO_INSUFICIENTES` | 402 | No | Saldo Studio insuficiente para la cotización |
| `NO_AUTORIZADO` | 403 | No | Sin permiso sobre el recurso |
| `SIN_DERECHO_IA` | 403 | No | El producto vigente no incluye el Tutor IA |
| `FUNCION_NO_DISPONIBLE_PARA_CUENTA` | 403 | No | Función bloqueada por edad o producto (imágenes o 3D para menores) |
| `LICENCIA_INSUFICIENTE` | 403 | No | La licencia no permite la operación (leer, exportar, indexar) |
| `CONSENTIMIENTO_PARENTAL_REQUERIDO` | 403 / 422 | No | Falta el consentimiento del adulto responsable |
| `CONSENTIMIENTO_AUDIOVISUAL_REQUERIDO` | 403 | No | Ingreso a sala o grabación sin consentimiento |
| `HABILITACION_REQUERIDA` | 403 | No | Publicar u ofrecer una tutoría sin habilitación vigente |
| `UBICACION_NO_PERMITIDA` | 403 | No | Publicidad solicitada en una superficie excluida |
| `RECURSO_NO_ENCONTRADO` | 404 | No | — |
| `OPERACION_EN_CURSO` | 409 | Sí | La misma clave sigue en proceso |
| `MODALIDAD_NO_ADMITE_CREDENCIALES` | 409 | No | Docente libre o Estudiante que solicita una validación de credenciales académicas |
| `VERIFICACION_DOCUMENTAL_REQUERIDA` | 409 | No | Aprobación de una tutoría sin la verificación documental aprobada |
| `CUPO_AGOTADO` / `RESERVA_DUPLICADA` | 409 | No | Aforo o unicidad de la reserva |
| `COTIZACION_EXPIRADA` | 410 | No | La cotización Studio superó los 10 min |
| `RECURSO_RETIRADO` | 410 | No | Endpoint o versión retirados |
| `CONFLICTO_VERSION` | 412 | No | `If-Match` no coincide |
| `ARCHIVO_DEMASIADO_GRANDE` / `TIPO_ARCHIVO_NO_PERMITIDO` | 413 / 415 | No | Límites de carga |
| `CLAVE_IDEMPOTENCIA_REUTILIZADA` | 422 | No | Misma clave con otro cuerpo |
| `EDAD_INSUFICIENTE_DOCENTE` / `EDAD_INSUFICIENTE_TUTORIA` / `NO_ES_UNIVERSITARIO` | 422 | No | Reglas RF-54 y RF-88 |
| `DATOS_NO_PERMITIDOS` | 422 | No | Contenido D3 dirigido a la IA |
| `ESCENA_INVALIDA` / `DOCUMENTO_INVALIDO` | 422 | No | Errores de validación (`details.errores[]` con `codigo`, `ruta`, `mensaje`) |
| `TRANSCRIPCION_ILEGIBLE` | 422 | No | La imagen no permite una transcripción confiable |
| `TUTOR_BLOQUEADO_EVALUACION` | 423 | No | Evaluación o simulacro en curso sobre el recurso |
| `CUOTA_AGOTADA` (alias interno `SIN_CUOTA`) | 429 | No (hasta el siguiente periodo o compra) | UTI del periodo o del día agotadas (`details`: requeridas y disponibles) |
| `PRESUPUESTO_OPERACION_EXCEDIDO` | 429 | No | El costo estimado supera el máximo por operación incluso degradado |
| `LIMITE_TASA` | 429 | Sí (`Retry-After`) | Demasiadas solicitudes |
| `ERROR_INTERNO` | 500 | Sí | Falla no controlada; sin trazas |
| `PROVEEDOR_NO_DISPONIBLE` | 503 | Sí | Ninguna ruta elegible disponible (circuitos abiertos o presupuesto) |
| `SERVICIO_NO_DISPONIBLE` | 503 | Sí | Dependencia crítica caída (p. ej., PostgreSQL); no se confirma nada |
| `RESPUESTA_RETENIDA` | — (evento SSE `error`) | No | La moderación de salida cortó la respuesta |

`SIN_CONTEXTO` no es un error: es un estado válido de la respuesta del Tutor.

---

## 8. Matriz de autorización (resumen)

| Grupo de endpoints | Público | Estudiante | Estudiante menor | Est. universitario habilitado | Docente | Docente habilitado | Superadmin (MFA) |
|---|---|---|---|---|---|---|---|
| Registro y sesión | ✔ | ✔ | ✔ (con consentimiento) | ✔ | ✔ | ✔ | Interno |
| Catálogo y lecciones | Publicado | Según plan | Según plan | Según plan | Según plan | Según plan | Gestión |
| Tutor IA (consultas y conversaciones) | — | Según el derecho M5 | Rutas ZDR; sin imágenes IA | ✔ | Según el derecho | Según el derecho | Supervisión agregada (sin contenido) |
| Studio manual y exportación | — | Según permisos y edad | Según permisos | ✔ | ✔ | ✔ | Gestión |
| Studio IA (cotizar y generar) | — | Plan Studio | Sin imágenes ni 3D | Plan Studio | Plan Studio | Plan Studio | Gestión |
| Habilitación: verificación documental y tutoría | — | — | — | ✔ (≥ 18, universitario) | ✔ | ✔ | Decide |
| Habilitación: credenciales académicas | — | — | — | — | Solo `NIVEL_ACADEMICO` | Solo `NIVEL_ACADEMICO` | Decide |
| Programar clases | — | — | — | ✔ | Borrador privado | ✔ | Supervisión |
| Reservas e ingreso a aula | — | ✔ | ✔ (consentimiento audiovisual) | ✔ | — | Como docente de su sesión | Supervisión |
| Pagos y suscripciones | Planes | Propios | Propios (con adulto responsable según la política comercial) | Propios | Propios | Propios + liquidaciones | Conciliación |
| Administración (IA, RAG, auditoría, habilitación) | — | — | — | — | — | — | ✔ |

El backend comprueba siempre el permiso concreto en el caso de uso (RF-70). Esta matriz no sustituye a `verificarPermiso`.

---

## 9. Pruebas de contrato y trazabilidad

- Cada endpoint tiene un esquema de solicitud, de respuesta y de errores. La especificación OpenAPI 3.1 se genera desde ellos.
- Las pruebas de contrato (API-01 a API-14 de `../diseño-especializado/06-calidad-ia-criterios-y-pruebas.md` sección 9) se ejecutan en cada *commit*, sin proveedores reales.
- Los contratos internos de la sección 2.8 se prueban desde el módulo consumidor con dobles del módulo propietario. Además se hace una prueba de integración real por contrato en cada *pull request*.
- **Trazabilidad:** RF-01–RF-04, RF-09, RF-13, RF-18–RF-20, RF-31, RF-35, RF-41, RF-42, RF-45, RF-49–RF-61, RF-69, RF-70, RF-82–RF-85, RF-88, RF-99; ADR-003, ADR-004, ADR-019, ADR-026, ADR-034, ADR-050, ADR-053.
