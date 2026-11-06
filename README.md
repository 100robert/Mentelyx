# Mentelyx — Plataforma educativa y arquitectura de software

> **Versión:** 2.0 — documentación integral finalizada (Análisis, Arquitectura, Diseño Interno/Externo y Modelo C4).  
> **Estado:** arquitectura y diseño de software completos y listos para iniciar la fase de desarrollo; importes comerciales, cuotas y contratos sujetos a validación en piloto. No implica software ya desplegado en producción ni servicios externos contratados.

## 1. Propósito del proyecto

Mentelyx es un **centro educativo virtual independiente**, dirigido a **Primaria, Secundaria, Preuniversitario y Universitario**, que combina contenido educativo, diagnóstico, prácticas y simulacros, rutas adaptativas, preparación de exámenes, tutor IA con RAG, autoría en Mentelyx Studio y aulas virtuales con docentes habilitados y estudiantes universitarios tutores autorizados. Se desarrolla como **web mobile-first y PWA**; la inscripción no depende de colegios o dominios de correo institucional.

**Diferenciación:** existen **tres cuentas públicas** (Estudiante, Creador educativo y Docente). Dentro de Docente se elige **perfil independiente/libre** (temas y experiencia, sin perfil de especialización acreditada) o **perfil por nivel académico** (niveles y materias, con formación acreditable tras verificación). Un estudiante universitario adulto puede solicitar autorización adicional para impartir tutorías sin convertirse en Docente. Autenticación, acreditación profesional, habilitación para cobrar y suscripción son estados **distintos**. Los menores requieren salvaguardas específicas.

## 2. Necesidad del negocio y propuesta de valor

- **Para estudiantes:** estudiar a su ritmo, reforzar áreas de dificultad, prepararse para exámenes y acceder a clases con profesores reales, desde cualquier región y sin requerir relación con institución educativa.
- **Para docentes y estudiantes tutores habilitados:** gestionar clases, cupos, remuneraciones y preparar material visual profesional.
- **Para creadores:** utilizar Studio como entorno de autoría, publicación autorizada y herramientas de IA bajo límites claros.
- **Para Mentelyx:** ingresos sostenibles procedentes de suscripciones educativas, de Aulas Live, de Studio y de clases individuales; los costos de IA, cobros, docentes y audiovisuales deben medirse por producto.

## 3. Modelo de producto y monetización

| Línea | Producto | Precio de referencia | Prestación y límite | Estado |
|---|---|---:|---|---|
| Estudiante | Gratuito | S/0 | Contenido y funciones gratuitas limitadas, prueba acotada de IA | Dirección de producto |
| Estudiante | Plus | **S/29,90/mes** | Aprendizaje con IA y funciones educativas; sin clases humanas incluidas | Precio **propuesto** |
| Estudiante | Pro | **S/59,90/mes** | Cuota IA mayor y preparación avanzada; sin Live ilimitado | Precio **propuesto** |
| Aulas | Aulas Live | **S/99,90/mes** | **4 créditos Live por mes** para inscribirse individualmente a clases; no incluye IA premium | Precio y reglas **propuestos** |
| Autoría | Studio Free | S/0 | Editor, pizarra y gráficos manuales; IA de prueba limitada | Dirección de producto |
| Autoría | Studio Plus | **S/29,90/mes** | **300 créditos de Studio** como hipótesis; generación asistida con cuota | Precio/cuota **propuestos** |
| Autoría | Studio Pro | **S/69,90/mes** | **900 créditos de Studio** como hipótesis; autoría avanzada | Precio/cuota **propuestos** |
| Autoría | Studio Equipos | Por definir | Colaboración institucional o de equipo | **Posterior** |

**Importante:** un **crédito Live** compra derecho limitado a una participación en clase según modalidad; un **crédito Studio** mide consumo de operaciones de IA. **No son intercambiables ni dinero electrónico**, ni pueden convertirse en saldo retirable. Ningún plan promete consumo ilimitado ni resultados académicos garantizados. Los precios son hipótesis a revisar con tarifas de proveedores, impuestos y costos medidos, y no constituyen tarifas publicadas.

### Aulas Live y tutores

