/**
 * Expresiones matemáticas seguras: tokenizador, analizador descendente con precedencia y árbol sintáctico (AST).
 * Nunca usa `eval`, `Function` ni ejecución de código: solo números, variables declaradas, + − · / ^, menos unario,
 * multiplicación implícita y una lista cerrada de funciones (motor visual, sección 7, `EXPRESION_INVALIDA`,
 * `FUNCION_NO_PERMITIDA`, `VARIABLE_NO_DECLARADA`). Límites: 200 caracteres, 200 piezas y 32 niveles de anidación.
 */

export const LIMITES = { caracteres: 200, piezas: 200, profundidad: 32 } as const;

export const FUNCIONES = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sqrt', 'abs', 'ln', 'log', 'exp'] as const;
export type NombreFuncion = (typeof FUNCIONES)[number];
/** Equivalencias en español o de notación habitual: «sen» es el seno y «raiz», la raíz cuadrada. */
// Mapas (no objetos literales): así «constructor», «__proto__» o «toString» nunca resuelven a algo del prototipo.
const ALIAS = new Map<string, NombreFuncion>([['sen', 'sin'], ['tg', 'tan'], ['arcsen', 'asin'], ['arcsin', 'asin'], ['arccos', 'acos'], ['arctan', 'atan'], ['raiz', 'sqrt']]);
const CONSTANTES = new Map<string, number>([['pi', Math.PI], ['e', Math.E]]);
const NOMBRES_FUNCION = new Set<string>(FUNCIONES);

export type Nodo =
  | { t: 'num'; v: number }
  | { t: 'var'; n: string }
  | { t: 'neg'; a: Nodo }
  | { t: 'bin'; op: '+' | '-' | '*' | '/' | '^'; a: Nodo; b: Nodo }
  | { t: 'fn'; f: NombreFuncion; a: Nodo };

export type CodigoExpresion = 'EXPRESION_INVALIDA' | 'FUNCION_NO_PERMITIDA' | 'VARIABLE_NO_DECLARADA' | 'EXPRESION_DEMASIADO_LARGA';
export type ErrorExpresion = { codigo: CodigoExpresion; mensaje: string; posicion: number };
export type Analisis = { ok: true; nodo: Nodo } | { ok: false; error: ErrorExpresion };

type Pieza =
  | { k: 'num'; v: number; p: number }
  | { k: 'id'; v: string; p: number }
  | { k: 'var'; v: string; p: number }
  | { k: 'op'; v: '+' | '-' | '*' | '/' | '^'; p: number }
  | { k: '('; p: number }
  | { k: ')'; p: number };

class Fallo extends Error {
  constructor(readonly detalle: ErrorExpresion) {
    super(detalle.mensaje);
  }
}
const fallar = (codigo: CodigoExpresion, mensaje: string, posicion: number): never => {
  throw new Fallo({ codigo, mensaje, posicion });
};

