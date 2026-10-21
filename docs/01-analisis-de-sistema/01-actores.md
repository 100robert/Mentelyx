# 01. Actores del sistema — Mentelyx

> **Versión:** 1.3 — 20/10/2026. **Estado:** propuesta consolidada para revisión. Se simplifican los tipos de cuenta sin eliminar las funciones de enseñanza. Las tarifas, habilitaciones y acreditaciones no se consideran automáticamente aprobadas.

## 1. Objetivo

Identificar **quién utiliza Mentelyx** sin crear un actor cada vez que aparece una modalidad de enseñanza, un grado académico, una suscripción o un permiso adicional.

**Principio:** `Tipo de cuenta ≠ modalidad de perfil ≠ acreditación ≠ autorización para enseñar ≠ plan comercial`.

## 2. Actores humanos principales

| Código | Actor | Descripción | Actividades principales |
|---|---|---|---|
| **ACT-01** | **Estudiante** | Persona que aprende en Primaria, Secundaria, Preuniversitario o Universitario. Su cuenta puede pertenecer a un menor, aplicando las protecciones correspondientes. | Aprender, evaluarse, usar Tutor IA según plan, reservar clases, estudiar con contenidos propios. Un universitario adulto puede **solicitar habilitación adicional para impartir tutorías**, manteniendo el tipo Estudiante. |
| **ACT-02** | **Creador educativo** | Persona adulta que desea producir materiales didácticos, sin presentarse necesariamente como docente. | Crear y editar recursos en Mentelyx Studio; gestionar publicación, acceso y derechos sobre sus materiales. Registrar esta cuenta no autoriza automáticamente clases remuneradas. |
| **ACT-03** | **Docente** | Persona adulta que se registra para preparar e impartir enseñanza. **En el registro elige su modalidad de perfil:** independiente/libre o por nivel académico. No son dos actores distintos. | Utilizar Studio, preparar clases, configurar materias/temas y solicitar habilitación para tutorías remuneradas. En la modalidad por nivel puede declarar formación profesional para posterior acreditación. |
| **ACT-04** | **Superadministrador** | Cuenta interna, no disponible en el registro público. | Administrar usuarios, habilitaciones, validaciones, planes, contenidos, aulas, pagos, seguridad, costos y disponibilidad. |

**No habrá actor `Instructor independiente`**: queda incluido en **Docente (modalidad libre/independiente)**. Tampoco incluimos como actores actuales al Administrador académico/de soporte ni al Patrocinador/anunciante.

## 3. Registro público: tres tipos principales

Al registrarse, la persona elige **uno de tres tipos de cuenta**: `Estudiante`, `Creador educativo` o `Docente`. El `Superadministrador` se aprovisiona internamente.

### 3.1 Estudiante

- Selecciona uno de los cuatro niveles: Primaria, Secundaria, Preuniversitario o Universitario.
- Accede a las funciones de aprendizaje según permisos, edad, plan y suscripciones.
- Puede subir apuntes y elaborar contenido permitido sin convertirse automáticamente en creador o docente.
- Si es **universitario y mayor de 18 años**, puede solicitar un **permiso de tutoría** para enseñar un tema concreto que domina, por ejemplo, fundamentos de veterinaria, programación o cálculo. Su perfil se presentará como **estudiante tutor autorizado**, no como docente titulado ni especialista acreditado.
- La habilitación exige identidad, revisión de contenido/área declarada y condiciones de seguridad; para trabajar con menores aplican controles adicionales. No basta con indicar que domina un tema.

### 3.2 Creador educativo

- Accede a Studio según el plan y las autorizaciones de publicación.
- Puede utilizar herramientas manuales desde el registro; la IA tiene cuotas comerciales.
- No se le concede automáticamente la facultad de impartir clases de pago. No es otro tipo de docente.

### 3.3 Docente: una cuenta, dos modalidades de perfil

Al escoger `Docente`, el registro pregunta:

**¿Cómo deseas presentar tu actividad de enseñanza?**

| Modalidad | ¿Qué datos solicita el perfil? | ¿Qué puede mostrarse públicamente? | ¿Qué no debe permitir? |
|---|---|---|---|
| **A. Docente independiente (libre)** | Temas que enseña, breve experiencia declarada, modalidad de clases, disponibilidad. | Perfil de docente independiente; temas, materiales demostrativos y valoraciones válidas si existen. | **No ofrece campos de título, grado académico, especialización profesional ni insignias de acreditación dentro de esta modalidad.** Tampoco se presenta automáticamente como profesional verificado. |
| **B. Docente por nivel académico** | Uno o varios niveles impartidos (Primaria, Secundaria, Preuniversitario, Universitario), áreas o asignaturas, formación declarada y, si se desea acreditar, documentos pertinentes. | Perfil docente asociado al nivel impartido y asignaturas; **credenciales con insignia solamente cuando se hayan verificado**. | Seleccionar un nivel o escribir «Licenciado», «Magíster» o «Doctor» **no concede por sí solo** acreditación oficial ni habilitación para cobrar. |

