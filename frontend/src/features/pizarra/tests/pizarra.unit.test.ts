import { describe, expect, it } from 'vitest';
import { aplicarAcciones, crearEstado, interaccionInicial } from '../../bloques/acciones';
import { validarBloque } from '../../bloques/validacion';
import { experiencia } from '../../experiencias/catalogo';
import { bloqueDocumento, bloqueEcuacion, bloqueEjercicio, bloqueGrafico, bloqueModelo, bloqueTabla, diagramaInicial, expresionALatex } from '../insercion';
import {
  agregar,
  ajustarA,
  aMundo,
  aPantalla,
  asegurarVisible,
  cajaDe,
  caminoSuave,
  conPresion,
  contornoPresion,
  crearHistorial,
  deshacer,
  dentroDeMarco,
  duplicar,
  elementoEn,
  ESCALA,
  ESTILO_INICIAL,
  lineasDeTrabajo,
  moverVarios,
  quitar,
  registrar,
  rehacer,
  resumenTrabajo,
  siguienteEtiqueta,
  simplificar,
  tocadosPorBorrador,
  zoomEn,
  type Elemento,
  type TextoTrabajo,
  type Trazo,
  type Vec,
} from '../modelo';
import { accionesPara, componerConsulta, contextoVacio, lineasMencionadas, modosPara, resumenBloque, rolDeTitulo, tipoActividad } from '../pedagogia';
import { claveCambio, cuerpoEstado, LIMITE_ESTADO_BYTES, restaurar, textoGuardado } from '../persistencia';

const trazo = (id: string, puntos: Array<[number, number]>, extra: Partial<Trazo> = {}): Trazo => ({ id, tipo: 'trazo', pincel: 'lapiz', estilo: ESTILO_INICIAL.lapiz, puntos: puntos.map(([x, y]) => [x, y, 0.5]), ...extra });
const texto = (id: string, en: Vec, t: string, etiqueta: string, extra: Partial<TextoTrabajo> = {}): TextoTrabajo => ({ id, tipo: 'texto', en, texto: t, expresion: true, tamano: 18, etiqueta, estilo: ESTILO_INICIAL.texto, ...extra });
const SIN_ANCLAS = new Map<string, Vec>();

describe('pizarra: dibujo', () => {
  it('un trazo a mano se simplifica sin perder su forma ni la presión', () => {
    const recta = Array.from({ length: 50 }, (_, k) => [k, k * 0.5, 0.5] as [number, number, number]);
    expect(simplificar(recta)).toHaveLength(2);
    const conPico = recta.map((p, k) => (k === 25 ? ([p[0], p[1], 1] as [number, number, number]) : p));
    expect(simplificar(conPico).some((p) => p[2] === 1)).toBe(true);
    const curva = Array.from({ length: 40 }, (_, k) => [k * 5, Math.sin(k / 4) * 40, 0.5] as [number, number, number]);
    expect(simplificar(curva).length).toBeGreaterThan(4);
  });
  it('el camino SVG es suave y la presión del lápiz óptico se dibuja como contorno', () => {
    expect(caminoSuave([[0, 0], [10, 10], [20, 0]])).toMatch(/^M0 0Q10 10 15 5L20 0$/);
    expect(caminoSuave([[3, 4]])).toBe('M3 4l0.01 0');
    const conLapiz = trazo('a', [[0, 0], [10, 0], [20, 0]]);
    expect(conPresion(conLapiz)).toBe(false);
    const optico: Trazo = { ...conLapiz, puntos: [[0, 0, 0.1], [10, 0, 0.6], [20, 0, 0.9]] };
    expect(conPresion(optico)).toBe(true);
    expect(contornoPresion(optico.puntos, 6)).toMatch(/Z$/);
  });
  it('agrega con límites: textos recortados y trazos enormes simplificados', () => {
    const largo = texto('t', [0, 0], 'x'.repeat(900), 'L1');
    expect((agregar([], largo)[0] as TextoTrabajo).texto).toHaveLength(400);
    const enorme = trazo('z', Array.from({ length: 5000 }, (_, k) => [k, (k % 2) * 3]));
    expect((agregar([], enorme)[0] as Trazo).puntos.length).toBeLessThanOrEqual(4000);
  });
  it('las líneas de texto se etiquetan L1, L2… sin repetir', () => {
    const els: Elemento[] = [texto('a', [0, 0], '2x+3=7', 'L1'), texto('b', [0, 40], '2x=4', 'L3')];
    expect(siguienteEtiqueta([])).toBe('L1');
    expect(siguienteEtiqueta(els)).toBe('L4');
  });
});

