# MENTELYX — INSTRUCCIÓN MAESTRA DEFINITIVA
## Corrección integral, consolidación arquitectónica y cierre del Sprint 02

**Fecha:** 20 de noviembre de 2026.

**Repositorio:** E:\Mentelyx.

## 1. Objetivo y autoridad

Completar definitivamente el Sprint 02: Diseño de la Arquitectura de Software y Evaluación de Atributos de Calidad.

La presente instrucción consolida las decisiones aprobadas por el propietario de Mentelyx, sustituye las especificaciones contradictorias anteriores e incorpora los resultados de la auditoría independiente de docs.zip y docs(1).zip.

Es una instrucción autosuficiente. No requiere recuperar conversaciones de ChatGPT, Codex ni Claude Code.

La auditoría determinó que el SDD v1.0 se elaboró sobre la arquitectura anterior. Entre ambos ZIP cambiaron seis documentos existentes y se añadió el SDD; los otros 27 documentos permanecieron idénticos.

Por ello, no basta con actualizar el SDD. Primero deben corregirse sus documentos fuente.

Cuando una decisión anterior contradiga una decisión explícita de esta instrucción, prevalecerá esta instrucción.

No estás autorizado a:

- Redefinir el producto.
- Eliminar funcionalidades aprobadas.
- Cambiar los precios o cuotas aprobados.
- Seleccionar otras tecnologías por iniciativa propia.
- Inventar acuerdos comerciales.
- Presentar estimaciones como mediciones reales.
- Declarar pruebas superadas que no se hayan ejecutado.

Distinguir decisiones aprobadas, parámetros operativos de piloto, tarifas oficiales, mediciones pendientes y condiciones legales o contractuales de producción.

## 2. Preparación y metodología

Antes de modificar:

1. Leer AGENTS.md, CLAUDE.md y README.md.
2. Inspeccionar el árbol completo y git status.
3. Leer el registro de avance del Sprint 02.
4. Identificar documentos vigentes, históricos y diagramas afectados.
5. Preservar los aportes compatibles de Codex y Claude Code.
6. Utilizar las skills locales correspondientes.

Skills disponibles:

- mentelyx-auditoria
- mentelyx-persistencia
- mentelyx-contratos
- mentelyx-ia-rag
- mentelyx-motor-visual
- mentelyx-seguridad
- mentelyx-infraestructura
- mentelyx-calidad-sdd

Conservar una única copia canónica de esta instrucción en:

`docs/00-gestion-del-proyecto/sprint-02/instruccion-maestra.md`

Si se necesita un índice de acuerdos aprobados, debe referenciar esta instrucción y no duplicarla íntegramente.

Actualizar el registro de continuidad después de cada etapa para permitir reanudación sin pérdida de contexto.

No volver a comenzar la arquitectura desde cero. No utilizar subagentes innecesarios ni instalar herramientas sin justificación.

## 3. Propósito definitivo de Mentelyx

Mentelyx es una plataforma educativa SaaS independiente cuyo núcleo es el aprendizaje mediante Tutor IA, fuentes educativas, preparación de exámenes y herramientas visuales interactivas.

Los docentes humanos, clases, cursos, videos, tutorías y Studio complementan esta experiencia.

No diseñar Mentelyx principalmente como un marketplace de profesores.

Conservar cuatro niveles académicos:

- Primaria.
- Secundaria.
- Preuniversitario.
- Universitario.

Conservar dos tipos de cuentas públicas:

- Estudiante.
- Docente.

El Superadministrador constituye un rol interno, no un tercer tipo de cuenta pública.

Los niveles educativos, tipos de cuentas, planes, roles y habilitaciones son conceptos independientes.

Conservar las habilitaciones de docentes, instructores y creadores educativos que ya se hayan acordado.

Un estudiante universitario adulto puede adquirir funciones de tutor mediante la habilitación correspondiente, sin cambiar necesariamente su tipo de cuenta.

Los convenios institucionales permanecen como evolución posterior. Mentelyx no se convierte en un sistema administrativo de colegios.

## 4. Arquitectura tecnológica aprobada

### 4.1. Arquitectura general

- Estilo: monolito modular.
- Enfoque interno: Clean Architecture.
- Frontend: Next.js, React y TypeScript.
- Aplicación Web Progresiva, PWA.
- Renderizado híbrido SSG, SSR, ISR y CSR.
- Despliegue frontend objetivo: Cloudflare Workers mediante OpenNext.
- Backend: Hono y TypeScript sobre Cloudflare Workers.
- API REST versionada bajo /api/v1.
- Respuestas progresivas mediante SSE.
- Procesamiento asíncrono mediante Cloudflare Queues.
- Autenticación: Better Auth.
- Desarrollo local: Docker Compose.
- Monorepo: pnpm workspaces.
- Compilación y herramientas: Node.js LTS.
- Despliegue y desarrollo Workers: Wrangler.
- Validación de DTO: Zod.
- Contratos HTTP: OpenAPI 3.1.
- Validación JSON Schema: Ajv.
- Pruebas: Vitest, Playwright y k6.
- Restricciones de dependencias: ESLint.

Mantener las decisiones existentes sobre seguridad, CI/CD, observabilidad, respaldo y recuperación cuando sean compatibles.

Eliminar la restricción que obliga a utilizar exclusivamente Next.js estático en Cloudflare Pages.

Next.js no asumirá las reglas de negocio correspondientes a Hono.

No introducir microservicios, Kubernetes, Kafka, balanceadores adicionales ni complejidad distribuida sin una necesidad demostrada.

### 4.2. Módulos

Conservar los siete módulos y sus denominaciones canónicas:

- M1: Usuarios y Administración.
- M2: Cursos y Contenidos.
- M3: Evaluaciones y Aprendizaje.
- M4: Docentes y Clases.
- M5: Suscripciones y Pagos.
- M6: Tutor IA y RAG.
- M7: Publicidad y Patrocinios.

No crear módulos adicionales para Studio, biblioteca, pizarra, BYOK, recursos 3D ni procesamiento asíncrono.

## 5. Persistencia

### 5.1. Motores seleccionados

- PostgreSQL local y Neon: información relacional y transaccional.
- MongoDB local y MongoDB Atlas: contenido documental.
- pgvector dentro de PostgreSQL: recuperación semántica.
- Redis y Upstash: caché y estados temporales recuperables.
- Cloudflare R2: archivos y objetos.

No crear bases de datos independientes por usuario.

### 5.2. Drizzle y Kysely

Utilizar ambos con responsabilidades delimitadas.

Drizzle ORM y Drizzle Kit:

- Definición del esquema físico.
- Única autoridad sobre migraciones.
- CRUD y repositorios generales.
- Escrituras y transacciones de negocio.

Kysely:

- Consultas especializadas.
- Recuperación híbrida RAG cuando se justifique.
- Reportes.
- Agregaciones.
- Proyecciones y modelos de lectura.

No mantener dos definiciones independientes del esquema.

Kysely no tendrá un sistema propio de migraciones.

