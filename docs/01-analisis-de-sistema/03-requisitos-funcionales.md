# 03. Requisitos funcionales — Mentelyx

> **Versión:** 1.5 


## 1. Convenciones y alcance

**RF** describe comportamiento observable; **AC** describe cómo de bien debe operar; **RC** impone límites. Se preservan **RF-01 a RF-72** y se incorporan **RF-73 a RF-99**. Estas especificaciones no certifican que estén implementadas. `RF-15–RF-17` son de fase **POSTERIOR**.

## 2. Catálogo funcional consolidado (RF-01 a RF-99)

| ID | Requisito verificable | Prioridad/etapa |
|---|---|---|
| RF-01 | El sistema debe ofrecer registro público con exactamente tres tipos principales de cuenta: Estudiante, Creador educativo y Docente; sin correo institucional obligatorio, con verificación de edad y controles para menores. El estudiante elige nivel educativo. El docente elige modalidad independiente/libre o por nivel académico. | Por priorizar |
| RF-02 | El sistema debe autenticar de forma segura a los usuarios, permitir inicio/cierre de sesión, recuperación de credenciales y verificación de correo, mediante un componente de autenticación probado cuya integración se valide. | Por priorizar |
| RF-03 | El sistema debe permitir al superadministrador gestionar cuentas y asignar o revocar roles y permisos de administración. | Por priorizar |
| RF-04 | El sistema debe comprobar la identidad y los permisos aplicables antes de ejecutar operaciones protegidas o consultar información restringida. | Por priorizar |
| RF-05 | El sistema debe permitir consultar los contenidos publicados utilizando criterios de nivel educativo, área, curso y tema. | Por priorizar |
| RF-06 | El sistema debe permitir a los administradores autorizados organizar niveles, áreas, cursos y temas, así como registrar, revisar, actualizar, publicar y retirar contenidos educativos, ejercicios y evaluaciones. | Por priorizar |
| RF-07 | El sistema debe permitir a un estudiante realizar una evaluación diagnóstica y registrar sus respuestas y resultados asociados a su cuenta. | Por priorizar |
| RF-08 | El sistema debe construir y actualizar un perfil de aprendizaje a partir de diagnósticos y desempeño registrado, y utilizarlo para generar o ajustar recomendaciones, rutas de aprendizaje y niveles de dificultad. | Por priorizar |
| RF-09 | El sistema debe permitir resolver ejercicios, registrar respuestas e intentos, presentar pistas y proporcionar retroalimentación sobre el desempeño. | Por priorizar |
| RF-10 | El sistema debe permitir a administradores autorizados configurar simulacros y a los estudiantes realizarlos, respetando sus condiciones de duración y calificación. | Por priorizar |
| RF-11 | El sistema debe permitir al estudiante consultar sus propios resultados, historial y progreso académico. | Por priorizar |
| RF-12 | El sistema debe permitir publicar y consultar los planes educativos, de aulas y de Studio con precios, derechos, cuotas y condiciones versionadas. | Por priorizar |
| RF-13 | El sistema debe permitir contratar, renovar y cancelar suscripciones y controlar sus estados de activación y vencimiento. | Por priorizar |
| RF-14 | El sistema debe comprobar productos, vigencias y saldos específicos antes de habilitar contenido, generaciones IA y reservas de clases; no mezclar créditos Live y Studio. | Por priorizar |
| RF-15 | El sistema podrá permitir a administración registrar y actualizar convenios, condiciones y vigencias solamente en la fase POSTERIOR al lanzamiento; no debe bloquear el registro individual. | **POSTERIOR** |
| RF-16 | En la fase POSTERIOR de convenios, el sistema podrá verificar elegibilidad y asignar beneficios sin compartir datos académicos personales con instituciones. | **POSTERIOR** |
| RF-17 | En la fase POSTERIOR, el sistema podrá aplicar beneficios de convenios y su vencimiento, conservando la cuenta e historial individual. | **POSTERIOR** |
| RF-18 | El sistema debe permitir a Docentes de ambas modalidades y a estudiantes universitarios adultos autorizables preparar borradores, y gestionar de manera separada identidad, habilitación comercial para tutorías y, cuando corresponda, acreditación académica. La administración podrá revisar, aprobar, suspender o revocar cada autorización. | Por priorizar |
| RF-19 | El sistema debe gestionar dos modalidades del perfil Docente: independiente/libre, con materias o temas y experiencia declarada sin campos de títulos o especialización acreditada; y por nivel académico, con niveles, materias y formación declarada cuya acreditación será independiente y verificable. | Por priorizar |
| RF-20 | El sistema debe permitir consultar perfiles de docentes habilitados y estudiantes tutores autorizados, con temas o áreas, contenidos demostrativos y servicios disponibles, distinguiendo expresamente credenciales verificadas de información no acreditada. | Por priorizar |
| RF-21 | El sistema debe permitir a un Docente habilitado o a un Estudiante universitario adulto con permiso de tutoría vigente publicar ofertas pagadas indicando horarios, aforo y tarifa; sin habilitación solo podrán prepararse borradores. | Por priorizar |
| RF-22 | El sistema debe permitir solicitar reservas de tutoría y comprobar la disponibilidad de horarios y cupos antes de aceptarlas. | Por priorizar |
| RF-23 | El sistema debe confirmar una tutoría contratada únicamente después de verificar la validez de la reserva y del pago, sin exceder los cupos disponibles. | Por priorizar |
| RF-24 | El sistema debe permitir a estudiantes y docentes consultar sus propias tutorías y registrar o consultar el estado de las sesiones, según sus permisos. | Por priorizar |
| RF-25 | El sistema debe permitir solicitar y gestionar cancelaciones y reembolsos de acuerdo con las condiciones aplicables a cada contratación. | Por priorizar |
| RF-26 | El sistema debe registrar las órdenes de contratación y solicitar el procesamiento de sus pagos a un servicio externo. | Por priorizar |
| RF-27 | El sistema debe verificar los resultados de pago comunicados por el proveedor externo y actualizar el estado de las operaciones evitando aplicar sus efectos más de una vez. | Por priorizar |
| RF-28 | El sistema debe calcular liquidaciones de docentes a partir de los servicios prestados y de las condiciones económicas acordadas. | Por priorizar |
| RF-29 | El sistema debe permitir registrar pagos efectuados a docentes y consultar, según los permisos asignados, los montos pendientes, liquidados y pagados. | Por priorizar |
| RF-30 | El sistema debe generar avisos relevantes sobre cuentas, suscripciones, reservas, tutorías y operaciones económicas para su entrega mediante el servicio de notificaciones. | Por priorizar |
| RF-31 | El sistema debe registrar operaciones administrativas y económicas relevantes y permitir consultar la información registrada únicamente a usuarios autorizados. | Por priorizar |
| RF-32 | El sistema debe permitir registrar incidencias de soporte, consultar su estado y documentar su atención. | Por priorizar |
| RF-33 | El sistema debe ofrecer una experiencia web instalable como PWA en dispositivos y navegadores compatibles, de modo que pueda iniciarse desde el icono instalado cuando el entorno lo admita. | Por priorizar |
| RF-34 | El sistema debe permitir acceder desde el navegador o desde la PWA instalada utilizando la misma cuenta y consultar información académica, suscripciones y tutorías actualizadas al conectarse al servicio. | Por priorizar |
| RF-35 | El sistema debe permitir a Creador y Docente adultos crear, cargar, versionar y guardar materiales propios en Studio sin autorización previa para borradores; el estudiante podrá subir sus apuntes o crear recursos según permisos y conservará siempre su cuenta Estudiante. La publicación, venta, RAG y eventual entrenamiento requieren permisos independientes. | Por priorizar |
| RF-36 | El sistema debe permitir a Docentes habilitados en cualquiera de sus modalidades, y a Estudiantes universitarios adultos con permiso especial, programar clases individuales, grupales o magistrales; sin habilitación comercial podrán conservar borradores privados. | Por priorizar |
| RF-37 | El sistema debe permitir a estudiantes autorizados reservar o inscribirse en clases en vivo, acceder mediante credenciales de sesión de corta duración y consultar o gestionar sus estados y condiciones aplicables. | Por priorizar |
| RF-38 | El sistema debe calcular y registrar pagos docentes y comisión de plataforma según modalidad (suscripción Live o venta directa), versión de política, comisiones de pasarela y costos atribuibles, preservando trazabilidad. | Por priorizar |
| RF-39 | El sistema debe permitir a la administración gestionar campañas, patrocinadores, categorías y ubicaciones autorizadas de banners, activarlos y suspenderlos, y consultar métricas agregadas sin exponer datos académicos privados. | Por priorizar |
| RF-40 | El sistema debe mostrar anuncios claramente identificados solo en superficies habilitadas y según la política del plan, sin interrumpir evaluaciones, videoclases, editor docente, liquidaciones ni reproducción de lecciones de pago; debe aplicar controles adicionales de privacidad y publicidad apropiados para menores. | Por priorizar |
| RF-41 | El sistema debe registrar revisión editorial, versión, autoría, licencia, alcance de acceso y permiso de indexación de cada fuente RAG, impedir recuperar material no autorizado y permitir su despublicación y desindexación cuando corresponda. | Por priorizar |
| RF-42 | El sistema debe permitir al estudiante habilitado consultar a un tutor pedagógico con IA que recupere exclusivamente fuentes autorizadas, produzca explicaciones adaptadas a su contexto permitido, muestre referencias y gestione las fallas sin modificar unilateralmente calificaciones. | Por priorizar |
| RF-43 | El sistema debe administrar derechos de acceso, cuotas y vigencias de Gratuito, Plus, Pro, Aulas Live, Studio Free, Studio Plus y Studio Pro; aplicar límites independientes de crédito Live y Studio, sin confundirlos con rol o habilitación docente. | Por priorizar |
| RF-44 | El sistema debe registrar métricas de consumo y costo por servicio (IA, video, almacenamiento y sesiones, cuando exista información del proveedor), permitir a administradores ver agregados y configurar alertas y límites para controlar el presupuesto operativo. | Por priorizar |
| RF-45 | El sistema debe mantener desactivada por defecto la grabación de clases en vivo y habilitarla solamente cuando existan permisos, avisos, reglas de acceso, retención y retirada válidos para la sesión correspondiente. | Por priorizar |
| RF-46 | El sistema debe permitir a la administración registrar contratos/licencias de contenidos comerciales docentes y a cada docente consultar sus condiciones, versiones, vigencias y remuneraciones correspondientes a los materiales que le pertenecen. | Por priorizar |
| RF-47 | El sistema debe permitir publicar y reproducir videos grabados mediante un proveedor especializado, comprobando los derechos de acceso antes de entregar credenciales temporales de reproducción y evitando enviar el flujo de video a través del backend de negocio. | Por priorizar |
| RF-48 | El sistema debe poder crear, autorizar, cerrar y auditar salas o emisiones audiovisuales mediante proveedores externos, diferenciando transmisión uno-a-muchos de tutorías interactivas y protegiendo la incorporación de participantes no autorizados. | Por priorizar |
| RF-49 | El sistema debe permitir al estudiante definir un objetivo de preparación de examen escolar, preuniversitario, de admisión o universitario cuando exista ficha válida, con fecha y tiempo de estudio opcionales, sin afiliación institucional. | Por priorizar |
| RF-50 | El sistema debe generar y actualizar un plan de preparación para el objetivo seleccionado, relacionando temario disponible, diagnóstico previo, dificultades identificadas y tiempo previsto o disponible; debe mostrar las actividades por área y tema sin atribuir al plan garantía de éxito. | Por priorizar |
| RF-51 | El sistema debe permitir a administradores autorizados configurar y versionar fichas de examen con fuente, tipo, temario, estructura, duración y criterios de calificación cuando sean conocidos, diferenciando fichas oficiales verificadas de referencias no oficiales; también debe permitir al estudiante realizar prácticas y simulacros vinculados a esas fichas reutilizando las funciones de ejercicios y evaluaciones existentes. | Por priorizar |
| RF-52 | El sistema debe permitir al estudiante consultar el seguimiento de su objetivo, incluyendo actividades completadas, progreso por áreas o temas, historial de prácticas y simulacros, dificultades recurrentes y cumplimiento del plan, sin presentar esas métricas como predicción garantizada de su resultado real. | Por priorizar |
| RF-53 | El registro público debe guardar exactamente uno de tres tipos de cuenta principal en PostgreSQL: Estudiante, Creador educativo o Docente. La modalidad del perfil Docente se registra aparte y no constituye un tipo de cuenta adicional. | Alta |
| RF-54 | El registro de Creador educativo y Docente debe exigir mayoría de edad de 18 años; las solicitudes de tutoría de estudiantes universitarios deben verificar también mayoría de edad. El registro estudiantil aplica protecciones específicas para menores. | Crítica |
| RF-55 | Un Estudiante podrá subir apuntes y materiales sin cambiar automáticamente de tipo; compartir públicamente requerirá política editorial y permisos. | Alta |
| RF-56 | Las herramientas manuales de Mentelyx Studio deben estar disponibles para Creador y Docente al completar el registro, con edición y borradores privados sin acreditación comercial; los estudiantes tendrán las funciones de autoría que su cuenta permita. | Alta |
| RF-57 | Al registrarse como Docente, el usuario debe elegir entre modalidad independiente/libre y modalidad por nivel académico. En la primera se gestionan temas y experiencia declarada, sin campos de grado académico o especialización acreditada; en la segunda se seleccionan niveles de enseñanza (Primaria, Secundaria, Preuniversitario, Universitario), asignaturas y formación declarada. Cambios de modalidad deben seguir un procedimiento controlado. | Alta |
| RF-58 | La publicación de tutorías remuneradas por Docentes y Estudiantes universitarios adultos debe exigir comprobación de identidad y habilitación comercial vigente, con controles adicionales si los participantes son menores; sin habilitación, las ofertas permanecen privadas. | Crítica |
| RF-59 | La acreditación profesional solo podrá mostrarse como verificada dentro del perfil Docente por nivel académico después de revisión documental; la elección de nivel, la declaración de licenciatura/maestría/doctorado y la habilitación comercial no sustituyen la verificación de credenciales. | Alta |
| RF-60 | Mentelyx Studio debe guardar presentaciones estructuradas, recursos y ejercicios versionados con propiedad, publicación, licencias y reglas de acceso explícitas. | Alta |
| RF-61 | La generación mediante IA de Studio debe registrar cuota/créditos y costo estimado, aplicar límites por cuenta y no bloquear funciones manuales cuando no existan créditos. | Alta |
| RF-62 | El sistema no destinará datos personales identificables de menores a entrenar o ajustar IA; en mayores se requerirán permisos separados según política y base jurídica válida. | Crítica |
| RF-63 | El backend debe ofrecer comprobaciones de salud y disponibilidad de dependencias, sin exponer secretos ni detalles internos al público. | Alta |
| RF-64 | La operación debe emitir métricas, alertas y eventos de fallos de API, PostgreSQL, MongoDB y proveedores críticos, habilitando procedimientos de recuperación definidos. | Crítica |
| RF-65 | Los repositorios de datos SQL deberán poder funcionar con PostgreSQL **local** y, más adelante, un PostgreSQL administrado configurado por entorno, mediante migraciones versionadas. | Alta |
| RF-66 | Ante fallas de un servicio no esencial (correo, IA, publicidad), el sistema debe mantener disponibles operaciones no dependientes y presentar errores recuperables. | Alta |
| RF-67 | El catálogo debe soportar cursos, asignaturas y áreas universitarias, con carrera/ciclo/prerrequisitos opcionales y políticas de derechos sobre temarios y materiales. | Alta |
| RF-68 | Los eventos de pago, video y colas deben manejar duplicados mediante idempotencia, reintentos acotados y revisión de tareas fallidas, sin duplicar efectos confirmados. | Crítica |
| RF-69 | El editor de Studio debe indicar estados local/no sincronizado/confirmado; nunca mostrará «guardado en servidor» antes de confirmación persistente. | Alta |
| RF-70 | Toda operación sensible debe validar sesión, tipo de cuenta, modalidad docente cuando aplique, capacidad de autorización para tutoría, edad, propiedad de recursos, plan, habilitación y estado de acreditación verificable en el backend, no solo en interfaz. | Crítica |
| RF-71 | El superadministrador debe poder consultar un dashboard privado de latencia, errores, disponibilidad, uso por proveedor, IA, video y presupuesto; el acceso debe auditarse. | Alta |
| RF-72 | El equipo debe poder ejecutar procedimientos documentados para verificar backups, restauraciones, recuperación de colas y manejo de pérdida de conectividad antes de operar flujos críticos. | Crítica |
| RF-73 | Configurar los productos Gratuito, Plus, Pro, Aulas Live, Studio Free, Studio Plus y Studio Pro con límites diferenciados y sus versiones de precio; Studio Equipos queda POSTERIOR. | Alta |
| RF-74 | Tras un pago verificado de Aulas Live, asignar el lote mensual de créditos Live y registrar fecha de vencimiento y movimientos en PostgreSQL. | Crítica |
| RF-75 | Reservar y consumir créditos Live de forma transaccional y única por usuario, sesión y período; evitar doble gasto y sobrecupos con restricciones SQL. | Crítica |
| RF-76 | Mostrar antes de confirmar una clase el costo en créditos por modalidad y los términos de consumo, no-show, cancelación y restitución. | Alta |
| RF-77 | Permitir clases grupales de 6 a 35 alumnos, reforzamientos de 2 a 5 y tutorías individuales de 1, hasta 60 minutos como referencia; permitir ampliar reglas mediante configuración. | Alta |
| RF-78 | Gestionar pago docente por créditos Live efectivamente válidos mediante una política versionada y aceptada, distinta del reparto de clases de venta individual; no liquidar solo por reserva. | Crítica |
| RF-79 | Comprobar antes de ofrecer una clase la capacidad audiovisual, habilitación del tutor, oferta de horarios, costos estimados y sostenibilidad según reglas configurables. | Alta |
| RF-80 | Permitir contratar una clase individual sin obligar a coordinar compras grupales y calcular precio mínimo según pasarela y costos para evitar ofertas deficitarias sin subvención. | Alta |
| RF-81 | Registrar y validar patrocinio o presupuesto interno antes de habilitar aulas gratuitas, y descontar su costo contra dicho presupuesto. | Alta |
| RF-82 | Gestionar cuotas de Studio Plus y Studio Pro mediante un registro persistente de movimientos; diferenciar créditos Studio de Live y evitar saldo negativo por concurrencia. | Crítica |
| RF-83 | Mostrar costo de créditos antes de generar presentaciones, actividades, análisis de documentos o imágenes, e indicar saldo; la edición manual y gráficos deterministas no consumen cuota IA. | Alta |
| RF-84 | Registrar por operación de IA modelo, tokens/unidades, usuario, plan, costo observado y estado; permitir límites y presupuestos de seguridad sin exponer datos sensibles. | Crítica |
| RF-85 | Reintegrar de forma idempotente créditos Studio por tareas fallidas imputables al servicio, según política y auditoría. | Alta |
| RF-86 | Separar en reportes ingreso neto de IGV cuando aplique, costo de pasarela, remuneración docente, video, IA, almacenamiento, soporte, reembolsos, contribución y gastos fijos. | Crítica |
| RF-87 | No crear derechos de uso ilimitados al comprar suscripciones; aplicar autorización por producto, vigencia, cuota, rol, edad y permisos específicos. | Crítica |
| RF-88 | El sistema debe permitir al Estudiante universitario mayor de 18 años solicitar habilitación adicional para tutorías sobre materias que domina, conservando la cuenta Estudiante y sin atribuirle grados ni acreditaciones docentes; no podrá publicar tutorías pagadas hasta aprobar la revisión correspondiente. | Alta |
| RF-89 | Permitir aulas con 35 estudiantes más docente como capacidad objetivo inicial y comprobar autorización, roles y límites de emisores de audio/video. | Alta |
| RF-90 | Usar WebRTC/SFU gestionado para clases interactivas; grabar solo con autorización y transferir videos aprobados a almacenamiento y reproducción con reglas de retención. | Alta |
| RF-91 | Administrar archivos de documentos mediante almacenamiento de objetos y enviar a la cola referencias de trabajo, con reintentos, deduplicación y DLQ para procesamiento e indexación. | Alta |
| RF-92 | Registrar idempotency keys, webhooks verificados, estados de cobro y pagos al docente, eventos outbox y conciliación bancaria/proveedor sin duplicar efectos financieros. | Crítica |
| RF-93 | Separar autenticación (biblioteca integrada) de autorización (código de Mentelyx); proteger cookies, sesiones, MFA administrativo y recuperación de credenciales. | Crítica |
| RF-94 | Administrar Redis como caché/contadores temporales con TTL, invalidación y degradación segura; nunca como saldo oficial de créditos o pagos. | Alta |
| RF-95 | Supervisar disponibilidad de API, bases de datos, Redis, colas, aula virtual, pasarela e IA y generar alertas y procedimientos de recuperación comprobables. | Crítica |
| RF-96 | Garantizar que la confirmación de respuestas académicas y movimientos monetarios/crediticios ocurra solo tras confirmación persistente en PostgreSQL. | Crítica |
| RF-97 | Gestionar versiones y condiciones comerciales de Studio, créditos Live, impuestos y comisiones sin modificar liquidaciones históricas ya acordadas. | Crítica |
| RF-98 | Restringir publicidad no invasiva y sin segmentación por progreso, especialmente para menores; prohibir su inserción durante clases y evaluaciones. | Alta |
| RF-99 | Permitir a usuarios autorizados consultar los derechos de acceso y permisos de contenido grabado, material creado y fuentes RAG, con retirada e invalidación de acceso. | Alta |