**Diferencia conceptual:** el **nivel que enseña** (por ejemplo Secundaria) y su **grado académico** (por ejemplo Licenciatura o Doctorado) son campos diferentes. Los grados declarados no se mostrarán como **verificados** hasta comprobar la documentación. El registro puede guardar un borrador privado de formación declarada para iniciar el trámite.

Un docente independiente **sí puede enseñar** en Mentelyx una vez habilitado, pero **no tendrá el perfil de «docente especializado/acreditado»**. Si posteriormente desea presentar su grado o especialización, deberá solicitar un cambio de modalidad sujeto a validación; no se creará otra cuenta.

## 4. Diferenciar cuenta, modalidad, permisos y planes

| Concepto | Ejemplos | ¿Modifica el tipo de cuenta? |
|---|---|---|
| Tipo de cuenta | Estudiante, Creador educativo, Docente | Es la opción principal del registro; no cambia automáticamente. |
| Modalidad docente | Independiente/libre; por nivel académico | No, ambas pertenecen a Docente. |
| Autorización adicional | Tutoría para universitario adulto; habilitación comercial; autorización para trabajar con menores | No; es un permiso revisable y revocable. |
| Credencial acreditada | Licenciatura, maestría, doctorado u otra formación verificada | No; es una propiedad acreditada del perfil docente por nivel. |
| Plan | Gratuito, Plus, Pro, Aulas Live; Studio Free, Plus, Pro | No; únicamente habilita beneficios por suscripción. |

## 5. Permisos principales

| Acción | Estudiante | Creador educativo | Docente libre | Docente por nivel | Superadministrador |
|---|---|---|---|---|---|
| Acceder al aprendizaje | Según plan | Según plan | Según plan | Según plan | Supervisión permitida |
| Crear contenido propio | Sí, con límites | Sí | Sí | Sí | Gestión |
| Usar Mentelyx Studio | Según permisos | Sí | Sí | Sí | Gestión |
| Publicar contenido | Según revisión | Según revisión | Según revisión | Según revisión | Autorizar/revisar |
| Impartir tutorías pagadas | **Solo universitario adulto habilitado** | No por registro | **Con habilitación** | **Con habilitación** | Supervisar |
| Mostrar títulos/credenciales como verificados | No | No | **No en esta modalidad** | **Solo tras verificación** | Verificar |
| Gestionar pagos ajenos, planes y permisos | No | No | No | No | Sí, bajo auditoría |

> **Control esencial:** el frontend muestra las opciones disponibles, pero **Hono verifica en el backend** tipo de cuenta, modalidad, edad, propiedad de recursos, habilitación, suscripción y acreditaciones. Redis nunca constituye la fuente de verdad de una autorización o un pago.

## 6. Reglas de seguridad y alcance

- La verificación de identidad para enseñar y cobrar se separa de la acreditación académica. La plataforma no debe atribuir un título o especialidad a quien no lo ha demostrado.
- Las cuentas de estudiantes menores de edad no pueden impartir tutorías remuneradas bajo el flujo propuesto. Para clases con menores se aplicarán salvaguardas adicionales.
- Un docente libre no se describe como «docente acreditado» ni se ofrecen campos académicos propios de la modalidad por nivel; puede ofrecer reforzamiento autorizado de temas que declara dominar.
- Las clases admiten inicialmente hasta 35 estudiantes más docente por aula y también grupos pequeños. La capacidad es objetivo de diseño, no máximo permanente del negocio.
- Las instituciones asociadas son fase posterior. No hay obligación de correo institucional para los estudiantes.
- Integraciones como Neon, Atlas, Redis, Cloudflare Queues, R2, pasarela y RealtimeKit son **sistemas externos**, no actores humanos.

## 7. Trazabilidad

`02-historias-del-usuario.md` agrupa las HU de estos cuatro actores. `03-requisitos-funcionales.md` conserva los RF y debe utilizar «Docente» como actor único, con modalidad y permisos explícitos. Los planes y las variantes comerciales pertenecen a requisitos de negocio, no al catálogo de actores.
