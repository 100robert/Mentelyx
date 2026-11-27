# Estrategia de pruebas — Mentelyx

> **Versión:** 1.0 — 20/11/2026 · **Autoridad:** [instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md), sección 25.
> **Origen:** traslada y actualiza la sección 10 del SDD v1.0. Las pruebas de IA (BP, MAT, VIS, 3D, INY, MEN, API) siguen en [calidad IA](../03-diseño-de-software/diseño-especializado/06-calidad-ia-criterios-y-pruebas.md) y las de seguridad (SEC-01 a SEC-17) en [seguridad](../02-arquitectura-software/seguridad-y-autenticacion.md); aquí no se duplican.
> **Estado actualizado el 25/11/2026:** existen implementación y pruebas locales. El resultado de cada ejecución está en el [registro de continuidad, sección 16](../00-gestion-del-proyecto/sprint-02/avance-cierre-arquitectonico-sprint-02.md); los escenarios no acreditados siguen pendientes. No se equipara el paso de suites locales con la aprobación de todos los EQ. No se realizan pruebas pagadas, contrataciones ni tratamiento de datos reales de menores sin autorización.

## 1. Niveles, herramientas y reglas

Herramientas de [ADR-073](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md): Vitest en el pool de Workers, PostgreSQL 17 + pgvector y MongoDB efímeros, Playwright, k6; migraciones con Drizzle Kit (ADR-075).

| Nivel | Qué verifica | Dónde corre | Puerta |
|---|---|---|---|
| Estática (ARQ-01) | Ciclos de importación, imports fuera del `index.ts`, dominio sin frameworks | CI en cada PR | Bloquea el merge |
| Unitarias (UNI) | Reglas de dominio: recomendaciones, plan, viabilidad, cotización, verificador matemático, compilador de escenas, fórmula de devolución, comisiones | CI | Bloquea el merge |
| Integración (CON, CAC, MIG) | Transacciones, locks, UNIQUE, outbox/inbox, adaptadores reales de BD | CI con BD efímeras | Bloquea el merge |
| Contrato (API) | Endpoints frente a Zod/OpenAPI; contratos internos desde el consumidor | CI | Bloquea el merge |
| Seguridad (SEC, RAG-SEC, INY, PII, BYK, EDA, GRU) | Autorización, aislamiento entre usuarios, revocación, inyección por documentos, PII | CI y staging | Bloquea la promoción |
| E2E (UI, E2E, PIZ) | Recorridos de interfaces y PWA | Staging con datos sintéticos | Bloquea la promoción |
| Carga (K6) | EQ de rendimiento y escalabilidad | Staging aislado | Evidencia de EQ |
| Fallo y recuperación (FAL) | Degradación y restauración | Entorno aislado | Evidencia de EQ |
| Calidad IA y pedagógica (BP, TUT, EVA) | Precisión matemática, calidad pedagógica, modalidad de fuentes | CI con respuestas grabadas; BP con presupuesto aprobado | Activa cada ruta |

**Reglas:** solo datos sintéticos; la CI no llama a proveedores pagados (dobles y respuestas grabadas); sin carga ni estrés contra producción; cada ejecución se registra según la [política de aceptación](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md) (sección 4) con estado Simulada, Pasada o Fallida declarado tal cual.

## 2. Plan k6

Se conservan las cargas vigentes de los EQ. Un VU **no es un usuario real** ni un usuario concurrente de producción, y no equivale a solicitudes por segundo: se documentan el tiempo de espera y la tasa ofrecida (100 VU con una petición cada 5 s ≈ 20 RPS). IA y audiovisual quedan fuera de k6 (proveedores simulados o piloto con presupuesto).

| ID | EQ | Escenario | Umbrales vigentes | Registro adicional |
|---|---|---|---|---|
| K6-01 | EQ-01 | `constant-vus` 100 durante 10 min; 70 % `GET /api/v1/cursos` filtrado y 30 % detalle; espera 5 s | p95 ≤ 2 s; 5xx < 1 % | Aciertos de caché, p95 SQL, RPS |
| K6-02 | EQ-03 | `ramping-vus` 50 → 100 → 200 (5 min por etapa y 5 min en 200) | En 200 VU: p95 ≤ 3 s; 5xx < 1 % | Saturación, CPU del Worker, conexiones |
| K6-03 | EQ-15 | 100 VU, simulacro de 30 min | Guardado p95 ≤ 3 s; 5xx < 1 % | Auditoría SQL: 0 respuestas perdidas |
| K6-04 | EQ-29 | K6-01 con Redis indisponible | 0 operaciones sensibles sin control | p95 degradado frente a K6-01 |
| K6-05 | EQ-06/24 | `shared-iterations` 50 VU contra 35 cupos y recursos de plan limitados | Confirmadas ≤ 35; Σ consumos = reservas confirmadas; 0 duplicados | Conflictos y reintentos |
| K6-06 | API-04/17 | 50 consultas concurrentes al Tutor con proveedor simulado | Nunca se supera el recurso del plan ni el tope duro | Rechazos `429` correctos |
| K6-07 | EQ-34 | 50 VU aplicando lotes de operaciones a lienzos distintos | p95 ≤ 2 s; 0 operaciones perdidas | Conflictos `409` y revisiones |

