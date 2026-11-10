# Nivel 4 · Diagrama de código

> **Proyecto:** Mentelyx · **Módulos detallados:** M3 — Evaluaciones y Aprendizaje; M6 — Tutor IA y RAG  
> **Modelo:** C4 · Nivel 4 de 4 · **Notación:** UML · **Versión:** 2.0  
> **Estado:** Diseño de código propuesto, previo a la implementación

---

## 1. Objetivo

Mostrar **cómo se organizará el código de los componentes fundamentales del proceso de aprendizaje personalizado de Mentelyx**, identificando sus clases, interfaces, responsabilidades y relaciones.

Se detalla el flujo **«Resolver una actividad y recibir acompañamiento pedagógico»**, mediante el cual un estudiante desarrolla un ejercicio, recibe retroalimentación sobre su desempeño y puede solicitar una explicación fundamentada del Tutor IA.

Este proceso responde a la necesidad principal del proyecto: facilitar el aprendizaje y reforzamiento académico de estudiantes de Primaria, Secundaria, Preuniversitario y Universitario mediante herramientas digitales, personalización educativa y acompañamiento de tutores de inteligencia artificial y humanos.

El Tutor IA no sustituye al docente ni determina unilateralmente las calificaciones. Su función es complementar el aprendizaje mediante explicaciones adaptadas, utilizando fuentes educativas autorizadas y verificables.

| Aspecto | Descripción |
|---|---|
| Pregunta que responde | ¿Qué clases, interfaces y objetos colaboran para evaluar una actividad y proporcionar acompañamiento pedagógico personalizado? |
| Audiencia | Desarrolladores y arquitectos de software |
| Notación | UML: diagramas de clases y diagrama de secuencia |
| Componentes detallados | M3 — Evaluaciones y Aprendizaje; M6 — Tutor IA y RAG |
| Componentes colaboradores | M1 — Usuarios y Administración; M2 — Cursos y Contenidos; M4 — Docentes y Clases; M5 — Suscripciones y Pagos |
| Flujo principal | Resolver actividad → registrar desempeño → identificar dificultad → solicitar explicación con IA |
| Por qué estos módulos | M3 y M6 concentran las reglas del diagnóstico, seguimiento y acompañamiento inteligente, directamente relacionadas con el propósito educativo de Mentelyx. |
| Alcance | Diseño de clases e interfaces propuestas; no representa código ya implementado |
| Nivel anterior | `Nivel3-DiagramadeComponentes.md` |

El nivel 4 no pretende representar todo el código de Mentelyx. Se concentra en los componentes necesarios para explicar un caso de uso relevante y técnicamente significativo.

---

## 2. Diagrama de clases

Se presentan dos vistas de código independientes: una para el componente M3 y otra para M6. Su colaboración se desarrolla posteriormente mediante el diagrama de secuencia.

### Diagrama de clases — M3: Evaluaciones y Aprendizaje

![Diagrama de clases del módulo Evaluaciones y Aprendizaje](/img/nivel4-clases-m3.png)

> Archivo editable: `img/fuentes/nivel4-clases-m3.drawio`

**Figura 4.** Estructura de clases e interfaces del proceso de resolución de actividades y actualización del aprendizaje.

### Diagrama de clases — M6: Tutor IA y RAG

![Diagrama de clases del módulo Tutor IA y RAG](/img/nivel4-clases-m6.png)

> Archivo editable: `img/fuentes/nivel4-clases-m6.drawio`

**Figura 5.** Estructura de clases e interfaces de la generación de explicaciones pedagógicas fundamentadas.

### 2.1. Capas de Clean Architecture

