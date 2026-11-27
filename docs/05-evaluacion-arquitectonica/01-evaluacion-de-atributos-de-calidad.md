# Evaluación de atributos de calidad — Mentelyx

> **Versión:** 1.0 — 20/11/2026 · **Sprint:** 02 · **Autoridad:** [instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md), sección 24.
> **Método:** reevaluación documental **inspirada en ATAM**, hecha por el arquitecto sobre los documentos ya corregidos. **No es un ATAM formal**: no hubo taller con interesados, votación de escenarios ni equipo evaluador externo.
> **Origen:** traslada y actualiza la sección 8 del SDD v1.0 (objetivos, árbol de utilidad y enfoques). Riesgos y compromisos: [02](02-analisis-de-riesgos-y-compromisos.md). Pruebas: [03](03-estrategia-de-pruebas.md). Trazabilidad: [04](04-matriz-de-trazabilidad.md).
> **Estado de las pruebas:** todas **Pendientes**; no hay código ni mediciones.

## 1. Objetivos de negocio

| ID | Objetivo | Atributos dominantes |
|---|---|---|
| OB-1 | Aprender cualquier tema con un Tutor IA confiable, con o sin fuentes propias | AC-11, AC-04, AC-07 |
| OB-2 | Proteger a menores y datos personales | AC-04 |
| OB-3 | Cobrar planes con CulqiOnline, registrar pagos directos y comisiones, y devolver saldos audiovisuales sin errores | AC-06, AC-08, AC-10 |
| OB-4 | Operar con poco personal y costos de inferencia acotados por plan | AC-10, AC-02, AC-05 |
| OB-5 | Estudiar en un lienzo usable en móvil, tableta y computadora con redes inestables | AC-07, AC-01 |
| OB-6 | Reutilizar recursos educativos antes de generar otros nuevos | AC-10, AC-11, AC-05 |

## 2. Evaluación por atributo

| Atributo | Mecanismos de la arquitectura | Escenarios | Juicio documental | Evidencia requerida |
|---|---|---|---|---|
| Rendimiento | CDN e ISR del frontend en OpenNext; Workers sin estado; consultas keyset; carga por región del lienzo | EQ-01, EQ-15, EQ-34 | Plausible; depende del RTT Workers ↔ Neon/Atlas | K6-01, K6-03, PIZ-01 |
| Disponibilidad | Degradación por dependencia; 503 sin confirmaciones falsas; falla común de Workers AI degradada a herramientas deterministas y biblioteca | EQ-02, EQ-19–EQ-21, EQ-29, EQ-30 | Adecuada; PostgreSQL es punto único para escrituras críticas (riesgo aceptado) | FAL-01 a FAL-09 |
| Escalabilidad | Escalado horizontal de Workers; colas con backpressure; pooling acotado | EQ-03 | Plausible; límite en conexiones de BD | K6-02 |
| Seguridad | Sesiones SQL revocables; RBAC/ABAC por recurso; RAG con `scope`; BYOK en sobre AES-256-GCM; edad derivada; capas del lienzo | EQ-04, EQ-11, EQ-22, EQ-32, EQ-35, EQ-38, EQ-43, EQ-44 | Adecuada en diseño | SEC, RAG-SEC-01–06, BYK, EDA, GRU |
| Mantenibilidad | Monolito modular de 7 módulos; Clean Architecture; contratos 2.8 sin ciclos; Drizzle como única autoridad de migraciones | EQ-05 | Adecuada | ARQ-01, MIG-01–04 |
| Integridad | Libros SQL de recursos y saldo audiovisual; UNIQUE por operación; outbox/inbox; reserva y compensación | EQ-06, EQ-24, EQ-31, EQ-39, EQ-40, EQ-41 | Adecuada | CON-01–05, CUL-01–05, PUB-01–03, AUD-01–03 |
| Usabilidad | Lienzo principal con conversación plegable; selección por lazo; recursos en lenguaje claro | EQ-07, EQ-18, EQ-23, EQ-34 | Plausible; sin prueba con usuarios | UX-01/02, PIZ-01, UI-09 |
| Interoperabilidad | `PaymentPort` y `CulqiPaymentAdapter`; contratos OpenAPI; adaptadores de IA por alias | EQ-08, EQ-40 | Adecuada en diseño; la API real de Culqi no se ha probado | API-01, CUL-01 |
| Capacidad de prueba | Puertos inyectables; dobles de proveedores; datos sintéticos | EQ-09, EQ-16 | Adecuada | UNI-01–03 |
| Costos | Cotas por plan (infraestructura, sección 9); reserva de recursos en M5; presupuesto técnico en M6; tope duro | EQ-10, EQ-27, EQ-28, EQ-45 | Cotas de diseño con tarifas de referencia; **no medidas** | COS-01–04 |
| Calidad pedagógica | Verificador matemático; citas sobre fragmentos autorizados; modo FUNDAMENTADA/MIXTA/GENERAL; Bloom y práctica de recuperación en evaluaciones | EQ-11, EQ-33, EQ-37 | Depende de benchmarks no ejecutados | BP-01–07, TUT-01–03, EVA-01–03 |