describe('pizarra: selección y borrado', () => {
  const linea = trazo('t1', [[0, 0], [100, 0]]);
  const caja: Elemento = { id: 'r1', tipo: 'rectangulo', desde: [200, 200], hasta: [300, 260], estilo: ESTILO_INICIAL.forma };
  const nota = texto('x1', [10, 10], 'Nota', 'L1', { ancla: 'bloque-a' });
  const origenes = new Map<string, Vec>([['bloque-a', [500, 500]]]);
  const todos = [linea, caja, nota];

  it('selecciona el elemento bajo el puntero, respetando el ancla de las anotaciones', () => {
    expect(elementoEn(todos, [50, 2], 4, origenes)?.id).toBe('t1');
    expect(elementoEn(todos, [250, 230], 4, origenes)).toBeNull(); // dentro del rectángulo vacío
    expect(elementoEn(todos, [200, 230], 4, origenes)?.id).toBe('r1'); // sobre su borde
    expect(elementoEn(todos, [515, 520], 2, origenes)?.id).toBe('x1'); // la nota está en el bloque, no en (10, 10)
    expect(elementoEn(todos, [15, 20], 2, origenes)).toBeNull();
  });
  it('el marco de selección elige lo que corta, y nada de un bloque que ya no está', () => {
    expect(dentroDeMarco(todos, { x: -10, y: -10, w: 120, h: 20 }, origenes).map((e) => e.id)).toEqual(['t1']);
    expect(dentroDeMarco(todos, { x: 0, y: 0, w: 1000, h: 1000 }, new Map()).map((e) => e.id)).toEqual(['t1', 'r1']);
  });
  it('el borrador quita los trazos que toca a lo largo de su recorrido, solo de los tipos permitidos', () => {
    expect(tocadosPorBorrador(todos, [50, -20], [50, 20], 3, origenes, () => true)).toEqual(['t1']);
    expect(tocadosPorBorrador(todos, [50, -20], [50, 20], 3, origenes, (e) => e.tipo !== 'trazo')).toEqual([]);
    expect(quitar(todos, ['t1']).map((e) => e.id)).toEqual(['r1', 'x1']);
  });
  it('mover y duplicar conservan el ancla y dan identificadores y etiquetas nuevos', () => {
    const movidos = moverVarios(todos, new Set(['t1', 'x1']), 5, 7);
    expect((movidos[0] as Trazo).puntos[0]).toEqual([5, 7, 0.5]);
    expect((movidos[2] as TextoTrabajo).en).toEqual([15, 17]);
    expect(movidos[2]!.ancla).toBe('bloque-a');
    const { elementos, nuevos } = duplicar(todos, new Set(['x1']));
    expect(nuevos).toHaveLength(1);
    const copia = elementos.find((e) => e.id === nuevos[0]) as TextoTrabajo;
    expect(copia.etiqueta).toBe('L2');
    expect(copia.en).toEqual([34, 34]);
  });
  it('las cajas de forma y trazo incluyen el grosor', () => {
    expect(cajaDe(linea)).toEqual({ x: -1.25, y: -1.25, w: 102.5, h: 2.5 });
  });
});

describe('pizarra: deshacer y rehacer', () => {
  it('recorre las instantáneas y un cambio nuevo borra lo rehacible', () => {
    let h = crearHistorial<Elemento[]>([]);
    const a = [trazo('a', [[0, 0], [1, 1]])];
    const b = [...a, trazo('b', [[2, 2], [3, 3]])];
    h = registrar(h, a);
    h = registrar(h, b);
    expect(h.presente).toBe(b);
    h = deshacer(h);
    expect(h.presente).toBe(a);
    h = deshacer(h);
    expect(h.presente).toEqual([]);
    expect(deshacer(h)).toBe(h);
    h = rehacer(h);
    expect(h.presente).toBe(a);
    h = registrar(h, []);
    expect(h.futuro).toEqual([]);
    expect(rehacer(h)).toBe(h);
  });
  it('limita la memoria a las últimas instantáneas', () => {
    let h = crearHistorial(0);
    for (let k = 1; k <= 150; k++) h = registrar(h, k, 100);
    expect(h.pasado).toHaveLength(100);
    expect(h.pasado[0]).toBe(50);
  });
});

