# Registro de decisiones y solicitudes de cambio — IA, motor visual y contratos

> **Proyecto:** Mentelyx · **Ubicación:** `docs/03-diseño-de-software/diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md`
> **Elaborado por:** Claude Code (responsable de IA/RAG, motor visual y contratos/UI según `mentelyx-ai-setup-README.md`)
> **Destinatario:** Codex (responsable de persistencia, seguridad e infraestructura) para integrarlo en el SDD final
> **Estado vigente (20/11/2026):** las secciones anteriores a la última son **registro histórico**; sus pendientes y propuestas quedan resueltos o sustituidos por la sección «Resolución por la instrucción maestra» al final de este documento.
> **Versión:** 1.1 — 17/11/2026 · **Estado:** propuestas resueltas por Codex ([ADR, sección 8](../../01-analisis-de-sistema/07-decisiones-arquitectonicas.md); [contrato de coordinación](../contrato-coordinacion-datos-seguridad-infraestructura.md)) e integradas por Claude Code (sección 8 de este registro). Ninguna decisión está implementada, contratada ni validada experimentalmente.
> **Cambios 1.1:** las secciones 1 a 7 se conservan como registro original de la v1.0, salvo PEND-01. La sección 8 nueva consolida las resoluciones, la sincronización CO-01–CO-10, las discrepancias resueltas y los pendientes.

## 1. Entregables de esta tarea

| Archivo | Tipo | Contenido |
|---|---|---|
| `diseño-externo/02-diseño-de-api-y-contratos.md` | Completado (v1.0 → v2.0) | Convenciones, endpoints nuevos por módulo, contratos internos (sección 2.8), colas nuevas, DTO, SSE, trabajos, errores, autorización y pruebas. Se conservan todos los contratos de la v1.0. Cambios: el método del endpoint de permisos pasa a `PATCH` y `generar-ia` exige cotización. |
| `diseño-externo/03-diseño-de-interfaces-y-flujos.md` | Completado (v1.0 → v2.0) | Rutas de habilitación separadas, rutas nuevas, recorridos E1–E10, D1–D7 y A1–A7, chat y pizarra, Studio, estados, accesibilidad y criterios de UI. Se conservan las secciones 1–4. |
| `diseño-especializado/01-tutor-ia-multiproveedor-y-orquestacion.md` | Nuevo | Proveedores verificados, privacidad D0–D3, clasificación, enrutamiento, herramientas, cuotas, costos, verificación, cancelación y ejemplos |
| `diseño-especializado/02-diseño-rag.md` | Nuevo | Ingestión, extracción, fragmentación, embeddings, recuperación híbrida autorizada, citas, revocación y reindexación |
| `diseño-especializado/03-motor-visual-y-pizarra.md` | Nuevo | Primitivas (incluye circuitos), JSON Schema, algoritmos, validación, animaciones, reproductor, sincronización, pizarra manual y ejemplos |
| `diseño-especializado/04-visualizaciones-3d.md` | Nuevo | Simulaciones verificables frente a objetos ilustrativos generados |
| `diseño-especializado/05-generacion-de-materiales-educativos.md` | Nuevo | Contenido, plantillas, renderizado PDF/PPTX, almacenamiento y descarga |
| `diseño-especializado/06-calidad-ia-criterios-y-pruebas.md` | Nuevo | Criterios y pruebas pedagógicas, matemáticas, visuales, funcionales, de seguridad, costo y latencia; catálogo de ejemplos EJ-01 a EJ-18 |
| Este documento | Nuevo | Decisiones, solicitudes de cambio, pendientes de auditoría y guía de integración |

**No se modificaron:** `01-diseño-de-persistencia-y-datos.md` (responsabilidad de Codex), los documentos de análisis (`01-analisis-de-sistema/`), las ADR vigentes, el diseño interno, C4, las imágenes ni el README.

## 2. Decisiones propuestas (ADR-056 a ADR-072)

Para que Codex las incorpore a `07-decisiones-arquitectonicas.md` como una sección nueva. ADR-001 a ADR-055 no se alteran.

> **Resolución vigente:** [ADR, sección 8](../../01-analisis-de-sistema/07-decisiones-arquitectonicas.md). La tabla siguiente conserva la propuesta original y su columna de estado no se actualiza; el resumen está en la sección 8.1 de este registro.