## 3. Reglas de negocio transversales

1. El registro ofrece **cuatro tipos** principales; acreditación profesional y capacidad de tutoría remunerada se habilitan en procedimientos separados.
2. **PostgreSQL** es la fuente autoritativa de pagos, reservas, créditos, calificaciones y movimientos; MongoDB conserva documentos educativos; Redis nunca sustituye la persistencia crítica.
3. Los precios candidatos: estudiante Plus **S/29,90**, Pro **S/59,90**; Aulas Live **S/99,90** por **4 créditos Live**; Studio Plus **S/29,90** por **300 créditos Studio**, Studio Pro **S/69,90** por **900 créditos Studio**. **No son tarifas definitivas**.
4. Referencia de modalidades Live: seminario 1 crédito, reforzamiento reducido 2, tutoría individual 3; **35 estudiantes + docente** por aula estándar; duración referencial 60 minutos.
5. Docente por Live: hipótesis de **S/8 por crédito válido**, a negociar y versionar. Las ventas directas poseen tarifa/porcentaje diferente y deben superar reglas de rentabilidad. Pago grupal coordinado **no es obligatorio**.
6. Las clases gratuitas requieren presupuesto patrocinado/promocional autorizado. No se presume que mostrar publicidad cubra el video.
7. Una inscripción se confirma con **beneficio vigente y cupo transaccional**, no solo con un contador Redis. La pasarela confirma cobros, pero el proveedor puede liquidar en fecha posterior.
8. La edición manual de Studio es gratuita para cuentas elegibles; la IA consume cuota y se mide por operación. Las equivalencias de créditos son hipótesis sujetas a benchmark.
9. Grabaciones desactivadas por defecto, con controles de menores, consentimientos, licencias, caducidad, revocación y derechos de difusión.
10. Las instituciones con convenio son **POSTERIORES**, sin bloquear registros ni introducir permisos institucionales en el MVP.

