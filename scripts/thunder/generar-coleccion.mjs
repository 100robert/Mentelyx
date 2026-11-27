#!/usr/bin/env node
// Genera la colección y el entorno de Thunder Client (formato de exportación «Thunder Client», importable desde
// Collections → menú → Import) y la guía manual equivalente. Sin cookies, tokens ni contraseñas reales: el correo y la
// contraseña son variables del entorno (valores ficticios) y el token CSRF se toma de la respuesta de /auth/csrf.
//   node scripts/thunder/generar-coleccion.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

// Única fuente de la colección: tests/api/thunder-client (sustituye la versión del 23/11, sin CSRF, que queda en Git).
const SAL = 'tests/api/thunder-client';
mkdirSync(SAL, { recursive: true });
const ahora = '2026-11-27T00:00:00.000Z';
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const COL = id(1);

const CARPETAS = [
  ['Plataforma', 'Salud, contrato y protección CSRF'],
  ['M1 · Usuarios y cuenta', 'Registro, sesión, perfil, preferencias'],
  ['M2 · Contenidos y carpetas', 'Carpetas por módulo, temas y fuentes'],
  ['M3 · Preparación y evaluaciones', 'Preparaciones, banco, intentos, calificación, tarjetas'],
  ['M5 · Derechos', 'Recursos del plan'],
  ['M6 · Tutor IA', 'Conversaciones, consulta y estado de sesión'],
  ['Seguridad · acceso indebido', 'Sesión cerrada y recursos de otra cuenta'],
];
const MUT = { Origin: '{{origin}}', 'X-CSRF-Token': '{{csrf}}' };
const csrf = { m: 'GET', r: '/auth/csrf', n: 'Obtener token CSRF', e: 200, set: [['json.data.token', 'csrf']], pre: 'Ninguna (antes de cada mutación tras iniciar o cerrar sesión)', rf: 'RF-93', eq: 'EQ-04' };

