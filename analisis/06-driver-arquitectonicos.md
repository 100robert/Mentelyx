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
| DA-10 | El sistema debe atender a una aplicación web y una aplicación móvil manteniendo una identidad y una información de negocio compartidas. | RF-33, RF-34; RC-01 — Acceso multiplataforma | Influye en la definición de interfaces de comunicación compartidas, la autenticación y la separación entre las interfaces de usuario y las reglas del negocio. |

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