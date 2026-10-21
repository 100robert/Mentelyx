# 08. Escenarios de atributos de calidad — Mentelyx

> **Versión:** 1.6 (sincronización con actores v1.5) — revisión integral del análisis de Mentelyx (20 de octubre de 2026).  **Estado:** arquitectura de referencia definida; importes comerciales, cuotas y contratos sujetos a validación. No implica software ya desarrollado ni servicios contratados.


## 1. Cómo se interpretan las medidas

Cada escenario define fuente, estímulo, artefacto, ambiente, respuesta y medida; cifras **son objetivos propuestos y no resultados**. Los escenarios EQ-01 a EQ-23 se conservan de la base documental; EQ-24 a EQ-31 amplían la parte comercial actual.

### EQ-01 — AC-01 Rendimiento: consulta de contenido

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiantes concurrentes |
| Estímulo | Solicitan el catálogo publicado o el detalle de un curso. |
| Artefacto | API de catálogo, consultas de lectura y base de datos. |
| Entorno | Datos representativos; carga documentada de 100 usuarios virtuales durante 10 minutos, con patrón de uso reproducible. |
| Respuesta | Entregar contenido correcto, sin errores técnicos evitables. |
| Medida | **Propuesta:** p95 del tiempo de respuesta API ≤ 2 s, errores HTTP 5xx < 1 % en el escenario definido. |
| Tácticas | Índices, paginación, consulta optimizada y caché solo cuando los datos lo permitan. |
| Verificación | k6 o herramienta equivalente: distribución de latencias, throughput, tasa de errores y recursos. |

### EQ-02 — AC-02 Disponibilidad: falla de notificaciones

| Campo | Escenario propuesto |
|---|---|
| Fuente | Interrupción del servicio externo de notificaciones. |
| Estímulo | Un usuario consulta contenido o una reserva ya confirmada durante la falla. |
| Artefacto | API del negocio y adaptador de notificaciones. |
| Entorno | Integración de notificaciones simula timeout o error. |
| Respuesta | La lectura de datos ya confirmados continúa; la falla se registra sin bloquear el flujo no dependiente. |
| Medida | **Propuesta:** 100 % de los casos de prueba de lectura no dependiente pasan bajo falla simulada. Meta operativa futura de disponibilidad mensual ≥ 99,5 % pendiente de presupuesto y definición del alcance. |
| Tácticas | Timeouts, manejo de errores, aislamiento de la integración y reintentos controlados donde corresponda. |
| Verificación | Pruebas de integración con proveedor simulado y, luego, monitoreo de salud y disponibilidad. |

### EQ-03 — AC-03 Escalabilidad: aumento progresivo

| Campo | Escenario propuesto |
|---|---|
| Fuente | Mayor cantidad de estudiantes realizando actividades. |
| Estímulo | Aumentan gradualmente las solicitudes de lectura y evaluación. |
| Artefacto | Backend, persistencia y entrega de archivos. |
| Entorno | Ensayos escalonados de 50, 100 y 200 usuarios virtuales con proporción de operaciones y datos documentados. |
| Respuesta | Mantener comportamiento correcto e identificar el punto de saturación y el uso de recursos. |
| Medida | **Propuesta de aceptación inicial:** a 200 usuarios virtuales, p95 ≤ 3 s y errores 5xx < 1 %, sujeto al entorno acordado. Además registrar CPU, memoria, consultas y throughput. |
| Tácticas | Componentes sin estado innecesario, paginación, archivos distribuidos y medición antes de escalar. |
| Verificación | k6 por etapas y comparación de métricas. Los escenarios de 1 500 y 15 000 siguen como hipótesis futuras, no pruebas ya realizadas. |

### EQ-04 — AC-04 Seguridad: acceso ajeno a resultados

| Campo | Escenario propuesto |
|---|---|
| Fuente | Usuario sin sesión o estudiante autenticado diferente del propietario de los datos. |
| Estímulo | Solicita resultados o historial de otro estudiante. |
| Artefacto | Autenticación, autorización y endpoints de progreso. |
| Entorno | Pruebas de acceso sobre cuentas diferentes y rutas protegidas. |
| Respuesta | Denegar la operación sin filtrar datos ni alterar el historial. |
| Medida | 100 % de los casos de acceso indebido definidos deben resultar denegados (401/403 u otra respuesta segura documentada), sin revelar resultados. |
| Tácticas | Verificación de sesión y autorización por propietario de recurso en backend, controles de logging. |
| Verificación | Pruebas automatizadas de permisos, inspección de respuesta y auditoría. |

