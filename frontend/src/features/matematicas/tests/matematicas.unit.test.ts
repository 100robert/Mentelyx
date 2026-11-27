import { describe, expect, it } from 'vitest';
import { aLatex, analizar, derivar, evaluar, funcionDe, LIMITES, type Nodo } from '../expresion';
import { cuadraticaLatex, derivadaLatex, pasosDerivada, pendiente, raices, tangente, valor, verificarNumero, vertice } from '../cuadratica';
import { acercar, decimal, marcas, muestrear } from '../muestreo';

const ev = (s: string, x = 0, vars: string[] = ['x']) => {
  const r = analizar(s, vars);
  if (!r.ok) throw new Error(`${s}: ${r.error.codigo} ${r.error.mensaje}`);
  return evaluar(r.nodo, { x });
};
const nodo = (s: string, vars: string[] = ['x']): Nodo => {
  const r = analizar(s, vars);
  if (!r.ok) throw new Error(r.error.mensaje);
  return r.nodo;
};

describe('analizador de expresiones', () => {
  it('respeta la precedencia, la asociatividad de ^ y el menos unario', () => {
    expect(ev('1 + 2 * 3')).toBe(7);
    expect(ev('(1 + 2) * 3')).toBe(9);
    expect(ev('2^3^2')).toBe(512);
    expect(ev('-x^2', 3)).toBe(-9);
    expect(ev('2^-1')).toBe(0.5);
    expect(ev('10 - 4 - 3')).toBe(3);
    expect(ev('8 / 4 / 2')).toBe(1);
  });

  it('admite multiplicación implícita, coma decimal, superíndices y signos tipográficos', () => {
    expect(ev('2x', 4)).toBe(8);
    expect(ev('3(x+1)', 1)).toBe(6);
    expect(ev('(x+1)(x-1)', 3)).toBe(8);
    expect(ev('2sin(x)', Math.PI / 2)).toBeCloseTo(2, 12);
    expect(ev('1,5x', 2)).toBe(3);
    expect(ev('x² − 4x + 3', 1)).toBe(0);
    expect(ev('2·x', 5)).toBe(10);
    expect(ev('2π')).toBeCloseTo(2 * Math.PI, 12);
  });

  it('evalúa la lista cerrada de funciones y constantes (con alias en español)', () => {
    expect(ev('sen(pi/2)')).toBeCloseTo(1, 12);
    expect(ev('sqrt(16) + abs(-3)')).toBe(7);
    expect(ev('ln(e)')).toBeCloseTo(1, 12);
    expect(ev('log(1000)')).toBeCloseTo(3, 12);
    expect(ev('exp(0) + cos(0)')).toBe(2);
    expect(Number.isNaN(ev('sqrt(-1)'))).toBe(true);
  });

  it('rechaza funciones no permitidas, variables no declaradas y código', () => {
    const casos: Array<[string, string]> = [
      ['alert(1)', 'FUNCION_NO_PERMITIDA'],
      ['constructor', 'FUNCION_NO_PERMITIDA'],
      ['__proto__', 'EXPRESION_INVALIDA'],
      ['toString(x)', 'FUNCION_NO_PERMITIDA'],
      ['y + 1', 'VARIABLE_NO_DECLARADA'],
      ['x; fetch(1)', 'EXPRESION_INVALIDA'],
      ['window["x"]', 'FUNCION_NO_PERMITIDA'],
      ['x => x', 'EXPRESION_INVALIDA'],
      ['`x`', 'EXPRESION_INVALIDA'],
      ['sin x', 'EXPRESION_INVALIDA'],
      ['(x + 1', 'EXPRESION_INVALIDA'],
      ['x + 1)', 'EXPRESION_INVALIDA'],
      ['* 2', 'EXPRESION_INVALIDA'],
      ['', 'EXPRESION_INVALIDA'],
    ];
    for (const [s, codigo] of casos) {
      const r = analizar(s);
      expect(r.ok, s).toBe(false);
      if (!r.ok) expect(r.error.codigo, s).toBe(codigo);
    }
  });

  it('impone límites de longitud y de anidación', () => {
    expect(analizar('x+'.repeat(150) + 'x').ok).toBe(false);
    const profundo = '('.repeat(LIMITES.profundidad + 1) + 'x' + ')'.repeat(LIMITES.profundidad + 1);
    const r = analizar(profundo);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.codigo).toBe('EXPRESION_DEMASIADO_LARGA');
    expect(analizar('-'.repeat(60) + 'x').ok).toBe(false);
  });

  it('acepta solo las variables declaradas (parámetros de la escena)', () => {
    expect(evaluar(nodo('a*x^2 + b', ['x', 'a', 'b']), { x: 2, a: 3, b: 1 })).toBe(13);
    expect(analizar('a*x', ['x']).ok).toBe(false);
  });
});

