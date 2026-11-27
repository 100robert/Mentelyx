import { aplicarAccion, crearEstado } from '@mentelyx/contratos/educacion/bloque-acciones';
import { TIPOS } from '@mentelyx/contratos/educacion/bloque-esquema';
import { validarBloque } from '@mentelyx/contratos/educacion/bloque-validacion';
import { corregir } from '@mentelyx/contratos/educacion/pregunta-corregir';
import { validarPregunta, type Pregunta } from '@mentelyx/contratos/educacion/pregunta-esquema';

/** Contratos educativos compartidos por cliente y servidor: 14 tipos de bloque, 9 acciones y corrección de preguntas. */
const acc = (descripcion: string) => ({ descripcion });
const base = (id: string, tipo: string, orden: number) => ({ id, version: 1 as const, tipo, orden, origen: 'tutor' as const, accesibilidad: acc(`Bloque ${tipo}`) });
const BLOQUES: Record<string, unknown> = {
  texto: { ...base('b-texto', 'texto', 0), contenido: { markdown: 'Hola' } },
  formula: { ...base('b-formula', 'formula', 1), contenido: { latex: 'x^2' } },
  pasos: { ...base('b-pasos', 'pasos', 2), contenido: { pasos: [{ id: 'p1', titulo: 'Uno', texto: 'a' }, { id: 'p2', titulo: 'Dos', texto: 'b' }] } },
  grafico: { ...base('b-grafico', 'grafico', 3), contenido: { vista: { xMin: -3, xMax: 3, yMin: -1, yMax: 9 }, parametros: [{ id: 'a', min: 0, max: 5, paso: 1, valor: 1 }], funciones: [{ id: 'f1', expresion: 'a*x^2', color: 'serie1' }] } },
  vectores: { ...base('b-vectores', 'vectores', 4), contenido: { vista: { xMin: -5, xMax: 5, yMin: -5, yMax: 5 }, vectores: [{ id: 'v1', origen: [0, 0], componentes: [3, 4], color: 'serie1', etiqueta: 'v' }] } },
  tabla: { ...base('b-tabla', 'tabla', 5), contenido: { columnas: ['x', 'y'], filas: [{ id: 'r1', celdas: ['1', '2'] }] } },
  'linea-tiempo': { ...base('b-linea', 'linea-tiempo', 6), contenido: { eventos: [{ id: 'e1', fecha: '1492', orden: 1, titulo: 'Viaje', texto: '' }] } },
  codigo: { ...base('b-codigo', 'codigo', 7), contenido: { lenguaje: 'python', codigo: 'print(1)' } },
  comparacion: { ...base('b-comp', 'comparacion', 8), contenido: { columnas: [{ id: 'c1', titulo: 'A', puntos: ['x'] }, { id: 'c2', titulo: 'B', puntos: ['y'] }] } },
  ejercicio: { ...base('b-ej', 'ejercicio', 9), contenido: { modo: 'numero', enunciado: '2+2', respuesta: 4 } },
  obra: { ...base('b-obra', 'obra', 10), referencias: [{ id: 'cr1', tipo: 'credito', titulo: 'La gran ola de Kanagawa', autor: 'Katsushika Hokusai', licencia: 'CC0', institucion: 'The Met' }], contenido: { imagen: { src: '/recursos/obras/hokusai-gran-ola-1400.webp', ancho: 1400, alto: 940 }, regiones: [{ id: 'ola', etiqueta: 'Ola', texto: '', forma: { tipo: 'circulo', centro: [500, 400], radio: 100 } }] } },
  'modelo-3d': { ...base('b-modelo', 'modelo-3d', 11), contenido: { modelo: { tipo: 'catalogo', clave: 'metano' } } },
  pdf: { ...base('b-pdf', 'pdf', 12), contenido: { documento: { tipo: 'catalogo', src: '/documentos/apuntes-derivadas.pdf' }, pagina: 1 } },
  desconocido: { ...base('b-desc', 'desconocido', 13), contenido: { tipoOriginal: 'video', motivo: 'tipo', errores: [] } },
};

describe('Bloques educativos mentelyx.bloque/v1', () => {
  it('14 tipos: 13 se aceptan como entrada y «desconocido» es la alternativa segura que genera el validador', () => {
    expect(TIPOS).toHaveLength(14);
    for (const t of TIPOS.filter((x) => x !== 'desconocido')) expect({ t, ok: validarBloque(BLOQUES[t]).ok }).toEqual({ t, ok: true });
    const r = validarBloque({ ...(BLOQUES.texto as object), tipo: 'video' });
    expect(r.ok).toBe(false);
    expect(r.bloque.tipo).toBe('desconocido');
    expect(validarBloque(BLOQUES.desconocido).ok).toBe(false); // nadie puede inyectarlo como entrada
  });

  it('rechaza HTML, recursos fuera del catálogo y expresiones con variables no declaradas', () => {
    expect(validarBloque({ ...(BLOQUES.texto as object), tipo: 'html' }).ok).toBe(false);
    expect(validarBloque({ ...(BLOQUES.pdf as object), contenido: { documento: { tipo: 'catalogo', src: 'https://malo.test/x.pdf' } } }).ok).toBe(false);
    expect(validarBloque({ ...(BLOQUES.grafico as object), contenido: { vista: { xMin: 0, xMax: 1, yMin: 0, yMax: 1 }, funciones: [{ id: 'f1', expresion: 'z+fetch(1)', color: 'serie1' }] } }).ok).toBe(false);
  });
});

