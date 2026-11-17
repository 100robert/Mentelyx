# Seguridad, autenticación y protección de datos

> **Versión:** 1.0 — 17/11/2026 · **Estado:** diseño adoptado, sin software ni pruebas de seguridad ejecutadas. Integra SEG-01–SEG-04; no certifica cumplimiento legal.

## 1. Decisión y límites de confianza

Se selecciona **Better Auth** integrado en Hono, sesiones persistentes PostgreSQL y autorización RBAC/ABAC de Mentelyx. ADR-033/044 dejan de ser una lista de candidatos; la habilitación operativa exige prototipo Workers/Neon y revisión de versión fijada. No se añade servicio Rust: no hay carga ni requisito que justifique otra frontera operativa. Los siete módulos y las cuentas Estudiante/Docente permanecen; SUPERADMIN se aprovisiona internamente.

| Alternativa | Evaluación | Resolución |
|---|---|---|
| Better Auth + Hono + SQL | Integración oficial Request/Response, sesiones de BD y MFA; probar hashing/driver en Workers y atender avisos | Elegida como diseño; mínimo de seguridad de referencia sección 2, no versión instalada |
| Auth.js | Alternativa válida; la compatibilidad edge depende del adaptador y las sesiones DB | No elegir segunda biblioteca a la vez. No adoptar JWT sin consulta autoritativa como atajo a incompatibilidad |
| IdP externo administrado | Puede descargar operación de AuthN; requiere contrato, costo por usuario, transferencia y migración | Reserva si Better Auth no supera el prototipo; nueva decisión antes de contratar |
| Autenticación/criptografía propias | Mayor superficie y costo de revisión sin ventaja demostrada | Rechazada |

