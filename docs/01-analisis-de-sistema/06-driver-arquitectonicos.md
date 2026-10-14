# 06. Drivers arquitectónicos — Mentelyx

## Propósito

Un driver arquitectónico es un **requisito, atributo de calidad o restricción que cambia de forma significativa el diseño de la solución**. Los drivers derivan de `03-requisitos-funcionales.md`, `04-atributos-de-calidad.md` y `05-restricciones.md`; **no son decisiones técnicas** ni sustituyen los escenarios medibles.

El alcance abarca el **producto completo**; la prioridad de implementación se definirá por sprint. Un driver comercial puede ser importante para la arquitectura futura sin requerir implementación en el MVP educativo.

## Drivers identificados

| ID | Driver | Origen | Influencia arquitectónica |
|---|---|---|---|
| **DA-01** | Crecimiento de estudiantes, docentes, contenidos y solicitudes. | AC-03; RF-05, RF-10 | Capacidad, distribución de recursos, almacenamiento y despliegue. |
| **DA-02** | Tiempos de respuesta adecuados en consultas y actividades bajo carga documentada. | AC-01; RF-05, RF-09, RF-11 | Diseño de consultas, caché selectiva, tareas de procesamiento y medidas de carga. |
| **DA-03** | Control de identidad, permisos y acceso a información académica y económica por recurso. | RF-02, RF-03, RF-04, RF-11, RF-31; AC-04; RC-07, RC-08 | Autenticación, autorización en backend, registros y protección de datos. |
| **DA-04** | Pagos externos para tutorías y suscripciones, con resultados verificables. | RF-26, RF-27; RC-05; AC-08 | Puerto/adaptador de pagos, contratos, fallos e integración. |
| **DA-05** | Evolución modular de cursos, reglas pedagógicas y políticas de negocio. | RF-05, RF-06, RF-08, RF-12, RF-15; AC-05, AC-09 | Separación de responsabilidades, dependencias y límites de módulos. |
| **DA-06** | Consistencia de resultados académicos, reservas, cupos y operaciones económicas. | RF-07, RF-11, RF-22, RF-23, RF-27, RF-28; AC-06 | Transacciones, validaciones, idempotencia y control de concurrencia. |
| **DA-07** | Continuidad de funciones esenciales ante interrupciones en integraciones no críticas. | AC-02; RF-05, RF-11, RF-24, RF-30 | Aislamiento de fallos, timeouts y desacoplamiento de notificaciones. |
| **DA-08** | Independencia de cuentas estudiantiles frente a instituciones y convenios. | RF-01, RF-15, RF-16, RF-17; RC-03, RC-04 | Separación entre identidades, elegibilidad y beneficios. |
| **DA-09** | Administración inicial sencilla y evolución a permisos delegados. | RF-03, RF-04; RC-06; AC-04 | Control de permisos, trazabilidad administrativa y operación de bajo esfuerzo. |
| **DA-10** | Un solo canal web mobile-first, instalable como PWA con identidad compartida. | RF-33, RF-34; AC-07; RC-01 | Organización de frontend, comunicación API y actualización de cliente. |
| **DA-11** | Perfil individual y personalización de aprendizaje para distintas áreas y niveles. | RF-05, RF-07, RF-08, RF-09, RF-11; AC-05, AC-06, AC-09 | Separación del perfil, evaluación y motor de recomendaciones; posibilidad de sustituir estrategias sin rehacer módulos académicos. |
| **DA-12** | Integraciones verificables y casos de uso probables sin proveedores reales. | AC-08, AC-09; RF-26, RF-27, RF-30 | Contratos explícitos, puertos/adaptadores, dobles de prueba y validaciones automatizadas. |
| **DA-13** | Costos medibles y menor administración para operar Mentelyx comercialmente. | AC-10; RF-43, RF-44; objetivo empresarial de eficiencia operacional | Serverless y servicios administrados donde sean convenientes; presupuestos, alertas y cálculo del costo unitario por uso. |
| **DA-14** | Distribuir videos grabados, clases magistrales uno-a-muchos y tutorías interactivas a escala. | RF-36, RF-37, RF-45, RF-47, RF-48; AC-01, AC-02, AC-03, AC-07 | Separación entre streaming/CDN, WebRTC-SFU y backend; sesiones, tokens y políticas de grabación. |
| **DA-15** | Tutor pedagógico con IA y RAG sujeto a derechos, calidad y cuotas. | RF-35, RF-41, RF-42, RF-43; AC-04, AC-10, AC-11; RC-11, RC-12 | Corpus versionado y con ACL, búsqueda vectorial, LLM intercambiable y límites de consumo; evaluación no dependiente del LLM. |
| **DA-16** | Financiar plan gratuito y visibilidad docente sin publicidad intrusiva. | RF-39, RF-40; AC-04, AC-07; RC-10, RC-15 | Módulo separado de anuncios, elegibilidad por plan/ubicación, sin datos académicos privados. |
| **DA-17** | Gestionar derechos de contenidos, contratos editoriales y desindexación verificable. | RF-35, RF-41, RF-45, RF-46; AC-04, AC-11; RC-11, RC-12, RC-13 | Licencias y versiones, estados de autorización, revocación, auditoría y borrado del índice de recuperación. |
| **DA-18** | Rentabilizar tutorías y clases docentes mediante comisiones y liquidaciones auditables. | RF-21 a RF-29, RF-36 a RF-38, RF-44; AC-06, AC-10; RC-05, RC-14 | Modelo de precios, estados contractuales, procesamiento idempotente, desglose contable por transacción y métricas de costo por sesión. |