| Capa | Contiene | Regla |
|---|---|---|
| **Presentación** | Controladores HTTP, validación y transformación de solicitudes/respuestas | Recibe las solicitudes y delega las operaciones a los casos de uso. No contiene las reglas de evaluación ni de generación pedagógica. |
| **Aplicación** | Casos de uso e interfaces de servicios requeridos | Coordina operaciones, autorizaciones y colaboraciones entre módulos sin acoplarse a implementaciones tecnológicas concretas. |
| **Dominio** | Entidades, objetos de valor, políticas y servicios de dominio | Contiene las reglas educativas fundamentales, independientes de Hono, PostgreSQL, MongoDB y los proveedores de IA. |
| **Infraestructura** | Repositorios y adaptadores | Implementa interfaces mediante PostgreSQL, pgvector, servicios externos y otras tecnologías. |

**Regla de dependencia:** el dominio no conoce las capas externas. Los casos de uso dependen de abstracciones y las implementaciones tecnológicas satisfacen los contratos necesarios.

El diseño deberá mantener separados el proceso determinista de evaluación y el proceso generativo del Tutor IA.

### 2.2. Clases del módulo M3 — Evaluaciones y Aprendizaje

| Clase | Tipo | Capa | Responsabilidad |
|---|---|---|---|
| `EvaluacionController` | Controlador | Presentación | Recibe solicitudes para responder actividades y consultar resultados del estudiante. |
| `ResolverActividadUseCase` | Caso de uso | Aplicación | Coordina la obtención de la actividad, validación del intento, evaluación de respuestas y registro del resultado. |
| `ActualizarProgresoUseCase` | Caso de uso | Aplicación | Actualiza la información de progreso y dificultades académicas a partir de resultados confirmados. |
| `IntentoEvaluacion` | Entidad | Dominio | Representa un intento de resolución, su propietario, actividad, versión, respuestas y estado. |
| `RespuestaEstudiante` | Objeto de valor | Dominio | Contiene la respuesta presentada para una pregunta determinada. |
| `ResultadoActividad` | Objeto de valor | Dominio | Representa la puntuación y retroalimentación obtenidas según las reglas de evaluación aplicables. |
| `EvaluadorDeterminista` | Servicio de dominio | Dominio | Evalúa las respuestas mediante reglas y criterios verificables, sin depender de un modelo generativo. |
| `PerfilAprendizaje` | Entidad | Dominio | Representa el progreso, desempeño y dificultades identificadas del estudiante. |
| `IntentoRepository` | Interfaz | Aplicación | Contrato para recuperar y persistir intentos de evaluación. |
| `ProgresoRepository` | Interfaz | Aplicación | Contrato para consultar y actualizar información de progreso académico. |
| `ContenidoEvaluablePort` | Interfaz | Aplicación | Permite obtener actividades, preguntas y versiones autorizadas mediante el contrato público de M2. |
| `PostgresIntentoRepository` | Repositorio | Infraestructura | Implementa `IntentoRepository` utilizando PostgreSQL. |
| `PostgresProgresoRepository` | Repositorio | Infraestructura | Implementa `ProgresoRepository` utilizando PostgreSQL. |

#### Reglas principales de M3

1. Cada intento pertenece a un estudiante y está asociado a una actividad y versión identificables.
2. Las respuestas aceptadas y los resultados confirmados deben persistirse correctamente antes de informar que fueron guardados.
3. La evaluación aplica criterios reproducibles y verificables, adecuados al tipo de actividad.
4. El Tutor IA no puede modificar directamente las calificaciones registradas.
5. Los resultados y dificultades identificadas pueden utilizarse para actualizar el perfil de aprendizaje y orientar futuras recomendaciones.
6. Ningún usuario puede consultar resultados privados de otro estudiante sin una autorización específica.

#### Relaciones UML principales de M3