Mantener tipos derivados o sincronizados verificablemente.

Las transacciones interactivas deben utilizar conexiones y drivers compatibles. No mezclar operaciones de una misma transacción mediante conexiones independientes.

### 5.3. Distribución de información

| Información | Motor | Módulo propietario |
|---|---|---|
| Cuentas, sesiones y permisos | PostgreSQL | M1 |
| Perfiles académicos y edad | PostgreSQL | M1 |
| Cuadernos, recursos y propietarios | PostgreSQL | M2 |
| Catálogo, versiones y licencias | PostgreSQL | M2 |
| Fuentes privadas y espacios de estudio | PostgreSQL | M2 |
| Lecciones y estructuras documentales | MongoDB | M2 |
| Proyectos y versiones Studio | MongoDB | M2 |
| Plantillas y ejercicios reutilizables | MongoDB | M2 |
| Lienzos, trazos, objetos y anotaciones guardadas | MongoDB | M2 |
| Evaluaciones, intentos y resultados | PostgreSQL | M3 |
| Objetivos y planes de estudio | PostgreSQL | M3 |
| Preguntas versionadas | MongoDB | M3 |
| Docentes, horarios, reservas y asistencia | PostgreSQL | M4 |
| Grupos privados docentes | PostgreSQL | M4 |
| Suscripciones, cuotas y derechos comerciales | PostgreSQL | M5 |
| Consumos financieros, pagos, devoluciones y conciliación | PostgreSQL | M5 |
| Credenciales BYOK cifradas | PostgreSQL | M6 |
| Trabajos y consumo técnico de IA | PostgreSQL | M6 |
| Conversaciones y escenas transitorias | MongoDB | M6 |
| Fragmentos y embeddings | PostgreSQL + pgvector | M6 |
| Campañas y eventos publicitarios | PostgreSQL | M7 |
| Autorización de recompensas | PostgreSQL | M7 |
| Concesión transaccional de recursos recompensados | PostgreSQL | M5 |
| Estados efímeros y caché | Redis | Según módulo |
| PDF, PPTX, DOCX, imágenes, GLB y adjuntos | R2 | Según recurso |

La tabla define responsabilidades funcionales. Reutilizar los esquemas y colecciones existentes cuando sean equivalentes.

Redis no será fuente de verdad de pagos, calificaciones, reservas, permisos, créditos ni devoluciones.

Completar los modelos conceptual, lógico y físico:

- Tablas y colecciones.
- Tipos de datos.
- PK y FK.
- Cardinalidades.
- Restricciones.
- Índices.
- Validadores MongoDB.
- Transacciones.
- Estados y ciclos de vida.
- Consistencia entre motores.
- Reconciliación e idempotencia.
- Migraciones y recuperación.

Conservar la estrategia existente de versiones documentales inmutables, referencias autorizadas y publicación consistente entre PostgreSQL, MongoDB y R2.

### 5.4. Perfil académico

M1 deberá persistir el nivel educativo seleccionado y la información mínima necesaria para determinar y verificar la edad.

No utilizar is_minor como único dato permanente sin una fuente fiable que permita actualizar la condición al alcanzar la mayoría de edad.

Diseñar consentimiento, verificación, actualización de condición de edad, acceso restringido y minimización de datos.

No convertir la fecha de nacimiento en información pública.

## 6. Tutor IA

El Tutor debe permitir aprender cualquier tema educativo pertinente, incluso sin matrícula ni fuentes cargadas.

Cuando el estudiante dispone de fuentes propias:

1. Priorizar las fuentes seleccionadas.
2. Recuperar información autorizada.
3. Explicar utilizando referencias verificables.
4. Complementar con conocimiento general pertinente cuando el usuario solicite mayor profundidad o las fuentes sean insuficientes.
5. Diferenciar información recuperada de explicación complementaria.
6. Respetar órdenes expresas de utilizar exclusivamente determinadas fuentes.
7. Comunicar incertidumbre y evitar referencias inventadas.

Si no existen fuentes cargadas, utilizar conocimiento general pertinente y herramientas educativas verificables.

No exigir al estudiante que seleccione manualmente un modo antes de cada consulta.

El orquestador decidirá la modalidad según intención, fuentes y contexto.

Eliminar el bloqueo permanente del modo GENERAL de ADR-058.

### 6.1. Modelos seleccionados

- DeepSeek: razonamiento matemático, físico, técnico y complejo.
- Gemma: explicaciones generales y tareas compatibles.
- BGE-M3: recuperación semántica.
- FLUX.2: ilustraciones educativas.

Variantes tecnológicas objetivo:

- DeepSeek V4.1 Flash.
- Gemma 4 26B A4B.
- BGE-M3.
- FLUX.2 Klein 4B y, cuando se justifique, 9B.

Verificar los identificadores exactos disponibles en Workers AI y sus capacidades efectivas. No sustituir los modelos aprobados sin autorización.

Claude, Nano Banana, Stability, Meshy y otros proveedores no constituirán dependencias obligatorias del lanzamiento. Podrán mantenerse como extensiones futuras.

Dos configuraciones del mismo modelo no son redundancia independiente.

Considerar también el fallo común de Workers AI.

Conservar herramientas matemáticas y científicas deterministas para cálculos, circuitos, fórmulas y diagramas estructurados.

No utilizar generación de imágenes cuando se requiera exactitud matemática o estructural y exista una representación determinista apropiada.

Mantener la separación de cuotas comerciales de M5 y consumo técnico de M6.

## 7. Fuentes privadas y RAG

Cada estudiante podrá crear espacios privados de estudio y cargar:

- PDF y libros.
- PDF escaneados.
- Sílabos y separatas.
- PPTX.
- DOCX.
- TXT.
- Markdown.
- Imágenes y apuntes.

Diseñar extracción estructurada, OCR cuando corresponda, fragmentación y referencias a páginas, diapositivas y secciones.

### 7.1. Recuperación híbrida

- BGE-M3 como modelo inicial de embeddings.
- pgvector con 1024 dimensiones.
- Recuperación semántica.
- Búsqueda textual.
- Acceso directo a fragmentos o páginas seleccionadas.
- Ordenamiento por relevancia.
- Filtrado y reevaluación de permisos.
- Control de versiones.
- Revocación e invalidación.

Sustituir Gemini Embedding 2 y vector(1536) en todas las especificaciones vigentes.

Comprobar la dimensión real devuelta por el adaptador.

El dimensionamiento vectorial, la métrica, los índices HNSW, el filtrado autorizado y los planes de ejecución deben ser coherentes.

No convertir un umbral experimental de similitud en un valor ya validado.

Diseñar recuperación semántica para adultos y menores. Mantener los bloqueos aplicables al tratamiento real de menores mientras no se satisfagan las condiciones legales y contractuales.

### 7.2. Información vectorizable

