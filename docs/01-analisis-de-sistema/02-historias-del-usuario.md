# 02. Historias de usuario por actor — Mentelyx

> **Versión:** 2.0 — 09/11/2026. **Base revisada:** v1.5 (20/10/2026). **Estado:** diseño documental sincronizado con dos tipos de cuenta públicos; requisitos y políticas comerciales sujetos a pruebas y validación. No supone código implementado ni servicios contratados.

> **Revisión terminológica:** 2.1 — 10/11/2026. Se conservan el alcance, los identificadores y la versión funcional 2.0.

> **Corrección integral:** 2.2 — 20/11/2026. Aplica la [instrucción maestra](../00-gestion-del-proyecto/sprint-02/instruccion-maestra.md) (IM): reescribe HU-54, 55, 60, 63, 69 y 70 y la regla 6, y añade HU-71 a HU-90 (sección 10). Las redacciones anteriores quedan como **sustituidas** en la sección 11.

> **Revisión documental:** 2.3 — 25/11/2026. Alinea HU-48, HU-56, HU-61, HU-62 y HU-64 con recursos de plan y pagos directos; conserva sus redacciones previas en la sección 11. Las políticas de cancelación/devolución y tratamiento de fallos permanecen pendientes de decisión.

> **Revisión de alcance:** 2.4 — 25/11/2026. Este catálogo conserva las historias aprobadas para el producto completo; las capacidades incluidas en Mentelyx V1 se delimitan por ADR-093 y las funciones pospuestas no se consideran disponibles en V1. El estado de una HU no acredita implementación.

## 1. Criterio de organización

- Las historias se organizan alrededor de **tres actores humanos activos**: Estudiante (ACT-01), Docente (ACT-03) y Superadministrador (ACT-04). ACT-02 queda retirado, sin renumerar identificadores.
- El registro ofrece **dos tipos de cuenta pública: Estudiante y Docente**. El **Docente** elige una **modalidad de perfil**: independiente (libre) o por nivel académico. Ninguna modalidad constituye otro actor.
- Un **Estudiante universitario mayor de edad** puede solicitar permiso especial para impartir tutorías sobre temas que domina; conserva su cuenta Estudiante. No se presenta como docente titulado.
- Las historias compartidas de Studio y clases aparecen **una sola vez**. El permiso individual, no el nombre de la sección, determina quién puede realizarlas.
- Las acreditaciones profesionales y la habilitación comercial son procesos diferentes. Escribir un grado no equivale a verificarlo.
- Los importes aprobados se rigen por la IM (secciones 14 y 15); los límites de recursos por plan son parámetros de piloto versionados. Las políticas aún no aprobadas se identifican como propuestas y no se asumen implementadas. HU-09 y HU-22 continúan en **fase posterior**.


## 2. Registro público compartido

**Aplica a:** Estudiante y Docente. El superadministrador no se registra públicamente.

| ID | Historia de usuario | Estado |
|---|---|---|
| HU-41 | Como persona que se registra, quiero elegir entre Estudiante y Docente y, si elijo Docente, seleccionar la modalidad independiente o por nivel académico, para configurar mi perfil sin crear tipos de cuenta innecesarios. | Definida para análisis |

## 3. Estudiante (ACT-01)

**Incluye:** estudiante universitario adulto que solicita permiso especial de tutoría. El permiso no transforma su tipo de cuenta.

