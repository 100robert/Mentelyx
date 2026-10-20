# 02. Historias de usuario — Mentelyx

## Propósito y alcance

Las historias de usuario expresan necesidades desde la perspectiva de quienes interactúan con Mentelyx. Se redactan con el formato: **Como [actor], quiero [acción], para [beneficio]**.



## Historias del estudiante

| ID | Historia de usuario |
|---|---|
| HU-01 | Como estudiante, quiero registrarme con una cuenta personal, ingresar a ella y seleccionar mi nivel educativo, para utilizar Mentelyx sin depender de una institución. |
| HU-02 | Como estudiante, quiero realizar una evaluación diagnóstica, para identificar mis conocimientos previos y los temas que necesito reforzar. |
| HU-03 | Como estudiante, quiero recibir una ruta de aprendizaje personalizada que se actualice con mi desempeño, para estudiar según mis necesidades y avanzar gradualmente. |
| HU-04 | Como estudiante, quiero consultar contenidos organizados por nivel, área, curso y tema, para encontrar los recursos educativos que necesito. |
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

## Ampliaciones del producto: historias nuevas propuestas

Las siguientes historias **amplían el catálogo previo sin renumerar HU-01 a HU-25**. Cubren capacidades comerciales, docentes y tecnológicas conversadas después de la versión inicial. Su aprobación e implementación se realizará por incrementos; no se afirma que estén construidas.

| ID | Actor | Historia de usuario | Etapa sugerida |
|---|---|---|---|
| **HU-26** | Docente habilitado | Como docente habilitado, quiero cargar y administrar materiales originales indicando condiciones de publicación y permiso independiente para RAG, para compartir mis conocimientos sin perder control de sus usos. | Comercial / editorial |
| **HU-27** | Docente habilitado | Como docente habilitado, quiero programar clases en vivo individuales, grupales o magistrales y conocer el reparto económico aplicable, para ofrecer enseñanza con condiciones claras. | Comercial / audiovisual |
| **HU-28** | Estudiante | Como estudiante, quiero reservar e ingresar a una clase en vivo para la que esté autorizado, para aprender e interactuar según la modalidad contratada. | Comercial / audiovisual |
| **HU-29** | Administrador autorizado | Como administrador autorizado, quiero configurar espacios y patrocinios publicitarios permitidos, para financiar parcialmente el plan gratuito sin interrumpir el aprendizaje. | Comercial |
| **HU-30** | Administrador académico | Como administrador académico autorizado, quiero revisar la autoría, licencia y calidad de materiales antes de incluirlos en el corpus de RAG, para controlar las fuentes educativas de la IA. | IA / editorial |
| **HU-31** | Estudiante | Como estudiante con acceso habilitado, quiero formular preguntas al tutor pedagógico de IA y recibir explicaciones fundamentadas en materiales autorizados, para comprender los temas de mis cursos. | IA educativa |
| **HU-32** | Estudiante gratuito | Como estudiante gratuito, quiero reconocer claramente los anuncios y que no interrumpan mis actividades, para aprender sin confundir publicidad con contenido educativo. | Comercial / experiencia |
| **HU-33** | Administrador autorizado | Como administrador autorizado, quiero configurar beneficios, cuotas y límites de uso por plan y consultar su consumo agregado, para mantener sostenibles los servicios de Mentelyx. | Comercial / operación |
| **HU-34** | Docente habilitado | Como docente habilitado, quiero controlar si una sesión permite grabación conforme a las autorizaciones necesarias, para evitar registrar o difundir clases sin permiso. | Audiovisual / privacidad |
| **HU-35** | Docente habilitado | Como docente habilitado, quiero consultar los acuerdos de explotación de mis cursos completos y la remuneración correspondiente, para conocer qué usos comerciales he autorizado. | Editorial / comercial |

> No se incluye la verificación de docentes como servicio de pago. La remuneración por un curso comercial **no se deduce automáticamente** de subir un video demostrativo. Las reglas contractuales precisas, precios y porcentajes deberán aprobarse antes de su implementación. 


## Ampliación propuesta: preparación para exámenes

Estas historias desarrollan una modalidad de estudio orientada a un **examen objetivo**. Complementan HU-02 (diagnóstico), HU-03 (ruta personalizada), HU-06 (simulacros) y HU-07 (progreso), sin sustituirlas.

