# 05. Restricciones — Mentelyx

> **Versión:** 1.6 (sincronización con actores v1.5) — revisión integral del análisis de Mentelyx (20 de octubre de 2026).  **Estado:** arquitectura de referencia definida; importes comerciales, cuotas y contratos sujetos a validación. No implica software ya desarrollado ni servicios contratados.


## 1. Definición

Una **restricción (RC)** delimita decisiones admisibles. Los precios y cuotas propuestos son **supuestos a validar** y se registran como reglas de configuración, no como contratos ya publicados. `RC-09` permanece **reservado** por trazabilidad histórica.

## 2. Restricciones del catálogo original RC-01 a RC-27

| ID | Categoría | Restricción | Efecto |
|---|---|---|---|
| RC-01 | Producto / canal | Aplicación web instalable como PWA | Mentelyx será una web responsive, mobile-first e instalable como PWA en navegadores compatibles. La primera versión no contempla una app móvil nativa separada. |
| RC-02 | Académica / gestión | Control de versiones | Documentación y código se mantendrán con Git y repositorio GitHub para seguimiento de cambios y evidencias. |
| RC-03 | Negocio | Acceso independiente | El registro general no exigirá pertenecer a una institución ni un correo institucional. |
| RC-04 | Negocio | Convenios sin acceso institucional | Los convenios institucionales son **POSTERIORES al lanzamiento**; cuando existan no crearán cuentas/paneles institucionales ni concederán acceso a datos académicos privados. |
| RC-05 | Integración | Pagos por proveedor externo | Cuando se habilite monetización, el procesamiento de pagos de suscripciones y tutorías se delegará a una pasarela externa; Mentelyx valida y registra sus resultados. |
| RC-06 | Operación | Administración inicial | El propietario podrá operar como superadministrador; una posible delegación futura no constituye un actor principal adicional en el MVP. |
| RC-07 | Negocio / seguridad | Verificación docente | La cuenta Docente (modalidades libre y por nivel) puede crear borradores desde el registro; el Estudiante universitario adulto también puede solicitar permiso adicional para tutorías sin cambiar de tipo. Impartir tutorías remuneradas requiere habilitación; mostrar títulos verificables exige acreditación separada. La atención a menores requiere controles adicionales. |
| RC-08 | Seguridad / despliegue | HTTPS | Los accesos públicos y las comunicaciones sensibles deberán realizarse sobre HTTPS correctamente configurado. |
| RC-09 | Reservado | No se reutiliza para preservar trazabilidad histórica. | — |
| RC-10 | Publicidad / experiencia | Ubicaciones excluidas | Se prohíben banners en evaluaciones, videoclases, editor de materiales, reproducción de lecciones de pago y liquidaciones. La publicidad restante será claramente identificada, contextual y aprobada. |
| RC-11 | Derechos de autor / contenidos | Titularidad y licencias por finalidad | El uso de herramientas de Mentelyx (pizarra, editor, aula virtual) no transfiere automáticamente la autoría del contenido creado por un docente. Antes de publicar, comercializar, indexar en RAG o entrenar modelos se deben acreditar derechos suficientes para cada finalidad y versión; los materiales ajenos requieren autorización de sus titulares cuando corresponda. |
| RC-12 | IA / propiedad intelectual | Entrenamiento propio solo con derechos habilitantes | Mentelyx podrá desarrollar o ajustar modelos educativos propios con materiales que haya creado y sobre los que tenga derechos suficientes, así como con aportes docentes expresamente autorizados para entrenamiento o *fine-tuning*. Publicar una clase, subir un documento o utilizar la pizarra no equivale a autorizar entrenamiento. Se prohíbe incorporar aportes docentes a entrenamiento por defecto. |
| RC-13 | Privacidad audiovisual | Grabación opcional | Las clases en vivo no se grabarán automáticamente; su activación exige avisos, permisos, alcance de acceso y reglas de conservación y retirada. |
| RC-14 | Comercial | Tutorías independientes de planes | La compra de Plus o Pro no incluye automáticamente tutorías o clases individuales pagadas; los beneficios excepcionales deben configurarse expresamente. |
| RC-15 | Negocio / datos | Prohibición de segmentación académica | No se utilizarán notas, dificultades, diagnósticos, conversaciones privadas o perfil individual de aprendizaje para orientar publicidad. En menores, respetar normativa y políticas del proveedor; no implementar segmentación conductual. |
| RC-16 | Editorial / trazabilidad | Verificabilidad de fichas de examen | Cada ficha y temario de preparación debe conservar fuente, fecha/versión, tipo de evaluación y estado referencial o verificado. Sin evidencia suficiente, no se publicará como ficha oficial, ni se sugerirá aval institucional. |
| RC-17 | Comunicación responsable | Sin garantía de resultados | Los indicadores, simulacros y planes de preparación no garantizan nota, aprobación o admisión. La plataforma identificará claramente estimaciones e información de referencia. |
| RC-18 | Privacidad / menores | Exclusión de menores del entrenamiento de IA | Por política de Mentelyx, no se incluirán conversaciones, respuestas individuales, voz, imagen, grabaciones ni otros datos personales o aportes identificables de estudiantes menores de 18 años en conjuntos de entrenamiento o *fine-tuning*, incluso si cursan Preuniversitario. Esta exclusión no impide el tratamiento necesario y lícito para proporcionar servicios educativos y personalización. |
| RC-19 | Privacidad / adultos | Participación opcional en mejora de modelos | Los datos o aportes de estudiantes de 18 años o más solo podrán destinarse a entrenamiento o mejora de modelos cuando exista una base jurídica válida y se obtenga, además, una autorización voluntaria, expresa, específica, informada y separada del uso ordinario de la plataforma, como política de Mentelyx. Rechazarla no impedirá acceder a las funciones educativas normales. Se registrarán alcance, finalidad, proveedor, vigencia y mecanismos de ejercicio de derechos. |
| RC-20 | Registro | Tres opciones principales públicas: Estudiante, Creador educativo y Docente. Únicamente Estudiante admite menores bajo controles aplicables; Creador y Docente requieren **18+**. Docente elige modalidad libre/independiente o por nivel académico. | Tipo principal en PostgreSQL y permisos separados de insignias o monetización. |
| RC-21 | Negocio | Creador y Docente pueden usar las herramientas manuales disponibles de Studio desde el alta; Estudiante conserva su tipo aun si sube materiales o consigue habilitación de tutor universitario adulto. | No bloquear edición por acreditación; separar aprobación de contenido y servicios comerciales. |
| RC-22 | Negocio | Convenios con instituciones se **difieren**; no se desarrollan en el MVP. | RF-15 a RF-17 y HU-09/HU-22 se conservan para trazabilidad como `POSTERIOR`. |
| RC-23 | Tecnología / entorno | **PostgreSQL local durante el desarrollo**. Hosting administrado se decide antes del despliegue, sin acoplar el dominio a Neon. | En desarrollo se utiliza **PostgreSQL local** sin contrato Neon. En producción el proveedor SQL elegido es **Neon**, sujeto a validación de disponibilidad, región y migraciones reproducibles. |
| RC-24 | Despliegue | Arquitectura **parcialmente híbrida**: Cloudflare para frontend/API y proveedores externos de datos, video e IA al producir; los proveedores no están todos contratados. | Despliegue **parcialmente híbrido** Cloudflare Workers/Pages y proveedores especializados externos; no se exige VPS ni balanceador dedicado sin redundancia real. |
| RC-25 | Continuidad | Disponibilidad y recuperación se diseñan, miden y prueban desde el inicio; no prometer SLA de extremo a extremo basado en planes gratuitos. | Salud, métricas, alertas, DLQ, idempotencia, backups y ejercicios de restauración. |
| RC-26 | Seguridad | Ninguna credencial de base de datos, IA, video o pagos podrá residir en el frontend ni en repositorios públicos. | Secretos del runtime, autorización por recurso, cookies seguras, auditoría, MFA administrador. |
| RC-27 | Comercial | Herramientas manuales de Mentelyx Studio gratuitas para adultos elegibles; IA asistida con cuotas/créditos, reglas pendientes de aprobación. | Studio Free ofrece creación manual básica; IA avanzada y límites de Plus/Pro son por producto y cuotas medidas, no generaciones ilimitadas. |