| ID | Decisión | Alternativas descartadas | Justificación | Estado y condición |
|---|---|---|---|---|
| ADR-056 | El orquestador M6 enruta por **alias lógicos** configurables y versionados. Los proveedores externos se alcanzan por **Cloudflare AI Gateway** y los modelos alojados por **Workers AI** | Acoplar el código a identificadores de modelo; un proveedor único | Modelos y precios cambian (p. ej., `deepseek-v4-pro-0813` tiene deprecación prevista el 20/11/2026); AI Gateway documenta analítica de costo, registro, caché, limitación y *fallbacks* | Propuesta; prototipo PEND-05 |
| ADR-057 | Clasificación de datos D0–D3 por solicitud. **DeepSeek se ofrece a usuarios vía Workers AI (ZDR)**; la API directa de DeepSeek solo para D0 editorial. Menores: `SOLO_ZDR` por defecto | Usar la API directa de DeepSeek para todos | La política de DeepSeek declara almacenamiento en la República Popular China, uso para entrenamiento con exclusión y «not aimed at children»; Workers AI declara no entrenar ni retener | Propuesta; revisión legal PEND-02 |
| ADR-058 | Modos de fuentes **FUNDAMENTADA** (citas) y **GENERAL** (etiquetada, sin `recursoId`). Con `recursoId` y sin fragmentos se mantiene `SIN_CONTEXTO` sin inferencia | Responder solo con fuentes del curso en todos los casos | Las preguntas generales de matemática no requieren corpus; RF-42 se respeta: nunca se recuperan fuentes no autorizadas y la respuesta general se etiqueta | **Requiere aprobación del responsable de producto** |
| ADR-059 | Motor matemático: parser propio de gramática restringida + math.js con funciones peligrosas deshabilitadas (fase 1). SymPy en un Python Worker por *service binding* (fase 2) | `eval`/`parse_expr`; Cloud Run como primera opción | Seguridad (sin código del modelo); SymPy está incluido en Pyodide; el Worker es un adaptador sin reglas de negocio | Fase 2 condicionada a la prueba de arranque en frío; alternativa Cloud Run |
| ADR-060 | **Verificación obligatoria** de las afirmaciones matemáticas (`mentelyx.solucion/v1`) antes de presentar resultados; los pasos no verificados se etiquetan | Confiar en el modelo | AC-11; un resultado incorrecto presentado como cierto es el mayor riesgo pedagógico | Propuesta |
| ADR-061 | Motor visual determinista en el paquete compartido `packages/motor-visual`: escena **declarativa** (IA o usuario) frente a escena **resuelta** (compilador). La IA no escribe coordenadas derivadas ni números calculados | tldraw (licencia de producción de pago); Excalidraw como base (MIT, queda como alternativa para el lápiz); gráficos generados por imagen | Exactitud verificable, reutilización en Tutor, Studio y exportación, sin dependencia de licencia | Propuesta; prototipo PEND-VIS-01/02 |
| ADR-062 | Esquemas versionados e inmutables: `mentelyx.escena/v1`, `escena-resuelta/v1`, `escena3d/v1`, `solucion/v1`, `documento/v1`, `rutas-ia/v1` | Formatos libres | Validación previa, compatibilidad entre cliente y servidor, migraciones explícitas | Propuesta |
| ADR-063 | 3D en dos clases: **simulación verificable** (plantillas deterministas, three.js) y **objeto ilustrativo** (Stability Stable Fast 3D; Meshy como alternativa), este último solo en Studio y para adultos | Generar modelos científicos con IA | No se puede afirmar exactitud científica de objetos generados | Propuesta; cotización Meshy PEND-04 |
| ADR-064 | Embeddings `gemini-embedding-2` a 1536 dimensiones; la alternativa compatible es `text-embedding-3-small` | `bge-m3` (1024) por defecto | Mantiene el contrato `vector(1536)` de Codex; el modelo declara más de 100 idiomas. Las consultas de menores bajo `SOLO_ZDR` usan el modo léxico | Propuesta; BP-07 decide sobre SC-15 |
| ADR-065 | RAG híbrido: pgvector + texto completo `spanish` con fusión RRF (k = 60), MMR, *chunker* estructural v1, conjunto consultable autorizado por M2 y revocación efectiva ≤ 60 s | Solo vectorial; filtrado posterior en la aplicación | Recall en español con términos exactos y garantía de autorización en SQL | Propuesta; PEND-RAG-01 |
| ADR-066 | Materiales en cinco capas; PDF con Cloudflare Browser Rendering `/pdf`; PPTX editable con PptxGenJS en un Worker o, si no es compatible, un trabajo de Cloud Run | Generar archivos con LLM; HTML a PPTX no editable | Determinismo, edición real en PowerPoint y desacople de plantillas | Propuesta; PEND-MAT-01 |
| ADR-067 | Cuotas del Tutor en **UTI ponderadas por ruta**, admisión atómica en PostgreSQL de M6 (candado consultivo + `ON CONFLICT`) y presupuestos globales 70/90/100 % con degradación | Contadores Redis; cobro por token visible al usuario | Redis no es autoritativo (ADR-012, RF-94); unidades comprensibles para el usuario con el costo acotado por operación | Propuesta; pesos y cifras a calibrar (ADR-050/053) |
| ADR-068 | `Idempotency-Key` obligatoria en el Tutor, recuperación por `GET /consultas/{operationKey}` y cancelación **explícita**. Una desconexión no cancela | Reintentos libres; cancelar al desconectar | Evita doble costo y pérdidas en redes móviles; resuelve el pendiente de la sección 8.5.5 del diseño interno | Propuesta |
| ADR-069 | Retención de conversaciones: 30 días (adultos) y 14 (menores) desde la última actividad, índice TTL, borrado inmediato a petición, registros sin contenido | Historial permanente; sin historial | Requisito de no conservar indefinidamente y minimización de datos (RC-18) | **Requiere revisión legal** (PEND-02) |
| ADR-070 | Habilitación en tres contratos separados bajo `/api/v1/habilitacion` y tres colas administrativas | `/docentes/acreditaciones` única | RF-18, RF-58, RF-59 y el pendiente 1 del informe de auditoría terminológica | Propuesta; exige SC-09 |
| ADR-071 | Imágenes ilustrativas: `flux-2-klein-9b` (Workers AI) estándar y `gemini-nano-banana-2.1` premium; desactivadas para menores; nunca sustituyen gráficos científicos | `gpt-image-2` como estándar | Costo verificado y datos dentro de Cloudflare en el nivel estándar | Propuesta; BP-06 |
| ADR-072 | Explicaciones: `claude-haiku-5-5` (estándar) y `claude-sonnet-5-5` (avanzada) para adultos; `gemma-4-26b-a4b-it` (Workers AI) como ruta ZDR; Gemini 3.8 Flash como respaldo | Un único modelo de frontera para todo | Costo por operación (EJ-07), privacidad por clase de dato | Propuesta; BP-03 |

