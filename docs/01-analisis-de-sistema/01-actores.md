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

## Sistemas externos

| Actor externo | Descripción | Interacción con Mentelyx |
|---|---|---|
| **Servicio de pagos** | Proveedor externo utilizado para procesar contrataciones económicas. | Recibir solicitudes de pago de suscripciones o tutorías y comunicar resultados que Mentelyx debe verificar. |
| **Servicio de notificaciones** | Proveedor utilizado para entregar mensajes y avisos. | Recibir solicitudes de notificación y entregar comunicaciones sobre cuentas, reservas, tutorías, suscripciones y operaciones relevantes. |

La **inteligencia artificial** es una capacidad prevista dentro de Mentelyx; no constituye, por sí misma, un actor externo. Si se decide consumir un proveedor de IA mediante API, ese proveedor se documentará como sistema externo y su integración deberá justificarse.

## Stakeholders que no son actores directos

- **Propietario del negocio:** define políticas y objetivos; en el software actúa inicialmente mediante el rol de superadministrador. No requiere un rol funcional adicional denominado «propietario».
- **Instituciones con convenio:** colegios, academias y centros preuniversitarios podrán tener acuerdos comerciales con Mentelyx, pero **no tendrán cuentas, paneles ni acceso a datos académicos** de estudiantes. Los beneficios serán administrados por Mentelyx.

## Reglas y límites de acceso

1. La cuenta del estudiante es personal y no exige correo institucional ni afiliación a un centro educativo.
2. Un docente autorizado administra **sus propios servicios**; no adquiere administración global ni acceso libre a datos académicos ajenos.
3. Un administrador delegado solo realiza funciones expresamente autorizadas.
4. Los permisos dentro de Mentelyx no otorgan acceso al repositorio de código ni a la infraestructura de despliegue.
5. Los sistemas externos no reciben automáticamente facultades administrativas por integrarse con la plataforma.

> No se incorpora un actor de padre, madre o apoderado ni se propone un panel familiar en el alcance funcional actual. Los asuntos de protección de datos aplicables se tratarán al definir restricciones y controles, sin añadir funciones no acordadas.
