# Mentelyx

## Centro educativo virtual de aprendizaje personalizado con inteligencia artificial

### Descripción

Mentelyx es un centro educativo virtual independiente orientado al aprendizaje personalizado mediante inteligencia artificial, dirigido a estudiantes de primaria, secundaria y nivel preuniversitario.

La plataforma se desarrollará como una aplicación web responsive y
mobile-first, instalable como PWA en dispositivos compatibles.

Los usuarios podrán acceder desde el navegador de una computadora,
celular o tablet, o mediante la PWA instalada, utilizando la misma
cuenta y consultando su información académica, progreso, suscripciones
y tutorías.

La primera versión no incluirá una aplicación móvil nativa independiente.

Mentelyx permitirá que cada estudiante siga un proceso de aprendizaje adaptado a sus conocimientos, dificultades y ritmo de progreso. Para ello, construirá y actualizará un perfil individual de aprendizaje.

Al iniciar un área de aprendizaje, el estudiante podrá realizar una evaluación diagnóstica que permitirá estimar su nivel inicial de dominio e identificar conocimientos que requieren refuerzo.

Posteriormente, las respuestas, intentos, dificultades, pistas utilizadas y resultados obtenidos durante las actividades permitirán actualizar progresivamente su perfil.

El componente de inteligencia artificial analizará esta información para recomendar actividades, adaptar la ruta de aprendizaje y ajustar la dificultad de los ejercicios de acuerdo con la evolución del estudiante.

Cuando se identifiquen dificultades, la plataforma podrá recomendar actividades de refuerzo o retomar conocimientos prerrequisitos. Cuando el estudiante demuestre un dominio suficiente, podrá avanzar hacia actividades de mayor dificultad.

Además del aprendizaje adaptativo, Mentelyx permitirá consultar contenidos educativos, resolver ejercicios, participar en evaluaciones y simulacros, revisar el progreso académico y contratar tutorías con docentes verificados.

### Modelo de acceso

Los estudiantes podrán registrarse directamente en Mentelyx sin exigir un correo institucional ni pertenecer a un colegio, academia o centro preuniversitario.

Se contemplan las siguientes modalidades de acceso:

- Modalidad gratuita, con recursos y funcionalidades limitados.
- Plan Plus, con beneficios adicionales.
- Plan Pro, con beneficios ampliados.

Los contenidos, funcionalidades, límites y precios correspondientes a cada modalidad serán definidos mediante las políticas comerciales de Mentelyx.

Las tutorías individuales y grupales tendrán condiciones de contratación propias. Su inclusión o descuento dentro de una suscripción deberá establecerse expresamente y no se considerará automática.

### Convenios institucionales

Mentelyx podrá establecer convenios con colegios, academias y centros preuniversitarios para ofrecer beneficios a sus estudiantes.

Estos beneficios podrán incluir acceso gratuito limitado a determinados recursos o descuentos en los planes Plus y Pro, de acuerdo con las condiciones y vigencia de cada convenio.

Las instituciones asociadas no tendrán cuentas administrativas, paneles institucionales ni acceso directo a la información académica de los estudiantes.

La administración de Mentelyx será responsable de registrar los convenios, verificar la elegibilidad de los estudiantes y asignar los beneficios correspondientes.

La cuenta personal y el historial académico del estudiante se conservarán independientemente de la vigencia del convenio o de su relación con una institución.

### Docentes y tutorías

Mentelyx permitirá la participación de docentes verificados que ofrezcan servicios de acompañamiento, orientación y refuerzo educativo.

Las personas interesadas deberán presentar una solicitud y pasar por un proceso de verificación y aprobación antes de obtener los permisos docentes.

Los docentes autorizados podrán:

- Gestionar su perfil profesional.
- Presentar videos demostrativos y materiales para promocionar su forma de enseñanza, sujetos a las condiciones de publicación.
- Ofrecer tutorías individuales y grupales.
- Configurar su disponibilidad, cupos y tarifas conforme a las políticas de Mentelyx.
- Consultar sus reservas y gestionar las sesiones a su cargo.
- Revisar las liquidaciones y pagos correspondientes a sus servicios.

