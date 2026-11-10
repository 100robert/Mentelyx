# Auditoría y normalización terminológica de Mentelyx

**Fecha:** 10/11/2026. **Alcance:** repositorio abierto, especialmente `docs/`, sus fuentes gráficas y el README.

## 1. Base documental y preservación

Se trabajó sobre el árbol local recibido, incluidos sus cambios previos y archivos sin seguimiento. La referencia funcional vigente es el análisis v2.0 del 09/11/2026, su revisión terminológica del 10/11/2026 y ADR-034: Estudiante y Docente como cuentas públicas; Superadministrador interno; Studio como capacidad. Las vistas anteriores se armonizaron con esas reglas sin restaurar versiones desde Git.

Se preservaron los siete módulos oficiales, monolito modular, Clean Architecture, prioridades, precios, condiciones comerciales y tecnologías seleccionadas o candidatas. No se modificaron ejecutables, binarios, respaldos ni el índice de Git. No se hicieron commits ni pushes. Las eliminaciones locales previas permanecen ajenas a esta intervención.

## 2. Resultado y método

Se corrigieron **48 apariciones en 18 archivos**: **30 en Markdown y 18 en fuentes gráficas**, contando separadamente las representaciones Draw.io/SVG y las apariciones dentro de nombres compuestos. Las correcciones contextuales y de referencias afectaron **28 archivos existentes**; este informe es el único archivo nuevo.