describe('pizarra: zoom y desplazamiento', () => {
  it('el punto bajo el cursor no se mueve al acercar o alejar', () => {
    const v = { x: 40, y: -30, escala: 1 };
    const antes = aMundo(v, 300, 200);
    const z = zoomEn(v, 1.5, 300, 200);
    expect(z.escala).toBe(1.5);
    const despues = aMundo(z, 300, 200);
    expect(despues[0]).toBeCloseTo(antes[0]);
    expect(despues[1]).toBeCloseTo(antes[1]);
    const [sx, sy] = aPantalla(z, ...antes);
    expect(sx).toBeCloseTo(300);
    expect(sy).toBeCloseTo(200);
  });
  it('la escala tiene límites', () => {
    expect(zoomEn({ x: 0, y: 0, escala: 1 }, 100, 0, 0).escala).toBe(ESCALA.max);
    expect(zoomEn({ x: 0, y: 0, escala: 1 }, 0.001, 0, 0).escala).toBe(ESCALA.min);
  });
  it('ajustar a pantalla centra la caja y asegurar visible desplaza lo justo', () => {
    const v = ajustarA({ x: 0, y: 0, w: 1000, h: 500 }, 800, 600, 0, 4);
    expect(v.escala).toBeCloseTo(0.8);
    expect(aPantalla(v, 500, 250)[0]).toBeCloseTo(400);
    expect(aPantalla(v, 500, 250)[1]).toBeCloseTo(300);
    const quieta = { x: 0, y: 0, escala: 1 };
    expect(asegurarVisible(quieta, { x: 100, y: 100, w: 50, h: 50 }, 800, 600)).toBe(quieta);
    const movida = asegurarVisible(quieta, { x: 100, y: 900, w: 50, h: 50 }, 800, 600);
    expect(movida.y).toBe(600 - 24 - 950);
  });
});

describe('pizarra: contexto para el Tutor', () => {
  const derivadas = experiencia('derivadas')!;
  const estado = crearEstado(derivadas.bloques);
  const actividad = estado.bloques.find((b) => b.tipo === 'ejercicio')!;

  it('el resumen de una actividad nunca incluye su respuesta, pista ni explicación', () => {
    const r = resumenBloque(actividad);
    expect(r).toContain('Actividad');
    if (actividad.tipo === 'ejercicio') {
      if (actividad.contenido.modo === 'numero') expect(r).not.toContain(String(actividad.contenido.respuesta));
      if (actividad.contenido.pista) expect(r).not.toContain(actividad.contenido.pista);
    }
  });
  it('un procedimiento solo envía los pasos que la persona ya vio', () => {
    const pasos = estado.bloques.find((b) => b.tipo === 'pasos')!;
    const uno = resumenBloque(pasos, { ...interaccionInicial(pasos), revelados: 1 });
    expect(uno).toContain('1)');
    expect(uno).not.toContain('2)');
  });
  it('compone la pregunta con rótulo, instrucción, trabajo con identificadores y bloques elegidos, sin pasar de 4000', () => {
    const c = componerConsulta({
      texto: '',
      modo: 'aprender',
      accion: 'revisar',
      foco: 'Ecuaciones lineales',
      contexto: { bloques: [{ ref: 'B1', resumen: 'Actividad «Resuelve»: 2x + 3 = 7' }], lineas: [{ etiqueta: 'L1', texto: '2x = 7 - 3', expresion: true }, { etiqueta: 'L2', texto: 'x = 5', expresion: true }], sinTexto: 2 },
      pantalla: 'Me preparo para el examen.',
    });
    expect(c.modo).toBe('PISTA');
    expect(c.visible).toBe('Revisión de mi intento: Ecuaciones lineales');
    expect(c.pregunta).toContain('L1: 2x = 7 - 3\nL2: x = 5');
    expect(c.pregunta).toContain('[B1] Actividad');
    expect(c.pregunta).toContain('2 trazos o formas a mano que Mentelyx no interpreta');
    expect(c.pregunta).toMatch(/\(Contexto: Me preparo para el examen\.\)$/);
    const enorme = componerConsulta({ texto: 'a'.repeat(3000), modo: 'aprender', foco: 'x', contexto: { bloques: Array.from({ length: 20 }, (_, k) => ({ ref: `B${k + 1}`, resumen: 'z'.repeat(800) })), lineas: [], sinTexto: 0 } });
    expect(enorme.pregunta.length).toBeLessThanOrEqual(4000);
  });
  it('en un examen sin solución todo va en modo PISTA y no se ofrece la resolución completa', () => {
    const c = componerConsulta({ texto: 'Resuélvelo', modo: 'completa', foco: 'x', contexto: contextoVacio(), asistencia: 'sin-solucion' });
    expect(c.modo).toBe('PISTA');
    expect(c.pregunta).toContain('no me des la respuesta final');
    expect(modosPara('resolucion', 'sin-solucion')).not.toContain('completa');
  });
});