| Origen | Destino | Relación |
|---|---|---|
| `EvaluacionController` | `ResolverActividadUseCase` | Dependencia: invoca el caso de uso. |
| `ResolverActividadUseCase` | `IntentoEvaluacion` | Dependencia: recupera o modifica el intento mediante sus operaciones de dominio. |
| `IntentoEvaluacion` | `RespuestaEstudiante` | Composición: contiene las respuestas que forman parte del intento. |
| `ResolverActividadUseCase` | `EvaluadorDeterminista` | Dependencia: solicita la evaluación. |
| `ResolverActividadUseCase` | `IntentoRepository` | Dependencia hacia interfaz de persistencia. |
| `ResolverActividadUseCase` | `ContenidoEvaluablePort` | Dependencia hacia contrato de consulta de actividades. |
| `PostgresIntentoRepository` | `IntentoRepository` | Realización: implementa la interfaz. |
| `ActualizarProgresoUseCase` | `ProgresoRepository` | Dependencia hacia interfaz de progreso. |
| `PostgresProgresoRepository` | `ProgresoRepository` | Realización: implementa la interfaz. |

### 2.3. Clases del módulo M6 — Tutor IA y RAG

| Clase | Tipo | Capa | Responsabilidad |
|---|---|---|---|
| `TutorIAController` | Controlador | Presentación | Recibe solicitudes de explicación pedagógica y devuelve respuestas con referencias cuando existan fuentes suficientes. |
| `ExplicarDificultadUseCase` | Caso de uso | Aplicación | Coordina la consulta del contexto académico, comprobación de acceso, recuperación de fuentes y generación de una explicación. |
| `FuenteEducativa` | Entidad de dominio | Dominio | Representa una fuente identificada y versionada, con información necesaria para aplicar las reglas de autorización. |
| `PoliticaFuentesRAG` | Servicio de dominio | Dominio | Define reglas para admitir fuentes vigentes y autorizadas, evitando material revocado o fuera del alcance permitido. |
| `ExplicacionPedagogica` | DTO de salida | Aplicación | Contiene la explicación, referencias utilizadas y advertencias de insuficiencia o incertidumbre cuando corresponda. |
| `ConsultaProgresoPort` | Interfaz | Aplicación | Permite consultar el contexto académico permitido mediante la API pública de M3. |
| `ContenidoAutorizadoPort` | Interfaz | Aplicación | Consulta permisos y versiones de los materiales mediante el contrato público de M2. |
| `BusquedaVectorialPort` | Interfaz | Aplicación | Define la recuperación de fragmentos educativos autorizados. |
| `ModeloGenerativoPort` | Interfaz | Aplicación | Contrato para solicitar explicaciones a un proveedor de IA sin acoplar el caso de uso a una API específica. |
| `DerechoUsoIAPort` | Interfaz | Aplicación | Comprueba cuotas y coordina el consumo autorizado mediante el contrato público de M5. |
| `PgvectorBusquedaAdapter` | Adaptador | Infraestructura | Implementa `BusquedaVectorialPort` mediante PostgreSQL y pgvector. |
| `ProveedorIAAdapter` | Adaptador | Infraestructura | Implementa `ModeloGenerativoPort` utilizando el proveedor de IA que se seleccione. |

#### Reglas principales de M6

1. La explicación debe considerar el nivel educativo y el contexto académico autorizado del estudiante.
2. El Tutor IA únicamente puede recuperar materiales con permisos vigentes para la finalidad y el usuario correspondiente.
3. Las fuentes recuperadas deben conservar referencias verificables a su material y versión.
4. Una respuesta generativa no puede convertirse automáticamente en calificación oficial.
5. La utilización de IA está sujeta a permisos, cuotas y presupuestos definidos para el producto.
6. Si el proveedor de IA falla, el sistema debe comunicarlo sin modificar ni perder resultados académicos previamente confirmados.
7. El uso de material educativo para recuperación RAG no implica autorización para entrenar modelos.
8. Los datos personales identificables de menores no se utilizarán para entrenamiento o ajuste de modelos, conforme a la política de Mentelyx.

#### Relaciones UML principales de M6