### EQ-05 — AC-05 Mantenibilidad: incorporación de un curso

| Campo | Escenario propuesto |
|---|---|
| Fuente | Administrador autorizado / equipo de desarrollo. |
| Estímulo | Se añade un curso en otra área o nivel o se reemplaza una estrategia de recomendación. |
| Artefacto | Catálogo académico y módulo de personalización. |
| Entorno | Repositorio modular con suite de pruebas existente. |
| Respuesta | Añadir cursos mediante gestión académica sin modificar la lógica de diagnóstico; cambiar recomendación sin acoplar dominio a un proveedor. |
| Medida | Las pruebas de regresión acordadas pasan y no se introducen dependencias del dominio hacia frameworks o proveedores; registrar archivos/módulos afectados. |
| Tácticas | Separación de responsabilidades, reglas de dependencia, interfaces y contratos. |
| Verificación | Revisión de arquitectura, pruebas unitarias e integración, inspección de dependencias. |

### EQ-06 — AC-06 Integridad: reserva y pagos repetidos (funcionalidad comercial futura)

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiantes que reservan simultáneamente y proveedor que repite una notificación de pago. |
| Estímulo | Varias solicitudes para últimos cupos y recepción repetida del mismo evento. |
| Artefacto | Reservas, pagos y almacenamiento transaccional. |
| Entorno | Pruebas de concurrencia, capacidad limitada y proveedor de pago simulado. |
| Respuesta | No confirmar sobrecupos ni duplicar efectos de un pago; mantener estado consistente ante fallas. |
| Medida | Confirmados ≤ cupos disponibles; el mismo evento verificado produce un solo efecto de negocio dentro de las pruebas definidas. |
| Tácticas | Transacciones, restricciones de unicidad, idempotencia, estados de reserva y recuperación. |
| Verificación | Pruebas concurrentes, repetición de eventos y comprobación de invariantes en base de datos. |

### EQ-07 — AC-07 Usabilidad: aprendizaje desde móvil

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiante. |
| Estímulo | Accede a un curso, realiza diagnóstico y consulta resultados desde teléfono. |
| Artefacto | Web responsive y PWA. |
| Entorno | Dispositivo móvil con navegador compatible; pruebas adicionales en escritorio. |
| Respuesta | Completar actividades sin pérdida de datos ni controles inutilizables por tamaño de pantalla. |
| Medida | **Propuesta:** al menos 4 de 5 participantes de una prueba guiada completan los flujos definidos sin asistencia; registrar barreras de interacción (no demuestra accesibilidad normativa). |
| Tácticas | Diseño mobile-first, navegación clara, formularios legibles, manejo de estados. |
| Verificación | Prueba de tareas con usuarios y revisión manual en dispositivos y tamaños variados. |

### EQ-08 — AC-08 Interoperabilidad: contrato externo

| Campo | Escenario propuesto |
|---|---|
| Fuente | Cliente web o proveedor externo de pago/notificaciones. |
| Estímulo | Recibe una respuesta válida, inválida o fuera de plazo en una integración. |
| Artefacto | API REST y adaptadores de integración. |
| Entorno | Contratos versionados y proveedor simulado. |
| Respuesta | Validar datos, responder conforme al contrato y manejar fallos sin propagar formatos del proveedor al dominio. |
| Medida | 100 % de casos de contrato definidos aprueban en el entorno de prueba, incluyendo errores esperados. |
| Tácticas | Esquemas versionados, DTO, validación, puertos y adaptadores. |
| Verificación | Pruebas de contrato HTTP y dobles de proveedor; posterior OpenAPI. |

### EQ-09 — AC-09 Testabilidad: motor de recomendaciones

| Campo | Escenario propuesto |
|---|---|
| Fuente | Equipo de desarrollo. |
| Estímulo | Ejecuta pruebas de recomendación a partir de diagnósticos conocidos. |
| Artefacto | Casos de uso de perfil y recomendación. |
| Entorno | Suite local/CI sin red, proveedor externo ni base de datos real. |
| Respuesta | Ejecutar las reglas con repositorios y servicios sustituidos por dobles de prueba. |
| Medida | 100 % de los casos de prueba críticos definidos ejecutan y pasan en aislamiento; documentar entradas y resultados esperados. |
| Tácticas | Inyección de dependencias, interfaces y pruebas deterministas. |
| Verificación | Pruebas unitarias automáticas con resultados reproducibles. |