describe('pizarra: acciones pedagógicas', () => {
  it('«Siguiente paso» y «Dame una pista» solo en una resolución, no en una lectura de historia', () => {
    const historia = validarBloque({ id: 'h', version: 1, tipo: 'linea-tiempo', orden: 0, origen: 'ejemplo', accesibilidad: { descripcion: 'x' }, contenido: { eventos: [{ id: 'e', fecha: '1923', orden: 1923, titulo: 'República', texto: '' }] } });
    expect(historia.ok).toBe(true);
    const tipo = tipoActividad([historia.bloque], false);
    expect(tipo).toBe('explicacion');
    expect(accionesPara(tipo)).not.toContain('siguiente');
    expect(accionesPara(tipo)).not.toContain('pista');
    expect(modosPara(tipo)).not.toContain('siguiente');
    expect(tipoActividad([historia.bloque], true)).toBe('resolucion');
    expect(accionesPara('resolucion')).toEqual(expect.arrayContaining(['pista', 'empezar', 'siguiente', 'revisar']));
    const propio = bloqueEjercicio('Resuelve 2x + 3 = 7', 0);
    expect(propio.ok && tipoActividad([propio.bloque], false)).toBe('resolucion');
  });
  it('el papel de una respuesta se recupera del rótulo de su pregunta', () => {
    expect(rolDeTitulo('Pista: Dame una pista sobre derivadas')).toBe('Pista');
    expect(rolDeTitulo('Revisión de mi intento: …')).toBe('Revisión de mi intento');
    expect(rolDeTitulo('¿Qué es una derivada?')).toBeNull();
    expect(rolDeTitulo(undefined)).toBeNull();
  });
  it('solo marca las líneas que existen y que la respuesta nombra', () => {
    expect(lineasMencionadas('En L2 restaste mal; L1 está bien. L9 no existe.', ['L1', 'L2', 'L3'])).toEqual(['L2', 'L1']);
    expect(lineasMencionadas('Sin líneas.', ['L1'])).toEqual([]);
  });
  it('el trabajo legible se ordena de arriba abajo y respeta lo elegido', () => {
    const els: Elemento[] = [texto('b', [0, 80], 'x = 2', 'L2'), texto('a', [0, 10], '2x = 4', 'L1'), trazo('t', [[0, 0], [5, 5]])];
    expect(lineasDeTrabajo(els, SIN_ANCLAS).map((e) => e.etiqueta)).toEqual(['L1', 'L2']);
    expect(lineasDeTrabajo(els, SIN_ANCLAS, new Set(['b'])).map((e) => e.etiqueta)).toEqual(['L2']);
    expect(resumenTrabajo(els)).toEqual({ trazos: 1, formas: 0, textos: 2, imagenes: 0, anotaciones: 0 });
  });
});