## 4. Trazabilidad de las nuevas historias a requisitos

| Historias | Requisitos relacionados |
|---|---|
| HU-54, HU-55, HU-66, HU-70 | RF-12 a RF-14, RF-73 a RF-77, RF-87 |
| HU-56 | RF-25, RF-75, RF-76, RF-92 |
| HU-57, HU-59, HU-69 | RF-21 a RF-29, RF-77 a RF-80, RF-89 |
| HU-58 | RF-18, RF-58, RF-70, RF-88, RF-93 |
| HU-60 a HU-62 | RF-56, RF-60, RF-61, RF-82 a RF-85 |
| HU-63, HU-64, HU-68 | RF-38, RF-44, RF-68, RF-71, RF-86, RF-92, RF-95 a RF-97 |
| HU-65 | RF-45, RF-48, RF-90, RF-99 |
| HU-67 | RF-39, RF-40, RF-81, RF-98 |

## 5. Criterios de aceptación mínimos (propuestos, todavía no ejecutados)

| Caso | Criterio comprobable |
|---|---|
| RF-73/87 | Plus/Pro no habilita aulas ilimitadas; Aulas Live no habilita IA premium; créditos Studio y Live se distinguen en API/UI. |
| RF-74–76 | Una orden confirmada otorga exactamente 4 créditos Live; dos reservas concurrentes del mismo saldo no consumen más del saldo disponible. |
| RF-77/89 | Puede reservarse aula con 35 alumnos y docente sin sobrecupo; el alumno 36 recibe respuesta segura. |
| RF-78/97 | Liquidación refleja tarifa versionada aceptada y nunca se recalcula retroactivamente por cambio del plan. |
| RF-79–81 | Clase gratuita sin presupuesto no se publica; clase individual con margen negativo no se ofrece sin subvención expresa. |
| RF-82–85 | Editar un gráfico manual no consume créditos; generación IA sí, con cargo único/reembolso ante error elegible. |
| RF-88/93 | Universitario adulto con cuenta Estudiante no obtiene autorización docente por publicar apuntes; solo tras habilitación específica. |
| RF-91/92 | Trabajo duplicado de cola/webhook no duplica publicación, pago ni créditos; hay DLQ y conciliación. |
| RF-95/96 | Al caer Redis, rutas críticas aplican controles seguros; una evaluación no confirma guardado sin persistencia SQL. |

## 6. Implementación incremental

Priorizar una primera vertical completa de **identidad → catálogo → inscripciones/créditos en sandbox → clase simulada → liquidación simulada → observabilidad**, además de Studio manual y una generación IA medida. No es necesario desplegar las 99 funcionalidades en un solo sprint.