| ID | Historia de usuario | Estado |
|---|---|---|
| HU-01 | Como estudiante, quiero registrarme y elegir mi nivel entre Primaria, Secundaria, Preuniversitario y Universitario, para estudiar sin depender de una institución. | Definida para análisis |
| HU-02 | Como estudiante, quiero realizar una evaluación diagnóstica, para identificar mis conocimientos previos y los temas que necesito reforzar. | Definida para análisis |
| HU-03 | Como estudiante, quiero recibir una ruta de aprendizaje personalizada que se actualice con mi desempeño, para estudiar según mis necesidades y avanzar gradualmente. | Definida para análisis |
| HU-04 | Como estudiante, quiero consultar contenidos organizados por nivel, área, curso y tema, para encontrar los recursos educativos que necesito. | Definida para análisis |
| HU-05 | Como estudiante, quiero resolver ejercicios y recibir pistas y retroalimentación, para comprender mis errores y mejorar mi aprendizaje. | Definida para análisis |
| HU-06 | Como estudiante, quiero realizar simulacros y consultar mis resultados, para evaluar mi preparación académica. | Definida para análisis |
| HU-07 | Como estudiante, quiero consultar mi progreso y mi historial académico, para reconocer mis avances y dificultades. | Definida para análisis |
| HU-08 | Como estudiante, quiero consultar los planes y gestionar mi suscripción, para acceder a los beneficios que se ajusten a mis necesidades. | Definida para análisis |
| HU-09 | Como estudiante beneficiario de un convenio futuro, quiero consultar y aplicar beneficios autorizados, para obtener descuentos cuando Mentelyx implemente esta fase POSTERIOR. | Posterior |
| HU-10 | Como estudiante, quiero consultar perfiles y materiales demostrativos de docentes habilitados o estudiantes tutores autorizados, para elegir una clase o reforzamiento adecuado. | Definida para análisis |
| HU-11 | Como estudiante, quiero reservar y pagar tutorías impartidas por docentes habilitados o estudiantes tutores autorizados, para recibir acompañamiento educativo. | Definida para análisis |
| HU-12 | Como estudiante, quiero consultar mis tutorías y solicitar su cancelación cuando corresponda, para organizar mi participación. | Definida para análisis |
| HU-25 | Como estudiante, quiero acceder a Mentelyx desde el navegador o instalarla como PWA en un dispositivo compatible, para utilizar la plataforma desde distintos dispositivos con mi misma cuenta. | Definida para análisis |
| HU-28 | Como estudiante, quiero reservar e ingresar a una clase en vivo para la que esté autorizado, para aprender e interactuar según la modalidad contratada. | Definida para análisis |
| HU-31 | Como estudiante con acceso habilitado, quiero formular preguntas al tutor pedagógico de IA y recibir explicaciones fundamentadas en materiales autorizados, para comprender los temas de mis cursos. | Definida para análisis |
| HU-32 | Como estudiante gratuito, quiero reconocer claramente los anuncios y que no interrumpan mis actividades, para aprender sin confundir publicidad con contenido educativo. | Definida para análisis |
| HU-36 | Como estudiante, quiero seleccionar el tipo de examen para el que me preparo e indicar su fecha prevista cuando la conozca, para definir un objetivo de estudio concreto. | Definida para análisis |
| HU-37 | Como estudiante, quiero obtener y actualizar un plan de preparación según el temario disponible, mi diagnóstico y el tiempo que puedo dedicar, para organizar mis sesiones de estudio antes del examen. | Definida para análisis |
| HU-38 | Como estudiante, quiero realizar prácticas y simulacros relacionados con mi examen objetivo, para entrenarme con temas y condiciones semejantes a la evaluación prevista cuando se conozcan. | Definida para análisis |
| HU-39 | Como estudiante, quiero visualizar el avance de mi plan, mis resultados por área y las dificultades recurrentes, para decidir qué contenidos debo reforzar antes del examen. | Definida para análisis |
| HU-42 | Como estudiante, quiero subir archivos y notas propias, para estudiar o compartirlos según permisos sin cambiar automáticamente mi tipo de cuenta. | Definida para análisis |
| HU-51 | Como estudiante, quiero que mi progreso confirmado permanezca íntegro durante interrupciones, y que los cambios pendientes se identifiquen, para continuar sin confundir guardado local con persistencia remota. | Definida para análisis |
| HU-52 | Como estudiante universitario, quiero navegar por asignaturas, carreras o áreas y preparar evaluaciones universitarias, para estudiar contenidos propios de ese nivel. | Definida para análisis |
| HU-54 | Como estudiante, quiero contratar el plan Estándar, Plus o Premium y conocer sus recursos mensuales (consultas, evaluaciones, ilustraciones y almacenamiento), sabiendo que las clases humanas no están incluidas. | Aprobada (IM, sección 14) |
| HU-55 | Como estudiante, quiero conocer antes de reservar la tarifa por hora del docente, la modalidad y el medio de pago de una clase. | Aprobada (IM, sección 15) |
| HU-56 | Como estudiante, quiero conocer la política aplicable a una tutoría pagada directamente cuando se cancela una sesión, para saber qué devolución o efecto corresponde. | Propuesta de política; condiciones de cancelación y devolución pendientes de decisión |
| HU-58 | Como estudiante universitario mayor de edad, quiero solicitar autorización para enseñar un tema que domino, por ejemplo de veterinaria o programación, y recibir remuneración por tutorías, sin cambiar mi cuenta Estudiante ni presentarme como docente acreditado. | Definida para análisis; pendiente de validar habilitación |
| HU-66 | Como estudiante, quiero inscribirme en clases desde cualquier región individualmente, sin coordinación de un pago grupal, para utilizar Mentelyx con autonomía. | Definida para análisis |
| HU-70 | Como estudiante, quiero distinguir claramente los recursos de IA de mi plan del pago de clases con docentes, para no confundir planes. | Aprobada (IM, sección 14) |

