# Análisis de riesgos, sensibilidad y compromisos — Mentelyx

> **Versión:** 1.0 — 20/11/2026 · **Método:** inspirado en ATAM, documental, sin taller con interesados.
> **Origen:** traslada y actualiza las secciones 8.4 a 8.6 del SDD v1.0. Objetivos y árbol de utilidad: [01](01-evaluacion-de-atributos-de-calidad.md).

## 1. Puntos de sensibilidad

| ID | Punto | Escenarios |
|---|---|---|
| S-01 | Latencia API ↔ RTT entre Workers y Neon/Atlas y número de viajes por petición | EQ-01, EQ-03, EQ-15 |
| S-02 | Integridad de recursos ↔ lock por `resource_balances` y UNIQUE `operation_key` (sustituye `credit_balances`) | EQ-06, EQ-24 |
| S-03 | Fuga RAG ↔ filtro `scope` y revalidación antes del modelo y de la entrega | EQ-11, EQ-32 |
| S-04 | Costo IA ↔ categoría de la ruta, `presupuestoOperacionUSD` y tope duro (sustituye los pesos UTI) | EQ-10, EQ-45 |
| S-05 | Conexiones de BD ↔ concurrencia de consumidores de colas | EQ-03, EQ-15 |
| S-06 | Continuidad ↔ PostgreSQL como dependencia única de escrituras críticas | EQ-19, EQ-20 |
| S-07 | Disponibilidad del Tutor ↔ un único proveedor de inferencia (Workers AI) | EQ-30 |
| S-08 | Devolución audiovisual ↔ medición de participante-minutos del SFU y comisión no recuperable | EQ-41 |
| S-09 | Comisión efectiva ↔ medio de pago, mínima y umbral de importe | EQ-40 |
| S-10 | Fidelidad de la selección ↔ conversión del lazo a coordenadas de mundo y tamaño del recorte | EQ-35 |

## 2. Compromisos (*trade-offs*)

| ID | Compromiso | Resolución actual |
|---|---|---|
| T-01 | Sesión SQL en cada petición (AC-04) frente a latencia (AC-01) | Se prioriza AC-04; K6-01 |
| T-02 | Persistencia políglota (AC-05) frente a falta de ACID entre motores (AC-06) | Protocolo PENDING→PUBLISHED y conciliación |
| T-03 | Ejecución del Tutor por cola y *lease* frente a primer token | Se acepta; PR-INF-04 |
| T-04 | Monolito modular frente a escalado por módulo | Escalado horizontal de Workers; límite en BD |
| T-05 | Next.js híbrido con OpenNext (SSR e ISR) frente a simplicidad del estático | **Sustituye** «sin SSR» (ADR-074); compatibilidad en PR-INF-01 |
| T-06 | Modo GENERAL (utilidad, AC-07) frente a fidelidad a fuentes (AC-11) | Resuelto por ADR-078: etiquetado, MIXTA diferenciada y exclusividad respetada |
| T-07 | Un solo proveedor de inferencia (costo, privacidad) frente a redundancia (AC-02) | Se acepta con degradación determinista; extensiones externas desactivadas |
| T-08 | Un solo proveedor de plataforma frente a riesgo de proveedor | Riesgo aceptado con criterio (persistencia, sección 9.4) |
| T-09 | BYOK (costo para Mentelyx) frente a superficie de seguridad y soporte | Solo adultos; sobre AES-256-GCM; sin fallback facturado |
| T-10 | Pagos directos sin custodia (sin riesgo financiero) frente a cobro de comisión no automático | Registro, verificación y conciliación; no se asume descuento automático (IM, sección 15) |
| T-11 | Biblioteca pública (reutilización) frente a riesgo de publicar datos privados | BR-07 y BR-12; retiro con purga |

## 3. Riesgos