### EQ-10 — AC-10 Operabilidad: consumo y alertas de costo

| Campo | Escenario propuesto |
|---|---|
| Fuente | Aumento de solicitudes IA, minutos de videoconferencia o reproducciones. |
| Estímulo | El consumo acumulado se acerca a un presupuesto operativo configurado. |
| Artefacto | Medición de uso, adaptadores de proveedores, tablero administrativo. |
| Entorno | Tráfico de prueba con costos unitarios simulados y alertas habilitadas. |
| Respuesta | Registrar consumos agregados, alertar al administrador y aplicar cuotas autorizadas de IA sin bloquear otras actividades permitidas. |
| Medida | **Propuesta:** 100 % de eventos de cruce de umbral definidos generan alerta verificable; las pruebas comprueban que una cuota agotada bloquea nuevas consultas pagadas y no bloquea catálogo autorizado. |
| Tácticas | Medición por servicio, límites, presupuestos, etiquetas de costo, métricas agregadas y alertas. |
| Verificación | Tests de escenarios de consumo y comparación mensual con facturas de proveedor. |

### EQ-11 — AC-11 Confiabilidad pedagógica: RAG autorizado

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiante con determinado plan y docente que retira permiso de indexación. |
| Estímulo | Se pregunta al tutor IA por un contenido restringido o posteriormente despublicado. |
| Artefacto | Licencias de contenido, búsqueda vectorial, controles ACL y tutor IA. |
| Entorno | Corpus controlado con documentos públicos, restringidos y revocados. |
| Respuesta | Recuperar exclusivamente fuentes vigentes y autorizadas; citar las empleadas o indicar ausencia de material suficiente. |
| Medida | 0 fragmentos sin autorización en el conjunto de pruebas adversariales definido; 100 % de documentos revocados excluidos del índice consultable tras la desindexación confirmada. |
| Tácticas | Filtrado por audiencia/versión antes de recuperación, auditoría y desindexación, revisión de material, citas. |
| Verificación | Pruebas de seguridad del corpus y recuperación; revisión docente de respuestas de una muestra. |

### EQ-12 — AC-07 y AC-04 Experiencia publicitaria no intrusiva

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiante Gratuito, Plus, Pro o docente habilitado. |
| Estímulo | Abre una pantalla educativa o publica una actividad. |
| Artefacto | Componente de anuncios y reglas de elegibilidad por contexto. |
| Entorno | Pruebas de interfaz en niveles educativos y planes distintos. |
| Respuesta | Mostrar anuncio identificable únicamente donde esté permitido; ninguno en evaluación, clase en vivo, editor, lección pagada o liquidación. |
| Medida | **Propuesta:** 0 anuncios en superficies prohibidas en el 100 % de los casos de pruebas de interfaz; 0 consultas al perfil de rendimiento para segmentación publicitaria. |
| Tácticas | Componente aislado, lista positiva de ubicaciones, categorías aprobadas, pruebas automáticas de UI, controles de privacidad. |
| Verificación | Playwright/E2E, revisión de tráfico y políticas publicitarias. |

### EQ-13 — AC-06 Consistencia de comisiones y liquidaciones

| Campo | Escenario propuesto |
|---|---|
| Fuente | Variación de política comercial y pagos de clases grupales. |
| Estímulo | Se modifica una comisión después de haber vendido entradas y se recibe un webhook duplicado. |
| Artefacto | Ledger financiero, pagos, contratos y liquidaciones. |
| Entorno | Reglas versionadas, pagos de prueba y repeticiones. |
| Respuesta | Aplicar una sola vez efectos económicos de cada operación y conservar reglas históricas para sus liquidaciones. |
| Medida | 0 duplicados de cobro/abono en pruebas; suma de distribución y conceptos de costos coincide con la regla aplicada para todos los casos. |
| Tácticas | Transacciones SQL, idempotencia, estados, versión de comisión, reconciliación. |
| Verificación | Tests unitarios y de integración con webhooks repetidos y escenarios de cambio de tarifa. |

### EQ-14 — AC-01, AC-02 y AC-03 Videoclase en vivo