## 4. Docente (ACT-03): historias comunes y modalidades

**Modalidad libre:** temas y experiencia declarada, sin campos ni insignias de títulos/especializaciones. **Modalidad por nivel:** niveles impartidos y formación declarada; acreditación visible solo después de verificación. Ambas modalidades utilizan una cuenta Docente.

| ID | Historia de usuario | Estado |
|---|---|---|
| HU-14 | Como docente, quiero configurar mi perfil de enseñanza según mi modalidad independiente o por nivel académico, con información y materiales demostrativos pertinentes, para presentarme sin atribuirme credenciales no verificadas. | Definida para análisis |
| HU-44 | Como docente que elige modalidad independiente (libre), quiero configurar los temas que enseño, una descripción de experiencia y mi disponibilidad sin un perfil de grados académicos o especializaciones profesionales, para ofrecer reforzamientos cuando obtenga habilitación. | Definida para análisis |
| HU-45 | Como docente que elige modalidad por nivel académico, quiero indicar los niveles, asignaturas y mi formación declarada, para presentar el perfil adecuado y solicitar acreditación cuando corresponda. | Definida para análisis |
| HU-46 | Como docente de modalidad por nivel, quiero presentar documentos de licenciatura, maestría, doctorado u otros estudios para revisión, de modo que la plataforma solo muestre credenciales verificadas tras su validación. | Definida para análisis |

## 5. Autoría compartida: Studio y publicaciones

**Aplica:** a Docente y a Estudiante según funcionalidades, permisos y edad. Studio no es un tipo de cuenta, y elaborar un material no habilita de por sí para impartir tutorías remuneradas.

| ID | Historia de usuario | Estado |
|---|---|---|
| HU-26 | Como autor de contenidos autorizado (Docente o Estudiante con permisos), quiero controlar licencias y permisos de publicación y RAG de mis materiales, para proteger su uso. | Definida para análisis |
| HU-43 | Como Docente o Estudiante con acceso autorizado a Studio, quiero utilizar las herramientas manuales disponibles sin consumir recursos de IA de mi plan y guardar borradores privados sin aprobación editorial previa, para diseñar materiales. | Definida para análisis |
| HU-53 | Como Docente o Estudiante con permisos de publicación, quiero gestionar publicación, licencias y accesos de cada versión, para controlar qué material puede verse, venderse, recuperarse por RAG o entrenar modelos conforme a autorizaciones distintas. | Definida para análisis |
| HU-47 | Como usuario con acceso a Studio, quiero crear presentaciones, gráficos, pizarras y actividades interactivas, para preparar recursos educativos claros. | Definida para análisis |
| HU-48 | Como usuario con acceso a Studio IA, quiero conocer la categoría y cantidad de recursos de mi plan que consume cada generación, para controlar mi consumo. | Definida para análisis |
| HU-60 | Como usuario con acceso a Studio, quiero saber qué recursos de mi plan consume cada generación y poder editar manualmente sin consumirlos. | Aprobada (IM, sección 13) |
| HU-61 | Como usuario con acceso a Studio, quiero editar manualmente presentaciones, gráficos y pizarras sin consumir recursos de IA de mi plan, para preparar materiales con libertad. | Definida para análisis |
| HU-62 | Como usuario con acceso a Studio IA, quiero conocer cómo se manejan los recursos de mi plan descontados por operaciones fallidas imputables a Mentelyx, para no perder recursos por fallos del servicio. | Propuesta de política; tratamiento de fallos pendiente de decisión |

