import { MongoClient, type Db } from 'mongodb';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { validarBloque } from '@mentelyx/contratos/educacion/bloque-validacion';
import { crearApp, EntornoApp } from '../app';
import { MemoriaAlmacenObjetos } from '../modules/cursos-contenidos';
import { asegurarIndicesBancos } from '../modules/evaluaciones-aprendizaje';
import { asegurarIndicesConversaciones } from '../modules/tutor-ia-rag';
import type { ProveedorIaPort, RutaIa } from '../modules/tutor-ia-rag/dominio/tutor';
import { crearConexionBd, type ConexionBd } from '../shared/bd/conexion';

// Integración Full Stack de Mentelyx V1 (26/11/2026) sobre la aplicación completa: Better Auth real, PostgreSQL y
// MongoDB reales (Docker Compose), R2 en memoria. El Tutor usa un DOBLE de proveedor (no Workers AI): estas pruebas
// verifican persistencia, validación y autorización, no la calidad pedagógica del modelo. Datos ficticios.
const base = {
  ENTORNO: 'ci',
  DATABASE_URL: process.env.DATABASE_URL!,
  NEON_WS_PROXY: process.env.NEON_WS_PROXY,
  AUTH_SECRET: 'secreto-solo-para-pruebas-de-integracion-0123456789',
  AUTH_URL: 'http://localhost',
  MONGODB_URL: process.env.MONGODB_URL!,
  MONGODB_DB: 'mentelyx_pruebas',
};
let conexion: ConexionBd;
let mongo: MongoClient;
let db: Db;
const almacen = new MemoriaAlmacenObjetos();
let reloj = new Date('2026-11-26T15:00:00.000Z');

const ruta: RutaIa = { id: 'explicacion.general', version: 'prueba', proveedor: 'doble-v1', modelo: 'doble', etiqueta: 'Doble de prueba', maxTokensSalida: 500, precio: { entradaUsdPorM: 0, salidaUsdPorM: 0, verificado: 'prueba' } };
const SECCION = JSON.stringify({
  bloques: [
    { tipo: 'pasos', titulo: 'Derivar x²', pasos: [{ titulo: 'Regla de la potencia', texto: 'Baja el exponente', latex: '\\frac{d}{dx}x^n = n x^{n-1}' }, { titulo: 'Aplica', texto: 'Con n = 2', latex: '2x' }] },
    { tipo: 'grafico', titulo: 'f(x) = x²', funciones: ['x^2'], vista: { xMin: -3, xMax: 3, yMin: -1, yMax: 9 } },
    { tipo: 'grafico', funciones: ['fetch("x")'] },
  ],
  acciones: [{ accion: 'revelar-paso', bloque: 1, paso: '@siguiente' }],
});
const proveedor: ProveedorIaPort = {
  proveedor: 'doble-v1',
  rutaPara: () => ({ ruta, estandar: ruta }),
  estimarEntrada: () => 100,
  responder: async () => ({ markdown: `La derivada de $x^2$ es $2x$ [[c1]].\n\n\`\`\`mentelyx\n${SECCION}\n\`\`\``, tokensEntrada: 100, tokensSalida: 40, costoUsd: 0, latenciaMs: 3, finalizacion: 'stop' }),
};

