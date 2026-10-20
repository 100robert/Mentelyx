# 03. Requisitos funcionales — Mentelyx

## Propósito y alcance

Los requisitos funcionales establecen **qué debe hacer Mentelyx** para satisfacer las historias de usuario y las reglas del negocio. 

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
| **RF-35** | El sistema debe permitir al docente habilitado cargar, versionar, solicitar revisión y retirar materiales originales, registrar declaración de titularidad y autorización de publicación, y gestionar separadamente el consentimiento contractual para indexación en RAG. |
| **RF-36** | El sistema debe permitir al docente habilitado programar clases en vivo indicando modalidad (individual, grupal interactiva o magistral), tema, duración, horario, aforo, precio y estado de publicación. |
| **RF-37** | El sistema debe permitir a estudiantes autorizados reservar o inscribirse en clases en vivo, acceder mediante credenciales de sesión de corta duración y consultar o gestionar sus estados y condiciones aplicables. |
| **RF-38** | El sistema debe calcular y mostrar el reparto económico de cada servicio docente según reglas aprobadas, registrar por separado comisión, comisiones de cobro, costos atribuibles y liquidación, sin alterar operaciones históricas ante cambios de política. |
| **RF-39** | El sistema debe permitir a la administración gestionar campañas, patrocinadores, categorías y ubicaciones autorizadas de banners, activarlos y suspenderlos, y consultar métricas agregadas sin exponer datos académicos privados. |
| **RF-40** | El sistema debe mostrar anuncios claramente identificados solo en superficies habilitadas y según la política del plan, sin interrumpir evaluaciones, videoclases, editor docente, liquidaciones ni reproducción de lecciones de pago; debe aplicar controles adicionales de privacidad y publicidad apropiados para menores. |
| **RF-41** | El sistema debe registrar revisión editorial, versión, autoría, licencia, alcance de acceso y permiso de indexación de cada fuente RAG, impedir recuperar material no autorizado y permitir su despublicación y desindexación cuando corresponda. |
| **RF-42** | El sistema debe permitir al estudiante habilitado consultar a un tutor pedagógico con IA que recupere exclusivamente fuentes autorizadas, produzca explicaciones adaptadas a su contexto permitido, muestre referencias y gestione las fallas sin modificar unilateralmente calificaciones. |
| **RF-43** | El sistema debe administrar los derechos de acceso, cuotas de uso y vigencias configuradas para Gratuito, Plus, Pro y convenios, incluyendo límites de consultas al tutor de IA sin conceder tutorías pagadas automáticamente. |
| **RF-44** | El sistema debe registrar métricas de consumo y costo por servicio (IA, video, almacenamiento y sesiones, cuando exista información del proveedor), permitir a administradores ver agregados y configurar alertas y límites para controlar el presupuesto operativo. |
| **RF-45** | El sistema debe mantener desactivada por defecto la grabación de clases en vivo y habilitarla solamente cuando existan permisos, avisos, reglas de acceso, retención y retirada válidos para la sesión correspondiente. |
| **RF-46** | El sistema debe permitir a la administración registrar contratos/licencias de contenidos comerciales docentes y a cada docente consultar sus condiciones, versiones, vigencias y remuneraciones correspondientes a los materiales que le pertenecen. |
| **RF-47** | El sistema debe permitir publicar y reproducir videos grabados mediante un proveedor especializado, comprobando los derechos de acceso antes de entregar credenciales temporales de reproducción y evitando enviar el flujo de video a través del backend de negocio. |
| **RF-48** | El sistema debe poder crear, autorizar, cerrar y auditar salas o emisiones audiovisuales mediante proveedores externos, diferenciando transmisión uno-a-muchos de tutorías interactivas y protegiendo la incorporación de participantes no autorizados. |
| **RF-49** | El sistema debe permitir al estudiante crear y consultar un objetivo de preparación, seleccionando un examen disponible (escolar o preuniversitario), y registrar opcionalmente fecha prevista y disponibilidad de estudio, sin requerir afiliación a una institución. |
| **RF-50** | El sistema debe generar y actualizar un plan de preparación para el objetivo seleccionado, relacionando temario disponible, diagnóstico previo, dificultades identificadas y tiempo previsto o disponible; debe mostrar las actividades por área y tema sin atribuir al plan garantía de éxito. |
| **RF-51** | El sistema debe permitir a administradores autorizados configurar y versionar fichas de examen con fuente, tipo, temario, estructura, duración y criterios de calificación cuando sean conocidos, diferenciando fichas oficiales verificadas de referencias no oficiales; también debe permitir al estudiante realizar prácticas y simulacros vinculados a esas fichas reutilizando las funciones de ejercicios y evaluaciones existentes. |
| **RF-52** | El sistema debe permitir al estudiante consultar el seguimiento de su objetivo, incluyendo actividades completadas, progreso por áreas o temas, historial de prácticas y simulacros, dificultades recurrentes y cumplimiento del plan, sin presentar esas métricas como predicción garantizada de su resultado real. |

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
| HU-08. Planes y suscripciones | RF-12, RF-13, RF-14, RF-26, RF-27, RF-30, RF-43 |
| HU-09. Beneficios por convenio | RF-14, RF-16, RF-17 |
| HU-10. Consulta de docentes | RF-20 |
| HU-11. Contratación de tutorías | RF-21, RF-22, RF-23, RF-26, RF-27 |
| HU-12. Gestión de tutorías contratadas | RF-24, RF-25, RF-30 |
| HU-13. Incorporación docente | RF-18 |
| HU-14. Perfil y promoción docente | RF-19, RF-35, RF-47 |
| HU-15. Oferta de tutorías | RF-21 |
| HU-16. Atención de tutorías | RF-24, RF-30 |
| HU-17. Consulta de remuneraciones | RF-28, RF-29, RF-38 |
| HU-18. Usuarios y permisos | RF-03, RF-04 |
| HU-19. Gestión académica | RF-06, RF-10 |
| HU-20. Gestión de docentes | RF-18, RF-19 |
| HU-21. Planes y condiciones comerciales | RF-12, RF-13, RF-43 |
| HU-22. Gestión de convenios | RF-15, RF-16, RF-17 |
| HU-23. Supervisión económica | RF-25, RF-26, RF-27, RF-28, RF-29, RF-31, RF-38, RF-44 |
| HU-24. Soporte y supervisión | RF-31, RF-32 |
| **HU-25. Acceso web y PWA** | **RF-33, RF-34** |
| HU-26. Materiales docentes licenciados | RF-35, RF-41, RF-47 |
| HU-27. Clases en vivo y remuneración | RF-36, RF-38, RF-48 |
| HU-28. Acceso a clases en vivo | RF-37, RF-48, RF-23, RF-24 |
| HU-29. Configuración publicitaria | RF-39, RF-40 |
| HU-30. Revisión del corpus RAG | RF-35, RF-41 |
| HU-31. Tutor pedagógico con IA | RF-42, RF-43 |
| HU-32. Publicidad no intrusiva | RF-39, RF-40 |
| HU-33. Control de cuotas y costos | RF-43, RF-44 |
| HU-34. Control de grabaciones | RF-45, RF-48 |
| HU-35. Licencias comerciales docentes | RF-38, RF-46 |
| **HU-36. Definición de examen objetivo** | **RF-49**, RF-05 |
| **HU-37. Plan de preparación personalizado** | **RF-50**, RF-07, RF-08, RF-09 |
| **HU-38. Prácticas y simulacros específicos** | **RF-51**, RF-09, RF-10 |
| **HU-39. Seguimiento de preparación** | **RF-52**, RF-11 |
| **HU-40. Gestión de temarios y fichas de examen** | **RF-51**, RF-06 |

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
9. La publicidad contextual y señalizada no interrumpe los momentos protegidos: exámenes, videoclases, editor docente, lecciones de pago y liquidaciones. Se prohíbe seleccionar anuncios según datos de rendimiento académico.
10. Los materiales de docentes para RAG requieren permisos independientes de la mera publicación. El entrenamiento/fine-tuning de modelos con estos contenidos queda desactivado por defecto.
11. Las videoclases pueden ser magistrales uno-a-muchos o tutorías interactivas. Las grabaciones requieren permisos y política de retención.
12. Las tarifas sugeridas de suscripción (Plus S/24,90; Pro S/49,90), comisiones docentes y cuotas de IA son parámetros **comerciales pendientes de aprobación**, no prestaciones definitivas del sistema.
13. Los contenidos grabados y en vivo deben mantener autorización de reproducción según plan, inscripción, licencia y vigencia.
14. El presupuesto de infraestructura no debe depender de la premisa de que los 1.500 estudiantes y 200 docentes están siempre viendo o transmitiendo video simultáneamente.
15. La preparación para exámenes será una modalidad transversal del producto, no un módulo nuevo; sus objetivos, planes y simulacros reutilizarán las capacidades ya definidas de diagnóstico, evaluación, contenidos y seguimiento.
16. Las fichas y materiales de examen distinguirán información verificada de configuraciones referenciales y respetarán fuentes, licencias y versiones; no se afirmará que Mentelyx representa oficialmente a una universidad sin autorización.
17. Los indicadores de preparación no garantizan aprobación, calificación o admisión, y los datos del progreso académico no se utilizarán para segmentar publicidad.

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

