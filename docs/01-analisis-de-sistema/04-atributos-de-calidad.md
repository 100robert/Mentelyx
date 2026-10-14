# 04. Atributos de calidad — Mentelyx

## Propósito y alcance

Los atributos de calidad expresan **cómo debe comportarse Mentelyx**, además de las funcionalidades definidas en `03-requisitos-funcionales.md`. Este catálogo abarca el **producto completo** (Primaria, Secundaria y Preuniversitario; diferentes áreas, cursos y temas); no implica que todos los módulos estén implementados en el MVP académico.

Un atributo no queda validado por describirlo: los escenarios medibles, sus tácticas y métodos de verificación se detallan en `08-escenarios-atributos-calidad.md`. Los valores indicados allí son **propuestas por validar**, no resultados observados.

## Catálogo de atributos

| ID | Atributo | Necesidad de calidad | Requisitos vinculados (principalmente) |
|---|---|---|---|
| **AC-01** | Rendimiento | Consultar contenidos, resultados, perfiles docentes y operaciones autorizadas con tiempos adecuados bajo carga conocida. | RF-05, RF-07, RF-09, RF-11, RF-20 |
| **AC-02** | Disponibilidad | Mantener disponibles las funciones no afectadas por una falla parcial; la caída del proveedor de notificaciones no debe impedir consultar reservas confirmadas. | RF-05, RF-11, RF-24, RF-30, RF-37, RF-48 |
| **AC-03** | Escalabilidad | Poder incrementar capacidad al crecer la cantidad de estudiantes, contenidos y solicitudes, especialmente durante evaluaciones y simulacros. | RF-05, RF-07, RF-09, RF-10, RF-47, RF-48 |
| **AC-04** | Seguridad | Proteger datos personales, resultados, sesiones y operaciones económicas, con autorización por usuario y recurso. | RF-02, RF-03, RF-04, RF-11, RF-29, RF-31, RF-40, RF-41, RF-45 |
| **AC-05** | Mantenibilidad | Cambiar o añadir áreas, cursos, políticas comerciales y estrategias de personalización sin afectar innecesariamente módulos independientes. | RF-05, RF-06, RF-08, RF-12, RF-15, RF-35, RF-41 |
| **AC-06** | Integridad y consistencia | Preservar resultados académicos y coherencia de reservas, cupos, pagos y liquidaciones; prevenir efectos duplicados. | RF-07, RF-11, RF-22, RF-23, RF-27, RF-28, RF-38 |
| **AC-07** | Usabilidad | Permitir realizar los flujos principales desde celulares, tabletas y computadoras, tanto en navegador como en PWA compatible. | RF-01, RF-05, RF-07, RF-11, RF-33, RF-34, RF-39, RF-40 |
| **AC-08** | Interoperabilidad | Integrar clientes y proveedores mediante contratos claros, verificables y desacoplados de implementaciones específicas. | RF-26, RF-27, RF-30, RF-34, RF-42, RF-48 |
| **AC-09** | Testabilidad | Poder comprobar casos de uso y reglas del negocio mediante pruebas reproducibles y dependencias sustituibles. | RF-07, RF-08, RF-09, RF-23, RF-27 |
| **AC-10** | Operabilidad y eficiencia económica | Medir y controlar consumo de IA, clases en vivo, streaming y servicios administrados; detectar aumentos de gasto sin requerir intervención diaria del operador. | RF-38, RF-43, RF-44, RF-47, RF-48 |
| **AC-11** | Confiabilidad pedagógica y gobernanza de fuentes | Las explicaciones asistidas por IA deben usar fuentes autorizadas y trazables, distinguir incertidumbre y no alterar resultados académicos sin un caso de uso verificado. | RF-07, RF-08, RF-35, RF-41, RF-42 |

**Conservación de códigos:** AC-01 a AC-07 mantienen la numeración y el sentido de la versión aportada; AC-08 y AC-09 incorporan interoperabilidad y testabilidad, citadas en el sílabo. AC-10 y AC-11 se proponen como cualidades adicionales del producto ampliado.

## Priorización preliminar

| Prioridad | Atributos | Justificación |
|---|---|---|
| Crítica | AC-04, AC-06 | Protección de datos y coherencia de información académica, reservas y pagos. |
| Alta | AC-01, AC-05, AC-07, AC-09 | Experiencia de aprendizaje fluida, facilidad de evolución, acceso usable y capacidad de validar reglas. |
| Alta con metas escalonadas | AC-02, AC-03 | Continuidad y crecimiento: los umbrales deben verificarse contra recursos y demanda reales. |
| Alta en integraciones; gradual en MVP | AC-08 | Los contratos de la API son necesarios desde el inicio; pagos y otros proveedores pueden incorporarse progresivamente. |
| Alta para comercialización | AC-10, AC-11 | Sostenibilidad, control del uso y fuentes pedagógicas confiables; se activan junto a IA/video/mercado de docentes. |

## Notas de control

- **El alcance es multidisciplinario**: ninguna calidad se restringe a Matemática ni a Secundaria.
- Los aproximadamente **1 500 usuarios concurrentes** mencionados como escenario habitual de referencia y **15 000** como estrés exploratorio son hipótesis de dimensionamiento del README; **no** capacidades demostradas ni criterios de aceptación aprobados.
- La prioridad de los atributos no equivale a su implementación simultánea: se validarán incrementalmente con los casos de uso de cada sprint.
- Seguridad, consistencia y autorización requieren pruebas también para las funciones comerciales cuando estas se implementen.

## Criterios especiales acordados

- **Publicidad:** pertinencia educativa y no intrusión durante el aprendizaje (AC-07), protección de datos y menores (AC-04) y consumo controlado de recursos (AC-10).
- **Video:** separar continuidad y capacidad de emisión y reproducción (AC-01 a AC-03) de la corrección del acceso a salas y grabaciones (AC-04 y AC-06).
- **RAG:** recuperación solo de documentos autorizados; respuesta con referencias a fuentes cuando existan; manejo visible de incertidumbre (AC-11). La indexación no autoriza entrenamiento de modelos.
- **Economía:** métricas técnicas y costos observados se recopilan para decidir límites, escalabilidad y márgenes; no equivale a asegurar rentabilidad comercial.
