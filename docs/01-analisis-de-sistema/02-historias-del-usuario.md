# 02. Historias de usuario — Mentelyx

## Propósito y alcance

Las historias de usuario expresan necesidades desde la perspectiva de quienes interactúan con Mentelyx. Se redactan con el formato: **Como [actor], quiero [acción], para [beneficio]**.

El catálogo contempla **25 historias de usuario (HU-01 a HU-25)** del **producto completo**, no únicamente del MVP de Matemática de Secundaria. Los identificadores existentes se conservan para mantener la trazabilidad y evitar duplicados. La selección definitiva de historias a implementar en cada incremento debe realizarse en la planificación del proyecto.

## Historias del estudiante

| ID | Historia de usuario |
|---|---|
| HU-01 | Como estudiante, quiero registrarme con una cuenta personal, ingresar a ella y seleccionar mi nivel educativo, para utilizar Mentelyx sin depender de una institución. |
| HU-02 | Como estudiante, quiero realizar una evaluación diagnóstica, para identificar mis conocimientos previos y los temas que necesito reforzar. |
| HU-03 | Como estudiante, quiero recibir una ruta de aprendizaje personalizada que se actualice con mi desempeño, para estudiar según mis necesidades y avanzar gradualmente. |
| HU-04 | Como estudiante, quiero consultar contenidos organizados por nivel, área y tema, para encontrar los recursos educativos que necesito. |
| HU-05 | Como estudiante, quiero resolver ejercicios y recibir pistas y retroalimentación, para comprender mis errores y mejorar mi aprendizaje. |
| HU-06 | Como estudiante, quiero realizar simulacros y consultar mis resultados, para evaluar mi preparación académica. |
| HU-07 | Como estudiante, quiero consultar mi progreso y mi historial académico, para reconocer mis avances y dificultades. |
| HU-08 | Como estudiante, quiero consultar los planes y gestionar mi suscripción, para acceder a los beneficios que se ajusten a mis necesidades. |
| HU-09 | Como estudiante beneficiario de un convenio, quiero acceder a los beneficios que me correspondan, para utilizar recursos gratuitos limitados u obtener descuentos. |
| HU-10 | Como estudiante, quiero consultar perfiles y videos demostrativos de docentes, para elegir a quien pueda ayudarme. |
| HU-11 | Como estudiante, quiero reservar y pagar una tutoría individual o grupal, para recibir acompañamiento educativo. |
| HU-12 | Como estudiante, quiero consultar mis tutorías y solicitar su cancelación cuando corresponda, para organizar mi participación. |

## Historias del docente

| ID | Historia de usuario |
|---|---|
| HU-13 | Como postulante a docente, quiero presentar mi información profesional, para solicitar autorización para ofrecer servicios educativos en Mentelyx. |
| HU-14 | Como docente autorizado, quiero gestionar mi perfil y presentar videos demostrativos sujetos a revisión, para mostrar mi experiencia y forma de enseñanza. |
| HU-15 | Como docente autorizado, quiero configurar mis tutorías, horarios, cupos y tarifas, para ofrecer mis servicios educativos. |
| HU-16 | Como docente autorizado, quiero consultar mis reservas y registrar las sesiones realizadas, para organizar la atención de mis estudiantes. |
| HU-17 | Como docente autorizado, quiero consultar mis liquidaciones y pagos, para conocer los ingresos correspondientes a mis servicios. |

## Historias de administración

| ID | Historia de usuario |
|---|---|
| HU-18 | Como superadministrador, quiero gestionar usuarios y asignar o revocar permisos a colaboradores, para administrar la plataforma y delegar responsabilidades. |
| HU-19 | Como administrador autorizado, quiero gestionar contenidos, ejercicios y evaluaciones, para mantener organizada la oferta educativa. |
| HU-20 | Como administrador autorizado, quiero revisar solicitudes y gestionar la habilitación de docentes, para controlar quiénes ofrecen servicios en Mentelyx. |
| HU-21 | Como administrador autorizado, quiero configurar planes y condiciones comerciales, para administrar las modalidades de acceso y contratación. |
| HU-22 | Como administrador autorizado, quiero registrar convenios y asignar beneficios a estudiantes elegibles, para ejecutar los acuerdos establecidos por Mentelyx. |
| HU-23 | Como administrador autorizado, quiero revisar pagos, reembolsos y liquidaciones docentes, para supervisar las operaciones económicas. |
| HU-24 | Como administrador autorizado, quiero atender incidencias y consultar el registro de operaciones, para resolver problemas y supervisar el funcionamiento de la plataforma. |

## Historia transversal de acceso del estudiante

| ID | Historia de usuario |
|---|---|
| HU-25 | Como estudiante, quiero acceder a Mentelyx desde el navegador o instalarla como PWA en un dispositivo compatible, para utilizar la plataforma desde distintos dispositivos con mi misma cuenta. |

> HU-25 se mantiene con su identificador original. Se ubica fuera de la sección administrativa porque su actor es el estudiante.

## Reglas de negocio y aclaraciones

- El propietario desempeñará inicialmente el rol de superadministrador; las funciones administrativas futuras dependerán de permisos asignados.
- El docente solo podrá ofrecer servicios después de completar la habilitación correspondiente.
- Las instituciones con convenio no tendrán acceso directo a cuentas ni progreso de estudiantes.
- Los planes Gratuito, Plus y Pro y las tutorías son ofertas distintas; **una tutoría no se incluye automáticamente** por contratar Plus o Pro.
- Los videos demostrativos son promocionales y no generan, por ahora, pagos por visualizaciones.
- Los precios, comisiones, límites de uso, condiciones de cancelación y reembolsos se determinarán antes de implementar las operaciones comerciales.
- Estas historias expresan necesidades; **no demuestran implementación ni sustituyen los criterios de aceptación** que deberán establecerse para cada incremento.
