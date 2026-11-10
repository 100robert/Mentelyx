# 02. Historias de usuario por actor — Mentelyx

> **Versión:** 2.0 — 09/11/2026. **Base revisada:** v1.5 (20/10/2026). **Estado:** diseño documental sincronizado con dos tipos de cuenta públicos; requisitos y políticas comerciales sujetos a pruebas y validación. No supone código implementado ni servicios contratados.

> **Revisión terminológica:** 2.1 — 10/11/2026. Se conservan el alcance, los identificadores y la versión funcional 2.0.

## 1. Criterio de organización

- Las historias se organizan alrededor de **tres actores humanos activos**: Estudiante (ACT-01), Docente (ACT-03) y Superadministrador (ACT-04). ACT-02 queda retirado, sin renumerar identificadores.
- El registro ofrece **dos tipos de cuenta pública: Estudiante y Docente**. El **Docente** elige una **modalidad de perfil**: independiente (libre) o por nivel académico. Ninguna modalidad constituye otro actor.
- Un **Estudiante universitario mayor de edad** puede solicitar permiso especial para impartir tutorías sobre temas que domina; conserva su cuenta Estudiante. No se presenta como docente titulado.
- Las historias compartidas de Studio y clases aparecen **una sola vez**. El permiso individual, no el nombre de la sección, determina quién puede realizarlas.
- Las acreditaciones profesionales y la habilitación comercial son procesos diferentes. Escribir un grado no equivale a verificarlo.
- Precios y cuotas son propuestas comerciales. HU-09 y HU-22 continúan en **fase posterior**.


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
| HU-54 | Como estudiante, quiero contratar Aulas Live y recibir créditos mensuales para reservar clases de distintos docentes desde cualquier región sin pagos por cada inscripción. | Política comercial propuesta |
| HU-55 | Como estudiante, quiero conocer los créditos Live necesarios para seminarios, reforzamientos y tutorías individuales antes de confirmar mi reserva. | Política comercial propuesta |
| HU-56 | Como estudiante, quiero que mis créditos reservados se restituyan si Mentelyx o el docente cancela la sesión según la política, para no perder prestaciones ya pagadas. | Política comercial propuesta |
| HU-58 | Como estudiante universitario mayor de edad, quiero solicitar autorización para enseñar un tema que domino, por ejemplo de veterinaria o programación, y recibir remuneración por tutorías, sin cambiar mi cuenta Estudiante ni presentarme como docente acreditado. | Definida para análisis; pendiente de validar habilitación |
| HU-66 | Como estudiante, quiero inscribirme en clases desde cualquier región individualmente, sin coordinación de un pago grupal, para utilizar Mentelyx con autonomía. | Definida para análisis |
| HU-70 | Como estudiante, quiero distinguir claramente qué beneficios son créditos de clases y cuáles son créditos de IA, para no confundir planes. | Política comercial propuesta |

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
| HU-43 | Como Docente o Estudiante con acceso autorizado a Studio, quiero utilizar las herramientas manuales disponibles sin consumir créditos de IA y guardar borradores privados sin aprobación editorial previa, para diseñar materiales. | Definida para análisis |
| HU-53 | Como Docente o Estudiante con permisos de publicación, quiero gestionar publicación, licencias y accesos de cada versión, para controlar qué material puede verse, venderse, recuperarse por RAG o entrenar modelos conforme a autorizaciones distintas. | Definida para análisis |
| HU-47 | Como usuario con acceso a Studio, quiero crear presentaciones, gráficos, pizarras y actividades interactivas, para preparar recursos educativos claros. | Definida para análisis |
| HU-48 | Como usuario con acceso a Studio IA, quiero consultar la cuota y el costo en créditos de las herramientas, para controlar mi consumo. | Definida para análisis |
| HU-60 | Como usuario con acceso a Studio, quiero comparar sus planes Free, Plus y Pro, para elegir las herramientas de creación apropiadas. | Política comercial propuesta |
| HU-61 | Como usuario con acceso a Studio, quiero editar manualmente presentaciones, gráficos y pizarras sin gastar créditos de IA, para preparar materiales con libertad. | Definida para análisis |
| HU-62 | Como usuario con acceso a Studio IA, quiero recuperar créditos de operaciones fallidas imputables a Mentelyx, para evitar pérdidas injustas de mi cuota. | Política comercial propuesta |

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
| HU-69 | Como usuario habilitado para impartir clases, quiero ofrecer tutorías fuera de la suscripción Aulas Live con una tarifa viable, para atender consultas puntuales. | Política comercial propuesta |

## 7. Superadministrador (ACT-04)

**Cuenta interna**, distinta de los dos tipos de registro público.

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
| HU-63 | Como superadministrador, quiero consultar ingresos, consumo y margen por producto (Plus, Pro, Aulas Live y Studio), para detectar servicios deficitarios. | Operación |
| HU-64 | Como superadministrador, quiero aplicar límites de IA, créditos, cupos y presupuestos de forma verificable, para evitar consumo no autorizado y costos imprevistos. | Operación |
| HU-67 | Como superadministrador, quiero aprobar clases gratuitas solamente cuando su financiación promocional o patrocinio esté presupuestada, para evitar sesiones con costos no cubiertos. | Política comercial propuesta |
| HU-68 | Como superadministrador, quiero conciliar cobros, comisiones, reembolsos y liquidaciones y detectar duplicaciones, para controlar la integridad económica de Mentelyx. | Operación crítica |

## 8. Reglas de negocio vinculadas a las historias

1. **Registro:** dos tipos de cuenta públicos (Estudiante y Docente). Dos modalidades dentro de Docente, no dos actores ni dos cuentas.
2. **Docente libre:** puede configurar temas, materiales y horarios, pero no un perfil de especialización o grado académico acreditado; impartirá servicios pagados solo después de habilitarse.
3. **Docente por nivel:** indica uno o varios niveles de enseñanza y materias; puede declarar grados académicos, pero solo los documentos validados autorizan insignias de acreditación.
4. **Estudiante tutor:** solo para estudiante universitario adulto y habilitado. Conserva su cuenta y aparece con una denominación que no implique título docente oficial.
5. **Clases pequeñas:** tutorías individuales o de pocos estudiantes están permitidas según condiciones de autorización, reserva y rentabilidad. Aula estándar objetivo: 35 estudiantes más la persona que imparte la sesión.
6. **Planes:** Plus, Pro y Aulas Live para estudiantes; Studio Free, Plus y Pro para autoría. Ninguno constituye actor adicional. Las cuotas Live y Studio no se mezclan.
7. **Pagos y acreditaciones:** el registro de una cuenta no equivale a un pago confirmado; asimismo, la verificación documental del solicitante no equivale a la validación de sus credenciales académicas. Deben aplicarse transacciones/idempotencia, auditoría y controles adecuados para menores.
8. **Fase posterior:** convenios institucionales y productos no priorizados no son precondición para el lanzamiento.

## 9. Trazabilidad

Se conservan todas las **70 HU-01 a HU-70**, sin reutilizar los códigos de actor. HU-41 registra los dos tipos públicos; **HU-43 y HU-53** pasan a la sección de autoría compartida sin perder su identificador. Se corresponden con RF-01, RF-35, RF-53, RF-54, RF-55, RF-56 y RF-60; la habilitación docente y de universitarios adultos sigue su propia trazabilidad (RF-18, RF-21, RF-58, RF-70, RF-88).