describe('pizarra: herramientas educativas (bloques propios)', () => {
  it('ecuación, gráfico, tabla, modelo, documento y ejercicio validan con el mismo esquema y son de la persona', () => {
    const creados = [bloqueEcuacion('2x + 3 = 7', 0), bloqueGrafico('x^2 - 4; 2x', 1), bloqueTabla(['x', 'y'], [['1', '2'], ['', '']], 2), bloqueModelo('metano', 3), bloqueDocumento('/documentos/apuntes-derivadas.pdf', 4), bloqueDocumento('local', 5), bloqueEjercicio('Resuelve 2x + 3 = 7', 6)];
    for (const r of creados) {
      expect(r.ok, r.ok ? '' : r.mensaje).toBe(true);
      if (r.ok) expect(r.bloque.origen).toBe('persona');
    }
  });
  it('la ecuación usa el analizador seguro y avisa lo que no entiende', () => {
    expect(expresionALatex('2x + 3 = 7')).toEqual({ latex: '2x + 3 = 7', entendida: true });
    expect(expresionALatex('x^2 >= 4').latex).toContain('\\ge');
    expect(expresionALatex('alert(1) = 2').entendida).toBe(false);
    expect(bloqueGrafico('constructor', 0).ok).toBe(false);
    expect(bloqueGrafico('', 0).ok).toBe(false);
  });
  it('el diagrama inicial son elementos editables de la capa de trabajo', () => {
    const d = diagramaInicial([0, 0], []);
    expect(d.filter((e) => e.tipo === 'rectangulo')).toHaveLength(3);
    expect(d.filter((e) => e.tipo === 'flecha')).toHaveLength(2);
    expect(d.filter((e) => e.tipo === 'texto').map((e) => (e as TextoTrabajo).etiqueta)).toEqual(['L1', 'L2', 'L3']);
  });
});

describe('pizarra: persistencia', () => {
  const base = crearEstado(experiencia('derivadas')!.bloques);
  const propio = bloqueEcuacion('x = 2', 50);
  if (!propio.ok) throw new Error('ecuación inválida');
  const conPropio = aplicarAcciones(base, [{ accion: 'crear-bloque', bloque: propio.bloque }]).estado;

  it('el cuerpo del PUT lleva la interacción de los bloques presentes y los bloques propios', () => {
    const r = cuerpoEstado({ ...conPropio, interaccion: { ...conPropio.interaccion, fantasma: interaccionInicial(propio.bloque) } }, []);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.cuerpo.bloquesPropios.map((b) => b.id)).toEqual([propio.bloque.id]);
    expect(r.cuerpo.interaccion.fantasma).toBeUndefined();
  });
  it('no envía un estado de más de 64 KB', () => {
    const grande = Array.from({ length: 70 }, (_, k) => ({ id: `a${k}`, texto: 'x'.repeat(1000) }));
    expect(cuerpoEstado(conPropio, grande)).toEqual({ ok: false, motivo: 'TAMANO' });
    expect(LIMITE_ESTADO_BYTES).toBe(65536);
  });
  it('cambia la clave de guardado al agregar un bloque propio, no al enfocar', () => {
    expect(claveCambio(conPropio)).not.toBe(claveCambio(base));
    const enfocado = aplicarAcciones(conPropio, [{ accion: 'enfocar-bloque', bloqueId: propio.bloque.id }]).estado;
    expect(claveCambio(enfocado)).toBe(claveCambio(conPropio));
  });
  it('al volver a abrir la sesión, recupera los bloques propios que faltan y su interacción', () => {
    const r = restaurar(base, { version: 3, interaccion: { [propio.bloque.id]: interaccionInicial(propio.bloque), otro: interaccionInicial(propio.bloque) }, anotaciones: [], bloquesPropios: [propio.bloque, { basura: true }] });
    expect(r.acciones).toHaveLength(1);
    const final = aplicarAcciones(base, r.acciones).estado;
    expect(final.bloques.some((b) => b.id === propio.bloque.id && b.origen === 'persona')).toBe(true);
    expect(Object.keys(r.interaccion)).toEqual([propio.bloque.id]);
    expect(restaurar(conPropio, { version: 3, interaccion: {}, anotaciones: [], bloquesPropios: [propio.bloque] }).acciones).toHaveLength(0);
  });
  it('el indicador nunca dice «Guardado» sin sesión y separa los trazos sin contrato', () => {
    expect(textoGuardado({ estado: 'sin-sesion', enviando: false, errorPregunta: false, trabajo: [] }).principal).not.toMatch(/^Guardado/);
    const t = textoGuardado({ estado: 'guardado', enviando: false, errorPregunta: false, trabajo: [trazo('a', [[0, 0]])] });
    expect(t.principal).toBe('Guardado en tu cuenta');
    expect(t.trabajo).toContain('aún no se guardan');
    expect(textoGuardado({ estado: 'guardado', enviando: true, errorPregunta: false, trabajo: [] }).principal).toBe('Guardando tu pregunta…');
  });
});