| Campo | Escenario propuesto |
|---|---|
| Fuente | Docente e inscritos en clase en vivo. |
| Estímulo | Inician una transmisión magistral o una tutoría interactiva con cupos definidos. |
| Artefacto | Servicio audiovisual gestionado, tokens de sesión, API y monitoreo. |
| Entorno | Piloto con sala interactiva de 10–20 participantes y clase magistral de 100 espectadores, sin extrapolar automáticamente a 1.500 concurrentes. |
| Respuesta | Permitir entrada solo a participantes autorizados, registrar inicio/finalización y aislar fallos del audiovisual respecto de otras consultas académicas. |
| Medida | **Propuesta:** 100 % de pruebas de acceso indebido denegadas; latencia, rebuffering, calidad y costo por minuto-participante registrados; umbrales comerciales se fijarán tras el piloto. |
| Tácticas | Token de corta duración, SFU para interacción, broadcast para audiencia masiva, CDN, degradación y alertas. |
| Verificación | Sesiones piloto con redes móviles/peruanas, monitoreo del proveedor y revisión de costos. |

> **Aclaración v1.3:** capacidad inicial objetivo: 35 estudiantes y 1 docente mediante SFU administrado. Validación aún pendiente.

### EQ-15 — AC-01, AC-03 y AC-06: simulacro concurrente sin pérdida de respuestas

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiantes que presentan simultáneamente un simulacro vinculado a una ficha de examen. |
| Estímulo | Cien participantes de prueba inician, envían respuestas y finalizan dentro del tiempo configurado. |
| Artefacto | Evaluaciones y Aprendizaje, temporizador del servidor, API, PostgreSQL y preguntas referenciadas por versión. |
| Entorno | **Piloto propuesto**, 100 estudiantes virtuales, 30 minutos, conjunto fijo de preguntas y tráfico documentado; no equivale a 1.500 usuarios simultáneos ya soportados. |
| Respuesta | Registrar intentos, conservar todas las respuestas aceptadas y calcular la puntuación según la versión de examen; rechazar entregas fuera de las reglas temporales. |
| Medida | **Objetivo por validar:** p95 de operaciones de guardado ≤ 3 s y errores 5xx < 1 %; **0 respuestas confirmadas perdidas y 0 intentos asociados a un estudiante distinto** en la muestra. |
| Tácticas | Transacciones e índices, operaciones idempotentes cuando corresponda, fecha/hora de servidor, persistencia por intento y simulación de concurrencia. |
| Verificación | Prueba k6 de 100 sesiones, auditoría de intentos persistidos, revisión de resultados/versiones y casos de reconexión. |

### EQ-16 — AC-05, AC-09 y AC-11: plan de preparación reproducible

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiante que agrega un objetivo y posteriormente completa un nuevo diagnóstico. |
| Estímulo | Se calcula un plan por temario y luego se actualizan prioridades ante nueva evidencia de desempeño. |
| Artefacto | Motor de planificación, perfil académico, fichas de examen y planes versionados. |
| Entorno | Datos controlados: temario fijo, historial ficticio y algoritmo de priorización versionado. |
| Respuesta | Producir un plan acorde con temas, dificultad y tiempo disponible; actualizarlo sin eliminar su versión anterior. |
| Medida | **Propuesta:** para iguales datos y versión de reglas, 100 % de las ejecuciones de prueba producen igual resultado; en 100 % de los casos de modificación se preserva al menos la versión anterior del plan. |
| Tácticas | Algoritmos deterministas, contratos de dominio, historial de revisiones, pruebas unitarias sin proveedor LLM. |
| Verificación | Fixtures y pruebas unitarias repetidas, inspección de datos y trazabilidad del motivo de cambios. |

### EQ-17 — AC-04 y AC-11: fichas de examen verificables y protegidas

| Campo | Escenario propuesto |
|---|---|
| Fuente | Administrador que actualiza un temario; usuario sin permiso que intenta editarlo o consultar el avance ajeno. |
| Estímulo | Se publica una nueva versión de ficha referencial o verificada; se comprueban acceso y procedencia. |
| Artefacto | Catálogo de fichas, temarios, objetivos y resultados con identificadores estables. |
| Entorno | Dos cuentas de estudiantes, una de administración autorizada y fichas con fuentes verificables y otras referenciales. |
| Respuesta | Restringir cambios a autorizados, etiquetar la procedencia con claridad, preservar versión de intentos antiguos y denegar consulta de objetivos ajenos. |
| Medida | **Propuesta:** 100 % de intentos no autorizados denegados; 0 fichas etiquetadas como verificadas sin fuente registrada; 100 % de intentos históricos conservan versión de la ficha aplicada. |
| Tácticas | RBAC/ABAC por recurso, autoría y versiones en fuente transaccional, validaciones editoriales, registro de auditoría. |
| Verificación | Tests de autorización, control editorial y migración entre versiones de fichas. |

