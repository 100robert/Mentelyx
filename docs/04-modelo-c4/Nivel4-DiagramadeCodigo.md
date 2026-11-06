# Modelo C4 — Nivel 4: Diagrama de Código (Módulos M1–M7 y Detalle UML de M5)

> **Proyecto:** Mentelyx · **Ubicación:** `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md`  
> **Nivel C4:** Nivel 4 (Código: paquetes, clases, interfaces y secuencias) · **Versión:** 1.0  
> **Estado:** diseño de código completo; sirve como guía directa para la codificación en TypeScript.

## 1. Propósito del nivel

El **Nivel 4 del Modelo C4 (Código)** desciende al interior de los componentes del backend para mostrar cómo se organizan las capas de **Clean Architecture** (`presentacion/`, `aplicacion/`, `dominio/`, `infraestructura/` y raíz de composición `*.module.ts`) en los siete módulos (**M1–M7**), cómo se aplican los principios **SOLID** y cómo interactúan las clases e interfaces en el flujo transaccional de referencia (**M5 — Suscripciones y Pagos**).

> **Relación con Diseño Interno:** este documento consolida las vistas gráficas de Nivel 4 del Modelo C4; el inventario exhaustivo de archivos `.ts`, invariantes y fragmentos completos de código se encuentra en [`diseño-interno-de-modulos.md`](../03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md) y [`principios-de-diseño.md`](../03-diseño-de-software/diseño-interno/principios-de-diseño.md).

---

## 2. Vistas de Paquetes y Código por Módulo (M1–M7)

En los siete módulos, todas las dependencias de código apuntan hacia `dominio/` y `aplicacion/`. Ninguna entidad o caso de uso importa Hono, drivers de PostgreSQL/MongoDB ni SDKs externos.

### 2.1. M1 — Usuarios y Administración
![Paquetes de M1 — Usuarios y Administración](../img/m1-interno.png)
![Principios SOLID en M1](../img/principios-solid-m1.png)

### 2.2. M2 — Cursos y Contenidos (Mentelyx Studio)
![Paquetes de M2 — Cursos y Contenidos](../img/m2-interno.png)
![Principios SOLID en M2](../img/principios-solid-m2.png)

### 2.3. M3 — Evaluaciones y Aprendizaje
![Paquetes de M3 — Evaluaciones y Aprendizaje](../img/m3-interno.png)
![Principios SOLID en M3](../img/principios-solid-m3.png)

### 2.4. M4 — Docentes y Clases
![Paquetes de M4 — Docentes y Clases](../img/m4-interno.png)
![Principios SOLID en M4](../img/principios-solid-m4.png)

### 2.5. M5 — Suscripciones y Pagos (Módulo de referencia transaccional)
![Paquetes de M5 — Suscripciones y Pagos](../img/m5-interno.png)
![Principios SOLID en M5](../img/principios-solid-mentelyx.png)

### 2.6. M6 — Tutor IA y RAG
![Paquetes de M6 — Tutor IA y RAG](../img/m6-interno.png)
![Principios SOLID en M6](../img/principios-solid-m6.png)

### 2.7. M7 — Publicidad y Patrocinios
![Paquetes de M7 — Publicidad y Patrocinios](../img/m7-interno.png)
![Principios SOLID en M7](../img/principios-solid-m7.png)

---

## 3. Diagrama de Clases UML Detallado (C4 Nivel 4 — M5 Suscripciones y Pagos)

Se modela a nivel de clases, interfaces y métodos el proceso crítico de **confirmación idempotente de pagos por webhook, activación de derechos por versión comercial, abono en ledger de créditos y registro en Outbox**.