- Aula/seminario: **6–35 estudiantes**, 1 crédito Live por estudiante para sesión de hasta **60 min**; Reforzamiento reducido: **2–5**, 2 créditos; individual: **1**, 3 créditos. Se prevén clases de grupos de 3 o 5, incluidos tutores universitarios **adultos habilitados**; no existe mínimo general de 15 alumnos.
- **35 alumnos + 1 docente** es capacidad objetivo inicial de aula, **no límite perpetuo** ni afirmación de concurrencia ya probada. El sistema permitirá múltiples salas y ajustará costos según ocupación y duración.
- **Modelo económico por crédito Live:** tarifa de pago a docente candidata **S/8 por crédito efectivamente consumido** (es decir, S/8, S/16 o S/24 por participante según modalidad), distinta de una comisión 70/30 para venta individual. Debe constar en contrato, junto a cancelaciones, asistencia y liquidación. Se cambia respecto de la propuesta preliminar anterior de S/10 por crédito para preservar margen potencial; **ambas cifras requieren negociación**, y el valor de S/8 NO está aprobado contractualmente.
- Las ventas directas de clase (fuera de Live) podrán tener precio definido por tutor, pero se someterán a **simulación de rentabilidad**: comisión pasarela, minutos-participante, impuestos, grabación, costos de transferencia, compensaciones y márgenes. La referencia **S/8 por inscripción no garantiza rentabilidad** cuando la pasarela aplica mínimo por transacción; no depender de compras grupales.
- **Aulas gratuitas**: se autorizan solo con patrocinio, presupuesto promocional o fuente de financiación verificada; la publicidad no se presume suficiente y no debe interrumpir clase ni perfilar académicamente a menores.
- La entrega de cuatro créditos exige oferta real de clases y horarios, política de reprogramación, devolución/restitución y liquidación transparente. Nadie recibe pagos por simples reservas no prestadas, salvo condiciones contractuales específicas.

### Studio y rentabilidad de IA

**300/900 créditos de Studio** son unidades comerciales de prueba, no una cantidad de generaciones verificadas. Ejemplos ilustrativos a calibrar con modelos medidos: presentación de 12 diapositivas = 5 créditos; lote de 10 ejercicios = 1; PDF educativo de 30 páginas = 8; imagen IA estándar = 10; imagen premium = 20. Editor, funciones gráficas deterministas y escritura manual **no gastan IA**. Se deberá medir tokens, imágenes, uso real y reintentos por cuenta, con presupuestos internos y límite por operación. El acceso a Studio no habilita por sí mismo a cobrar tutorías.

## 4. Siete módulos de negocio

| Módulo | Propiedad funcional |
|---|---|
| 1. Usuarios y Administración | Cuentas, autenticación, permisos, protección de menores, moderación, auditoría y operación |
| 2. Cursos y Contenidos | Catálogo, licencias, objetos y documentos educativos, **Mentelyx Studio** |
| 3. Evaluaciones y Aprendizaje | Diagnóstico, ejercicios, simulacros, planes de examen y seguimiento |
| 4. Docentes y Clases | Perfiles, acreditación, habilitación, aulas, grabaciones, asistencia y reservas |
| 5. Suscripciones y Pagos | Productos, créditos y cuotas, órdenes, idempotencia, saldos, liquidaciones y conciliación |
| 6. Tutor IA y RAG | Explicaciones autorizadas, recuperación, cuotas de consumo IA y fuentes |
| 7. Publicidad y Patrocinios | Campañas permitidas, patrocinios y seguimiento agregado |

**No se agregan módulos** por Redis, Queues, WebRTC o pagos: son servicios transversales o adaptadores técnicos.

## 5. Arquitectura objetivo y entornos

| Área | Desarrollo local | Despliegue comercial objetivo |
|---|---|---|
| Frontend | Next.js/React/TypeScript | Cloudflare Pages **si la exportación estática resulta compatible**; SSR requeriría otra estrategia |
| Backend REST | Hono + TypeScript | Cloudflare Workers + Hono, monolito modular |
| Datos SQL | **PostgreSQL local** + migraciones | **Neon PostgreSQL + pgvector** (seleccionado, no contratado) |
| Documentos educativos | MongoDB local | **MongoDB Atlas** (seleccionado, conectividad Workers por validar) |
| Caché | Redis local | Redis administrado compatible con Workers, proveedor por elegir |
| Binarios/video | Carpeta/objeto de prueba | R2 para archivos; Bunny Stream para video publicado |
| Tareas y colas | Adaptador local / Worker de pruebas | Cloudflare Queues con DLQ y procesadores idempotentes |
| Aulas | WebRTC de prueba | Cloudflare RealtimeKit/SFU **candidato inicial** sujeto a prueba de 36 participantes |
| Autenticación | Integración Hono + biblioteca | **Better Auth candidato** para credenciales/sesiones; permisos propios RBAC/ABAC |
| IA | Proveedor simulado o llamadas medidas | LLM externo intercambiable, presupuestos y RAG autorizado |
| Extensión pesada | Proceso local/Docker | Cloud Run solo para tareas pesadas si Workers no basta |