Fuentes oficiales consultadas el 17/11/2026: [integración Hono](https://better-auth.com/docs/integrations/hono), [Workers](https://better-auth.com/docs/guides/cloudflare), [sesiones Better Auth](https://better-auth.com/docs/concepts/session-management), [estrategias Auth.js](https://authjs.dev/concepts/session-strategies). La evidencia es compatibilidad documentada, no ejecución local.

Fronteras: navegador no confiable → borde/API → casos de uso propietarios → almacenes/proveedores. Cookies autentican, pero el servidor determina actor, edad, permisos, licencia y precio. Un LLM, documento, resultado de herramienta o evento externo nunca concede autorización. Solo los adaptadores tienen secretos; el cliente no elige rutas de proveedor, IDs de propietario, cuota ni flags de aprobación.

## 2. Dependencias y avisos actuales

No existe manifest/lockfile de aplicación ni biblioteca instalada que permita afirmar que Mentelyx está afectado. Revisión del [registro oficial de avisos](https://github.com/better-auth/better-auth/security/advisories), 17/11/2026:

| Aviso | Condición/rango documentado | Corrección oficial / decisión |
|---|---|---|
| [GHSA-hwq2-v29r-p69r](https://github.com/better-auth/better-auth/security/advisories/GHSA-hwq2-v29r-p69r), 03/11/2026 | Cambio de correo con enlaces reutilizables: better-auth ≥1.4.0 y <1.7.16; beta 1.8.0 anterior a beta.5 | Corregido 1.7.16 / 1.8.0-beta.5; probar consumo de token ligado a cuenta y correo previo |
| [GHSA-9hm7-xhfp-cx58](https://github.com/better-auth/better-auth/security/advisories/GHSA-9hm7-xhfp-cx58), 03/11/2026 | Correo OAuth no verificado tratado como verificado, según proveedor/configuración: ≥0.4.9 y <1.7.16; beta anterior a beta.5 | Corregido 1.7.16 / beta.5; OAuth fuera del mínimo inicial y sin vinculación automática por correo no verificado |
| [GHSA-44jh-23m7-hpcf](https://github.com/better-auth/better-auth/security/advisories/GHSA-44jh-23m7-hpcf), 30/09/2026 | Rate limit concurrente PostgreSQL: Drizzle/better-auth ≥1.6.17 y <1.7.7; Kysely ≥1.6.17 y <1.7.0 | Parches 1.7.7 y 1.7.0 respectivamente; límite global adicional y ensayo concurrente |

Elegir una versión estable exacta mantenida **≥1.7.16** que supere revisión de todos los avisos aplicables en la fecha de construcción; esta cota corrige los avisos revisados, no declara toda versión posterior segura. No fijar beta por esta tabla. Registrar versión de biblioteca, adaptador, runtime, plugins y lockfile, SBOM y resultado del análisis antes de habilitar cuentas reales. Plugins admin/expo/electron/email-OTP no son parte del mínimo: no instalarlos automáticamente ni asumir que sus avisos afectan al proyecto. Repetir revisión al actualizar dependencias, no cada lectura documental.

El hashing de contraseñas usa la biblioteca (scrypt predeterminado documentado); medir memoria/CPU en Workers antes del piloto, sin rebajar su costo para ocultar incompatibilidad. Si no cumple, mover el adaptador a runtime compatible o revisar la elección. [Seguridad oficial](https://better-auth.com/docs/reference/security), consulta 17/11/2026.

## 3. Topología, sesión y recuperación

### 3.1. Cookies y CSRF

- Topología inicial: `https://app.<dominio>` sirve UI y `/api/v1/*` mediante rutas Workers; mismo origen evita cookies de terceros. `www.<dominio>` público separado. Dominio es marcador, no DNS contratado. Staging tiene otro origen y secretos/datos propios.
- Cookie de sesión host-only, `Secure; HttpOnly; SameSite=Lax; Path=/`, sin Domain; prefijo `__Host-` si el adaptador lo permite. No tokens en localStorage ni query string. Respuestas AuthN/datos privados con `Cache-Control: private, no-store`.
- Mutaciones exigen Origin permitido y protección CSRF de biblioteca; para endpoints propios usar token CSRF ligado a sesión y comprobación Origin/Fetch-Metadata. GET no muta. CORS usa origen exacto y `credentials:true`, jamás `*` con credenciales. CORS/SameSite no sustituyen CSRF.
- En desarrollo se permite solo origen localhost configurado; la excepción a Secure por HTTP local jamás se propaga a staging/producción. Si se adopta `api.<dominio>`, permitir únicamente `app.<dominio>`, cookie host-only del API, fetch con credenciales; probar preflight/cookies. Un sitio externo requeriría otra revisión, no `SameSite=None` por defecto.
- Los endpoints de negocio `/registro`, `/login` y `/logout` envuelven la API de Better Auth. No asumir que montar su handler traduce esos nombres automáticamente; probar cookies y errores sin perder cabeceras Set-Cookie. Bearer del catálogo API no habilita una segunda estrategia de acceso para la PWA.

### 3.2. Vigencia y revocación

Política inicial de diseño: sesión pública 7 días absolutos y 24 h de inactividad; administración 8 h absolutas/15 min inactiva; reautenticación reciente ≤5 min para cambiar contraseña/correo/MFA, permisos y pagos administrativos. Son valores técnicos ajustables por política, no exigencia legal.

**Deshabilitar cookieCache y secondaryStorage para validar sesiones.** Cada petición protegida consulta SQL y comprueba usuario ACTIVE, expiración absoluta/inactividad, revocación y authz_version. Redis no mantiene sesión autoritativa. Better Auth advierte que cookieCache puede mantener sesiones revocadas hasta su vencimiento; su configuración por defecto no prueba la garantía requerida. [Documentación de sesiones](https://better-auth.com/docs/concepts/session-management), 17/11/2026.

Logout revoca servidor y expira cookie; cambio/restablecimiento de contraseña revoca otras sesiones y exige nueva autenticación según política. Suspensión o revocación global incrementa authz_version en el mismo commit. Requests que comenzaron antes de una revocación revalidan inmediatamente antes de efectos críticos; streams largos revisan estado antes de cada emisión protegida y al finalizar. No es posible retirar bytes ya recibidos.

La revocación se confirma solo después de commit; SQL indisponible produce 503 y no valida una cookie vieja. Registro/cambio de cuenta no acepta rol ni permisos del cliente. Prohibido endpoint público que cree SUPERADMIN. `tutor_enabled` y `can_charge_classes` son proyecciones, no autoridad suficiente para cobrar.

### 3.3. MFA, correo y recuperación

MFA TOTP y códigos de recuperación de la biblioteca obligatorios para administración; no ofrecer trusted-device que omita MFA administrativo. Alta o desactivación exige reautenticación; códigos de respaldo de un uso, guardados protegidos según biblioteca. Recuperar administrador requiere procedimiento interno auditado, no un bypass por soporte. [Plugin 2FA oficial](https://better-auth.com/docs/plugins/2fa), consulta 17/11/2026.

Recuperación de usuario siempre responde 202 genérico, latencia comparable y rate limit; token aleatorio de biblioteca, ligado a cuenta/finalidad, vencimiento de diseño 15 min, un uso atómico. Correo de verificación: vencimiento de diseño 24 h. Cambios de correo invalidan tokens anteriores y verifican el nuevo; notificar al anterior sin incluir secretos. No poner tokens en logs/analytics/Referer; URL de confirmación con política `no-referrer`, redirect allowlist. Proveedor de correo y dominio autenticado siguen pendientes de contratación. Nunca pedir ni guardar contraseña del correo del usuario.

## 4. Autorización, M4/M5 y archivos

| Acción | Comprobación autoritativa |
|---|---|
| Leer resultado/intentarlo | M1 valida sesión y M3 propiedad del intento; no confiar en studentId enviado |
| Publicar/usar Studio | M2 autoría/permiso, licencia/versión, reglas de edad y M5 derecho; Studio no crea cuenta |
| Acreditación profesional | M4 revisa cada credencial del Docente NIVEL_ACADEMICO; separado de verificación documental |
| Ofrecer clase/cobrar | M4 adulto, verificación documental, habilitación vigente y controles de menores; M5 condiciones/viabilidad; suscripción no acredita formación |
| Gastar/reintegrar créditos | M5 verifica actor/bolsa/cotización/clave y transacción; permiso admin no permite editar saldo directamente |
| RAG | M2 conjunto consultable y licencia; M6 aplica filtros SQL y revalida antes de inferencia/entrega; revocar acceso prevalece sobre caché |
| Exportar/descargar | M2 revalida licencia y audiencia; estudiante nunca obtiene notas docentes ni soluciones ocultas en PPTX, aun si no se ven en diapositiva |
| Supervisión administrativa | Permiso granular y MFA, motivo/evidencia auditada; no lectura indiscriminada de conversaciones por ser admin |

Payloads con campos de privilegio inesperados se rechazan; las listas no autorizadas devuelven respuesta consistente sin filtrar existencia. Validar DTO con esquemas y límites de tamaño/profundidad; SQL parametrizado; contenido HTML/Markdown/SVG saneado con allowlist. CSP inicial `default-src 'self'`, excepciones explícitas para medios/recursos necesarios, no scripts inline del autor; ajustar por prueba funcional, no `unsafe-eval` genérico.

Webhooks: firma sobre cuerpo crudo con biblioteca oficial de la pasarela, secreto por entorno, timestamps/anti-replay cuando el protocolo lo soporte; verificar comercio, moneda, importe y referencia contra orden; consultas al proveedor desde servidor si se necesita confirmar. INSERT inbox+transición+ledger+outbox atómicos. Evento válido duplicado responde sin repetir efecto; evento fuera de orden no degrada APROBADA a PENDIENTE. El protocolo exacto de firma permanece bloqueado hasta elegir pasarela.

## 5. Amenazas STRIDE y seguridad IA (SEG-01–SEG-03)

| Clase / amenaza | Control de diseño | Prueba de aceptación prevista |
|---|---|---|
| S — suplantación de sesión/token y webhook | Sesión SQL, MFA, firmas, expiración y anti-replay | SEC-01: sesión revocada falla en otra instancia; webhook alterado no modifica SQL |
| T — alterar precio, cuota, cupo o input cotizado | Precio congelado/hash, UNIQUE, lock SQL, validación de ownership | SEC-02: dos claves contra una cotización producen un débito y un job |
| R — negar cambio de permiso/reembolso | Auditoría mínima con actor/decisión/correlación, outbox/inbox | SEC-03: reconstruir causalidad sin prompts ni secretos |
| I — IDOR/RAG entre usuarios/soluciones ocultas | Filtro antes de recuperación, revalidación, selección de audiencia, bucket D3 separado | SEC-04 + RAG-SEC-01–05: ningún fragmento/nota ajenos en respuesta/archivo |
| D — fuerza bruta, expresiones/archivos gigantes, abuso de costos | Rate limit compartido, tamaño/profundidad/CPU, presupuesto reservado global, colas limitadas | SEC-05: carga adversaria queda acotada sin dobles consumos |
| E — escalar rol/habilitación por payload o plugin | DTO cerrado, capacidades por dominio, reautenticación/MFA | SEC-06: Estudiante/Docente no adquiere admin, título ni cobro por manipular campos |
| T/I — prompt injection directa/indirecta | Fuentes como datos, esquema estricto, herramientas allowlist solo lectura, sin SQL/URL/código libre, límites de pasos | INY-01/02 y SEC-07: instrucciones dentro de PDF no amplían corpus ni herramientas |
| I — exfiltración por herramientas/render | Egress allowlist; no red del navegador salvo assets propios; bloquear URLs privadas, redirects a redes internas y recursos de glTF remotos | SEC-08: SSRF/file:// y peticiones a metadatos son rechazadas |
| I — datos personales en logs/cachés/proveedor | Política D0–D3, gateway sin payload, sin caché D1/D2, no texto en métricas | PII-01/02 + SEC-09: inspeccionar todas las capas con datos sintéticos canario |
| D/E — consumo o cambio de ruta durante fallback | Reserva de cada intento, matriz privacidad antes de ruta, no retry incierto | SEC-10: D2/menores no pasa a API directa, presupuesto no excedido por concurrencia |

Delimitar el prompt ayuda al modelo, pero **no garantiza aislamiento**; lo garantizan controles externos de autorización y ejecución. Herramienta solo lectura aún puede filtrar información o generar costos. Parser matemático con gramática cerrada, allowlist de funciones y límites de tiempo/memoria; nunca eval, código arbitrario, URL o shell del modelo. Validar escenas también en servidor; objetos 3D ilustrativos solo adultos según diseño especializado.

SEG-02: dos configuraciones separadas D0 editorial y D1/D2; gateway privado con registro de payload y caché deshabilitados como base, sin confiar en cabecera enviada por cliente. El backend impone `cf-aig-collect-log: false` y controles de caché documentados; Unified Billing puede conservar metadatos de facturación incluso sin payload. Revisar también Workers traces, errores, navegador de render y SDK; ninguna excepción de depuración en producción. Si no se prueba esta configuración, ruta D1/D2 bloqueada. Fuente: [AI Gateway logging, 17/11/2026](https://developers.cloudflare.com/ai-gateway/observability/logging/).

SEG-03: sustitución de datos conocidos y patrones deterministas de nombres/correos/teléfonos es una reducción de riesgo, **no anonimización demostrada**. Probar PII de terceros, Unicode, texto fragmentado, contexto inferible, OCR y EXIF con corpus sintético. No reconstruir marcadores antes de enviar a otro proveedor. Ante duda subir D1→D2; D3 siempre rechazada, incluso ZDR. La tabla de proveedores del diseño especializado se conserva como evidencia de selección; ZDR no autoriza automáticamente transferencia ni elimina necesidad de contrato/licencia.

## 6. Menores, eliminación y secretos (SEG-04)

SOLO_ZDR es restricción técnica mínima, no permiso legal para procesar datos de menores. Hasta resolver PEND-02 (bases/consentimientos/transferencias/contratos) se trabaja con datos sintéticos y no se activan rutas reales para menores. No datos financieros/documentales D3 al LLM; ni perfil académico a anunciantes. No grabar clases por defecto; consentimiento de cada participante y finalidad separada. Reportes de riesgo no generan avisos a terceros sin protocolo aprobado (PEND-03).

Eliminación consta de dos resultados: acceso revocado tras commit y purga física verificable posterior. TTL no es SLA de borrado. Persistencia secciones 8 y 11 define tombstones, purga de segmentos/R2/RAG y reaplicación tras restauración; backups vencen por política y no se exponen a consultas. Avisar de copias/exportaciones ya descargadas: el servidor no puede borrarlas remotamente. No prolongar historial automáticamente al reintentar una operación expirada.

PWA: no cachear sesiones, pagos, documentos D3, resultados privados o conversaciones por defecto. Borradores locales requieren consentimiento claro en dispositivo compartido, separación por cuenta y purga al cerrar sesión/cambiar cuenta/expirar. El diseño de interfaces permite caché de lecciones; se restringe a público o material cuya licencia autorice descarga offline. Revocación inmediata no es garantizable en un dispositivo desconectado: no habilitar offline de recursos que la exijan.

Secretos por entorno en gestor del proveedor, mínimo privilegio de DB/bucket/API. Rotar tras exposición, salida de operador o según política; ensayar nueva+anterior solo en ventana acotada permitida por proveedor. No secretos en Git, previews, payload de cola, logs, prompts ni frontend. Roles de migración separados del rol runtime; backups cifrados y acceso auditado. Auditoría INSERT-only no significa que un superusuario SQL no pueda cambiarla: exportar evidencia a almacenamiento de acceso separado si el riesgo lo requiere.

## 7. Pruebas y aceptación antes de implementar/pilotar

| Bloque | Evidencia requerida / propietario | Estado |
|---|---|---|
| AuthN | Prototipo Better Auth versión fijada + adaptador Neon + Workers: registro/correo/login/MFA/reset/logout, cookies, límites y revocación entre instancias | Pendiente; M1/infra |
| Aislamiento | Matriz pública/Estudiante/Docente/modalidades/admin/menores; IDOR y ámbito RAG, descarga por audiencia | Pendiente; M1–M6 |
| Concurrencia | Reservas/cupo, quote/débito/reintegro, cuota/presupuesto global, consumo de token de recuperación | Pendiente; M3–M6 |
| Fallos | Redis caído mantiene controles o deniega operación sensible; SQL caído no autentica desde caché; proveedor incierto no se reintenta ciegamente | Pendiente; infra |
| Eliminación | TTL retrasado, DELETE repetido, objeto fallido, backup restaurado, caché offline y URL firmada vigente | Pendiente; dueños de datos |
| Dependencias | SBOM/lockfile/avisos de todas las dependencias seleccionadas, licencias y pruebas CSP | Pendiente; construcción/seguridad |
| Legal | Retenciones, términos de menores, transferencias, DPA, consentimiento audiovisual, protocolo de riesgo | Bloqueante para datos reales; responsable legal/producto |

Trazabilidad: ADR-004/007/026/033/034/043/044/054/057/065/069/070; RF-01/02/04/53/54/58/59/93/99; AC-04/06/11; EQ-04/06/11/20/21/22/29/31. Criterios son plan de verificación; no se ejecutaron ataques, software ni escáneres de dependencias inexistentes.
