# Auditoría documental de Mentelyx — pendientes

**Actualizado:** 26/11/2026
**Estados:** Pendiente, Bloqueada por decisión, En curso, Completada. Cada fila incluye fuente, aceptación y responsable propuesto.

| ID | Prioridad | Tarea / fuente | Criterio de aceptación | Responsable sugerido | Estado |
|---|---|---|---|---|---|
| AUD-03-01 | Alta | Auditoría del análisis: actores, HU, RF, AC, RC, DA, ADR y EQ | Lectura íntegra; IDs y referencias comprobados; brechas trazadas sin inventar cobertura ni evidencia | Auditor documental/producto | Completada documentalmente; quedan políticas y cobertura parcial registradas en AUD-03-12/13 |
| AUD-03-02A | Alta | Decisión de alcance V1: instrucción maestra §§3, 13; interfaces §1.3; README; ADR-093 | Reflejar la decisión aprobada de V1 frente al producto completo sin retirar diseños futuros | Propietario de producto/arquitectura | Completada por ADR-093; ID anterior duplicaba AUD-03-02 de arquitectura |
| AUD-03-03 | Alta | Normalizar versiones: README, SDD §§1.1, 9–10 y 23; persistencia, API, interfaces, actores, HU y RF | Versiones efectivas acordadas y metadatos/índices armonizados sin cambiar contenido aprobado ni perder historial | Responsable documental | Pendiente |
| AUD-03-04 | Alta | Comparación de API/implementación: API §11, OpenAPI, controladores, DTO y pruebas relacionadas | Cada endpoint clasificado diseñado/implementado/probado/no disponible con enlaces y evidencia; corregir estado solo con confirmación de responsables | Responsable API/backend + auditor | Pendiente |
| AUD-03-05 | Alta | Revisión detallada de los tres diseños externos | Persistencia, API e interfaces contrastados con requisitos, arquitectura, ADR, backend/frontend y pruebas; contradicciones y ausencias registradas por sección | Auditor documental + propietarios de módulos | En curso — persistencia §§1–15 revisadas y corregidas puntualmente; falta cotejo completo entidad/esquema y siguen pendientes API e interfaces |
| AUD-03-06 | Alta | Arquitectura y módulos M1–M7: `docs/02-arquitectura-software/` y diseño interno | Límites, responsabilidades, casos de uso, entidades, contratos, eventos, dependencias y reglas cotejados con fuentes autorizadas | Arquitectura + responsables de módulo | Diseño interno M1–M7 revisado; arquitectura general, diagramas y suficiencia extremo a extremo siguen en curso |
| AUD-03-07 | Media | C4 niveles 1–4 y fuentes de diagramas | Diagramas inspeccionados visual y semánticamente; correspondencia con decisiones vigentes y código anotada; no redibujar salvo autorización/corrección acordada | Arquitectura/documentación | Pendiente |
| AUD-03-08 | Alta | Calidad y seguridad: AC/EQ, seguridad, recuperación, pruebas | Umbrales clasificados como aprobados/propuestos/medidos; seguridad, menores, privacidad, concurrencia, idempotencia, observabilidad, backups y CI/CD con evidencia/bloqueos | Calidad/seguridad/propietarios | Parcial — trazabilidad AC/EQ/RC/DA/ADR consolidada; faltan auditoría de seguridad y pruebas/mediciones |
| AUD-03-09 | Alta | Auditoría integral del SDD 2.1 y matriz EQ | Revisar las 25 secciones; trazar requisitos → ADR → arquitectura/diseño → implementación → pruebas; registrar huecos y decisiones pendientes sin afirmar producción | Responsable SDD | Pendiente |
| AUD-03-10 | Media | Revisar duplicados, referencias, renombres, ZIP y recursos históricos | Cada duplicación/referencia/cambio de ruta tiene fuente canónica y autorización; cero eliminaciones sin autorización; conservar histórico | Responsable documental/repositorio | Pendiente |
| AUD-03-11 | Fuera de alcance explícito | Prompt 3 de integración final | Solo iniciar con nueva autorización explícita y tras cerrar auditorías de contenido/bloqueos | Propietario | No iniciar en esta ejecución |
| AUD-03-12 | Media | Cobertura parcial HU-16/HU-51 y nueve RF sin HU directa, matriz de trazabilidad | Propietarios aclaran HU-16/HU-51 y deciden si RF-02/RF-30 requieren historias propias; las justificaciones individuales no se reemplazan por asociaciones forzadas | Producto y análisis | Nueve RF justificados semánticamente; decisiones HU-16/HU-51 y posible creación de historias siguen pendientes |
| AUD-03-13 | Alta | Costos contractuales de devoluciones audiovisuales; políticas HU-56/HU-62 | Producto/finanzas define elegibilidad, asignación de costos y tratamiento de fallos; pagos verifica respuesta y evidencia del proveedor antes de completar la operación | Producto, finanzas y pagos | Pendiente; no bloquea la revisión documental independiente |
| AUD-03-14 | Alta | Contrato de actor M1 y rutas de M3/M6 que la API limita a Estudiante | Contrato público provee tipo de cuenta; casos/endpoints aplican autorización de Estudiante y pruebas demuestran denegación para otras cuentas | Backend M1/M3/M6 y responsable API | Pendiente de corrección de implementación; no se modificó código |
| AUD-03-15 | Media | Una preparación activa en backend M3 frente a propuesta de varias preparaciones en API §12.2 | Producto decide el comportamiento; luego se alinean contrato API, persistencia, interfaz y pruebas sin presentar una propuesta como aprobada | Producto, M3, API y persistencia | Bloqueada por decisión |
| AUD-03-16 | Alta | Compensaciones con fallos silenciados en M2 y M6; H-AUD-012 | Cada fallo de compensación queda observable y conciliable mediante repetición idempotente o revisión; las pruebas cubren fallo principal y fallo de cleanup | Backend M2/M5/M6 | Pendiente de corrección de implementación; esta auditoría no modifica código |