## 3. Árbol de utilidad

Importancia (I) según la prioridad AC; dificultad (D) según la incertidumbre documentada. A = alta, M = media, B = baja. Se conservan las ramas del SDD v1.0 y se añaden las de la instrucción maestra.

| Atributo | Refinamiento | Escenarios | I | D |
|---|---|---|:-:|:-:|
| Integridad | Pagos, recursos y recompensas sin duplicados | EQ-06, EQ-24, EQ-31, EQ-39, EQ-40 | A | A |
| Integridad | Respuestas académicas no se pierden | EQ-15, EQ-20 | A | M |
| Integridad | Pagos directos, comisiones y devoluciones según versión | EQ-13, EQ-25, EQ-41 | A | A |
| Seguridad | Acceso ajeno denegado; dos cuentas; grupos | EQ-04, EQ-22, EQ-44 | A | M |
| Seguridad / pedagogía | RAG privado sin fuga y con revocación | EQ-11, EQ-17, EQ-32 | A | A |
| Seguridad | BYOK, edad y selección mínima en el lienzo | EQ-35, EQ-38, EQ-43 | A | M |
| Disponibilidad | Falla de API, BD o restauración | EQ-19, EQ-20, EQ-21 | A | A |
| Disponibilidad | Redis, correo o Workers AI caídos | EQ-29, EQ-02, EQ-30 | A | M |
| Rendimiento / escalabilidad | Catálogo y carga escalonada | EQ-01, EQ-03 | A | M |
| Costos | Inferencia dentro de la cota por plan | EQ-10, EQ-27, EQ-45 | A | A |
| Audiovisual | Aula 35 + 1 y saldo en participante-minutos | EQ-14, EQ-26, EQ-41 | A | A |
| Pedagogía | Tutor general y complementación; evaluaciones de 15+ preguntas | EQ-33, EQ-37 | A | M |
| Usabilidad | Lienzo en móvil; Studio sin conexión | EQ-07, EQ-18, EQ-23, EQ-34 | A | M |
| Reutilización | Biblioteca antes de generar; retiro | EQ-36 | M | M |
| Privacidad | Retención de 90 días | EQ-42 | A | M |
| Economía | Oferta no viable bloqueada | EQ-28 | M | M |
| Mantenibilidad / prueba | Curso nuevo, motor y plan reproducibles | EQ-05, EQ-09, EQ-16 | M | B |
| Interoperabilidad | Contratos externos | EQ-08 | M | B |
| Experiencia | Publicidad no intrusiva | EQ-12 | M | B |

## 4. Enfoques arquitectónicos de los escenarios A/A