```js
// Esquema de K6-01 (diseño; no ejecutado). Solo cuentan los 5xx.
import http from 'k6/http';
import { Rate } from 'k6/metrics';
import { sleep } from 'k6';
const errores5xx = new Rate('errores_5xx');
export const options = {
  scenarios: { catalogo: { executor: 'constant-vus', vus: 100, duration: '10m' } },
  thresholds: { 'http_req_duration{grupo:catalogo}': ['p(95)<2000'], errores_5xx: ['rate<0.01'] },
};
export default function () {
  const r = http.get(`${__ENV.BASE_URL}/api/v1/cursos?nivel=SECUNDARIA&pagina=1`, { tags: { grupo: 'catalogo' } });
  errores5xx.add(r.status >= 500);
  sleep(5);
}
```

K6-07 es nuevo y no modifica umbrales aprobados: usa el umbral de lectura de EQ-01 como referencia de diseño hasta que EQ-34 tenga medición.

## 3. Fallos, concurrencia, migración, caché y arquitectura

| ID | Caso | Inyección | Resultado esperado | EQ |
|---|---|---|---|---|
| FAL-01 | Worker/API con error | Versión defectuosa o fallo en `/health/ready` | Detección ≤ 5 min, reversión, RTO registrado | EQ-19 |
| FAL-02 | PostgreSQL indisponible | Credencial inválida o endpoint pausado | `503` en lo privado; 0 confirmaciones falsas | EQ-20 |
| FAL-03 | MongoDB indisponible | Corte de red | No se confirma guardado del lienzo ni publicación; operaciones locales visibles | EQ-20 |
| FAL-04 | Redis indisponible | Host inválido | Límites en SQL, sin salto de cuota | EQ-29 |
| FAL-05 | IA caída o incierta | Timeout antes y después del primer token | `INCIERTA` sin reintento ciego; recurso liberado o retenido según evidencia | EQ-30 |
| FAL-06 | Correo caído | Proveedor simulado 500 | La operación sigue; aviso reintentado | EQ-02 |
| FAL-07 | Pago incierto | Webhook retrasado y timeout de consulta | Orden PENDIENTE; sin cargo nuevo; conciliación | EQ-31 |
| FAL-08 | Restauración | Runbook de [persistencia, sección 11](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) | RTO/RPO observados; libros = saldos; *tombstones* reaplicados | EQ-21 |
| FAL-09 | Falla común de Workers AI | Todas las rutas simuladas caídas | Herramientas deterministas, biblioteca y lecciones disponibles; 0 recursos consumidos | EQ-30 |
| CON-01 | Reservas concurrentes | N transacciones sobre el mismo cupo | Sin sobrecupo ni doble reserva | EQ-06/24 |
| CON-02 | Recursos de plan | Reservas, liberaciones y reintegros concurrentes (sustituye «lotes de créditos») | Disponibles = límite + extra − reservado − consumido; reintegro único | EQ-24 |
| CON-03 | Webhook duplicado o fuera de orden | Repetir y desordenar eventos | Un solo efecto; APROBADA no vuelve a PENDIENTE | EQ-08/31 |
| CON-04 | Pagos directos y comisiones | Repetir la verificación con un cambio de política posterior (sustituye «liquidación») | Misma comisión por versión; sin doble registro | EQ-13/25 |
| CON-05 | Ficha y publicación | Publicar sin fuente o modificar una versión publicada | Rechazo; los intentos conservan su versión | EQ-17 |
| CAC-01 | Invalidación de catálogo | Publicar o retirar | Contenido nuevo tras `catalog_state` | EQ-01 |
| CAC-02 | No caché de privados | Cabeceras y *service worker* | `private, no-store`; nada privado ni conversaciones en la PWA | EQ-04 |
| MIG-01 | Expand-contract | Versiones N y N−1 a la vez | Lectura compatible; sin pérdida | EQ-05 |
| MIG-02 | Reversión de aplicación | Volver a N−1 | Sin migración *down* destructiva | EQ-05 |
| MIG-03 | Documentos versionados | vN lee `schemaVersion` vN−1 | Sin DLQ por esquema conocido | EQ-05 |
| MIG-04 | Drizzle y Kysely | Generar tipos de Kysely desde el esquema Drizzle y compilar consultas | 0 migraciones fuera de Drizzle Kit; tipos coherentes en CI | EQ-05 |
| E2E-01 | Studio sin conexión | Cortar y restablecer la red | Nunca «guardado remoto» sin ACK | EQ-23 |
| UNI-01/02/03 | Recomendaciones, plan y viabilidad | Mismos datos y reglas | Resultado idéntico | EQ-09/16/28 |
| UX-01/02 | Pruebas guiadas | 5 adultos con cuentas sintéticas | ≥ 4 de 5 sin asistencia | EQ-07/18 |
| PIL-01 | Aula 35 + 1 | Cuenta de prueba con presupuesto aprobado | Aforo, acceso y participante-minutos registrados | EQ-14/26 |
| ARQ-01 | Reglas de dependencia | ESLint `import/no-cycle` | 0 ciclos y 0 imports prohibidos | EQ-05 |

