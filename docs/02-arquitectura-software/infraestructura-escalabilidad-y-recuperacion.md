# Despliegue, escalabilidad, caché y recuperación

> **Versión:** 1.0 — 17/11/2026 · **Estado:** diseño seleccionado; sin servicios contratados, configuración externa ni despliegues. Integra INF-01–INF-06. Las cifras son metas o límites de diseño hasta su medición.

## 1. Topología elegida y compatibilidad

Se conserva monolito modular Hono/TypeScript en Workers. Colas/renderizadores son adaptadores del mismo dominio, no nuevos microservicios de negocio. PostgreSQL/Neon y MongoDB/Atlas permanecen; Redis administrado **Upstash por HTTPS** se selecciona como adaptador de producción, sujeto a región/contrato/costo. Local usa Redis compatible detrás del mismo puerto; probar equivalencia de comandos atómicos usados.

| Pieza | Selección / alcance | Evidencia oficial, consultada 17/11/2026 | Comprobación pendiente |
|---|---|---|---|
| Frontend | Next.js export estática en Pages para web/PWA; rutas dinámicas de contenido se resuelven cliente/API en esa variante | [Guía Next.js](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/): Pages sigue siendo opción para export estática. La ruta recomendada actualmente para Next.js dinámico es vinext; OpenNext sigue documentado para aplicaciones existentes | Build y navegación directa de rutas API/UI v2.0. Si necesitan SSR/ISR/Server Actions, evaluar vinext frente a Next.js Node; no asumir SSR en Pages estático |
| API/AuthN | Hono/Better Auth; instancia y cliente transaccional por request; fecha de compatibilidad fijada al construir | [Better Auth Workers](https://better-auth.com/docs/guides/cloudflare): compatibilidad Node, entorno y restricción de I/O entre requests | Hashing, MFA, cookies, adaptador y transacciones; no compartir pool vivo de módulo entre invocaciones |
| SQL | Driver Neon por HTTPS para consultas independientes y transacciones en lote; Client/Pool WebSocket por request para transacciones interactivas | [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver) | BEGIN/locks/COMMIT en misma conexión; cerrar conexión al terminar; endpoint pooled para OLTP, directo para mantenimiento que lo requiera |
| Mongo | Driver Node oficial con compatibilidad Workers. Acceso directo inicial acotado; DO de conexión solo si medición lo exige | [Cloudflare MongoDB](https://developers.cloudflare.com/workers/databases/third-party-integrations/mongodb/) documenta conexión directa y variante Durable Object; Hyperdrive no soporta Mongo | TLS/SRV/allowlist de red sin apertura general permanente, cold-start y conexiones; no reutilizar pool de Worker normal |
| Redis | Upstash REST; timeout y límite de comandos; solo caché/rate limit | [Cloudflare Upstash](https://developers.cloudflare.com/workers/databases/third-party-integrations/upstash/) | Latencia Perú/región DB, atomicidad/TTL y degradación |
| pgvector | Objetivo PostgreSQL 17 con pgvector ≥0.8.0; igual mayor/extensión local y staging | [Neon extensiones](https://neon.com/docs/extensions/pg-extensions) lista 0.8.0 para PG14–17 y 0.8.6 para PG18; no prueba instalación en una cuenta | `SELECT extversion FROM pg_extension WHERE extname='vector'` y `SHOW server_version` en prototipo; EXPLAIN y Recall con filtros |
| Objetos/colas | R2 privado; Queues e inbox/outbox duraderos | [Queues entrega](https://developers.cloudflare.com/queues/reference/delivery-guarantees/): al menos una vez | Redelivery, DLQ, pérdida de ACK y deduplicación |
| Render pesado | Browser Rendering para PDF; PptxGenJS en Worker si pasa prueba, Cloud Run Jobs como respaldo seleccionado | Fuentes especializadas sección 19, ya consultadas por Claude el 17/11/2026 | PEND-05/PEND-MAT-01; medir tiempo, memoria, fuentes, contenido y facturación |

INF-06 se resuelve documentalmente: soporte de búsqueda iterativa disponible según versión; **no** se afirma extensión instalada. No sustituir pgvector por otra extensión ofrecida por Neon sin ADR. Si el driver/adaptador de autenticación no soporta transacciones interactivas, no simularlas con llamadas HTTP independientes: elegir conexión WebSocket por request y crear instancia AuthN por request, o trasladar adaptador a runtime compatible con decisión registrada.

La conexión Atlas exige región próxima a SQL y ejecutores para reducir viajes; elegir tras medición desde Perú. Si no se logra restricción de red adecuada desde Workers, usar adaptador privado con salida controlada; no convertir `0.0.0.0/0` en decisión permanente. No activar Data API retirada ni asumir Hyperdrive documental. DO de conexión debe particionarse por ámbito para no serializar toda la plataforma; su adopción depende de latencia/conexiones medidas.

## 2. Entornos, DNS/CDN, TLS y red

| Entorno | Datos/servicios | Publicación y protección |
|---|---|---|
| Local | PostgreSQL/Mongo/Redis locales, objetos de prueba, mocks de correo/pagos/IA | Sin datos reales; no instalar ahora. Tests de puertos con servicios efímeros al construir |
| CI/pruebas | Almacenes efímeros, corpus sintético, proveedores simulados | No secretos de producción en PR; test de contrato y esquemas |
| Staging | Proyectos, buckets, Redis, colas y claves separados; servicios sandbox | `staging.<dominio>` con acceso de equipo, no indexable; pruebas regionales y fallos |
| Producción | Recursos separados y mínimos privilegios | `app.<dominio>` UI + `/api/v1/*` Worker; `www.<dominio>` público; dominio/plan todavía no contratados |

DNS administrado en Cloudflare, TLS extremo a extremo con validación estricta de orígenes; redirección HTTP→HTTPS y HSTS después de probar subdominios. DNS no publica credenciales ni endpoints internos. Cookies host-only según seguridad sección 3. CORS de R2 restringido a métodos/orígenes necesarios; autorizar cada upload/download. WAF/DDoS no reemplaza rate limiting de negocio ni protege un origen expuesto por fuera del borde.

CDN: assets con hash `public,max-age=31536000,immutable`; HTML público TTL 60 s inicial y revalidación al publicar. Catálogo público Redis 300 s con jitter; invalidación después del commit. API autenticada, SSE, sesiones, créditos, exámenes, documentos D3 y archivos privados `private,no-store`; no incluirlos en service worker genérico. Fijar `Vary` solo donde sea necesario, nunca usar una respuesta personalizada como caché pública. Seguridad sección 6 limita offline para evitar falsa revocación.

## 3. Escalado y balanceo

- **Frontend:** CDN y assets estáticos reducen cómputo; carga diferida del motor 3D/Studio. Medir dispositivos móviles y tamaño de paquetes; streaming no es un recurso cacheable.
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
| `mentelyx-settlements` / `mentelyx-settlements-dlq` | M4 → M5 | Prestación única; reconciliar antes de repagar |
| `mentelyx-rag-indexing` / `mentelyx-rag-dlq` | M2 → M6 | Versiones/generaciones; revocaciones tienen prioridad operativa y revalidación protege mientras esperan |
| `mentelyx-studio-ai` / `mentelyx-studio-ai-dlq` | M2 → M6 | Reserva económica antes de proveedor; resultado incierto no se regenera |
| `mentelyx-studio-ai-resultados` / `mentelyx-studio-ai-dlq` | M6 → M2 | Conservar DLQ compartida del API v2.0; incluir sourceQueue/eventType para redrive correcto |
| `mentelyx-renders` / `mentelyx-renders-dlq` | M2 → render M2 | Clave por job y hash completo con audiencia; máximo 2 consumidores iniciales |
| `mentelyx-mantenimiento` / `mentelyx-mantenimiento-dlq` | Cron → dueño M2/M4/M6 | SC-04/09/14, borrar por lotes, checkpoints y alerta; no esperar TTL para denegar acceso |
| `mentelyx-tutor-execution` / `mentelyx-tutor-execution-dlq` | M6 → ejecutor M6 | Extensión técnica de coordinación CO-04: ejecutar consulta fuera de vida de conexión SSE |

INF-01 aceptada con DLQ explícita de mantenimiento y cursor de lote: `purga:{tipo}:{fecha}:{cursor}`. Una clave solo por fecha perdería lotes tras fallos. Cron cada 15 min detecta expiraciones; barrido diario verifica huérfanos y purgas. Borrado a petición se encola inmediatamente; no esperar siguiente día. Cron no usa datos sensibles en payload.

Entrega al menos una vez: ACK después de efecto persistido. Reintentos transitorios 3 con esperas iniciales 5/30/120 s y jitter; 429 respeta Retry-After; validación/permiso definitivo va a fallo sin bucle. DLQ conserva identificadores y error redactado, alerta al operador; reejecución conserva eventId, operationKey y generación. Contratar retención de cola/DLQ acorde al máximo tiempo de respuesta operativa; outbox es respaldo duradero hasta conciliación, no borrar por ACK sin política.

**Continuidad Tutor/SSE:** desconectar navegador no debe abortar tarea duradera. La admisión SQL crea operación+outbox; ejecutor de cola adquiere lease SQL, persiste resultado y consumo; SSE se conecta mediante relay efímero por operación (Durable Object interno seleccionado para fan-out con binding restringido). Relay no es fuente de verdad; retiene buffers solo durante ejecución, no historial. GET recupera estado/resultado de SQL/Mongo, sin replay de tokens ni nueva inferencia. En caída del ejecutor, lease vencido se concilia antes de reinvocar proveedor. Cancelación explícita persiste bandera; ejecutor comprueba bandera y aborta si todavía puede, registrando costo incierto. `waitUntil` de una petición terminada **no** se usa como garantía de completar 180 s. Ensayo de desconexión y revocación es bloqueante de la ruta; CO-04 no cambia contrato público de SSE.

Timeouts de diseño: Redis 200 ms; conexión SQL/Mongo 2 s; statement OLTP 1 s; transacción 3 s; llamadas de catálogo se ajustan para respetar deadline total de API, sin sumar reintentos ilimitados. HTTP interno 5 s y presupuesto total 10 s para comandos; operaciones largas responden estado de trabajo. IA mantiene tabla del orquestador sección 13.1 (2/60/180 s según ruta). PDF/PPTX límite inicial de job 120 s, entradas y memoria acotadas; dividir o usar respaldo si no cumple, no extender indefinidamente. Circuito IA 5 fallos/60 s, abierto 30 s, una sonda; no fallback tras resultado/costo incierto sin reserva y conciliación.

INF-02: SymPy Python Worker por service binding **fase 2**, sin endpoint público; medir cold start, tamaño, CPU/memoria y timeout con expresiones adversarias. INF-03: Browser Rendering adoptado para PDF como capacidad futura, no habilitado en una cuenta; HTML saneado, fuentes empacadas y egress denegado salvo assets autorizados. INF-04: Cloud Run Jobs para PPTX si falla compatibilidad/capacidad Workers; invocación de servicio autenticada y salida al mismo job, key única, límites de instancias/costo, sin nueva lógica de negocio. Conservar PptxGenJS como renderer de ambas variantes.

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

PR-INF-01 compatibilidad completa (Next export/rutas, AuthN, Neon transacciones, Mongo TLS/SRV, Redis); PR-INF-02 carga EQ-01/03/15; PR-INF-03 fallos/restore EQ-19/20/21/29/31; PR-INF-04 SSE desconectado, cancelación/lease y resultado único; PR-INF-05 PDF/PPTX y SymPy por fases. Todos **pendientes de ejecución**, con versiones/fecha/región/plan/carga/costo registrado.

Trazabilidad: ADR-003/008/012/013/021/022/031/032/036/037/038/041/042/053/054; AC-01/02/03/06/10; RF-63/64/66/89/91/94/95/96; EQ-01/03/10/15/19/20/21/26/29/30/31; INF-01–INF-06. El cierre documental no habilita construcción ni SDD por sí mismo.