### EQ-18 — AC-07: realización móvil de un plan y simulacro

| Campo | Escenario propuesto |
|---|---|
| Fuente | Estudiante que utiliza Mentelyx desde un teléfono compatible. |
| Estímulo | Selecciona un examen, consulta el plan, resuelve una práctica y revisa el progreso. |
| Artefacto | Web/PWA, formularios, temporizador, navegación por temario y panel de resultados. |
| Entorno | Dispositivos y tamaños de pantalla representativos; conectividad móvil variable durante una prueba guiada. |
| Respuesta | Poder completar los flujos sin texto inaccesible, pérdida de intentos confirmados o controles imposibles de activar. |
| Medida | **Propuesta:** 4 de 5 participantes completan las tareas sin asistencia; registrar explícitamente incidencias de reconexión, persistencia y comprensión del progreso. |
| Tácticas | Diseño mobile-first, retroalimentación de guardado, estado de progreso claro y manejo explícito de pérdida de conectividad. |
| Verificación | Sesiones con usuarios, pruebas E2E y revisión en navegadores/dispositivos diferentes. |

## Seguimiento de evidencia

| Código | Estado inicial |
|---|---|
| EQ-01 a EQ-09 | **Propuesto, no validado**. Actualizar al implementar cada capacidad y realizar sus ensayos. |
| EQ-10 a EQ-14 | **Propuesto por ampliación comercial/audiovisual/IA**, no validado. Requiere funcionalidades y entorno de prueba. |
| **EQ-15 a EQ-18** | **Propuesto para RF-49 a RF-52**, no validado. Las cifras deben someterse a prueba de carga y evaluación de uso, sin atribuir respaldo institucional a fichas referenciales. |


## Escenarios 20-10-2026: disponibilidad, registro y Studio

### EQ-19 — AC-02 / AC-10: falla de API o Worker

| Campo | Escenario de aceptación propuesto |
|---|---|
| Fuente / estímulo | Monitor externo detecta 3 comprobaciones fallidas consecutivas de `/health/ready` o p95 de API > 1s durante 10 min. |
| Artefacto / entorno | API Hono sobre Workers, pruebas staging con falla inyectada sin afectar producción. |
| Respuesta | Alerta al operador; rutas no afectadas continúan; se restaura la implementación o se revierte el despliegue cuando la causa es un release. |
| Medida | Detección ≤ 5 min en ensayos; documentar RTO real; meta orientativa disponibilidad mensual ≥ 99,5 %, **no SLA garantizado**. |
| Verificación | Monitores sintéticos y simulación de fallo/rollback, incluyendo reporte de latencias, incidentes y causa. |

### EQ-20 — AC-02 / AC-06: PostgreSQL o MongoDB indisponible

| Campo | Escenario de aceptación propuesto |
|---|---|
| Fuente / estímulo | Se corta la conectividad a PostgreSQL/MongoDB durante un guardado de progreso o recurso Studio. |
| Artefacto / entorno | Adaptadores SQL/NoSQL, registro de operaciones confirmadas y caché local de borradores. |
| Respuesta | Timeout y mensaje controlado, no emitir confirmación falsa, reintentos acotados; al restablecerse la conexión, sincronización idempotente y conciliación. |
| Medida | **Cero guardados falsamente confirmados** en casos de prueba; ningún resultado de evaluación previamente confirmado se sobrescribe. Medir RTO real de proveedor. |
| Verificación | Interrupción de red controlada, consulta de último estado confirmado, trazas y ensayo de reconciliación. |

### EQ-21 — AC-02 / AC-06: copia de seguridad y restauración