- Lecciones autorizadas.
- Libros y documentos cuyo tratamiento esté permitido.
- Ejercicios de práctica publicados.
- Ejercicios resueltos autorizados.
- Materiales educativos de Studio.
- Transcripciones preparadas y autorizadas.
- Metadatos y explicaciones de recursos reutilizables.
- Fuentes privadas dentro de sus permisos.

Excluir:

- Bancos privados de evaluación.
- Soluciones de exámenes activos.
- Credenciales.
- Datos financieros.
- Información sensible no autorizada.
- Conversaciones personales completas.

Las consultas pueden generar embeddings temporales sin incorporarse automáticamente a una biblioteca pública.

Separar derechos de almacenamiento, uso privado, publicación, indexación RAG y entrenamiento.

## 8. Preparación de exámenes y aprendizaje

Permitir:

- Exámenes del catálogo.
- Exámenes personalizados.
- Evaluaciones generadas desde una conversación.
- Evaluaciones basadas en las fuentes del estudiante.

No exigir una ficha creada por administradores para preparar un examen personal.

Antes de generar una evaluación personalizada, permitir al usuario indicar:

- Cantidad de preguntas.
- Dificultad.
- Fuentes y temas.
- Tipos de preguntas.
- Inclusión de conocimientos complementarios pertinentes.

Tipos:

- Selección múltiple.
- Definiciones.
- Respuestas abiertas.
- Completar.
- Relacionar.
- Verdadero o falso.
- Resolución de problemas.

Si el estudiante no desea personalizar, ofrecer generación rápida con un mínimo predeterminado de 15 preguntas variadas y dificultad adaptada a la asignatura.

Las 15 preguntas no representan un máximo.

Utilizar metodologías educativas reconocidas:

- Taxonomía de Bloom.
- Práctica de recuperación.
- Repetición espaciada.
- Práctica intercalada.
- Evaluación formativa.
- Aprendizaje adaptativo.
- Ejemplos resueltos.

Diferenciar enseñanza de evaluación.

En aprendizaje: explicaciones paso a paso, procedimientos, herramientas visuales y pistas.

En evaluación: controlar revelación de respuestas y retroalimentación.

M3 conserva autoridad sobre intentos, resultados, calificaciones y progreso.

Las evaluaciones oficiales no dependerán exclusivamente de resultados no reproducibles de un LLM.

Las respuestas abiertas podrán recibir retroalimentación formativa usando rúbricas y señalando limitaciones.

## 9. Pizarra inteligente definitiva

La interfaz principal será un lienzo interactivo extensible, no un chat con gráficos debajo de los mensajes.

Tampoco será un cuaderno rígido A4 ni una distribución obligatoria de chat 40% y pizarra 60%.

Características:

- Fondo de puntos o cuadrícula discreta.
- Lienzo 2D extensible.
- Desplazamiento y zoom.
- Barra flotante de consulta.
- Panel de conversación secundario desplegable.
- Imágenes y diagramas dentro del espacio de trabajo.
- Texto, fórmulas y ejercicios interactivos.
- Objetos manipulables.
- Lapiceros con distintos colores y grosores.
- Resaltadores.
- Flechas y conectores.
- Selección por lazo.
- Selección de regiones y objetos.
- Deshacer y rehacer.
- Importación de imágenes y fragmentos autorizados.
- Visores 3D integrados.
- Exportación de regiones o contenido organizado a PDF.

El estudiante puede encerrar una región de una ilustración, escribir una duda, dibujar una flecha y preguntar al Tutor qué significa.

El Tutor identificará el objeto o región seleccionada y podrá proponer explicaciones directamente sobre el lienzo.

Para objetos estructurados, utilizar identificadores, coordenadas y parámetros.

Para imágenes, utilizar recortes pertinentes y contexto de localización, minimizando los datos transmitidos.

Separar:

- Objetos originales.
- Trazos y anotaciones del usuario.
- Contribuciones de IA.

No sobrescribir automáticamente las anotaciones del estudiante.

Utilizar coordenadas independientes del zoom, versiones, control de concurrencia y operaciones recuperables.

Conservar el motor visual declarativo, sus esquemas JSON y los algoritmos científicos existentes.

No permitir ejecución arbitraria de código generado por IA.

Las páginas, marcos o secciones serán formas opcionales de organización del lienzo.

La misma PWA debe adaptarse a computadoras, tabletas y celulares, con soporte de ratón, teclado, pantalla táctil y lápiz digital.

El lienzo guardado tiene un ciclo de vida independiente del chat.

## 10. Biblioteca educativa reutilizable

Las siguientes doce condiciones están aprobadas:

- BR-01: biblioteca educativa de recursos reutilizables y plantillas profesionales.
- BR-02: buscar recursos existentes antes de realizar una nueva generación.
- BR-03: priorizar relevancia, exactitud, permisos y calidad pedagógica.
- BR-04: permitir reutilización, adaptación y generación personalizada.
- BR-05: separar las conversaciones de los recursos educativos.
- BR-06: mantener privados los recursos personales por defecto.
- BR-07: publicación independiente, voluntaria y autorizada.
- BR-08: valoraciones y métricas agregadas de utilidad educativa.
- BR-09: indexación mediante BGE-M3 y pgvector.
- BR-10: ciclo de vida independiente del historial de conversaciones.
- BR-11: posibilidad de retirar recursos publicados y revocar su acceso.
- BR-12: prohibición de alimentar la biblioteca pública con fuentes privadas o evaluaciones reservadas sin autorización válida.

Recursos previstos:

- Ejercicios resueltos.
- Diagramas técnicos.
- Ilustraciones.
- Modelos 3D.
- Simulaciones.
- Plantillas.
- Presentaciones.
- Documentos educativos.

Flujo:

Consulta → búsqueda autorizada → recuperación → comprobación de pertinencia → reutilización o adaptación → generación nueva únicamente cuando resulte necesaria.

Ejemplo: recuperar un modelo educativo de un motor turbofán ya validado y adaptar su explicación, en lugar de generar uno nuevo innecesariamente.

Permitir reutilización directa, paramétrica y adaptación personalizada.

Una plantilla determinista debe poder modificar sus parámetros sin invocar nuevamente un modelo de IA cuando sea posible.

La popularidad no sustituye la revisión científica ni la comprobación de derechos.

M2 es propietario de catálogo, recursos, publicación, permisos y versiones.

M6 realiza búsqueda inteligente, recuperación y adaptación educativa.

Estados y visibilidad:

- Privado.
- Compartido con autorización.
- Público tras publicación autorizada.
- Institucional en una evolución posterior.

No publicar conversaciones completas, mensajes personales, dificultades académicas ni información privada.

Un recurso público debe tener contenido independiente, autorización válida y procedencia identificable.

Diseñar retirada, revocación de acceso, invalidación de cachés y eliminación de embeddings correspondientes.

Los identificadores BR podrán integrarse en los RF y ADR existentes manteniendo trazabilidad.

## 11. Historial y privacidad

Conservar conversaciones durante 90 días con aviso previo.

Eliminar las políticas contradictorias de 14 y 30 días como decisiones vigentes del historial.

