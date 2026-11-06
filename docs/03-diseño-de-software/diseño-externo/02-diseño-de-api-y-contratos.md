# Diseño de API REST y contratos de integración — Mentelyx

> **Proyecto:** Mentelyx · **Ubicación:** `docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md`  
> **Framework Backend:** Hono + TypeScript sobre Cloudflare Workers · **Prefijo base:** `/api/v1`  
> **Versión:** 1.0 · **Estado:** especificación de contratos externos e internos para desarrollo.

## 1. Convenciones generales de la API HTTP

1. **Formato y transporte:** HTTPS obligatorio (TLS 1.3 en Cloudflare Edge), cuerpo JSON en UTF-8 (`application/json`), excepto en webhooks de pasarela donde se lee el cuerpo crudo (`Uint8Array`) para verificar la firma criptográfica.
2. **Autenticación y sesiones:** gestión de sesión mediante cookies seguras (`HttpOnly`, `Secure`, `SameSite=Lax`) o token Bearer emitido por el adaptador de autenticación (Better Auth candidato).
3. **Autorización en dos niveles (ADR-004, ADR-034):**
   - **Middleware HTTP:** verifica sesión válida, estado de cuenta activo y rol base.
   - **Caso de uso / Política de dominio:** verifica propiedad del recurso, vigencia de suscripción, saldo de créditos (`LIVE` vs `STUDIO`), mayoría de edad o habilitación docente (`can_charge_classes`).
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

---

## 2. Catálogo de Endpoints REST por Módulo (M1–M7)

### 2.1. Módulo 1 — Usuarios y Administración (`/api/v1/auth` y `/api/v1/usuarios`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/registro` | Público | `RegistrarCuentaUseCase` | Registra cuenta (`ESTUDIANTE`, `CREADOR`, `DOCENTE`) sin exigir correo institucional. Si es Docente, define modalidad `LIBRE` o `NIVEL_ACADEMICO`. |
| `POST` | `/api/v1/auth/login` | Público | `IniciarSesionUseCase` | Autentica credenciales y establece sesión segura. |
| `POST` | `/api/v1/auth/logout` | Autenticado | `CerrarSesionUseCase` | Revoca la sesión activa. |
| `GET` | `/api/v1/usuarios/me` | Autenticado | `ConsultarPermisosUseCase` | Devuelve perfil, tipo de cuenta, modalidad docente, estado de habilitación y banderas de protección de menor. |
| `POST` | `/api/v1/admin/usuarios/:id/permisos` | Superadministrador (MFA) | `GestionarPermisosUseCase` | Modifica permisos o suspensiones dejando registro obligatorio en `audit_logs`. |

### 2.2. Módulo 2 — Cursos, Contenidos y Mentelyx Studio (`/api/v1/cursos` y `/api/v1/studio`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/cursos` | Público / Estudiante | `ListarCatalogoUseCase` | Lista cursos por nivel (`PRIMARIA`, `SECUNDARIA`, `PREUNI`, `UNIVERSITARIO`) con soporte de caché Redis. |
| `POST` | `/api/v1/studio/proyectos` | Creador / Docente / Estudiante | `CrearProyectoStudioUseCase` | Crea o guarda edición manual en Studio (**0 créditos IA consumidos**). |
| `POST` | `/api/v1/studio/proyectos/:id/archivos/url-subida` | Propietario del proyecto | `EmitirUrlSubidaR2UseCase` | Genera URL pre-firmada temporal hacia Cloudflare R2 y registra metadatos en PostgreSQL. |
| `POST` | `/api/v1/studio/proyectos/:id/publicar` | Creador / Docente autorizado | `PublicarVersionContenidoUseCase` | Sella una versión inmutable en MongoDB/PostgreSQL y encola indexación RAG si la licencia lo permite. |
| `POST` | `/api/v1/studio/proyectos/:id/generar-ia` | Usuario con cuota Studio | `SolicitarGeneracionStudioUseCase` | Muestra/valida el costo en **créditos Studio** (ej. 5 créditos presentación, 10 imagen estándar) y descuenta de forma idempotente vía M5. |

### 2.3. Módulo 3 — Evaluaciones y Aprendizaje (`/api/v1/evaluaciones`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/evaluaciones/:id/intentos` | Estudiante | `IniciarIntentoEvaluacionUseCase` | Abre un intento asociado a la versión exacta de la evaluación. |
| `POST` | `/api/v1/evaluaciones/:id/intentos/:intentoId/entregar` | Estudiante propietario | `EntregarYCalificarEvaluacionUseCase` | Califica de forma determinista y reproducible, guarda nota oficial en PostgreSQL y actualiza ruta de estudio. |
| `GET` | `/api/v1/evaluaciones/progreso/me` | Estudiante | `ConsultarProgresoUseCase` | Devuelve historial de diagnósticos, simulacros y áreas a reforzar. |

