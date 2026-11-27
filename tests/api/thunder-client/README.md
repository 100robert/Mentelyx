# Pruebas HTTP con Thunder Client — Mentelyx V1

Generado por `scripts/thunder/generar-coleccion.mjs`. Se ejecuta **en orden** contra la API local (`bash scripts/levantar-local.sh`).

1. En Thunder Client → *Env* → menú → *Import*: `mentelyx-local.thunder-environment.json`. Elegir el entorno «Mentelyx local». Cambiar `correo` y `correo2` por correos nuevos (@ejemplo.test) en cada corrida.
2. *Collections* → menú → *Import*: `mentelyx-api.thunder-collection.json`. Si la versión instalada no permite importar, crear cada solicitud con la tabla de abajo (las cabeceras usan las mismas variables).
3. Ejecutar la colección con *Run All* o solicitud por solicitud. Thunder Client conserva la cookie de sesión HttpOnly; el token CSRF se guarda en `{{csrf}}` con la prueba «set-env-var» de las solicitudes «Obtener token CSRF».

Las mutaciones exigen `Origin` permitido y `X-CSRF-Token`; las de creación, `Idempotency-Key` (`{{#number}}` genera una distinta en cada envío). Cada solicitud incluye una prueba del código HTTP esperado.

**Estado de ejecución:** generado y verificado como contrato por `scripts/thunder/verificar-coleccion.mjs`, que ejecuta las mismas solicitudes con Node. La ejecución gráfica en Thunder Client la realiza el propietario y no se declara ejecutada aquí.