## 4. Pruebas de la instrucción maestra

| ID | Familia | Caso | Resultado esperado | EQ |
|---|---|---|---|---|
| RAG-SEC-06 | Aislamiento entre usuarios | B busca términos exactos de un espacio privado de A; A revoca un documento durante la consulta | 0 fragmentos de A; el revocado no se usa ni cita | EQ-32 |
| TUT-01 | Modalidad | Consulta sin fuentes | `modoFuentes = GENERAL` etiquetado, sin citas | EQ-33 |
| TUT-02 | Exclusividad | «Solo mis fuentes» con fragmentos insuficientes | 0 complementos generales; `SIN_CONTEXTO` si no hay fragmentos | EQ-33 |
| TUT-03 | Complementación | Fuentes insuficientes y pedido de profundidad | `MIXTA` con párrafos complementarios marcados; 0 referencias inventadas | EQ-33 |
| PIZ-01 | Persistencia del lienzo | 200 objetos, zoom, deshacer/rehacer y recarga en móvil | Sin pérdida; conversación plegable | EQ-34 |
| PIZ-02 | Selección visual | Lazo sobre una ilustración y un objeto | Solo identificadores y recorte mínimo enviados | EQ-35 |
| PIZ-03 | Capas | La IA responde sobre una selección con trazos del usuario | 0 cambios en la capa USUARIO | EQ-35 |
| BIB-01 | Reutilización | Consulta que coincide con un recurso validado | Se ofrece reutilizar o adaptar antes de generar | EQ-36 |
| BIB-02 | Publicación | Publicar un recurso con fuente privada, PII o evaluación reservada | `409 PUBLICACION_NO_PERMITIDA` | EQ-36 |
| BIB-03 | Retiro y revocación | Retirar un recurso público | 0 accesos públicos, cachés invalidadas y embeddings eliminados en ≤ 60 s | EQ-36 |
| EVA-01 | Evaluaciones | Generación rápida sin parámetros | ≥ 15 preguntas variadas | EQ-37 |
| EVA-02 | Reproducibilidad | Recalificar la misma versión | Nota idéntica | EQ-37 |
| EVA-03 | Revelación | Modo evaluación | Soluciones no reveladas; Tutor bloqueado | EQ-37 |
| BYK-01 | BYOK | Registrar una clave | Solo proveedor, etiqueta y últimos 4 en la respuesta | EQ-38 |
| BYK-02 | BYOK | Buscar la clave en logs y conversaciones | 0 apariciones | EQ-38 |
| BYK-03 | BYOK | Revocar y consultar; cuenta de menor | Falla sin facturación de Mentelyx; menor no puede configurar | EQ-38 |
| PUB-01 | Verificación publicitaria | Recompensa verificada | Concesión única | EQ-39 |
| PUB-02 | Fraude | Evento del navegador sin verificación o *nonce* repetido | 0 concesiones | EQ-39 |
| PUB-03 | Menores | Cuenta de menor | Sin ofertas | EQ-39 |
| CUL-01 | Webhooks Culqi | Duplicados, rechazados y fuera de orden | 0 derechos sin consulta del estado real; 0 duplicados | EQ-40 |
| CUL-02 | Pagos rechazados | Cargo rechazado | Orden RECHAZADA; sin derechos | EQ-40 |
| CUL-03 | Renovación | Recurrente con y sin autorización; manual | Recurrencia solo con autorización registrada | EQ-40 |
| CUL-04 | Comisiones | S/39,90 por tarjeta y Yape; importes bajo la mínima y sobre el umbral | Comisión según la configuración vigente del medio, la mínima y el umbral | EQ-40 |
| CUL-05 | Conciliación | Diferencias entre órdenes y estado del proveedor | Reporte y corrección por movimientos compensatorios | EQ-40 |
| AUD-01 | Consumo audiovisual | Iniciar con y sin capacidad | Sin capacidad no inicia sin autorización; la clase en curso no se interrumpe | EQ-41 |
| AUD-02 | Devolución de saldo audiovisual autorizada | 2.000 participante-minutos con la configuración de referencia | Consumo S/24 y saldo no utilizado candidato S/21 según la IM §15.3; registrar aparte la comisión no recuperable y el importe efectivamente devuelto; una sola aplicación por operación autorizada y estado SOLICITADA hasta la evidencia | EQ-41 |
| AUD-03 | Cargos adicionales | Superar la capacidad | Cargo solo con autorización explícita | EQ-41 |
| RET-01 | Retención | Conversación inactiva 83 y 90 días | Aviso a los 83; inaccesible a los 90 y purga agendada | EQ-42 |
| RET-02 | Ciclos independientes | Conversación con lienzo guardado; pagos y notas | Lienzo, pagos y notas se conservan | EQ-42 |
| EDA-01 | Edad | Cumpleaños 18 con reloj simulado | Condición actualizada sin intervención | EQ-43 |
| EDA-02 | Minimización | Consultar el perfil por API y desde otros módulos | La fecha nunca se expone; solo la condición derivada | EQ-43 |
| GRU-01 | Grupos | No miembro solicita materiales | 100 % denegado | EQ-44 |
| GRU-02 | Grupos | Expulsar a un miembro | Acceso perdido desde el commit | EQ-44 |
| COS-04 | Costos | Muestra de operaciones por categoría en el piloto | Costo medido frente a las cotas de la IM, sección 18.1; desviación reportada sin cambiar cuotas | EQ-45 |

