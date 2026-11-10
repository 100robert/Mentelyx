# 01. Actores del sistema — Mentelyx

> **Versión:** 2.0 — 09/11/2026. **Base revisada:** v1.3 (20/10/2026). **Estado:** diseño documental sincronizado con dos tipos de cuenta públicos; requisitos y políticas comerciales sujetos a pruebas y validación. No supone código implementado ni servicios contratados.

> **Revisión terminológica:** 2.1 — 10/11/2026. Se conservan el alcance, los identificadores y la versión funcional 2.0.

## 1. Objetivo

Identificar **quién utiliza Mentelyx** sin crear un actor cada vez que aparece una modalidad de enseñanza, un grado académico, una suscripción o un permiso adicional.

**Principio:** `Tipo de cuenta ≠ modalidad de perfil ≠ acreditación ≠ autorización para enseñar ≠ plan comercial`.

## 2. Actores humanos principales

| Código | Actor | Descripción | Actividades principales |
|---|---|---|---|
| **ACT-01** | **Estudiante** | Persona que aprende en Primaria, Secundaria, Preuniversitario o Universitario. Su cuenta puede pertenecer a un menor, aplicando las protecciones correspondientes. | Aprender, evaluarse, usar Tutor IA según plan, reservar clases, estudiar con contenidos propios. Un universitario adulto puede **solicitar habilitación adicional para impartir tutorías**, manteniendo el tipo Estudiante. |
| **ACT-03** | **Docente** | Persona adulta que se registra para preparar e impartir enseñanza. **En el registro elige su modalidad de perfil:** independiente/libre o por nivel académico. No son dos actores distintos. | Utilizar Studio, preparar clases, configurar materias/temas y solicitar habilitación para tutorías remuneradas. En la modalidad por nivel puede declarar formación profesional para posterior acreditación. |
| **ACT-04** | **Superadministrador** | Cuenta interna, no disponible en el registro público. | Administrar usuarios, habilitaciones, validaciones, planes, contenidos, aulas, pagos, seguridad, costos y disponibilidad. |

**Identificadores activos:** ACT-01, ACT-03 y ACT-04. **ACT-02 queda retirado y reservado** por trazabilidad; no se reasigna ni se ofrece en el registro. La función de autoría de contenidos pasa a ser una capacidad de Estudiantes y Docentes, no un actor.

**No habrá actor `Instructor independiente`**: queda incluido en **Docente (modalidad libre/independiente)**. Tampoco incluimos como actores actuales al Administrador académico/de soporte ni al Patrocinador/anunciante.

## 3. Registro público: dos tipos principales

Al registrarse, la persona elige **uno de dos tipos de cuenta**: `Estudiante` o `Docente`. El `Superadministrador` se aprovisiona internamente. La capacidad para elaborar materiales no es un tipo de cuenta y se controla mediante permisos y planes de Mentelyx Studio.

### 3.1 Estudiante

- Selecciona uno de los cuatro niveles: Primaria, Secundaria, Preuniversitario o Universitario.
- Accede a las funciones de aprendizaje según permisos, edad, plan y suscripciones.
- Puede subir apuntes y elaborar contenido permitido en Mentelyx Studio según edad, plan y permisos, sin convertirse automáticamente en Docente.
- Si es **universitario y mayor de 18 años**, puede solicitar un **permiso de tutoría** para enseñar un tema concreto que domina, por ejemplo, fundamentos de veterinaria, programación o cálculo. Su perfil se presentará como **estudiante tutor autorizado**, no como docente titulado ni especialista acreditado.
- Para solicitar la habilitación se exige completar la verificación documental del solicitante, revisar los temas que declara dominar y cumplir los controles de seguridad; para trabajar con menores aplican controles adicionales. No basta con indicar que domina un tema.

### 3.2 Docente: una cuenta, dos modalidades de perfil

Al escoger `Docente`, el registro pregunta:

**¿Cómo deseas presentar tu actividad de enseñanza?**

| Modalidad | ¿Qué datos solicita el perfil? | ¿Qué puede mostrarse públicamente? | ¿Qué no debe permitir? |
|---|---|---|---|
| **A. Docente independiente (libre)** | Temas que enseña, breve experiencia declarada, modalidad de clases, disponibilidad. | Perfil de docente independiente; temas, materiales demostrativos y valoraciones válidas si existen. | **No ofrece campos de título, grado académico, especialización profesional ni insignias de acreditación dentro de esta modalidad.** Tampoco se presenta automáticamente como profesional verificado. |
| **B. Docente por nivel académico** | Uno o varios niveles impartidos (Primaria, Secundaria, Preuniversitario, Universitario), áreas o asignaturas, formación declarada y, si se desea acreditar, documentos pertinentes. | Perfil docente asociado al nivel impartido y asignaturas; **credenciales con insignia solamente cuando se hayan verificado**. | Seleccionar un nivel o escribir «Licenciado», «Magíster» o «Doctor» **no concede por sí solo** acreditación oficial ni habilitación para cobrar. |