| ID | Actor | Historia de usuario | Etapa sugerida |
|---|---|---|---|
| **HU-36** | Estudiante | Como estudiante, quiero seleccionar el tipo de examen para el que me preparo e indicar su fecha prevista cuando la conozca, para definir un objetivo de estudio concreto. | Preparación de exámenes |
| **HU-37** | Estudiante | Como estudiante, quiero obtener y actualizar un plan de preparación según el temario disponible, mi diagnóstico y el tiempo que puedo dedicar, para organizar mis sesiones de estudio antes del examen. | Preparación de exámenes |
| **HU-38** | Estudiante | Como estudiante, quiero realizar prácticas y simulacros relacionados con mi examen objetivo, para entrenarme con temas y condiciones semejantes a la evaluación prevista cuando se conozcan. | Preparación de exámenes |
| **HU-39** | Estudiante | Como estudiante, quiero visualizar el avance de mi plan, mis resultados por área y las dificultades recurrentes, para decidir qué contenidos debo reforzar antes del examen. | Preparación de exámenes |
| **HU-40** | Administrador académico autorizado | Como administrador académico autorizado, quiero registrar y mantener temarios y configuraciones de exámenes, indicando su fuente y carácter oficial o referencial, para ofrecer preparación basada en contenidos verificables y correctamente identificados. | Catálogo académico |

> La preparación contempla exámenes escolares y, cuando exista información validada, exámenes de admisión específicos. La plataforma no garantiza resultados, ingreso ni afiliación oficial a las instituciones cuyos exámenes utilice como referencia. La gestión de fuentes, derechos y versiones es obligatoria antes de publicar materiales correspondientes.

## Reglas de negocio y aclaraciones

- El propietario desempeñará inicialmente el rol de superadministrador; las funciones administrativas futuras dependerán de permisos asignados.
- El docente solo podrá ofrecer servicios después de completar la habilitación correspondiente.
- Las instituciones con convenio no tendrán acceso directo a cuentas ni progreso de estudiantes.
- Los planes Gratuito, Plus y Pro y las tutorías son ofertas distintas; **una tutoría no se incluye automáticamente** por contratar Plus o Pro.
- Los videos demostrativos son promocionales y no generan, por ahora, pagos por visualizaciones.
- Los precios, comisiones, límites de uso, condiciones de cancelación y reembolsos se determinarán antes de implementar las operaciones comerciales.
- Las prácticas y simulacros de preparación reutilizan las funciones generales de Evaluaciones y Aprendizaje, vinculadas opcionalmente a un examen objetivo. No se crea un módulo adicional.
- Las características de un examen específico (temario, duración, calificación y estructura) se declaran oficiales únicamente si están validadas y existe autorización para usar los materiales correspondientes.
- La preparación no implica garantía de aprobación ni admisión, y una configuración referencial debe identificarse de forma expresa.
- Estas historias expresan necesidades; **no demuestran implementación ni sustituyen los criterios de aceptación** que deberán establecerse para cada incremento.

## Política propuesta para monetización y contenidos

- **Suscripciones:** Gratuito con publicidad contextual discreta; Plus y Pro sin anuncios en las pantallas educativas de pago. Los precios S/24,90 y S/49,90, cuotas de IA y descuentos son **hipótesis comerciales** y no reglas aprobadas.
- **Docentes:** pueden generar ingresos con tutorías y clases pagadas; Mentelyx retiene una comisión que contribuya a costos de pasarela, medios audiovisuales y operación, y permita margen empresarial. Las tasas diferenciadas del análisis comercial son propuestas, no porcentajes obligatorios.
- **Publicidad:** solo en espacios aprobados (por ejemplo inicio del plan gratuito, catálogo y perfil público docente; opcional un banner reducido del inicio docente) y nunca en el editor, evaluación, clase en vivo, reproducción de una lección de pago ni liquidaciones.
- **RAG:** publicación, indexación para recuperación y entrenamiento de modelos son permisos distintos. **No se entrena ni ajusta un modelo con aportes docentes por defecto**. Contenidos sujetos a revisión de titularidad, permisos, vigencia y control de acceso.
- **Videoclases:** clases magistrales uno-a-muchos y tutorías interactivas no necesariamente utilizarán la misma tecnología. La grabación estará desactivada por defecto hasta disponer de permisos y políticas.