Se amplió el [glosario existente](../README.md#glosario-breve), sin duplicarlo. Se distinguen cuentas, autenticación, autorización, verificación documental del solicitante, validación de credenciales académicas, habilitación docente, derechos de uso y pagos confirmados.

Inventario inicial: **23 Markdown, 36 Draw.io, 26 SVG, 4 respaldos `.bkp`, 35 PNG, un ZIP y `.gitignore`**. Se buscaron términos en todo el texto editable y se analizaron las fuentes XML. Se inspeccionaron los cinco archivos de texto del ZIP sin instalarlo. Los PNG se inventariaron por ruta y hash; no se realizó OCR ni se certificó su texto visual. No se encontraron PDF ni presentaciones.

Categorías utilizadas: **A** cuentas y perfiles; **B** autenticación y sesiones; **C** autorización y permisos; **D** verificación documental del solicitante; **E** validación de credenciales académicas; **F** habilitación docente; **G** referencias históricas o externas conservadas. Una frase puede expresar varias responsabilidades. Dos apariciones adicionales describían claves de órdenes y movimientos: se clasificaron como **identificadores transaccionales**, sin forzarlas a un proceso de cuentas o verificación.

## 3. Ejemplos y sincronización

| Antes: fragmento literal | Después | Motivo |
|---|---|---|
| «tres cuentas públicas» | «dos cuentas públicas» | Aplicar ADR-034 y los actores vigentes. |
| «Autorización en dos niveles» | «Autenticación (AuthN) y autorización (AuthZ) diferenciadas» | Separar sesión autenticada y permisos por operación. |
| «no sustituyen la verificación de credenciales» | «no sustituyen la validación de credenciales académicas» | RF-59 describe títulos, no contraseñas. |
| «Docente verificado» | «Docente» | El actor no presupone acreditación ni habilitación. |
| «Registro de cuenta» en el pie de secuencia M1 | «Gestión de permisos» | La fuente representa `GestionarPermisosUseCase`. |

En HU-20, RF-18 y RF-58 se precisó la verificación documental del solicitante. Las descripciones genéricas de M1 se sustituyeron por gestión de cuentas, autenticación, sesiones y control de acceso. Los ejemplos anteriores no reproducen los términos retirados para mantener normalizada la redacción editable del informe.

Los contratos propuestos se sincronizaron como `CuentaRepository`, `PostgresCuentaRepository`, `cuentas.repository.ts`, `postgres-cuentas.repository.ts` y `SessionPort`, según su responsabilidad. No se encontraron contratos implementados que requirieran una migración por esos cambios.

Se corrigieron tres enlaces a imágenes inexistentes: clases y secuencia M1 y componentes C4 nivel 3. Se actualizaron las referencias a fuentes existentes de C4 niveles 1–3 y el nombre del siguiente documento desde C4 nivel 2. Las vistas de M1 y C4 nivel 2 enlazan SVG actualizados. La comparación estructural de Draw.io confirmó que solo cambiaron etiquetas: se conservaron geometrías, relaciones e identificadores XML.

## 4. Validación final

Comando global que cubre las cuatro formas solicitadas, también dentro de nombres compuestos y sin distinción de mayúsculas:

```powershell
rg -n -i --hidden -g '!.git/**' 'identi(?:dad(?:es)?|ty|ties)' .
```

- **Texto editable: cero coincidencias.** El código de salida 1 de `rg` significa ausencia de coincidencias. No se excluyeron fuentes gráficas ni respaldos; se excluyó el historial interno de Git.
- **Contenido comprimido:** permanece una aparición en `.agents/skills/mentelyx-build/SKILL.md`, dentro de `mentelyx-skills.zip`. No es una fuente activa instalada; el paquete requiere regeneración desde su origen.
- **XML:** los 36 Draw.io, 26 SVG y 4 respaldos se analizaron correctamente. No hay páginas Draw.io comprimidas adicionales que eludan la búsqueda textual.
- **Trazabilidad:** se conservaron los 338 identificadores distintos y su frecuencia por documento existente: HU 70, RF 99, AC 11, RC 37, DA 31, ADR 55, EQ 31 y ACT 4. ACT-02 y ADR-011 mantienen su reserva.
- **Preservación:** los hashes de los 35 PNG, del ZIP y de los cuatro respaldos son iguales al estado recibido. Ningún archivo existente fue eliminado.
- **Consistencia:** cuentas alineadas entre actores, HU/RF, restricciones, drivers, ADR, persistencia y registro REST/UI. AuthN/AuthZ se distinguen en middleware, casos de uso y contratos M1. Documentación personal, títulos, habilitación, derechos comerciales y pago confirmado mantienen resultados separados.
- **Límite de la validación C4/UML:** se sincronizaron las etiquetas afectadas; no se certifica coherencia completa de imágenes ausentes ni de contratos pendientes de decisión.
- **Formato:** `git diff --check` señala nueve espacios finales preexistentes: ocho saltos de línea Markdown y un espacio en el pie M6-C. Se contrastaron con la copia inicial; no se introdujeron nuevos espacios finales.
- No se ejecutaron pruebas de aplicación: el árbol inspeccionado contiene diseño documental, no una implementación ejecutable.

## 5. Pendientes y excepciones

### Contratos y referencias

1. La ruta `/api/v1/docentes/acreditaciones` se asocia a `SolicitarHabilitacionDocenteUseCase`, aunque designan procesos distintos. Se aclararon sus responsabilidades y se señaló la necesidad de definir contratos diferenciados antes de implementarlos; no se inventaron rutas ni requisitos obligatorios.
2. `CredentialVerificationPort` y `CredentialVerificationAdapter` no precisan qué evidencia del expediente verifican. Su contrato debe concretarse con M4 y no representa validación de contraseñas ni una obligación de títulos para docentes independientes. Se conserva el nombre pendiente de esa decisión. `UserRepository` en SOLID y `CuentaRepository` en las vistas detalladas son nombres propuestos, no repositorios implementados.
3. Persisten diferencias previas entre secuencias y catálogo REST: M1 usa `PATCH` en su secuencia y `POST` en el catálogo de permisos; M6 usa `/api/v1/tutor/consultas` en la fuente gráfica y `/api/v1/tutor-ia/consultas` en el texto. La secuencia M2 representa búsqueda, pero su pie describe publicación; M7 representa selección de anuncios, pero su pie describe validación de campaña. Resolverlas requiere revisar contratos y flujos, más allá de las etiquetas terminológicas.
4. C4 nivel 4 referencia tres imágenes y tres fuentes `img/fuentes/nivel4-*.drawio` ausentes para el flujo conjunto M3/M6. No se sustituyeron por diagramas de otro flujo solo por compartir módulo. Tampoco existe la referencia textual `14-redis-cache-y-resiliencia.md`.
5. Las menciones al antiguo tipo de cuenta en C4 niveles 1 y 3 explican su retirada; no lo ofrecen como actor vigente. Los cuatro `.bkp` conservan versiones anteriores y no son autoridad del modelo actual. No se encontraron citas textuales de terceros ni nombres oficiales externos que obliguen a mantener los términos retirados en las fuentes activas.

### Exportaciones pendientes

| Archivo o grupo | Acción pendiente |
|---|---|
| `docs/img/m1-interno.png`, `m1-clases.png`, `m1-secuencia.png` | Regenerar desde las fuentes homónimas Draw.io/SVG ya corregidas. El diseño interno enlaza ahora los SVG. |
| `docs/img/principios-solid-m1.png` | Regenerar desde `docs/img/fuente_drawio/principios-solid-m1.drawio` para mostrar `SessionPort`. |
| `docs/img/nivel2-contenedores.png` | Regenerar desde la fuente homónima. C4 nivel 2 enlaza ahora el SVG actualizado. |
| `docs/img/mentelyx-componentes-arquitectonicos.png` | Regenerar desde la fuente homónima para reflejar cuentas, sesiones, permisos y estados comunicados por M4. |
| `docs/img/fuentes-svg/estilo-arquitectonico.svg` | Texto y XML corregidos; conserva PNG de respaldo incrustados. Regenerar la exportación completa para actualizar esos respaldos. |
| Fuentes alternativas `enfoque-arquitectonico.drawio` y `estilo-arquitectonico.drawio` | Etiquetas corregidas. Confirmar la correspondencia de versiones antes de usarlas para sustituir exportaciones de las vistas actuales con prefijo `mentelyx-`. |
| `mentelyx-skills.zip` | Actualizar el Markdown del paquete en su proyecto fuente y volver a empaquetar. Esa fuente independiente no existe en el árbol abierto. |

## 6. Detalle verificable

### Registro de apariciones iniciales

Las líneas corresponden al estado recibido; pueden desplazarse tras la edición. Cada fila registra todas las apariciones del archivo.

| Archivo | Líneas iniciales | Cantidad | Clasificación |
|---|---|---:|---|
| `README.md` | 90 | 1 | A/C |
| `docs/01-analisis-de-sistema/01-actores.md` | 35, 82 | 2 | D |
| `docs/01-analisis-de-sistema/02-historias-del-usuario.md` | 113, 137 | 2 | D; contraste con E/F |
| `docs/01-analisis-de-sistema/03-requisitos-funcionales.md` | 33, 73 | 2 | D; contraste con E/F |
| `docs/02-arquitectura-software/arquitectura-inicial.md` | 76, 105 | 2 | 76: A/B/C; 105: B/C/D |
| `docs/02-arquitectura-software/enfoque-arquitectonico.md` | 43, 88 | 2 | 43: A/B/C; 88: B/C |
| `docs/04-modelo-c4/Nivel3-DiagramadeComponentes.md` | 66, 115, 116, 120, 135, 177, 242 | 8 | 66: A/B/C y D; 115: A/B/C/F; 116: B/C; 120 y 135: A; 177 y 242: A/B/C |
| `docs/img/fuentes-svg/m1-clases.svg` | 27, 59, 77 | 4 | A |
| `docs/img/fuentes-svg/m1-interno.svg` | 37, 44 | 2 | A |
| `docs/img/fuentes-svg/m1-secuencia.svg` | 103, 104 | 2 | A |
| `docs/img/fuente_drawio/estilo-arquitectonico.drawio` | 58 | 1 | B |
| `docs/img/fuente_drawio/m1-clases.drawio` | 23, 55, 73 | 4 | A |
| `docs/img/fuente_drawio/m1-interno.drawio` | 33, 40 | 2 | A |
| `docs/img/fuente_drawio/m1-secuencia.drawio` | 90 | 2 | A |
| `docs/img/fuente_drawio/principios-solid-m1.drawio` | 83 | 1 | B |
| `docs/03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md` | 155 | 1 | A |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | 487 | 1 | D |
| `docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md` | 23, 66, 67, 144, 148, 208, 295, 356 | 9 | 23: B/C; 66 (dos) y 67: B; 144 y 148: identificadores transaccionales; 208 y 295: A/B; 356: A/B/C |

### Archivos modificados

- `README.md`
- `docs/01-analisis-de-sistema/01-actores.md`
- `docs/01-analisis-de-sistema/02-historias-del-usuario.md`
- `docs/01-analisis-de-sistema/03-requisitos-funcionales.md`
- `docs/01-analisis-de-sistema/06-drivers-arquitectonicos.md`
- `docs/02-arquitectura-software/arquitectura-inicial.md`
- `docs/02-arquitectura-software/enfoque-arquitectonico.md`
- `docs/03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md`
- `docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md`
- `docs/03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md`
- `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md`
- `docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md`
- `docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md`
- `docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md`
- `docs/04-modelo-c4/Nivel3-DiagramadeComponentes.md`
- `docs/img/fuente_drawio/enfoque-arquitectonico.drawio`
- `docs/img/fuente_drawio/estilo-arquitectonico.drawio`
- `docs/img/fuente_drawio/m1-clases.drawio`
- `docs/img/fuente_drawio/m1-interno.drawio`
- `docs/img/fuente_drawio/m1-secuencia.drawio`
- `docs/img/fuente_drawio/mentelyx-componentes-arquitectonicos.drawio`
- `docs/img/fuente_drawio/nivel2-contenedores.drawio`
- `docs/img/fuente_drawio/principios-solid-m1.drawio`
- `docs/img/fuentes-svg/estilo-arquitectonico.svg`
- `docs/img/fuentes-svg/m1-clases.svg`
- `docs/img/fuentes-svg/m1-interno.svg`
- `docs/img/fuentes-svg/m1-secuencia.svg`
- `docs/img/fuentes-svg/nivel2-contenedores.svg`
- `docs/auditoria-terminologica.md` (nuevo).

### Enlaces a imágenes aún sin destino (15)

| Documento | Destino inexistente |
|---|---|
| `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md` | `/img/nivel4-clases-m3.png` |
| `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md` | `/img/nivel4-clases-m6.png` |
| `docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md` | `/img/nivel4-secuencia.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m2-diagrama-clases.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m2-diagrama-secuencia.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m3-diagrama-clases.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m3-diagrama-secuencia.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m4-diagrama-clases.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m4-diagrama-secuencia.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m5-diagrama-clases.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m5-diagrama-secuencia-pagos.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m6-diagrama-clases.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m6-diagrama-secuencia-consulta.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m7-diagrama-clases.png` |
| `docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md` | `../../img/m7-diagrama-secuencia.png` |

### Resumen de diferencias

Comparación aislada con el estado recibido: **28 archivos existentes, 113 líneas añadidas y 89 retiradas**, más este informe nuevo. Se cuentan líneas completas; un SVG de una sola línea puede contener numerosos elementos. El siguiente `git diff --stat` contra `HEAD` incluye también cambios anteriores y no incluye archivos sin seguimiento:

```text
Logotipo tecnológico de búho Mentelyx.png          |  Bin 1245038 -> 0 bytes
 README.md                                          |   26 +-
 docs/01-analisis-de-sistema/01-actores.md          |   51 +-
 .../02-historias-del-usuario.md                    |   51 +-
 .../03-requisitos-funcionales.md                   |   28 +-
 .../04-atributos-de-calidad.md                     |   10 +-
 docs/01-analisis-de-sistema/05-restricciones.md    |    8 +-
 .../06-drivers-arquitectonicos.md                  |   18 +-
 .../07-decisiones-arquitectonicas.md               |   14 +-
 .../08-escenarios-atributos-calidad.md             |   10 +-
 .../arquitectura-inicial.md                        |   10 +-
 .../enfoque-arquitectonico.md                      |    4 +-
 .../01-diseño-de-persistencia-y-datos.md           |    4 +-
 .../diseño-externo/02-diseño-de-api-y-contratos.md |   16 +-
 .../03-diseño-de-interfaces-y-flujos.md            |   12 +-
 .../diseño-interno/diseño-interno-de-modulos.md    | 1390 ++++++++++++++------
 .../diseño-interno/principios-de-diseño.md         |   24 +-
 .../Nivel1-DiagramadeContextodelSistema.md         |  157 ++-
 docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md |  234 ++--
 docs/04-modelo-c4/Nivel3-DiagramadeComponentes.md  |  310 +++--
 docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md       |  421 +++---
 .../fuente_drawio/enfoque-arquitectonico.drawio    |    2 +-
 .../img/fuente_drawio/estilo-arquitectonico.drawio |    4 +-
 .../mentelyx-estilo-arquitectonico.drawio          | 1073 +++++++++++----
 docs/img/fuente_drawio/principios-solid-m1.drawio  |    2 +-
 docs/img/fuente_drawio/viewer.html                 |  693 ----------
 docs/img/fuentes-svg/estilo-arquitectonico.svg     |    2 +-
 docs/img/m1-interno.png                            |  Bin 1533907 -> 137163 bytes
 docs/img/m2-interno.png                            |  Bin 1594730 -> 190577 bytes
 docs/img/m3-interno.png                            |  Bin 1623801 -> 165921 bytes
 docs/img/m4-interno.png                            |  Bin 1762921 -> 171324 bytes
 docs/img/m5-interno.png                            |  Bin 1793805 -> 208334 bytes
 docs/img/m6-interno.png                            |  Bin 1693357 -> 163855 bytes
 docs/img/m7-interno.png                            |  Bin 1634425 -> 128673 bytes
 docs/img/mentelyx-componentes-arquitectonicos.png  |  Bin 292468 -> 487546 bytes
 docs/img/mentelyx-estilo-arquitectonico.png        |  Bin 327889 -> 565691 bytes
 36 files changed, 2726 insertions(+), 1848 deletions(-)
```

### Fuentes inspeccionadas

Inventario recursivo, búsqueda global, revisión contextual de seguridad y cuentas, y comprobación de estructura o referencias. Los archivos sin modificaciones ya no contenían el término objetivo o eran respaldos conservados.

```text
README.md
docs/01-analisis-de-sistema/01-actores.md
docs/01-analisis-de-sistema/02-historias-del-usuario.md
docs/01-analisis-de-sistema/03-requisitos-funcionales.md
docs/01-analisis-de-sistema/04-atributos-de-calidad.md
docs/01-analisis-de-sistema/05-restricciones.md
docs/01-analisis-de-sistema/06-drivers-arquitectonicos.md
docs/01-analisis-de-sistema/07-decisiones-arquitectonicas.md
docs/01-analisis-de-sistema/08-escenarios-atributos-calidad.md
docs/02-arquitectura-software/arquitectura-inicial.md
docs/02-arquitectura-software/componentes-arquitectonicos.md
docs/02-arquitectura-software/enfoque-arquitectonico.md
docs/02-arquitectura-software/estilo-arquitectonico.md
docs/03-diseño-de-software/diseño-externo/01-diseño-de-persistencia-y-datos.md
docs/03-diseño-de-software/diseño-externo/02-diseño-de-api-y-contratos.md
docs/03-diseño-de-software/diseño-externo/03-diseño-de-interfaces-y-flujos.md
docs/03-diseño-de-software/diseño-interno/diseño-interno-de-modulos.md
docs/03-diseño-de-software/diseño-interno/patrones-de-diseño.md
docs/03-diseño-de-software/diseño-interno/principios-de-diseño.md
docs/04-modelo-c4/Nivel1-DiagramadeContextodelSistema.md
docs/04-modelo-c4/Nivel2-DiagramadeContenedores.md
docs/04-modelo-c4/Nivel3-DiagramadeComponentes.md
docs/04-modelo-c4/Nivel4-DiagramadeCodigo.md
docs/img/fuente_drawio/.$mentelyx-componentes-arquitectonicos.drawio.bkp
docs/img/fuente_drawio/.$mentelyx-estilo-arquitectonico.drawio.bkp
docs/img/fuente_drawio/.$nivel1-contexto.drawio.bkp
docs/img/fuente_drawio/.$nivel2-contenedores.drawio.bkp
docs/img/fuente_drawio/enfoque-arquitectonico.drawio
docs/img/fuente_drawio/estilo-arquitectonico.drawio
docs/img/fuente_drawio/m1-clases.drawio
docs/img/fuente_drawio/m1-interno.drawio
docs/img/fuente_drawio/m1-secuencia.drawio
docs/img/fuente_drawio/m2-clases.drawio
docs/img/fuente_drawio/m2-interno.drawio
docs/img/fuente_drawio/m2-secuencia.drawio
docs/img/fuente_drawio/m3-clases.drawio
docs/img/fuente_drawio/m3-interno.drawio
docs/img/fuente_drawio/m3-secuencia.drawio
docs/img/fuente_drawio/m4-clases.drawio
docs/img/fuente_drawio/m4-interno.drawio
docs/img/fuente_drawio/m4-secuencia.drawio
docs/img/fuente_drawio/m5-clases.drawio
docs/img/fuente_drawio/m5-interno.drawio
docs/img/fuente_drawio/m5-secuencia.drawio
docs/img/fuente_drawio/m6-clases.drawio
docs/img/fuente_drawio/m6-interno.drawio
docs/img/fuente_drawio/m6-secuencia.drawio
docs/img/fuente_drawio/m7-clases.drawio
docs/img/fuente_drawio/m7-interno.drawio
docs/img/fuente_drawio/m7-secuencia.drawio
docs/img/fuente_drawio/mentelyx-componentes-arquitectonicos.drawio
docs/img/fuente_drawio/mentelyx-enfoque-arquitectonico.drawio
docs/img/fuente_drawio/mentelyx-estilo-arquitectonico.drawio
docs/img/fuente_drawio/nivel1-contexto.drawio
docs/img/fuente_drawio/nivel2-contenedores.drawio
docs/img/fuente_drawio/patrones-diseno-m5.drawio
docs/img/fuente_drawio/patrones-diseno-transversales.drawio
docs/img/fuente_drawio/principios-solid-m1.drawio
docs/img/fuente_drawio/principios-solid-m2.drawio
docs/img/fuente_drawio/principios-solid-m3.drawio
docs/img/fuente_drawio/principios-solid-m4.drawio
docs/img/fuente_drawio/principios-solid-m6.drawio
docs/img/fuente_drawio/principios-solid-m7.drawio
docs/img/fuentes-svg/estilo-arquitectonico.svg
docs/img/fuentes-svg/m1-clases.svg
docs/img/fuentes-svg/m1-interno.svg
docs/img/fuentes-svg/m1-secuencia.svg
docs/img/fuentes-svg/m2-clases.svg
docs/img/fuentes-svg/m2-interno.svg
docs/img/fuentes-svg/m2-secuencia.svg
docs/img/fuentes-svg/m3-clases.svg
docs/img/fuentes-svg/m3-interno.svg
docs/img/fuentes-svg/m3-secuencia.svg
docs/img/fuentes-svg/m4-clases.svg
docs/img/fuentes-svg/m4-interno.svg
docs/img/fuentes-svg/m4-secuencia.svg
docs/img/fuentes-svg/m5-clases.svg
docs/img/fuentes-svg/m5-interno.svg
docs/img/fuentes-svg/m5-secuencia.svg
docs/img/fuentes-svg/m6-clases.svg
docs/img/fuentes-svg/m6-interno.svg
docs/img/fuentes-svg/m6-secuencia.svg
docs/img/fuentes-svg/m7-clases.svg
docs/img/fuentes-svg/m7-interno.svg
docs/img/fuentes-svg/m7-secuencia.svg
docs/img/fuentes-svg/nivel1-contexto.svg
docs/img/fuentes-svg/nivel2-contenedores.svg
docs/img/fuentes-svg/patrones-diseno-m5.svg
docs/img/fuentes-svg/patrones-diseno-transversales.svg
```

Los 35 PNG se inventariaron por ruta y hash en `docs/img/`; el ZIP y `.gitignore` se comprobaron separadamente. Este informe se añadió después del inventario inicial.