## 3. Solicitudes de cambio a otros responsables

> **Resolución vigente:** [contrato de coordinación, secciones 2 y 3](../contrato-coordinacion-datos-seguridad-infraestructura.md). Las tablas siguientes conservan las solicitudes originales.

### 3.1. Persistencia (Codex) — no se editó `01-diseño-de-persistencia-y-datos.md`

| ID | Módulo / almacén | Cambio solicitado | Justificación | Detalle |
|---|---|---|---|---|
| SC-01 | M6 · PostgreSQL `rag_document_chunks` | Columnas `scope`, `owner_id`, `course_id`, `level`, `estado`, `vigente`, `texto`, `ancla`, `titulo`, `tokens`, `content_hash`, `chunker_version`, `embedding_model`, `idioma`, `senal_inyeccion` y `tsv` generada; `CHECK privado_con_propietario`; índices de filtro y GIN | Precisa los «metadatos de acceso ACL» ya previstos. Se mantienen `vector(1536)`, HNSW y el `UNIQUE` existente | `02-diseño-rag.md` sección 9 |
| SC-02 | M6 · PostgreSQL | Tabla nueva `rag_index_documents` (estado por documento, versión y modelo) | Máquina de estados de indexación, revocación y auditoría | Ídem |
| SC-03 | M6 · PostgreSQL `ai_usage_records` | Columnas `status`, `route_id`, `intent`, `data_class`, `product_code`, `policy_version`, `reserved_units`, `units_consumed`, `reserved_budget_usd`, `actual_cost_usd`, `pending_reconciliation`, `first_token_at`, `finished_at`; índice `(user_id, billing_period, product_code, status)` | Admisión atómica, cancelación y conciliación (ADR-067, ADR-068) | `01-…orquestacion.md` sección 10.3 |
| SC-04 | M6 · MongoDB | Colección `tutor_conversaciones` con índice TTL sobre `expiraEn`; mensajes, escenas y citas | Retención definida (ADR-069) | `01-…orquestacion.md` sección 10.7 |
| SC-05 | M2 · MongoDB | `studio_projects`: bloques `visual_scene` (`mentelyx.escena/v1`) y `scene3d`, y formato `DOCUMENTO_EDUCATIVO` (`mentelyx.documento/v1`). Colección nueva `plantillas_documento` | Motor visual y materiales | `03-…pizarra.md` sección 6; `05-…materiales.md` secciones 3 y 5 |
| SC-06 | M2 · PostgreSQL | Tabla nueva `render_jobs` | Idempotencia por `input_hash` y trazabilidad de exportaciones | `05-…materiales.md` sección 7 |
| SC-07 | M5 · PostgreSQL `credit_ledger_entries` | Valor nuevo `reason = STUDIO_AI_REFUND` | RF-85, reintegro idempotente (`refund:{operationKey}`) | `05-…materiales.md` EJ-11 |
| SC-08 | M5 · PostgreSQL `commercial_plan_versions` | Campo estructurado `ai_policy` (JSONB u otra forma que Codex prefiera tras comparar) | Cuotas, funciones y presupuestos de IA versionados por producto | `01-…orquestacion.md` sección 10.2 |
| SC-09 | M4 · PostgreSQL `teaching_accreditations` / `teacher_profiles` | `request_type` ∈ {`VERIFICACION_DOCUMENTAL`, `CREDENCIAL_ACADEMICA`, `HABILITACION_TUTORIA`} y estados separados; separar `verification_status` en un estado documental y uno académico; eliminación de documentos 90 días después de la decisión | ADR-070, RF-18, RF-58, RF-59 | API secciones 2.4 y 4.5 |
| SC-10 | M6 · PostgreSQL | Tabla `ai_rate_cards` (proveedor, modelo, unidad, precio, vigencia, URL de la fuente, fecha de verificación) | Estimación y atribución de costos (ADR-053) | `01-…orquestacion.md` secciones 10.4 y 16 |
| SC-11 | M6 · PostgreSQL | Tabla `ai_budgets` (ámbito, periodo, límite, umbrales, tope duro) | RF-44, EQ-10 | `01-…orquestacion.md` sección 10.5 |
| SC-12 | M6 · PostgreSQL | Tabla `ai_quality_reports` (operación, categoría, comentario redactado, estado, retención de 12 meses) | Calidad pedagógica (AC-11) | `06-…pruebas.md` sección 3.2 |
| SC-13 | Redis | Claves no autoritativas: `rl:ai:{userId}:{ruta}`, `cb:ai:{ruta}`, `cache:m6:emb:q:{sha256}` (10 min) y `ai:budget:{ambito}:{aaaamm}` | Limitación de tasa, circuitos y caché; la decisión de cuota sigue en SQL | `01-…orquestacion.md` sección 10.5 |
| SC-14 | R2 | Prefijos `tutor/adjuntos/`, `rag/extract/`, `studio/ai/`, `studio/3d/` y `materiales/`, y un **espacio privado separado** para `habilitacion/` (datos D3) | Separación de permisos y retenciones | Varios |
| SC-15 | M6 · PostgreSQL (**condicional**) | Cambiar `vector(1536)` → `vector(1024)` para adoptar `@cf/baai/bge-m3` (ZDR) para todos | Solo si BP-07 muestra una diferencia de Recall@8 ≤ 3 puntos frente al mejor | `02-diseño-rag.md` sección 15 |
| SC-16 | M2 · PostgreSQL | Tabla `studio_ai_jobs` (trabajo de generación, cotización, `operation_key` única, estado, imputabilidad de la falla) | Trabajos asíncronos de Studio (API sección 6) | API sección 4.4 |
| SC-17 | M5 · PostgreSQL | Tabla `studio_ai_quotes` (créditos, `policy_version`, expiración de 10 min, estado) | El precio confirmado debe ser el cotizado | API secciones 2.2 y 4.4 |