| Campo | Escenario de aceptación propuesto |
|---|---|
| Fuente / estímulo | Fallo o borrado accidental en un entorno de ensayo. |
| Artefacto / entorno | Backups de PostgreSQL y MongoDB; inventario R2; registro de versiones/documentos relacionados. |
| Respuesta | Ejecutar restauración **en entorno aislado**, validar integridad y consistencia, y autorizar recuperación real solo con procedimiento. |
| Medida | Restauración trimestral probada; registrar RTO y RPO observados, checksums/integridad, discrepancias SQL/NoSQL. |
| Verificación | Runbook, evidencia de prueba, captura métricas, checksum de registros y comparación de versiones. |

### EQ-22 — AC-04: tres cuentas públicas, dos modalidades docentes y acreditaciones

| Campo | Escenario de aceptación propuesto |
|---|---|
| Fuente / estímulo | Adulto se registra como Docente (libre o por nivel) y solicita impartir tutoría remunerada; estudiante universitario adulto solicita permiso adicional y otro Estudiante sube archivo. |
| Artefacto / entorno | Better Auth (si se valida), RBAC/atributos, registros de verificación y recursos. |
| Respuesta | Docente puede usar el editor manual de Studio según los límites vigentes; tutoría remunerada denegada si falta habilitación; solo la modalidad Docente por nivel permite solicitar acreditación académica verificable; estudiante tutor autorizado sigue siendo Estudiante. |
| Medida | 100 % de pruebas negativas de acceso indebido denegadas; toda inscripción conserva tipo principal; ninguna cuenta de menor como Creador/Docente ni tutor remunerado. |
| Verificación | Pruebas de registro, rutas API, propiedad de materiales y estados de credenciales. |

### EQ-23 — AC-01 / AC-07: experiencia de Studio con pérdida de conexión

| Campo | Escenario de aceptación propuesto |
|---|---|
| Fuente / estímulo | El autor edita una presentación y se desconecta temporalmente. |
| Artefacto / entorno | Next.js, IndexedDB/estado local, API, versión MongoDB y propietario en PostgreSQL. |
| Respuesta | Seguir editando donde sea posible, indicar cambios pendientes, sincronizar cuando vuelva conexión sin destruir versiones confirmadas. |
| Medida | Ningún cambio marcado como «guardado remoto» sin ACK persistente; completar prueba de pérdida y retorno de conectividad con 5 casos. |
| Verificación | Pruebas e2e offline/online en móvil de gama media y escritorio; seguimiento de versiones. |

**No confundir objetivos con prestaciones contratadas:** si la caída es regional y tanto la única PostgreSQL como MongoDB están en esa región sin secundarias contratadas, EQ-19 a EQ-21 no prueban continuidad total.


## Complemento transversal v0.9 — Redis
Redis se adopta como caché temporal y mecanismo de contadores de limitación de solicitudes. No modifica los RF/HU ni sus identificadores originales: es una decisión de infraestructura trazada a rendimiento, seguridad y disponibilidad. Ante su fallo, las lecturas públicas podrán usar origen con protección de carga; las operaciones sensibles deben mantener autorización y límites seguros. Ver `14-redis-cache-y-resiliencia.md`.

## 2. Nuevos escenarios (EQ-24 a EQ-31)