Parámetros operativos propuestos, todavía no aprobados independientemente:

- Computar desde la última actividad de la conversación.
- Avisar siete días antes de eliminar.

Los cuadernos, lienzos, apuntes y recursos guardados expresamente poseen ciclos de vida independientes.

Al eliminar una conversación, eliminar también datos derivados privados cuando no exista una finalidad independiente válida.

No conservar resúmenes automáticos para eludir la eliminación.

Los recursos públicos solo podrán mantenerse cuando exista autorización independiente válida y no contengan información privada que deba eliminarse.

Diseñar eliminación, revocación, caducidad de respaldos, permisos y obligaciones legales aplicables.

No aplicar automáticamente los 90 días a pagos, calificaciones o registros sujetos a otras obligaciones de conservación.

## 12. Visualizaciones 3D

Tutor IA y Studio pueden utilizar:

- Simulaciones deterministas.
- Geometrías.
- Modelos educativos verificados.
- Adaptaciones de recursos existentes.
- Generaciones personalizadas cuando exista una integración autorizada.

Mantener Three.js y formatos GLB/glTF.

Priorizar biblioteca reutilizable antes de generación externa.

No restringir toda representación 3D a Studio o a usuarios adultos.

Diferenciar visualizar un modelo existente de generar uno nuevo mediante un proveedor.

No contratar automáticamente Stability, Meshy u otros proveedores.

Mantener condiciones de calidad, privacidad, derechos y costo.

## 13. Studio profesional

Studio es una capacidad de Mentelyx, no otro tipo de cuenta.

Debe producir materiales educativos profesionales y editables.

Proceso:

1. Analizar objetivo, audiencia, nivel y formato.
2. Recuperar fuentes autorizadas.
3. Planificar contenido pedagógico.
4. Seleccionar dirección visual.
5. Aplicar plantillas profesionales.
6. Generar estructura validada.
7. Preparar fórmulas, diagramas e ilustraciones pertinentes.
8. Renderizar.
9. Revisar calidad visual y contenido.
10. Permitir edición y exportación.

Tecnologías objetivo:

- PptxGenJS para PPTX editable.
- HTML/CSS para PDF.
- Cloudflare Browser Run para renderizado compatible.
- KaTeX para fórmulas.
- SVG y motores deterministas.
- FLUX.2 para ilustraciones.
- Three.js cuando corresponda.

Utilizar buenas prácticas de skills profesionales de generación de documentos y presentaciones como referencia del motor propio.

Una skill instalada en Claude Code no constituye automáticamente una funcionalidad de Mentelyx.

Incluir controles de:

- Jerarquía tipográfica.
- Composición.
- Contraste.
- Desbordamiento.
- Legibilidad.
- Exactitud científica.
- Referencias.
- Calidad de imágenes.
- Coherencia visual.
- Editabilidad.

Conservar la separación entre materiales estudiantiles y soluciones reservadas del docente.

No incluir respuestas privadas de evaluación en notas ocultas, metadatos o diapositivas invisibles del PPTX estudiantil.

No mantener automáticamente los antiguos productos Studio Plus/Pro independientes si contradicen la estructura comercial vigente.

## 14. Planes estudiantiles aprobados

**No modificar esta matriz.**

| Recurso mensual | Gratuito | Estándar | Plus | Premium |
|---|---:|---:|---:|---:|
| Precio PEN | 0 | 39,90 | 59,90 | 89,90 |
| Consultas generales | 60 | 250 | 450 | 750 |
| Consultas técnicas | 15 | 100 | 200 | 350 |
| Razonamiento profundo | 2 | 20 | 50 | 100 |
| Evaluaciones equivalentes de 15 preguntas | 3 | 10 | 20 | 40 |
| Ilustraciones nuevas estándar | 4 | 10 | 25 | 50 |
| Almacenamiento | 500 MB | 2 GB | 5 GB | 10 GB |

Todos los planes incluyen:

- Tutor IA.
- Aprendizaje general.
- Fuentes propias.
- Preparación de exámenes.
- Pizarra inteligente.
- Biblioteca reutilizable.
- Simulaciones deterministas.

Los planes superiores amplían capacidad, no eliminan las funciones educativas esenciales del gratuito.

Permitir BYOK a adultos elegibles.

Permitir capacidad adicional mediante publicidad recompensada cuando corresponda.

No insertar publicidad obligatoria en los planes de pago.

Las clases humanas no son ilimitadas ni están automáticamente incluidas en estos planes.

Retirar como especificaciones vigentes los anteriores precios Plus S/29,90, Pro S/59,90 y cuotas 30/300/900 UTI.

Mantener los límites como configuración de piloto versionada.

## 15. Modelo docente definitivo

Conservar los acuerdos anteriores:

- Contratación docente por horas.
- Tarifas configuradas por el docente.
- Disponibilidad y horarios.
- Tutorías individuales y grupales.
- Grupos privados propios.
- Publicación voluntaria de videos.
- Grabación opcional.
- Videos promocionales sin remuneración automática por visualización.
- Privacidad de grupos, conversaciones y perfiles académicos.
- Habilitación verificable para impartir clases.

Pagar una suscripción no convierte automáticamente al usuario en docente acreditado.

Los acuerdos anteriores contemplan pagos directos al docente mediante Yape, tarjeta o QR, con la comisión correspondiente a Mentelyx según condiciones comerciales.

No asumir que una transferencia directa permite descontar automáticamente esa comisión.

Diseñar registro, verificación y conciliación de pagos, sin inventar custodia de dinero ni mecanismos de reparto que no se hayan contratado.

No imponer:

- S/8 por crédito.
- Reparto 70/30.
- Liquidación semanal obligatoria.
- Aulas Live de S/99,90 mediante cuatro créditos.

La suscripción docente es independiente de sus ingresos por impartir clases.

### 15.1. Docente Inicial

Precio aprobado: **S/55 mensuales**.

Destinado al uso profesional y creación de materiales.

No incluye impartir clases en vivo.

Recursos propuestos para configuración inicial de piloto:

- 30 documentos PDF/PPTX equivalentes.
- 100 consultas generales.
- 50 consultas técnicas.
- 10 consultas profundas.
- 30 ilustraciones estándar.
- 10 GB documentales.
- 5 GB de almacenamiento de videos.
- 10 GB de transferencia audiovisual.
- Plantillas y edición manual.
- BYOK para adultos elegibles.

Los límites de extensión y complejidad documental deben estar definidos y vinculados al presupuesto de operación.

### 15.2. Docente Live

Precio aprobado: **S/100 como importe inicial mensual**.

Incluye las capacidades profesionales del plan Inicial y permite impartir clases una vez completada la habilitación correspondiente.

El docente declara:

- Horas previstas por semana.
- Modalidad de enseñanza.
- Participantes estimados.
- Horarios.
- Necesidades de grabación.

Medir consumo audiovisual mediante participante-minutos, incluyendo al docente conforme a la unidad de facturación del proveedor.