const SUPERINDICES: Record<string, string> = { '²': '^2', '³': '^3' };
const OPERADORES: Record<string, '+' | '-' | '*' | '/' | '^'> = { '+': '+', '-': '-', '−': '-', '*': '*', '·': '*', '×': '*', '/': '/', '÷': '/', '^': '^' };
const esDigito = (c: string) => c >= '0' && c <= '9';
const esLetra = (c: string) => (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');

function tokenizar(fuente: string, variables: ReadonlySet<string>): Pieza[] {
  const piezas: Pieza[] = [];
  let i = 0;
  while (i < fuente.length) {
    const c = fuente[i]!;
    if (c === ' ' || c === '\t') {
      i++;
      continue;
    }
    if (Object.hasOwn(SUPERINDICES, c)) {
      piezas.push({ k: 'op', v: '^', p: i }, { k: 'num', v: Number(SUPERINDICES[c]!.slice(1)), p: i });
      i++;
      continue;
    }
    if (esDigito(c) || (c === '.' && esDigito(fuente[i + 1] ?? ''))) {
      const inicio = i;
      while (esDigito(fuente[i] ?? '')) i++;
      // Coma o punto decimal entre cifras (no hay funciones de varios argumentos, así que la coma no es ambigua).
      if ((fuente[i] === '.' || fuente[i] === ',') && esDigito(fuente[i + 1] ?? '')) {
        i++;
        while (esDigito(fuente[i] ?? '')) i++;
      }
      const v = Number(fuente.slice(inicio, i).replace(',', '.'));
      if (!Number.isFinite(v)) fallar('EXPRESION_INVALIDA', 'Número no válido.', inicio);
      piezas.push({ k: 'num', v, p: inicio });
      continue;
    }
    if (esLetra(c) || c === 'π') {
      if (c === 'π') {
        piezas.push({ k: 'num', v: Math.PI, p: i });
        i++;
        continue;
      }
      const inicio = i;
      while (esLetra(fuente[i] ?? '')) i++;
      const palabra = fuente.slice(inicio, i).toLowerCase();
      // Una palabra es una función, una constante o un producto de variables de una letra («xy» = x·y).
      if (variables.has(palabra)) piezas.push({ k: 'var', v: palabra, p: inicio });
      else if (NOMBRES_FUNCION.has(palabra) || ALIAS.has(palabra) || CONSTANTES.has(palabra)) piezas.push({ k: 'id', v: palabra, p: inicio });
      else {
        for (let j = 0; j < palabra.length; j++) {
          const letra = palabra[j]!;
          if (variables.has(letra)) piezas.push({ k: 'var', v: letra, p: inicio + j });
          else if (CONSTANTES.has(letra)) piezas.push({ k: 'id', v: letra, p: inicio + j });
          else if (palabra.length > 1) fallar('FUNCION_NO_PERMITIDA', `«${palabra}» no es una función permitida.`, inicio);
          else fallar('VARIABLE_NO_DECLARADA', `La variable «${letra}» no está declarada.`, inicio + j);
        }
      }
      continue;
    }
    if (Object.hasOwn(OPERADORES, c)) {
      piezas.push({ k: 'op', v: OPERADORES[c]!, p: i });
      i++;
      continue;
    }
    if (c === '(' || c === '[') {
      piezas.push({ k: '(', p: i });
      i++;
      continue;
    }
    if (c === ')' || c === ']') {
      piezas.push({ k: ')', p: i });
      i++;
      continue;
    }
    fallar('EXPRESION_INVALIDA', `Carácter no permitido: «${c}».`, i);
  }
  if (piezas.length > LIMITES.piezas) fallar('EXPRESION_DEMASIADO_LARGA', 'La expresión es demasiado larga.', 0);
  return piezas;
}

/**
 * Gramática (de menor a mayor precedencia):
 * suma := producto (('+' | '-') producto)*
 * producto := unario (('*' | '/' | implícita) unario)*
 * unario := '-' unario | '+' unario | potencia
 * potencia := atomo ('^' unario)?        (asociativa a la derecha: 2^3^2 = 2^9; −x² = −(x²))
 * atomo := número | variable | constante | función '(' suma ')' | '(' suma ')'
 */
function analizarPiezas(piezas: Pieza[], longitud: number): Nodo {
  let i = 0;
  let profundidad = 0;
  const ver = () => piezas[i];
  const entrar = (p: number) => {
    if (++profundidad > LIMITES.profundidad) fallar('EXPRESION_DEMASIADO_LARGA', 'La expresión tiene demasiados niveles.', p);
  };
  const posicion = () => ver()?.p ?? longitud;

  const suma = (): Nodo => {
    let n = producto();
    for (let s = ver(); s?.k === 'op' && (s.v === '+' || s.v === '-'); s = ver()) {
      i++;
      n = { t: 'bin', op: s.v, a: n, b: producto() };
    }
    return n;
  };
  const empiezaAtomo = (s: Pieza | undefined) => !!s && (s.k === 'num' || s.k === 'id' || s.k === 'var' || s.k === '(');
  const producto = (): Nodo => {
    let n = unario();
    for (;;) {
      const s = ver();
      if (s?.k === 'op' && (s.v === '*' || s.v === '/')) {
        i++;
        n = { t: 'bin', op: s.v, a: n, b: unario() };
      } else if (empiezaAtomo(s)) n = { t: 'bin', op: '*', a: n, b: unario() };
      else return n;
    }
  };
  const unario = (): Nodo => {
    const s = ver();
    if (s?.k === 'op' && (s.v === '-' || s.v === '+')) {
      i++;
      entrar(s.p);
      const a = unario();
      profundidad--;
      return s.v === '-' ? { t: 'neg', a } : a;
    }
    return potencia();
  };
  const potencia = (): Nodo => {
    const base = atomo();
    const s = ver();
    if (s?.k === 'op' && s.v === '^') {
      i++;
      entrar(s.p);
      const exponente = unario();
      profundidad--;
      return { t: 'bin', op: '^', a: base, b: exponente };
    }
    return base;
  };
  const atomo = (): Nodo => {
    const s = ver();
    if (!s) return fallar('EXPRESION_INVALIDA', 'La expresión está incompleta.', longitud);
    if (s.k === 'num') {
      i++;
      return { t: 'num', v: s.v };
    }
    if (s.k === '(') {
      i++;
      entrar(s.p);
      const n = suma();
      if (ver()?.k !== ')') fallar('EXPRESION_INVALIDA', 'Falta cerrar un paréntesis.', posicion());
      i++;
      profundidad--;
      return n;
    }
    if (s.k === 'var') {
      i++;
      return { t: 'var', n: s.v };
    }
    if (s.k === 'id') {
      i++;
      const f = ALIAS.get(s.v) ?? (NOMBRES_FUNCION.has(s.v) ? (s.v as NombreFuncion) : null);
      if (f) {
        if (ver()?.k !== '(') fallar('EXPRESION_INVALIDA', `Escribe el argumento de ${s.v} entre paréntesis.`, posicion());
        i++;
        entrar(s.p);
        const a = suma();
        if (ver()?.k !== ')') fallar('EXPRESION_INVALIDA', 'Falta cerrar un paréntesis.', posicion());
        i++;
        profundidad--;
        return { t: 'fn', f, a };
      }
      return { t: 'num', v: CONSTANTES.get(s.v) ?? Number.NaN };
    }
    return fallar('EXPRESION_INVALIDA', s.k === ')' ? 'Sobra un paréntesis de cierre.' : 'Falta un término antes del operador.', s.p);
  };

  const n = suma();
  if (i < piezas.length) fallar('EXPRESION_INVALIDA', piezas[i]!.k === ')' ? 'Sobra un paréntesis de cierre.' : 'Hay un término que no se esperaba.', piezas[i]!.p);
  return n;
}

/** Analiza `fuente` admitiendo solo las variables indicadas (por omisión, `x`). Nunca lanza: devuelve el error. */
export function analizar(fuente: string, variables: readonly string[] = ['x']): Analisis {
  try {
    if (typeof fuente !== 'string' || fuente.trim() === '') return { ok: false, error: { codigo: 'EXPRESION_INVALIDA', mensaje: 'Escribe una expresión.', posicion: 0 } };
    if (fuente.length > LIMITES.caracteres) return { ok: false, error: { codigo: 'EXPRESION_DEMASIADO_LARGA', mensaje: 'La expresión es demasiado larga.', posicion: LIMITES.caracteres } };
    return { ok: true, nodo: analizarPiezas(tokenizar(fuente, new Set(variables)), fuente.length) };
  } catch (e) {
    if (e instanceof Fallo) return { ok: false, error: e.detalle };
    throw e;
  }
}

const APLICAR: Record<NombreFuncion, (x: number) => number> = {
  sin: Math.sin,
  cos: Math.cos,
  tan: Math.tan,
  asin: Math.asin,
  acos: Math.acos,
  atan: Math.atan,
  sqrt: Math.sqrt,
  abs: Math.abs,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
};

/** Evalúa el árbol. Fuera del dominio devuelve NaN (no lanza); una variable sin valor también da NaN. */
export function evaluar(n: Nodo, valores: Readonly<Record<string, number>>): number {
  switch (n.t) {
    case 'num':
      return n.v;
    case 'var':
      return valores[n.n] ?? Number.NaN;
    case 'neg':
      return -evaluar(n.a, valores);
    case 'fn':
      return APLICAR[n.f](evaluar(n.a, valores));
    case 'bin': {
      const a = evaluar(n.a, valores);
      const b = evaluar(n.b, valores);
      switch (n.op) {
        case '+':
          return a + b;
        case '-':
          return a - b;
        case '*':
          return a * b;
        case '/':
          return a / b;
        case '^':
          return Math.pow(a, b);
      }
    }
  }
}

/** Compila la expresión a una función de una variable para muestrear curvas (sin `Function`: un cierre sobre el AST). */
export function funcionDe(n: Nodo, variable = 'x', fijos: Readonly<Record<string, number>> = {}) {
  const valores: Record<string, number> = { ...fijos };
  return (x: number) => {
    valores[variable] = x;
    return evaluar(n, valores);
  };
}

const num = (v: number): Nodo => ({ t: 'num', v });
const esNum = (n: Nodo): n is { t: 'num'; v: number } => n.t === 'num';
/** Sin predicado de tipo: que un nodo no valga 0 no significa que no sea un número. */
const vale = (n: Nodo, v: number): boolean => n.t === 'num' && n.v === v;

/** Simplificación conservadora: pliega constantes y aplica identidades con 0 y 1 (no reordena términos). */
export function simplificar(n: Nodo): Nodo {
  switch (n.t) {
    case 'num':
    case 'var':
      return n;
    case 'neg': {
      const a = simplificar(n.a);
      if (esNum(a)) return num(-a.v);
      if (a.t === 'neg') return a.a;
      return { t: 'neg', a };
    }
    case 'fn': {
      const a = simplificar(n.a);
      return { t: 'fn', f: n.f, a };
    }
    case 'bin': {
      const a = simplificar(n.a);
      const b = simplificar(n.b);
      if (esNum(a) && esNum(b)) {
        // Solo se pliegan resultados «limpios» (hasta 6 decimales): 1/3 queda como fracción.
        const v = evaluar({ t: 'bin', op: n.op, a, b }, {});
        if (Number.isFinite(v) && Math.abs(v * 1e6 - Math.round(v * 1e6)) < 1e-6) return num(Math.round(v * 1e6) / 1e6);
      }
      switch (n.op) {
        case '+':
          if (vale(a, 0)) return b;
          if (vale(b, 0)) return a;
          if (b.t === 'neg') return simplificar({ t: 'bin', op: '-', a, b: b.a });
          break;
        case '-':
          if (vale(b, 0)) return a;
          if (vale(a, 0)) return simplificar({ t: 'neg', a: b });
          break;
        case '*':
          if (vale(a, 0) || vale(b, 0)) return num(0);
          if (vale(a, 1)) return b;
          if (vale(b, 1)) return a;
          if (esNum(b) && !esNum(a)) return simplificar({ t: 'bin', op: '*', a: b, b: a });
          if (esNum(a) && b.t === 'bin' && b.op === '*' && esNum(b.a)) return simplificar({ t: 'bin', op: '*', a: num(a.v * b.a.v), b: b.b });
          break;
        case '/':
          if (vale(a, 0)) return num(0);
          if (vale(b, 1)) return a;
          break;
        case '^':
          if (vale(b, 0)) return num(1);
          if (vale(b, 1)) return a;
          break;
      }
      return { t: 'bin', op: n.op, a, b };
    }
  }
}

/** Derivada simbólica respecto de `v` con las reglas habituales; el resultado se simplifica. */
export function derivar(n: Nodo, v = 'x'): Nodo {
  const d = (m: Nodo): Nodo => derivar(m, v);
  const depende = (m: Nodo): boolean =>
    m.t === 'var' ? m.n === v : m.t === 'num' ? false : m.t === 'bin' ? depende(m.a) || depende(m.b) : depende(m.a);
  const mul = (a: Nodo, b: Nodo): Nodo => ({ t: 'bin', op: '*', a, b });
  const div = (a: Nodo, b: Nodo): Nodo => ({ t: 'bin', op: '/', a, b });
  const res = (a: Nodo, b: Nodo): Nodo => ({ t: 'bin', op: '-', a, b });
  const sum = (a: Nodo, b: Nodo): Nodo => ({ t: 'bin', op: '+', a, b });
  const pot = (a: Nodo, b: Nodo): Nodo => ({ t: 'bin', op: '^', a, b });
  const fn = (f: NombreFuncion, a: Nodo): Nodo => ({ t: 'fn', f, a });
  let r: Nodo;
  switch (n.t) {
    case 'num':
      r = num(0);
      break;
    case 'var':
      r = num(n.n === v ? 1 : 0);
      break;
    case 'neg':
      r = { t: 'neg', a: d(n.a) };
      break;
    case 'bin': {
      const { a, b } = n;
      switch (n.op) {
        case '+':
          r = sum(d(a), d(b));
          break;
        case '-':
          r = res(d(a), d(b));
          break;
        case '*':
          r = sum(mul(d(a), b), mul(a, d(b)));
          break;
        case '/':
          r = div(res(mul(d(a), b), mul(a, d(b))), pot(b, num(2)));
          break;
        case '^':
          if (!depende(b)) r = mul(mul(b, pot(a, simplificar(res(b, num(1))))), d(a));
          else if (!depende(a)) r = mul(mul(n, fn('ln', a)), d(b));
          else r = mul(n, sum(mul(d(b), fn('ln', a)), div(mul(b, d(a)), a)));
          break;
      }
      break;
    }
    case 'fn': {
      const u = n.a;
      const du = d(u);
      const interna: Record<NombreFuncion, Nodo> = {
        sin: fn('cos', u),
        cos: { t: 'neg', a: fn('sin', u) },
        tan: div(num(1), pot(fn('cos', u), num(2))),
        asin: div(num(1), fn('sqrt', res(num(1), pot(u, num(2))))),
        acos: { t: 'neg', a: div(num(1), fn('sqrt', res(num(1), pot(u, num(2))))) },
        atan: div(num(1), sum(num(1), pot(u, num(2)))),
        sqrt: div(num(1), mul(num(2), fn('sqrt', u))),
        abs: div(u, fn('abs', u)),
        ln: div(num(1), u),
        log: div(num(1), mul(u, fn('ln', num(10)))),
        exp: fn('exp', u),
      };
      r = mul(interna[n.f], du);
      break;
    }
  }
  return simplificar(r);
}

const PRECEDENCIA = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 4 } as const;
const LATEX_FUNCION: Record<NombreFuncion, string> = {
  sin: '\\sin',
  cos: '\\cos',
  tan: '\\tan',
  asin: '\\arcsin',
  acos: '\\arccos',
  atan: '\\arctan',
  sqrt: '\\sqrt',
  abs: '',
  ln: '\\ln',
  log: '\\log',
  exp: '\\exp',
};

