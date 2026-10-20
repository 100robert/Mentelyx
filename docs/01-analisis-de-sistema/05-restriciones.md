# 05. Restricciones — Mentelyx

## Propósito

Las restricciones son condiciones **impuestas o acordadas** que limitan alternativas de arquitectura, operación o alcance funcional. A diferencia de un atributo de calidad, una restricción no describe por sí sola una medida de rendimiento o satisfacción. Algunas restricciones de negocio coinciden con reglas de los requisitos; se mantienen aquí por ser decisiones explícitas que condicionan el diseño.

## Restricciones vigentes del producto y proyecto

| ID | Tipo | Restricción | Descripción y efecto sobre la arquitectura |
|---|---|---|---|
| **RC-01** | Producto / canal | Aplicación web instalable como PWA | Mentelyx será una web responsive, mobile-first e instalable como PWA en navegadores compatibles. La primera versión no contempla una app móvil nativa separada. |
| **RC-02** | Académica / gestión | Control de versiones | Documentación y código se mantendrán con Git y repositorio GitHub para seguimiento de cambios y evidencias. |
| **RC-03** | Negocio | Acceso independiente | El registro general no exigirá pertenecer a una institución ni un correo institucional. |
| **RC-04** | Negocio | Convenios sin acceso institucional | Colegios, academias y centros con convenio no dispondrán de cuentas o paneles; los beneficios se administran en Mentelyx. |
| **RC-05** | Integración | Pagos por proveedor externo | El procesamiento de pagos de suscripciones y tutorías se delegará a una pasarela externa; Mentelyx valida y registra sus resultados. |
| **RC-06** | Operación | Administración inicial | El propietario podrá operar como superadministrador; posteriormente se podrán delegar permisos mediante cuentas separadas. |
| **RC-07** | Negocio / seguridad | Verificación docente | Ninguna cuenta obtiene permisos para ofrecer servicios docentes sin revisión y aprobación previa. |
| **RC-08** | Seguridad / despliegue | HTTPS | Los accesos públicos y las comunicaciones sensibles deberán realizarse sobre HTTPS correctamente configurado. |
| **RC-10** | Publicidad / experiencia | Ubicaciones excluidas | Se prohíben banners en evaluaciones, videoclases, editor de materiales, reproducción de lecciones de pago y liquidaciones. La publicidad restante será claramente identificada, contextual y aprobada. |
| **RC-11** | Derechos de autor | Licencia y permisos de contenidos | Publicar materiales docentes no autoriza automáticamente su indexación RAG, redistribución comercial o entrenamiento de modelos; los derechos se documentan por uso y versión. |
| **RC-12** | IA / autoría | No entrenar con aportes por defecto | Mentelyx no utilizará materiales docentes para entrenamiento o fine-tuning de modelos por defecto; una eventual iniciativa requiere acuerdo independiente y revisión jurídica/técnica. |
| **RC-13** | Privacidad audiovisual | Grabación opcional | Las clases en vivo no se grabarán automáticamente; su activación exige avisos, permisos, alcance de acceso y reglas de conservación y retirada. |
| **RC-14** | Comercial | Tutorías independientes de planes | La compra de Plus o Pro no incluye automáticamente tutorías o clases individuales pagadas; los beneficios excepcionales deben configurarse expresamente. |
| **RC-15** | Negocio / datos | Prohibición de segmentación académica | No se utilizarán notas, dificultades, diagnósticos, conversaciones privadas o perfil individual de aprendizaje para orientar publicidad. En menores, respetar normativa y políticas del proveedor; no implementar segmentación conductual. |
| **RC-16** | Editorial / trazabilidad | Verificabilidad de fichas de examen | Cada ficha y temario de preparación debe conservar fuente, fecha/versión, tipo de evaluación y estado referencial o verificado. Sin evidencia suficiente, no se publicará como ficha oficial, ni se sugerirá aval institucional. |
| **RC-17** | Comunicación responsable | Sin garantía de resultados | Los indicadores, simulacros y planes de preparación no garantizan nota, aprobación o admisión. La plataforma identificará claramente estimaciones e información de referencia. |

## Alcance de un hito académico anterior (referencia histórica)

