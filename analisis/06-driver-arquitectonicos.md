# Drivers Arquitectónicos

## Mentelyx

Los drivers arquitectónicos son los requisitos, atributos de calidad y restricciones que influyen de manera significativa en las decisiones de arquitectura.

Se identifican a partir del análisis previo del sistema.

| ID | Driver arquitectónico | Origen | ¿Por qué influye en la arquitectura? |
|---|---|---|---|
| DA-01 | El sistema debe soportar el crecimiento de estudiantes, docentes y solicitudes. | AC-03 — Escalabilidad | Influye en la capacidad de procesamiento, almacenamiento y estrategia de despliegue. |
| DA-02 | El sistema debe mantener tiempos de respuesta adecuados durante el uso simultáneo de contenidos y actividades educativas. | AC-01 — Rendimiento | Influye en la forma de consultar información, procesar solicitudes y distribuir los recursos educativos. |
| DA-03 | El sistema debe proteger la información y controlar el acceso según los permisos de cada usuario. | RF-03, RF-04; AC-04 — Seguridad; RC-08 — Comunicación segura | Influye en la autenticación, autorización y protección de las comunicaciones y los datos. |
| DA-04 | El sistema debe integrarse con un servicio externo para procesar pagos de suscripciones y tutorías. | RF-26, RF-27; RC-05 — Servicio externo de pagos | Condiciona la comunicación con proveedores externos y el tratamiento de los resultados de pago. |
| DA-05 | El sistema debe permitir modificar funcionalidades y políticas comerciales sin afectar innecesariamente otras partes. | AC-05 — Mantenibilidad; RF-12, RF-15, RF-28 | Influye en la separación de responsabilidades, modularidad y dependencias internas. |
| DA-06 | El sistema debe mantener la consistencia de cupos, reservas, pagos y liquidaciones docentes. | RF-22, RF-23, RF-27, RF-28; AC-06 — Integridad y consistencia | Influye en la coordinación de operaciones, el almacenamiento de estados y el control de solicitudes simultáneas o repetidas. |
| DA-07 | El sistema debe mantener disponibles las funciones educativas que no dependan de un servicio externo temporalmente interrumpido. | AC-02 — Disponibilidad; RF-30 | Influye en la separación de las funciones principales y las integraciones, así como en el tratamiento de fallos. |
| DA-08 | El sistema debe mantener cuentas personales independientes de los convenios institucionales. | RF-01, RF-15, RF-16, RF-17; RC-03, RC-04 | Influye en la separación entre identidad del estudiante, convenios y beneficios, evitando que la cuenta dependa de una institución. |
| DA-09 | El sistema debe poder operar con una administración inicial a cargo del propietario y permitir delegación posterior. | RF-03; RC-06 — Administración inicial | Influye en la gestión de permisos y en la complejidad operativa de la solución. |
| DA-10 | El sistema debe ofrecer una experiencia educativa mediante una aplicación web responsive e instalable como PWA. | RF-33, RF-34; AC-07 — Usabilidad; RC-01 — Aplicación web instalable como PWA. | Influye en la organización del frontend, su adaptación a distintos dispositivos y los mecanismos de instalación y actualización de la aplicación. |

## Priorización

| Prioridad | Drivers | Motivo |
|---|---|---|
| Crítica | DA-03, DA-06 | Protegen la información y la coherencia de las operaciones académicas y económicas. |
| Alta | DA-04, DA-05, DA-07, DA-08, DA-09 | Permiten integrar pagos, mantener el sistema, conservar la disponibilidad y operar conforme al modelo de negocio. |
| Media | DA-01, DA-02 | Orientan la capacidad y el rendimiento de acuerdo con el crecimiento esperado. |

La prioridad media no significa que el rendimiento o la escalabilidad puedan ignorarse. Indica que su dimensionamiento debe ajustarse a la demanda prevista y a los recursos disponibles.

## Relación con las decisiones arquitectónicas

Las decisiones arquitectónicas se definirán a partir de estos drivers.

Cada decisión deberá identificar:

- La decisión seleccionada.
- El driver o los drivers relacionados.
- La justificación.
- El resultado esperado en la estructura del sistema.

La distribución entre el monolito modular y las capacidades serverless se justificará en esa etapa.

## Decisiones arquitectónicas

A partir de los drivers identificados, se establecen las decisiones iniciales de arquitectura de Mentelyx.

Cada decisión se identifica mediante un código ADR, correspondiente a un Registro de Decisión Arquitectónica.