### 3.2. Seguridad (Codex)

| ID | Solicitud |
|---|---|
| SEG-01 | Modelo de amenazas específico de IA: inyección directa e indirecta, exfiltración por herramientas, abuso de costo, fuga entre ámbitos RAG y contenido inseguro para menores. Contrastarlo con los controles de `01-…orquestacion.md` secciones 11–13 |
| SEG-02 | Configuración de AI Gateway sin registro de contenido para D1/D2 (o dos *gateways* separadas) y gestión de claves de proveedores como secretos |
| SEG-03 | Revisión de la redacción de datos personales (sección 4.3 del orquestador) y de las pruebas PII-01/PII-02 |
| SEG-04 | Validación de la eliminación efectiva: conversaciones (TTL), apuntes, índices revocados y documentos de habilitación |

### 3.3. Infraestructura (Codex)

| ID | Solicitud |
|---|---|
| INF-01 | Colas nuevas `mentelyx-studio-ai-resultados`, `mentelyx-renders` y `mentelyx-mantenimiento` con sus DLQ; *Cron Triggers* de purga |
| INF-02 | Python Worker de SymPy con *service binding* (fase 2) y medición de su arranque en frío |
| INF-03 | Habilitar Browser Rendering y medir las horas de navegador por exportación |
| INF-04 | Trabajo de Cloud Run de respaldo para PPTX si PptxGenJS no funciona en Workers |
| INF-05 | Plan Workers Paid (requisito documentado para los modelos DeepSeek V4 en Workers AI) e incluir su costo en el presupuesto |
| INF-06 | Confirmar la versión de pgvector en Neon (búsqueda iterativa con filtros) |

## 4. Pendientes del informe de auditoría terminológica

