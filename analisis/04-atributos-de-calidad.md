# Atributos de Calidad

## Mentelyx

Los atributos de calidad describen cómo debe funcionar el sistema, además de las funcionalidades que debe ofrecer.

Se considera un escenario en el que varios estudiantes consultan contenidos, realizan actividades y reservan tutorías simultáneamente, mientras los docentes y administradores gestionan sus operaciones.

| ID | Atributo de calidad | Escenario de calidad |
|---|---|---|
| AC-01 | Rendimiento | Las consultas de contenidos, perfiles docentes y progreso académico deben responder en tiempos adecuados, incluso cuando existan varios usuarios utilizando la plataforma simultáneamente. |
| AC-02 | Disponibilidad | El sistema debe mantenerse disponible para acceder a los recursos educativos y consultar las tutorías contratadas. Un fallo en el envío de notificaciones no debe impedir consultar una reserva ya confirmada. |
| AC-03 | Escalabilidad | El sistema debe permitir aumentar su capacidad ante el crecimiento de estudiantes, docentes, contenidos y solicitudes, sin afectar significativamente su funcionamiento. |
| AC-04 | Seguridad | Los datos personales, resultados académicos y operaciones económicas deben estar protegidos frente a accesos no autorizados. Cada usuario debe acceder únicamente a la información y funciones permitidas. |
| AC-05 | Mantenibilidad | El sistema debe permitir modificar planes, beneficios de convenios y funciones educativas sin afectar innecesariamente otras funcionalidades. |
| AC-06 | Integridad y consistencia | El sistema debe conservar la coherencia de reservas, pagos y remuneraciones, evitando superar los cupos disponibles o registrar efectos duplicados para un mismo pago. |
| AC-07 | Usabilidad | La interfaz debe diseñarse con un enfoque mobile-first y adaptarse a celulares, tablets y computadoras, permitiendo localizar contenidos, realizar actividades y consultar servicios tanto desde el navegador como desde la PWA instalada. |

## Prioridades de calidad

La seguridad y la integridad son prioritarias porque Mentelyx gestionará información académica, reservas y operaciones económicas.

El rendimiento y la disponibilidad permitirán utilizar los servicios educativos de manera continua y fluida.

La mantenibilidad y la escalabilidad facilitarán la incorporación de cambios y el crecimiento de la plataforma.

La usabilidad permitirá que estudiantes de distintos niveles educativos comprendan y utilicen las funciones disponibles.