**Diferencia conceptual:** el **nivel que enseña** (por ejemplo Secundaria) y su **grado académico** (por ejemplo Licenciatura o Doctorado) son campos diferentes. Los grados declarados no se mostrarán como **verificados** hasta comprobar la documentación. El registro puede guardar un borrador privado de formación declarada para iniciar el trámite.

Un docente independiente **sí puede enseñar** en Mentelyx una vez habilitado, pero **no tendrá el perfil de «docente especializado/acreditado»**. Si posteriormente desea presentar su grado o especialización, deberá solicitar un cambio de modalidad sujeto a validación; no se creará otra cuenta.

### 3.3 Autoría de contenidos: capacidad compartida, no cuenta

Tanto Estudiantes como Docentes pueden elaborar materiales según sus permisos. Los Docentes disponen de las herramientas manuales habilitadas de Studio desde el registro; el Estudiante accede a las funciones de autoría que correspondan a su cuenta, edad y plan. La publicación, comercialización, indexación RAG y eventual entrenamiento de IA requieren autorizaciones diferenciadas; **crear un archivo no habilita automáticamente para enseñar, cobrar o publicarlo**.

## 4. Diferenciar cuenta, modalidad, permisos y planes

| Concepto | Ejemplos | ¿Modifica el tipo de cuenta? |
|---|---|---|
| Tipo de cuenta | Estudiante, Docente | Es la opción principal del registro; no cambia automáticamente. |
| Modalidad docente | Independiente/libre; por nivel académico | No, ambas pertenecen a Docente. |
| Autorización adicional | Tutoría para universitario adulto; habilitación comercial; autorización para trabajar con menores | No; es un permiso revisable y revocable. |
| Credencial acreditada | Licenciatura, maestría, doctorado u otra formación verificada | No; es una propiedad acreditada del perfil docente por nivel. |
| Plan | Gratuito, Plus, Pro, Aulas Live; Studio Free, Plus, Pro | No; únicamente habilita beneficios por suscripción. |

## 5. Permisos principales

| Acción | Estudiante | Docente libre | Docente por nivel | Superadministrador |
|---|---|---|---|---|
| Acceder al aprendizaje | Según plan | Según plan | Según plan | Supervisión permitida |
| Crear contenido propio | Sí, según permisos y edad | Sí | Sí | Gestión |
| Usar Mentelyx Studio | Según permisos y plan | Herramientas manuales habilitadas | Herramientas manuales habilitadas | Gestión |
| Publicar contenido | Según autorización editorial y derechos | Según autorización editorial y derechos | Según autorización editorial y derechos | Autorizar/revisar |
| Impartir tutorías pagadas | **Solo universitario adulto habilitado** | **Con habilitación** | **Con habilitación** | Supervisar |
| Mostrar títulos/credenciales como verificados | No | **No en esta modalidad** | **Solo tras verificación** | Verificar |
| Gestionar pagos ajenos, planes y permisos | No | No | No | Sí, bajo auditoría |

> **Control esencial:** el frontend muestra las opciones disponibles, pero **Hono verifica en el backend** tipo de cuenta, modalidad, edad, propiedad de recursos, habilitación, suscripción y acreditaciones. Redis nunca constituye la fuente de verdad de una autorización o un pago.

## 6. Reglas de seguridad y alcance

- La verificación documental del solicitante que desea enseñar y cobrar es distinta de la validación de sus credenciales académicas. La plataforma no debe atribuir un título o especialidad a quien no lo ha demostrado.
- Las cuentas de estudiantes menores de edad no pueden impartir tutorías remuneradas bajo el flujo propuesto. Para clases con menores se aplicarán salvaguardas adicionales.
- Un docente libre no se describe como «docente acreditado» ni se ofrecen campos académicos propios de la modalidad por nivel; puede ofrecer reforzamiento autorizado de temas que declara dominar.
- Las clases admiten inicialmente hasta 35 estudiantes más docente por aula y también grupos pequeños. La capacidad es objetivo de diseño, no máximo permanente del negocio.
- Las instituciones asociadas son fase posterior. No hay obligación de correo institucional para los estudiantes.
- Integraciones como Neon, Atlas, Redis, Cloudflare Queues, R2, pasarela y RealtimeKit son **sistemas externos**, no actores humanos.

## 7. Trazabilidad

`02-historias-del-usuario.md` agrupa las HU de los **tres actores activos (ACT-01, ACT-03 y ACT-04)**. `03-requisitos-funcionales.md` conserva los RF y define **dos tipos públicos** (Estudiante y Docente), con modalidades docentes y permisos explícitos. ACT-02 permanece retirado solo en el registro de trazabilidad. Los planes y las capacidades de Studio no son tipos de cuenta ni nuevos actores.