| Pendiente original | Resolución |
|---|---|
| 1. `/api/v1/docentes/acreditaciones` mezcla procesos | **Resuelto en el contrato** (API sección 2.4, ADR-070); la ruta queda «no se implementa». Falta SC-09 en persistencia |
| 2. `CredentialVerificationPort` no precisa la evidencia | Por contrato, la validación de credenciales académicas es `SolicitarValidacionCredencialUseCase` (solo `NIVEL_ACADEMICO`) y la verificación documental es un proceso aparte. **Integración:** renombrar el puerto en `principios-de-diseño.md` a `ValidacionCredencialAcademicaPort` y añadir `VerificacionDocumentalPort` |
| 3a. M1: `PATCH` en la secuencia y `POST` en el catálogo | **Resuelto:** `PATCH` en el catálogo (API sección 2.1) |
| 3b. M6: `/api/v1/tutor/consultas` en la fuente gráfica | **Pendiente gráfico:** actualizar `m6-secuencia.drawio`/SVG/PNG a `/api/v1/tutor-ia/consultas` |
| 3c. Pies de figura de las secuencias M2 y M7 | Pendiente fuera de este alcance (corresponde a quien mantenga el diseño interno) |
| 4. Imágenes C4 de nivel 4 ausentes | Las imágenes existen ahora sin seguimiento en Git (`docs/img/nivel4-*.png`). El texto cita `img/fuentes/nivel4-*.drawio`, pero las fuentes están en `img/fuente_drawio/`: **corregir la ruta textual** |
| Enlace del README a `docs/auditoria-terminologica.md` | El archivo se eliminó en `3e136b2`. **Integración:** restaurarlo o retirar el enlace |

## 5. Guía de integración en el SDD final

1. **README sección 8.3:** añadir una tabla para `diseño-especializado/` con los siete archivos y su estado («Diseño propuesto»).
2. **`07-decisiones-arquitectonicas.md`:** añadir la sección «Decisiones de IA, motor visual y contratos (ADR-056 a ADR-072)» con la tabla de la sección 2. Mantener su estado como «Propuesta» hasta cerrar las condiciones.
3. **`01-diseño-de-persistencia-y-datos.md`:** evaluar e integrar las SC-01 a SC-17 (y SC-15 solo tras BP-07), registrando las aceptadas, rechazadas o modificadas.
4. **`diseño-interno-de-modulos.md` sección 8:**
   - incorporar la ampliación del inventario de M6 (`01-…orquestacion.md` sección 6);
   - marcar como resueltos los pendientes de la sección 8.1.2 (DTO, códigos de error e idempotencia HTTP);
   - añadir a sección 10.1 los contratos nuevos de la API sección 2.8.
5. **C4 niveles 1 y 2:** concretar los sistemas externos de IA (Workers AI, AI Gateway, Anthropic, Google Gemini API, Stability AI; opcionales OpenAI y Meshy) y Browser Rendering, sin presentarlos como contratados.
6. **`08-escenarios-atributos-calidad.md`:** enlazar EQ-10, EQ-11, EQ-23, EQ-27 y EQ-30 con las pruebas de `06-calidad-ia-criterios-y-pruebas.md`. No se crean EQ nuevos.
7. **Requisitos:** no se crean RF nuevos. Se precisan RF-42 (modos de fuentes, ADR-058) y RF-62/RC-18 (retención, ADR-069). Si el responsable de producto lo prefiere, puede formalizarlos como reglas de negocio.

## 6. Cuestiones bloqueantes antes de implementar

| ID | Cuestión | Bloquea |
|---|---|---|
| PEND-01 | **Cerrado como selección documental** (CO-07): `deepseek-v4.1-flash-1017` con esfuerzo `high` sustituye a `deepseek-v4-pro-0813`, retirado el 20/11/2026. No está validado experimentalmente | BP-01 bloquea la activación de `razonamiento.profundo` |
| PEND-02 | Validación legal de las retenciones, la transferencia internacional (Ley N.° 29733 y su reglamento) y los contratos de tratamiento con proveedores | Uso de rutas externas para menores; ADR-069 |
| PEND-05 | Compatibilidad en Workers: PptxGenJS, validadores sin generación de código y desactivación de registros de AI Gateway por solicitud | ADR-061, ADR-066, R-GW-2 |
| ADR-058 | Aprobación de producto del modo `GENERAL` | Respuestas sin fuentes del curso |
| Calibración | Pesos de UTI, cuotas por plan, créditos Studio por operación y presupuestos globales | Activación comercial (ADR-050/053) |
| BP-01 a BP-07 | Ejecución de benchmarks con presupuesto aprobado | Activación de cada ruta en producción |

## 7. Verificaciones ejecutadas en esta tarea

