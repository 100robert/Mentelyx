import { describe, expect, it } from 'vitest';
import { aplicarAccion, aplicarAcciones, crearEstado, MAX_BLOQUES, objetivosDe } from '../acciones';
import { CAPACIDADES, TIPOS } from '../esquema';
import { bloqueDeRespuesta, bloquesDeMensajes, deRespuesta, idDeMensaje } from '../tutor';
import { validarBloque } from '../validacion';

const acc = { descripcion: 'Descripción accesible.' };
const pasos = {
  id: 'derivada',
  version: 1,
  tipo: 'pasos',
  orden: 1,
  origen: 'ejemplo',
  titulo: 'Derivada',
  accesibilidad: acc,
  contenido: {
    pasos: [
      { id: 'p1', titulo: 'Uno', texto: 'a' },
      { id: 'p2', titulo: 'Dos', texto: 'b' },
      { id: 'p3', titulo: 'Tres', texto: 'c' },
    ],
  },
};
const grafico = {
  id: 'parabola',
  version: 1,
  tipo: 'grafico',
  orden: 0,
  origen: 'ejemplo',
  accesibilidad: acc,
  contenido: {
    vista: { xMin: -5, xMax: 5, yMin: -5, yMax: 10 },
    parametros: [
      { id: 'a', min: -3, max: 3, paso: 0.1, valor: 1 },
      { id: 'p', min: -4, max: 4, paso: 0.1, valor: 1 },
    ],
    funciones: [{ id: 'f', expresion: 'a*x^2 - 4x + 3', color: 'serie1' }],
    puntos: [{ id: 'punto', x: 'p', en: 'f' }],
    tangentes: [{ id: 'tangente', funcion: 'f', x: 'p', color: 'acento' }],
  },
};
const texto = { id: 'intro', version: 1, tipo: 'texto', orden: 2, origen: 'tutor', accesibilidad: acc, contenido: { markdown: 'Hola' } };

describe('validación de bloques', () => {
  it('acepta bloques válidos y conserva sus datos', () => {
    for (const b of [pasos, grafico, texto]) {
      const r = validarBloque(b);
      expect(r.ok, JSON.stringify(r.ok ? '' : r.errores)).toBe(true);
    }
  });

  it('convierte un tipo desconocido en una alternativa segura sin su contenido', () => {
    const r = validarBloque({ id: 'mapa', version: 1, tipo: 'mapa-interactivo', orden: 0, contenido: { script: '<script>alert(1)</script>' } });
    expect(r.ok).toBe(false);
    expect(r.bloque.tipo).toBe('desconocido');
    expect(r.bloque.id).toBe('mapa');
    if (r.bloque.tipo === 'desconocido') {
      expect(r.bloque.contenido.tipoOriginal).toBe('mapa-interactivo');
      expect(r.bloque.contenido.motivo).toBe('tipo');
      expect(JSON.stringify(r.bloque)).not.toContain('<script>');
    }
  });

  it('rechaza versiones no admitidas, campos extra, HTML como dato de estilo y rutas externas', () => {
    expect(validarBloque({ ...texto, version: 2 }).bloque.tipo).toBe('desconocido');
    expect(validarBloque({ ...texto, onclick: 'x()' }).ok).toBe(false);
    expect(validarBloque({ ...grafico, contenido: { ...grafico.contenido, funciones: [{ id: 'f', expresion: 'x', color: '#ff0000' }] } }).ok).toBe(false);
    const obra = {
      id: 'ola',
      version: 1,
      tipo: 'obra',
      orden: 0,
      origen: 'tutor',
      accesibilidad: acc,
      referencias: [{ id: 'credito', tipo: 'credito', titulo: 'T', autor: 'A', licencia: 'CC0' }],
      contenido: { imagen: { src: 'https://ejemplo.test/a.png', ancho: 10, alto: 10 }, regiones: [] },
    };
    expect(validarBloque(obra).ok).toBe(false);
    expect(validarBloque({ ...obra, contenido: { ...obra.contenido, imagen: { src: '/recursos/obras/ola.webp', ancho: 10, alto: 10 } } }).ok).toBe(true);
    expect(validarBloque({ ...obra, referencias: [], contenido: { ...obra.contenido, imagen: { src: '/recursos/obras/ola.webp', ancho: 10, alto: 10 } } }).ok).toBe(false);
  });

  it('comprueba la semántica: expresiones, referencias, identificadores y rangos', () => {
    const conFuncionMala = { ...grafico, contenido: { ...grafico.contenido, funciones: [{ id: 'f', expresion: 'fetch(x)', color: 'serie1' }] } };
    const r1 = validarBloque(conFuncionMala);
    expect(r1.ok).toBe(false);
    if (!r1.ok) expect(r1.errores[0]!.codigo).toBe('FUNCION_NO_PERMITIDA');
    const sinParametro = { ...grafico, contenido: { ...grafico.contenido, funciones: [{ id: 'f', expresion: 'k*x', color: 'serie1' }] } };
    expect(validarBloque(sinParametro).ok).toBe(false);
    const referenciaRota = { ...grafico, contenido: { ...grafico.contenido, puntos: [{ id: 'punto', x: 1, en: 'g' }] } };
    const r2 = validarBloque(referenciaRota);
    if (!r2.ok) expect(r2.errores.map((e) => e.codigo)).toContain('REFERENCIA_INEXISTENTE');
    const duplicado = { ...pasos, contenido: { pasos: [pasos.contenido.pasos[0], pasos.contenido.pasos[0]] } };
    expect(validarBloque(duplicado).ok).toBe(false);
    const vistaInvertida = { ...grafico, contenido: { ...grafico.contenido, vista: { xMin: 5, xMax: -5, yMin: 0, yMax: 1 } } };
    expect(validarBloque(vistaInvertida).ok).toBe(false);
  });

  it('limita el tamaño y tolera entradas que no son objetos', () => {
    expect(validarBloque({ ...texto, contenido: { markdown: 'x'.repeat(300_000) } }).ok).toBe(false);
    for (const e of [null, 3, 'texto', [], undefined]) expect(validarBloque(e).bloque.tipo).toBe('desconocido');
    const circular: Record<string, unknown> = { tipo: 'texto' };
    circular.yo = circular;
    expect(validarBloque(circular).ok).toBe(false);
  });

  it('declara capacidades para todos los tipos', () => {
    for (const t of TIPOS) expect(CAPACIDADES[t]).toBeDefined();
  });
});