Cuando no se agote la capacidad contratada, devolver el saldo audiovisual no utilizado después de descontar el acceso a la plataforma y el consumo correspondiente.

Si se supera la capacidad, notificar al docente y solicitar autorización para ampliación o cobros adicionales.

No ofrecer clases ilimitadas.

### 15.3. Parámetros operativos propuestos

Estos valores constituyen configuración provisional de piloto, no tarifas contractuales verificadas ni nuevas aprobaciones independientes:

- S/55: acceso profesional.
- S/45: saldo audiovisual prepagado.
- S/12 por cada 1.000 participante-minutos.
- Capacidad inicial equivalente: 3.750 participante-minutos.
- Avisos al 70%, 90% y 100%.

Con la configuración de referencia:

Consumo audiovisual PEN = participante-minutos × 0,012.

Saldo candidato a devolver = máximo entre cero y 45 menos consumo facturable.

Cargo adicional candidato = máximo entre cero y consumo facturable menos 45.

No aplicar nuevamente un margen arbitrario sobre la devolución.

Evaluar costos de pasarela, comisiones no recuperables, impuestos y reembolsos antes de comercializar.

Permitir financiación adicional mediante paquetes o mediante el importe de clases contratadas.

No efectuar doble cobro por capacidad ya financiada.

Reservar la capacidad necesaria antes de comenzar una clase y no interrumpirla arbitrariamente.

No realizar cargos adicionales sin autorización.

Mantener presupuestos máximos, registro de consumo efectivo, conciliación y trazabilidad financiera.

## 16. Publicidad

M7 utilizará redes publicitarias externas compatibles y anuncios recompensados.

No depender de conseguir patrocinadores directos para financiar el lanzamiento.

La publicidad recompensada será voluntaria y permitirá ampliar capacidad educativa cuando exista una recompensa válida.

No insertar publicidad dentro de explicaciones del Tutor.

No interrumpir:

- Evaluaciones.
- Clases en vivo.
- Lecciones pagadas.
- Editor de materiales.
- Operaciones financieras.

No utilizar conversaciones, fuentes privadas, calificaciones ni dificultades académicas para segmentación publicitaria.

Aplicar protección de menores.

No habilitar anuncios recompensados para menores hasta comprobar compatibilidad legal y del proveedor.

Conservar acceso educativo fundamental aunque no haya publicidad disponible.

M7 verifica eventos y elegibilidad. M5 concede recursos adicionales de manera transaccional e idempotente.

Usar mecanismos antifraude y de verificación verdaderamente disponibles para web y PWA.

No confiar únicamente en eventos manipulables enviados por el navegador.

No prometer ingresos publicitarios ni cantidades de consultas financiables sin mediciones reales.

## 17. BYOK

Permitir Bring Your Own Key para adultos elegibles.

El usuario conecta una API key propia de un proveedor compatible y autorizado.

Distinguir facturación de API de suscripciones a ChatGPT, Claude u otros servicios.

No afirmar que la API de DeepSeek es ilimitadamente gratuita.

Controles:

- Credenciales cifradas mediante cifrado autenticado.
- Clave maestra separada de los datos cifrados.
- Acceso limitado a adaptadores autorizados.
- No registrar secretos en logs ni conversaciones.
- No devolver claves completas mediante API.
- Revocación y sustitución.
- Límites y presupuestos configurables.
- Información clara sobre el proveedor receptor de los datos.
- No realizar fallback automático con facturación de Mentelyx.
- Aplicar privacidad, seguridad y calidad pedagógica.
- No permitir que BYOK eluda restricciones de menores.

BYOK financia inferencia compatible, pero no elimina los costos de almacenamiento, embeddings, OCR, renderizado, video ni infraestructura.

Mantener la arquitectura extensible a proveedores adicionales sin implementar todos obligatoriamente.

## 18. Infraestructura, costos y dimensionamiento

Tecnologías objetivo:

- Cloudflare Workers Paid.
- Workers AI.
- Cloudflare Queues.
- Cloudflare R2.
- Neon.
- MongoDB Atlas.
- Upstash Redis.
- Cloudflare RealtimeKit.
- Bunny Stream.
- Cloudflare Browser Run.
- Resend como referencia de correo transaccional.

Mantener DNS, CDN, TLS, dominio, seguridad perimetral, caché, CI/CD, observabilidad y recuperación coherentes con las decisiones existentes.

### 18.1. Presupuestos iniciales de operación

Las siguientes son cotas presupuestarias de diseño, no mediciones reales:

| Operación | USD |
|---|---:|
| Consulta general | 0,001 |
| Consulta técnica | 0,006 |
| Razonamiento profundo | 0,015 |
| Evaluación equivalente de 15 preguntas | 0,025 |
| Ilustración estándar | 0,003 |
| Documento educativo complejo | 0,060 |

Verificar su compatibilidad con tarifas oficiales y límites técnicos.

No modificar las cuotas aprobadas unilateralmente ante una diferencia de costos.

### 18.2. Tarifas de referencia que requieren verificación

- Workers Paid: USD 5 mensuales de base.
- Neon: USD 0,106 por CU-hora y USD 0,35 por GB-mes, según plan correspondiente.
- Atlas Flex: USD 8–30 mensuales.
- Upstash: USD 0,20 por 100.000 comandos.
- R2: USD 0,015 por GB-mes de almacenamiento estándar.
- RealtimeKit: USD 0,002 por participante-minuto.
- Exportación audiovisual: USD 0,010 por minuto.
- Bunny Stream: almacenamiento desde USD 0,01 por GB.
- Browser Run: verificar asignación incluida y excesos.
- Resend: verificar límites gratuitos y plan contratado.

No tratar estas referencias como tarifas garantizadas vigentes sin consultar las fuentes oficiales.

Documentar:

- Fecha de consulta.
- Moneda.
- Plan.
- Unidad de facturación.
- Costo base.
- Excesos.
- Límites y asignaciones gratuitas compartidas.
- Impuestos y condiciones.

Utilizar tipo de cambio verificable y fechado.

No presentar S/420 de infraestructura ni un punto de equilibrio específico como una medición comprobada.

Separar costos unitarios, capacidad aprobada y consumos reales pendientes de medición.

Dimensionar solicitudes, concurrencia, tokens, trabajos asíncronos, conexiones, almacenamiento, vectores, participante-minutos y crecimiento.

### 18.3. Fuentes oficiales

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/workers-ai/platform/pricing/
- https://developers.cloudflare.com/realtime/realtimekit/platform/pricing/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/browser-run/pricing/
- https://neon.com/pricing
- https://www.mongodb.com/docs/atlas/billing/atlas-flex-costs/
- https://upstash.com/pricing/redis
- https://bunny.net/pricing/stream/
- https://resend.com/pricing
- https://www.sbs.gob.pe/

Si no existe acceso a una fuente, identificarlo explícitamente. No inventar una verificación.

## 19. Pasarela de pagos aprobada: CulqiOnline

La decisión P-07 queda resuelta tecnológicamente.

