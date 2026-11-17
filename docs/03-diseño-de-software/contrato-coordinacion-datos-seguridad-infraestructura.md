# Contrato de coordinación — datos, seguridad e infraestructura

> **Versión:** 1.0 — 17/11/2026 · **Responsable de esta revisión:** Codex. Complementa el [registro especializado de Claude](diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md), conservado sin cambios. No es el SDD consolidado ni una aprobación de todos los modelos/prototipos.
>
> **Estado de sincronización (17/11/2026, Claude Code):** CO-01 a CO-08 y CO-10 aplicados en los archivos de diseño especializado, API, interfaces y diseño interno ([registro especializado, sección 8.2](diseño-especializado/07-registro-de-decisiones-y-solicitudes-de-cambio.md)). CO-09 sigue pendiente. Las resoluciones de este contrato no se modificaron.

## 1. Autoridad y reglas de integración

Este documento resuelve las solicitudes bajo responsabilidad de Codex. [Persistencia v2.0](diseño-externo/01-diseño-de-persistencia-y-datos.md) fija estructura/invariantes; [seguridad](../02-arquitectura-software/seguridad-y-autenticacion.md) fija control de acceso/privacidad; [infraestructura](../02-arquitectura-software/infraestructura-escalabilidad-y-recuperacion.md) fija despliegue, ejecución y recuperación. Las decisiones arquitectónicas formales quedan en [ADR](../01-analisis-de-sistema/07-decisiones-arquitectonicas.md). API/UI v2.0 y siete documentos especializados permanecen como especificación de Claude; las discrepancias enumeradas aquí requieren sincronización explícita, no tienen aprobación implícita por conservar su texto.

**Aceptada** = integrada como diseño; **modificada** = integrada con el ajuste indicado; **diferida** = no aplicada por faltar evidencia o competencia decisoria. No hay aprobación de implementación, presupuesto ni tratamiento de datos reales.

## 2. Resolución SC-01 a SC-17

| ID | Resolución | Justificación, destino y aceptación futura |
|---|---|---|
| SC-01 | **Modificada** | Persistencia sección 7.6: todos los campos ACL/texto/versiones, GIN y HNSW; UNIQUE por index_id+chunk_index para permitir generaciones/modelos coexistentes. Se rechaza conservar UNIQUE v1 porque impide reindexación paralela. Prueba: dos generaciones aisladas y revocación sin fuga |
| SC-02 | **Modificada** | sección 7.6: id de índice, generación/chunker en unicidad y puntero activo. PK solo documento/versión/modelo no representa nueva fragmentación del mismo modelo. Activación atómica y reparación de generación incompleta |
| SC-03 | **Modificada** | sección 7.6: campos pedidos más request_hash, día, versión de ruta, intento/proveedor y reservas globales. Lock por usuario no serializa presupuesto de todos los usuarios. Probar cuota/presupuesto concurrentes y costo incierto |
| SC-04 | **Modificada** | sección 8: conversación M6, TTL, segmentos y tombstone; no suponer borrado inmediato por TTL. Retenciones 30/14 días conservadas como propuesta legal y bloqueo de historial real hasta validarlas |
| SC-05 | **Aceptada** | sección 8: escenas/documentos versionados y plantillas M2. Licencias, esquemas de payload y tamaño se validan; cada versión publicada inmutable. Sin rediseñar motor visual |
| SC-06 | **Modificada** | secciones 7.2 y 10: render_jobs, versión/asset/estado e idempotencia; hash incluye formato, audiencia y política de exclusión de notas/soluciones, ámbito propietario/proyecto. Se rechaza reutilización global por hash incompleto |
| SC-07 | **Aceptada** | sección 7.5: STUDIO_AI_REFUND, referencia al débito original, delta inverso y refund:{operationKey} único. Saldo+ledger atómicos; nunca reintegrar sin débito |
| SC-08 | **Aceptada** | secciones 6.3 y 7.5: ai_policy JSONB en versión comercial inmutable, validada y pequeña. Mongo añadiría coordinación sin ventaja para esta consulta SQL; política no contiene consumo mutable |
| SC-09 | **Modificada** | sección 7.4: tres request_type, estados/decisiones/documentos separados, estudiante tutor sin perfil Docente obligatorio. 90 días no se convierte en retención legal aprobada. M1 recibe proyección y revalida decisión M4 |
| SC-10 | **Aceptada** | sección 7.6: tarifas por proveedor/modelo/unidad/cantidad/vigencia, URL/fecha; sin solapamientos. El costo conserva intento y tarifa histórica; no se aprueban cuotas comerciales |
| SC-11 | **Modificada** | sección 7.6: ai_budgets y reservas por operación/ámbito, bloqueo global/proveedor atómico. Límite blando y duro separados; al duro no continúan planes pagos. Excesos reales se registran como déficit y bloquean admisión |
| SC-12 | **Modificada** | sección 7.6: reporte vinculado a operación, comentario redactado/acotado, expires_at. 12 meses es propuesta pendiente; no permiso para conservar PII/contexto original |
| SC-13 | **Modificada** | sección 9.1: TTL/invalidez/caída explícitos; clave embedding por modelo/dimensión/política/usuario y HMAC de consulta. No caché de D2/menores por defecto; SHA simple compartido expone correlación entre usuarios |
| SC-14 | **Aceptada** | sección 9.2: prefijos y bucket D3 separado con credenciales M4. Retenciones, cuarentena, autorización y purga por dueño; prefijo solo no es aislamiento de permisos |
| SC-15 | **Diferida** | No cambiar vector(1536) por 1024 sin BP-07. Se especifica migración por índice paralelo si Recall@8 cumple y privacidad/costo lo justifican. Falta resultado, no se rechaza bge-m3 por tecnología |
| SC-16 | **Modificada** | secciones 7.2 y 10: studio_ai_jobs más entrada privada y subestados de pago/incertidumbre; UNIQUE quote_id/operation_key y saga reparable. Un 202 solo tras trabajo durable, no tras envío de cola sin outbox |
| SC-17 | **Modificada** | sección 7.5: quote TTL 10 min, actor/proyecto/hash/versiones/créditos; consumo bloqueado con débito M5. Se rechaza usar nueva clave para gastar cotización ya consumida; prompt permanece privado en M2 |

