# Despliegue, escalabilidad, caché y recuperación

> **Versión:** 1.1 — 20/11/2026 · **Cambios 1.1:** frontend híbrido con OpenNext, Browser Run, colas nuevas y sección 9 (costos y dimensionamiento de la instrucción maestra). **Estado:** diseño seleccionado; sin servicios contratados, configuración externa ni despliegues. Integra INF-01–INF-06. Las cifras son metas o límites de diseño hasta su medición.

> **Alcance:** las topologías, colas y medidas cubren el producto completo; ADR-093 limita V1 a aprendizaje y preparación de exámenes. Capacidades de Studio, docencia y aulas descritas aquí son diseño pospuesto, no infraestructura disponible.

## 1. Topología elegida y compatibilidad

Se conserva monolito modular Hono/TypeScript en Workers. Colas/renderizadores son adaptadores del mismo dominio, no nuevos microservicios de negocio. PostgreSQL/Neon y MongoDB/Atlas permanecen; Redis administrado **Upstash por HTTPS** se selecciona como adaptador de producción, sujeto a región/contrato/costo. Local usa Redis compatible detrás del mismo puerto; probar equivalencia de comandos atómicos usados.

| Pieza | Selección / alcance | Evidencia oficial, consultada 17/11/2026 | Comprobación pendiente |
|---|---|---|---|
| Frontend | Next.js con renderizado híbrido SSG/SSR/ISR/CSR en un Worker mediante OpenNext (`@opennextjs/cloudflare`, ADR-074); la caché incremental solo guarda contenido público | Guía oficial de Next.js en Workers (consultada por Codex el 17/11/2026 y de nuevo el 21/11/2026, cuando ya recomienda vinext; ver PR-INF-01); la estrategia estática en Pages queda **sustituida** | Build de OpenNext, ISR del catálogo y la biblioteca pública, SSR autenticado sin caché compartida y *service binding* hacia Hono en PR-INF-01 |
| API/AuthN | Hono/Better Auth; instancia y cliente transaccional por request; fecha de compatibilidad fijada al construir | [Better Auth Workers](https://better-auth.com/docs/guides/cloudflare): compatibilidad Node, entorno y restricción de I/O entre requests | Hashing, MFA, cookies, adaptador y transacciones; no compartir pool vivo de módulo entre invocaciones |
| SQL | Driver Neon por HTTPS para consultas independientes y transacciones en lote; Client/Pool WebSocket por request para transacciones interactivas | [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver) | BEGIN/locks/COMMIT en misma conexión; cerrar conexión al terminar; endpoint pooled para OLTP, directo para mantenimiento que lo requiera |
| Mongo | Driver Node oficial con compatibilidad Workers. Acceso directo inicial acotado; DO de conexión solo si medición lo exige | [Cloudflare MongoDB](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/) documenta conexión directa y variante Durable Object; Hyperdrive no soporta Mongo | TLS/SRV/allowlist de red sin apertura general permanente, cold-start y conexiones; no reutilizar pool de Worker normal |
| Redis | Upstash REST; timeout y límite de comandos; solo caché/rate limit | [Cloudflare Upstash](https://developers.cloudflare.com/workers/databases/third-party-integrations/upstash/) | Latencia Perú/región DB, atomicidad/TTL y degradación |
| pgvector | Objetivo PostgreSQL 17 con pgvector ≥0.8.0; igual mayor/extensión local y staging | [Neon extensiones](https://neon.com/docs/extensions/pg-extensions) lista 0.8.0 para PG14–17 y 0.8.6 para PG18; no prueba instalación en una cuenta | `SELECT extversion FROM pg_extension WHERE extname='vector'` y `SHOW server_version` en prototipo; EXPLAIN y Recall con filtros |
| Objetos/colas | R2 privado; Queues e inbox/outbox duraderos | [Queues entrega](https://developers.cloudflare.com/queues/reference/delivery-guarantees/): al menos una vez | Redelivery, DLQ, pérdida de ACK y deduplicación |
| Render pesado | Cloudflare Browser Run (antes «Browser Rendering») para PDF; PptxGenJS en Worker si pasa prueba, Cloud Run Jobs como respaldo seleccionado | Fuentes especializadas sección 19, ya consultadas por Claude el 17/11/2026 | PEND-05/PEND-MAT-01; medir tiempo, memoria, fuentes, contenido y facturación |

INF-06 se resuelve documentalmente: soporte de búsqueda iterativa disponible según versión; **no** se afirma extensión instalada. No sustituir pgvector por otra extensión ofrecida por Neon sin ADR. Si el driver/adaptador de autenticación no soporta transacciones interactivas, no simularlas con llamadas HTTP independientes: elegir conexión WebSocket por request y crear instancia AuthN por request, o trasladar adaptador a runtime compatible con decisión registrada.

La conexión Atlas exige región próxima a SQL y ejecutores para reducir viajes; elegir tras medición desde Perú. Si no se logra restricción de red adecuada desde Workers, usar adaptador privado con salida controlada; no convertir `0.0.0.0/0` en decisión permanente. No activar Data API retirada ni asumir Hyperdrive documental. DO de conexión debe particionarse por ámbito para no serializar toda la plataforma; su adopción depende de latencia/conexiones medidas.

## 2. Entornos, DNS/CDN, TLS y red

| Entorno | Datos/servicios | Publicación y protección |
|---|---|---|
| Local | PostgreSQL/Mongo/Redis locales, objetos de prueba, mocks de correo/pagos/IA | Sin datos reales; no instalar ahora. Tests de puertos con servicios efímeros al construir |
| CI/pruebas | Almacenes efímeros, corpus sintético, proveedores simulados | No secretos de producción en PR; test de contrato y esquemas |
| Staging | Proyectos, buckets, Redis, colas y claves separados; servicios sandbox | `staging.<dominio>` con acceso de equipo, no indexable; pruebas regionales y fallos |
| Producción | Recursos separados y mínimos privilegios | `app.<dominio>`: Worker de frontend (OpenNext) y `/api/v1/*` en el Worker Hono por rutas del mismo origen; `www.<dominio>` público; dominio/plan todavía no contratados |

DNS administrado en Cloudflare, TLS extremo a extremo con validación estricta de orígenes; redirección HTTP→HTTPS y HSTS después de probar subdominios. DNS no publica credenciales ni endpoints internos. Cookies host-only según seguridad sección 3. CORS de R2 restringido a métodos/orígenes necesarios; autorizar cada upload/download. WAF/DDoS no reemplaza rate limiting de negocio ni protege un origen expuesto por fuera del borde.

CDN: assets con hash `public,max-age=31536000,immutable`; HTML público TTL 60 s inicial y revalidación ISR al publicar en el catálogo o en la biblioteca pública; las páginas autenticadas nunca se cachean de forma compartida. Catálogo público Redis 300 s con jitter; invalidación después del commit. API autenticada, SSE, sesiones, créditos, exámenes, documentos D3 y archivos privados `private,no-store`; no incluirlos en service worker genérico. Fijar `Vary` solo donde sea necesario, nunca usar una respuesta personalizada como caché pública. Seguridad sección 6 limita offline para evitar falsa revocación.

## 3. Escalado y balanceo

- **Frontend:** CDN, SSG e ISR reducen cómputo; SSR solo donde aporta y sin estado en el Worker; carga diferida del motor 3D/Studio. Medir dispositivos móviles y tamaño de paquetes; streaming no es un recurso cacheable.
- **Backend:** Workers distribuye ejecución; el límite efectivo lo ponen SQL, Atlas, proveedores y presupuesto. Aplicar admisión, cuotas, colas y backpressure; la memoria de un isolate no es sesión compartida ni contador global.
- **SQL:** índices/paginación/proyecciones y slow queries primero; pooling acotado y límite de consumidores después. Dimensionar conexiones como `concurrencia DB de API + consumidores × conexiones por job + reserva operativa`, no por número de usuarios. Reservar 20 % del límite contractual para operación y empezar consumidores de carga pesada en 2; calibrar con H0/H1.
- **Mongo:** índices recurso/versión, arrays limitados y documentos ≤1 MiB. Lectura de datos publicados confirmados con garantía de durabilidad configurada; publicación requiere writeConcern `majority` y verificación. Escalar tier/pooling o DO por datos medidos; no sharding inicial.
- **Redis:** límite de memoria/TTL, evicción solo de caché; separar controles de tasa si la evicción afectaría protección. No persistencia financiera. Evitar claves de cardinalidad ilimitada elegidas por cliente.
- **RAG:** separar presupuesto/concurrencia de ingesta de OLTP; HNSW filtrado y pruebas de recall. Réplica de lectura solo para catálogo/analítica no sensibles al retraso; sesión, derechos, pagos y revocaciones siempre autoridad primaria.

| Señal propuesta (medir en ventanas de 15 min) | Acción |
|---|---|
| p95 supera EQ-01/03 con consultas lentas | EXPLAIN, índices y reducir N+1; luego aumentar cómputo acotado |
| Conexiones >70 % o CPU/memoria sostenida >70 % | Reducir admisión/concurrencia pesada; escalar dentro de tope aprobado |
| Cola más antigua >5 min / outbox >1 min | Alerta; aumentar consumidores solo si DB/proveedor tienen margen; no publicar repetidamente sin lease |
| Tablas de auditoría/uso >10 M filas o mantenimiento >30 min | Evaluar particiones por mes con EXPLAIN y diseño de UNIQUE global; no perder idempotencia al particionar |
| Lecturas estables >80 % y p95 incumple tras optimizar | Evaluar réplica/caché pública y costo; no servir permisos desde réplica atrasada |
| Presupuesto duro agotado | Denegar nueva IA/render oneroso; mantener lectura/edición manual. No escalar automáticamente gasto sin límite |

Estos umbrales disparan revisión, no garantizan un tamaño de cluster. **No balanceador de orígenes dedicado inicial:** Workers ya distribuye ejecución, pero no crea réplica PostgreSQL/Atlas. Si se añaden dos orígenes independientes, recién entonces definir health checks, failover, estado compartido y ensayo; no sticky sessions para sostener AuthN. Kafka/Kubernetes/sharding no se adoptan sin demanda demostrada.

## 4. Colas, ejecución larga y límites

| Cola / DLQ | Propietario / efecto | Política inicial |
|---|---|---|
| `mentelyx-billing-events` / `mentelyx-billing-dlq` | M5 → notificación/conciliación | Misma clave y estado; no repetir cargo |
| `mentelyx-settlements` / `mentelyx-settlements-dlq` | M4 → M5 | Registro y conciliación de pagos directos al docente, comisión devengada y cierre de periodo de Docente Live; efecto único por clase y periodo (sustituye la liquidación por créditos) |
| `mentelyx-rag-indexing` / `mentelyx-rag-dlq` | M2 → M6 | Versiones/generaciones; revocaciones tienen prioridad operativa y revalidación protege mientras esperan |
| `mentelyx-studio-ai` / `mentelyx-studio-ai-dlq` | M2 → M6 | Reserva económica antes de proveedor; resultado incierto no se regenera |
| `mentelyx-studio-ai-resultados` / `mentelyx-studio-ai-dlq` | M6 → M2 | Conservar DLQ compartida del API v2.0; incluir sourceQueue/eventType para redrive correcto |
| `mentelyx-renders` / `mentelyx-renders-dlq` | M2 → render M2 | Clave por job y hash completo con audiencia; máximo 2 consumidores iniciales |
| `mentelyx-mantenimiento` / `mentelyx-mantenimiento-dlq` | Cron → dueño M2/M4/M6 | SC-04/09/14, borrar por lotes, checkpoints y alerta; no esperar TTL para denegar acceso |
| `mentelyx-tutor-execution` / `mentelyx-tutor-execution-dlq` | M6 → ejecutor M6 | Extensión técnica de coordinación CO-04: ejecutar consulta fuera de vida de conexión SSE |
| `mentelyx-transversal` / `mentelyx-transversal-dlq` | M1–M7 → M1 | Auditoría, supresión y avisos por outbox del productor (persistencia, sección 13.1); un aviso fallido no revierte la operación de negocio |
| `mentelyx-evaluaciones` / `mentelyx-evaluaciones-dlq` | M3 → M6 → M3 | Generación de evaluaciones personalizadas y rápidas; M3 versiona las preguntas; reserva del recurso «evaluación equivalente» en M5 antes del proveedor |
| `mentelyx-audiovisual` / `mentelyx-audiovisual-dlq` | M4 → M5 | Eventos de uso del SFU en participante-minutos y avisos al 70/90/100 %; deduplicación por evento del proveedor |
| `mentelyx-recompensas` / `mentelyx-recompensas-dlq` | M7 → M5 | Concesión de recursos por recompensa verificada; idempotente por `rewardEventId` |
| `mentelyx-devoluciones` / `mentelyx-devoluciones-dlq` | M5 → adaptador Culqi | Devoluciones totales y parciales; estado SOLICITADA hasta la evidencia del proveedor; reintentos idempotentes |

INF-01 aceptada con DLQ explícita de mantenimiento y cursor de lote: `purga:{tipo}:{fecha}:{cursor}`. Una clave solo por fecha perdería lotes tras fallos. Cron cada 15 min detecta expiraciones; barrido diario verifica huérfanos y purgas. Borrado a petición se encola inmediatamente; no esperar siguiente día. Cron no usa datos sensibles en payload.

Entrega al menos una vez: ACK después de efecto persistido. Reintentos transitorios 3 con esperas iniciales 5/30/120 s y jitter; 429 respeta Retry-After; validación/permiso definitivo va a fallo sin bucle. DLQ conserva identificadores y error redactado, alerta al operador; reejecución conserva eventId, operationKey y generación. Contratar retención de cola/DLQ acorde al máximo tiempo de respuesta operativa; outbox es respaldo duradero hasta conciliación, no borrar por ACK sin política.

**Continuidad Tutor/SSE:** desconectar navegador no debe abortar tarea duradera. La admisión SQL crea operación+outbox; ejecutor de cola adquiere lease SQL, persiste resultado y consumo; SSE se conecta mediante relay efímero por operación (Durable Object interno seleccionado para fan-out con binding restringido). Relay no es fuente de verdad; retiene buffers solo durante ejecución, no historial. GET recupera estado/resultado de SQL/Mongo, sin replay de tokens ni nueva inferencia. En caída del ejecutor, lease vencido se concilia antes de reinvocar proveedor. Cancelación explícita persiste bandera; ejecutor comprueba bandera y aborta si todavía puede, registrando costo incierto. `waitUntil` de una petición terminada **no** se usa como garantía de completar 180 s. Ensayo de desconexión y revocación es bloqueante de la ruta; CO-04 no cambia contrato público de SSE.

Timeouts de diseño: Redis 200 ms; conexión SQL/Mongo 2 s; statement OLTP 1 s; transacción 3 s; llamadas de catálogo se ajustan para respetar deadline total de API, sin sumar reintentos ilimitados. HTTP interno 5 s y presupuesto total 10 s para comandos; operaciones largas responden estado de trabajo. IA mantiene tabla del orquestador sección 13.1 (2/60/180 s según ruta). PDF/PPTX límite inicial de job 120 s, entradas y memoria acotadas; dividir o usar respaldo si no cumple, no extender indefinidamente. Circuito IA 5 fallos/60 s, abierto 30 s, una sonda; no fallback tras resultado/costo incierto sin reserva y conciliación.

INF-02: SymPy Python Worker por service binding **fase 2**, sin endpoint público; medir cold start, tamaño, CPU/memoria y timeout con expresiones adversarias. INF-03: Cloudflare Browser Run (antes «Browser Rendering») adoptado para PDF como capacidad futura, no habilitado en una cuenta; HTML saneado, fuentes empacadas y egress denegado salvo assets autorizados. INF-04: Cloud Run Jobs para PPTX si falla compatibilidad/capacidad Workers; invocación de servicio autenticada y salida al mismo job, key única, límites de instancias/costo, sin nueva lógica de negocio. Conservar PptxGenJS como renderer de ambas variantes.

## 5. DeepSeek y acceso de pago (INF-05 / PEND-01)

El [changelog oficial de Cloudflare del 05/11/2026](https://developers.cloudflare.com/changelog/post/2026-11-05-planned-model-deprecations/), consultado el **17/11/2026**, retira `@cf/deepseek-ai/deepseek-v4-pro-0813` el **20/11/2026**, tras lo cual anuncia HTTP 410/código 5028. Recomienda `@cf/deepseek-ai/deepseek-v4.1-flash-1017` y `@cf/zai-org/glm-5.3` para reemplazo de modelos de frontera.

**Decisión de sustitución:** elegir `@cf/deepseek-ai/deepseek-v4.1-flash-1017` también como destino objetivo del alias `razonamiento.profundo`, con perfil de razonamiento `high` y presupuesto propio, manteniendo `razonamiento.rapido` separado por política. Es un reemplazo recomendado oficialmente por la plataforma; no se inventa un modelo «V4.1 Pro» ni equivalencia de calidad con Pro. La [ficha oficial de Flash](https://developers.cloudflare.com/workers-ai/models/deepseek-v4.1-flash-1017/) confirma razonamiento, herramientas, visión y ZDR; tarifa consultada: USD 0,30/M entrada, 1,20/M salida y 0,006/M entrada cacheada. La ruta permanece desactivada hasta BP-01 y pruebas de privacidad/costo; si no alcanza calidad, no fingir capacidad profunda ni usar API directa con datos de menores. GLM-5.3 queda alternativa por evaluar, no segundo modelo aprobado automáticamente.

PEND-01 se **cierra como selección documental**. Antes de activar: versión de rutas, test contrato de herramientas/SSE, benchmark y no referencias activas al modelo retirado; su nombre histórico se conserva como evidencia. La [API directa DeepSeek](https://api-docs.deepseek.com/quick_start/pricing/) aún identifica `deepseek-v4-pro` como Pro-0813 al consultar: disponibilidad allí no elimina retiro de Workers ni habilita eludir privacidad.

INF-05 se acepta **con modificación**: la ficha permite Workers Paid **o créditos prepagados de AI Gateway**, no solo Paid. Se selecciona Workers Paid para el despliegue objetivo por las capacidades del conjunto, sin contratarlo ni alterar presupuesto. Incluir cómputo, colas, DO/relay, Browser Rendering e inferencias por separado. Tope duro SQL y alarmas por proveedor, no confiar exclusivamente en un aviso de facturación. 70/90/100 % son umbrales de política frente a límite blando; el duro debe ser ≥blando y bloquear toda nueva admisión que lo supere, incluidos planes de pago.

## 6. Disponibilidad, observabilidad y recuperación

| Falla | Respuesta y recuperación | Métrica / alerta |
|---|---|---|
| SQL | Denegar AuthN nuevo/operaciones privadas y escrituras críticas; no confirmar pago/examen/cupo; público CDN coherente puede continuar | 3 health checks fallidos; alarma ≤5 min; guardar referencia mínima del incidente fuera de SQL |
| Mongo | No confirmar guardado/publicación; UI distingue borrador local; catálogo público puede seguir | Error y latencia; trabajos pendientes, ninguna confirmación falsa |
| Redis | Omitir caché con límite de origen; rate limit sensible SQL conservador o 503 | Error/timeout >5 % por 5 min; sin salto de cuota |
| IA/Gateway | Circuito, ruta permitida alternativa con reserva o error; lectura/edición manual siguen | TTFT/total/error por ruta; costo reservado/real/pendiente |
| R2/render | Trabajo pendiente/fallido, objeto no disponible no se marca LISTO | Bytes/hash, antigüedad del trabajo, horas de navegador y fallos |
| Queues | Outbox acumula; no bloquear transacción ya confirmada por notificación | Oldest age y DLQ>0; alerta inmediata para economía/revocación |
| Pasarela | Estado incierto sin repetir cargo; conciliación | Diferencias importe/estado, operaciones sin resolver |
| SFU/video | Reconexión, reserva preservada y compensación reglada | Participante-min, pérdida/reconexión; ensayar 35+1 y varias salas |

`/health/live` indica proceso vivo; `/health/ready` comprueba dependencias mínimas con timeout, sin exponer secretos ni realizar inferencias/cargos. Dependencia IA caída no vuelve no-lista toda la API educativa. Monitor externo cada minuto para ruta pública y transacción sintética no financiera. Registrar errores/latencia por módulo, pool/conexiones, consulta lenta redactada, queue age, reintentos, ledger mismatch, purga atrasada y gasto. Correlación por IDs opacos sin prompts/PII, métricas agregadas sin userId como etiqueta de alta cardinalidad.

Alarma p95 de diagnóstico >1 s durante 10 min de EQ-19 no sustituye criterio de aceptación p95 ≤2/3 s de EQ-01/03. Alertas: consumo al 70/90/100 %; DB margen <20 %; toda DLQ financiera; purga atrasada >24 h; integridad ledger/cupo distinta de cero. Responsables: operador de infraestructura coordina incidente, dueño M1–M7 valida datos; producto comunica afectación sin prometer SLA no contratado.

RTO/RPO y runbook en [persistencia sección 11](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md). Neon permite restauración dentro de ventana configurada ([fuente oficial](https://neon.com/docs/postgres/backup-restore/branch-restore)); Atlas distingue planes de respaldo, con Cloud Backup para M10+ ([fuente oficial](https://www.mongodb.com/docs/atlas/backup/cloud-backup/overview/)); consulta 17/11/2026. Esas capacidades no prueban backups activados. Probar restauración aislada trimestral, revocar sesiones, reaplicar borrados, reconciliar pagos externos y abrir por etapas. Región de contingencia y copia independiente por seleccionar con presupuesto; no afirmar failover multi-región automático.

## 7. Actualizaciones y CI/CD previsto

Pipeline futuro: lint/tipos y esquemas → pruebas unitarias/contratos → integración SQL/Mongo/Redis → dependencias/licencias/secret scanning → build inmutable con versión de runtime/renderer/rutas → staging y smoke/carga/fallos → revisión humana de evidencia → promoción controlada. Despliegue porcentual y observación de errores, latencia e invariantes; revertir versión de aplicación si regresión. Migraciones expand-contract primero, retirar columnas/formatos solo tras ventana de reversión; rollback no deshace ledger ni pagos.

CI de forks sin credenciales; secrets por entorno y permisos mínimos; job de migración separado del runtime. Backup y plan de recuperación antes de cambios de esquema; no migración destructiva al iniciar Worker. Versión N y N−1 deben poder leer eventos/documentos durante promoción; dead letters por esquema desconocido no se descartan. No se ha creado pipeline ni ejecutado despliegue en esta tarea.

## 8. Gates y trazabilidad

PR-INF-01 compatibilidad completa (OpenNext con ISR y SSR, AuthN con Drizzle, transacciones Drizzle y lecturas Kysely en Neon, Mongo TLS/SRV, Redis, identificadores de Workers AI, más la comparación OpenNext frente a vinext descrita después); PR-INF-02 carga EQ-01/03/15; PR-INF-03 fallos/restore EQ-19/20/21/29/31; PR-INF-04 SSE desconectado, cancelación/lease y resultado único; PR-INF-05 PDF/PPTX y SymPy por fases. Todos **pendientes de ejecución**, con versiones/fecha/región/plan/carga/costo registrado.

**PR-INF-01 y vinext (registro del 21/11/2026).** La documentación de Cloudflare recomienda actualmente vinext para aplicaciones Next.js nuevas en Workers ([guía de Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)). También indica que vinext está en beta, que conviene ejecutar `npx vinext check` antes de adoptarlo y que la [guía de OpenNext](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/) sirve para mantener aplicaciones OpenNext existentes; según esa guía, OpenNext aún no admite el middleware de Node.js. **OpenNext sigue siendo nuestra selección (ADR-074).** PR-INF-01 añade una prueba comparativa de compatibilidad entre OpenNext y vinext con las mismas rutas: SSG e ISR del catálogo y la biblioteca pública, SSR autenticado sin caché compartida, middleware, Better Auth, imágenes, PWA y *service binding* hacia Hono. Registrará versiones, resultado por ruta, tiempo de build y tamaño del bundle. No se cambia de framework ni de adaptador sin autorización del propietario.

**PR-INF-01 · parte local ejecutada (21/11/2026; Next.js 16.4.6, `@opennextjs/cloudflare` 1.20.18, Wrangler/workerd 4.166.0, Hono 4.13.19, Better Auth 1.7.27, Drizzle 0.45.4, Kysely 0.29.9, `@neondatabase/serverless` 1.2.1, `mongodb` 7.9.1).** Ejecutada en workerd local; la parte en la nube sigue **pendiente**.

| Ruta o capacidad | Resultado |
|---|---|
| SSG (`/`, `/planes`, `/auth/*`) | Pasada: `x-nextjs-cache: HIT`, `s-maxage=31536000` |
| ISR (`/biblioteca`, 300 s) | Pasada: `STALE` y regeneración en segundo plano; siguiente respuesta `HIT` con fecha nueva (caché R2 + `memoryQueue`) |
| SSR autenticado (`/espacios`, `/tutor`) | Pasada: `private, no-cache, no-store`; un usuario no ve datos de otro |
| Middleware edge (`middleware.ts`) | Pasada (307 a `/auth/ingresar`). Next.js 16 lo marca como obsoleto en favor de `proxy.ts` (runtime Node.js), que OpenNext 1.20 solo admite de forma experimental |
| *Service binding* `/api/v1/*` → Hono | Pasada: cookies de Better Auth de primera parte (HttpOnly, SameSite=Lax) |
| Better Auth en workerd | Pasada: registro, sesión, login, logout. scrypt nativo (N=16384, r=16): ~83 ms de CPU por hash medidos en Node.js 24; registro y login ≈ 245 ms frente a ≈ 105 ms de una consulta de sesión en workerd local. **Riesgo:** supera los 10 ms de CPU por petición del plan Workers Free; requiere Workers Paid o una decisión del propietario |
| Drizzle (transacción interactiva) y Kysely en workerd | Pasada (driver serverless de Neon con wsproxy local) |
| MongoDB (driver oficial) en workerd | Pasada con el empaquetador de Wrangler (conectar, insertar, leer; ~20 ms en caliente). Bajo el pool de Vitest el driver entra en recursión al cargar `bson` (artefacto del arnés); por eso se carga de forma diferida y se prueba de extremo a extremo |
| Redis REST (Upstash) en workerd | Pasada contra el emulador local |
| Tamaño de los Workers | Frontend: 5304,50 KiB (1105,73 KiB gzip); API: 4953,94 KiB (797,22 KiB gzip). Ambos por debajo de 3 MiB comprimido |
| Build | `next build` ≈ 40 s en Windows; `opennextjs-cloudflare build` completo (incluye su propio `next build`) ≈ 49 s en Linux. En Windows el empaquetado de OpenNext falla por falta de permiso para crear enlaces simbólicos (EPERM), limitación que OpenNext documenta; el build se hace en Linux (contenedor o CI) |
| vinext 1.4.6 (`vinext check`, sin migrar) | 93 % compatible: 13 compatibles, 2 parciales (`images` sin optimizador; `reactStrictMode` no envuelve el App Router) y 0 problemas. No se ejecutó `vinext init` ni un build con vinext: requiere instalar dependencias y la autorización del propietario |

Pendiente en la nube: RTT y región de Neon y Atlas desde Lima, Mongo con TLS/SRV contra Atlas, p95 de Upstash desde Workers, identificadores de Workers AI y comportamiento real del límite de CPU.

Trazabilidad: ADR-003/008/012/013/021/022/031/032/036/037/038/041/042/053/054; AC-01/02/03/06/10; RF-63/64/66/89/91/94/95/96; EQ-01/03/10/15/19/20/21/26/29/30/31; INF-01–INF-06. El cierre documental no habilita construcción ni SDD por sí mismo.

## 9. Costos, tarifas y dimensionamiento (instrucción maestra, sección 18)

Fuente: [instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md) (IM). Distingue tres cosas que no deben mezclarse: **cotas de diseño** (IM, sección 18.1), **tarifas de referencia por verificar** (IM, sección 18.2) y **consumos reales**, que aún no existen.

### 9.1. Tecnologías objetivo

Cloudflare Workers Paid, Workers AI, Queues, R2, Neon, MongoDB Atlas, Upstash Redis, RealtimeKit (candidato audiovisual sujeto a prueba, ADR-046), Bunny Stream, Cloudflare Browser Run y Resend como referencia de correo transaccional; CulqiOnline como pasarela (ADR-082). Ninguno está contratado.

### 9.2. Cotas de inferencia a uso completo por plan (diseño, no medición)

Cotas por operación (IM, sección 18.1): consulta general 0,001; técnica 0,006; razonamiento profundo 0,015; evaluación equivalente de 15 preguntas 0,025; ilustración estándar 0,003; documento educativo complejo 0,060 (USD). Multiplicadas por la matriz aprobada (IM, secciones 14 y 15.1):

| Plan | Cálculo | Cota mensual de inferencia (USD) |
|---|---|---:|
| Gratuito | 60 × 0,001 + 15 × 0,006 + 2 × 0,015 + 3 × 0,025 + 4 × 0,003 | 0,267 |
| Estándar | 250 × 0,001 + 100 × 0,006 + 20 × 0,015 + 10 × 0,025 + 10 × 0,003 | 1,430 |
| Plus | 450 × 0,001 + 200 × 0,006 + 50 × 0,015 + 20 × 0,025 + 25 × 0,003 | 2,975 |
| Premium | 750 × 0,001 + 350 × 0,006 + 100 × 0,015 + 40 × 0,025 + 50 × 0,003 | 5,500 |
| Docente Inicial | 100 × 0,001 + 50 × 0,006 + 10 × 0,015 + 30 × 0,003 + 30 × 0,060 | 2,440 |

Las cotas excluyen almacenamiento, embeddings, OCR, renderizado, video, infraestructura y pasarela. Docente Live suma la capacidad audiovisual. Si un costo medido supera su cota, se reporta (EQ-45) y **no se modifican las cuotas aprobadas** (IM, sección 18.1). Compatibilidad con la tarifa verificada de DeepSeek V4.1 Flash (USD 0,30/M de entrada y 1,20/M de salida, orquestador, sección 5.2): una consulta técnica de 6.000 tokens de entrada solo cabe en 0,006 USD con hasta 3.500 tokens de salida (0,0018 + 0,0042). El estimador recorta el contexto o la salida para no superar la cota.

### 9.3. Tarifas de referencia (IM, sección 18.2): estado de verificación

**No se consultaron las fuentes oficiales en esta intervención.** Las cifras son las de la IM y requieren verificación con fecha de consulta, moneda, plan, unidad de facturación, costo base, excesos, asignaciones gratuitas compartidas, impuestos y condiciones.

| Servicio | Referencia de la IM | Fuente oficial | Estado |
|---|---|---|---|
| Workers Paid | USD 5/mes de base | developers.cloudflare.com/workers/platform/pricing | Por verificar |
| Workers AI | Por modelo | developers.cloudflare.com/workers-ai/platform/pricing | DeepSeek V4.1 Flash verificado el 17/11/2026 (orquestador, sección 19); el resto por verificar |
| Neon | USD 0,106 por CU-hora y USD 0,35 por GB-mes | neon.com/pricing | Por verificar |
| Atlas Flex | USD 8–30/mes | mongodb.com/docs/atlas/billing/atlas-flex-costs | Por verificar |
| Upstash | USD 0,20 por 100.000 comandos | upstash.com/pricing/redis | Por verificar |
| R2 | USD 0,015 por GB-mes estándar | developers.cloudflare.com/r2/pricing | Por verificar |
| RealtimeKit | USD 0,002 por participante-minuto; exportación USD 0,010 por minuto | developers.cloudflare.com/realtime/realtimekit/platform/pricing | Por verificar |
| Bunny Stream | Almacenamiento desde USD 0,01 por GB | bunny.net/pricing/stream | Por verificar |
| Browser Run | Asignación incluida y excesos | developers.cloudflare.com/browser-run/pricing | Por verificar |
| Resend | Límites gratuitos y plan | resend.com/pricing | Por verificar |
| Tipo de cambio | Fechado y verificable | sbs.gob.pe | Por verificar |

No se presenta un costo de infraestructura mensual (por ejemplo, S/420) ni un punto de equilibrio como medición (IM, sección 18.2).

### 9.4. Comisiones CulqiOnline por plan (referencia consultada el 25/11/2026)

Fuente declarada: [tarifario Online y Link de Culqi](https://culqi.com/precios/), consulta registrada el 25/11/2026. Esta tabla muestra referencias publicadas, no condiciones contractuales verificadas. Los importes porcentuales se calculan como precio × tasa y se redondean a dos decimales; el mínimo de referencia de S/3,50 para importes inferiores a S/87,72 solo se atribuye aquí a PagoEfectivo y Cuotéalo, pendiente de confirmación contractual.

| Precio | Tarjeta nacional (3,44 %) | Tarjeta internacional (3,99 %) | Yape (3,44 %) | PagoEfectivo (3,99 %)* | Cuotéalo BCP (3,99 %)* | Mínimo de referencia* |
|---|---:|---:|---:|---:|---:|---|
| S/39,90 | S/1,37 | S/1,59 | S/1,37 | S/1,59 | S/1,59 | S/3,50; confirmar contrato |
| S/59,90 | S/2,06 | S/2,39 | S/2,06 | S/2,39 | S/2,39 | S/3,50; confirmar contrato |
| S/89,90 | S/3,09 | S/3,59 | S/3,09 | S/3,59 | S/3,59 | No alcanza el umbral |
| S/55 | S/1,89 | S/2,19 | S/1,89 | S/2,19 | S/2,19 | S/3,50; confirmar contrato |
| S/100 | S/3,44 | S/3,99 | S/3,44 | S/3,99 | S/3,99 | No alcanza el umbral |

El fijo publicado para ventas Online es USD 0,20; se mantiene separado del porcentaje porque su aplicación por medio de pago y su combinación con el mínimo deben confirmarse en el contrato. Así, para S/100 en un medio con tasa 3,99 %, el componente porcentual es S/3,99 y el fijo se añade en USD solo si corresponde contractualmente; **S/3,99 no es un total confirmado**. No se convierte el fijo a PEN: no hay tipo de cambio fechado en esta tabla. El tratamiento tributario tampoco se incorpora al cálculo y requiere confirmación. Los precios aprobados no cambian. RF-121 exige conciliar la comisión efectiva por transacción.

### 9.5. Dimensionamiento añadido

- **Vectores:** BGE-M3 de 1024 dimensiones = 4 × 1024 + 8 = 4.104 bytes por vector; el detalle está en la [persistencia, sección 6.2](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md).
- **Audiovisual:** la capacidad de referencia de Docente Live es de 3.750 participante-minutos por periodo. Con la tarifa de referencia por verificar de RealtimeKit (USD 0,002), equivale a USD 7,50 de proveedor antes de exportaciones y grabaciones. Cada clase reserva su estimación antes de iniciar.
- **Trabajos asíncronos:** extracción y OCR de fuentes, indexación, evaluaciones, ilustraciones, documentos, eventos audiovisuales, recompensas y devoluciones (sección 4), con concurrencia limitada por consumidor y presupuesto.
- **Conexiones:** se mantiene la fórmula de la sección 3. Las transacciones Drizzle usan una conexión por petición y las lecturas Kysely de reporte van fuera de las transacciones de negocio.


### 9.6. Perfiles de ejecución y despliegue académico (27/11/2026)

| Perfil | Datos | IA | Secretos | Uso |
|---|---|---|---|---|
| `local` (por omisión) | PostgreSQL y MongoDB de Docker Compose | Simulado, rotulado | `backend/.dev.vars` (`AUTH_SECRET`) | Desarrollo y CI |
| `local-ia` | Docker Compose | Workers AI (Gemma 4 y BGE-M3) | `.dev.vars` + `wrangler login` | Requiere el subdominio workers.dev |
| `externo` | Neon (*pooled*) y MongoDB Atlas | NVIDIA (ADR-094) | `backend/.dev.vars.externo`, generado desde `backend/.secretos/` | Verificado el 27/11/2026 desde Windows |
| `demostracion` | Neon y Atlas | NVIDIA o Workers AI | Secretos de Workers | **No desplegado** |

**Despliegue de demostración, separado de producción** (requiere autorización explícita y que el propietario resuelva antes los bloqueos):

1. **Bloqueos de la cuenta de Cloudflare:**
   - habilitar R2 en el panel (código 10042);
   - registrar el subdominio workers.dev;
   - decidir cómo llega un Worker a Atlas. Las IP de salida de Workers no son fijas, así que las opciones son abrir Network Access a `0.0.0.0/0` con un usuario de mínimo privilegio y contraseña rotada, o mantener las conversaciones y el banco en un MongoDB alcanzable. Hoy no hay ninguna.
2. **Secretos** (desde Windows, en `backend/`):
   - `node ../scripts/preparar-perfil-externo.mjs --json <temporal>.json`;
   - `npx wrangler secret bulk <temporal>.json --env demostracion`;
   - borrar el JSON temporal.

   El script genera `AUTH_SECRET`, `DATABASE_URL`, `MONGODB_URL` y `NVIDIA_API_KEY`. No se suben archivos locales.
3. **Variables de `env.demostracion`:**
   - `IA_PROVEEDOR=nvidia` y `NVIDIA_MODELO`, o `workers-ai`;
   - `AUTH_URL`: origen público del frontend.
4. **Despliegue:**
   - API: `npx wrangler deploy --env demostracion` en `backend/`.
   - Frontend: compilar OpenNext en Linux (el contenedor `mentelyx-build` o CI) y `npx wrangler deploy` en `frontend/`, con el *service binding* `API` a `mentelyx-api`.
5. **Comprobación:**
   - `node scripts/humo-e2e.mjs <URL>`;
   - `node scripts/flujos-v1-e2e.mjs <URL>` después de `sembrar-demo.mjs`, solo con cuentas ficticias.

**Riesgo conocido:** el hash de contraseñas (scrypt, unos 83 ms de CPU) supera los 10 ms de Workers Free (PR-INF-01). Hace falta Workers Paid o aceptar el riesgo en la demostración. No se habilitan usuarios reales.

### 9.7. Estrategia de caché: diseño frente a implementación (Sprint 2, 27/11/2026)

**Decisiones del Sprint 1:**
- ADR-012: Redis para caché y controles efímeros.
- ADR-074: Next.js híbrido con OpenNext.
- Sección 2 de este documento: los recursos con hash, `public, max-age=31536000, immutable`; el HTML público, TTL de 60 s y revalidación ISR; las páginas autenticadas nunca se cachean.

| Capa | Diseño | Implementación real | Invalidación y consistencia | Datos privados |
|---|---|---|---|---|
| Recursos estáticos (`/_next/static`, fuentes, modelos, PDF del catálogo) | CDN, inmutables | Binding de *assets* de OpenNext; nombres con hash | Por nombre: un despliegue nuevo cambia el hash | Solo contenido público |
| HTML público SSG (`/`, `/planes`, `/auth/*`, páginas legales) | CDN y SSG | `x-nextjs-cache: HIT`, `s-maxage=31536000` | Se regenera al compilar o desplegar | No contiene datos de la cuenta |
| HTML ISR (`/biblioteca`) | ISR con revalidación | `revalidate = 300` s; caché incremental de OpenNext (R2 en el despliegue, `populateCache local` en local) | `stale-while-revalidate`: se sirve la copia y se regenera en segundo plano | Público |
| SSR autenticado (`/examenes`, `/espacios`, `/configuracion`…) | Sin caché compartida | `private, no-cache, no-store` | No aplica | Nunca entra en una caché compartida |
| API privada (`/api/v1/*` con sesión) | Sin caché | `Cache-Control: private, no-store` en cada respuesta con datos de la cuenta; token CSRF con `Vary: Cookie` | No aplica | Sí; protegida por sesión y propietario |
| Caché de datos en Redis (ADR-012, RF-94) | Lecturas repetidas no sensibles | **No implementada.** Redis (Upstash REST) se usa solo para **contadores del límite de tasa** del Tutor, con respaldo SQL | — | — |
| Consultas y contenidos (PostgreSQL y Mongo) | Índices y paginación antes que caché | Índices verificados con EXPLAIN; sin caché de resultados | Fuente de verdad única | — |

**Medición:** `scripts/analisis/medir-cache.mjs` compara la primera petición con la mediana de las 20 siguientes en el entorno local (`evidencias/cache/medicion-cache-local.json`). **No mide la CDN de Cloudflare**, porque el Worker no está publicado. La mejora que aporta la CDN no se atribuye a esta prueba.

**Conclusión:**
- La caché pública (estáticos, SSG e ISR) está implementada y protege los datos privados con `private, no-store`.
- La caché de datos con Redis sigue **diseñada, no implementada**: el hallazgo de carga (sección 26 del SDD) no se resuelve con ella, sino con *pooling* de conexiones.
- No se incorporó Redis como caché sin una medición que lo justifique.

**Resultados medidos (paquete OpenNext local, puerto 8793):**
- SSG `/` y `/planes`: `HIT` desde la primera petición (66 y 44 ms; mediana 49 y 38 ms), `s-maxage=31536000`.
- ISR `/biblioteca`: `HIT`, `s-maxage=229, stale-while-revalidate=2592000`.
- Privadas: el SSR sin sesión redirige (307) y la API responde 401; ninguna respuesta con datos de la cuenta es cacheable.
- **Hallazgo:** en local, los JS de `/_next/static` se sirven con `public, max-age=0, must-revalidate`, no con `immutable` como prevé la sección 2. En producción no está verificado; si se repite, hay que añadir la regla de cabeceras de *assets*.

### 9.8. Límite de CPU de Workers y hash de contraseñas (Sprint 2, 27/11/2026)

**Medición** (Node 24, `better-auth/crypto`, mismo algoritmo y coste que en producción):
- crear el hash: 109–173 ms de CPU;
- verificarlo: 93–140 ms de CPU.

Es CPU real, no espera de red. El plan **Workers Free** limita cada petición a **10 ms de CPU**, así que el registro y el inicio de sesión no cabrían en él.

**Decisión:** no se reduce el coste del hash para encajar en el plan gratuito. Las alternativas, sin contratar nada ahora:
- Workers Paid (límite de CPU configurable), con autorización del propietario;
- o delegar el hash a un servicio con más CPU, lo que añade una dependencia.

Se deja como **bloqueo de despliegue** junto con R2 sin habilitar, el subdominio `workers.dev` sin crear y el *pooling* de conexiones (sección 9.7 y SDD, sección 26).