**Seleccionar CulqiOnline como pasarela principal de Mentelyx.**

Mercado Pago permanecerá como alternativa futura, sin implementar ambos inicialmente.

### 19.1. Tarifario publicado

Tarifas consultadas el 20 de noviembre de 2026:

| Medio | Comisión publicada |
|---|---:|
| Tarjetas nacionales | 3,44% + USD 0,20 |
| Tarjetas internacionales | 3,99% + USD 0,20 |
| Yape | 3,44% + USD 0,20 |
| PagoEfectivo | 3,99%, sujeto a comisión mínima |
| Cuotéalo BCP | 3,99%, sujeto a comisión mínima |

La nota publicada por Culqi establece una comisión mínima de S/3,50 para importes inferiores a S/87,72.

El tarifario y centro de ayuda vinculan esta condición expresamente a PagoEfectivo y Cuotéalo.

La calculadora general también muestra la advertencia de comisión mínima, por lo que se deberá confirmar su alcance contractual exacto por medio de pago.

No interpretar automáticamente que S/3,50 se suma a todas las comisiones ordinarias.

No interpretar que debajo de S/87,72 no existe comisión.

La comisión fija de USD 0,20 y su aplicación conjunta con otros mínimos deberán reproducir las condiciones efectivas del contrato.

Las tasas pueden variar por volumen, procedencia de tarjetas, condiciones comerciales y evaluación del comercio.

### 19.2. Diseño de comisiones

Implementar un modelo configurable y versionado por:

- Proveedor.
- Medio de pago.
- Moneda.
- Importe.
- Comisión porcentual.
- Comisión fija.
- Comisión mínima.
- Umbral de importe.
- Tratamiento tributario.
- Vigencia contractual.
- Tipo de operación.

No codificar una fórmula universal que aplique incorrectamente todos los cargos a todos los medios.

Registrar la configuración utilizada en cada transacción.

Diferenciar comisión estimada y deducción efectiva conciliada.

Evitar múltiples microcobros innecesarios que incrementen el costo por transacción.

No modificar las tarifas estudiantiles y docentes aprobadas como consecuencia automática de la comisión mínima.

### 19.3. Integración

- PaymentPort.
- CulqiPaymentAdapter.
- API REST.
- Checkout y tokenización.
- Pagos únicos.
- Suscripciones recurrentes mediante medios compatibles.
- Renovación manual mediante Yape y otros medios no recurrentes.
- Webhooks.
- Devoluciones totales y parciales.
- Conciliación.
- Registro de comprobantes.

La renovación automática exigirá autorización del comprador.

No asumir que todos los medios de pago admiten recurrencia.

No almacenar PAN completo ni CVV.

Verificar eventos y consultar el estado real del pago mediante el servidor.

Mantener idempotencia, transiciones de estado, restricciones de unicidad y registros financieros auditables.

No conceder suscripciones o créditos basándose únicamente en respuestas del navegador.

### 19.4. Devoluciones de Docente Live

Culqi documenta devoluciones totales y parciales.

Las devoluciones solicitadas después del día de venta pueden descontar comisiones correspondientes y demorar entre 15 y 30 días en reflejarse en la cuenta del cliente.

Contemplar:

- Pago original.
- Consumo audiovisual efectivo.
- Saldo calculado.
- Importe solicitado para devolución.
- Comisión no recuperable.
- Importe efectivamente devuelto.
- Estado de devolución.
- Fecha.
- Identificador del proveedor.
- Conciliación.
- Reintentos e idempotencia.
- Notificación al docente.

No descontar cargos adicionales al docente que no estén contemplados en condiciones previamente informadas y autorizadas.

No declarar una devolución completada antes de contar con evidencia del proveedor.

Comprobar los medios elegibles para devolución parcial.

La regla comercial de devolución del saldo no utilizado permanece aprobada.

Las condiciones contractuales exactas de distribución de costos de devolución deben resolverse antes de cobrar a usuarios reales.

### 19.5. Fuentes oficiales de Culqi

- https://culqi.com/precios/
- https://ayuda.culqi.com/portal/es/kb/articles/cual-es-la-comision-de-culqionline
- https://docs.culqi.com/
- https://docs.culqi.com/es/documentacion/pagos-online/operaciones/devoluciones

Actualizar los costos de todos los planes utilizando estas condiciones.

La selección tecnológica de Culqi queda cerrada. La afiliación comercial, contratación, credenciales, pruebas de integración y condiciones de recurrencia y reembolso son aspectos operativos por validar.

No volver a presentar Mercado Pago y Culqi como una selección arquitectónica todavía indefinida.

## 20. Resolución de P-01 a P-11

| ID | Resolución |
|---|---|
| P-01 | GENERAL habilitado y complementación de fuentes. |
| P-02 | Aplicar matriz estudiantil aprobada. |
| P-03 | Presupuestos configurables y controlados; no aprobar automáticamente el 120%. |
| P-04 | Sustituir productos antiguos de Studio por el modelo vigente. |
| P-05 | Sustituir Aulas Live de cuatro créditos y S/8 por crédito por el modelo docente aprobado. |
| P-06 | Renovación automatizable y manual según medio disponible y autorización. |
| P-07 | CulqiOnline seleccionado como proveedor principal. |
| P-08 | Proveedores tecnológicos objetivo seleccionados; contratación pendiente. |
| P-09 | Mantener pagos docentes directos y conciliación, con condiciones fiscales y contractuales explícitas. |
| P-10 | Protección de menores y bloqueo de publicidad incompatible. |
| P-11 | Grupos privados docentes incluidos; completar los RF ausentes. |

No conservar estas preguntas como decisiones de producto sin resolver cuando ya existe una resolución explícita.

La ausencia previa de requisitos sobre grupos privados es una omisión documental, no autorización para eliminar la funcionalidad.

Conservar el historial de decisiones sustituidas con sus estados correspondientes.

## 21. Corrección integral de documentos

Ejecutar en este orden.

### Etapa A: análisis

Actualizar:

- Actores.
- Historias de usuario.
- Requisitos funcionales.
- Atributos de calidad.
- Restricciones.
- Drivers arquitectónicos.
- ADR.
- Escenarios de calidad.

Revisar especialmente RF-12, RF-14, RF-35, RF-39, RF-40, RF-42, RF-43, RF-49 a RF-52, RF-73 a RF-81 y las restricciones comerciales afectadas.

Verificar los identificadores directamente en los documentos antes de modificarlos.

Conservar HU, RF, AC, RC, DA, ADR y EQ.

Añadir identificadores siguiendo las secuencias existentes cuando se requieran nuevos requisitos.

### Etapa B: arquitectura

Actualizar:

- Arquitectura inicial.
- Componentes.
- Estilo y enfoque.
- Seguridad y autenticación.
- Caracterización y dimensionamiento.
- Infraestructura, escalabilidad y recuperación.

### Etapa C: diseño de alto y bajo nivel

Actualizar completamente:

