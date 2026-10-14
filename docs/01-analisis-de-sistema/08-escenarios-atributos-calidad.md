# 08. Escenarios medibles de atributos de calidad — Mentelyx

## Criterios de lectura

Cada escenario explicita **fuente, estímulo, artefacto, entorno, respuesta y medida**, más tácticas y verificación. Las medidas numéricas son **hipótesis iniciales para validar con el docente y con pruebas**: no constituyen evidencia de cumplimiento. Las pruebas del MVP utilizarán los módulos efectivamente implementados; se declaran los escenarios comerciales futuros por trazabilidad.

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

## Seguimiento de evidencia

| Código | Estado inicial |
|---|---|
| EQ-01 a EQ-09 | **Propuesto, no validado**. Actualizar al implementar cada capacidad y realizar sus ensayos. |
| EQ-10 a EQ-14 | **Propuesto por ampliación comercial/audiovisual/IA**, no validado. Requiere funcionalidades y entorno de prueba. |