describe('derivación simbólica', () => {
  const comprobar = (s: string, xs: number[]) => {
    const n = nodo(s);
    const d = funcionDe(derivar(n));
    const f = funcionDe(n);
    for (const x of xs) {
      const h = 1e-5;
      expect(d(x)).toBeCloseTo((f(x + h) - f(x - h)) / (2 * h), 5);
    }
  };
  it('coincide con la derivada numérica en funciones habituales', () => {
    comprobar('x^2 - 4x + 3', [-2, 0, 1.5, 3]);
    comprobar('sin(x) * x', [0.3, 1, 2]);
    comprobar('exp(2x) / (1 + x^2)', [-1, 0, 0.5]);
    comprobar('sqrt(x) + ln(x)', [0.5, 2, 4]);
    comprobar('x^x', [0.5, 1.5]);
    comprobar('2^x', [0, 1, 3]);
    comprobar('atan(x) - cos(x)^2', [-1, 0.2, 1]);
  });
  it('simplifica la derivada de un polinomio', () => {
    expect(aLatex(derivar(nodo('x^2')))).toBe('2x');
    expect(aLatex(derivar(nodo('3x^2 + 5x - 7')))).toBe('6x + 5');
    expect(aLatex(derivar(nodo('7')))).toBe('0');
  });
});

describe('cuadrática y derivada', () => {
  const q = { a: 1, b: -4, c: 3 };
  it('calcula valor, pendiente, vértice y raíces (EJ-17 del motor visual)', () => {
    expect(valor(q, 2)).toBe(-1);
    expect(pendiente(q, 2)).toBe(0);
    expect(vertice(q)).toEqual({ x: 2, y: -1 });
    expect(raices(q)).toEqual([1, 3]);
    expect(raices({ a: 1, b: 0, c: 1 })).toEqual([]);
    expect(raices({ a: 1, b: -2, c: 1 })).toEqual([1]);
    expect(vertice({ a: 0, b: 2, c: 1 })).toBeNull();
  });
  it('es precisa con coeficientes que provocan cancelación', () => {
    const [r1, r2] = raices({ a: 1, b: -1e8, c: 1 });
    expect(r1).toBeCloseTo(1e-8, 20);
    expect(r2).toBeCloseTo(1e8, 0);
  });
  it('obtiene la recta tangente y = m·x + n que toca la curva en x0', () => {
    for (const x0 of [-3, -0.5, 0, 1.25, 4]) {
      const t = tangente(q, x0);
      expect(t.en(x0)).toBeCloseTo(valor(q, x0), 12);
      expect(t.m).toBeCloseTo(2 * q.a * x0 + q.b, 12);
      // La tangente queda por debajo de una parábola que abre hacia arriba (a > 0) fuera de x0.
      expect(valor(q, x0 + 0.5)).toBeGreaterThan(t.en(x0 + 0.5));
    }
  });
  it('escribe el polinomio y su derivada como a mano', () => {
    expect(cuadraticaLatex(q)).toBe('x^2 - 4x + 3');
    expect(cuadraticaLatex({ a: -1, b: 0, c: 0 })).toBe('-x^2');
    expect(cuadraticaLatex({ a: 0.5, b: 1, c: -2 })).toBe('0{,}5x^2 + x - 2');
    expect(derivadaLatex(q)).toBe('2x - 4');
    expect(cuadraticaLatex({ a: 0, b: 0, c: 0 })).toBe('0');
  });
  it('produce pasos con identificadores estables', () => {
    const pasos = pasosDerivada(q, 1);
    expect(pasos.map((p) => p.id)).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);
    expect(pasos[4]!.latex).toContain('= -2');
    expect(pasos[5]!.latex).toBe('y = -2x + 2');
  });
  it('verifica respuestas numéricas sin ejecutar código', () => {
    expect(verificarNumero('-2', -2).estado).toBe('correcta');
    expect(verificarNumero('-4/2', -2).estado).toBe('correcta');
    expect(verificarNumero('−2,0', -2).estado).toBe('correcta');
    expect(verificarNumero('3', -2).estado).toBe('incorrecta');
    expect(verificarNumero('x', -2).estado).toBe('invalida');
    expect(verificarNumero('alert(1)', -2).estado).toBe('invalida');
    expect(verificarNumero('1/0', 1).estado).toBe('invalida');
  });
});

describe('muestreo y ejes', () => {
  it('corta la curva en las asíntotas en lugar de unirlas', () => {
    const tramos = muestrear((x) => 1 / x, { xMin: -2, xMax: 2, yMin: -5, yMax: 5 }, 401);
    expect(tramos.length).toBe(2);
    expect(muestrear((x) => Math.tan(x), { xMin: -4, xMax: 4, yMin: -5, yMax: 5 }, 800).length).toBeGreaterThanOrEqual(3);
    expect(muestrear(() => Number.NaN, { xMin: 0, xMax: 1, yMin: 0, yMax: 1 })).toEqual([]);
  });
  it('genera marcas redondas', () => {
    expect(marcas(-1, 5)).toEqual([-1, 0, 1, 2, 3, 4, 5]);
    expect(marcas(0, 100)).toEqual([0, 20, 40, 60, 80, 100]);
    expect(marcas(-0.3, 0.3)).toContain(0);
    expect(marcas(1, 1)).toEqual([]);
  });
  it('acerca y aleja sin degenerar la vista', () => {
    const v = { xMin: -10, xMax: 10, yMin: -5, yMax: 5 };
    expect(acercar(v, 0.5)).toEqual({ xMin: -5, xMax: 5, yMin: -2.5, yMax: 2.5 });
    let w = v;
    for (let k = 0; k < 40; k++) w = acercar(w, 0.1);
    expect(w.xMax - w.xMin).toBeGreaterThan(0);
  });
  it('formatea con coma decimal y signo menos tipográfico', () => {
    expect(decimal(-1.5)).toBe('−1,5');
    expect(decimal(-0.0001)).toBe('0');
    expect(decimal(2)).toBe('2');
  });
});