| Escenarios | Enfoque y ADR | Por qué satisface |
|---|---|---|
| EQ-06/24/31/39/40 | Libros SQL con saldo materializado, lock por fila, UNIQUE de operación, outbox/inbox, consulta del estado real del cargo y conciliación (ADR-043, 048, 052, 080, 082, 086) | El doble efecto exige violar un UNIQUE o un CHECK que la base rechaza; ningún webhook ni evento del navegador concede sin verificación |
| EQ-11/17/32 | Conjunto consultable de M2, `scope` en la consulta SQL antes del ranking, revalidación previa al modelo y a la entrega, revocación ≤ 60 s (ADR-026, 065, 076, 090) | Un índice atrasado no concede permiso |
| EQ-13/25/41 | Pagos directos registrados sin custodia; comisión versionada por medio; cierre de periodo con la fórmula de la IM, sección 15.3 (ADR-081, 082) | La devolución se calcula con parámetros versionados y solo figura completada con evidencia |
| EQ-19/20/21 | Degradación por dependencia, RTO/RPO por clase, restauración con *tombstones* (ADR-022, 036, 054) | La corrección no depende de Redis ni de la IA |
| EQ-14/26 | SFU administrado fuera de Hono, credenciales por rol, reserva de capacidad antes de iniciar (ADR-015, 016, 045, 081) | El audio y el video no pasan por la API; la clase en curso no se interrumpe |
| EQ-10/27/45 | Reserva del recurso en M5 antes del costo; presupuesto técnico global y por proveedor en M6; tope duro (ADR-053, 077, 080) | El consumo comercial no supera la matriz aprobada y el técnico queda acotado |

## 5. Atención especial (IM, sección 24)

| Tema | Evaluación resumida | Detalle |
|---|---|---|
| Costos de inferencia | Cotas de diseño por plan (Gratuito 0,267; Estándar 1,430; Plus 2,975; Premium 5,500; Docente Inicial 2,440 USD) con tarifas de referencia no verificadas en esta intervención | [Infraestructura, sección 9](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md); R-11 |
| RAG privado | `scope` y revalidación; un solo espacio BGE-M3 | R-12; RAG-SEC-06 |
| Protección de menores | Edad derivada; sin BYOK ni recompensas; bloqueos de tratamiento real | R-05; EDA |
| BYOK | Sobre AES-256-GCM, sin fallback facturado | T-09; BYK |
| Reutilización de recursos | Biblioteca antes de generar; la popularidad no sustituye revisión | R-13; BIB |
| Publicación derivada de conversaciones | Prohibida sin contenido independiente y autorización (BR-12) | R-14; BIB-02 |
| Selección contextual en la pizarra | Solo objetos y recorte mínimo; capa del usuario intocable | R-15; PIZ-02/03 |
| Publicidad recompensada | Verificación en servidor con *nonce*; concesión única en M5 | R-16; PUB |
| Culqi, comisión mínima, recurrencia y devoluciones | Comisiones por medio con mínima y umbral; recurrencia solo con autorización; devoluciones con evidencia | R-17 a R-19; CUL, AUD |
| Consistencia entre motores | PostgreSQL autoritativo; MongoDB con protocolo PENDING→PUBLISHED; Redis no autoritativo; R2 con referencia SQL | T-02; CON-05, MIG-03 |

## 6. Validación del Sprint 2 (27/11/2026): matriz AC/EQ con resultados reales

Fuente de los escenarios: [08-escenarios-atributos-calidad.md](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md). **Las métricas del Sprint 1 no se modificaron.**

**Entorno de las mediciones:**
- equipo local con Windows 11;
- API en `wrangler dev`: un único proceso `workerd`, no un despliegue en Cloudflare;
- PostgreSQL 17 y MongoDB 8 en Docker; base aislada `mentelyx_carga` con 20 cuentas ficticias;
- proveedor de IA **simulado** en la carga; k6 2.4.0 en el mismo equipo.

Evidencias en [evidencias/](evidencias/README.md).

**Veredictos posibles:**
- Cumple.
- No cumple: medido y fuera de la meta.
- Parcialmente verificado.
- No ejecutado.
- No aplicable: fuera del alcance V1 (ADR-093).

