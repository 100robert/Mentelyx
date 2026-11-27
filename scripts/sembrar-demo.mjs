#!/usr/bin/env node
// Datos de DEMOSTRACIÓN de Mentelyx V1 creados por la API real (mismas validaciones, autorización e idempotencia que
// la interfaz). Cuentas y contenidos ficticios (@ejemplo.test); nunca datos de personas reales.
//   node scripts/sembrar-demo.mjs [http://127.0.0.1:8787]
// Repetirlo no duplica: si la cuenta existe, inicia sesión; las carpetas, temas y preparaciones ya creados se reutilizan.
const BASE = (process.argv[2] ?? 'http://127.0.0.1:8787').replace(/\/$/, '');
const ORIGEN = new URL(BASE).origin;
const CONTRASENA = process.env.DEMO_CONTRASENA ?? 'Demo-Mentelyx-2026';

function cliente() {
  let cookie = '';
  const guardar = (r) => {
    const nuevas = r.headers.getSetCookie().map((c) => c.split(';')[0]);
    if (!nuevas.length) return;
    const mapa = new Map(cookie.split('; ').filter(Boolean).map((c) => [c.split('=')[0], c]));
    for (const c of nuevas) mapa.set(c.split('=')[0], c);
    cookie = [...mapa.values()].join('; ');
  };
  return async function api(ruta, { metodo = 'GET', cuerpo, clave } = {}) {
    const h = { origin: ORIGEN, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) };
    if (metodo !== 'GET') {
      const c = await fetch(`${BASE}/api/v1/auth/csrf`, { headers: h });
      guardar(c);
      h.cookie = cookie;
      h['x-csrf-token'] = (await c.json()).data.token;
    }
    if (clave) h['idempotency-key'] = clave;
    const r = await fetch(`${BASE}/api/v1${ruta}`, { method: metodo, headers: h, ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}) });
    guardar(r);
    const j = await r.json().catch(() => null);
    return { estado: r.status, datos: j?.data, error: j?.error };
  };
}