## 6. Tutorías y aulas: usuarios habilitados para enseñar

**Aplica:** a Docentes de ambas modalidades y a Estudiantes universitarios mayores de edad **solo después de habilitación específica**. El acceso a Studio y la publicación de materiales no otorgan automáticamente este derecho.

| ID | Historia de usuario | Estado |
|---|---|---|
| HU-13 | Como persona autorizada para enseñar (Docente o Estudiante universitario adulto), quiero solicitar y gestionar mi habilitación de tutoría remunerada de forma independiente a cualquier título académico, para preparar clases mientras se verifica mi autorización. | Definida para análisis |
| HU-15 | Como usuario habilitado para impartir clases, quiero definir horarios, cupos, modalidad y tarifas, para publicar ofertas conforme a las reglas de Mentelyx. | Definida para análisis |
| HU-16 | Como usuario habilitado para impartir clases, quiero revisar inscripciones y registrar el desarrollo de las sesiones, para gestionar la atención de los participantes. | Definida para análisis |
| HU-17 | Como usuario habilitado para impartir clases, quiero consultar ingresos, liquidaciones y pagos derivados de mis tutorías, para conocer los importes que corresponden a mi actividad. | Definida para análisis |
| HU-27 | Como usuario habilitado para impartir clases, quiero programar tutorías individuales, reforzamientos y aulas virtuales indicando condiciones y remuneración, para escoger las modalidades que ofreceré. | Definida para análisis |
| HU-34 | Como usuario habilitado para impartir clases, quiero configurar la solicitud de grabación de mis sesiones, para conservar materiales únicamente cuando existan las autorizaciones requeridas. | Definida para análisis |
| HU-35 | Como autor que imparte clases, quiero conocer y aceptar las condiciones de publicación y explotación de mis materiales, para controlar derechos y remuneraciones aplicables. | Definida para análisis |
| HU-57 | Como usuario habilitado para impartir clases, quiero conocer las condiciones y el pago esperado por cada modalidad antes de publicar una sesión, para decidir si acepto la oferta. | Política comercial propuesta |
| HU-59 | Como usuario habilitado para impartir clases, quiero enseñar también a grupos de uno a cinco estudiantes, para realizar tutorías pequeñas sin exigir un mínimo arbitrario de alumnos. | Política comercial propuesta |
| HU-65 | Como usuario habilitado para impartir clases, quiero gestionar grabaciones autorizadas y accesos permitidos, para proteger los datos y derechos de sus participantes. | Definida para análisis |
| HU-69 | Como usuario habilitado para impartir clases, quiero ofrecer tutorías por horas con mi propia tarifa y recibir el pago directamente, para atender consultas puntuales. | Aprobada (IM, sección 15) |

## 7. Superadministrador (ACT-04)

**Rol administrativo interno**, asignado a una cuenta aprovisionada internamente; no es un tercer tipo de cuenta pública.