| Verificación | Resultado |
|---|---|
| Consulta de fuentes oficiales de proveedores (17/11/2026) | Precios, modelos, capacidades y términos de datos citados con su URL en `01-…orquestacion.md` sección 19. Las cifras de benchmarks públicos de terceros **no** se adoptaron |
| Cálculo numérico de los ejemplos (Python) | Proyectil: alcance 40,774720 m, tiempo 2,883208 s, altura 10,193680 m. Volumen de la malla 25,056874 frente a 8π (0,302 %). Circuito EJ-18 resuelto por análisis nodal: V(n2) = 6 V; 3/1/2 A; 36 W balanceados |
| Revisión manual de cálculos de ejemplos | EJ-01, EJ-03, EJ-05, EJ-06, EJ-07, EJ-12, EJ-17 revisados y corregidos donde hubo errores (EJ-01: rasgo matemático 0,55; EJ-05: tamaño de un bloque) |
| Término normalizado por la auditoría (`identi(dad\|ty)`) y términos retirados («Docente verificado», «tres cuentas públicas») | 0 coincidencias en los archivos nuevos y modificados |
| Sintaxis de los bloques JSON | 17 bloques nuevos analizados con `json.loads`: todos válidos. El único bloque inválido es el ejemplo original de la v1.0 de la API, con comentarios `//` y `{ ... }` intencionales, que no se modificó |
| Validación de EJ-03, EJ-17 y EJ-18 contra el JSON Schema | **No ejecutada automáticamente:** el paquete `jsonschema` no está instalado y no se instalaron herramientas. Se hizo una revisión estructural manual. Queda como prueba VIS-01 al implementar |
| Alcance | `git diff` confirma que no cambiaron la persistencia, el análisis, la arquitectura ni el README. `git diff --check` no reporta espacios sobrantes |
| Pruebas de software | **No ejecutadas:** no existe implementación. Todos los criterios de `06-…pruebas.md` están pendientes |

**Siguiente tarea recomendada (v1.0, ya cumplida en su primera parte):** revisión cruzada de Codex de las SC-01 a SC-17 frente a `01-diseño-de-persistencia-y-datos.md` y de SEG-01 a SEG-04. Después, el prototipo técnico PEND-05 (una sola rebanada: consulta del Tutor con SSE, admisión de cuota y escena EJ-03). La siguiente tarea vigente está en la sección 8.6.

## 8. Resolución recibida e integración (v1.1, 17/11/2026)

### 8.1. Resolución de Codex

| Grupo | Resultado | Fuente |
|---|---|---|
| SC-01–SC-17 | 5 aceptadas (SC-05, 07, 08, 10 y 14), 11 modificadas y 1 diferida (SC-15, hasta BP-07) | Contrato de coordinación, sección 2 |
| SEG-01–SEG-04 | SEG-01 aceptada; SEG-02, 03 y 04 modificadas | Contrato de coordinación, sección 3 |
| INF-01–INF-06 | INF-02, 03 y 04 aceptadas condicionadas; INF-01, 05 y 06 modificadas | Contrato de coordinación, sección 3 |
| ADR-056–ADR-072 | Adoptadas: 060, 062 y 070. Adoptadas con modificación: 056, 064, 065, 066, 067 y 068. Adoptadas con activación o proveedores condicionados: 057, 059, 061 y 063. Diferidas: 058 (producto) y 069 (política legal; se adopta el mecanismo). Condicionadas, no activadas: 071 y 072 | ADR, sección 8 |

Claude Code acepta estas resoluciones sin reabrirlas. Ninguna modificación de Codex contradice un requisito HU/RF/AC/RC/DA/EQ.

### 8.2. Sincronización CO-01 a CO-10

| CO | Archivos y secciones actualizados | Estado |
|---|---|---|
| CO-01 | RAG 1.1, secciones 4.2, 9 (nota normativa e índice HNSW parcial), 10.2, 13.1 y 13.3 | Aplicado |
| CO-02 | Materiales 1.1, secciones 3, 6.1, 6.2, 7, 8 y EJ-10; API 2.1, secciones 3.1 y 4.4; prueba API-15 | Aplicado |
| CO-03 | Orquestador 1.1, secciones 10.3 (nota normativa) y 10.5 (tope duro); pruebas API-09 y API-17 | Aplicado |
| CO-04 | Orquestador 1.1, secciones 7 y 13.5; API 2.1, sección 3.1 (cola `mentelyx-tutor-execution`) y sección 5.3; pruebas API-05 y API-16 | Aplicado; el contrato público del SSE no cambia |
| CO-05 | RAG 1.1, secciones 10.1 y 10.4; orquestador 1.1, sección 12.2 y EJ-01; API 2.1, sección 4.3; prueba API-18 | Aplicado |
| CO-06 | Orquestador 1.1, sección 10.7; interfaces 2.1, secciones 8.4, 11 y UI-05; prueba API-14 | Aplicado |
| CO-07 | Orquestador 1.1, secciones 5.2, 5.11, 9.1, 16, EJ-07, 18 y 19; PEND-01 de este registro | Aplicado como selección documental; no validado |
| CO-08 | Diseño interno 3.2, secciones 8.1.2 y 8.5.5 (notas) y 10.1 (contratos nuevos de la API, sección 2.8) | Aplicado; el código de referencia no cambia |
| CO-09 | Puerto `CredentialVerificationPort` de principios de diseño, ruta de `m6-secuencia.drawio` y pies de figura M2/M7 | **Resuelto (cierre de datos, 17/11/2026):** `HabilitacionDocentePort` como puerto de entrada de M1, sin ciclo M1↔M4; fuentes draw.io y SVG de M2, M6 y SOLID M1 corregidas; pies M2-S y M7-S según el contenido real. Pendiente solo reexportar los PNG desde sus fuentes |
| CO-10 | Orquestador 1.1, secciones 4.2 (R-PRIV-3) y 13.1; prueba API-06 | Aplicado |