### Verificación propuesta para preparación de exámenes

Los siguientes ejemplos expresan criterios iniciales **pendientes de validación**; serán detallados como casos de prueba cuando se priorice el desarrollo de esta modalidad.

| Requisito | Comprobación mínima sugerida |
|---|---|
| RF-49 | El estudiante puede seleccionar una ficha de examen válida y guardar un objetivo con fecha opcional; otro estudiante no puede modificarlo. |
| RF-50 | Con un temario vinculado y un diagnóstico registrado se genera un plan por temas; una nueva evaluación permite actualizar las prioridades sin borrar el historial previo. |
| RF-51 | Un administrador autorizado publica una ficha con su versión, fuente y condición referencial/verificada; las prácticas y simulacros se vinculan a esa ficha y respetan la configuración disponible. |
| RF-52 | Un estudiante consulta el avance de su propio objetivo y visualiza resultados por tema, dificultades y actividades completadas; no puede consultar información privada de terceros. |

## Delimitación del MVP académico

El **MVP académico de Mentelyx** comprobará el flujo de cuenta, diagnóstico, perfil de aprendizaje, recomendación, actividades educativas y consulta del progreso. La organización de contenidos y evaluaciones se diseñará para **múltiples niveles educativos, áreas, cursos y temas**, sin restringir los requisitos a Matemática ni a Secundaria. Para la demostración se podrá cargar una cantidad reducida de contenidos de ejemplo y comprobar que es posible incorporar otras áreas o cursos sin rehacer los módulos académicos. **La preparación de exámenes (RF-49 a RF-52) se mantiene como ampliación funcional propuesta**: podrá demostrarse con una ficha y un temario representativos, sin afirmar que se hayan cargado convocatorias oficiales ni que exista integración con universidades. La selección de contenidos y la asignación de RF por sprint se definirán en la planificación; no modifican el alcance funcional global.

