# Actores del Sistema

## Mentelyx

Los actores representan a las personas y sistemas externos que interactúan directamente con Mentelyx.

| Actor | Descripción | ¿Qué necesita realizar? |
|---|---|---|
| Estudiante | Usuario de primaria, secundaria o nivel preuniversitario que utiliza los servicios educativos de Mentelyx. | Registrarse, realizar diagnósticos, consultar contenidos, resolver ejercicios, recibir orientación, seguir una ruta de aprendizaje, realizar simulacros, consultar su progreso, contratar suscripciones y reservar tutorías. |
| Docente | Profesional verificado y autorizado por Mentelyx para ofrecer servicios educativos. | Gestionar su perfil, publicar materiales demostrativos sujetos a revisión, ofrecer tutorías individuales o grupales, administrar su disponibilidad, consultar reservas y revisar sus remuneraciones. |
| Superadministrador | Usuario responsable de la administración general de Mentelyx. Inicialmente, este rol será desempeñado por el propietario del proyecto. | Gestionar usuarios y permisos, verificar docentes, administrar contenidos, configurar planes, gestionar convenios y supervisar tutorías, pagos y remuneraciones. |
| Administrador delegado | Colaborador al que el superadministrador puede asignar funciones específicas cuando la operación lo requiera. | Realizar tareas de gestión académica, docentes, finanzas, convenios o soporte, según los permisos asignados. |
| Servicio de pagos | Sistema externo que procesa los pagos de los usuarios. | Recibir solicitudes de pago por suscripciones y tutorías y comunicar el resultado de las operaciones. |
| Servicio de notificaciones | Sistema externo utilizado para entregar avisos a los usuarios. | Enviar notificaciones relacionadas con cuentas, suscripciones, tutorías y operaciones de la plataforma. |

## Consideraciones

### Administración de Mentelyx

El propietario será responsable de dirigir el negocio y establecer sus políticas.

El superadministrador será el rol que permitirá ejecutar las operaciones de administración dentro del sistema.

Inicialmente, el propietario asumirá ambas responsabilidades. Posteriormente podrá delegar tareas mediante cuentas individuales y permisos específicos.

Los permisos de la aplicación no otorgarán automáticamente acceso al repositorio de código o a la infraestructura de alojamiento.

### Instituciones con convenio

Mentelyx funcionará independientemente de colegios, academias y centros preuniversitarios.

Las instituciones podrán establecer convenios para que sus estudiantes reciban acceso gratuito limitado o descuentos en los planes Plus y Pro.

Estas instituciones no tendrán cuentas, paneles ni acceso a los datos académicos de los estudiantes. Por ello, no se consideran actores directos del sistema.

Los convenios y sus beneficios serán administrados por Mentelyx.

### Docentes

Los permisos docentes requerirán verificación y aprobación previa. No podrán obtenerse únicamente seleccionando un rol durante el registro.

Los docentes gestionarán sus propios servicios e información autorizada, sin disponer de administración global.

### Inteligencia artificial

Las funcionalidades de inteligencia artificial forman parte de Mentelyx.

Si posteriormente se decide utilizar un proveedor externo mediante una API, dicho servicio deberá incorporarse como actor externo.

### Responsables de estudiantes menores de edad

Su participación directa como actores deberá definirse si se incorpora una función mediante la cual autoricen el uso, administren pagos o consulten información del estudiante.