| # | Grupo | Método y ruta | Cabeceras | Cuerpo | Precondición | HTTP | RF / ADR | EQ |
|---|---|---|---|---|---|---|---|---|
| 1 | Plataforma | `GET /salud` | — | — | API local en ejecución | 200 | — | EQ-19 |
| 2 | Plataforma | `GET /openapi.json` | — | — | — | 200 | — | EQ-08 |
| 3 | Plataforma | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 4 | M1 · Usuarios y cuenta | `POST /auth/registro` | Content-Type, Origin | `{"nombre":"Prueba Thunder","correo":"{{correo}}","contrasena":"{{contrasena}}"}` | Sin X-CSRF-Token | 403 | RF-93 | EQ-04 |
| 5 | M1 · Usuarios y cuenta | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 6 | M1 · Usuarios y cuenta | `POST /auth/registro` | Content-Type, Origin, X-CSRF-Token | `{"nombre":"Prueba Thunder","correo":"{{correo}}","contrasena":"{{contrasena}}"}` | Correo nuevo en el entorno | 201 | RF-01 | — |
| 7 | M1 · Usuarios y cuenta | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 8 | M1 · Usuarios y cuenta | `POST /auth/registro` | Content-Type, Origin, X-CSRF-Token | `{"nombre":"Prueba Thunder","correo":"{{correo}}","contrasena":"{{contrasena}}"}` | Cuenta ya creada | 400 | RF-01 | — |
| 9 | M1 · Usuarios y cuenta | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 10 | M1 · Usuarios y cuenta | `POST /auth/login` | Content-Type, Origin, X-CSRF-Token | `{"correo":"{{correo}}","contrasena":"incorrecta-123"}` | Cuenta creada | 401 | RF-02 | EQ-04 |
| 11 | M1 · Usuarios y cuenta | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 12 | M1 · Usuarios y cuenta | `POST /auth/login` | Content-Type, Origin, X-CSRF-Token | `{"correo":"{{correo}}","contrasena":"{{contrasena}}"}` | Cuenta creada; Thunder guarda la cookie de sesión | 200 | RF-02 | — |
| 13 | M1 · Usuarios y cuenta | `GET /auth/sesion` | — | — | Sesión iniciada | 200 | RF-02 | — |
| 14 | M1 · Usuarios y cuenta | `GET /cuenta/me` | — | — | Sesión iniciada | 200 | RF-04 | — |
| 15 | M1 · Usuarios y cuenta | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 16 | M1 · Usuarios y cuenta | `PATCH /cuenta/me` | Content-Type, Origin, X-CSRF-Token | `{"nombre":"Prueba Thunder Editada"}` | Sesión y token CSRF | 200 | RF-04 | — |
| 17 | M1 · Usuarios y cuenta | `PUT /cuenta/me/preferencias` | Content-Type, Origin, X-CSRF-Token | `{"profundidad":"intermedio","herramientasVisuales":["grafico","pasos"],"idioma":"es"}` | Sesión y token CSRF | 200 | RF-42 | — |
| 18 | M1 · Usuarios y cuenta | `PUT /cuenta/me/preferencias` | Content-Type, Origin, X-CSRF-Token | `{"profundidad":"experto","herramientasVisuales":[],"idioma":"en"}` | Sesión y token CSRF | 400 | RF-42 | — |
| 19 | M1 · Usuarios y cuenta | `GET /auth/sesiones` | — | — | Sesión iniciada | 200 | RF-93 | — |
| 20 | M2 · Contenidos y carpetas | `POST /carpetas` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"modulo":"APRENDIZAJE","nombre":"Física {{#number}}"}` | Sesión y token CSRF | 201 | ADR-093 | — |
| 21 | M2 · Contenidos y carpetas | `POST /carpetas` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"modulo":"EXAMENES","nombre":"Ciclo {{#number}}"}` | Sesión y token CSRF | 201 | ADR-093 | — |
| 22 | M2 · Contenidos y carpetas | `GET /carpetas?modulo=APRENDIZAJE&estado=ACTIVA` | — | — | Carpeta creada | 200 | ADR-093 | — |
| 23 | M2 · Contenidos y carpetas | `POST /espacios` | Content-Type, Origin, X-CSRF-Token | `{"titulo":"Derivadas"}` | Sesión y token CSRF | 201 | RF-101 | — |
| 24 | M2 · Contenidos y carpetas | `POST /espacios/{{espacioId}}/fuentes` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"titulo":"Apuntes","formato":"MD","contenido":"La derivada de x² es 2x por la regla de la…` | Tema creado | 202 | RF-101, RF-102 | EQ-32 |
| 25 | M2 · Contenidos y carpetas | `PUT /carpetas/{{carpetaId}}/elementos/{{espacioId}}` | Content-Type, Origin, X-CSRF-Token | `{"tipo":"TEMA"}` | Carpeta y tema | 200 | ADR-093 | — |
| 26 | M2 · Contenidos y carpetas | `PUT /carpetas/{{carpetaExamenesId}}/elementos/{{espacioId}}` | Content-Type, Origin, X-CSRF-Token | `{"tipo":"TEMA"}` | Carpeta de Exámenes y tema | 400 | ADR-093 | — |
| 27 | M3 · Preparación y evaluaciones | `POST /preparaciones` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"nombre":"Parcial Thunder","asignatura":"Cálculo I","fuente":"PERSONAL","minutosSemanales…` | Sesión y token CSRF | 201 | RF-103 | EQ-16 |
| 28 | M3 · Preparación y evaluaciones | `POST /preparaciones` | Content-Type, Origin, X-CSRF-Token | `{"nombre":"X","asignatura":"X","fuente":"PERSONAL","minutosSemanales":180,"temas":[{"areaC…` | — | 400 | RF-92 | — |
| 29 | M3 · Preparación y evaluaciones | `GET /preparaciones` | — | — | Preparación creada | 200 | RF-11 | — |
| 30 | M3 · Preparación y evaluaciones | `GET /preparaciones/{{prepId}}/plan` | — | — | Preparación creada | 200 | RF-08 | EQ-16 |
| 31 | M3 · Preparación y evaluaciones | `PUT /preparaciones/{{prepId}}/temario` | Content-Type, Origin, X-CSRF-Token | `{"temas":[{"id":"T01","titulo":"Derivadas"},{"titulo":"Integrales"}]}` | Preparación creada | 200 | RF-08 | EQ-16 |
| 32 | M3 · Preparación y evaluaciones | `POST /preparaciones/{{prepId}}/preguntas` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"preguntas":[{"id":"q1","version":1,"tipo":"opcion-unica","tema":"Derivadas","dificultad"…` | Preparación creada | 201 | RF-105 | EQ-37 |
| 33 | M3 · Preparación y evaluaciones | `POST /preparaciones/{{prepId}}/preguntas` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"preguntas":[{"id":"q9","version":1,"tipo":"opcion-unica","tema":"X","dificultad":"basica…` | Preparación creada | 400 | RF-105 | — |
| 34 | M3 · Preparación y evaluaciones | `GET /preparaciones/{{prepId}}/preguntas` | — | — | Banco con preguntas | 200 | RF-105 | EQ-37 |
| 35 | M3 · Preparación y evaluaciones | `POST /preparaciones/{{prepId}}/intentos` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"modo":"SIMULACRO","preguntaIds":["q1","q2"],"minutos":20}` | Banco con preguntas | 201 | RF-10 | EQ-15 |
| 36 | M3 · Preparación y evaluaciones | `PUT /intentos/{{intentoId}}/respuestas/q1` | Content-Type, Origin, X-CSRF-Token | `{"respuesta":{"tipo":"opcion","id":"a"}}` | Intento en curso | 200 | RF-09, RF-96 | EQ-15 |
| 37 | M3 · Preparación y evaluaciones | `POST /intentos/{{intentoId}}/entrega` | Origin, X-CSRF-Token, Idempotency-Key | — | Intento en curso | 200 | RF-10, RF-96 | EQ-15, EQ-37 |
| 38 | M3 · Preparación y evaluaciones | `PUT /intentos/{{intentoId}}/respuestas/q2` | Content-Type, Origin, X-CSRF-Token | `{"respuesta":{"tipo":"booleano","valor":true}}` | Intento entregado | 409 | RF-96 | EQ-15 |
| 39 | M3 · Preparación y evaluaciones | `GET /preparaciones/{{prepId}}/intentos` | — | — | Intento entregado | 200 | RF-11 | — |
| 40 | M3 · Preparación y evaluaciones | `GET /preparaciones/{{prepId}}/resultados` | — | — | Intento entregado | 200 | RF-11 | — |
| 41 | M3 · Preparación y evaluaciones | `POST /preparaciones/{{prepId}}/tarjetas` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"tema":"Derivadas","anverso":"d/dx sen x","reverso":"cos x"}` | Preparación creada | 201 | RF-09 | — |
| 42 | M3 · Preparación y evaluaciones | `POST /tarjetas/{{tarjetaId}}/revisiones` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"calificacion":"BIEN"}` | Tarjeta creada | 200 | RF-09 | — |
| 43 | M5 · Derechos | `GET /suscripciones/me/derechos` | — | — | Sesión iniciada | 200 | RF-14, RF-43 | EQ-30 |
| 44 | M6 · Tutor IA | `POST /tutor-ia/conversaciones` | Content-Type, Origin, X-CSRF-Token | `{"contexto":{"superficie":"TUTOR","espacioId":"{{espacioId}}"}}` | Tema con fuente | 201 | RF-42 | — |
| 45 | M6 · Tutor IA | `POST /tutor-ia/consultas` | Content-Type, Origin, X-CSRF-Token, Idempotency-Key | `{"conversacionId":"{{convId}}","pregunta":"¿Cuál es la derivada de x²?","fuentes":{"espaci…` | Conversación creada. En local responde el proveedor SIMULADO (rotulado); en el perfil externo, NVIDIA | 200 | RF-42 | EQ-11, EQ-33 |
| 46 | M6 · Tutor IA | `GET /tutor-ia/conversaciones/{{convId}}/estado` | — | — | Conversación creada | 200 | RF-112 | — |
| 47 | M6 · Tutor IA | `PUT /tutor-ia/conversaciones/{{convId}}/estado` | Content-Type, Origin, X-CSRF-Token, If-Match | `{"interaccion":{},"anotaciones":[]}` | Estado sin guardar | 200 | RF-112 | — |
| 48 | M6 · Tutor IA | `PUT /tutor-ia/conversaciones/{{convId}}/estado` | Content-Type, Origin, X-CSRF-Token, If-Match | `{"interaccion":{},"anotaciones":[]}` | Estado ya guardado en versión 1 | 412 | RF-112 | — |
| 49 | Seguridad · acceso indebido | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 50 | Seguridad · acceso indebido | `POST /auth/logout` | Origin, X-CSRF-Token | — | Sesión iniciada | 200 | RF-02 | — |
| 51 | Seguridad · acceso indebido | `GET /preparaciones` | — | — | Sesión cerrada | 401 | RF-04 | EQ-04 |
| 52 | Seguridad · acceso indebido | `GET /auth/csrf` | — | — | Ninguna (antes de cada mutación tras iniciar o cerrar sesión) | 200 | RF-93 | EQ-04 |
| 53 | Seguridad · acceso indebido | `POST /auth/registro` | Content-Type, Origin, X-CSRF-Token | `{"nombre":"Otra Cuenta","correo":"{{correo2}}","contrasena":"{{contrasena}}"}` | Correo2 nuevo | 201 | RF-01 | EQ-04 |
| 54 | Seguridad · acceso indebido | `GET /preparaciones/{{prepId}}` | — | — | Sesión de la segunda cuenta | 404 | RF-04 | EQ-04 |
| 55 | Seguridad · acceso indebido | `GET /intentos/{{intentoId}}` | — | — | Sesión de la segunda cuenta | 404 | RF-04, RF-11 | EQ-04 |
| 56 | Seguridad · acceso indebido | `GET /carpetas/{{carpetaId}}/elementos` | — | — | Sesión de la segunda cuenta | 404 | RF-04 | EQ-04 |
| 57 | Seguridad · acceso indebido | `GET /tutor-ia/conversaciones/{{convId}}` | — | — | Sesión de la segunda cuenta | 404 | RF-04, RF-112 | EQ-04, EQ-32 |