describe('acciones educativas', () => {
  const estado = () => crearEstado([grafico, pasos, texto]);

  it('crea el estado ordenado y con la interacción inicial', () => {
    const e = estado();
    expect(e.bloques.map((b) => b.id)).toEqual(['parabola', 'derivada', 'intro']);
    expect(e.activo).toBe('parabola');
    expect(e.interaccion.parabola!.parametros).toEqual({ a: 1, p: 1 });
    expect(e.interaccion.derivada!.revelados).toBe(1);
  });

  it('revela pasos uno a uno, por identificador y todos', () => {
    let e = estado();
    e = aplicarAccion(e, { accion: 'revelar-paso', bloqueId: 'derivada', paso: '@siguiente' }).estado;
    expect(e.interaccion.derivada!.revelados).toBe(2);
    e = aplicarAccion(e, { accion: 'revelar-paso', bloqueId: 'derivada', paso: 'p3' }).estado;
    expect(e.interaccion.derivada!.revelados).toBe(3);
    e = aplicarAccion(e, { accion: 'revelar-paso', bloqueId: 'derivada', paso: '@siguiente' }).estado;
    expect(e.interaccion.derivada!.revelados).toBe(3);
    e = aplicarAccion(e, { accion: 'revelar-paso', bloqueId: 'derivada', paso: '@anterior' }).estado;
    expect(e.interaccion.derivada!.revelados).toBe(2);
    expect(e.activo).toBe('derivada');
  });

  it('modifica parámetros dentro de su rango y rechaza los de fuera sin cambiar el estado', () => {
    const e = estado();
    const ok = aplicarAccion(e, { accion: 'modificar-parametro', bloqueId: 'parabola', parametro: 'a', valor: 2 });
    expect(ok.error).toBeNull();
    expect(ok.estado.interaccion.parabola!.parametros.a).toBe(2);
    const fuera = aplicarAccion(ok.estado, { accion: 'modificar-parametro', bloqueId: 'parabola', parametro: 'a', valor: 99 });
    expect(fuera.error?.codigo).toBe('PARAMETRO_FUERA_DE_RANGO');
    expect(fuera.estado).toBe(ok.estado);
  });

  it('rechaza acciones inválidas, objetivos inexistentes y capacidades no admitidas', () => {
    const e = estado();
    const casos: Array<[unknown, string]> = [
      [{ accion: 'ejecutar', codigo: 'alert(1)' }, 'ACCION_INVALIDA'],
      [{ accion: 'resaltar', bloqueId: 'parabola', objetivo: 'g', extra: 1 }, 'ACCION_INVALIDA'],
      [{ accion: 'resaltar', bloqueId: 'nada', objetivo: null }, 'BLOQUE_INEXISTENTE'],
      [{ accion: 'resaltar', bloqueId: 'parabola', objetivo: 'g' }, 'OBJETIVO_INEXISTENTE'],
      [{ accion: 'revelar-paso', bloqueId: 'parabola', paso: '@siguiente' }, 'ACCION_NO_ADMITIDA'],
      [{ accion: 'cambiar-vista', bloqueId: 'parabola', vista: { tipo: 'pagina', pagina: 2 } }, 'VISTA_INCOMPATIBLE'],
      [{ accion: 'cambiar-vista', bloqueId: 'parabola', vista: { tipo: 'plano', xMin: 1, xMax: 0, yMin: 0, yMax: 1 } }, 'RANGO_INVALIDO'],
      [{ accion: 'seleccionar-estructura', bloqueId: 'derivada', parte: 'p1' }, 'ACCION_NO_ADMITIDA'],
      ['<img src=x onerror=alert(1)>', 'ACCION_INVALIDA'],
    ];
    for (const [a, codigo] of casos) {
      const r = aplicarAccion(e, a);
      expect(r.error?.codigo, JSON.stringify(a)).toBe(codigo);
      expect(r.estado).toBe(e);
    }
  });

  it('resaltar un paso oculto lo revela', () => {
    const r = aplicarAccion(estado(), { accion: 'resaltar', bloqueId: 'derivada', objetivo: 'p3' });
    expect(r.estado.interaccion.derivada!.revelados).toBe(3);
    expect(r.estado.interaccion.derivada!.resaltado).toBe('p3');
  });

  it('crea bloques nuevos, incluso inválidos como alternativa segura, sin perder los existentes', () => {
    const e = estado();
    const nuevo = aplicarAccion(e, { accion: 'crear-bloque', bloque: { ...texto, id: 'nuevo', orden: 9 } });
    expect(nuevo.error).toBeNull();
    expect(nuevo.estado.bloques).toHaveLength(4);
    expect(nuevo.estado.activo).toBe('nuevo');
    const raro = aplicarAccion(nuevo.estado, { accion: 'crear-bloque', bloque: { id: 'raro', version: 1, tipo: 'holograma', orden: 10 } });
    expect(raro.error?.codigo).toBe('BLOQUE_INVALIDO');
    expect(raro.estado.bloques.find((b) => b.id === 'raro')?.tipo).toBe('desconocido');
    expect(aplicarAccion(raro.estado, { accion: 'crear-bloque', bloque: { ...texto } }).error?.codigo).toBe('ID_DUPLICADO');
  });

  it('actualiza un bloque validando la versión resultante y conserva la interacción válida', () => {
    let e = aplicarAccion(estado(), { accion: 'revelar-paso', bloqueId: 'derivada', paso: 'p3' }).estado;
    const malo = aplicarAccion(e, { accion: 'actualizar-bloque', bloqueId: 'derivada', contenido: { pasos: [] } });
    expect(malo.error?.codigo).toBe('BLOQUE_INVALIDO');
    expect(malo.estado).toBe(e);
    e = aplicarAccion(e, { accion: 'actualizar-bloque', bloqueId: 'derivada', contenido: { pasos: pasos.contenido.pasos.slice(0, 2) } }).estado;
    expect(e.interaccion.derivada!.revelados).toBe(2);
  });

  it('una secuencia se detiene en la primera acción inválida y conserva lo aplicado', () => {
    const r = aplicarAcciones(estado(), [
      { accion: 'revelar-paso', bloqueId: 'derivada', paso: 'p2' },
      { accion: 'modificar-parametro', bloqueId: 'parabola', parametro: 'a', valor: 50 },
      { accion: 'revelar-paso', bloqueId: 'derivada', paso: 'p3' },
    ]);
    expect(r.error?.codigo).toBe('PARAMETRO_FUERA_DE_RANGO');
    expect(r.estado.interaccion.derivada!.revelados).toBe(2);
  });

  it('respeta el máximo de bloques por sesión', () => {
    const muchos = Array.from({ length: MAX_BLOQUES + 5 }, (_, k) => ({ ...texto, id: `t${k}`, orden: k }));
    const e = crearEstado(muchos);
    expect(e.bloques).toHaveLength(MAX_BLOQUES);
    expect(aplicarAccion(e, { accion: 'crear-bloque', bloque: { ...texto, id: 'otro' } }).error?.codigo).toBe('LIMITE_BLOQUES');
  });

  it('abre un documento en la página de una referencia', () => {
    const doc = { id: 'apuntes', version: 1, tipo: 'pdf', orden: 5, origen: 'ejemplo', accesibilidad: acc, contenido: { documento: { tipo: 'catalogo', src: '/documentos/apuntes.pdf' } } };
    const conRef = { ...texto, referencias: [{ id: 'pag3', tipo: 'pagina', documento: 'apuntes', pagina: 3 }] };
    const e = crearEstado([conRef, doc]);
    const r = aplicarAccion(e, { accion: 'mostrar-referencia', bloqueId: 'intro', referenciaId: 'pag3' });
    expect(r.error).toBeNull();
    expect(r.estado.activo).toBe('apuntes');
    expect(r.estado.interaccion.apuntes!.vista).toEqual({ tipo: 'pagina', pagina: 3 });
  });

  it('enumera los objetivos de cada bloque', () => {
    const e = estado();
    expect(objetivosDe(e.bloques[0]!)).toEqual(['f', 'punto', 'tangente']);
  });
});