// [carpeta, solicitud]
const S = [
  [0, { m: 'GET', r: '/salud', n: 'Salud y módulos montados', e: 200, pre: 'API local en ejecución', rf: '—', eq: 'EQ-19' }],
  [0, { m: 'GET', r: '/openapi.json', n: 'Contrato OpenAPI 3.1', e: 200, pre: '—', rf: '—', eq: 'EQ-08' }],
  [0, csrf],
  [1, { m: 'POST', r: '/auth/registro', n: 'Registro sin token CSRF (negativo)', h: { Origin: '{{origin}}' }, b: { nombre: 'Prueba Thunder', correo: '{{correo}}', contrasena: '{{contrasena}}' }, e: 403, pre: 'Sin X-CSRF-Token', rf: 'RF-93', eq: 'EQ-04' }],
  [1, csrf],
  [1, { m: 'POST', r: '/auth/registro', n: 'Registro de cuenta ficticia', h: MUT, b: { nombre: 'Prueba Thunder', correo: '{{correo}}', contrasena: '{{contrasena}}' }, e: 201, pre: 'Correo nuevo en el entorno', rf: 'RF-01', eq: '—' }],
  [1, csrf],
  [1, { m: 'POST', r: '/auth/registro', n: 'Registro duplicado (negativo)', h: MUT, b: { nombre: 'Prueba Thunder', correo: '{{correo}}', contrasena: '{{contrasena}}' }, e: 400, pre: 'Cuenta ya creada', rf: 'RF-01', eq: '—' }],
  [1, csrf],
  [1, { m: 'POST', r: '/auth/login', n: 'Inicio de sesión con contraseña incorrecta (negativo)', h: MUT, b: { correo: '{{correo}}', contrasena: 'incorrecta-123' }, e: 401, pre: 'Cuenta creada', rf: 'RF-02', eq: 'EQ-04' }],
  [1, csrf],
  [1, { m: 'POST', r: '/auth/login', n: 'Inicio de sesión', h: MUT, b: { correo: '{{correo}}', contrasena: '{{contrasena}}' }, e: 200, pre: 'Cuenta creada; Thunder guarda la cookie de sesión', rf: 'RF-02', eq: '—' }],
  [1, { m: 'GET', r: '/auth/sesion', n: 'Sesión vigente (nombre y correo)', e: 200, pre: 'Sesión iniciada', rf: 'RF-02', eq: '—' }],
  [1, { m: 'GET', r: '/cuenta/me', n: 'Perfil de la cuenta', e: 200, pre: 'Sesión iniciada', rf: 'RF-04', eq: '—' }],
  [1, csrf],
  [1, { m: 'PATCH', r: '/cuenta/me', n: 'Cambiar el nombre', h: MUT, b: { nombre: 'Prueba Thunder Editada' }, e: 200, pre: 'Sesión y token CSRF', rf: 'RF-04', eq: '—' }],
  [1, { m: 'PUT', r: '/cuenta/me/preferencias', n: 'Guardar preferencias', h: MUT, b: { profundidad: 'intermedio', herramientasVisuales: ['grafico', 'pasos'], idioma: 'es' }, e: 200, pre: 'Sesión y token CSRF', rf: 'RF-42', eq: '—' }],
  [1, { m: 'PUT', r: '/cuenta/me/preferencias', n: 'Preferencias inválidas (negativo)', h: MUT, b: { profundidad: 'experto', herramientasVisuales: [], idioma: 'en' }, e: 400, pre: 'Sesión y token CSRF', rf: 'RF-42', eq: '—' }],
  [1, { m: 'GET', r: '/auth/sesiones', n: 'Sesiones abiertas (sin tokens)', e: 200, pre: 'Sesión iniciada', rf: 'RF-93', eq: '—' }],
  [2, { m: 'POST', r: '/carpetas', n: 'Crear carpeta de Aprendizaje', h: { ...MUT, 'Idempotency-Key': 'thunder-carpeta-{{#number}}' }, b: { modulo: 'APRENDIZAJE', nombre: 'Física {{#number}}' }, e: 201, set: [['json.data.id', 'carpetaId']], pre: 'Sesión y token CSRF', rf: 'ADR-093', eq: '—' }],
  [2, { m: 'POST', r: '/carpetas', n: 'Crear carpeta de Exámenes', h: { ...MUT, 'Idempotency-Key': 'thunder-carpetaex-{{#number}}' }, b: { modulo: 'EXAMENES', nombre: 'Ciclo {{#number}}' }, e: 201, set: [['json.data.id', 'carpetaExamenesId']], pre: 'Sesión y token CSRF', rf: 'ADR-093', eq: '—' }],
  [2, { m: 'GET', r: '/carpetas?modulo=APRENDIZAJE&estado=ACTIVA', n: 'Listar carpetas de Aprendizaje', e: 200, pre: 'Carpeta creada', rf: 'ADR-093', eq: '—' }],
  [2, { m: 'POST', r: '/espacios', n: 'Crear un tema (espacio privado)', h: MUT, b: { titulo: 'Derivadas' }, e: 201, set: [['json.data.id', 'espacioId']], pre: 'Sesión y token CSRF', rf: 'RF-101', eq: '—' }],
  [2, { m: 'POST', r: '/espacios/{{espacioId}}/fuentes', n: 'Registrar una fuente MD', h: { ...MUT, 'Idempotency-Key': 'thunder-fuente-{{#number}}' }, b: { titulo: 'Apuntes', formato: 'MD', contenido: 'La derivada de x² es 2x por la regla de la potencia.' }, e: 202, pre: 'Tema creado', rf: 'RF-101, RF-102', eq: 'EQ-32' }],
  [2, { m: 'PUT', r: '/carpetas/{{carpetaId}}/elementos/{{espacioId}}', n: 'Guardar el tema en la carpeta', h: MUT, b: { tipo: 'TEMA' }, e: 200, pre: 'Carpeta y tema', rf: 'ADR-093', eq: '—' }],
  [2, { m: 'PUT', r: '/carpetas/{{carpetaExamenesId}}/elementos/{{espacioId}}', n: 'Tema en carpeta de Exámenes (negativo)', h: MUT, b: { tipo: 'TEMA' }, e: 400, pre: 'Carpeta de Exámenes y tema', rf: 'ADR-093', eq: '—' }],
  [3, { m: 'POST', r: '/preparaciones', n: 'Crear preparación con nombre y temario', h: { ...MUT, 'Idempotency-Key': 'thunder-prep-{{#number}}' }, b: { nombre: 'Parcial Thunder', asignatura: 'Cálculo I', fuente: 'PERSONAL', minutosSemanales: 180, temas: [{ areaCodigo: 'CALCULO', temaCodigo: 'T01', titulo: 'Derivadas' }, { areaCodigo: 'CALCULO', temaCodigo: 'T02', titulo: 'Límites' }] }, e: 201, set: [['json.data.id', 'prepId']], pre: 'Sesión y token CSRF', rf: 'RF-103', eq: 'EQ-16' }],
  [3, { m: 'POST', r: '/preparaciones', n: 'Crear preparación sin Idempotency-Key (negativo)', h: MUT, b: { nombre: 'X', asignatura: 'X', fuente: 'PERSONAL', minutosSemanales: 180, temas: [{ areaCodigo: 'X', temaCodigo: 'T01', titulo: 'X' }] }, e: 400, pre: '—', rf: 'RF-92', eq: '—' }],
  [3, { m: 'GET', r: '/preparaciones', n: 'Listar preparaciones (varias por cuenta)', e: 200, pre: 'Preparación creada', rf: 'RF-11', eq: '—' }],
  [3, { m: 'GET', r: '/preparaciones/{{prepId}}/plan', n: 'Plan determinista', e: 200, pre: 'Preparación creada', rf: 'RF-08', eq: 'EQ-16' }],
  [3, { m: 'PUT', r: '/preparaciones/{{prepId}}/temario', n: 'Editar temario (versión nueva del plan)', h: MUT, b: { temas: [{ id: 'T01', titulo: 'Derivadas' }, { titulo: 'Integrales' }] }, e: 200, pre: 'Preparación creada', rf: 'RF-08', eq: 'EQ-16' }],
  [3, { m: 'POST', r: '/preparaciones/{{prepId}}/preguntas', n: 'Agregar preguntas al banco', h: { ...MUT, 'Idempotency-Key': 'thunder-banco-{{#number}}' }, b: { preguntas: [{ id: 'q1', version: 1, tipo: 'opcion-unica', tema: 'Derivadas', dificultad: 'basica', enunciado: '¿Derivada de x²?', origen: 'persona', opciones: [{ id: 'a', texto: '2x' }, { id: 'b', texto: 'x' }], correcta: 'a' }, { id: 'q2', version: 1, tipo: 'verdadero-falso', tema: 'Límites', dificultad: 'basica', enunciado: 'lím x→∞ de 1/x es 0', origen: 'persona', correcta: true }] }, e: 201, pre: 'Preparación creada', rf: 'RF-105', eq: 'EQ-37' }],
  [3, { m: 'POST', r: '/preparaciones/{{prepId}}/preguntas', n: 'Pregunta inválida (negativo)', h: { ...MUT, 'Idempotency-Key': 'thunder-banco-malo-{{#number}}' }, b: { preguntas: [{ id: 'q9', version: 1, tipo: 'opcion-unica', tema: 'X', dificultad: 'basica', enunciado: '¿?', origen: 'persona', opciones: [{ id: 'a', texto: 'a' }, { id: 'b', texto: 'b' }], correcta: 'z' }] }, e: 400, pre: 'Preparación creada', rf: 'RF-105', eq: '—' }],
  [3, { m: 'GET', r: '/preparaciones/{{prepId}}/preguntas', n: 'Banco sin soluciones (proyección)', e: 200, pre: 'Banco con preguntas', rf: 'RF-105', eq: 'EQ-37' }],
  [3, { m: 'POST', r: '/preparaciones/{{prepId}}/intentos', n: 'Iniciar simulacro (hora del servidor)', h: { ...MUT, 'Idempotency-Key': 'thunder-intento-{{#number}}' }, b: { modo: 'SIMULACRO', preguntaIds: ['q1', 'q2'], minutos: 20 }, e: 201, set: [['json.data.intento.id', 'intentoId']], pre: 'Banco con preguntas', rf: 'RF-10', eq: 'EQ-15' }],
  [3, { m: 'PUT', r: '/intentos/{{intentoId}}/respuestas/q1', n: 'Guardar una respuesta', h: MUT, b: { respuesta: { tipo: 'opcion', id: 'a' } }, e: 200, pre: 'Intento en curso', rf: 'RF-09, RF-96', eq: 'EQ-15' }],
  [3, { m: 'POST', r: '/intentos/{{intentoId}}/entrega', n: 'Entregar y calificar en el servidor', h: { ...MUT, 'Idempotency-Key': 'thunder-entrega-{{#number}}' }, e: 200, pre: 'Intento en curso', rf: 'RF-10, RF-96', eq: 'EQ-15, EQ-37' }],
  [3, { m: 'PUT', r: '/intentos/{{intentoId}}/respuestas/q2', n: 'Responder tras la entrega (negativo)', h: MUT, b: { respuesta: { tipo: 'booleano', valor: true } }, e: 409, pre: 'Intento entregado', rf: 'RF-96', eq: 'EQ-15' }],
  [3, { m: 'GET', r: '/preparaciones/{{prepId}}/intentos', n: 'Historial de intentos', e: 200, pre: 'Intento entregado', rf: 'RF-11', eq: '—' }],
  [3, { m: 'GET', r: '/preparaciones/{{prepId}}/resultados', n: 'Rendimiento por tema', e: 200, pre: 'Intento entregado', rf: 'RF-11', eq: '—' }],
  [3, { m: 'POST', r: '/preparaciones/{{prepId}}/tarjetas', n: 'Crear tarjeta', h: { ...MUT, 'Idempotency-Key': 'thunder-tarjeta-{{#number}}' }, b: { tema: 'Derivadas', anverso: 'd/dx sen x', reverso: 'cos x' }, e: 201, set: [['json.data.tarjeta.id', 'tarjetaId']], pre: 'Preparación creada', rf: 'RF-09', eq: '—' }],
  [3, { m: 'POST', r: '/tarjetas/{{tarjetaId}}/revisiones', n: 'Repasar tarjeta (SM-2 en el servidor)', h: { ...MUT, 'Idempotency-Key': 'thunder-repaso-{{#number}}' }, b: { calificacion: 'BIEN' }, e: 200, pre: 'Tarjeta creada', rf: 'RF-09', eq: '—' }],
  [4, { m: 'GET', r: '/suscripciones/me/derechos', n: 'Recursos del plan del mes', e: 200, pre: 'Sesión iniciada', rf: 'RF-14, RF-43', eq: 'EQ-30' }],
  [5, { m: 'POST', r: '/tutor-ia/conversaciones', n: 'Crear conversación con el tema', h: MUT, b: { contexto: { superficie: 'TUTOR', espacioId: '{{espacioId}}' } }, e: 201, set: [['json.data.id', 'convId']], pre: 'Tema con fuente', rf: 'RF-42', eq: '—' }],
  [5, { m: 'POST', r: '/tutor-ia/consultas', n: 'Consulta al Tutor con fuentes', h: { ...MUT, 'Idempotency-Key': 'thunder-consulta-{{#number}}' }, b: { conversacionId: '{{convId}}', pregunta: '¿Cuál es la derivada de x²?', fuentes: { espacioId: '{{espacioId}}' } }, e: 200, pre: 'Conversación creada. En local responde el proveedor SIMULADO (rotulado); en el perfil externo, NVIDIA', rf: 'RF-42', eq: 'EQ-11, EQ-33' }],
  [5, { m: 'GET', r: '/tutor-ia/conversaciones/{{convId}}/estado', n: 'Estado de la sesión', e: 200, pre: 'Conversación creada', rf: 'RF-112', eq: '—' }],
  [5, { m: 'PUT', r: '/tutor-ia/conversaciones/{{convId}}/estado', n: 'Guardar estado (If-Match "0")', h: { ...MUT, 'If-Match': '"0"' }, b: { interaccion: {}, anotaciones: [] }, e: 200, pre: 'Estado sin guardar', rf: 'RF-112', eq: '—' }],
  [5, { m: 'PUT', r: '/tutor-ia/conversaciones/{{convId}}/estado', n: 'Versión desactualizada (negativo)', h: { ...MUT, 'If-Match': '"0"' }, b: { interaccion: {}, anotaciones: [] }, e: 412, pre: 'Estado ya guardado en versión 1', rf: 'RF-112', eq: '—' }],
  [6, csrf],
  [6, { m: 'POST', r: '/auth/logout', n: 'Cerrar sesión', h: MUT, e: 200, pre: 'Sesión iniciada', rf: 'RF-02', eq: '—' }],
  [6, { m: 'GET', r: '/preparaciones', n: 'Preparaciones sin sesión (negativo)', e: 401, pre: 'Sesión cerrada', rf: 'RF-04', eq: 'EQ-04' }],
  [6, csrf],
  [6, { m: 'POST', r: '/auth/registro', n: 'Registrar una segunda cuenta', h: MUT, b: { nombre: 'Otra Cuenta', correo: '{{correo2}}', contrasena: '{{contrasena}}' }, e: 201, pre: 'Correo2 nuevo', rf: 'RF-01', eq: 'EQ-04' }],
  [6, { m: 'GET', r: '/preparaciones/{{prepId}}', n: 'Preparación de otra cuenta (negativo)', e: 404, pre: 'Sesión de la segunda cuenta', rf: 'RF-04', eq: 'EQ-04' }],
  [6, { m: 'GET', r: '/intentos/{{intentoId}}', n: 'Intento de otra cuenta (negativo)', e: 404, pre: 'Sesión de la segunda cuenta', rf: 'RF-04, RF-11', eq: 'EQ-04' }],
  [6, { m: 'GET', r: '/carpetas/{{carpetaId}}/elementos', n: 'Carpeta de otra cuenta (negativo)', e: 404, pre: 'Sesión de la segunda cuenta', rf: 'RF-04', eq: 'EQ-04' }],
  [6, { m: 'GET', r: '/tutor-ia/conversaciones/{{convId}}', n: 'Conversación de otra cuenta (negativo)', e: 404, pre: 'Sesión de la segunda cuenta', rf: 'RF-04, RF-112', eq: 'EQ-04, EQ-32' }],
];

