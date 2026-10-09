# Restricciones

## Mentelyx

Las restricciones son condiciones o limitaciones que deben respetarse al desarrollar y diseñar el sistema.

| ID | Restricción | Descripción |
|---|---|---|
| RC-01 | Acceso multiplataforma | Mentelyx debe ofrecer acceso mediante una aplicación web y una aplicación móvil. Ambas deben utilizar la misma cuenta del usuario y compartir la información académica, suscripciones, beneficios y tutorías, según las funciones disponibles en cada interfaz. |
| RC-02 | Control de versiones | Los documentos y el código del proyecto deben gestionarse mediante Git y mantenerse en GitHub. |
| RC-03 | Acceso independiente | El registro general no debe exigir pertenencia a un colegio, academia o centro preuniversitario ni utilizar obligatoriamente un correo institucional. |
| RC-04 | Convenios sin acceso institucional | Las instituciones asociadas no deben disponer de cuentas o paneles administrativos. Los convenios y beneficios serán gestionados por Mentelyx. |
| RC-05 | Servicio externo de pagos | El sistema debe integrarse con un servicio externo para procesar los pagos por suscripciones y tutorías. |
| RC-06 | Administración inicial | La plataforma debe poder ser administrada inicialmente por el propietario mediante el rol de superadministrador, permitiendo delegar funciones posteriormente. |
| RC-07 | Verificación docente | Las funciones para ofrecer servicios docentes solo deben habilitarse después de la verificación y aprobación correspondiente. |
| RC-08 | Comunicación segura | El acceso público a la plataforma debe utilizar HTTPS. |
| RC-09 | Alcance de la entrega | La entrega actual debe centrarse en analizar el sistema, definir decisiones arquitectónicas y justificar la propuesta, sin requerir nuevas funcionalidades implementadas. |

## Consideraciones

Los precios de los planes, las comisiones docentes y las condiciones de cancelación son políticas del negocio que deberán definirse antes de implementar las operaciones correspondientes.

El monolito modular, el uso complementario de serverless y la aplicación de Clean Architecture se desarrollarán en los documentos de decisiones, estilo y enfoque arquitectónico.

Los ejemplos tecnológicos de las guías no se consideran automáticamente restricciones de Mentelyx. Cada tecnología deberá responder a las necesidades y decisiones del proyecto.