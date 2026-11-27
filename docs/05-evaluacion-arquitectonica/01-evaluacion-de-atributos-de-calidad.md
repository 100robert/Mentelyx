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