- Diseño de persistencia y datos.
- Diseño de API y contratos.
- Diseño de interfaces y flujos.
- Diseño interno de módulos.
- Puertos y adaptadores.
- Casos de uso.
- Contratos internos.
- Principios y patrones.

Incorporar endpoints, DTO, autorizaciones, estados, idempotencia, errores, paginación, trabajos asíncronos y ciclos de vida necesarios.

### Etapa D: diseño especializado

Actualizar los siete documentos existentes:

1. Tutor IA y orquestación multiproveedor.
2. RAG.
3. Motor visual y pizarra.
4. Visualizaciones 3D.
5. Generación de materiales.
6. Criterios de calidad y pruebas.
7. Registro de decisiones y solicitudes de cambio.

No multiplicar documentos sin necesidad.

### Contradicciones detectadas en la última auditoría

Corregir específicamente:

- SDD v1.0, línea 86: Next.js estático en Pages.
- ADR, línea 186: Gemini Embedding 2.
- Persistencia: vector(1536) y ejemplos de 1536 dimensiones.
- Orquestador: BGE-M3 diferido y GENERAL deshabilitado.
- ADR-073: Kysely como autoridad de migraciones.
- RF-49: examen condicionado a ficha válida.
- Interfaces, sección 8: chat obligatorio 40% y pizarra 60%.
- Políticas anteriores de 14/30 días.
- Planes y precios anteriores.
- Biblioteca reutilizable incompleta.
- BYOK ausente.
- Publicidad recompensada ausente.
- P-11 proponiendo excluir grupos privados.

Las rutas y líneas anteriores corresponden a la auditoría de docs(1).zip. Verificar su ubicación actual antes de editar.

## 22. Diagramas arquitectónicos

Actualizar los cuatro niveles C4:

- Contexto.
- Contenedores.
- Componentes.
- Código.

Actualizar también diagramas:

- Entidad-relación.
- Documentales.
- Persistencia vectorial.
- RAG.
- Orquestación IA.
- Pizarra y selección visual.
- Ciclo de vida de recursos.
- Evaluaciones.
- Grupos docentes.
- BYOK.
- Publicidad recompensada.
- Pagos Culqi.
- Consumo audiovisual y devoluciones.
- Secuencia e interacciones internas afectadas.

Conservar fuentes editables.

No limitarse a cambiar la descripción textual de un diagrama si su contenido gráfico continúa siendo contradictorio.

Si no es posible exportar un PNG desde su fuente editable, dejar constancia exacta del archivo pendiente sin afirmar que fue regenerado.

Los tres PNG pendientes de la intervención anterior deben incluirse en el control de reexportación.

## 23. Organización documental

Estructura objetivo:

```text
Mentelyx/
  AGENTS.md
  CLAUDE.md
  README.md
  .agents/
  .claude/
  .codex/
  docs/
    00-gestion-del-proyecto/
      sprint-02/
        instruccion-maestra.md
        avance-cierre-arquitectonico-sprint-02.md
    01-analisis-de-sistema/
    02-arquitectura-software/
    03-diseño-de-software/
      diseño-externo/
      diseño-interno/
      diseño-especializado/
    04-modelo-c4/
    05-evaluacion-arquitectonica/
    06-SDD/
      documento-de-diseño-de-software.md
    img/
```

Conservar las rutas reales cuando sean equivalentes y evitar renombramientos innecesarios.

Trasladar el registro de avance a gestión del proyecto.

Clasificar auditorías y registros operativos en esa carpeta.

Los contratos técnicos vinculantes permanecen en su área correspondiente.

Trasladar el SDD existente desde docs/05-sdd/ a su ubicación definitiva, sin duplicarlo.

Conservar su nombre `documento-de-diseño-de-software.md`.

Actualizar todos los enlaces relativos afectados:

- README.
- AGENTS.
- CLAUDE.
- Skills.
- Documentos técnicos.
- Diagramas.
- Referencias internas.

No reorganizar indiscriminadamente las imágenes ni sus fuentes editables.

Incorporar en AGENTS.md una política permanente:

- No crear documentos sueltos.
- No duplicar especificaciones.
- No modificar decisiones aprobadas sin autorización.
- Mantener referencias coherentes.
- Consultar la instrucción maestra antes de continuar tareas del Sprint 02.

## 24. Evaluación arquitectónica

Conservar los aportes válidos de la evaluación del SDD v1.0.

Ejecutar una reevaluación documental inspirada en ATAM después de corregir todas sus fuentes.

No afirmar que se realizó un ATAM formal con interesados cuando no hubo taller.

Conservar los 31 escenarios EQ originales y sus umbrales aprobados.

Agregar escenarios justificados para las nuevas capacidades, sin eliminar los anteriores arbitrariamente.

Evaluar:

- Rendimiento.
- Disponibilidad.
- Escalabilidad.
- Seguridad.
- Mantenibilidad.
- Integridad.
- Usabilidad.
- Interoperabilidad.
- Capacidad de prueba.
- Costos.
- Calidad pedagógica.

Incluir:

- Objetivos de negocio.
- Árbol de utilidad.
- Importancia y dificultad.
- Riesgos.
- No riesgos argumentados.
- Puntos sensibles.
- Compromisos arquitectónicos.
- Temas de riesgo.
- Mitigaciones.
- Evidencias requeridas.

Prestar especial atención a:

- Costos de inferencia.
- RAG privado.
- Protección de menores.
- BYOK.
- Reutilización de recursos.
- Publicación derivada de conversaciones.
- Selección contextual en pizarra.
- Publicidad recompensada.
- Culqi.
- Comisión mínima.
- Cobros recurrentes.
- Devoluciones audiovisuales.
- Consistencia entre motores.

Organizar los resultados en:

`docs/05-evaluacion-arquitectonica/`

Archivos:

- 01-evaluacion-de-atributos-de-calidad.md
- 02-analisis-de-riesgos-y-compromisos.md
- 03-estrategia-de-pruebas.md
- 04-matriz-de-trazabilidad.md

Reutilizar y trasladar contenido del SDD anterior cuando corresponda; no mantener dos copias vigentes de la misma especificación.

## 25. Estrategia de pruebas

Conservar las pruebas existentes BP, SEC, API, PR-INF, K6, FAL, CON, MIG, CAC y ARQ cuando sean compatibles.

Completar pruebas reproducibles de:

- Unidades.
- Integración.
- Contratos.
- E2E.
- Carga y escalabilidad.
- Seguridad.
- Aislamiento entre usuarios.
- Inyección de instrucciones mediante documentos.
- Recuperación híbrida.
- Precisión matemática.
- Calidad pedagógica.
- Evaluaciones.
- Persistencia del lienzo.
- Selección visual.
- Biblioteca y revocación.
- Calidad documental.
- BYOK.
- Verificación publicitaria.
- Suscripciones.
- Webhooks Culqi.
- Pagos rechazados y duplicados.
- Renovación.
- Comisiones por medio de pago.
- Comisión mínima y límites de importe.
- Devoluciones parciales.
- Conciliación.
- Consumo audiovisual.
- Autorización de cargos adicionales.
- Restauración.
- Recuperación ante fallos.