| ID | Riesgo | Mitigación / verificación |
|---|---|---|
| R-01 | Caída de Neon detiene las escrituras críticas | Degradación, RTO 2 h, FAL-02, PR-INF-03; aceptado |
| R-02 | Compatibilidad en Workers no probada (Better Auth, driver Mongo, PptxGenJS, OpenNext, Zod); Cloudflare recomienda vinext (beta) para aplicaciones nuevas | PR-INF-01 con comparación OpenNext frente a vinext; contingencias de ADR, sección 10.1; sin cambio de adaptador sin autorización |
| R-03 | Aula 35 + 1 y costo por participante-minuto no medidos | PIL-01; contingencia LiveKit |
| R-04 | Calidad pedagógica de los modelos no medida | BP-01 a BP-07; rutas desactivadas hasta superarlos |
| R-05 | Tratamiento real de datos de menores pendiente de condiciones legales | Banderas de ADR, sección 10.4; solo datos sintéticos |
| R-06 | Respaldos en el mismo proveedor que los originales | Aceptado con criterio de reconsideración |
| R-07 | Parámetros de piloto (Docente Live, documento equivalente) sin calibrar | Configuración versionada; IM, sección 15.3 |
| R-08 | Sagas M2/M5/M6, M3/M5/M6, M4/M5 y M7/M5 con compensaciones | CON-01 a CON-05; outbox/inbox; conciliación diaria |
| R-09 | El estimador de tokens puede subestimar el costo | COS-01; tope duro y déficit registrado |
| R-10 | Figuras PNG desactualizadas frente a sus fuentes | Mitigado el 21/11/2026: fuentes corregidas y PNG/SVG reexportados con draw.io Desktop; revisar en cada cambio de diseño |
| R-11 | Tarifas de proveedores de referencia, no verificadas en fuentes oficiales en esta intervención | Verificar antes de comercializar (IM, sección 18.2); COS-04 |
| R-12 | Un fallo del filtro `scope` expondría fuentes privadas | RAG-SEC-06; revisión de consultas Kysely |
| R-13 | Recursos públicos de baja calidad reutilizados | Revisión y valoraciones agregadas; BIB-03 |
| R-14 | Publicar contenido derivado de conversaciones privadas | BR-12, detección de PII, BIB-02 |
| R-15 | El recorte del lazo incluye información fuera de la selección | Recorte mínimo en M2; PIZ-02 |
| R-16 | Fraude en recompensas | *Nonce* de un solo uso y verificación servidor a servidor; PUB-02 |
| R-17 | La comisión mínima hace inviables importes pequeños | `payment_fee_schedules` con mínima y umbral; CUL-04 |
| R-18 | Cobro recurrente no autorizado | `recurrence_authorizations` y revocación; CUL-03 |
| R-19 | Devolución audiovisual sin evidencia o duplicada | Estado SOLICITADA hasta la evidencia; AUD-02 |
| R-20 | Falla común de Workers AI deja sin Tutor | Degradación determinista y biblioteca; FAL-05, FAL-09 |

## 4. No riesgos argumentados

- NR-01: el doble consumo de recursos queda impedido por restricciones SQL.
- NR-02: la caída de Redis no compromete la integridad.
- NR-03: los duplicados de las colas son idempotentes.
- NR-04: los datos D3 están aislados en el bucket de M4.
- NR-05: el dominio no depende de proveedores (puertos y adaptadores).
- NR-06: una clave BYOK filtrada de la base no es usable sin la clave maestra del secreto.
- NR-07: un evento del navegador no puede conceder recompensas.

## 5. Temas de riesgo

1. Proveedores aún no probados en el runtime (R-02, R-03, R-20).
2. Condiciones legales y protección de menores (R-05).
3. Economía unitaria con tarifas de referencia y parámetros de piloto (R-07, R-09, R-11, R-17).
4. Exposición de datos privados por la biblioteca o el RAG (R-12, R-14, R-15).

## 6. Evidencias requeridas

Cada riesgo se cierra solo con la evidencia de su prueba registrada según la [política de aceptación](../01-analisis-de-sistema/08-escenarios-atributos-calidad.md) (sección 4). Las pruebas están definidas en la [estrategia de pruebas](03-estrategia-de-pruebas.md) y siguen **Pendientes**.
