# Mentelyx

**Centro educativo virtual independiente para el aprendizaje personalizado, con capacidades de inteligencia artificial previstas en su propuesta de producto.**

## Descripción general

Mentelyx es una plataforma educativa dirigida a estudiantes de **Primaria, Secundaria y Preuniversitario**. Su propósito es ofrecer una experiencia de aprendizaje que responda a los conocimientos previos, las dificultades y la evolución de cada estudiante, sin exigir su pertenencia a un colegio, academia u otra institución educativa.

La plataforma se concibe como una **aplicación web responsive, con diseño mobile-first e instalable como PWA en dispositivos compatibles**. Una misma cuenta permitirá acceder desde el navegador o desde la PWA instalada. **No se contempla una aplicación móvil nativa independiente para la primera versión.**

## Propuesta educativa

El proceso principal de aprendizaje contempla:

1. Seleccionar un nivel educativo y un área de estudio.
2. Realizar una evaluación diagnóstica para estimar conocimientos iniciales y necesidades de refuerzo.
3. Construir y actualizar un perfil individual de aprendizaje a partir de resultados, respuestas, intentos y pistas utilizadas.
4. Recomendar temas, ejercicios y rutas de aprendizaje ajustadas al diagnóstico y al desempeño.
5. Ofrecer contenidos, ejercicios, retroalimentación, evaluaciones y simulacros.
6. Permitir consultar el progreso académico e historial de actividades.

El producto contempla **personalización mediante inteligencia artificial**, incluida la recomendación de actividades y la adaptación de dificultad. La técnica concreta que se utilizará en cada etapa de desarrollo se documentará y validará durante el diseño e implementación; su sola mención no constituye evidencia de un modelo de IA funcionando.

## Usuarios y administración

Los actores principales son **Estudiante, Docente, Superadministrador y Administrador delegado**. Los docentes deben pasar por un proceso de verificación y aprobación antes de obtener privilegios para ofrecer servicios.

El **propietario** define las políticas educativas, comerciales y operativas del negocio. El **superadministrador** administra la plataforma dentro del software; inicialmente, una misma persona desempeñará ambas responsabilidades. Más adelante podrán crearse cuentas delegadas con permisos limitados.

## Modalidades de acceso

Mentelyx contempla una **modalidad gratuita** y dos planes de suscripción, **Plus** y **Pro**. Los recursos disponibles, los límites, los precios y las condiciones de cada plan se definirán mediante políticas comerciales antes de su implementación.

Las **tutorías individuales y grupales** se contratarán bajo condiciones propias; **no se consideran incluidas automáticamente** en los planes Plus o Pro.

## Convenios institucionales

Mentelyx podrá celebrar convenios con colegios, academias y centros preuniversitarios para proporcionar acceso gratuito limitado o descuentos a estudiantes elegibles. Las instituciones **no tendrán cuentas, paneles administrativos ni acceso directo a datos académicos**. La administración de Mentelyx registrará convenios, validará la elegibilidad y asignará beneficios. El vencimiento de un convenio no eliminará la cuenta ni el historial del estudiante.

## Docentes y tutorías

Los docentes autorizados podrán administrar su perfil, enviar **videos demostrativos y materiales promocionales sujetos a revisión**, ofrecer tutorías, configurar horarios, cupos y tarifas, consultar reservas y revisar liquidaciones y pagos.

Mentelyx verificará reservas y pagos antes de confirmar la contratación, respetando los cupos disponibles. Las comisiones, los plazos de liquidación y las políticas de cancelación y reembolso se definirán antes de desarrollar las operaciones económicas correspondientes. **Los videos demostrativos son promocionales; no se contempla remuneración por visualizaciones en el alcance actual.**

## Alcance completo y MVP académico

El **producto completo** contempla los tres niveles educativos y sus funcionalidades educativas, docentes, comerciales, administrativas y de soporte.

El **MVP académico** se concentrará en:

- **Nivel:** Secundaria.
- **Área:** Matemática.
- **Flujo principal:** registro e inicio de sesión, evaluación diagnóstica, registro del resultado, perfil de aprendizaje, recomendación o ruta personalizada, actividades y seguimiento del progreso.
- **Gestión mínima:** administración de los contenidos y evaluaciones que necesite el flujo demostrado.

El análisis de suscripciones, convenios, tutorías y remuneraciones forma parte del **alcance del producto**, pero **no implica que todos esos módulos se implementarán en el MVP**.

## Orientación arquitectónica preliminar

Se propone un **backend monolítico modular** con responsabilidades separadas y organización interna inspirada en **Clean Architecture**, de modo que el dominio y los casos de uso no dependan de interfaces, bases de datos ni proveedores externos.

La interfaz web y la PWA utilizarán una misma base de servicios. El uso de capacidades **serverless** podrá evaluarse para funciones complementarias, pero no se considera una decisión cerrada hasta justificarlo frente a los drivers, el costo y las necesidades de operación.

## Dimensionamiento y calidad

Se contemplan, como **hipótesis de dimensionamiento por validar**, un escenario de referencia de aproximadamente **1 500 usuarios concurrentes** y pruebas exploratorias de hasta **15 000 usuarios concurrentes**. No son capacidades ya demostradas ni umbrales aceptados del MVP. Su factibilidad dependerá del tipo de operación, el patrón de carga, la infraestructura y el presupuesto disponible.

Los objetivos medibles, las condiciones de prueba y las tácticas se formalizarán en los **escenarios de atributos de calidad**.

## Documentación del análisis

Los documentos de partida son:

- `01-actores.md`: actores directos, sistemas externos y límites de responsabilidad.
- `02-historias-del-usuario.md`: necesidades de los usuarios, identificadas como HU-01 a HU-25.
- `03-requisitos-funcionales.md`: capacidades del sistema, identificadas como RF-01 a RF-34, y trazabilidad HU–RF.

Los atributos de calidad, restricciones, drivers y decisiones arquitectónicas se documentarán en archivos separados para evitar mezclar necesidades con decisiones técnicas.

## Contexto académico

**Asignatura:** Arquitectura de Software (IS-488)  
**Semestre:** 2026-II  
**Institución:** Universidad Nacional de San Cristóbal de Huamanga.

> Estado: descripción y análisis propuestos. No implica que el sistema o todos sus módulos estén implementados.