Conservar las cargas vigentes de k6, incluyendo los escenarios de 100 VU durante diez minutos con p95 ≤ 2 segundos y 5xx inferior al 1%, y 50/100/200 VU con p95 ≤ 3 segundos, conforme a sus respectivos EQ.

No confundir usuarios reales, usuarios concurrentes, VU y solicitudes por segundo.

Mantener RTO y RPO explícitos por tipo de dato.

Medir durante la implementación:

- Tokens facturables.
- Latencias.
- Costos por operación.
- Procesamiento OCR.
- Indexación.
- Renderizado.
- Escrituras.
- Participante-minutos.
- Transferencia.
- Costos efectivos de proveedor.

Todas las pruebas no ejecutadas deben permanecer como pendientes de ejecución.

No generar resultados ficticios.

No realizar pruebas pagadas, contratar servicios ni procesar datos reales de menores sin autorización.

## 26. SDD definitivo y preparación para desarrollo

Actualizar el SDD existente después de corregir todos los documentos fuente.

Debe contener o referenciar:

1. Propósito y alcance.
2. Contexto.
3. Requisitos.
4. Drivers.
5. Arquitectura general.
6. Decisiones y justificaciones.
7. Vistas C4.
8. Responsabilidades de módulos.
9. Persistencia.
10. API y contratos.
11. Diseño interno.
12. Tutor IA y RAG.
13. Pizarra.
14. Biblioteca.
15. Studio.
16. Seguridad y privacidad.
17. Modelo comercial y Culqi.
18. Infraestructura y dimensionamiento.
19. Evaluación arquitectónica.
20. Estrategia de pruebas.
21. Trazabilidad.
22. Secuencia incremental de desarrollo.

El SDD no debe copiar íntegramente todos los documentos especializados.

Mantener una única fuente de verdad por especificación.

Conservar la trazabilidad requisito → driver → ADR → componente → escenario → prueba → evidencia.

Relacionar los dieciséis criterios docentes:

1. Problema y requisitos.
2. Análisis y diseño.
3. Arquitectura de alto y bajo nivel.
4. Desarrollo basado en SDD.
5. Pruebas unitarias e integración.
6. E2E.
7. UI/UX.
8. Escalabilidad frontend/backend.
9. Escalabilidad de base de datos.
10. DNS, CDN, dominio y subdominios.
11. Caché.
12. CI/CD.
13. Carga con k6.
14. GitHub, esquema, migraciones y datos de prueba.
15. Informe final.
16. Presentación y sustentación mediante dominio.

No inventar puntajes ni cumplimiento de criterios correspondientes a implementación inexistente.

### Secuencia incremental

Reordenar I-0 a I-7 o su equivalente respetando dependencias.

Prioridad:

1. Fundaciones tecnológicas, seguridad y mecanismos iniciales de control de costos.
2. Autenticación, perfiles, espacios y fuentes privadas.
3. RAG y Tutor IA.
4. Pizarra inteligente.
5. Biblioteca reutilizable.
6. Evaluaciones y progreso.
7. Studio y ampliación de capacidades comerciales.
8. Docentes, audiovisual, Culqi, publicidad y operación, según sus dependencias.

Integrar los controles de autorización, cuotas, persistencia y observabilidad desde los primeros incrementos, aunque el producto comercial completo se implemente después.

No relegar el Tutor IA hasta después de Studio.

No comenzar todavía el desarrollo de la aplicación en esta intervención.

## 27. Auditoría final y entrega obligatoria

Antes de concluir, verificar por contenido:

- Modelo educativo.
- Planes y precios aprobados.
- Docente Inicial y Live.
- CulqiOnline.
- Comisión mínima y reglas por medio de pago.
- Renovaciones y devoluciones.
- Siete módulos.
- Arquitectura híbrida Next.js.
- Hono.
- Persistencia SQL, documental y vectorial.
- BGE-M3, 1024 dimensiones.
- Drizzle y Kysely.
- Seguridad y privacidad.
- Perfil académico.
- Tutor GENERAL.
- Fuentes privadas.
- Evaluaciones personalizables.
- Mínimo predeterminado de 15 preguntas.
- Pizarra extensible.
- Biblioteca BR-01 a BR-12.
- Historial de 90 días.
- Studio profesional.
- Grupos privados docentes.
- Publicidad recompensada.
- BYOK.
- Diagramas.
- ATAM.
- Pruebas.
- Trazabilidad.
- SDD.
- Organización documental.

Entregar matriz de verificación con:

| Campo | Contenido |
|---|---|
| Acuerdo | Identificador o descripción |
| Requisito | RF correspondiente |
| Decisión | ADR correspondiente |
| Evidencia | Archivo y sección exacta |
| Datos | Tabla, colección o estructura |
| Contrato | API o contrato interno |
| Evaluación | EQ y prueba |
| Estado | Cumplido, incompleto o no aplicable justificado |

Verificar que no existan como decisiones vigentes:

- Next.js exclusivamente estático.
- Gemini Embedding 2.
- Vector de 1536 dimensiones.
- GENERAL permanentemente deshabilitado.
- Retención de conversaciones de 14/30 días.
- Planes antiguos.
- Cuatro créditos Aulas Live.
- S/8 por crédito docente.
- Kysely como autoridad de migraciones.
- Pizarra subordinada obligatoriamente al chat.
- Grupos privados excluidos.
- Pasarela de pagos tecnológicamente indefinida.

Las referencias históricas podrán conservarse únicamente como decisiones sustituidas.

Ejecutar:

- git diff --check.
- Verificación de enlaces.
- Verificación de identificadores.
- Validación JSON cuando corresponda.
- Comprobación de trazabilidad.
- Revisión de duplicados.
- Revisión de referencias gráficas.
- Comprobación de consistencia entre documentos.

No basta con verificar enlaces o buscar palabras. Revisar datos, contratos, flujos y reglas de negocio.

Entregar finalmente:

- Archivos modificados.
- Archivos trasladados.
- Contradicciones corregidas.
- Decisiones consolidadas.
- Diagramas actualizados.
- Diagramas pendientes de exportación.
- Resultado de validación documental.
- Ubicación del SDD.
- Ubicación de ATAM y pruebas.
- Matriz de cumplimiento.
- Condiciones técnicas, económicas, legales y contractuales pendientes.
- Primera tarea concreta de implementación.

Distinguir diseño definido de compatibilidad por probar, rendimiento por medir y producción por habilitar.

Cuando exista un bloqueo de producción, establecer comportamiento seguro para desarrollo local con adaptadores simulados y datos sintéticos.

No afirmar que Mentelyx está listo para producción.

No hacer commits, pushes, despliegues ni contrataciones.

No generar otra propuesta de arquitectura.

**Ejecuta la corrección integral. Conserva el trabajo válido existente y completa la documentación conforme a esta instrucción.**