| Origen | Destino | Relación |
|---|---|---|
| `TutorIAController` | `ExplicarDificultadUseCase` | Dependencia: invoca el caso de uso. |
| `ExplicarDificultadUseCase` | `ConsultaProgresoPort` | Dependencia hacia contrato de M3. |
| `ExplicarDificultadUseCase` | `ContenidoAutorizadoPort` | Dependencia hacia contrato de M2. |
| `ExplicarDificultadUseCase` | `DerechoUsoIAPort` | Dependencia hacia contrato de M5. |
| `ExplicarDificultadUseCase` | `BusquedaVectorialPort` | Dependencia hacia interfaz de recuperación. |
| `ExplicarDificultadUseCase` | `ModeloGenerativoPort` | Dependencia hacia interfaz del proveedor de IA. |
| `ExplicarDificultadUseCase` | `PoliticaFuentesRAG` | Dependencia: aplica las reglas de selección de fuentes. |
| `PgvectorBusquedaAdapter` | `BusquedaVectorialPort` | Realización: implementa la interfaz. |
| `ProveedorIAAdapter` | `ModeloGenerativoPort` | Realización: implementa la interfaz. |

### 2.4. Notación UML utilizada

| Símbolo | Significado | Ejemplo |
|---|---|---|
| Línea continua | Asociación entre clases | Una entidad mantiene una referencia a otra. |
| Línea discontinua con flecha abierta | Dependencia | `ResolverActividadUseCase` utiliza `EvaluadorDeterminista`. |
| Línea discontinua con triángulo hueco | Realización de interfaz | `PostgresIntentoRepository` implementa `IntentoRepository`. |
| Rombo relleno | Composición | `IntentoEvaluacion` contiene respuestas pertenecientes al intento. |
| `«interface»` | Interfaz o contrato | `ModeloGenerativoPort` |
| `-` | Miembro privado | `- estado` |
| `+` | Miembro público | `+ evaluar()` |

**Consideración de diseño:** los dos diagramas de clases deben mantenerse enfocados en sus respectivos módulos. Los contratos con otros módulos aparecen como interfaces o colaboradores, sin incluir la implementación interna completa de M1, M2, M4 o M5.

---

## 3. Diagrama de secuencia: resolver una actividad y solicitar una explicación

![Diagrama de secuencia del acompañamiento pedagógico de Mentelyx](/img/nivel4-secuencia.png)

> Archivo editable: `img/fuentes/nivel4-secuencia.drawio`

**Figura 6.** Interacción entre el estudiante, la aplicación web, los casos de uso de Evaluaciones y Aprendizaje, el Tutor IA y los servicios necesarios para proporcionar retroalimentación personalizada.

### 3.1. Flujo principal