| ID | Historia de usuario | Estado |
|---|---|---|
| HU-18 | Como superadministrador, quiero gestionar cuentas, estados y permisos de acceso, para administrar Mentelyx de manera segura y auditable. | Definida para análisis |
| HU-19 | Como superadministrador, quiero gestionar contenidos, ejercicios y evaluaciones, para mantener organizada y actualizada la oferta educativa. | Definida para análisis |
| HU-20 | Como superadministrador, quiero evaluar por separado la habilitación para impartir clases, la verificación documental del solicitante y la validación de credenciales académicas de docentes por nivel, para proteger a estudiantes sin exigir títulos a quien enseña como independiente. | Definida para análisis |
| HU-21 | Como superadministrador, quiero configurar precios, planes, cuotas y condiciones comerciales, para administrar los servicios y mantener su sostenibilidad. | Definida para análisis |
| HU-22 | Como superadministrador, quiero gestionar convenios y beneficios cuando se active esa etapa, para incorporar instituciones sin condicionar el registro independiente de estudiantes. | Posterior |
| HU-23 | Como superadministrador, quiero supervisar cobros, reembolsos y liquidaciones docentes, para detectar inconsistencias y asegurar el registro de cada operación. | Definida para análisis |
| HU-24 | Como superadministrador, quiero atender incidencias y revisar registros de auditoría, para diagnosticar problemas y supervisar el servicio. | Definida para análisis |
| HU-29 | Como superadministrador, quiero configurar espacios publicitarios y campañas permitidas, para financiar parcialmente servicios gratuitos sin afectar la experiencia de aprendizaje. | Definida para análisis |
| HU-30 | Como superadministrador, quiero verificar origen, calidad y licencias de materiales antes de autorizar su incorporación al corpus RAG, para proteger los derechos y la calidad educativa. | Definida para análisis |
| HU-33 | Como superadministrador, quiero configurar cuotas y límites por plan y revisar consumos agregados, para controlar costos y sostenibilidad. | Definida para análisis |
| HU-40 | Como superadministrador, quiero mantener temarios y configuraciones de exámenes con indicación de fuentes oficiales o referenciales, para ofrecer preparación académica verificable. | Definida para análisis |
| HU-49 | Como superadministrador, quiero revisar independientemente solicitudes de publicación, habilitación para enseñar y acreditaciones de docentes por nivel, para aplicar controles proporcionales. | Definida para análisis |
| HU-50 | Como superadministrador, quiero consultar disponibilidad, errores, latencia y costos de servicios externos, para detectar incidentes y controlar gastos. | Definida para análisis |
| HU-63 | Como superadministrador, quiero consultar ingresos, consumo y margen por producto (planes estudiantiles, Docente Inicial y Docente Live) y por medio de pago, para detectar servicios deficitarios. | Operación |
| HU-64 | Como superadministrador, quiero aplicar límites de recursos de IA, cupos y presupuestos de forma verificable, para evitar consumo no autorizado y costos imprevistos. | Operación |
| HU-67 | Como superadministrador, quiero aprobar clases gratuitas solamente cuando su financiación promocional o patrocinio esté presupuestada, para evitar sesiones con costos no cubiertos. | Política comercial propuesta |
| HU-68 | Como superadministrador, quiero conciliar cobros, comisiones, reembolsos y liquidaciones y detectar duplicaciones, para controlar la integridad económica de Mentelyx. | Operación crítica |

## 8. Reglas de negocio vinculadas a las historias

1. **Registro:** dos tipos de cuenta públicos (Estudiante y Docente). Dos modalidades dentro de Docente, no dos actores ni dos cuentas.
2. **Docente libre:** puede configurar temas, materiales y horarios, pero no un perfil de especialización o grado académico acreditado; impartirá servicios pagados solo después de habilitarse.
3. **Docente por nivel:** indica uno o varios niveles de enseñanza y materias; puede declarar grados académicos, pero solo los documentos validados autorizan insignias de acreditación.
4. **Estudiante tutor:** solo para estudiante universitario adulto y habilitado. Conserva su cuenta y aparece con una denominación que no implique título docente oficial.
5. **Clases pequeñas:** tutorías individuales o de pocos estudiantes están permitidas según condiciones de autorización, reserva y rentabilidad. Aula estándar objetivo: 35 estudiantes más la persona que imparte la sesión.
6. **Planes:** estudiantiles Gratuito, Estándar, Plus y Premium; docentes Inicial y Live (IM, secciones 14 y 15). Ninguno constituye un actor adicional. Los recursos de IA del plan, la capacidad audiovisual docente y el pago de clases no se mezclan.
7. **Pagos y acreditaciones:** el registro de una cuenta no equivale a un pago confirmado; asimismo, la verificación documental del solicitante no equivale a la validación de sus credenciales académicas. Deben aplicarse transacciones/idempotencia, auditoría y controles adecuados para menores.
8. **Fase posterior:** convenios institucionales y productos no priorizados no son precondición para el lanzamiento.