## Alcance incremental y validación

Los RF-35 a RF-52 son **especificación del producto ampliado**. Para el proyecto del curso se prioriza un flujo vertical demostrable de autenticación, catálogo multidisciplinario, diagnóstico, perfil, recomendaciones y progreso; el resto se incorpora mediante prototipos o incrementos según el cronograma, no se declara implementado. La arquitectura deberá soportar todas las capacidades, pero una decisión de proveedor no sustituye una prueba.

| Flujo | Ejemplo de aceptación verificable |
|---|---|
| RF-35/RF-41 | Material sin licencia RAG nunca aparece en resultados vectoriales; su retirada impide nuevas recuperaciones después de purgar índices/cachés. |
| RF-37/RF-48 | Persona sin reserva válida no puede obtener credenciales de sala; sobrecupos son rechazados. |
| RF-38 | La suma de partes y costos en cada liquidación reproduce la regla versionada y no cambia al modificar tarifas futuras. |
| RF-39/RF-40 | No se muestran anuncios en evaluación, clase en vivo, editor docente, lección de pago o liquidación. |
| RF-42 | La IA devuelve fuentes permitidas o una respuesta controlada si faltan fuentes o proveedor, sin inventar una calificación. |
| RF-43/RF-44 | Una cuota agotada bloquea nuevas consultas pagadas de IA sin impedir acceso a recursos educativos ya permitidos; existen alertas de costo. |
| RF-45 | Grabación ausente por defecto y acceso denegado sin autorización y política válidas. |
| RF-47 | Recurso privado no emite token de reproducción sin validación de derecho de acceso. |