| ID | Decisión arquitectónica | Driver relacionado | Justificación | Resultado |
|---|---|---|---|---|
| ADR-001 | Organizar el backend como un monolito modular. | DA-05 — Mantenibilidad; DA-09 — Administración inicial. | Separar las responsabilidades del negocio dentro de una misma aplicación desplegable, manteniendo una complejidad operativa adecuada para la etapa inicial. | El frontend web de Mentelyx, accesible desde el navegador o instalado como PWA, utilizará la API del backend para ejecutar las operaciones del negocio. |
| ADR-002 | Aplicar Clean Architecture dentro de los módulos del backend. | DA-05 — Mantenibilidad. | Separar las reglas del negocio de las interfaces, la persistencia y los proveedores externos, facilitando los cambios y las pruebas. | Responsabilidades organizadas en Dominio, Aplicación, Presentación e Infraestructura, con dependencias dirigidas hacia el núcleo. |
| ADR-003 | Desarrollar un único frontend web responsive y mobile-first con capacidades PWA, conectado al backend mediante una API REST sobre HTTPS. | DA-10 — Aplicación web y PWA; DA-05 — Mantenibilidad. | Permitir acceso desde el navegador y mediante instalación utilizando una misma base de frontend, manteniendo las reglas del negocio en el backend. | Una aplicación web instalable como PWA y un backend con una API para las operaciones de Mentelyx. |
| ADR-004 | Verificar la autenticación y autorización en el backend mediante roles, permisos y acceso a recursos. | DA-03 — Seguridad; DA-09 — Administración inicial. | Proteger las operaciones independientemente de la interfaz utilizada y permitir que el propietario delegue funciones sin entregar acceso general. | Acceso controlado para estudiantes, docentes, superadministrador y administradores delegados. |
| ADR-005 | Integrar el servicio de pagos mediante una interfaz definida por la aplicación y un adaptador del proveedor. | DA-04 — Pagos externos; DA-05 — Mantenibilidad. | Evitar que las reglas de suscripciones, tutorías y remuneraciones dependan directamente de los detalles de una pasarela específica. | Contrato de integración de pagos y una implementación encargada de comunicarse con el proveedor seleccionado. |
| ADR-006 | Utilizar persistencia relacional con transacciones y controles de concurrencia para las operaciones críticas. | DA-06 — Consistencia. | Mantener coherencia al asignar cupos, registrar pagos y generar liquidaciones, incluso cuando existan solicitudes simultáneas. | Datos relacionados y operaciones transaccionales que impidan superar cupos o producir registros económicos inconsistentes. |
| ADR-007 | Procesar los resultados de pagos de forma idempotente. | DA-04 — Pagos externos; DA-06 — Consistencia. | Una notificación repetida del proveedor no debe activar dos veces una suscripción ni duplicar una reserva o liquidación. | Cada operación de pago conserva una identificación única y sus efectos se aplican una sola vez. |
| ADR-008 | Utilizar una cola de tareas y funciones serverless para notificaciones y recordatorios. | DA-07 — Disponibilidad; DA-09 — Administración inicial. | Ejecutar tareas complementarias sin mantener al usuario esperando su finalización ni invalidar operaciones confirmadas cuando falle una entrega. | Procesamiento asíncrono de avisos y recordatorios, con control de reintentos y seguimiento de tareas. |
| ADR-009 | Separar el almacenamiento de archivos del almacenamiento de datos académicos y comerciales. | DA-01 — Escalabilidad; DA-02 — Rendimiento. | Los videos, imágenes y materiales educativos tienen necesidades de almacenamiento y distribución diferentes de las reservas, resultados y pagos. | Archivos en almacenamiento especializado y referencias, metadatos y permisos gestionados por el backend. |
| ADR-010 | Separar la identidad del estudiante de los convenios y beneficios institucionales. | DA-08 — Independencia institucional. | Conservar la cuenta y el historial aunque termine un convenio o cambie la elegibilidad del estudiante. | Cuentas personales independientes y un módulo de convenios que administra asignaciones de beneficios, sin paneles institucionales. |
| ADR-012 | Incorporar caché para archivos estáticos y consultas públicas frecuentes, utilizando Cache-Aside en el backend. | DA-01 — Escalabilidad; DA-02 — Rendimiento; DA-06 — Consistencia. | Reducir transferencias y consultas repetidas, manteniendo la validación de operaciones críticas en su fuente autorizada. | Caché de recursos del frontend y de consultas seleccionadas, con políticas de expiración, actualización e invalidación. |

### ADR-012. Caché de recursos y consultas frecuentes

**Estado:** Propuesta para la arquitectura inicial.

#### Alcance

- Archivos estáticos versionados del frontend Web + PWA.
- Catálogo público de áreas, cursos y temas.
- Información pública de docentes.
- Imágenes y miniaturas públicas.

#### Reglas

- La base de datos continuará siendo la fuente de información persistente.
- Las consultas seleccionadas del backend utilizarán Cache-Aside.
- Cada tipo de información tendrá una política de expiración.
- Los cambios de publicación deberán invalidar las entradas relacionadas.
- Las reservas, pagos y autorizaciones no se confirmarán utilizando
  únicamente una copia de la caché general.
- La primera implementación no almacenará respuestas personales en
  cachés compartidas entre usuarios.

#### Ubicación en Clean Architecture

La implementación de caché se ubicará en Infraestructura.

Podrá implementarse como un adaptador o decorador de los repositorios
de consulta, sin incorporar dependencias del producto de caché al Dominio.

#### Verificación

Se compararán los tiempos de respuesta y las consultas a la base de datos
con y sin caché.

También se comprobará que las modificaciones e invalidaciones se reflejen
conforme a la política definida.

El producto de caché y los tiempos de expiración se seleccionarán después
de evaluar las consultas, la infraestructura y el presupuesto.

### Consideraciones de las decisiones

- Los módulos del backend formarán parte de una misma aplicación desplegable; no serán microservicios independientes.
- Las funciones serverless complementarán al monolito modular. Las reglas principales de aprendizaje, acceso, reservas y remuneraciones permanecerán en el backend.
- Las transacciones locales no abarcarán al proveedor externo de pagos. La confirmación de una contratación deberá coordinar el resultado del pago con el estado válido de la reserva.
- La aplicación web y la aplicación móvil compartirán servicios, aunque podrán ofrecer interfaces y funciones diferentes según el usuario.
- Los proveedores, frameworks y productos específicos se seleccionarán posteriormente, de acuerdo con estas decisiones y los recursos disponibles.