## 5. Mediciones durante la implementación

Se registrarán (no existen todavía): tokens facturables, latencias, costo por operación, procesamiento OCR, indexación, renderizado, escrituras, participante-minutos, transferencia y costos efectivos de proveedor.

**Pruebas ejecutadas el 21/11/2026 (local; datos sintéticos).** Las demás pruebas de este documento siguen **pendientes**.

| Prueba | Archivo o comando | Resultado |
|---|---|---|
| Unitarias (contratos; reglas de M5 y M6: costos, presupuesto por operación, citas, redacción, delimitadores; adaptador de Workers AI con binding simulado), contrato OpenAPI y ARQ-01 | `pnpm test` | 39/39 pasadas |
| CON-02, API-04 e idempotencia y atomicidad de M5 (P0) | `pnpm test:integracion` (`recursos-concurrentes`, `idempotencia-p0`) | 23/23 pasadas |
| MVP vertical y M6: autenticación, espacios, fuentes, Tutor, Mongo, CSRF, presupuesto; RAG híbrido con embeddings sintéticos, degradación léxica, API-18 (GENERAL y SIN_CONTEXTO), redacción, PARCIAL, `INCIERTA`/`FALLIDA` (CO-10), límite de tasa con Redis y respaldo SQL (API-08), simultaneidad | `backend/src/tests/mvp-vertical.integration.test.ts` | 22/22 pasadas |
| MIG-04 (6 migraciones) | `pnpm db:verificar` | 13/13 comprobaciones pasadas |
| PR-INF-01 en workerd | `pnpm test:workers` | 5/5 pasadas |
| Prueba de humo E2E por el frontend (OpenNext en workerd) | `node scripts/humo-e2e.mjs http://127.0.0.1:8788` | 16/16 pasos pasados |
| Límite de tasa en workerd con Redis REST, a través del frontend | Comprobación manual de 7 consultas seguidas | 6 × 200 y la 7.ª 429 `LIMITE_TASA` con `Retry-After: 50`; consumidas 6, reservadas 0; claves en Redis con HMAC del actor |
| Uso del HNSW parcial `bge-m3` por el planificador | `EXPLAIN` con `enable_seqscan = off` | `Index Scan using rag_chunks_hnsw_bgem3_1024` con los filtros de la consulta. El plan con datos reales en Neon (PEND-RAG-01) sigue pendiente |
| Workers AI real (Gemma 4, BGE-M3), BP-07, conjunto adversarial del Tutor, k6, PR-INF-02 a 05, SEC-01 a 16, E2E en navegador y en una URL pública | — | Pendientes |

## 6. RTO y RPO por tipo de dato

Metas de diseño no medidas ([persistencia, sección 11](../03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md)):

| Clase | RPO | RTO |
|---|---|---|
| SQL crítico (pagos, recursos, notas, saldos audiovisuales) | ≤ 15 min | ≤ 2 h |
| MongoDB, contenido y lienzos confirmados | ≤ 1 h | ≤ 4 h |
| R2, originales y fuentes privadas | ≤ 24 h | ≤ 8 h |
| RAG y exportaciones derivadas | La versión fuente recuperada | ≤ 24 h |
| Redis | Sin RPO de negocio | ≤ 30 min |