/** Número para LaTeX con coma decimal (convención del español) y como mucho 4 decimales. */
export function numeroLatex(v: number) {
  if (Number.isInteger(v)) return String(v);
  return String(Number(v.toFixed(4))).replace('.', '{,}');
}

/** LaTeX legible de la expresión (las expresiones vienen siempre del analizador: no hay texto arbitrario). */
export function aLatex(n: Nodo, padre = 0): string {
  switch (n.t) {
    case 'num':
      return n.v === Math.PI ? '\\pi' : n.v === Math.E ? 'e' : n.v < 0 && padre > 0 ? `(${numeroLatex(n.v)})` : numeroLatex(n.v);
    case 'var':
      return n.n === 'theta' ? '\\theta' : n.n;
    case 'neg': {
      const t = `-${aLatex(n.a, 3)}`;
      return padre >= 2 ? `\\left(${t}\\right)` : t;
    }
    case 'fn':
      if (n.f === 'sqrt') return `\\sqrt{${aLatex(n.a)}}`;
      if (n.f === 'abs') return `\\left|${aLatex(n.a)}\\right|`;
      return `${LATEX_FUNCION[n.f]}\\left(${aLatex(n.a)}\\right)`;
    case 'bin': {
      const p = PRECEDENCIA[n.op];
      let t: string;
      if (n.op === '/') t = `\\frac{${aLatex(n.a)}}{${aLatex(n.b)}}`;
      else if (n.op === '^') t = `{${aLatex(n.a, 5)}}^{${aLatex(n.b)}}`;
      else if (n.op === '*') {
        const izq = aLatex(n.a, p);
        const der = aLatex(n.b, p);
        // 2x, 3\sin(x): yuxtaposición cuando el factor izquierdo es un número y el derecho no empieza por cifra.
        t = n.a.t === 'num' && !/^[\d-]/.test(der) ? `${izq}${der}` : `${izq} \\cdot ${der}`;
      } else {
        const der = aLatex(n.b, n.op === '-' ? p + 1 : p);
        t = `${aLatex(n.a, p)} ${n.op} ${der}`;
      }
      return p < padre || (n.op === '^' && padre === 5) ? `\\left(${t}\\right)` : t;
    }
  }
}

/** Derivada numérica centrada (respaldo para funciones sin derivada simbólica útil en un punto). */
export function derivadaNumerica(f: (x: number) => number, x: number, h = 1e-5) {
  return (f(x + h) - f(x - h)) / (2 * h);
}