| Paso | Origen → destino | Acción |
|---|---|---|
| 1 | Estudiante → Aplicación Web/PWA | Resuelve una actividad y envía sus respuestas. |
| 2 | Aplicación Web/PWA → `EvaluacionController` | Envía la solicitud autenticada de registro de respuestas. |
| 3 | `EvaluacionController` → `ResolverActividadUseCase` | Delega la resolución de la actividad. |
| 4 | `ResolverActividadUseCase` → M2, mediante `ContenidoEvaluablePort` | Obtiene la versión de la actividad y los criterios de evaluación aplicables. |
| 5 | `ResolverActividadUseCase` → `EvaluadorDeterminista` | Solicita la evaluación de las respuestas conforme a los criterios establecidos. |
| 6 | `EvaluadorDeterminista` → `ResolverActividadUseCase` | Devuelve el resultado y la información de los errores identificados. |
| 7 | `ResolverActividadUseCase` → `IntentoRepository` | Persiste el intento y su resultado en PostgreSQL, verificando la correcta confirmación. |
| 8 | `ResolverActividadUseCase` → `ActualizarProgresoUseCase` | Actualiza el progreso y las dificultades del estudiante, con persistencia y consistencia verificables. |
| 9 | API Backend → Aplicación Web/PWA | Devuelve el resultado confirmado y la retroalimentación disponible. |
| 10 | Estudiante → Aplicación Web/PWA | Solicita una explicación adicional de una dificultad detectada. |
| 11 | Aplicación Web/PWA → `TutorIAController` | Envía la solicitud autenticada de explicación. |
| 12 | `TutorIAController` → `ExplicarDificultadUseCase` | Delega la consulta pedagógica. |
| 13 | `ExplicarDificultadUseCase` → `DerechoUsoIAPort` | Comprueba el derecho de uso, la cuota y las condiciones del producto mediante M5. |
| 14 | `ExplicarDificultadUseCase` → `ConsultaProgresoPort` | Obtiene el contexto académico permitido y la dificultad asociada al intento mediante M3. |
| 15 | `ExplicarDificultadUseCase` → `ContenidoAutorizadoPort` | Comprueba el alcance, versiones y autorizaciones de las fuentes educativas mediante M2. |
| 16 | `ExplicarDificultadUseCase` → `BusquedaVectorialPort` | Recupera fragmentos relevantes aplicando restricciones de acceso y vigencia. |
| 17 | `ExplicarDificultadUseCase` → `ModeloGenerativoPort` | Solicita una explicación adaptada al nivel del estudiante utilizando las fuentes recuperadas. |
| 18 | `ModeloGenerativoPort` → `ExplicarDificultadUseCase` | Devuelve la respuesta generada. |
| 19 | `ExplicarDificultadUseCase` → M5, mediante `DerechoUsoIAPort` | Finaliza o ajusta el consumo de cuota conforme a la política aplicable, con control de duplicados y errores. |
| 20 | `TutorIAController` → Aplicación Web/PWA | Entrega la explicación, las referencias disponibles y las advertencias que correspondan. |
| 21 | Aplicación Web/PWA → Estudiante | Presenta la retroalimentación y permite continuar practicando o buscar apoyo docente. |

El diagrama de secuencia deberá incluir los participantes que realmente intervienen en el flujo, sin desplegar las clases internas de todos los módulos colaboradores.

### 3.2. Flujos alternativos

| Situación | Comportamiento esperado |
|---|---|
| El estudiante no está autenticado o intenta acceder a un intento ajeno | La operación se rechaza sin exponer información privada. |
| La respuesta ya fue registrada anteriormente | La operación se trata de forma idempotente cuando corresponda; no se crea una confirmación duplicada. |
| PostgreSQL no confirma el guardado del resultado | Se comunica el error y no se informa que el resultado quedó persistido. |
| El estudiante no dispone del derecho de uso o cuota de IA | No se invoca el proveedor generativo y se informa la restricción correspondiente. |
| No existen fuentes suficientes o autorizadas para responder | El Tutor IA informa la limitación y evita presentar una explicación sin sustento como si estuviera verificada. |
| El proveedor de IA presenta una falla | Se devuelve un error recuperable; el resultado académico permanece intacto y el consumo se ajusta a la política de fallos. |
| El estudiante necesita acompañamiento humano | Puede consultar clases y docentes autorizados mediante M4 y reservar una tutoría si cumple las condiciones comerciales. |

### 3.3. Relación con la enseñanza humana

La existencia del Tutor IA no elimina las funciones de los docentes.

Cuando un estudiante considere insuficiente la explicación automática, Mentelyx podrá ofrecerle acceso a los servicios educativos disponibles de personas habilitadas para enseñar.

La consulta y reserva de una tutoría corresponde a **M4 — Docentes y Clases**, con comprobación de permisos en M1 y condiciones comerciales en M5.

Esta funcionalidad complementaria no se desarrolla internamente en los diagramas de clases de M3 y M6. Su diseño específico corresponde al componente M4.

---

## 4. Patrones y principios que se ven en este nivel

