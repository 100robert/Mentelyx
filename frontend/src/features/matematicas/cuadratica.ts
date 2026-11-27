import { analizar, evaluar, numeroLatex } from './expresion';

/**
 * Función cuadrática f(x) = ax² + bx + c y su derivada f′(x) = 2ax + b: valor, pendiente, recta tangente, vértice, raíces
 * y el desarrollo por la definición de derivada. Cálculo determinista (motor visual: la IA nunca calcula estos valores).
 */
export type Cuadratica = { a: number; b: number; c: number };
export type PasoDerivada = { id: string; titulo: string; latex: string; explicacion: string };

export const valor = ({ a, b, c }: Cuadratica, x: number) => a * x * x + b * x + c;
export const pendiente = ({ a, b }: Cuadratica, x: number) => 2 * a * x + b;

/** Recta tangente en x0: y = m·x + n, con m = f′(x0) y n = f(x0) − m·x0. */
export function tangente(q: Cuadratica, x0: number) {
  const m = pendiente(q, x0);
  const y0 = valor(q, x0);
  return { x0, y0, m, n: y0 - m * x0, en: (x: number) => y0 + m * (x - x0) };
}

/** Vértice (solo si a ≠ 0): x_v = −b / 2a, donde la pendiente es cero. */
export function vertice(q: Cuadratica) {
  if (q.a === 0) return null;
  const x = -q.b / (2 * q.a);
  return { x, y: valor(q, x) };
}

/** Raíces reales ordenadas (vacío si el discriminante es negativo o la función es constante no nula). */
export function raices(q: Cuadratica): number[] {
  const { a, b, c } = q;
  if (a === 0) return b === 0 ? [] : [-c / b];
  const d = b * b - 4 * a * c;
  if (d < -1e-12) return [];
  if (Math.abs(d) <= 1e-12) return [-b / (2 * a)];
  // Forma numéricamente estable (evita la cancelación de −b ± √d cuando b² ≫ 4ac).
  const s = Math.sqrt(d);
  const q1 = -0.5 * (b + Math.sign(b || 1) * s);
  const r = [q1 / a, c / q1].sort((x, y) => x - y);
  return r;
}

/** Término «coeficiente · variable» con su signo, para escribir polinomios como se escriben a mano. */
function termino(coef: number, variable: string, primero: boolean) {
  if (coef === 0) return '';
  const signo = coef < 0 ? '-' : primero ? '' : '+';
  const abs = Math.abs(coef);
  const cifra = variable && abs === 1 ? '' : numeroLatex(abs);
  return `${primero ? signo : ` ${signo} `}${cifra}${variable}`;
}

/** Polinomio en LaTeX a partir de pares (coeficiente, variable), omitiendo ceros y unos: 2x^2 - x + 3. */
export function polinomioLatex(terminos: Array<[number, string]>) {
  let salida = '';
  for (const [coef, variable] of terminos) salida += termino(coef, variable, salida === '');
  return salida || '0';
}

export const cuadraticaLatex = (q: Cuadratica) => polinomioLatex([[q.a, 'x^2'], [q.b, 'x'], [q.c, '']]);
export const derivadaLatex = (q: Cuadratica) => polinomioLatex([[2 * q.a, 'x'], [q.b, '']]);
const par = (v: number) => (v < 0 ? `(${numeroLatex(v)})` : numeroLatex(v));

/**
 * Desarrollo de la derivada por la definición, con identificadores estables (p1…p5) que el Tutor y el recorrido guiado
 * usan para revelar o señalar un paso sin reescribirlo.
 */
export function pasosDerivada(q: Cuadratica, x0: number): PasoDerivada[] {
  const t = tangente(q, x0);
  const { a, b } = q;
  return [
    {
      id: 'p1',
      titulo: 'La función',
      latex: `f(x) = ${cuadraticaLatex(q)}`,
      explicacion: 'Partimos de una función cuadrática: su gráfica es una parábola.',
    },
    {
      id: 'p2',
      titulo: 'La definición',
      latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
      explicacion: 'La derivada es el límite de la pendiente de la secante entre x y x + h cuando h tiende a cero.',
    },
    {
      id: 'p3',
      titulo: 'Desarrollar y simplificar',
      latex: `\\frac{f(x+h) - f(x)}{h} = \\frac{${polinomioLatex([[2 * a, 'xh'], [a, 'h^2'], [b, 'h']])}}{h} = ${polinomioLatex([[2 * a, 'x'], [a, 'h'], [b, '']])}`,
      explicacion: 'Al restar, los términos sin h se cancelan. Como h ≠ 0, se puede dividir entre h.',
    },
    {
      id: 'p4',
      titulo: 'Tomar el límite',
      latex: `f'(x) = ${derivadaLatex(q)}`,
      explicacion: 'Cuando h tiende a cero, el término con h desaparece: queda la derivada.',
    },
    {
      id: 'p5',
      titulo: 'Pendiente en el punto',
      latex: `f'(${numeroLatex(x0)}) = ${numeroLatex(2 * a)} \\cdot ${par(x0)} ${b < 0 ? '-' : '+'} ${numeroLatex(Math.abs(b))} = ${numeroLatex(t.m)}`,
      explicacion: `La derivada en x = ${numeroLatex(x0).replace('{,}', ',')} es la pendiente de la recta tangente en ese punto.`,
    },
    {
      id: 'p6',
      titulo: 'Recta tangente',
      latex: `y = ${polinomioLatex([[t.m, 'x'], [t.n, '']])}`,
      explicacion: 'La tangente pasa por (x₀, f(x₀)) con pendiente f′(x₀): y = f(x₀) + f′(x₀)(x − x₀).',
    },
  ];
}

export type Verificacion = { estado: 'correcta' | 'incorrecta' | 'invalida'; valor?: number; mensaje: string };

/**
 * Comprueba una respuesta numérica escrita por la persona (admite fracciones, coma decimal y expresiones sin variables,
 * con el mismo analizador seguro). La tolerancia es relativa al tamaño del valor esperado.
 */
export function verificarNumero(respuesta: string, esperado: number, tolerancia = 1e-6): Verificacion {
  const r = analizar(respuesta, []);
  if (!r.ok) return { estado: 'invalida', mensaje: r.error.mensaje };
  const v = evaluar(r.nodo, {});
  if (!Number.isFinite(v)) return { estado: 'invalida', mensaje: 'La respuesta no es un número finito.' };
  const ok = Math.abs(v - esperado) <= tolerancia * Math.max(1, Math.abs(esperado));
  return { estado: ok ? 'correcta' : 'incorrecta', valor: v, mensaje: ok ? 'Correcto.' : 'Todavía no: revisa el cálculo.' };
}