## Revalidación de hallazgos originales Codex

Fuente normativa de IDs y aceptación: `C:\Users\Semental\Documents\ChatGPT\Arquitectura de software\auditoria-mentelyx\hallazgos.json`.

| ID | Estado | Pendiente / siguiente acción |
|---|---|---|
| F01 | Cerrado según criterio local; staging pendiente | Validar la cabecera de IP en la topología real y aprobar el umbral técnico provisional de 120 intentos/IP/minuto antes de exponer autenticación |
| F02 | Cerrado localmente; despliegue no verificado | Conservar pruebas en CI y verificar configuración de orígenes/cookies al desplegar staging antes de exponer públicamente |
| F03 | Cerrado localmente | No ejecutar migración remota; conservar la prueba de concurrencia y la restricción EXCLUDE en futuras revisiones del esquema |
| F04 | Parcial local; bloqueado por bundle OpenNext en Windows y verificación remota pendiente | Ejecutar el build y humo OpenNext desde un commit que incluya `0006` en CI Linux/entorno con symlink autorizado; realizar instalación limpia congelada y conservar logs. No elevar el permiso local ni alterar configuraciones del equipo para sortear EPERM. Mantener I-0 abierto |
| F05 | Cerrado documentalmente | Mantener versiones independientes; actualizar evidencia/fechas sin presentar pruebas locales como CI remota ni como aceptación de todos los EQ |
| F06 | Cerrado para I-0 + MVP vertical | Mantener explícitos los pendientes por alcance; ampliar la matriz solo al aprobar la siguiente entrega, incluyendo sus criterios, responsable y evidencia |
| F07 | Cerrado para las ubicaciones citadas | No extender la afirmación a lectura integral de libros; si se amplía la muestra, conservar ubicación exacta, aplicación/descarte razonado y validación pendiente |
| F08 | Aceptación comprobada en worktree; persistencia Git pendiente | El enlace abre y escaneo Markdown local dio 0/402 destinos rotos; la imagen nueva figura no rastreada y el nombre viejo está staged para eliminación. Preservar el cambio ajeno y confirmar su persistencia al guardar/publicar el trabajo correspondiente |
| F09 | Corrección documental completa; aceptación comercial bloqueada | Obtener del proveedor/propietario contrato aplicable, FX fechado y tratamiento tributario; confirmar por medio la aplicación del fijo y mínimo antes de declarar viabilidad o total final |

## Siguiente ejecución tras F01–F09

1. Antes de exposición pública, validar en staging la cabecera de IP de Cloudflare y el umbral F01; comprobar Origin, cookies Secure y CSRF de F02 bajo dominios/HTTPS reales.
2. Para declarar I-0 completo, obtener evidencia de reinstalación limpia/CI remota y build OpenNext con humo E2E; no confundir los gates locales con ejecución remota.
3. Antes de validar viabilidad comercial, confirmar contrato CulqiOnline, FX fechado, tratamiento tributario y aplicación por medio de pago del fijo y mínimo (F09).
4. Preservar el cambio de nombre de la imagen F08 en el trabajo de repositorio correspondiente; el destino nuevo está en el worktree, aún no rastreado.
5. Mantener la auditoría documental general AUD-03 suspendida y el Prompt 3 sin ejecutar; estos registros no autorizan despliegues, migraciones remotas ni cambios de producto.
