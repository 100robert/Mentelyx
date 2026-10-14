# 03. Requisitos funcionales — Mentelyx

## Propósito y alcance

Los requisitos funcionales establecen **qué debe hacer Mentelyx** para satisfacer las historias de usuario y las reglas del negocio. Se consideran los **34 requisitos identificados (RF-01 a RF-34)** para el **producto completo**. No deben interpretarse como funcionalidades ya implementadas ni como compromiso de entregar todos los módulos en el MVP académico.

Los requisitos describen comportamientos observables; sus atributos de calidad, restricciones y decisiones técnicas se especificarán en documentos distintos. Se conservan los identificadores originales para asegurar trazabilidad.

## Catálogo de requisitos funcionales

| ID | Requisito funcional |
|---|---|
| **RF-01** | El sistema debe permitir a un estudiante registrar una cuenta personal y seleccionar su nivel educativo, sin exigir un correo institucional ni pertenencia a una institución educativa. |
| **RF-02** | El sistema debe permitir iniciar y cerrar sesión, así como solicitar la recuperación del acceso a una cuenta. |
| **RF-03** | El sistema debe permitir al superadministrador gestionar cuentas y asignar o revocar roles y permisos de administración. |
| **RF-04** | El sistema debe comprobar la identidad y los permisos aplicables antes de ejecutar operaciones protegidas o consultar información restringida. |
| **RF-05** | El sistema debe permitir consultar los contenidos publicados utilizando criterios de nivel educativo, área, curso y tema. |
| **RF-06** | El sistema debe permitir a los administradores autorizados organizar niveles, áreas, cursos y temas, así como registrar, revisar, actualizar, publicar y retirar contenidos educativos, ejercicios y evaluaciones. |
| **RF-07** | El sistema debe permitir a un estudiante realizar una evaluación diagnóstica y registrar sus respuestas y resultados asociados a su cuenta. |
| **RF-08** | El sistema debe construir y actualizar un perfil de aprendizaje a partir de diagnósticos y desempeño registrado, y utilizarlo para generar o ajustar recomendaciones, rutas de aprendizaje y niveles de dificultad. |
| **RF-09** | El sistema debe permitir resolver ejercicios, registrar respuestas e intentos, presentar pistas y proporcionar retroalimentación sobre el desempeño. |
| **RF-10** | El sistema debe permitir a administradores autorizados configurar simulacros y a los estudiantes realizarlos, respetando sus condiciones de duración y calificación. |
| **RF-11** | El sistema debe permitir al estudiante consultar sus propios resultados, historial y progreso académico. |
| **RF-12** | El sistema debe permitir a la administración configurar y a los usuarios consultar los beneficios, precios y condiciones de la modalidad gratuita y los planes Plus y Pro. |
| **RF-13** | El sistema debe permitir contratar, renovar y cancelar suscripciones y controlar sus estados de activación y vencimiento. |
| **RF-14** | El sistema debe comprobar los beneficios de acceso vigentes antes de habilitar contenidos o funciones restringidas por plan o convenio. |
| **RF-15** | El sistema debe permitir a la administración registrar y actualizar convenios con su institución, vigencia, condiciones y beneficios. |
| **RF-16** | El sistema debe permitir a la administración registrar el resultado de la verificación de elegibilidad y asignar beneficios de convenio a estudiantes elegibles. |
| **RF-17** | El sistema debe aplicar los beneficios de convenios vigentes y controlar su vencimiento sin eliminar la cuenta ni el historial académico del estudiante. |
| **RF-18** | El sistema debe permitir presentar solicitudes de incorporación docente y a la administración aprobarlas, rechazarlas o suspender posteriormente la habilitación concedida. |
| **RF-19** | El sistema debe permitir al docente habilitado gestionar su perfil y presentar materiales demostrativos para su revisión y eventual publicación. |
| **RF-20** | El sistema debe permitir consultar perfiles docentes publicados, especialidades, materiales demostrativos y servicios de tutoría disponibles. |
| **RF-21** | El sistema debe permitir al docente habilitado configurar tutorías individuales o grupales, indicando tema, horario, cupos y tarifa conforme a las políticas vigentes. |
| **RF-22** | El sistema debe permitir solicitar reservas de tutoría y comprobar la disponibilidad de horarios y cupos antes de aceptarlas. |
| **RF-23** | El sistema debe confirmar una tutoría contratada únicamente después de verificar la validez de la reserva y del pago, sin exceder los cupos disponibles. |
| **RF-24** | El sistema debe permitir a estudiantes y docentes consultar sus propias tutorías y registrar o consultar el estado de las sesiones, según sus permisos. |
| **RF-25** | El sistema debe permitir solicitar y gestionar cancelaciones y reembolsos de acuerdo con las condiciones aplicables a cada contratación. |
| **RF-26** | El sistema debe registrar las órdenes de contratación y solicitar el procesamiento de sus pagos a un servicio externo. |
| **RF-27** | El sistema debe verificar los resultados de pago comunicados por el proveedor externo y actualizar el estado de las operaciones evitando aplicar sus efectos más de una vez. |
| **RF-28** | El sistema debe calcular liquidaciones de docentes a partir de los servicios prestados y de las condiciones económicas acordadas. |
| **RF-29** | El sistema debe permitir registrar pagos efectuados a docentes y consultar, según los permisos asignados, los montos pendientes, liquidados y pagados. |
| **RF-30** | El sistema debe generar avisos relevantes sobre cuentas, suscripciones, reservas, tutorías y operaciones económicas para su entrega mediante el servicio de notificaciones. |
| **RF-31** | El sistema debe registrar operaciones administrativas y económicas relevantes y permitir consultar la información registrada únicamente a usuarios autorizados. |
| **RF-32** | El sistema debe permitir registrar incidencias de soporte, consultar su estado y documentar su atención. |
| **RF-33** | El sistema debe ofrecer una experiencia web instalable como PWA en dispositivos y navegadores compatibles, de modo que pueda iniciarse desde el icono instalado cuando el entorno lo admita. |
| **RF-34** | El sistema debe permitir acceder desde el navegador o desde la PWA instalada utilizando la misma cuenta y consultar información académica, suscripciones y tutorías actualizadas al conectarse al servicio. |