**Persistencia:** PostgreSQL es fuente de verdad de pagos, cupos, créditos, permisos, resultados confirmados y liquidaciones; MongoDB almacena estructuras flexibles versionadas; Redis es solo caché/contadores efímeros. Objetos y video fuera de las BD. Entre motores no existe una transacción ACID global: usar outbox, identificadores y procesos idempotentes.

## 6. Disponibilidad, seguridad y control de costos

- **AC-02 disponibilidad** prioritaria: propuesta de **99,5 % mensual** para funciones educativas críticas, **meta de diseño y no SLA**. Caída de Redis debe degradar de manera segura; la de IA no debe bloquear contenido ordinario; pagos/exámenes no pueden confirmar acciones antes de persistirlas.
- **Recuperación:** monitoreo/alertas, salud de servicios, DLQ, compensaciones, backups con restauraciones ensayadas, métricas de RTO/RPO. Plan Free no implica HA automática de PostgreSQL/Atlas ni failover regional.
- **Seguridad:** TLS, Cloudflare WAF/DDoS, autorización estricta en API, sesiones, MFA administrativo, validación, límites, registros sin secretos, controles de derechos y consentimiento audiovisual.
- **Ingresos vs costos:** cada plan debe preservar contribución positiva **a uso completo**, separando IGV cuando corresponda, pasarela, pagos a docentes, IA, video, storage, soporte, devoluciones, infraestructura fija y tributos. Las estimaciones previas **no son utilidad neta**.
- **Balanceador dedicado:** solo se añadirá si hay destinos independientes con health checks y justificación operativa; no confundir CDN/WAF con balanceo de orígenes para recuperación de una BD.

## 7. Fases y límites

1. **Documentación y diseño (Completado):** análisis de sistema (`01`), arquitectura de software (`02`), diseño interno/externo (`03`) y modelo C4 (`04`).
2. **Construcción local (Siguiente paso):** inicializar monorepo (`frontend/` y `backend/`), migraciones SQL en PostgreSQL, identidad (M1), catálogo y Studio MVP (M2), evaluaciones (M3), reservas (M4), planes/créditos y pagos sandbox (M5), RAG (M6) y pruebas de contratos.
3. **Piloto limitado:** medir IA real por generación, pruebas docentes, verificaciones de capacidad WebRTC (35+1), funcionamiento pasarela, conciliación, costos y restauración.
4. **Lanzamiento comercial:** solo servicios cuyos permisos, seguridad, capacidad, costos, términos y disponibilidad hayan sido verificados; activación progresiva de planes.
5. **Posterior:** convenios escolares, Studio Equipos, clases masivas más allá de 35, modelos IA propios, eventual Kafka y alta disponibilidad superior contratada.

## 8. Estructura documental completa y estado

### 8.1. `docs/01-analisis-de-sistema/` — Análisis del Sistema
| Archivo | Propósito | Estado |
|---|---|---|
| [`01-actores.md`](docs/01-analisis-de-sistema/01-actores.md) | Usuarios, sistemas externos y permisos por cuenta | Completado |
| [`02-historias-del-usuario.md`](docs/01-analisis-de-sistema/02-historias-del-usuario.md) | Catálogo HU-01–HU-70, sin perder identificadores originales | Completado |
| [`03-requisitos-funcionales.md`](docs/01-analisis-de-sistema/03-requisitos-funcionales.md) | RF-01–RF-99 con priorización, reglas y trazabilidad | Completado |
| [`04-atributos-de-calidad.md`](docs/01-analisis-de-sistema/04-atributos-de-calidad.md) | AC-01–AC-11 y objetivos verificables | Completado |
| [`05-restricciones.md`](docs/01-analisis-de-sistema/05-restricciones.md) | RC-01–RC-37 y límites comerciales, regulatorios y técnicos | Completado |
| [`06-drivers-arquitectonicos.md`](docs/01-analisis-de-sistema/06-drivers-arquitectonicos.md) | DA-01–DA-31, relación RF/AC/RC ↔ decisiones | Completado |
| [`07-decisiones-arquitectonicas.md`](docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md) | ADR-001–ADR-055 (ADR-011 reservado) con alternativas y estados | Completado |
| [`08-escenarios-atributos-calidad.md`](docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md) | EQ-01–EQ-31 con pruebas y métricas; resultados pendientes | Completado |