## 9. Trazabilidad

Se conservan todas las **70 HU-01 a HU-70**, sin reutilizar los códigos de actor. HU-41 registra los dos tipos públicos; **HU-43 y HU-53** pasan a la sección de autoría compartida sin perder su identificador. Se corresponden con RF-01, RF-35, RF-53, RF-54, RF-55, RF-56 y RF-60; la habilitación docente y de universitarios adultos sigue su propia trazabilidad (RF-18, RF-21, RF-58, RF-70, RF-88).

Se añaden **HU-71 a HU-90** (20/11/2026) sin reutilizar identificadores.

## 10. Historias incorporadas por la instrucción maestra (HU-71 a HU-90)

| ID | Actor | Historia | RF |
|---|---|---|---|
| HU-71 | Estudiante | Como estudiante, quiero registrar mi nivel educativo y que mi condición de edad se actualice al cumplir la mayoría, sin que mi fecha de nacimiento sea pública. | RF-100 |
| HU-72 | Estudiante | Como estudiante, quiero aprender con el Tutor IA cualquier tema educativo aunque no esté matriculado ni haya cargado fuentes. | RF-42 |
| HU-73 | Estudiante | Como estudiante, quiero crear un espacio privado con mis PDF, sílabos, PPTX, DOCX e imágenes y que el Tutor priorice esas fuentes, cite páginas y me avise cuando complementa con conocimiento general, o use solo mis fuentes si así lo pido. | RF-42, RF-101, RF-102 |
| HU-74 | Estudiante | Como estudiante, quiero saber que mis conversaciones se conservan 90 días, recibir aviso antes de su eliminación y guardar lo importante en mis recursos. | RF-112 |
| HU-75 | Estudiante | Como estudiante, quiero preparar un examen personal sin ficha oficial, a partir de una conversación o de mis fuentes. | RF-49, RF-50 |
| HU-76 | Estudiante | Como estudiante, quiero configurar una evaluación (cantidad, dificultad, temas y tipos de preguntas) o pedir una generación rápida de al menos 15 preguntas variadas. | RF-103, RF-104 |
| HU-77 | Estudiante | Como estudiante, quiero recibir retroalimentación formativa en respuestas abiertas, conociendo sus limitaciones, y que la calificación oficial sea reproducible. | RF-105 |
| HU-78 | Estudiante | Como estudiante, quiero trabajar en un lienzo extensible con lapiceros, resaltadores, flechas, fórmulas, imágenes y modelos 3D desde computadora, tableta o celular. | RF-106, RF-113 |
| HU-79 | Estudiante | Como estudiante, quiero encerrar con lazo una región o seleccionar un objeto, preguntar al Tutor qué significa y recibir la explicación sobre el lienzo sin perder mis anotaciones. | RF-107 |
| HU-80 | Estudiante | Como estudiante, quiero guardar mi lienzo y retomarlo aunque elimine la conversación, y exportar una región a PDF. | RF-108 |
| HU-81 | Estudiante y Docente | Como usuario, quiero que el Tutor reutilice un recurso validado de la biblioteca, como un modelo 3D de turbofán, antes de generar uno nuevo, y ver valoraciones agregadas de su utilidad. | RF-109, RF-111, RF-113 |
| HU-82 | Estudiante y Docente | Como usuario, quiero publicar voluntariamente un recurso propio y poder retirarlo, sin que se publiquen mis conversaciones ni mis dificultades. | RF-110 |
| HU-83 | Docente | Como docente, quiero generar presentaciones y documentos profesionales editables (PPTX y PDF) con plantillas y revisión de calidad, sin incluir soluciones reservadas en el material del estudiante. | RF-114 |
| HU-84 | Docente | Como docente, quiero contratar Docente Inicial para crear materiales sin clases, o Docente Live declarando horas, modalidad, participantes, horarios y grabación. | RF-73, RF-115 |
| HU-85 | Docente | Como docente Live, quiero ver mi consumo audiovisual con avisos al 70, 90 y 100 %, autorizar ampliaciones y recibir la devolución del saldo no usado. | RF-78, RF-116, RF-122 |
| HU-86 | Docente | Como docente, quiero crear grupos privados, invitar estudiantes y gestionar sus miembros, materiales y clases. | RF-117 |
| HU-87 | Docente y Estudiante | Como docente o estudiante, quiero registrar y verificar el pago directo de una clase por Yape, tarjeta o QR, con la comisión de Mentelyx transparente. | RF-118, RF-121 |
| HU-88 | Estudiante | Como estudiante adulto, quiero ver voluntariamente un anuncio recompensado para obtener capacidad educativa adicional. | RF-119 |
| HU-89 | Estudiante y Docente | Como adulto elegible, quiero conectar mi propia API key de forma segura, fijar límites y revocarla cuando quiera. | RF-120 |
| HU-90 | Estudiante | Como estudiante del plan Gratuito, quiero que la publicidad esté identificada y no interrumpa evaluaciones, clases ni explicaciones del Tutor. | RF-40 |