```mermaid
classDiagram
  direction TB

  class PagosWebhookController {
    <<Presentación · Hono>>
    -confirmarPago: ConfirmarPagoWebhookUseCase
    +recibir(c: Context) Promise~Response~
  }

  class ConfirmarPagoWebhookCommand {
    <<Command DTO>>
    +rawBody: Uint8Array
    +headers: Record~string, string~
  }

  class ConfirmarPagoWebhookUseCase {
    <<Aplicación · Caso de Uso>>
    -verifier: WebhookVerifierPort
    -uow: PaymentUnitOfWorkPort
    +ejecutar(cmd: ConfirmarPagoWebhookCommand) Promise~ResultadoWebhook~
  }

  class WebhookVerifierPort {
    <<interface · Puerto de Dominio>>
    +verificar(rawBody: Uint8Array, headers: Record) Promise~VerifiedPaymentEvent~
  }

  class PaymentUnitOfWorkPort {
    <<interface · Puerto de Dominio>>
    +transaccion~T~(fn: (tx: PaymentTransactionPort) => Promise~T~) Promise~T~
  }

  class PaymentTransactionPort {
    <<interface · Transacción ACID>>
    +registrarEventoSiNuevo(provider: string, eventId: string) Promise~boolean~
    +buscarOrdenBloqueada(orderId: string) Promise~PaymentOrder~
    +guardarOrden(order: PaymentOrder) Promise~void~
    +activarDerechosDeOrden(order: PaymentOrder) Promise~void~
    +registrarCreditoInicialSiCorresponde(order: PaymentOrder) Promise~void~
    +agregarOutbox(tipo: string, orderId: string) Promise~void~
  }

  class PaymentOrder {
    <<Entidad de Dominio>>
    +id: string
    +userId: string
    +productCode: string
    +policyVersion: string
    -status: EstadoOrden
    -referenciaCobro: string
    +estado() EstadoOrden
    +aprobar(referencia: string) void
    +rechazar() void
  }

  class CreditLedgerEntry {
    <<Entidad de Dominio>>
    +id: string
    +userId: string
    +creditPool: TipoPoolCredito
    +delta: number
    +operationKey: string
    +policyVersion: string
  }

  class PasarelaWebhookAdapter {
    <<Infraestructura · Adaptador>>
    -verificarConProveedor: VerificacionOficial
    +verificar(body: Uint8Array, headers: Record) Promise~VerifiedPaymentEvent~
  }

  class PostgresPaymentUowAdapter {
    <<Infraestructura · Adaptador SQL>>
    -sql: SqlTransactionClient
    -makeTx: PaymentTransactionFactory
    +transaccion~T~(fn) Promise~T~
  }

  PagosWebhookController --> ConfirmarPagoWebhookUseCase : invoca
  PagosWebhookController ..> ConfirmarPagoWebhookCommand : instancia
  ConfirmarPagoWebhookUseCase --> WebhookVerifierPort : verifica firma y origen
  ConfirmarPagoWebhookUseCase --> PaymentUnitOfWorkPort : abre transacción ACID
  ConfirmarPagoWebhookUseCase ..> PaymentTransactionPort : ejecuta pasos atómicos
  ConfirmarPagoWebhookUseCase ..> PaymentOrder : transiciona estado
  PaymentTransactionPort ..> CreditLedgerEntry : registra movimiento único
  PasarelaWebhookAdapter ..|> WebhookVerifierPort : implementa
  PostgresPaymentUowAdapter ..|> PaymentUnitOfWorkPort : implementa
```

---

## 4. Diagrama de Secuencia de Código (Confirmación ACID + Idempotencia + Outbox)

```mermaid
sequenceDiagram
  autonumber
  participant CTRL as PagosWebhookController
  participant UC as ConfirmarPagoWebhookUseCase
  participant VER as WebhookVerifierPort
  participant UOW as PaymentUnitOfWorkPort
  participant ORD as PaymentOrder
  participant PG as Neon PostgreSQL

  CTRL->>UC: ejecutar({ rawBody, headers })
  UC->>VER: verificar(rawBody, headers)
  VER-->>UC: VerifiedPaymentEvent { provider, eventId, orderId, reference, status }
  UC->>UOW: transaccion(async tx => ...)
  UOW->>PG: BEGIN
  UOW->>PG: INSERT INTO processed_webhooks (provider, event_id) ON CONFLICT DO NOTHING
  alt Evento duplicado (0 filas)
    PG-->>UOW: false
    UOW->>PG: COMMIT
    UOW-->>UC: 'duplicado'
    UC-->>CTRL: 'duplicado'
  else Evento nuevo (1 fila)
    PG-->>UOW: true
    UOW->>PG: SELECT * FROM payment_orders WHERE id = orderId FOR UPDATE
    PG-->>UOW: PaymentOrder (estado = PENDIENTE)
    UC->>ORD: aprobar(reference)
    UC->>UOW: guardarOrden(order)
    UC->>UOW: activarDerechosDeOrden(order)
    UC->>UOW: registrarCreditoInicialSiCorresponde(order)
    UC->>UOW: agregarOutbox('PagoConfirmado', order.id)
    UOW->>PG: UPDATE payment_orders + INSERT subscriptions + INSERT credit_ledger_entries + INSERT outbox_events
    UOW->>PG: COMMIT
    UOW-->>UC: 'procesado'
    UC-->>CTRL: 'procesado'
  end
```

---

## 5. Trazabilidad del Modelo C4 completo

| Nivel C4 | Archivo en `docs/04-modelo-c4/` | Alcance |
|---|---|---|
| **Nivel 1 — Contexto** | [`Nivel1-DiagramadeContextodelSistema.md`](./Nivel1-DiagramadeContextodelSistema.md) | Actores humanos, sistema Mentelyx y proveedores externos. |
| **Nivel 2 — Contenedores** | [`Nivel2-DiagramadeContenedores.md`](./Nivel2-DiagramadeContenedores.md) | Web/PWA, Cloudflare Edge, API Hono/Workers, Queues/Workers y bases de datos. |
| **Nivel 3 — Componentes** | [`Nivel3-DiagramadeComponentes.md`](./Nivel3-DiagramadeComponentes.md) | Los 7 módulos del monolito modular (`C01–C07`), middlewares y contratos públicos. |
| **Nivel 4 — Código** | [`Nivel4-DiagramadeCodigo.md`](./Nivel4-DiagramadeCodigo.md) | Paquetes Clean Architecture (`M1–M7`), SOLID y clases/secuencias UML en TypeScript. |