async function cuenta(nombre, correo) {
  const api = cliente();
  let r = await api('/auth/registro', { metodo: 'POST', cuerpo: { nombre, correo, contrasena: CONTRASENA } });
  if (r.estado !== 201) r = await api('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena: CONTRASENA } });
  if (r.estado >= 300) throw new Error(`No se pudo entrar como ${correo}: ${r.error?.code}`);
  return api;
}
const exigir = (r, que) => {
  if (r.estado >= 300) throw new Error(`${que}: ${r.estado} ${r.error?.code} ${r.error?.message ?? ''}`);
  return r.datos;
};

const APUNTES = `# Derivadas: idea y reglas básicas

La derivada de una función en un punto mide su tasa de cambio instantánea: es la pendiente de la recta tangente a la curva en ese punto.

Regla de la potencia: la derivada de x elevado a n es n por x elevado a (n − 1). Por ejemplo, la derivada de x² es 2x y la de x³ es 3x².

Regla de la constante: la derivada de una constante es cero, porque una constante no cambia.

Regla de la suma: la derivada de una suma es la suma de las derivadas.

Interpretación física: si la posición de un móvil es s(t), su velocidad es la derivada s'(t).`;

const PREGUNTAS = [
  { id: 'd1', tipo: 'opcion-unica', tema: 'Derivadas', dificultad: 'basica', enunciado: '¿Cuál es la derivada de f(x) = x³?', opciones: [{ id: 'a', texto: '3x²' }, { id: 'b', texto: 'x²' }, { id: 'c', texto: '3x' }, { id: 'd', texto: 'x⁴/4' }], correcta: 'a', explicacion: 'Regla de la potencia: n·xⁿ⁻¹ con n = 3.' },
  { id: 'd2', tipo: 'verdadero-falso', tema: 'Derivadas', dificultad: 'basica', enunciado: 'La derivada de una función constante es cero.', correcta: true, explicacion: 'Una constante no cambia: su tasa de cambio es 0.' },
  { id: 'd3', tipo: 'numerica', tema: 'Derivadas', dificultad: 'media', enunciado: 'Si f(x) = x², ¿cuánto vale f′(3)?', respuesta: 6, tolerancia: { tipo: 'absoluta', valor: 0.001 }, explicacion: 'f′(x) = 2x, así que f′(3) = 6.' },
  { id: 'd4', tipo: 'expresion', tema: 'Derivadas', dificultad: 'media', enunciado: 'Escribe la derivada de f(x) = 5x² + 3x.', respuesta: '10*x + 3', variables: ['x'], dominio: { min: -5, max: 5 }, prefijo: "f'(x) =", explicacion: 'Derivas cada término: 10x + 3.' },
  { id: 'd5', tipo: 'opcion-multiple', tema: 'Derivadas', dificultad: 'media', enunciado: '¿Cuáles de estas funciones tienen derivada 2x?', opciones: [{ id: 'a', texto: 'x²' }, { id: 'b', texto: 'x² + 7' }, { id: 'c', texto: '2x²' }, { id: 'd', texto: 'x² − 1' }], correctas: ['a', 'b', 'd'], explicacion: 'Las constantes sumadas desaparecen al derivar.' },
  { id: 'l1', tipo: 'numerica', tema: 'Límites', dificultad: 'basica', enunciado: 'Calcula el límite de 2x + 1 cuando x tiende a 4.', respuesta: 9, tolerancia: { tipo: 'absoluta', valor: 0.001 }, explicacion: 'La función es continua: basta sustituir x = 4.' },
  { id: 'l2', tipo: 'opcion-unica', tema: 'Límites', dificultad: 'media', enunciado: '¿Cuánto vale el límite de (x² − 1)/(x − 1) cuando x tiende a 1?', opciones: [{ id: 'a', texto: '0' }, { id: 'b', texto: '1' }, { id: 'c', texto: '2' }, { id: 'd', texto: 'No existe' }], correcta: 'c', explicacion: 'Factoriza: (x − 1)(x + 1)/(x − 1) = x + 1 → 2.' },
  { id: 'l3', tipo: 'relacion', tema: 'Límites', dificultad: 'media', enunciado: 'Relaciona cada límite con su valor.', pares: [{ id: 'p1', izquierda: 'lím x→0 de sen(x)/x', derecha: '1' }, { id: 'p2', izquierda: 'lím x→∞ de 1/x', derecha: '0' }, { id: 'p3', izquierda: 'lím x→2 de x³', derecha: '8' }] },
  { id: 'a1', tipo: 'ordenamiento', tema: 'Aplicaciones', dificultad: 'media', enunciado: 'Ordena los pasos para hallar los puntos críticos de una función.', elementos: [{ id: 'e1', texto: 'Derivar la función' }, { id: 'e2', texto: 'Igualar la derivada a cero' }, { id: 'e3', texto: 'Resolver la ecuación' }, { id: 'e4', texto: 'Evaluar la función en esos puntos' }], orden: ['e1', 'e2', 'e3', 'e4'] },
  { id: 'a2', tipo: 'numerica', tema: 'Aplicaciones', dificultad: 'avanzada', enunciado: 'La posición de un móvil es s(t) = t² + 2t (metros, segundos). ¿Cuál es su velocidad en t = 2 s?', respuesta: 6, tolerancia: { tipo: 'absoluta', valor: 0.01 }, unidad: 'm/s', explicacion: 's′(t) = 2t + 2 → s′(2) = 6 m/s.' },
  { id: 'a3', tipo: 'abierta', tema: 'Aplicaciones', dificultad: 'avanzada', enunciado: 'Explica con tus palabras qué significa que la derivada de una función sea negativa en un intervalo.', criterios: ['Relaciona el signo de la derivada con el crecimiento', 'Menciona que la función decrece en ese intervalo'], respuestaModelo: 'La función decrece en ese intervalo: al aumentar x, f(x) disminuye.' },
  {
    id: 'c1',
    tipo: 'caso',
    tema: 'Aplicaciones',
    dificultad: 'avanzada',
    enunciado: 'Analiza el caso y responde.',
    caso: 'Una empresa estima su costo como C(x) = x² + 10x + 50 soles, donde x es el número de unidades producidas.',
    preguntas: [
      { id: 's1', tipo: 'numerica', enunciado: '¿Cuál es el costo marginal C′(x) cuando x = 5?', respuesta: 20, tolerancia: { tipo: 'absoluta', valor: 0.01 }, unidad: 'soles/unidad' },
      { id: 's2', tipo: 'opcion-unica', enunciado: '¿Qué representa C′(x)?', opciones: [{ id: 'a', texto: 'El costo total' }, { id: 'b', texto: 'El costo de producir una unidad adicional, aproximadamente' }], correcta: 'b' },
    ],
  },
].map((p) => ({ version: 1, origen: 'persona', ...p }));

const clave = (s) => `demo-${s}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 100);

const ana = await cuenta('Ana Demo', 'demo.ana@ejemplo.test');
await cuenta('Beto Demo', 'demo.beto@ejemplo.test');

// Aprendizaje: carpeta, tema y fuente propia.
const carpetas = exigir(await ana('/carpetas?modulo=APRENDIZAJE&estado=ACTIVA'), 'carpetas');
const calculo = carpetas.find((c) => c.nombre === 'Cálculo') ?? exigir(await ana('/carpetas', { metodo: 'POST', cuerpo: { modulo: 'APRENDIZAJE', nombre: 'Cálculo' }, clave: clave('carpeta-calculo') }), 'crear carpeta');
const temas = exigir(await ana('/espacios'), 'temas');
const derivadas = temas.find((t) => t.titulo === 'Derivadas') ?? exigir(await ana('/espacios', { metodo: 'POST', cuerpo: { titulo: 'Derivadas' } }), 'crear tema');
const detalle = exigir(await ana(`/espacios/${derivadas.id}`), 'detalle tema');
if (!detalle.listaFuentes.length) exigir(await ana(`/espacios/${derivadas.id}/fuentes`, { metodo: 'POST', cuerpo: { titulo: 'Apuntes de derivadas', formato: 'MD', contenido: APUNTES }, clave: clave('fuente-derivadas') }), 'fuente');
exigir(await ana(`/carpetas/${calculo.id}/elementos/${derivadas.id}`, { metodo: 'PUT', cuerpo: { tipo: 'TEMA' } }), 'mover tema');

// Exámenes: carpeta, preparación con temario, banco y una tarjeta.
const cex = exigir(await ana('/carpetas?modulo=EXAMENES&estado=ACTIVA'), 'carpetas exámenes');
const ciclo = cex.find((c) => c.nombre === 'Ciclo 2026-II') ?? exigir(await ana('/carpetas', { metodo: 'POST', cuerpo: { modulo: 'EXAMENES', nombre: 'Ciclo 2026-II' }, clave: clave('carpeta-ciclo') }), 'carpeta exámenes');
const preps = exigir(await ana('/preparaciones'), 'preparaciones');
const fecha = new Date(Date.now() + 21 * 86_400_000).toISOString().slice(0, 10);
const prep =
  preps.find((p) => p.nombre === 'Parcial de Cálculo I') ??
  exigir(
    await ana('/preparaciones', {
      metodo: 'POST',
      clave: clave('prep-calculo'),
      cuerpo: {
        nombre: 'Parcial de Cálculo I',
        asignatura: 'Cálculo I',
        fechaExamen: fecha,
        carpetaId: ciclo.id,
        fuente: 'PERSONAL',
        minutosSemanales: 240,
        temas: [
          { areaCodigo: 'CALCULO-I', temaCodigo: 'T01', titulo: 'Límites' },
          { areaCodigo: 'CALCULO-I', temaCodigo: 'T02', titulo: 'Derivadas' },
          { areaCodigo: 'CALCULO-I', temaCodigo: 'T03', titulo: 'Aplicaciones' },
        ],
      },
    }),
    'crear preparación',
  );
const banco = exigir(await ana(`/preparaciones/${prep.id}/preguntas`), 'banco');
if (banco.total === 0) {
  const r = exigir(await ana(`/preparaciones/${prep.id}/preguntas`, { metodo: 'POST', cuerpo: { preguntas: PREGUNTAS }, clave: clave(`banco-${prep.id}`) }), 'banco');
  if (r.rechazadas.length) console.warn('Preguntas rechazadas por el servidor:', r.rechazadas);
}
const tarjetas = exigir(await ana(`/preparaciones/${prep.id}/tarjetas`), 'tarjetas');
if (!tarjetas.tarjetas.length) {
  for (const [k, t] of [['Regla de la potencia', 'd/dx xⁿ = n·xⁿ⁻¹'], ['Derivada de una constante', '0'], ['lím x→0 sen(x)/x', '1']].entries())
    exigir(await ana(`/preparaciones/${prep.id}/tarjetas`, { metodo: 'POST', cuerpo: { tema: k === 2 ? 'Límites' : 'Derivadas', anverso: t[0], reverso: t[1] }, clave: clave(`tarjeta-${prep.id}-${k}`) }), 'tarjeta');
}
const final = exigir(await ana(`/preparaciones/${prep.id}/preguntas`), 'banco final');
console.log(
  JSON.stringify(
    {
      cuentas: ['demo.ana@ejemplo.test', 'demo.beto@ejemplo.test'],
      contrasena: process.env.DEMO_CONTRASENA ? '(DEMO_CONTRASENA)' : 'Demo-Mentelyx-2026 (ficticia, solo local)',
      aprendizaje: { carpeta: calculo.nombre, tema: derivadas.titulo },
      examenes: { carpeta: ciclo.nombre, preparacion: prep.nombre, preguntas: final.total, versionBanco: final.version },
    },
    null,
    2,
  ),
);