**Cambios frente al borrador:** se conservan DA-01 a DA-10, se ajusta su origen a los RF vigentes y DA-11 y DA-12 se mantienen de la revisión anterior; se incorporan DA-13 a DA-18 para costo operativo, video, tutor de IA, publicidad, derechos de contenidos y monetización docente. Las selecciones de proveedores se documentan en ADR, no aquí.

## Priorización preliminar de drivers

| Prioridad | Drivers | Fundamento |
|---|---|---|
| **Crítica** | DA-03, DA-06, DA-11 | Privacidad/autorización, integridad y valor central del aprendizaje adaptativo. |
| **Alta** | DA-02, DA-05, DA-07, DA-08, DA-10, DA-12 | Desempeño de las funciones principales, evolución, continuidad, independencia institucional, experiencia web y pruebas/integraciones. |
| **Condicionada al crecimiento** | DA-01 | El dimensionamiento necesita datos de carga y presupuesto. |
| **Alta para el producto comercial; posterior en el MVP académico** | DA-04 | Pagos obligan a integración segura cuando entren en alcance. |
| **Media inicialmente** | DA-09 | Administración simple al inicio, sin perder posibilidad de delegación. |
| **Alta al abrir servicios comerciales** | DA-13, DA-14, DA-15, DA-16, DA-17, DA-18 | Control de gastos, video, privacidad editorial y márgenes docentes; no significa implementar todo durante el primer sprint. |

La prioridad arquitectónica no equivale a la fecha de implementación. Por ejemplo, DA-04 debe modelarse desde el análisis, pero las integraciones de pagos pueden planificarse para una fase posterior.

## Trazabilidad hacia decisiones

Cada decisión posterior debe registrar: **ID, estado (propuesta/aceptada), contexto, drivers, alternativas, elección, ventajas, costos o trade-offs, consecuencias y verificación**.

| Driver | Candidatos de decisión a evaluar |
|---|---|
| DA-01, DA-02 | Almacenamiento de archivos separado y políticas de caché justificadas por medición |
| DA-03, DA-09 | Autenticación y autorización backend por roles, permisos y propiedad del recurso |
| DA-04, DA-06, DA-12 | Adaptadores de proveedores, procesamiento idempotente y consistencia transaccional |
| DA-05, DA-11, DA-12 | Monolito modular, Clean Architecture, frontera del motor de recomendaciones y pruebas aisladas |
| DA-07 | Aislamiento de notificaciones y controles de fallos en dependencias |
| DA-08 | Identidad independiente de convenios/beneficios |
| DA-10 | Una única web responsive/PWA sobre API documentada |
| DA-13 | Cloud administrado, telemetría y presupuestos; evaluar TCO y cuotas reales |
| DA-14 | Streaming grabado / broadcast / SFU, salas y contratos por sesión |
| DA-15, DA-17 | RAG con controles editoriales, licencias, indexación y retirada |
| DA-16 | Publicidad separada de actividades educativas y de datos privados |
| DA-18 | Ledger de comisiones, idempotencia, liquidaciones por reglas versionadas |

## Nota sobre ADR existentes

El archivo de origen incluía decisiones **ADR-001 a ADR-010 y ADR-012**. Se trasladan sin renumerarlas a `07-decisiones-arquitectonicas.md`. **ADR-011 no figuraba en el archivo recibido**; su posible existencia en el repositorio se debe verificar antes de asignar ese código a una decisión nueva. La elección de proveedor serverless, streaming, caché y comisiones queda sujeta a pruebas y validación comercial, tal como se indica en las ADR. Un driver describe por qué necesitamos una solución; no determina por sí solo una marca.