## Matriz de trazabilidad: historias de usuario y requisitos

| Historia de usuario | Requisitos relacionados |
|---|---|
| HU-01. Registro, acceso y nivel educativo | RF-01, RF-02 |
| HU-02. Diagnóstico inicial | RF-07, RF-08 |
| HU-03. Ruta personalizada | RF-08 |
| HU-04. Consulta de contenidos | RF-05, RF-14 |
| HU-05. Ejercicios y retroalimentación | RF-08, RF-09 |
| HU-06. Simulacros | RF-10, RF-11 |
| HU-07. Progreso académico | RF-11 |
| HU-08. Planes y suscripciones | RF-12, RF-13, RF-14, RF-26, RF-27, RF-30 |
| HU-09. Beneficios por convenio | RF-14, RF-16, RF-17 |
| HU-10. Consulta de docentes | RF-20 |
| HU-11. Contratación de tutorías | RF-21, RF-22, RF-23, RF-26, RF-27 |
| HU-12. Gestión de tutorías contratadas | RF-24, RF-25, RF-30 |
| HU-13. Incorporación docente | RF-18 |
| HU-14. Perfil y promoción docente | RF-19 |
| HU-15. Oferta de tutorías | RF-21 |
| HU-16. Atención de tutorías | RF-24, RF-30 |
| HU-17. Consulta de remuneraciones | RF-28, RF-29 |
| HU-18. Usuarios y permisos | RF-03, RF-04 |
| HU-19. Gestión académica | RF-06, RF-10 |
| HU-20. Gestión de docentes | RF-18, RF-19 |
| HU-21. Planes y condiciones comerciales | RF-12, RF-13 |
| HU-22. Gestión de convenios | RF-15, RF-16, RF-17 |
| HU-23. Supervisión económica | RF-25, RF-26, RF-27, RF-28, RF-29, RF-31 |
| HU-24. Soporte y supervisión | RF-31, RF-32 |
| **HU-25. Acceso web y PWA** | **RF-33, RF-34** |

**Nota:** RF-04, RF-14, RF-30 y RF-31 cumplen funciones transversales y pueden relacionarse con varias historias; la matriz registra los vínculos principales, no necesariamente todos los escenarios de uso indirectos.

## Reglas del negocio que condicionan el comportamiento

1. Las cuentas estudiantiles son independientes de cualquier institución educativa.
2. Las instituciones con convenio no acceden directamente al sistema ni a datos académicos.
3. Los permisos docentes no se conceden por selección libre durante el registro: requieren aprobación.
4. Las tutorías tienen condiciones propias y no se incluyen automáticamente en los planes Plus o Pro.
5. Los videos demostrativos cumplen una finalidad promocional; no se prevé pago por visualizaciones en el alcance actual.
6. Los precios, comisiones, límites de beneficios, plazos de liquidación y condiciones de cancelación deben definirse antes de implementar las operaciones comerciales correspondientes.
7. La contratación de una tutoría debe respetar la disponibilidad, capacidad y estado del pago.
8. El acceso a información personal, académica o económica requiere autorización según la identidad y relación del solicitante con el recurso.

## Comprobación futura de requisitos

Para considerar un requisito listo para implementación deberán añadirse **criterios de aceptación**, casos de prueba y la prioridad correspondiente al incremento del producto. Como ejemplos de comprobación:

| Requisito | Comprobación mínima sugerida |
|---|---|
| RF-01 | Un estudiante puede registrarse sin correo institucional y queda asociado al nivel elegido. |
| RF-07 | Un diagnóstico finalizado conserva las respuestas y el resultado vinculados al estudiante autenticado. |
| RF-08 | Tras registrar un diagnóstico o nuevo desempeño, el sistema puede producir un perfil y una recomendación coherente con las reglas definidas. |
| RF-04 / RF-11 | Un estudiante autenticado no puede consultar el historial académico privado de otro estudiante. |
| RF-23 | Dos reservas simultáneas no pueden confirmar más participantes que el cupo permitido. |
| RF-27 | La recepción repetida de una misma confirmación válida de pago no duplica una activación ni una operación. |
| RF-33 / RF-34 | En un navegador compatible se puede iniciar la PWA instalada y utilizar la misma cuenta que desde la web. |

## Delimitación del MVP académico

El **MVP académico de Mentelyx** comprobará el flujo de cuenta, diagnóstico, perfil de aprendizaje, recomendación, actividades educativas y consulta del progreso. La organización de contenidos y evaluaciones se diseñará para **múltiples niveles educativos, áreas, cursos y temas**, sin restringir los requisitos a Matemática ni a Secundaria. Para la demostración se podrá cargar una cantidad reducida de contenidos de ejemplo y comprobar que es posible incorporar otras áreas o cursos sin rehacer los módulos académicos. La selección de contenidos y la asignación de RF por sprint se definirán en la planificación; no modifican el alcance funcional global.