### EQ-24 — AC-06 y AC-10: compra Live y movimientos de créditos

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Dos intentos simultáneos del mismo estudiante y webhook repetido de su suscripción. |
| Artefacto | PostgreSQL / suscripciones y reservas |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | 1 suscripción produce exactamente 4 créditos Live; se impide reserva que exceda saldo; evento duplicado no aplica dos veces; 0 sobrecupos en ensayos. |
| Verificación | Simular 100 reintentos/dobles webhooks con transacciones y revisar ledger SQL. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-25 — AC-06 y AC-10: liquidación contractual de docente

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Clase con 3 alumnos de 2 créditos cada uno, luego cambio de tarifa contractual. |
| Artefacto | Pago a tutores y ledger |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | Pago por política original versionada: si tarifa candidata S/8/crédito y 6 créditos válidos, liquidación prevista S/48; cambio posterior no altera compromiso previo. |
| Verificación | Probar cierre de clase, ausencias, cancelación, cambio de precio e idempotencia. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-26 — AC-01, AC-02 y AC-03: 35+1 participantes por aula

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Docente abre sesión y 35 estudiantes autorizados entran desde redes diferentes; 36º alumno solicita cupo adicional. |
| Artefacto | RealtimeKit/WebRTC + reserva SQL |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | Aforo ≤35 alumnos, acceso no autorizado denegado, duración/latencia/jitter/reconexiones registrados; carga/costo por minuto-participante medidos; umbrales audiovisuales finales tras piloto. |
| Verificación | Prueba con emulación 36 clientes y, después, móviles reales en redes representativas. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-27 — AC-07 y AC-10: edición y cuotas Studio

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Docente modifica 10 gráficos manuales y luego solicita presentación IA con crédito limitado. |
| Artefacto | Studio/API IA/ledger Studio |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | 10 cambios manuales consumen 0 créditos de IA; cada generación válida usa la tarifa mostrada exactamente una vez; resultados de costos registrados sin PII. |
| Verificación | Automatizar prueba de saldo y UI; repetir entrega y reembolso por error elegible. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-28 — AC-10: margen negativo detectado y bloqueado

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Docente ofrece clase individual a S/8 con pasarela de comisión mínima y costos superiores al margen. |
| Artefacto | Motor de reglas comerciales |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | Antes de publicar: precio, tarifa docente, pasarela, audio/video, impuestos y margen visible; se bloquea oferta no viable salvo patrocinio/presupuesto explícito. |
| Verificación | Pruebas con 1, 3, 5 y 35 inscritos, venta directa y suscripción; escenarios costo multiplicado. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-29 — AC-02 y AC-06: fallo de Redis

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Redis no responde al consultar contenido y se intenta consumir créditos de Live. |
| Artefacto | Redis/cache + API |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | Lecturas no sensibles pueden degradar a BD con control de carga; créditos y permisos siguen comprobándose en PostgreSQL; operación sensible con rate limit no debe quedar sin control. |
| Verificación | Cortar conexión Redis durante test; verificar registros, latencia y ausencia de dobles consumos. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-30 — AC-02 y AC-10: agotamiento de IA durante Studio

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | El suscriptor Pro consume su última cuota y luego realiza nueva solicitud. |
| Artefacto | API IA y ledger Studio |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | La solicitud adicional se rechaza sin cargo ni sobrecoste imprevisto; UI explica saldo; editor manual sigue operativo. |
| Verificación | Test de concurrencia, presupuesto, límites por operación, reembolsos y error de proveedor. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

### EQ-31 — AC-02, AC-06 y AC-10: conciliación tras estado de pago incierto

| Campo | Especificación propuesta |
|---|---|
| Fuente / estímulo | Pasarela tarda, responde timeout y envía webhooks repetidos. |
| Artefacto | PaymentPort, PostgreSQL y outbox |
| Entorno | Sandbox/prototipo con datos ficticios, costos configurados y trazas auditables. |
| Respuesta y medida | Orden permanece pendiente hasta verificación; no se emite nuevo cargo con clave nueva por timeout; 0 duplicados en pruebas; revisión de DLQ y conciliación. |
| Verificación | Repetir webhooks, fallos de red y reinicios del Worker; comparar estado local/proveedor. |
| Estado | Pendiente de ejecución y evidencia; no afirmar cumplimiento. |

## 3. Matriz de evidencia por escenario

| Escenarios | Evidencia necesaria | Estado |
|---|---|---|
| EQ-01–EQ-05, EQ-07–EQ-09 | Pruebas de carga, autorizaciones, UX, contratos y suite CI | Pendiente |
| EQ-06, EQ-13, EQ-24, EQ-25, EQ-31 | Pruebas SQL de concurrencia, pagos, ledger e idempotencia | Pendiente |
| EQ-10, EQ-27, EQ-28, EQ-30 | Métricas de tokens/costo/planes y simulaciones peor caso | Pendiente |
| EQ-14, EQ-26 | SFU real con 35+1, ancho de banda, reconexiones, uso moderado y costo | Pendiente |
| EQ-19–EQ-23, EQ-29 | Caídas de proveedores, backups/restauraciones, desconexión Studio y Redis | Pendiente |
| EQ-15–EQ-18 | Simulacros, preparación, derechos, UX móvil y verificación de fuentes | Pendiente |

## 4. Política de aceptación

Una medición se aprueba solo al registrar: fecha, commit, entorno, número de usuarios/aulas, datos de prueba, capturas/logs anonimizados, tasa de éxito, costo asociado y responsable. *Disponibilidad 99,5 %*, créditos y precios son metas/políticas de diseño hasta que la operación y el marco comercial los sustenten.