### 8.2. `docs/02-arquitectura-software/` — Arquitectura de Software
| Archivo | Propósito | Estado |
|---|---|---|
| [`arquitectura-inicial.md`](docs/02-arquitectura-software/arquitectura-inicial.md) | Modelo general, entornos y flujos prioritarios de Mentelyx | Completado |
| [`estilo-arquitectonico.md`](docs/02-arquitectura-software/estilo-arquitectonico.md) | Estilo monolito modular en tres capas y despliegue serverless-first | Completado |
| [`enfoque-arquitectonico.md`](docs/02-arquitectura-software/enfoque-arquitectonico.md) | Enfoque Clean Architecture, puertos/adaptadores y dirección de dependencias | Completado |
| [`componentes-arquitectonicos.md`](docs/02-arquitectura-software/componentes-arquitectonicos.md) | Vista de los 7 componentes principales del backend (`C01–C07`) | Completado |

### 8.3. `docs/03-diseño-de-software/` — Diseño Interno y Externo
| Subcarpeta / Archivo | Propósito | Estado |
|---|---|---|
| [`diseño-interno/principios-de-diseño.md`](docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md) | Aplicación de principios SOLID con diagramas por módulo (`M1–M7`) | Completado |
| [`diseño-interno/patrones-de-diseño.md`](docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md) | Patrones GoF y de integración (Repository, Adapter, Idempotent Receiver, Outbox, Ledger) | Completado |
| [`diseño-interno/diseño-interno-de-modulos.md`](docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md) | Estructura de código de `M1–M7`, vistas de paquetes y UML/TypeScript detallado de `M5` | Completado |
| [`diseño-externo/01-diseño-de-persistencia-y-datos.md`](docs/03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md) | Esquema ER en PostgreSQL + `pgvector`, colecciones MongoDB, claves Redis y R2 | Completado |
| [`diseño-externo/02-diseño-de-api-y-contratos.md`](docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md) | Endpoints REST `/api/v1/*`, payloads, idempotencia, webhooks y eventos de Queues | Completado |
| [`diseño-externo/03-diseño-de-interfaces-y-flujos.md`](docs/03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md) | Mapa de navegación Next.js Web/PWA, vistas por actor y salvaguardas de UI | Completado |

### 8.4. `docs/04-modelo-c4/` — Modelo C4 Completo (Niveles 1 al 4)
| Archivo | Propósito | Estado |
|---|---|---|
| [`Nivel1-DiagramadeContextodelSistema.md`](docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md) | Nivel 1: Actores, sistema central Mentelyx y proveedores externos | Completado |
| [`Nivel2-DiagramadeContenedores.md`](docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md) | Nivel 2: Web/PWA, Edge, API Hono/Workers, Queues y bases de datos | Completado |
| [`Nivel3-DiagramadeComponentes.md`](docs/04-modelo-c4/Nivel3-DiagramadeComponentes.md) | Nivel 3: Componentes `C01–C07` del backend, contratos y adaptadores | Completado |
| [`Nivel4-DiagramadeCodigo.md`](docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md) | Nivel 4: Paquetes `M1–M7`, SOLID y diagramas UML de clases y secuencia | Completado |

### Glosario breve

- **Hono:** framework TypeScript de API HTTP; **Better Auth:** biblioteca que integraríamos en el código para credenciales/sesiones; **RBAC/ABAC:** permisos por roles y contexto.
- **WebRTC/SFU:** comunicación audiovisual en tiempo real; **Queues/DLQ:** tareas y cola de fallidos, con posible redelivery; **Redis:** caché, no billetera ni base financiera.
- **RAG:** recuperación de documentos autorizados para responder; **outbox:** registro transaccional de eventos pendientes de publicar; **idempotencia:** evitar efectos duplicados ante reintentos.