| Elemento del diseño | Patrón o principio | Aplicación en Mentelyx |
|---|---|---|
| `IntentoRepository` y `PostgresIntentoRepository` | **Repository** | Permite persistir intentos sin acoplar el caso de uso a PostgreSQL. |
| `PgvectorBusquedaAdapter` | **Adapter** | Encapsula la tecnología utilizada para la recuperación vectorial. |
| `ProveedorIAAdapter` | **Adapter** | Permite sustituir el proveedor generativo sin modificar las reglas pedagógicas centrales. |
| `ModeloGenerativoPort`, `BusquedaVectorialPort` y repositorios abstractos | **Inversión de dependencias (DIP)** | Los casos de uso dependen de interfaces, no de implementaciones concretas. |
| `ResolverActividadUseCase` | **Responsabilidad única (SRP)** | Coordina la resolución y registro de una actividad, sin implementar directamente las conexiones externas. |
| `ExplicarDificultadUseCase` | **Responsabilidad única (SRP)** | Coordina la explicación pedagógica, sin asumir la gestión de evaluaciones, pagos o sesiones audiovisuales. |
| `EvaluadorDeterminista` | **Separación de responsabilidades** | La calificación utiliza reglas verificables y no depende de las respuestas generadas por un LLM. |
| `PoliticaFuentesRAG` | **Política de dominio** | Define las condiciones que deben cumplir las fuentes para utilizarse en explicaciones. |
| Interfaces públicas de M2, M3 y M5 | **Encapsulamiento modular** | Los módulos colaboran mediante contratos sin acceder a implementaciones internas ajenas. |
| Control de intentos y consumos | **Idempotencia e integridad** | Previene duplicación de registros, consumos o confirmaciones ante reintentos. |
| Organización en Presentación, Aplicación, Dominio e Infraestructura | **Clean Architecture** | Mantiene las reglas del negocio independientes de frameworks y servicios externos. |

### Principios arquitectónicos fundamentales

**1. El aprendizaje es el núcleo de la funcionalidad.**

Las actividades, resultados, dificultades y recomendaciones deben poder administrarse independientemente del proveedor de inteligencia artificial.

**2. La inteligencia artificial complementa la enseñanza.**

El Tutor IA ofrece explicaciones, apoyo y orientación, pero no sustituye las responsabilidades académicas y pedagógicas de los docentes ni altera unilateralmente las calificaciones.

**3. Los resultados académicos deben ser confiables.**

Las respuestas aceptadas y los resultados confirmados requieren persistencia, autorización por propietario y trazabilidad de la versión de evaluación utilizada.

**4. Los contenidos deben utilizarse conforme a sus derechos.**

La recuperación de material mediante RAG exige controlar autorización, versión y acceso. Publicar un documento no concede automáticamente permiso para utilizarlo en entrenamiento de modelos.

**5. El acompañamiento humano continúa formando parte de Mentelyx.**

Los estudiantes pueden recurrir a docentes y tutores humanos habilitados mediante los servicios de M4, sin convertirlos en un componente interno del Tutor IA.

**6. El diseño debe ser implementable y comprobable.**

Los nombres de clases, interfaces y operaciones aquí establecidos son propuestas de implementación. Deben validarse contra el repositorio real, los contratos y las pruebas correspondientes.

---

**Trazabilidad documental:** `03-requisitos-funcionales.md` (RF-07 a RF-11, RF-41, RF-42, RF-49 a RF-52, RF-62, RF-67, RF-70 y RF-96); `04-atributos-de-calidad.md` (AC-04, AC-05, AC-06, AC-09 y AC-11); `06-drivers-arquitectonicos.md` (DA-11, DA-15 y DA-20); y `07-decisiones-arquitectonicas.md` (ADR-002, ADR-006, ADR-018, ADR-019, ADR-026 y ADR-030).

**Documentos complementarios:** `patrones-de-diseno.md`, `principios-de-diseno.md` y `diseno-interno-de-modulos.md`.

**Referencia metodológica:** Simon Brown. *The C4 model for visualising software architecture*, apartado «Code diagram»: https://c4model.com/diagrams/code

---

**Fin de la documentación C4 de Mentelyx — Niveles 1, 2, 3 y 4.**