Los estudiantes podrán consultar los perfiles docentes, revisar los servicios disponibles y contratar una tutoría según el tema, horario, modalidad y precio ofrecidos.

Mentelyx gestionará las reservas y verificará los pagos, evitando confirmar participantes por encima de los cupos disponibles.

La remuneración docente se determinará según los servicios prestados y las condiciones económicas acordadas. Las comisiones, plazos de liquidación y políticas de cancelación y reembolso deberán definirse antes de implementar estas operaciones.

Los videos demostrativos tendrán una finalidad promocional. Su publicación no implicará remuneración por visualizaciones dentro del alcance actual.

### Administración de la plataforma

La dirección del negocio y la administración inicial de Mentelyx serán asumidas por el propietario del proyecto.

Se distinguirán dos responsabilidades:

- Propietario: establece los objetivos y las políticas educativas, comerciales y operativas.
- Superadministrador: ejecuta las operaciones de administración autorizadas dentro del sistema.

Inicialmente, ambas responsabilidades serán asumidas por la misma persona.

La plataforma permitirá delegar posteriormente funciones de gestión académica, docentes, finanzas, convenios y soporte mediante cuentas individuales y permisos específicos.

Los docentes tendrán acceso únicamente a las funciones y recursos relacionados con sus servicios, sin recibir privilegios de administración global.

### Alcance educativo

Mentelyx contempla tres niveles educativos:

- Primaria.
- Secundaria.
- Preuniversitario.

La plataforma deberá permitir incorporar progresivamente diferentes áreas, cursos, temas y habilidades.

Para el desarrollo y validación inicial del proyecto se utilizará:

**Nivel:** Secundaria  
**Área:** Matemática

Este alcance permitirá demostrar el funcionamiento del diagnóstico, perfil de aprendizaje, adaptación de dificultad, rutas personalizadas y seguimiento del progreso sin implementar inicialmente todo el contenido educativo previsto.

El modelo completo de suscripciones, convenios y servicios docentes formará parte del análisis arquitectónico. Su implementación se organizará progresivamente según las prioridades y el cronograma del proyecto.

### Orientación arquitectónica

Mentelyx se diseñará con un backend monolítico modular que organizará las responsabilidades educativas, administrativas y comerciales de la plataforma.

La aplicación web y la aplicación móvil compartirán los servicios y las reglas del negocio, manteniendo una identidad común para cada usuario y coherencia en su información.

Se incorporarán capacidades serverless para responsabilidades complementarias cuya conveniencia se justifique durante el diseño arquitectónico.

La organización interna seguirá el enfoque Clean Architecture, separando las reglas del negocio de las interfaces de usuario, el almacenamiento y los servicios externos.

La distribución de responsabilidades entre el monolito modular y las capacidades serverless, así como la selección de tecnologías, se documentará mediante decisiones arquitectónicas relacionadas con los requisitos y drivers del proyecto.

### Escalabilidad

Mentelyx estará orientado a usuarios de diferentes regiones del país.

Como escenarios de dimensionamiento y validación se consideran:

- Un escenario habitual de referencia de aproximadamente 1 500 usuarios concurrentes.
- Escenarios de prueba de hasta 15 000 usuarios concurrentes.

Los simulacros, evaluaciones masivas y otros eventos programados representan situaciones en las que puede aumentar considerablemente la cantidad de usuarios simultáneos.

Estas cifras constituyen objetivos de diseño y prueba, no una capacidad ya demostrada. Su cumplimiento deberá evaluarse considerando la infraestructura, el presupuesto y el tipo de actividad realizada por los usuarios.

Las pruebas deberán distinguir entre consultas de contenido, resolución de ejercicios, solicitudes de ayuda mediante inteligencia artificial y contratación de tutorías, porque generan cargas diferentes sobre el sistema.

### Curso

Arquitectura de Software - IS-488

### Semestre

2026-II