| EQ (AC) | Escenario y métrica objetivo | Condiciones y herramienta | Resultado real | Veredicto | Limitaciones |
|---|---|---|---|---|---|
| EQ-01 (AC-01) | Consulta de contenido: 100 VU durante 10 min; p95 de API ≤ 2 s; 5xx < 1 % | k6 `eq01`: mezcla de 5 lecturas autenticadas (PostgreSQL y MongoDB) y 20 % de simulacros cortos | 2 608 solicitudes (3,98/s); lectura p50 18,6 s, **p95 49,7 s**, p99 58,9 s; **5xx o red 22,1 %**; checks 55,4 % | **No cumple** | Una recarga del Worker a las 00:28 por edición de código; entorno local de un proceso |
| EQ-03 (AC-03) | Escalones de 50, 100 y 200 VU; a 200 VU p95 ≤ 3 s y 5xx < 1 %; registrar el punto de saturación | k6 `eq03` (2 min por escalón) y monitor de recursos | 50 VU: p95 15,7 s, 0,8 % de errores; 100 VU: p95 25,5 s, 5,5 %; **200 VU: p95 55,9 s, 66 %**. Rendimiento estable en 4–6 solicitudes/s | **No cumple** | Dos recargas (00:39 y 00:41). El monitor de esa corrida no registró la CPU del equipo (contadores localizados; corregido después) |
| EQ-15 (AC-01/03/06) | Simulacro con 100 VU: p95 de guardado ≤ 3 s; 5xx < 1 %; 0 respuestas perdidas; 0 intentos de otro estudiante | k6 `eq15` (5 min, 4 preguntas por intento) | 200 intentos calificados; **0 respuestas perdidas**; **0 intentos ajenos**; guardado p95 **25,4 s**; 5xx 4,05 % | **No cumple** (rendimiento) · **cumple** (integridad) | El Worker ya tenía el mapeo 503 de EQ-20 |
| Estrés (EQ-03, exploración) | Progresión de 10 a 2 000 VU con parada si los errores superan el 50 % | k6 `estres` con un Worker recién iniciado | 10 VU: p95 0,82 s, 0 % de errores, 14,9 solicitudes/s; 100 VU: p95 9,1 s, 0 %; **250 VU: 86,6 % de errores**. Parada automática con **869 VU alcanzados** (máximo intentado) | **Saturación entre 100 y 250 VU**; los 2 000 VU no se alcanzaron | Un VU no es un usuario humano; carga y servidor comparten el mismo equipo |
| Diagnóstico de la causa | Aislar el cuello de botella | k6 `diagnostico-k6.js`: 50 VU durante 30 s contra `/salud`, sin bases | **152 solicitudes/s, p95 438 ms, 0 % de errores** sin bases, frente a 4–15 solicitudes/s con bases | El límite está en las **conexiones por petición** a PostgreSQL y MongoDB (registro: «Network connection lost», `MongoServerSelectionError`) | Táctica: *pooling* (Hyperdrive o Neon pooled; reutilizar la conexión de Mongo) |
| EQ-04 (AC-04) | Acceso ajeno o sin sesión: 100 % denegado sin revelar datos | Integración Flujo C (`v1-full-stack.integration.test.ts`): 9 rutas de otra cuenta y 2 sin sesión; Jest `seguridad-sesion.test.ts`; Thunder (6 casos negativos); `flujos-v1-e2e.mjs` | 100 % de los casos: 404 para recursos ajenos y 401 sin sesión; CSRF y Origin, 403 | **Cumple** | Pruebas automatizadas, no una auditoría de penetración |
| EQ-16 (AC-05/09/11) | Plan reproducible: con iguales datos, 100 % igual resultado; la versión anterior se conserva | Integración Flujo B (reintento idempotente y temario); Jest M3 | El mismo resultado ante reintentos; el temario crea una versión 2 y conserva la 1 (REEMPLAZADO) con el avance | **Cumple** | Sin motor de diagnóstico (no hay recomendaciones) |
| EQ-37 (AC-06/09/11) | Calificación reproducible con la misma versión; soluciones ocultas en evaluación; generación rápida de al menos 15 preguntas | Jest M3 e integración Flujo B | Nota oficial idéntica en entregas concurrentes; 0 soluciones antes de entregar | **Parcialmente verificado** | Generación rápida por IA (RF-104) no implementada |
| EQ-32 (AC-04/11) | 0 fragmentos de A en respuestas a B; revocación inmediata | Integración (fuente PDF y espacio ajeno, 404) | B no puede consultar con la fuente de A (404) | **Parcialmente verificado** | Revocación durante una consulta no probada; proveedor doble |
| EQ-11 / EQ-33 (AC-11) | RAG autorizado; complemento general | Una inferencia real con NVIDIA (`tutor-real-e2e.mjs`) | FUNDAMENTADA con 1 cita de la fuente propia | **Parcialmente verificado** | Una sola llamada real; conjunto adversarial no ejecutado |
| EQ-42 (AC-04/06) | Aviso a los 83 días; inaccesible a los 90 | Índice TTL `retencion_ttl` (Mongo local y Atlas) y filtro `expiraEn` en cada lectura | Retención de 90 días aplicada por TTL y por consulta | **Parcialmente verificado** | El aviso a los 83 días no está implementado |
| EQ-45 (AC-10) | Costo medido por operación frente a la cota de la IM 18.1 | `ai_usage_records` | NVIDIA no publica tarifa por token: el costo registrado es 0 USD | **No ejecutado** | Sin tarifa no se puede comparar |
| EQ-24 / EQ-31 (AC-06/10) | Movimientos de saldo sin duplicados; conciliación | Suite P0 de M5 (12/12, concurrentes, PostgreSQL real); Jest M5 | Una reserva por clave; saldo = libro; 0 periodos superpuestos (23P01) | **Parcialmente verificado** | Pagos y Live fuera de V1 |
| EQ-29 (AC-02/06) | Fallo de Redis: los controles siguen | Integración MVP (respaldo SQL del límite de tasa) | El límite de tasa usa SQL sin Redis | **Parcialmente verificado** | No hay caché de datos en Redis (no implementada) |
| EQ-30 (AC-02/10) | Cuota agotada: rechazo sin cargo | Integración MVP (`CUOTA_AGOTADA` sin invocar al proveedor) | 429 sin llamada al proveedor | **Parcialmente verificado** | Studio fuera de V1 |
| EQ-20 (AC-02/06) | Base caída: 503 controlado, sin confirmaciones falsas | Observado en la carga (MongoDB y PostgreSQL sin conexión); corrección con Jest `disponibilidad.test.ts` | Medido: se respondía **500** (no cumplía). Corregido el mismo día: **503 `SERVICIO_NO_DISPONIBLE`** con `Retry-After` (5/5 pruebas). No se confirmó ningún dato falso | **Parcialmente verificado** (corregido; la carga no se repitió para medirlo) | Falta repetir la carga |
| EQ-21 (AC-02/06) | Respaldo y restauración | `pg_dump` y `mongodump` verificados por conteo (registro, sección 24) | Respaldo creado y verificado | **Parcialmente verificado** | Restauración no ensayada |
| EQ-07 / EQ-18 (AC-07) | Uso móvil | Recorridos de interfaz a 390 px de las fases 7 a 10B (anteriores) | 0 desbordes; axe 0 violaciones en las vistas auditadas | **Parcialmente verificado** | No se repitió con las pantallas nuevas del Sprint 2 |
| EQ-08 (AC-08) | Contrato externo | Prueba de contrato OpenAPI (rutas = documentación) | 56 operaciones documentadas y probadas por el contrato | **Parcialmente verificado** | Integraciones externas (pasarela) fuera de V1 |
| EQ-02, 05, 06, 09, 10, 12, 13, 14, 17, 19, 22, 23, 25–28, 34–36, 38–41, 43, 44 | Notificaciones, catálogo de cursos, pagos, recomendaciones, publicidad, comisiones, video, Studio, lienzo, biblioteca, BYOK, recompensas, Culqi, grupos y caída del Worker | — | — | **No aplicable** (ADR-093) o **No ejecutado** (EQ-19, caída de Worker) | Diseño objetivo conservado |

**Hallazgos que la validación deja abiertos (táctica sin implementar):**
1. ***Pooling* de conexiones.** Con varias decenas de VU, las conexiones por petición a PostgreSQL y MongoDB saturan el entorno local. Tácticas: Hyperdrive y Neon pooled en el despliegue; reutilizar la conexión de Mongo o usar un intermediario.
2. **Errores de dependencia:** ya mapeados a 503 (EQ-20); falta medirlo bajo carga.
3. **EQ-45.** Necesita la tarifa del proveedor.