## 11. Redacciones sustituidas (historial)

No son historias vigentes.

| ID | Redacción sustituida | Estado anterior |
|---|---|---|
| HU-54 | Como estudiante, quiero contratar Aulas Live y recibir créditos mensuales para reservar clases de distintos docentes desde cualquier región sin pagos por cada inscripción. | Política comercial propuesta |
| HU-55 | Como estudiante, quiero conocer los créditos Live necesarios para seminarios, reforzamientos y tutorías individuales antes de confirmar mi reserva. | Política comercial propuesta |
| HU-60 | Como usuario con acceso a Studio, quiero comparar sus planes Free, Plus y Pro, para elegir las herramientas de creación apropiadas. | Política comercial propuesta |
| HU-63 | Como superadministrador, quiero consultar ingresos, consumo y margen por producto (Plus, Pro, Aulas Live y Studio), para detectar servicios deficitarios. | Operación |
| HU-69 | Como usuario habilitado para impartir clases, quiero ofrecer tutorías fuera de la suscripción Aulas Live con una tarifa viable, para atender consultas puntuales. | Política comercial propuesta |
| HU-70 | Como estudiante, quiero distinguir claramente qué beneficios son créditos de clases y cuáles son créditos de IA, para no confundir planes. | Política comercial propuesta |
| HU-48 | Como usuario con acceso a Studio IA, quiero consultar la cuota y el costo en créditos de las herramientas, para controlar mi consumo. | Redacción sustituida por el modelo de recursos de plan de la IM |
| HU-56 | Como estudiante, quiero que mis créditos reservados se restituyan si Mentelyx o el docente cancela la sesión según la política, para no perder prestaciones ya pagadas. | Propuesta anterior no vigente; el modelo de clases por créditos fue sustituido por pagos directos. Las condiciones de cancelación/devolución siguen pendientes |
| HU-61 | Como usuario con acceso a Studio, quiero editar manualmente presentaciones, gráficos y pizarras sin gastar créditos de IA, para preparar materiales con libertad. | Redacción sustituida; el modelo aprobado usa recursos de plan |
| HU-62 | Como usuario con acceso a Studio IA, quiero recuperar créditos de operaciones fallidas imputables a Mentelyx, para evitar pérdidas injustas de mi cuota. | Redacción propuesta sustituida; tratamiento de recursos ante fallos pendiente |
| HU-64 | Como superadministrador, quiero aplicar límites de IA, créditos, cupos y presupuestos de forma verificable, para evitar consumo no autorizado y costos imprevistos. | Redacción sustituida por el modelo de recursos de plan |
| Regla 6 | **Planes:** Plus, Pro y Aulas Live para estudiantes; Studio Free, Plus y Pro para autoría. Ninguno constituye actor adicional. Las cuotas Live y Studio no se mezclan. |  |