Balance: **5 aceptadas, 11 modificadas y 1 diferida**. Se rechazan específicamente supuestos inseguros dentro de las modificaciones; ninguna solicitud se descarta entera sin motivo. La selección vectorial queda cerrada para el diseño actual; la alternativa SC-15 conserva su condición de benchmark.

## 3. Resolución SEG-01–SEG-04 e INF-01–INF-06

| ID | Resolución | Razón / evidencia / condición |
|---|---|---|
| SEG-01 | Aceptada | Seguridad sección 5: STRIDE más inyección, exfiltración, costo, ámbitos y menores; prompt delimitado no es garantía de seguridad |
| SEG-02 | Modificada | Seguridad sección 5: gateway privado sin payload/caché; metadatos de billing pueden persistir; prueba de todas las capas, no solo una cabecera. Claves solo backend |
| SEG-03 | Modificada | Seguridad sección 5: redacción no es anonimización; corpus PII sintético, escalamiento D1→D2 y bloqueo D3. No afirmar 100 % detección |
| SEG-04 | Modificada | Seguridad sección 6/persistencia sección 11: revocación de acceso inmediata y eliminación física verificable diferenciadas, backups/tombstones/offline/URLs firmadas incluidos |
| INF-01 | Modificada | Infra sección 4: colas solicitadas y DLQ de mantenimiento; clave por lote/cursor; purga inmediata a petición más Cron. DLQ compartida de resultados conserva sourceQueue |
| INF-02 | Aceptada condicionada | Infra sección 4: SymPy Python Worker fase 2, binding privado; benchmark cold start/CPU/memoria antes de activación. No se despliega ahora |
| INF-03 | Aceptada condicionada | Infra sección 4: Browser Rendering seleccionado para PDF, medir horas y límites, bloquear egress. No se habilita cuenta ni se contrata |
| INF-04 | Aceptada condicionada | Infra sección 4: Cloud Run Jobs como respaldo PptxGenJS, mismo contrato idempotente, sin nueva lógica de negocio. Solo si falla prueba Workers |
| INF-05 | Modificada | Infra sección 5: acceso pago puede ser Workers Paid o créditos AI Gateway según ficha oficial; diseño elige Paid, sin presupuesto ni compra. Nuevo DeepSeek verificado |
| INF-06 | Modificada | Infra sección 1: soporte oficial pgvector ≥0.8.0 disponible para PG17; comprobar instalación con SQL en entorno futuro. Consulta documental no acredita instancia |

## 4. Contrato operativo para Claude y construcción posterior

| Área | Obligación compartida |
|---|---|
| Cuentas/permisos | Solo Estudiante/Docente públicos; M1 autentica, cada módulo autoriza objeto/operación. Edad/rol no vienen de prompt. Verificación documental, credencial académica, habilitación y pago son estados independientes |
| IDs/propiedad | UUID estable, versión monotónica, hash de contenido; referencias entre módulos por contrato, FK solo locales. Ningún acceso directo a tablas privadas de otro módulo |
| Publicación | SQL PENDING → Mongo/R2 comprobados → SQL PUBLISHED+outbox; no publicar por un status Mongo. Versiones publicadas inmutables |
| RAG | M2 autoriza conjunto/versión/licencia; M6 índice derivado por generación/modelo, revalidación antes de modelo/entrega. Índice viejo no concede permiso. Modelo embeddings externo prohibido también para **ingesta** privada no elegible, no solo pregunta |
| Cuota Tutor | M5 dueño de política/derecho, M6 reserva y mide; presupuesto global/proveedor y cuota serializados. Costo de intento incierto no desaparece al fallar SSE |
| Studio | M5 quote/debito/reintegro; M2 job/input/borrador; M6 generación. Toda compensación se repite con misma clave y nunca duplica abono |
| Archivos | R2 privado, registros SQL por dueño, D3 separado. Hash no autoriza descarga. Audiencia forma parte de exportación y notas ocultas se eliminan físicamente del archivo del estudiante |
| Mensajería | outbox por productor, inbox por consumidor, schemaVersion/aggregateVersion, payload con referencias; ACK tras efecto durable |
| Recuperación | GET no vuelve a inferir; resultado expirado devuelve estado sin contenido y no cobra de nuevo; reintento voluntario necesita nueva operación/política. Backup restaurado reaplica tombstones |
| Fuentes/modelos | Configuración de rutas versionada, modelo retirado desactivado. El nuevo DeepSeek se selecciona según anuncio oficial, calidad aún no medida |