### 8.3. Discrepancias encontradas y resueltas durante la sincronización

| ID | Discrepancia | Resolución |
|---|---|---|
| DS-01 | Con CO-07, `razonamiento.rapido` tenía como respaldo `razonamiento.profundo`, que usa el mismo modelo | Respaldo `explicacion.avanzada` solo para D0/D1 de adultos; en los demás casos, `PROVEEDOR_NO_DISPONIBLE`. Pasar de rápido a profundo es solo un escalamiento de esfuerzo (orquestador, secciones 5.11 y 16) |
| DS-02 | Ruta profunda desactivada sin regla de degradación | Filtro 5 del orquestador, sección 9.1 |
| DS-03 | La consulta híbrida usaba un CTE referenciado dos veces, que PostgreSQL materializa, y podía impedir el uso de HNSW | Filtro repetido en cada rama y KNN interno `ORDER BY … LIMIT` (RAG, sección 10.2). Falta confirmarlo con EXPLAIN |
| DS-04 | El estado `PURGADO` lo usaba RAG pero faltaba en `rag_index_documents` | Añadido en persistencia, sección 7.6 |
| DS-05 | La clave R2 del GLB usaba `operationKey`, frente al prefijo `studio/3d/{owner}/{asset}/` | Alineada (3D, sección 8.2, paso 6) |
| DS-06 | Faltaba el código de error para M2 caído en la recuperación RAG | `503 SERVICIO_NO_DISPONIBLE` del catálogo (API, sección 7) |
| DS-07 | `mentelyx-renders` deduplicaba por `input_hash`, lo que permitía la reutilización global | `render:{renderJobId}` y reutilización limitada a propietario y proyecto (API, sección 3.1) |
| DS-08 | La clave de purga era solo por fecha y faltaba la DLQ de mantenimiento en la API | `purga:{tipo}:{fecha}:{cursor}` y `mentelyx-mantenimiento-dlq` (INF-01) |
| DS-09 | El diseño interno generaba la `operationKey` solo en el servidor | Nota: la clave normativa es `tutor:{actorId}:{Idempotency-Key}` |
| DS-10 | C4 nivel 4 citaba `img/fuentes/`, que no existe; el README declaraba el proyecto listo para desarrollo y enlazaba un archivo retirado | Rutas cambiadas a `img/fuente_drawio/`; estado e índice del README corregidos |

### 8.4. Compatibilidad de contratos (revisión documental, no ejecutada)

| Aspecto | Evidencia | Resultado |
|---|---|---|
| Admisión, reserva, confirmación y liberación de cuotas | Tutor: persistencia 7.6 y orquestador 10.3 (admisión local de M6 con presupuesto global y por proveedor). Studio: persistencia 7.5 y API 2.8 (cotizar, consumir y reembolsar). Live: persistencia 10.1 y API 2.8 (reservar, confirmar y revertir) | Compatible. Una operación `INCIERTA` conserva su reserva; un HOLD vencido no libera el cupo con débito incierto |
| Conversaciones y acciones de pizarra | `revision` y segmentos en Mongo (persistencia 8.1); pizarra con `If-Match` y `412` sobre `content_versions` con UNIQUE (motor visual 13.2); una escena guardada desde el Tutor crea una versión M2 | Compatible |
| Retención y eliminación | CO-06; persistencia 8.2 y 11; seguridad 6 | Compatible en diseño; política legal pendiente |
| Versionado de fuentes, contenidos y embeddings | `content_versions` inmutables con hash; generaciones RAG por modelo y *chunker*; `mentelyx.rutas-ia/v1`; esquemas `mentelyx.*/v1` | Compatible |
| Permisos de recuperación RAG | Conjunto consultable de M2 (API 2.8), filtro SQL y revalidación (RAG 10; seguridad 4) | Compatible |
| Procesamiento asíncrono de imágenes, PDF, PPTX y 3D | `studio_ai_jobs` y `render_jobs` (persistencia 7.2), colas (infraestructura 4; API 3.1), `202` durable (API 6). Adjunto del Tutor: 8 MB en la API, dentro del máximo de 10 MiB de almacenamiento | Compatible; PEND-05 y PEND-MAT-01 pendientes |
| Cancelación y desconexión SSE | CO-04; API 5.3; infraestructura 4 | Compatible; PR-INF-04 pendiente |
| Protección de menores | `SOLO_ZDR` como mínimo sin datos reales hasta PEND-02; imagen y 3D bloqueadas; sin caché D2 ni de menores (persistencia 9.1); PWA sin conversaciones sin conexión | Compatible; condición legal pendiente |

