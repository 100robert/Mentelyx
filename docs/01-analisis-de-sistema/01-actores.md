# 01. Actores del sistema — Mentelyx

## Propósito

Este documento identifica las **personas que interactúan directamente** con Mentelyx y los **sistemas externos** con los que intercambia información. Los actores sirven como punto de partida para las historias de usuario, los requisitos funcionales y los controles de acceso; no representan necesariamente módulos ni cuentas independientes.

## Actores humanos

| Actor | Descripción | Interacciones y responsabilidades |
|---|---|---|
| **Estudiante** | Persona que utiliza la plataforma para su aprendizaje en Primaria, Secundaria o Preuniversitario. Su acceso es independiente de una institución. | Registrar y acceder a su cuenta; seleccionar nivel; realizar diagnósticos; consultar contenidos; resolver ejercicios; recibir orientación y recomendaciones; rendir simulacros; revisar su progreso; gestionar suscripciones y beneficios; consultar, reservar y gestionar tutorías. |
| **Docente** | Persona que solicita incorporarse para ofrecer servicios educativos. **Los permisos docentes solo se habilitan después de una verificación y aprobación por Mentelyx.** | Presentar su solicitud; una vez habilitado, gestionar su perfil y materiales demostrativos sujetos a revisión, configurar tutorías, tarifas, horarios y cupos, consultar reservas y sesiones, y revisar liquidaciones y pagos propios. |
| **Superadministrador** | Rol de máxima administración funcional dentro de Mentelyx. En la etapa inicial, lo ejercerá el propietario. | Gestionar usuarios, roles y permisos; autorizar docentes; administrar contenidos, planes y convenios; supervisar reservas, operaciones económicas, incidencias y auditoría. |
| **Administrador delegado** | Cuenta autorizada por el superadministrador para realizar determinadas actividades de gestión. | Administrar únicamente los recursos y operaciones que permita su autorización, por ejemplo contenido académico, docentes, convenios, finanzas o soporte. |

### Estado de incorporación docente

Un **postulante a docente** no es un segundo rol docente con privilegios completos: es una persona que participa en un proceso de solicitud, evaluación y habilitación. La solicitud puede rechazarse o la autorización suspenderse posteriormente. **No se obtienen permisos docentes por elegir una opción durante el registro.**

## Consideraciones operativas de los docentes

- La **verificación de identidad y perfil** es un control de confianza, no un producto que se cobre automáticamente al postulante. El precio de clases, los descuentos y las comisiones son políticas comerciales independientes.
- El docente habilitado puede publicar materiales demostrativos, proponer cursos y programar clases en vivo **sujetos a revisión, licencia, permisos y condiciones de contratación**. Una autorización para publicar un material **no concede automáticamente** permiso para incorporarlo a RAG ni entrenar modelos.
- Puede consultar exclusivamente sus sesiones, liquidaciones y permisos sobre materiales propios. El rol docente no da acceso al historial privado de estudiantes ajenos.
- La publicidad puede aparecer de forma **discreta** en el perfil público, el catálogo o un espacio reducido del inicio del panel docente. Queda excluida del editor de contenidos, videoclases, evaluaciones, reproducción de lecciones de pago y liquidaciones. Las ubicaciones y las categorías anunciantes están sujetas a revisión.

## Sistemas externos

| Actor externo | Descripción | Interacción con Mentelyx |
|---|---|---|
| **Servicio de pagos** | Proveedor externo utilizado para procesar contrataciones económicas. | Recibir solicitudes de pago de suscripciones o tutorías y comunicar resultados que Mentelyx debe verificar. |
| **Servicio de notificaciones** | Proveedor utilizado para entregar mensajes y avisos. | Recibir solicitudes de notificación y entregar comunicaciones sobre cuentas, reservas, tutorías, suscripciones y operaciones relevantes. |
| **Proveedor de streaming de video** | Plataforma externa de transcodificación y distribución de cursos grabados o directos. | Recibir los archivos o emisiones autorizadas y entregar video al reproductor sin cargar al backend con el tráfico multimedia. |
| **Proveedor de videoconferencia** | Servicio externo WebRTC/SFU para tutorías interactivas. | Crear salas, autorizar participantes y entregar audio/video en tiempo real. |
| **Proveedor de IA y embeddings** | Servicio externo de inferencia o generación de representaciones vectoriales, cuando se contrate. | Recibir únicamente el contexto necesario y generar respuestas para el tutor pedagógico. |
| **Servicio publicitario o patrocinador** | Integración para mostrar patrocinios y banners aprobados. | Entregar creatividades autorizadas y métricas agregadas, sin recibir perfiles académicos privados. |

La **personalización del aprendizaje** y el **motor RAG** son capacidades internas de Mentelyx. Solo los proveedores tecnológicos consultados mediante API se consideran sistemas externos; Redis, PostgreSQL o la CDN no se convierten en actores humanos.

## Stakeholders que no son actores directos

- **Propietario del negocio:** define políticas y objetivos; en el software actúa inicialmente mediante el rol de superadministrador. No requiere un rol funcional adicional denominado «propietario».
- **Editoriales y anunciantes:** potenciales socios comerciales; no reciben acceso a diagnósticos, notas, dificultades ni perfiles personales para publicidad.
- **Instituciones con convenio:** colegios, academias y centros preuniversitarios podrán tener acuerdos comerciales con Mentelyx, pero **no tendrán cuentas, paneles ni acceso a datos académicos** de estudiantes. Los beneficios serán administrados por Mentelyx.

## Reglas y límites de acceso

1. La cuenta del estudiante es personal y no exige correo institucional ni afiliación a un centro educativo.
2. Un docente autorizado administra **sus propios servicios**; no adquiere administración global ni acceso libre a datos académicos ajenos.
3. Un administrador delegado solo realiza funciones expresamente autorizadas.
4. Los permisos dentro de Mentelyx no otorgan acceso al repositorio de código ni a la infraestructura de despliegue.
5. Los sistemas externos no reciben automáticamente facultades administrativas por integrarse con la plataforma.
6. Las sesiones y los videos docentes no se graban automáticamente. Los materiales incorporados a RAG requieren licencia explícita y control de acceso a cada fuente.
7. Los usuarios de planes de pago no verán anuncios en su experiencia educativa. La publicidad contextual aprobada se limita a ubicaciones previamente determinadas y no interfiere con tareas académicas.

> No se incorpora un actor de padre, madre o apoderado ni se propone un panel familiar en el alcance funcional actual. Los asuntos de protección de datos aplicables se tratarán al definir restricciones y controles, sin añadir funciones no acordadas.