type R = { estado: number; cuerpo: { ok: boolean; data: any; error?: { code: string; details?: any } }; cookies: string; cabeceras: Headers }; // eslint-disable-line @typescript-eslint/no-explicit-any
async function pedir(rutaApi: string, init: RequestInit & { cookie?: string; clave?: string; sinCsrf?: boolean } = {}): Promise<R> {
  const tareas: Promise<unknown>[] = [];
  const { app } = crearApp(EntornoApp.parse(base), conexion, {
    almacen,
    mongo: async () => db,
    segundoPlano: (t) => tareas.push(t),
    limiteTasa: { consumir: async () => ({ permitido: true as const }) },
    proveedorIa: proveedor,
    embeddings: null,
    ahora: () => reloj,
  });
  const headers = new Headers(init.headers);
  headers.set('content-type', 'application/json');
  headers.set('cf-connecting-ip', '198.51.100.77');
  if (init.cookie) headers.set('cookie', init.cookie);
  if (init.clave) headers.set('idempotency-key', init.clave);
  if (!headers.has('origin') && !init.sinCsrf) headers.set('origin', 'http://localhost');
  if (!['GET', 'HEAD', 'OPTIONS'].includes(init.method ?? 'GET') && !init.sinCsrf) {
    const csrf = await app.request('http://localhost/api/v1/auth/csrf', { headers });
    const token = (await csrf.json()) as { data: { token: string } };
    const previa = csrf.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    if (previa) headers.set('cookie', [headers.get('cookie'), previa].filter(Boolean).join('; '));
    headers.set('x-csrf-token', token.data.token);
  }
  const r = await app.fetch(new Request(`http://localhost/api/v1${rutaApi}`, { ...init, headers }));
  await Promise.all(tareas);
  return { estado: r.status, cuerpo: (await r.json()) as R['cuerpo'], cookies: r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; '), cabeceras: r.headers };
}
const json = (metodo: string, cuerpo: unknown, cookie: string, clave?: string) => ({ method: metodo, body: JSON.stringify(cuerpo), cookie, ...(clave ? { clave } : {}) });
const clave = () => `k${crypto.randomUUID().replaceAll('-', '')}`;

async function registrar(nombre: string) {
  const correo = `v1-${crypto.randomUUID().slice(0, 8)}@ejemplo.test`;
  const r = await pedir('/auth/registro', { method: 'POST', body: JSON.stringify({ nombre, correo, contrasena: 'clave-ficticia-123' }) });
  expect(r.estado).toBe(201);
  return { cookie: r.cookies, correo, id: r.cuerpo.data.usuarioId as string };
}

let A: Awaited<ReturnType<typeof registrar>>;
let B: Awaited<ReturnType<typeof registrar>>;
const ids: Record<string, string> = {};

beforeAll(async () => {
  conexion = crearConexionBd({ DATABASE_URL: base.DATABASE_URL, NEON_WS_PROXY: base.NEON_WS_PROXY });
  mongo = new MongoClient(base.MONGODB_URL);
  await mongo.connect();
  db = mongo.db(base.MONGODB_DB);
  await asegurarIndicesConversaciones(db);
  await asegurarIndicesBancos(db);
  A = await registrar('Ana Ficticia');
  B = await registrar('Beto Ficticio');
});
afterAll(async () => {
  await mongo.close();
  await conexion.cerrar();
});

describe('Flujo A · aprendizaje libre con carpetas, fuentes, Tutor y estado guardado', () => {
  it('sesión con nombre y correo; carpetas con unicidad, profundidad y separación por módulo', async () => {
    const s = await pedir('/auth/sesion', { cookie: A.cookie });
    expect(s.cuerpo.data).toMatchObject({ usuarioId: A.id, nombre: 'Ana Ficticia', correo: A.correo, correoVerificado: false });

    const fisica = await pedir('/carpetas', json('POST', { modulo: 'APRENDIZAJE', nombre: 'Física' }, A.cookie, clave()));
    expect(fisica.estado).toBe(201);
    ids.carpeta = fisica.cuerpo.data.id;
    expect((await pedir('/carpetas', json('POST', { modulo: 'APRENDIZAJE', nombre: 'FÍSICA'.toLowerCase() }, A.cookie, clave()))).cuerpo.error?.code).toBe('NOMBRE_DUPLICADO');
    // Mismo nombre en Exámenes: módulos independientes.
    expect((await pedir('/carpetas', json('POST', { modulo: 'EXAMENES', nombre: 'Física' }, A.cookie, clave()))).estado).toBe(201);
    const n2 = await pedir('/carpetas', json('POST', { modulo: 'APRENDIZAJE', nombre: 'Mecánica', padreId: ids.carpeta }, A.cookie, clave()));
    const n3 = await pedir('/carpetas', json('POST', { modulo: 'APRENDIZAJE', nombre: 'Cinemática', padreId: n2.cuerpo.data.id }, A.cookie, clave()));
    expect(n3.estado).toBe(201);
    expect((await pedir('/carpetas', json('POST', { modulo: 'APRENDIZAJE', nombre: 'Nivel 4', padreId: n3.cuerpo.data.id }, A.cookie, clave()))).estado).toBe(400);
    // Ciclo: mover «Física» dentro de su nieta.
    expect((await pedir(`/carpetas/${ids.carpeta}`, json('PATCH', { padreId: n3.cuerpo.data.id }, A.cookie))).estado).toBe(400);
    const lista = await pedir('/carpetas?modulo=APRENDIZAJE&estado=ACTIVA', { cookie: A.cookie });
    expect(lista.cuerpo.data.map((c: { nombre: string }) => c.nombre)).toEqual(expect.arrayContaining(['Física', 'Mecánica', 'Cinemática']));
    expect(lista.cuerpo.data.every((c: { modulo: string }) => c.modulo === 'APRENDIZAJE')).toBe(true);
    ids.cinematica = n3.cuerpo.data.id;
  });

  it('tema con fuente, sesión del Tutor con bloques validados en el servidor y ambos dentro de la carpeta', async () => {
    const tema = await pedir('/espacios', json('POST', { titulo: 'Derivadas' }, A.cookie));
    ids.tema = tema.cuerpo.data.id;
    const fuente = await pedir(`/espacios/${ids.tema}/fuentes`, json('POST', { titulo: 'Apuntes', formato: 'TXT', contenido: 'La derivada de x al cuadrado es 2x por la regla de la potencia.' }, A.cookie, clave()));
    expect(fuente.estado).toBe(202);
    expect((await pedir(`/carpetas/${ids.carpeta}/elementos/${ids.tema}`, json('PUT', { tipo: 'TEMA' }, A.cookie))).estado).toBe(200);

    const conv = await pedir('/tutor-ia/conversaciones', json('POST', { contexto: { superficie: 'TUTOR', espacioId: ids.tema } }, A.cookie));
    ids.conv = conv.cuerpo.data.id;
    const r = await pedir('/tutor-ia/consultas', json('POST', { conversacionId: ids.conv, pregunta: '¿Cuál es la derivada de x al cuadrado?' }, A.cookie, clave()));
    expect(r.estado).toBe(200);
    const d = r.cuerpo.data;
    expect(d.segmentos[0].markdown).not.toContain('```mentelyx'); // la sección nunca llega como texto
    expect(d.bloques.map((b: { tipo: string }) => b.tipo)).toEqual(['pasos', 'grafico']); // el gráfico con fetch() se descarta
    for (const b of d.bloques) expect(validarBloque(b).ok).toBe(true);
    expect(d.acciones).toEqual([{ accion: 'revelar-paso', bloqueId: d.bloques[0].id, paso: '@siguiente' }]);
    expect(d.avisos).toEqual(expect.arrayContaining([expect.stringContaining('no superó la validación')]));
    ids.bloque = d.bloques[0].id;

    expect((await pedir(`/carpetas/${ids.carpeta}/elementos/${ids.conv}`, json('PUT', { tipo: 'SESION' }, A.cookie))).estado).toBe(200);
    const elementos = await pedir(`/carpetas/${ids.carpeta}/elementos`, { cookie: A.cookie });
    expect(elementos.cuerpo.data.map((e: { tipo: string }) => e.tipo).sort()).toEqual(['SESION', 'TEMA']);
    // Una carpeta de Exámenes no admite temas.
    const examenes = await pedir('/carpetas?modulo=EXAMENES&estado=ACTIVA', { cookie: A.cookie });
    ids.carpetaExamenes = examenes.cuerpo.data[0].id;
    expect((await pedir(`/carpetas/${ids.carpetaExamenes}/elementos/${ids.tema}`, json('PUT', { tipo: 'TEMA' }, A.cookie))).estado).toBe(400);
  });

  it('el estado de la sesión se guarda con control de versión y persiste en una app nueva', async () => {
    const estado = { interaccion: { [ids.bloque!]: { revelados: 2, resaltado: 'p1', seleccion: null, parametros: {}, vista: null, referencia: null } }, anotaciones: [{ id: 'n1', bloqueId: ids.bloque!, tipo: 'NOTA', texto: 'Repasar la regla', creadaEn: reloj.toISOString() }] };
    const v0 = await pedir(`/tutor-ia/conversaciones/${ids.conv}/estado`, { cookie: A.cookie });
    expect(v0.cuerpo.data.version).toBe(0);
    const sinIfMatch = await pedir(`/tutor-ia/conversaciones/${ids.conv}/estado`, json('PUT', estado, A.cookie));
    expect(sinIfMatch.estado).toBe(400);
    const g1 = await pedir(`/tutor-ia/conversaciones/${ids.conv}/estado`, { ...json('PUT', estado, A.cookie), headers: { 'if-match': '"0"' } });
    expect(g1.estado).toBe(200);
    expect(g1.cuerpo.data.version).toBe(1);
    const otraPestana = await pedir(`/tutor-ia/conversaciones/${ids.conv}/estado`, { ...json('PUT', estado, A.cookie), headers: { 'if-match': '"0"' } });
    expect(otraPestana.cuerpo.error?.code).toBe('CONFLICTO_VERSION');
    expect(otraPestana.estado).toBe(412);
    // «Reinicio»: cada petición crea una app nueva (como un isolate de Workers); los datos salen de Mongo.
    const leido = await pedir(`/tutor-ia/conversaciones/${ids.conv}/estado`, { cookie: A.cookie });
    expect(leido.cuerpo.data).toMatchObject({ version: 1, interaccion: estado.interaccion, anotaciones: estado.anotaciones });
    const conv = await pedir(`/tutor-ia/conversaciones/${ids.conv}`, { cookie: A.cookie });
    const respuesta = conv.cuerpo.data.listaMensajes.find((m: { rol: string }) => m.rol === 'assistant');
    expect(respuesta.bloques).toHaveLength(2);
    expect(respuesta.ruta).toMatchObject({ proveedor: 'doble-v1', etiqueta: 'Doble de prueba' });
  });

  it('un PDF (texto extraído por página en el navegador) se indexa y el Tutor lo cita; otra cuenta no puede usarlo', async () => {
    const tema = await pedir('/espacios', json('POST', { titulo: 'Química (PDF)' }, A.cookie));
    const texto = '[Página 1]\nEl metano es un hidrocarburo con fórmula CH4.\n\n[Página 2]\nSu geometría molecular es tetraédrica, con ángulos de 109,5 grados.';
    const f = await pedir(`/espacios/${tema.cuerpo.data.id}/fuentes`, json('POST', { titulo: 'Apuntes de química.pdf', formato: 'PDF', contenido: texto }, A.cookie, clave()));
    expect(f.estado).toBe(202);
    const detalle = await pedir(`/espacios/${tema.cuerpo.data.id}`, { cookie: A.cookie });
    expect(detalle.cuerpo.data.listaFuentes[0]).toMatchObject({ formato: 'PDF', estadoLectura: 'LISTA' });
    const conv = await pedir('/tutor-ia/conversaciones', json('POST', { contexto: { superficie: 'TUTOR', espacioId: tema.cuerpo.data.id } }, A.cookie));
    const r = await pedir('/tutor-ia/consultas', json('POST', { conversacionId: conv.cuerpo.data.id, pregunta: '¿Cuál es la geometría molecular del metano?', fuentes: { espacioId: tema.cuerpo.data.id, exclusivas: true } }, A.cookie, clave()));
    expect(r.cuerpo.data.modoFuentes).toBe('FUNDAMENTADA');
    expect(r.cuerpo.data.citas[0]).toMatchObject({ recursoId: f.cuerpo.data.contentId, tipoFuente: 'PRIVADO' });
    expect(r.cuerpo.data.citas[0].fragmento).toMatch(/tetraédrica|metano/);
    // B no puede consultar con la fuente de A.
    const convB = await pedir('/tutor-ia/conversaciones', json('POST', { contexto: { superficie: 'TUTOR' } }, B.cookie));
    const ajena = await pedir('/tutor-ia/consultas', json('POST', { conversacionId: convB.cuerpo.data.id, pregunta: 'metano', fuentes: { espacioId: tema.cuerpo.data.id } }, B.cookie, clave()));
    expect(ajena.estado).toBe(404);
  });
});

const PREGUNTAS = [
  { id: 'p1', version: 1, tipo: 'opcion-unica', tema: 'Derivadas', dificultad: 'basica', enunciado: '¿Derivada de x²?', origen: 'material', procedencia: 'Libro inventado', opciones: [{ id: 'a', texto: '2x' }, { id: 'b', texto: 'x' }], correcta: 'a' },
  { id: 'p2', version: 1, tipo: 'verdadero-falso', tema: 'Derivadas', dificultad: 'basica', enunciado: 'La derivada de una constante es 0.', origen: 'persona', correcta: true },
  { id: 'p3', version: 1, tipo: 'numerica', tema: 'Límites', dificultad: 'media', enunciado: 'lím x→2 de x²', origen: 'persona', respuesta: 4, tolerancia: { tipo: 'absoluta', valor: 0.01 } },
  { id: 'p4', version: 1, tipo: 'relacion', tema: 'Límites', dificultad: 'media', enunciado: 'Relaciona', origen: 'persona', pares: [{ id: 'r1', izquierda: 'sen', derecha: 'cos' }, { id: 'r2', izquierda: 'eˣ', derecha: 'e elevado a x' }, { id: 'r3', izquierda: 'ln x', derecha: '1/x' }] },
  { id: 'p5', version: 1, tipo: 'ordenamiento', tema: 'Límites', dificultad: 'basica', enunciado: 'Ordena', origen: 'persona', elementos: [{ id: 'e1', texto: 'uno' }, { id: 'e2', texto: 'dos' }, { id: 'e3', texto: 'tres' }], orden: ['e1', 'e2', 'e3'] },
  { id: 'p6', version: 1, tipo: 'abierta', tema: 'Derivadas', dificultad: 'avanzada', enunciado: 'Explica la regla de la cadena', origen: 'persona', criterios: ['Menciona la composición'] },
  { id: 'malo', version: 1, tipo: 'opcion-unica', tema: 'X', dificultad: 'basica', enunciado: 'Sin la correcta', origen: 'persona', opciones: [{ id: 'a', texto: 'a' }, { id: 'b', texto: 'b' }], correcta: 'z' },
];

describe('Flujo B · preparación de exámenes con banco, intentos y calificación oficial', () => {
  it('dos preparaciones conviven con nombre, asignatura y carpeta; el temario conserva el avance', async () => {
    const cuerpo = (nombre: string, asignatura: string) => ({ nombre, asignatura, fechaExamen: '2026-12-20', carpetaId: ids.carpetaExamenes, fuente: 'PERSONAL', minutosSemanales: 180, temas: [{ areaCodigo: 'MATE', temaCodigo: 'T01', titulo: 'Derivadas' }, { areaCodigo: 'MATE', temaCodigo: 'T02', titulo: 'Límites' }] });
    const k1 = clave();
    const p1 = await pedir('/preparaciones', json('POST', cuerpo('Parcial de Cálculo', 'Cálculo I'), A.cookie, k1));
    expect(p1.estado).toBe(201);
    expect((await pedir('/preparaciones', json('POST', cuerpo('Parcial de Cálculo', 'Cálculo I'), A.cookie, k1))).estado).toBe(200); // reintento idempotente
    const p2 = await pedir('/preparaciones', json('POST', cuerpo('Final de Física', 'Física'), A.cookie, clave()));
    ids.prep = p1.cuerpo.data.id;
    const lista = await pedir('/preparaciones', { cookie: A.cookie });
    const mias = lista.cuerpo.data.filter((p: { id: string }) => [ids.prep, p2.cuerpo.data.id].includes(p.id));
    expect(mias).toHaveLength(2);
    expect(mias.every((p: { estado: string; carpetaId: string }) => p.estado === 'ACTIVA' && p.carpetaId === ids.carpetaExamenes)).toBe(true);
    expect(mias.map((p: { asignatura: string }) => p.asignatura).sort()).toEqual(['Cálculo I', 'Física']);

    const plan = await pedir(`/preparaciones/${ids.prep}/plan`, { cookie: A.cookie });
    const leccion = plan.cuerpo.data.actividades.find((a: { temaCodigo: string; tipo: string }) => a.temaCodigo === 'T01' && a.tipo === 'LECCION');
    expect((await pedir(`/preparaciones/${ids.prep}/plan/actividades/${leccion.id}/completar`, { method: 'POST', cookie: A.cookie })).cuerpo.data.estado).toBe('COMPLETADA');
    const temario = await pedir(`/preparaciones/${ids.prep}/temario`, json('PUT', { temas: [{ id: 'T01', titulo: 'Derivadas' }, { titulo: 'Integrales' }] }, A.cookie));
    expect(temario.cuerpo.data.version).toBe(2);
    const t01 = temario.cuerpo.data.actividades.find((a: { temaCodigo: string; tipo: string }) => a.temaCodigo === 'T01' && a.tipo === 'LECCION');
    expect(t01.estado).toBe('COMPLETADA');
    expect(temario.cuerpo.data.actividades.map((a: { titulo: string }) => a.titulo)).toEqual(expect.arrayContaining(['Estudiar: Integrales']));
  });

  it('el banco valida mentelyx.pregunta/v1 en el servidor, versiona y nunca devuelve soluciones', async () => {
    const r = await pedir(`/preparaciones/${ids.prep}/preguntas`, json('POST', { preguntas: PREGUNTAS }, A.cookie, clave()));
    expect(r.estado).toBe(201);
    expect(r.cuerpo.data).toMatchObject({ version: 1, agregadas: 6 });
    expect(r.cuerpo.data.rechazadas[0].id).toBe('malo');
    const banco = await pedir(`/preparaciones/${ids.prep}/preguntas`, { cookie: A.cookie });
    const texto = JSON.stringify(banco.cuerpo.data.preguntas);
    for (const campo of ['"correcta"', '"respuesta"', '"orden"', '"tolerancia"']) expect(texto).not.toContain(campo);
    expect(banco.cuerpo.data.preguntas.every((p: { origen: string }) => p.origen === 'persona')).toBe(true); // el servidor decide el origen
    expect(texto).not.toContain('Libro inventado');
  });

  it('simulacro: hora del servidor, respuestas guardadas, calificación única aunque haya entregas concurrentes', async () => {
    const inicio = await pedir(`/preparaciones/${ids.prep}/intentos`, json('POST', { modo: 'SIMULACRO', preguntaIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'], minutos: 30 }, A.cookie, clave()));
    expect(inicio.estado).toBe(201);
    const intento = inicio.cuerpo.data.intento;
    ids.intento = intento.id;
    expect(new Date(intento.venceEn).getTime() - new Date(intento.iniciadoEn).getTime()).toBe(30 * 60_000);
    expect(JSON.stringify(inicio.cuerpo.data.preguntas)).not.toContain('"correcta"');
    // Relación: elegir, para cada izquierda, el par cuya «derecha» mostrada es la verdadera.
    const relacion = inicio.cuerpo.data.preguntas.find((p: { id: string }) => p.id === 'p4');
    const verdadera = Object.fromEntries(PREGUNTAS[3]!.pares!.map((x) => [x.id, x.derecha]));
    const asignacion = Object.fromEntries(relacion.pares.map((izq: { id: string }) => [izq.id, relacion.pares.find((d: { derecha: string }) => d.derecha === verdadera[izq.id])!.id]));
    const respuestas: Record<string, unknown> = {
      p1: { tipo: 'opcion', id: 'a' },
      p2: { tipo: 'booleano', valor: false },
      p3: { tipo: 'texto', valor: '4' },
      p4: { tipo: 'pares', asignacion },
      p5: { tipo: 'orden', ids: ['e1', 'e3', 'e2'] },
      p6: { tipo: 'texto', valor: 'La derivada de una composición...' },
    };
    for (const [id, respuesta] of Object.entries(respuestas)) {
      const g = await pedir(`/intentos/${ids.intento}/respuestas/${id}`, json('PUT', { respuesta, comprobar: true }, A.cookie));
      expect(g.estado).toBe(200);
      expect(g.cuerpo.data.correccion).toBeNull(); // en simulacro no se revela nada antes de entregar
    }
    reloj = new Date(reloj.getTime() + 10 * 60_000);
    const entregas = await Promise.all([1, 2, 3, 4].map(() => pedir(`/intentos/${ids.intento}/entrega`, { method: 'POST', cookie: A.cookie, clave: clave() })));
    expect(entregas.every((e) => e.estado === 200)).toBe(true);
    const puntajes = new Set(entregas.map((e) => e.cuerpo.data.intento.puntaje));
    expect(puntajes.size).toBe(1);
    // p1 1 + p2 0 + p3 1 + p4 1 + p5 1/3 (e1 en su lugar) = 3,3333; p6 abierta PENDIENTE fuera del máximo.
    expect(entregas[0]!.cuerpo.data.intento).toMatchObject({ estado: 'CALIFICADO', maximo: 5, pendientes: 1, fueraDeTiempo: false });
    expect(entregas[0]!.cuerpo.data.intento.puntaje).toBeCloseTo(3.3333, 3);
    const revisada = entregas[0]!.cuerpo.data.resultados.preguntas.find((x: { preguntaId: string }) => x.preguntaId === 'p1');
    expect(revisada.pregunta.correcta).toBe('a'); // tras entregar, la solución sí se muestra
    const tarde = await pedir(`/intentos/${ids.intento}/respuestas/p2`, json('PUT', { respuesta: { tipo: 'booleano', valor: true } }, A.cookie));
    expect(tarde.cuerpo.error?.code).toBe('INTENTO_CERRADO');
  });

  it('el plazo lo controla el servidor; práctica revela y bloquea solo lo comprobado; historial y rendimiento', async () => {
    const s = await pedir(`/preparaciones/${ids.prep}/intentos`, json('POST', { modo: 'SIMULACRO', preguntaIds: ['p1'], minutos: 5 }, A.cookie, clave()));
    reloj = new Date(reloj.getTime() + 6 * 60_000);
    const vencida = await pedir(`/intentos/${s.cuerpo.data.intento.id}/respuestas/p1`, json('PUT', { respuesta: { tipo: 'opcion', id: 'a' } }, A.cookie));
    expect(vencida.cuerpo.error?.code).toBe('INTENTO_CERRADO');
    const fuera = await pedir(`/intentos/${s.cuerpo.data.intento.id}/entrega`, { method: 'POST', cookie: A.cookie, clave: clave() });
    expect(fuera.cuerpo.data.intento).toMatchObject({ fueraDeTiempo: true, puntaje: 0 });

    const p = await pedir(`/preparaciones/${ids.prep}/intentos`, json('POST', { modo: 'PRACTICA', preguntaIds: ['p3'] }, A.cookie, clave()));
    const pid = p.cuerpo.data.intento.id;
    const comprobada = await pedir(`/intentos/${pid}/respuestas/p3`, json('PUT', { respuesta: { tipo: 'texto', valor: '5' }, comprobar: true }, A.cookie));
    expect(comprobada.cuerpo.data.correccion.estado).toBe('incorrecta');
    expect(comprobada.cuerpo.data.pregunta.respuesta).toBe(4);
    const cambio = await pedir(`/intentos/${pid}/respuestas/p3`, json('PUT', { respuesta: { tipo: 'texto', valor: '4' } }, A.cookie));
    expect(cambio.cuerpo.error?.code).toBe('INTENTO_CERRADO');
    const recuperado = await pedir(`/intentos/${pid}`, { cookie: A.cookie });
    expect(recuperado.cuerpo.data.respuestas.p3).toEqual({ tipo: 'texto', valor: '5' });

    const historial = await pedir(`/preparaciones/${ids.prep}/intentos`, { cookie: A.cookie });
    expect(historial.cuerpo.data.length).toBeGreaterThanOrEqual(3);
    const seg = await pedir(`/preparaciones/${ids.prep}/seguimiento`, { cookie: A.cookie });
    expect(seg.cuerpo.data.rendimiento.intentos).toBe(2);
    expect(seg.cuerpo.data.rendimiento.porTema.map((t: { tema: string }) => t.tema).sort()).toEqual(['Derivadas', 'Límites']);
    expect(seg.cuerpo.data.rendimiento.criterio).toContain('no es una predicción');
  });

  it('tarjetas con repetición espaciada calculada por el servidor e idempotente', async () => {
    const t = await pedir(`/preparaciones/${ids.prep}/tarjetas`, json('POST', { tema: 'Derivadas', anverso: 'd/dx sen x', reverso: 'cos x' }, A.cookie, clave()));
    expect(t.estado).toBe(201);
    const k = clave();
    const r1 = await pedir(`/tarjetas/${t.cuerpo.data.tarjeta.id}/revisiones`, json('POST', { calificacion: 'BIEN' }, A.cookie, k));
    const r2 = await pedir(`/tarjetas/${t.cuerpo.data.tarjeta.id}/revisiones`, json('POST', { calificacion: 'BIEN' }, A.cookie, k));
    expect(r1.cuerpo.data.tarjeta).toMatchObject({ intervaloDias: 1, repeticiones: 1 });
    expect(r2.cuerpo.data).toMatchObject({ repetida: true, tarjeta: { repeticiones: 1 } });
    const lista = await pedir(`/preparaciones/${ids.prep}/tarjetas`, { cookie: A.cookie });
    expect(lista.cuerpo.data.regla).toBe('sm2-mentelyx-v1');
  });
});

describe('Flujo C · aislamiento entre cuentas y seguridad de la cuenta', () => {
  it('otra cuenta no consulta ni modifica recursos ajenos (404) y sin sesión es 401', async () => {
    const intentos: Array<[string, RequestInit & { cookie: string }]> = [
      [`/preparaciones/${ids.prep}`, { cookie: B.cookie }],
      [`/preparaciones/${ids.prep}/preguntas`, { cookie: B.cookie }],
      [`/preparaciones/${ids.prep}/plan`, { cookie: B.cookie }],
      [`/intentos/${ids.intento}`, { cookie: B.cookie }],
      [`/intentos/${ids.intento}/respuestas/p1`, json('PUT', { respuesta: { tipo: 'opcion', id: 'a' } }, B.cookie)],
      [`/carpetas/${ids.carpeta}/elementos`, { cookie: B.cookie }],
      [`/carpetas/${ids.carpeta}`, json('PATCH', { nombre: 'Hackeada' }, B.cookie)],
      [`/tutor-ia/conversaciones/${ids.conv}/estado`, { cookie: B.cookie }],
      [`/preparaciones/${ids.prep}/temario`, json('PUT', { temas: [{ titulo: 'X' }] }, B.cookie)],
    ];
    for (const [rutaApi, init] of intentos) {
      const r = await pedir(rutaApi, init);
      expect(r.estado, rutaApi).toBe(404);
    }
    const propia = await pedir('/carpetas', json('POST', { modulo: 'APRENDIZAJE', nombre: 'Mía' }, B.cookie, clave()));
    expect((await pedir(`/carpetas/${propia.cuerpo.data.id}/elementos/${ids.tema}`, json('PUT', { tipo: 'TEMA' }, B.cookie))).estado).toBe(404);
    expect((await pedir('/tutor-ia/conversaciones', json('POST', { contexto: { superficie: 'TUTOR', preparacionId: ids.prep } }, B.cookie))).estado).toBe(404);
    expect((await pedir('/preparaciones', { cookie: B.cookie })).cuerpo.data).toEqual([]);
    expect((await pedir('/preparaciones', {})).estado).toBe(401);
    expect((await pedir('/carpetas?modulo=APRENDIZAJE', {})).estado).toBe(401);
    // Mutación sin Origin ni token CSRF: 403 antes de cualquier efecto.
    expect((await pedir('/carpetas', { ...json('POST', { modulo: 'APRENDIZAJE', nombre: 'Sin CSRF' }, A.cookie, clave()), sinCsrf: true })).estado).toBe(403);
  });

  it('perfil, preferencias, sesiones y cambio de contraseña que revoca las demás sesiones', async () => {
    expect((await pedir('/cuenta/me', { cookie: A.cookie })).cuerpo.data).toMatchObject({ nombre: 'Ana Ficticia', tipoCuenta: 'ESTUDIANTE' });
    expect((await pedir('/cuenta/me', json('PATCH', { nombre: 'Ana F.' }, A.cookie))).cuerpo.data.nombre).toBe('Ana F.');
    const pref = await pedir('/cuenta/me/preferencias', json('PUT', { profundidad: 'inicial', herramientasVisuales: ['grafico', 'pasos', 'grafico'], idioma: 'es' }, A.cookie));
    expect(pref.cuerpo.data.herramientasVisuales).toEqual(['grafico', 'pasos']);
    expect((await pedir('/cuenta/me/preferencias', { cookie: B.cookie })).cuerpo.data.profundidad).toBeNull(); // B no ve las de A

    const otra = await pedir('/auth/login', { method: 'POST', body: JSON.stringify({ correo: A.correo, contrasena: 'clave-ficticia-123' }) });
    const sesiones = await pedir('/auth/sesiones', { cookie: A.cookie });
    expect(sesiones.cuerpo.data.length).toBeGreaterThanOrEqual(2);
    expect(JSON.stringify(sesiones.cuerpo.data)).not.toMatch(/token/i);
    const mal = await pedir('/auth/contrasena/cambio', json('POST', { actual: 'no-es-esta', nueva: 'clave-ficticia-456' }, A.cookie));
    expect(mal.estado).toBe(400);
    const bien = await pedir('/auth/contrasena/cambio', json('POST', { actual: 'clave-ficticia-123', nueva: 'clave-ficticia-456' }, A.cookie));
    expect(bien.estado).toBe(200);
    const nuevaCookie = bien.cookies || A.cookie;
    expect((await pedir('/auth/sesion', { cookie: otra.cookies })).estado).toBe(401); // la otra sesión quedó revocada
    expect((await pedir('/auth/sesion', { cookie: nuevaCookie })).estado).toBe(200);
    expect((await pedir('/auth/sesiones/no-existe', { method: 'DELETE', cookie: nuevaCookie })).estado).toBe(404);
  });
});