const carpetaIds = CARPETAS.map((_, k) => id(100 + k));
const requests = S.map(([c, s], k) => ({
  _id: id(1000 + k),
  colId: COL,
  containerId: carpetaIds[c],
  name: `${String(k + 1).padStart(2, '0')} · ${s.n}`,
  url: `{{baseUrl}}${s.r}`,
  method: s.m,
  sortNum: (k + 1) * 10000,
  created: ahora,
  modified: ahora,
  headers: Object.entries({ ...(s.b ? { 'Content-Type': 'application/json' } : {}), ...(s.h ?? {}) }).map(([name, value]) => ({ name, value })),
  ...(s.b ? { body: { type: 'json', raw: JSON.stringify(s.b, null, 2), form: [] } } : {}),
  tests: [{ type: 'res-code', custom: '', action: 'equal', value: String(s.e) }, ...(s.set ?? []).map(([ruta, v]) => ({ type: 'set-env-var', custom: ruta, action: 'setto', value: `{{${v}}}` }))],
  docs: `Precondición: ${s.pre}. Esperado: HTTP ${s.e}. ${s.rf} · ${s.eq}`,
}));
writeFileSync(
  `${SAL}/mentelyx-api.thunder-collection.json`,
  JSON.stringify({ clientName: 'Thunder Client', collectionName: 'Mentelyx V1 · API', collectionId: COL, dateExported: ahora, version: '1.2', folders: CARPETAS.map(([name], k) => ({ _id: carpetaIds[k], name, containerId: '', created: ahora, sortNum: (k + 1) * 10000 })), requests }, null, 2) + '\n',
);
writeFileSync(
  `${SAL}/mentelyx-local.thunder-environment.json`,
  JSON.stringify({ clientName: 'Thunder Client', environmentName: 'Mentelyx local', dateExported: ahora, version: '1.1', folder: '', variables: [
    { name: 'baseUrl', value: 'http://localhost:8787/api/v1' },
    { name: 'origin', value: 'http://localhost:8787' },
    { name: 'correo', value: 'thunder-01@ejemplo.test' },
    { name: 'correo2', value: 'thunder-02@ejemplo.test' },
    { name: 'contrasena', value: 'Thunder-Ficticia-2026' },
    ...['csrf', 'carpetaId', 'carpetaExamenesId', 'espacioId', 'prepId', 'intentoId', 'tarjetaId', 'convId'].map((name) => ({ name, value: '' })),
  ] }, null, 2) + '\n',
);
const fila = ([c, s], k) => `| ${k + 1} | ${CARPETAS[c][0]} | \`${s.m} ${s.r}\` | ${Object.keys({ ...(s.b ? { 'Content-Type': 1 } : {}), ...(s.h ?? {}) }).join(', ') || '—'} | ${s.b ? `\`${JSON.stringify(s.b).slice(0, 90).replace(/\|/g, '\\|')}${JSON.stringify(s.b).length > 90 ? '…' : ''}\`` : '—'} | ${s.pre} | ${s.e} | ${s.rf} | ${s.eq} |`;
writeFileSync(
  `${SAL}/README.md`,
  `# Pruebas HTTP con Thunder Client — Mentelyx V1\n\nGenerado por \`scripts/thunder/generar-coleccion.mjs\`. Se ejecuta **en orden** contra la API local (\`bash scripts/levantar-local.sh\`).\n\n` +
    `1. En Thunder Client → *Env* → menú → *Import*: \`mentelyx-local.thunder-environment.json\`. Elegir el entorno «Mentelyx local». Cambiar \`correo\` y \`correo2\` por correos nuevos (@ejemplo.test) en cada corrida.\n` +
    `2. *Collections* → menú → *Import*: \`mentelyx-api.thunder-collection.json\`. Si la versión instalada no permite importar, crear cada solicitud con la tabla de abajo (las cabeceras usan las mismas variables).\n` +
    `3. Ejecutar la colección con *Run All* o solicitud por solicitud. Thunder Client conserva la cookie de sesión HttpOnly; el token CSRF se guarda en \`{{csrf}}\` con la prueba «set-env-var» de las solicitudes «Obtener token CSRF».\n\n` +
    `Las mutaciones exigen \`Origin\` permitido y \`X-CSRF-Token\`; las de creación, \`Idempotency-Key\` (\`{{#number}}\` genera una distinta en cada envío). Cada solicitud incluye una prueba del código HTTP esperado.\n\n` +
    `**Estado de ejecución:** generado y verificado como contrato por \`scripts/thunder/verificar-coleccion.mjs\`, que ejecuta las mismas solicitudes con Node. La ejecución gráfica en Thunder Client la realiza el propietario y no se declara ejecutada aquí.\n\n` +
    `| # | Grupo | Método y ruta | Cabeceras | Cuerpo | Precondición | HTTP | RF / ADR | EQ |\n|---|---|---|---|---|---|---|---|---|\n` +
    S.map(fila).join('\n') +
    '\n',
);
console.log(`${requests.length} solicitudes en ${CARPETAS.length} grupos → ${SAL}`);
export { S };