El hito de **análisis y decisiones arquitectónicas** de la guía actual no exige desarrollar funciones nuevas para esa entrega. **No constituye una restricción permanente del producto ni del curso completo**: en semanas posteriores el sílabo solicita código, APIs, pruebas, contenedores y despliegue. Este texto de una entrega anterior **no es restricción de producto**. El código RC-09 queda **reservado en el historial**; las restricciones nuevas se numeran RC-10 a RC-15 para evitar reutilizar su significado.

## Condiciones pendientes de confirmar — no son restricciones aprobadas

| Tema | Qué falta precisar | Por qué importa |
|---|---|---|
| Presupuesto operativo mensual | Tope efectivo y servicios incluidos (dominio, infraestructura, almacenamiento, bases de datos, correo, IA). | Afecta alojamiento, escalabilidad y uso de servicios administrados. |
| Proveedor de hosting y servicios | Elegir tras comparar costos, capacidades, limitaciones y despliegue del backend. | No convertir una preferencia tecnológica en imposición sin justificarla. |
| Tratamiento de información de menores | Analizar y documentar obligaciones aplicables a registro, privacidad, autorizaciones y conservación de datos en Perú. | Afecta políticas y controles, **sin crear por defecto cuentas de padres**. |
| Políticas comerciales | Precios, comisiones, descuentos, vencimientos, reembolsos y liquidaciones. | Necesario para implementar módulos comerciales; los porcentajes propuestos no constituyen obligación aprobada. |
| Licencias docentes y consentimientos | Modelos contractuales, titularidad de material, tratamiento de grabaciones y procedimiento de retiro. | Condiciona RAG, videos y cursos comercializados; revisar jurídicamente antes de producir. |
| Objetivos de carga y disponibilidad | Validar con medidas y presupuesto las cifras del README. | Son objetivos de calidad / dimensionamiento, no restricciones tecnológicas automáticas. |
| Catálogo de exámenes escolares y de admisión | Definir qué fichas y convocatorias se publicarán primero y cómo se documentarán versiones, derechos y evidencia. | Evita atribuir carácter oficial a material referencial; permite ampliar sin rediseñar módulos. |

## Lo que no se impone aquí

- Monolito modular, Clean Architecture, tecnologías concretas y serverless **son opciones o decisiones arquitectónicas**, registrables y justificables en ADR, no condiciones preexistentes.
- Disponer de PWA **no implica** que todas las funciones operen sin conexión.
- La plataforma **no está restringida a un área o curso**: contempla Primaria, Secundaria y Preuniversitario con contenidos de diversas áreas.

## Trazabilidad principal

- RC-01 → RF-33, RF-34; AC-07.
- RC-03 y RC-04 → RF-01, RF-15, RF-16, RF-17.
- RC-05 → RF-26, RF-27; AC-06, AC-08.
- RC-06 y RC-07 → RF-03, RF-04, RF-18, RF-19; AC-04.
- RC-08 → AC-04.

## Restricciones legales por revisar antes del lanzamiento

- Evaluar la Ley N.º 29733 y el reglamento peruano vigente para datos personales de menores; **esto no crea un panel de padres/apoderados**.
- Verificar titularidad y licencias de imágenes, presentaciones, guías, **bancos de preguntas y temarios**, voces y grabaciones publicadas, así como derechos de estudiantes que participen en videoclases. Un examen de referencia no autoriza a afirmar afiliación o aval de una universidad.
- Revisar políticas del proveedor publicitario y prohibiciones sobre personalización para menores; considerar únicamente patrocinios contextuales y controlados.
- Validar tributación peruana, protección al consumidor, emisión de comprobantes, políticas de renovación, reembolso y reparto económico con asesoría competente.

## Trazabilidad adicional

- RC-10 y RC-15 → RF-39, RF-40; AC-04, AC-07 y AC-10.
- RC-11 y RC-12 → RF-35, RF-41, RF-42, RF-46; AC-04 y AC-11.
- RC-13 → RF-37, RF-45, RF-48; AC-04, AC-06.
- RC-14 → RF-12, RF-14, RF-21, RF-43.
- **RC-16 → RF-49, RF-51; HU-36, HU-40; AC-05, AC-11.**
- **RC-17 → RF-50, RF-52; HU-37, HU-39; AC-07, AC-11.**