## 3. Restricciones añadidas RC-28 a RC-37

| ID | Categoría | Restricción |
|---|---|---|
| RC-28 | Negocio: Suscripciones separadas | Plus/Pro: IA educativa; Aulas Live: cupos de clases; Studio: autoría y créditos IA. No son prestaciones ilimitadas ni convertibles. |
| RC-29 | Comercial: Precios no definitivos | Plus S/29,90, Pro S/59,90, Live S/99,90, Studio Plus S/29,90, Studio Pro S/69,90 son precios candidatos; publicar solo tras validar costos/impuestos y contratos. |
| RC-30 | Comercial: Cuotas Live | Aulas Live propone 4 créditos/mes, reglas 1/2/3 créditos por tipo de aula y caducidad/reembolso transparentes. |
| RC-31 | Comercial: Cuotas Studio | 300/900 créditos IA de Studio Plus/Pro son hipótesis calibrables; la edición manual no consume créditos y los límites deben aplicarse en backend. |
| RC-32 | Seguridad/operación: Aulas y tutores | Diseño inicial: 35 estudiantes más docente, grupos pequeños 2–5 y 1 a 1; cualquier modalidad de pago exige tutor autorizado; mayores de edad con cuenta Estudiante solo mediante capacidad adicional explícita. |
| RC-33 | Rentabilidad: Viabilidad de clases | Precio S/8 de entrada solo cuando viable; ninguna venta directa o clase gratuita debe publicarse con pérdida prevista sin presupuesto/patrocinio autorizado. |
| RC-34 | Integridad: Separación de saldos | Creditos Live, créditos Studio, puntos didácticos y pagos tienen ledgers independientes; Redis no almacena la única copia. |
| RC-35 | Comercial: Remuneración contractual | Tarifa propuesta de S/8 por crédito Live válido requiere aceptación; liquidación por clase prestada y reglas de ausencia/cancelación. Venta directa usa otra regla versionada. |
| RC-36 | Seguridad: Registro y privacidad audiovisual | Grabación desactivada por defecto; opt-in, avisos, autorizaciones pertinentes con menores; costo, almacenamiento y acceso acotados. |
| RC-37 | Técnica: Infraestructura objetivo | Cloudflare Workers/Hono, PostgreSQL local→Neon, MongoDB local→Atlas, Redis, R2, Queues y video SFU gestionado; confirmar conectividad, precios y capacidades sin prometer HA de planes Free. |

