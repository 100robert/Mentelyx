# Requisitos Funcionales

## Mentelyx

Los requisitos funcionales describen las funciones que el sistema debe realizar para satisfacer las necesidades identificadas en las historias de usuario.

## Requisitos funcionales

| ID | Requisito funcional |
|---|---|
| RF-01 | El sistema debe permitir registrar cuentas personales de estudiantes y seleccionar su nivel educativo sin exigir pertenencia institucional. |
| RF-02 | El sistema debe permitir iniciar sesión, cerrar sesión y recuperar el acceso a una cuenta. |
| RF-03 | El sistema debe permitir al superadministrador gestionar usuarios y asignar o revocar roles y permisos. |
| RF-04 | El sistema debe verificar los permisos del usuario antes de permitir operaciones o consultas de información restringida. |
| RF-05 | El sistema debe permitir consultar contenidos publicados por nivel educativo, área y tema. |
| RF-06 | El sistema debe permitir a los administradores autorizados registrar, revisar, actualizar, publicar y retirar materiales educativos. |
| RF-07 | El sistema debe permitir realizar evaluaciones diagnósticas y registrar sus resultados. |
| RF-08 | El sistema debe generar y actualizar rutas de aprendizaje y recomendaciones según el diagnóstico y desempeño del estudiante. |
| RF-09 | El sistema debe permitir resolver ejercicios, registrar intentos y recibir pistas y retroalimentación. |
| RF-10 | El sistema debe permitir configurar y realizar simulacros, aplicando sus condiciones de duración y calificación. |
| RF-11 | El sistema debe permitir al estudiante consultar su historial y progreso académico. |
| RF-12 | El sistema debe permitir configurar y consultar los beneficios, precios y condiciones de la modalidad gratuita y los planes Plus y Pro. |
| RF-13 | El sistema debe permitir contratar, renovar y cancelar suscripciones, y gestionar su activación y vencimiento. |
| RF-14 | El sistema debe verificar los beneficios vigentes del estudiante antes de habilitar contenidos o funciones restringidas. |
| RF-15 | El sistema debe permitir a la administración registrar y actualizar convenios, incluyendo institución, vigencia, condiciones y beneficios. |
| RF-16 | El sistema debe permitir a la administración registrar la verificación de elegibilidad de los estudiantes y asignarles beneficios por convenio. |
| RF-17 | El sistema debe aplicar los beneficios de convenios vigentes y controlar su vencimiento sin eliminar la cuenta ni el historial del estudiante. |
| RF-18 | El sistema debe permitir presentar solicitudes de incorporación docente y gestionar su aprobación, rechazo o posterior suspensión. |
| RF-19 | El sistema debe permitir al docente gestionar su perfil y presentar materiales demostrativos para su revisión y publicación. |
| RF-20 | El sistema debe permitir consultar los perfiles, especialidades y servicios publicados de los docentes. |
| RF-21 | El sistema debe permitir al docente configurar tutorías individuales o grupales, indicando tema, horario, cupos y tarifa. |
| RF-22 | El sistema debe permitir solicitar reservas de tutorías y verificar la disponibilidad de cupos y horarios. |
| RF-23 | El sistema debe confirmar las tutorías contratadas después de verificar el pago y la validez de la reserva, sin superar la capacidad disponible. |
| RF-24 | El sistema debe permitir a estudiantes y docentes consultar sus tutorías y registrar el estado de las sesiones según sus permisos. |
| RF-25 | El sistema debe permitir solicitar y gestionar cancelaciones y reembolsos conforme a las condiciones de contratación. |
| RF-26 | El sistema debe registrar las órdenes de contratación y solicitar al servicio externo el procesamiento de los pagos. |
| RF-27 | El sistema debe verificar los resultados comunicados por el servicio de pagos y actualizar las operaciones sin duplicar sus efectos. |
| RF-28 | El sistema debe calcular las liquidaciones docentes según los servicios prestados y las condiciones económicas aplicables. |
| RF-29 | El sistema debe permitir registrar los pagos realizados a docentes y consultar los importes pendientes, liquidados y pagados según los permisos del usuario. |
| RF-30 | El sistema debe generar notificaciones sobre cuentas, suscripciones, reservas, tutorías y operaciones económicas relevantes. |
| RF-31 | El sistema debe registrar las operaciones administrativas y económicas relevantes y permitir su consulta a usuarios autorizados. |
| RF-32 | El sistema debe permitir registrar incidencias de soporte, consultar su estado y documentar su atención. |
| RF-33 | El sistema debe permitir al usuario acceder desde la aplicación web y la aplicación móvil utilizando una misma cuenta. |
| RF-34 | El sistema debe permitir consultar desde ambas aplicaciones la información actualizada del progreso académico, suscripciones y tutorías del usuario, según sus permisos y las funciones disponibles en cada aplicación. |

## Relación entre historias de usuario y requisitos funcionales

| Historia de usuario | Requisitos funcionales relacionados |
|---|---|
| HU-01. Registro independiente | RF-01, RF-02 |
| HU-02. Diagnóstico inicial | RF-07 |
| HU-03. Ruta de aprendizaje | RF-08 |
| HU-04. Consulta de contenidos | RF-05, RF-14 |
| HU-05. Ejercicios y retroalimentación | RF-09 |
| HU-06. Simulacros | RF-10 |
| HU-07. Progreso académico | RF-11 |
| HU-08. Planes y suscripciones | RF-12, RF-13, RF-14, RF-26, RF-27 |
| HU-09. Beneficios por convenio | RF-16, RF-17 |
| HU-10. Consulta de docentes | RF-19, RF-20 |
| HU-11. Contratación de tutorías | RF-21, RF-22, RF-23, RF-26, RF-27 |
| HU-12. Gestión de tutorías contratadas | RF-24, RF-25, RF-30 |
| HU-13. Incorporación docente | RF-18 |
| HU-14. Perfil y promoción docente | RF-19 |
| HU-15. Oferta de tutorías | RF-21, RF-22 |
| HU-16. Atención de tutorías | RF-24, RF-30 |
| HU-17. Consulta de remuneraciones | RF-28, RF-29 |
| HU-18. Usuarios y permisos | RF-03, RF-04 |
| HU-19. Gestión académica | RF-06, RF-10 |
| HU-20. Gestión de docentes | RF-18, RF-19 |
| HU-21. Planes y condiciones comerciales | RF-12, RF-13, RF-28 |
| HU-22. Gestión de convenios | RF-15, RF-16, RF-17 |
| HU-23. Supervisión económica | RF-25, RF-26, RF-27, RF-28, RF-29, RF-31 |
| HU-24. Soporte y supervisión | RF-31, RF-32 |

## Consideraciones del negocio

- Las instituciones asociadas no tendrán acceso directo al sistema.
- Los permisos docentes requerirán aprobación de Mentelyx.
- Las tutorías tendrán condiciones de contratación propias.
- Las tutorías no estarán incluidas automáticamente en los planes Plus o Pro.
- Los videos demostrativos tendrán una finalidad promocional; no se ha definido remuneración por visualizaciones.
- Los precios, comisiones y condiciones específicas deberán ser establecidos por la administración.