describe('Acciones educativas (reductor determinista)', () => {
  const estado = () => crearEstado(Object.values(BLOQUES));
  const ACCIONES: Array<[string, unknown]> = [
    ['crear-bloque', { accion: 'crear-bloque', bloque: { ...(BLOQUES.formula as object), id: 'nuevo', orden: 20 } }],
    ['actualizar-bloque', { accion: 'actualizar-bloque', bloqueId: 'b-formula', contenido: { latex: 'x^3' } }],
    ['enfocar-bloque', { accion: 'enfocar-bloque', bloqueId: 'b-tabla' }],
    ['resaltar', { accion: 'resaltar', bloqueId: 'b-pasos', objetivo: 'p1' }],
    ['revelar-paso', { accion: 'revelar-paso', bloqueId: 'b-pasos', paso: '@todos' }],
    ['seleccionar-estructura', { accion: 'seleccionar-estructura', bloqueId: 'b-obra', parte: 'ola' }],
    ['modificar-parametro', { accion: 'modificar-parametro', bloqueId: 'b-grafico', parametro: 'a', valor: 2 }],
    ['mostrar-referencia', { accion: 'mostrar-referencia', bloqueId: 'b-pdf', referenciaId: null }],
    ['cambiar-vista', { accion: 'cambiar-vista', bloqueId: 'b-grafico', vista: { tipo: 'plano', xMin: -1, xMax: 1, yMin: -1, yMax: 1 } }],
  ];
  it.each(ACCIONES)('%s se aplica sin error sobre un estado válido', (_n, accion) => {
    expect(aplicarAccion(estado(), accion).error).toBeNull();
  });
  it('una acción inválida no cambia el estado y se informa', () => {
    const e = estado();
    const r = aplicarAccion(e, { accion: 'modificar-parametro', bloqueId: 'b-pasos', parametro: 'a', valor: 2 });
    expect(r.error).not.toBeNull();
    expect(r.estado).toBe(e);
  });
});

const comun = { version: 1 as const, tema: 'T', dificultad: 'basica' as const, enunciado: '¿?', origen: 'persona' as const };
const PREGUNTAS: Array<[Pregunta, Parameters<typeof corregir>[1], string]> = [
  [{ ...comun, id: 'a', tipo: 'opcion-unica', opciones: [{ id: 'o1', texto: 'a' }, { id: 'o2', texto: 'b' }], correcta: 'o1' }, { tipo: 'opcion', id: 'o1' }, 'correcta'],
  [{ ...comun, id: 'b', tipo: 'opcion-multiple', opciones: [{ id: 'o1', texto: 'a' }, { id: 'o2', texto: 'b' }], correctas: ['o1', 'o2'] }, { tipo: 'opciones', ids: ['o1'] }, 'parcial'],
  [{ ...comun, id: 'c', tipo: 'verdadero-falso', correcta: false }, { tipo: 'booleano', valor: true }, 'incorrecta'],
  [{ ...comun, id: 'd', tipo: 'numerica', respuesta: 0.5, tolerancia: { tipo: 'absoluta', valor: 0.001 } }, { tipo: 'texto', valor: '1/2' }, 'correcta'],
  [{ ...comun, id: 'e', tipo: 'expresion', respuesta: '2*x', variables: ['x'], dominio: { min: -3, max: 3 } }, { tipo: 'texto', valor: 'x+x' }, 'correcta'],
  [{ ...comun, id: 'f', tipo: 'ordenamiento', elementos: [{ id: 'e1', texto: '1' }, { id: 'e2', texto: '2' }], orden: ['e1', 'e2'] }, { tipo: 'orden', ids: ['e2', 'e1'] }, 'incorrecta'],
  [{ ...comun, id: 'g', tipo: 'relacion', pares: [{ id: 'r1', izquierda: 'a', derecha: '1' }, { id: 'r2', izquierda: 'b', derecha: '2' }] }, { tipo: 'pares', asignacion: { r1: 'r1', r2: 'r2' } }, 'correcta'],
  [{ ...comun, id: 'h', tipo: 'abierta', criterios: ['c'] }, { tipo: 'texto', valor: 'mi respuesta' }, 'pendiente'],
  [{ ...comun, id: 'i', tipo: 'caso', caso: 'Contexto', preguntas: [{ id: 's1', tipo: 'numerica', enunciado: '¿?', respuesta: 2, tolerancia: { tipo: 'absoluta', valor: 0 } }] }, { tipo: 'caso', respuestas: { s1: { tipo: 'texto', valor: '2' } } }, 'correcta'],
  [{ ...comun, id: 'j', tipo: 'identificar', objeto: BLOQUES.obra, correcta: 'ola' }, { tipo: 'opcion', id: 'ola' }, 'correcta'],
] as never;

describe('Preguntas mentelyx.pregunta/v1 y corrección determinista', () => {
  it.each(PREGUNTAS.map(([p, r, e]) => [p.tipo, p, r, e] as const))('%s: válida y corregida como %s', (_t, p, r, esperado) => {
    expect(validarPregunta(p).ok).toBe(true);
    expect(corregir(p, r).estado).toBe(esperado);
  });
  it('rechaza una pregunta cuya respuesta correcta no está entre las opciones', () => {
    expect(validarPregunta({ ...comun, id: 'x', tipo: 'opcion-unica', opciones: [{ id: 'o1', texto: 'a' }, { id: 'o2', texto: 'b' }], correcta: 'o9' }).ok).toBe(false);
  });
});