## 4. Condiciones normativas y contractuales no resueltas

- **Perú:** validar comprobantes/IGV aplicables, régimen tributario, tratamiento de pagos a terceros, protección de datos personales y menores, términos de planes, desistimientos/reembolsos y facturación de suscripciones. **No se declara cumplimiento legal a priori**.
- **Pasarela:** Culqi/Mercado Pago son candidatos, no seleccionados. Una tarifa mínima de S/3,50 para operaciones pequeñas **puede afectar la rentabilidad**; verificar contrato, tarjetas, montos y moneda. Evitar depender de pagos grupales entre estudiantes de regiones diferentes.
- **Derechos educativos:** licencias para publicación, comercialización, RAG y entrenamiento de modelos **separadas**. Los aportes identificables de menores nunca entrenan IA por política de producto; mayores de edad requieren autorización opcional explícita.
- **Publicidad:** no exponer notas, diagnósticos ni datos de menores a anunciantes ni interrumpir clases o exámenes; un anuncio no es financiamiento garantizado.
- **Operación:** las pruebas y cuotas gratuitas de los proveedores no constituyen alta disponibilidad ni SLA contractual. RTO/RPO y recuperación deben documentarse y ensayarse.

## 5. Trazabilidad de restricciones nuevas

| Restricciones | Drivers/ADR esperados |
|---|---|
| RC-28 a RC-31 | DA-26, DA-28, ADR-047 a ADR-050 |
| RC-32, RC-35, RC-36 | DA-27, ADR-045, ADR-046, ADR-051 |
| RC-33, RC-34 | DA-26, DA-29, ADR-048, ADR-049, ADR-052 |
| RC-37 | DA-23 a DA-24, ADR-031, ADR-032, ADR-041–ADR-043 |