## 5. Ajustes de coordinación que no alteran automáticamente los archivos de Claude

Estas resoluciones son normativas para datos/seguridad/infraestructura. El responsable de los documentos especializados deberá sincronizar los textos antes de construir; no se duplican ni reescriben aquí sus algoritmos.

| ID | Referencia original | Ajuste resuelto / pendiente de sincronización |
|---|---|---|
| CO-01 | RAG secciones 9 y 13.3 | Usar index_id/generation/puntero activo e índices por espacio vectorial según persistencia sección 7.6; el UNIQUE anterior no permite coexistencia |
| CO-02 | Materiales secciones 6.2 y 7, API secciones 3.1 y 4.4 | Hash por audiencia/formato/ámbito; eliminar `NUNCA`/notas de entrega ESTUDIANTE en OOXML, no ocultarlas en notas del orador. Mantener notas solo en exportación DOCENTE autorizada |
| CO-03 | Orquestador secciones 10.3 y 10.5 | Admisión atómica incluye presupuesto global y proveedor e intentos inciertos; tope duro bloquea todos los nuevos consumos. SQL ilustrativo original no basta para esa invariancia |
| CO-04 | Orquestador sección 13.5 / API sección 5.3 | Desacoplar vida de ejecución y SSE mediante outbox/cola/lease y relay; desconexión no cancela, waitUntil no promete completar. Job incierto consulta estado, no reinicia proveedor |
| CO-05 | RAG secciones 10.1 y 10.4 / ADR-058 | Mientras producto no apruebe GENERAL, si falla autorización o no hay contexto, SIN_CONTEXTO/indisponibilidad; no fallback silencioso a GENERAL |
| CO-06 | Orquestador sección 10.7 / UI-05 / interfaces sección 11 | DELETE revoca acceso, purga física asíncrona verificable; offline privado opt-in y limitado por licencia. No garantizar borrado instantáneo de backups/dispositivo desconectado |
| CO-07 | Orquestador secciones 5.2, 5.11 y 18; registro PEND-01 | Reemplazo seleccionado: DeepSeek V4.1 Flash vía Workers AI, razonamiento high para profundo, con benchmark gate. No activar Pro-0813 tras retiro |
| CO-08 | Diseño interno secciones 8.1.2, 8.5.5 y 10.1 | API v2.0 ya define DTO/errores/idempotencia; su implementación sigue pendiente. Próxima sincronización interna referenciar API y este contrato, sin presentar código ilustrativo como construido |
| CO-09 | Principios de diseño, puerto `CredentialVerificationPort`; gráficos M6 y pies M2/M7 | Normalización editorial anterior aún requiere mantenimiento contextual. Fuera del cierre de datos/infra; no cambiar identificadores/diagramas de Claude automáticamente |
| CO-10 | Orquestador secciones 4.2 y 13.1 | ZDR no basta para uso legal con menores; cualquier retry antes del primer token debe considerar aceptación/facturación incierta. Sin evidencia de no ejecución, conciliar antes de retry/fallback |

## 6. Bloqueantes y límites del cierre

- **Producto/legal:** ADR-058 GENERAL, retenciones ADR-069/SC-09/12, protección de menores, transferencias/DPA, permisos de entrenamiento de proveedores, protocolo PEND-03. No se certifica cumplimiento ni se activa tratamiento real.
- **Evidencia técnica:** PEND-05 y PR-INF-01–05, BP-01–07, revocación, concurrencia, eliminación y restauración. Son ensayos no ejecutables con mera documentación; no equivalen a diseño sin resolver.
- **Comercial/operación:** calibrar UTI/cuotas, límite blando/duro y costos, elegir región/tier con backups, pasarela/correo y contratos. No se modificaron importes comerciales ni presupuesto.
- **Sincronización de propiedad:** CO-01–CO-10 quedan documentados para los archivos de sus responsables. No bloquean registrar las decisiones de Codex; sí deben incorporarse antes de implementar las rutas afectadas. PEND-01 ya no bloquea selección de modelo, pero BP-01 bloquea activación de la ruta profunda.

El [registro de avance y verificaciones](../avance-cierre-arquitectonico-sprint-02.md) permite reanudar por tarea sin releer el repositorio. Siguiente tarea documental: aplicar exclusivamente los ajustes CO a las especificaciones de Claude con revisión de su responsable; después, y solo con tarea explícita, prototipo de compatibilidad con datos sintéticos. No iniciar SDD consolidado en esta entrega.