describe('adaptador del Tutor', () => {
  const respuesta = {
    mensajeId: '7f0c-AB12',
    segmentos: [{ id: 's1', markdown: 'La derivada mide [1].' }, { id: 's2', markdown: 'Segundo párrafo.' }],
    citas: [{ id: '1', titulo: 'Apuntes', fragmento: 'La derivada…', recursoId: 'x' }],
  };

  it('convierte la respuesta en un bloque de texto con sus citas y un identificador estable', () => {
    const { bloques, acciones } = deRespuesta(respuesta, 3, '¿Qué es la derivada?');
    expect(acciones).toEqual([]);
    const r = validarBloque(bloques[0]);
    expect(r.ok).toBe(true);
    if (r.ok && r.bloque.tipo === 'texto') {
      expect(r.bloque.id).toBe(idDeMensaje('7f0c-AB12'));
      expect(r.bloque.contenido.markdown).toBe('La derivada mide [1].\n\nSegundo párrafo.');
      expect(r.bloque.referencias?.[0]).toMatchObject({ tipo: 'cita', numero: 1, titulo: 'Apuntes' });
      expect(r.bloque.titulo).toBe('¿Qué es la derivada?');
    }
  });

  it('funciona sin fuentes (respuesta general sin citas)', () => {
    const { bloques } = deRespuesta({ ...respuesta, citas: [] }, 0);
    const r = validarBloque(bloques[0]);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.bloque.referencias).toEqual([]);
  });

  it('valida los bloques y acciones adicionales que proponga la respuesta', () => {
    const { bloques, acciones } = deRespuesta({ ...respuesta, bloques: [grafico, { tipo: 'iframe', src: 'https://x' }], acciones: [{ accion: 'enfocar-bloque', bloqueId: 'parabola' }] }, 0);
    const e = crearEstado(bloques);
    expect(e.bloques.map((b) => b.tipo)).toEqual(['texto', 'grafico', 'desconocido']);
    expect(e.bloques.every((b) => b.origen === 'tutor')).toBe(true);
    expect(aplicarAcciones(e, acciones).estado.activo).toBe('parabola');
    expect(deRespuesta({ ...respuesta, bloques: 'no' as unknown }, 0).bloques).toHaveLength(1);
  });

  it('reconstruye la sesión desde los mensajes reales', () => {
    const b = bloquesDeMensajes([
      { id: 'u1', rol: 'user', texto: 'Pregunta 1' },
      { id: 'a1', rol: 'assistant', texto: 'Respuesta 1', citas: [] },
      { id: 'a2', rol: 'assistant', texto: 'Respuesta suelta' },
    ]);
    const e = crearEstado(b);
    expect(e.bloques.map((x) => x.titulo)).toEqual(['Pregunta 1', 'Respuesta del Tutor']);
  });

  it('numera citas con identificadores no numéricos sin repetir', () => {
    const b = bloqueDeRespuesta({ mensajeId: 'm', markdown: 'x', orden: 0, citas: [{ id: 'a', titulo: 'A', fragmento: '' }, { id: '1', titulo: 'B', fragmento: '' }] });
    expect(validarBloque(b).ok).toBe(true);
  });
});