### 2.4. Módulo 4 — Docentes y Clases (`/api/v1/docentes` y `/api/v1/clases`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/docentes/acreditaciones` | Docente / Est. Universitario adulto | `SolicitarHabilitacionDocenteUseCase` | Envía expediente para acreditar nivel académico o solicitar habilitación de tutor universitario adulto. |
| `POST` | `/api/v1/clases/sesiones` | Docente / Tutor habilitado | `ProgramarSesionLiveUseCase` | Crea sesión grupal (6–35 alumnos, 1 crédito), reforzamiento (2–5, 2 créditos) o individual (1, 3 créditos), validando viabilidad con M5. |
| `POST` | `/api/v1/clases/sesiones/:id/reservar` | Estudiante | `ReservarClaseUseCase` | Verifica cupo con control de concurrencia SQL y descuenta **créditos Live** (1, 2 o 3) mediante contrato con M5. |
| `POST` | `/api/v1/clases/sesiones/:id/ingresar` | Estudiante con reserva / Docente | `EmitirCredencialAulaUseCase` | Verifica permiso y consentimiento audiovisual (menores) y devuelve token efímero para conectarse directo al SFU/WebRTC. |
| `POST` | `/api/v1/clases/sesiones/:id/cerrar-asistencia` | Docente / Sistema | `ConfirmarPrestacionClaseUseCase` | Registra asistencia efectiva y emite evento `ClasePrestadaValidada` hacia M5 para habilitar liquidación. |

### 2.5. Módulo 5 — Suscripciones, Pagos y Créditos (`/api/v1/pagos` y `/api/v1/suscripciones`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/pagos/ordenes` | Usuario autenticado | `ComprarPlanUseCase` | Crea orden en estado `PENDIENTE` fijando la `policy_version` del plan (`EST_PLUS`, `EST_PRO`, `AULAS_LIVE`, `STUDIO_PLUS`, `STUDIO_PRO`). |
| `POST` | `/api/v1/pagos/webhook` | Pasarela externa (Firmado) | `ConfirmarPagoWebhookUseCase` | Verifica firma, deduplica `(provider, eventId)` en PostgreSQL, activa derechos/créditos correspondientes y registra Outbox en una sola transacción ACID. |
| `GET` | `/api/v1/suscripciones/me/derechos` | Usuario autenticado | `ConsultarEntitlementsUseCase` | Retorna suscripción activa, saldo de **créditos Live**, saldo de **créditos Studio** (separados) y cuotas de Tutor IA. |
| `GET` | `/api/v1/pagos/liquidaciones/me` | Docente / Tutor habilitado | `ConsultarLiquidacionesDocenteUseCase` | Consulta liquidaciones calculadas sobre créditos efectivamente consumidos en clases impartidas (referencia candidata S/8/crédito sujeta a contrato). |

### 2.6. Módulo 6 — Tutor IA y RAG (`/api/v1/tutor-ia`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `POST` | `/api/v1/tutor-ia/consultas` | Estudiante con cuota | `ResponderConsultaUseCase` | Verifica cuota en M5, filtra fragmentos en `pgvector` según ACL/licencia de M2, genera respuesta pedagógica con citas y registra tokens/costo. |
| `GET` | `/api/v1/tutor-ia/consumo/me` | Autenticado | `ConsultarUsoIaUseCase` | Muestra el consumo acumulado de consultas IA del periodo frente al límite del plan. |

### 2.7. Módulo 7 — Publicidad y Patrocinios (`/api/v1/publicidad`)

| Método | Ruta | Actor / Permiso | Caso de uso conectado | Descripción |
|---|---|---|---|---|
| `GET` | `/api/v1/publicidad/espacios/:ubicacion` | Público / Plan Gratuito | `SeleccionarAnuncioUseCase` | Devuelve patrocinio permitido solo en superficies autorizadas (nunca en evaluaciones, clases Live, Studio ni cobros, y sin perfilar menores). |
| `POST` | `/api/v1/publicidad/campanias` | Superadministrador | `CrearCampaniaUseCase` | Registra campaña o patrocinio de aula gratuita con presupuesto verificado. |

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