### 8.5. Pendientes abiertos

| Tipo | Pendiente |
|---|---|
| Aprobación de producto o comercial | ADR-058 (modo `GENERAL`); calibración de UTI (incluido el peso 4 de `razonamiento.profundo`, que ahora comparte modelo), cuotas, créditos Studio y presupuestos (límite blando y tope duro); contratación de Workers Paid o créditos de AI Gateway, planes de Neon, Atlas y Upstash, correo, pasarela, Browser Rendering y Cloud Run |
| Legal | PEND-02 (retenciones de 30/14 días, 12 meses y 90 días; transferencia internacional; contratos de tratamiento), PEND-03 (protocolo de riesgo con menores), consentimiento audiovisual, PEND-04 (términos de Stability y Meshy) |
| Experimental | BP-01 a BP-07, PEND-05, PEND-VIS-01/02, PEND-MAT-01, PEND-RAG-01 (versión de pgvector, EXPLAIN y Recall), PR-INF-01 a 05, SEC-01 a 10, API-01 a 18 y los EQ asociados |
| Documental | **Resuelto el 21/11/2026:** reexportados los PNG `m2-secuencia`, `m6-secuencia` y `principios-solid-m1` desde sus fuentes corregidas. Pendiente original: sistemas externos de IA en C4 niveles 1 y 2 (guía, sección 5, punto 5) y enlaces de EQ en `08-escenarios-atributos-calidad.md` (punto 6), reservados para el SDD y la evaluación de calidad |

### 8.6. Siguiente tarea

Evaluación de atributos de calidad (skill `mentelyx-calidad-sdd`) sobre EQ-01–EQ-31, tomando como entrada este registro, el contrato de coordinación y las pruebas de `06-calidad-ia-criterios-y-pruebas.md`. Después, el SDD consolidado. La implementación no empieza antes.

## Resolución por la instrucción maestra (20/11/2026, Claude Code)

La [instrucción maestra](../../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md) resuelve los pendientes de este registro. Las entradas anteriores se conservan como historia.

| Elemento del registro | Resolución vigente | Referencia |
|---|---|---|
| ADR-056 (modelos) y PEND-01 | DeepSeek V4.1 Flash, Gemma 4 26B A4B, BGE-M3 y FLUX.2 Klein en Workers AI; Claude, Gemini, OpenAI, Nano Banana, Stability y Meshy como extensiones futuras desactivadas | ADR-077 |
| ADR-058 (modo GENERAL) y CO-05 | GENERAL y MIXTA habilitados; el orquestador decide la modalidad | ADR-078 |
| ADR-064 y SC-15 (embeddings) | BGE-M3 con `vector(1024)`; BP-07 mide Recall | ADR-076 |
| ADR-069 (retención 30/14) | 90 días con aviso previo; lienzos y recursos con ciclo propio | ADR-079 |
| ADR-050 y ADR-067 (créditos Studio, UTI) | Recursos de plan por categoría con autoridad en M5 | ADR-080, ADR-088 |
| ADR-063, ADR-071 y ADR-072 (3D e imágenes) | 3D para todas las cuentas; generación externa bloqueada sin integración autorizada; FLUX.2 para ilustraciones | ADR-077, ADR-091 |
| ADR-061 (pizarra junto al chat) | Lienzo extensible como interfaz principal, lazo y capas | ADR-083 |
| ADR-073 (migraciones con Kysely) | Drizzle Kit como única autoridad de migraciones; Kysely para consultas especializadas | ADR-075 |
| P-01 a P-11 | Resueltas según la sección 20 de la instrucción maestra | ADR, sección 10.3 |
| Pruebas BP-01 a BP-07 | Siguen **pendientes de ejecución**; ninguna se declara superada | Estrategia de pruebas |

Solicitudes de cambio nuevas: cualquier sustitución de un modelo aprobado, de CulqiOnline o de la matriz de planes requiere autorización expresa del responsable del proyecto (IM, sección 1).
