/**
 * Modelo de la capa de trabajo de la pizarra: trazos a mano, formas, textos y expresiones del estudiante. Es lógica pura
 * (sin DOM ni React) para que dibujar, seleccionar, borrar, deshacer, rehacer, hacer zoom y desplazar se prueben solos.
 *
 * Coordenadas: el «mundo» es el plano de la pizarra en píxeles a escala 1. Un elemento con `ancla` pertenece a un bloque
 * de contenido (es una anotación sobre él) y sus coordenadas son relativas a la esquina superior izquierda de ese bloque:
 * así sigue en su sitio aunque el bloque cambie de altura o la vista se acerque. Sin `ancla`, es trabajo libre.
 * El contenido del Tutor nunca está aquí: vive en los bloques y ninguna herramienta de esta capa lo borra.
 */
export type Vec = readonly [number, number];
export type Caja = { x: number; y: number; w: number; h: number };

export const TINTAS = ['tinta', 'azul', 'rojo', 'verde', 'naranja', 'morado'] as const;
export const RESALTADORES = ['amarillo', 'verde-claro', 'rosa', 'celeste'] as const;
export type Tinta = (typeof TINTAS)[number];
export type ColorResaltador = (typeof RESALTADORES)[number];
export type Color = Tinta | ColorResaltador;
export const NOMBRE_COLOR: Record<Color, string> = {
  tinta: 'Tinta',
  azul: 'Azul',
  rojo: 'Rojo',
  verde: 'Verde',
  naranja: 'Naranja',
  morado: 'Morado',
  amarillo: 'Amarillo',
  'verde-claro': 'Verde claro',
  rosa: 'Rosa',
  celeste: 'Celeste',
};

export type Estilo = { color: Color; grosor: number; opacidad: number };
export type Pincel = 'lapiz' | 'plumon' | 'resaltador';
type Base = { id: string; estilo: Estilo; ancla?: string };
/** Cada punto lleva la presión del puntero (0–1; 0,5 con ratón o dedo). */
export type Trazo = Base & { tipo: 'trazo'; pincel: Pincel; puntos: Array<[number, number, number]> };
export type Forma = Base & { tipo: 'linea' | 'flecha' | 'rectangulo' | 'circulo'; desde: Vec; hasta: Vec };
/** Texto escrito con el teclado. `expresion`: se muestra como matemática (si el analizador seguro la entiende). */
export type TextoTrabajo = Base & { tipo: 'texto'; en: Vec; texto: string; expresion: boolean; tamano: number; etiqueta: string };
/** Imagen del equipo de la persona: se muestra con una URL local del navegador; no se sube ni se guarda. */
export type ImagenTrabajo = Base & { tipo: 'imagen'; en: Vec; w: number; h: number; src: string; nombre: string };
export type Elemento = Trazo | Forma | TextoTrabajo | ImagenTrabajo;
export type TipoElemento = Elemento['tipo'];

export type Herramienta = 'seleccion' | 'mano' | 'lapiz' | 'plumon' | 'resaltador' | 'borrador' | 'texto' | 'linea' | 'flecha' | 'rectangulo' | 'circulo';
export const HERRAMIENTAS_DIBUJO: ReadonlySet<Herramienta> = new Set(['lapiz', 'plumon', 'resaltador', 'linea', 'flecha', 'rectangulo', 'circulo']);

/** Estilo inicial de cada pincel: el resaltador es ancho y translúcido para que se lea lo de abajo. */
export const ESTILO_INICIAL: Record<Pincel | 'forma' | 'texto', Estilo> = {
  lapiz: { color: 'tinta', grosor: 2.5, opacidad: 1 },
  plumon: { color: 'azul', grosor: 6, opacidad: 1 },
  resaltador: { color: 'amarillo', grosor: 18, opacidad: 0.38 },
  forma: { color: 'tinta', grosor: 2.5, opacidad: 1 },
  texto: { color: 'tinta', grosor: 2.5, opacidad: 1 },
};
export const LIMITES_ESTILO = { grosor: [1, 40] as const, opacidad: [0.1, 1] as const };
export const MAX_ELEMENTOS = 2000;
export const MAX_PUNTOS = 4000;
export const MAX_TEXTO = 400;

const limitar = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
let contador = 0;
/** Identificador corto y único en la sesión (no viaja al servidor: la capa de trabajo no se guarda todavía). */
export const nuevoId = () => `e${Date.now().toString(36)}${(contador++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

/* ---------------------------------------------------------------- geometría */

export function normalizar(desde: Vec, hasta: Vec): Caja {
  return { x: Math.min(desde[0], hasta[0]), y: Math.min(desde[1], hasta[1]), w: Math.abs(hasta[0] - desde[0]), h: Math.abs(hasta[1] - desde[1]) };
}
export const intersectan = (a: Caja, b: Caja) => a.x <= b.x + b.w && b.x <= a.x + a.w && a.y <= b.y + b.h && b.y <= a.y + a.h;
export const contiene = (c: Caja, p: Vec) => p[0] >= c.x && p[0] <= c.x + c.w && p[1] >= c.y && p[1] <= c.y + c.h;
export const inflar = (c: Caja, d: number): Caja => ({ x: c.x - d, y: c.y - d, w: c.w + 2 * d, h: c.h + 2 * d });
export function union(cajas: readonly Caja[]): Caja | null {
  if (cajas.length === 0) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of cajas) {
    x0 = Math.min(x0, c.x);
    y0 = Math.min(y0, c.y);
    x1 = Math.max(x1, c.x + c.w);
    y1 = Math.max(y1, c.y + c.h);
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

export function distanciaASegmento(p: Vec, a: Vec, b: Vec) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const largo = dx * dx + dy * dy;
  const t = largo === 0 ? 0 : limitar(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / largo, 0, 1);
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

/** Tamaño aproximado de un texto (sin DOM): sirve para seleccionar y borrar; la vista puede darle la medida real. */
export function medidaTexto(t: Pick<TextoTrabajo, 'texto' | 'tamano'>): { w: number; h: number } {
  const lineas = t.texto.split('\n');
  const ancho = Math.max(1, ...lineas.map((l) => l.length));
  return { w: ancho * t.tamano * 0.56 + 8, h: lineas.length * t.tamano * 1.45 + 4 };
}

/** Caja de un elemento en sus propias coordenadas (relativas al bloque si está anclado). */
export function cajaDe(e: Elemento, medidas?: ReadonlyMap<string, { w: number; h: number }>): Caja {
  if (e.tipo === 'imagen') return { x: e.en[0], y: e.en[1], w: e.w, h: e.h };
  const medio = e.tipo === 'texto' ? 0 : e.estilo.grosor / 2;
  if (e.tipo === 'trazo') {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const [x, y] of e.puntos) {
      x0 = Math.min(x0, x);
      y0 = Math.min(y0, y);
      x1 = Math.max(x1, x);
      y1 = Math.max(y1, y);
    }
    if (!Number.isFinite(x0)) return { x: 0, y: 0, w: 0, h: 0 };
    return { x: x0 - medio, y: y0 - medio, w: x1 - x0 + 2 * medio, h: y1 - y0 + 2 * medio };
  }
  if (e.tipo === 'texto') {
    const m = medidas?.get(e.id) ?? medidaTexto(e);
    return { x: e.en[0], y: e.en[1], w: m.w, h: m.h };
  }
  return inflar(normalizar(e.desde, e.hasta), medio);
}

/** ¿El punto `p` (mismas coordenadas que el elemento) toca el elemento, con una tolerancia `radio`? */
export function tocaElemento(e: Elemento, p: Vec, radio: number, medidas?: ReadonlyMap<string, { w: number; h: number }>): boolean {
  const r = radio + (e.tipo === 'texto' || e.tipo === 'imagen' ? 0 : e.estilo.grosor / 2);
  if (!contiene(inflar(cajaDe(e, medidas), radio), p)) return false;
  switch (e.tipo) {
    case 'texto':
    case 'imagen':
      return true;
    case 'trazo': {
      const ps = e.puntos;
      if (ps.length === 1) return Math.hypot(p[0] - ps[0]![0], p[1] - ps[0]![1]) <= r;
      for (let i = 1; i < ps.length; i++) if (distanciaASegmento(p, [ps[i - 1]![0], ps[i - 1]![1]], [ps[i]![0], ps[i]![1]]) <= r) return true;
      return false;
    }
    case 'linea':
    case 'flecha':
      return distanciaASegmento(p, e.desde, e.hasta) <= r;
    case 'rectangulo': {
      const c = normalizar(e.desde, e.hasta);
      const esquinas: Vec[] = [[c.x, c.y], [c.x + c.w, c.y], [c.x + c.w, c.y + c.h], [c.x, c.y + c.h]];
      return esquinas.some((a, i) => distanciaASegmento(p, a, esquinas[(i + 1) % 4]!) <= r);
    }
    case 'circulo': {
      const c = normalizar(e.desde, e.hasta);
      const rx = Math.max(c.w / 2, 0.5);
      const ry = Math.max(c.h / 2, 0.5);
      const dx = (p[0] - (c.x + rx)) / rx;
      const dy = (p[1] - (c.y + ry)) / ry;
      // Distancia aproximada al borde de la elipse, en píxeles.
      return Math.abs(Math.hypot(dx, dy) - 1) * Math.min(rx, ry) <= r;
    }
  }
}

export function trasladar<T extends Elemento>(e: T, dx: number, dy: number): T {
  if (e.tipo === 'trazo') return { ...e, puntos: e.puntos.map(([x, y, p]) => [x + dx, y + dy, p] as [number, number, number]) };
  if (e.tipo === 'texto' || e.tipo === 'imagen') return { ...e, en: [e.en[0] + dx, e.en[1] + dy] };
  return { ...e, desde: [e.desde[0] + dx, e.desde[1] + dy], hasta: [e.hasta[0] + dx, e.hasta[1] + dy] } as T;
}

/** Simplificación de Ramer-Douglas-Peucker: menos puntos con la misma forma (la presión se conserva). */
export function simplificar(puntos: ReadonlyArray<[number, number, number]>, tolerancia = 0.6): Array<[number, number, number]> {
  if (puntos.length <= 2) return puntos.map((p) => [...p] as [number, number, number]);
  const guardar = new Uint8Array(puntos.length);
  guardar[0] = 1;
  guardar[puntos.length - 1] = 1;
  const pila: Array<[number, number]> = [[0, puntos.length - 1]];
  while (pila.length) {
    const [i, j] = pila.pop()!;
    let peor = -1;
    let distancia = 0;
    const a: Vec = [puntos[i]![0], puntos[i]![1]];
    const b: Vec = [puntos[j]![0], puntos[j]![1]];
    for (let k = i + 1; k < j; k++) {
      const d = distanciaASegmento([puntos[k]![0], puntos[k]![1]], a, b);
      // Un cambio fuerte de presión también se conserva (el trazo engrosa o adelgaza ahí).
      const dp = Math.abs(puntos[k]![2] - (puntos[i]![2] + puntos[j]![2]) / 2) * 6;
      if (Math.max(d, dp) > distancia) {
        distancia = Math.max(d, dp);
        peor = k;
      }
    }
    if (peor !== -1 && distancia > tolerancia) {
      guardar[peor] = 1;
      pila.push([i, peor], [peor, j]);
    }
  }
  return puntos.filter((_, k) => guardar[k]).map((p) => [...p] as [number, number, number]);
}

const r1 = (v: number) => Math.round(v * 10) / 10;

/** Camino suave (curvas cuadráticas por los puntos medios) para un trazo de grosor constante. */
export function caminoSuave(puntos: ReadonlyArray<readonly [number, number, number?]>): string {
  if (puntos.length === 0) return '';
  const [x0, y0] = puntos[0]!;
  if (puntos.length === 1) return `M${r1(x0)} ${r1(y0)}l0.01 0`;
  let d = `M${r1(x0)} ${r1(y0)}`;
  for (let i = 1; i < puntos.length - 1; i++) {
    const [x, y] = puntos[i]!;
    const [xn, yn] = puntos[i + 1]!;
    d += `Q${r1(x)} ${r1(y)} ${r1((x + xn) / 2)} ${r1((y + yn) / 2)}`;
  }
  const [xf, yf] = puntos.at(-1)!;
  return `${d}L${r1(xf)} ${r1(yf)}`;
}

/** ¿La presión varía lo suficiente como para dibujar el contorno (lápiz óptico) en lugar de un trazo constante? */
export const conPresion = (t: Pick<Trazo, 'puntos'>) => {
  let min = 1, max = 0;
  for (const p of t.puntos) {
    min = Math.min(min, p[2]);
    max = Math.max(max, p[2]);
  }
  return max - min > 0.08;
};

/** Contorno relleno de un trazo con grosor variable según la presión (sin bibliotecas). */
export function contornoPresion(puntos: ReadonlyArray<[number, number, number]>, grosor: number): string {
  if (puntos.length < 2) return caminoSuave(puntos);
  const izq: Vec[] = [];
  const der: Vec[] = [];
  for (let i = 0; i < puntos.length; i++) {
    const a = puntos[Math.max(0, i - 1)]!;
    const b = puntos[Math.min(puntos.length - 1, i + 1)]!;
    let nx = -(b[1] - a[1]);
    let ny = b[0] - a[0];
    const largo = Math.hypot(nx, ny) || 1;
    nx /= largo;
    ny /= largo;
    const w = (grosor * (0.35 + 0.95 * puntos[i]![2])) / 2;
    izq.push([puntos[i]![0] + nx * w, puntos[i]![1] + ny * w]);
    der.push([puntos[i]![0] - nx * w, puntos[i]![1] - ny * w]);
  }
  const ida = izq.map((p, k) => `${k === 0 ? 'M' : 'L'}${r1(p[0])} ${r1(p[1])}`).join('');
  const vuelta = der.reverse().map((p) => `L${r1(p[0])} ${r1(p[1])}`).join('');
  return `${ida}${vuelta}Z`;
}

/** Punta de flecha: dos segmentos desde el extremo, proporcionales al grosor. */
export function puntaFlecha(desde: Vec, hasta: Vec, grosor: number): string {
  const ang = Math.atan2(hasta[1] - desde[1], hasta[0] - desde[0]);
  const largo = Math.max(10, grosor * 4);
  const a1 = ang + Math.PI - 0.45;
  const a2 = ang + Math.PI + 0.45;
  return `M${r1(hasta[0] + Math.cos(a1) * largo)} ${r1(hasta[1] + Math.sin(a1) * largo)}L${r1(hasta[0])} ${r1(hasta[1])}L${r1(hasta[0] + Math.cos(a2) * largo)} ${r1(hasta[1] + Math.sin(a2) * largo)}`;
}

/** Camino SVG de una forma (también para la vista previa mientras se dibuja). */
export function caminoForma(tipo: Forma['tipo'], desde: Vec, hasta: Vec, grosor: number): string {
  if (tipo === 'linea') return `M${r1(desde[0])} ${r1(desde[1])}L${r1(hasta[0])} ${r1(hasta[1])}`;
  if (tipo === 'flecha') return `M${r1(desde[0])} ${r1(desde[1])}L${r1(hasta[0])} ${r1(hasta[1])}${puntaFlecha(desde, hasta, grosor)}`;
  const c = normalizar(desde, hasta);
  if (tipo === 'rectangulo') return `M${r1(c.x)} ${r1(c.y)}h${r1(c.w)}v${r1(c.h)}h${r1(-c.w)}Z`;
  const rx = r1(c.w / 2);
  const ry = r1(c.h / 2);
  return `M${r1(c.x)} ${r1(c.y + c.h / 2)}a${rx} ${ry} 0 1 0 ${r1(c.w)} 0a${rx} ${ry} 0 1 0 ${r1(-c.w)} 0Z`;
}

/* ------------------------------------------------- posiciones con anclas */

export type Origenes = ReadonlyMap<string, Vec>;
/** Desplazamiento al mundo de un elemento: el origen de su bloque, o (0, 0) si es trabajo libre. `null`: su bloque ya no está. */
export function desplazamiento(e: Pick<Elemento, 'ancla'>, origenes: Origenes): Vec | null {
  if (!e.ancla) return [0, 0];
  return origenes.get(e.ancla) ?? null;
}
export function cajaEnMundo(e: Elemento, origenes: Origenes, medidas?: ReadonlyMap<string, { w: number; h: number }>): Caja | null {
  const d = desplazamiento(e, origenes);
  if (!d) return null;
  const c = cajaDe(e, medidas);
  return { ...c, x: c.x + d[0], y: c.y + d[1] };
}
/** Elemento más arriba (el último dibujado) bajo un punto del mundo. */
export function elementoEn(elementos: readonly Elemento[], p: Vec, radio: number, origenes: Origenes, medidas?: ReadonlyMap<string, { w: number; h: number }>) {
  for (let i = elementos.length - 1; i >= 0; i--) {
    const e = elementos[i]!;
    const d = desplazamiento(e, origenes);
    if (d && tocaElemento(e, [p[0] - d[0], p[1] - d[1]], radio, medidas)) return e;
  }
  return null;
}
/** Identificadores de los elementos que toca un tramo del borrador (de `a` a `b`, en el mundo). */
export function tocadosPorBorrador(elementos: readonly Elemento[], a: Vec, b: Vec, radio: number, origenes: Origenes, filtro: (e: Elemento) => boolean, medidas?: ReadonlyMap<string, { w: number; h: number }>) {
  const ids: string[] = [];
  const pasos = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / Math.max(2, radio / 2)));
  for (const e of elementos) {
    if (!filtro(e)) continue;
    const d = desplazamiento(e, origenes);
    if (!d) continue;
    for (let k = 0; k <= pasos; k++) {
      const t = k / pasos;
      const p: Vec = [a[0] + (b[0] - a[0]) * t - d[0], a[1] + (b[1] - a[1]) * t - d[1]];
      if (tocaElemento(e, p, radio, medidas)) {
        ids.push(e.id);
        break;
      }
    }
  }
  return ids;
}
/** Elementos cuya caja corta un rectángulo de selección del mundo. */
export function dentroDeMarco(elementos: readonly Elemento[], marco: Caja, origenes: Origenes, medidas?: ReadonlyMap<string, { w: number; h: number }>) {
  return elementos.filter((e) => {
    const c = cajaEnMundo(e, origenes, medidas);
    return c ? intersectan(c, marco) : false;
  });
}

/* ------------------------------------------------------- operaciones */

/** Siguiente etiqueta de línea (L1, L2…): el Tutor se refiere al trabajo por estos identificadores. */
export function siguienteEtiqueta(elementos: readonly Elemento[]) {
  let max = 0;
  for (const e of elementos) if (e.tipo === 'texto') max = Math.max(max, Number(e.etiqueta.slice(1)) || 0);
  return `L${max + 1}`;
}

export function agregar(elementos: readonly Elemento[], e: Elemento): Elemento[] {
  if (elementos.length >= MAX_ELEMENTOS) return [...elementos];
  if (e.tipo === 'trazo' && e.puntos.length > MAX_PUNTOS) return [...elementos, { ...e, puntos: simplificar(e.puntos, 1.2).slice(0, MAX_PUNTOS) }];
  if (e.tipo === 'texto') return [...elementos, { ...e, texto: e.texto.slice(0, MAX_TEXTO) }];
  return [...elementos, e];
}
export const quitar = (elementos: readonly Elemento[], ids: ReadonlySet<string> | readonly string[]) => {
  const s = ids instanceof Set ? ids : new Set(ids as readonly string[]);
  return elementos.filter((e) => !s.has(e.id));
};
export function moverVarios(elementos: readonly Elemento[], ids: ReadonlySet<string>, dx: number, dy: number) {
  return elementos.map((e) => (ids.has(e.id) ? trasladar(e, dx, dy) : e));
}
/** Copias desplazadas de los elementos elegidos, con identificadores y etiquetas nuevos. Devuelve también los ids nuevos. */
export function duplicar(elementos: readonly Elemento[], ids: ReadonlySet<string>, dx = 24, dy = 24) {
  const nuevos: Elemento[] = [];
  let todos = [...elementos];
  for (const e of elementos) {
    if (!ids.has(e.id)) continue;
    const copia = trasladar({ ...e, id: nuevoId() }, dx, dy);
    const final = copia.tipo === 'texto' ? { ...copia, etiqueta: siguienteEtiqueta(todos) } : copia;
    nuevos.push(final);
    todos = [...todos, final];
  }
  return { elementos: todos.slice(0, MAX_ELEMENTOS), nuevos: nuevos.map((n) => n.id) };
}
export function cambiarEstilo(elementos: readonly Elemento[], ids: ReadonlySet<string>, cambio: Partial<Estilo>) {
  return elementos.map((e) => (ids.has(e.id) ? { ...e, estilo: normalizarEstilo({ ...e.estilo, ...cambio }) } : e));
}
export function normalizarEstilo(e: Estilo): Estilo {
  return { color: e.color, grosor: limitar(e.grosor, ...LIMITES_ESTILO.grosor), opacidad: limitar(e.opacidad, ...LIMITES_ESTILO.opacidad) };
}

/** Líneas de texto del trabajo (lo único que el Tutor puede leer del intento), de arriba abajo y en el mundo. */
export function lineasDeTrabajo(elementos: readonly Elemento[], origenes: Origenes, soloIds?: ReadonlySet<string>) {
  return elementos
    .filter((e): e is TextoTrabajo => e.tipo === 'texto' && e.texto.trim() !== '' && (!soloIds || soloIds.has(e.id)))
    .map((e) => ({ e, d: desplazamiento(e, origenes) }))
    .filter((x): x is { e: TextoTrabajo; d: Vec } => x.d !== null)
    .sort((a, b) => a.e.en[1] + a.d[1] - (b.e.en[1] + b.d[1]) || a.e.en[0] + a.d[0] - (b.e.en[0] + b.d[0]))
    .map(({ e }) => e);
}

/** Resumen del trabajo para lectores de pantalla y para el contexto de una pregunta. */
export function resumenTrabajo(elementos: readonly Elemento[]) {
  const n = { trazos: 0, formas: 0, textos: 0, imagenes: 0, anotaciones: 0 };
  for (const e of elementos) {
    if (e.ancla) n.anotaciones += 1;
    if (e.tipo === 'trazo') n.trazos += 1;
    else if (e.tipo === 'texto') n.textos += 1;
    else if (e.tipo === 'imagen') n.imagenes += 1;
    else n.formas += 1;
  }
  return n;
}

/* --------------------------------------------------------- historial */

/** Deshacer y rehacer por instantáneas (los elementos son inmutables: cada instantánea comparte lo que no cambió). */
export type Historial<T> = { pasado: T[]; presente: T; futuro: T[] };
export const MAX_HISTORIAL = 100;
export const crearHistorial = <T,>(inicial: T): Historial<T> => ({ pasado: [], presente: inicial, futuro: [] });
export function registrar<T>(h: Historial<T>, nuevo: T, max = MAX_HISTORIAL): Historial<T> {
  if (Object.is(nuevo, h.presente)) return h;
  return { pasado: [...h.pasado, h.presente].slice(-max), presente: nuevo, futuro: [] };
}
export function deshacer<T>(h: Historial<T>): Historial<T> {
  const previo = h.pasado.at(-1);
  if (previo === undefined) return h;
  return { pasado: h.pasado.slice(0, -1), presente: previo, futuro: [h.presente, ...h.futuro] };
}
export function rehacer<T>(h: Historial<T>): Historial<T> {
  const [siguiente, ...resto] = h.futuro;
  if (siguiente === undefined) return h;
  return { pasado: [...h.pasado, h.presente], presente: siguiente, futuro: resto };
}

/* --------------------------------------------------------------- vista */

/** Vista de la pizarra: traslación en píxeles de pantalla y escala. Pantalla = mundo · escala + (x, y). */
export type Vista = { x: number; y: number; escala: number };
export const ESCALA = { min: 0.25, max: 4 } as const;
export const aMundo = (v: Vista, sx: number, sy: number): Vec => [(sx - v.x) / v.escala, (sy - v.y) / v.escala];
export const aPantalla = (v: Vista, mx: number, my: number): Vec => [mx * v.escala + v.x, my * v.escala + v.y];
/** Zoom alrededor de un punto de la pantalla: ese punto del mundo queda bajo el cursor. */
export function zoomEn(v: Vista, factor: number, sx: number, sy: number): Vista {
  const escala = limitar(v.escala * factor, ESCALA.min, ESCALA.max);
  const [mx, my] = aMundo(v, sx, sy);
  return { escala, x: sx - mx * escala, y: sy - my * escala };
}
export const desplazarVista = (v: Vista, dx: number, dy: number): Vista => ({ ...v, x: v.x + dx, y: v.y + dy });
/** Vista que muestra `caja` del mundo entera en una pantalla de `ancho` × `alto`, con margen y escala máxima opcional. */
export function ajustarA(caja: Caja, ancho: number, alto: number, margen = 32, maxima = 1.5): Vista {
  const w = Math.max(caja.w, 1);
  const h = Math.max(caja.h, 1);
  const escala = limitar(Math.min((ancho - 2 * margen) / w, (alto - 2 * margen) / h, maxima), ESCALA.min, ESCALA.max);
  return { escala, x: (ancho - w * escala) / 2 - caja.x * escala, y: (alto - h * escala) / 2 - caja.y * escala };
}
/** Desplaza la vista lo justo para que `caja` (del mundo) sea visible, sin cambiar la escala. */
export function asegurarVisible(v: Vista, caja: Caja, ancho: number, alto: number, margen = 24): Vista {
  const [x0, y0] = aPantalla(v, caja.x, caja.y);
  const x1 = x0 + caja.w * v.escala;
  const y1 = y0 + caja.h * v.escala;
  let dx = 0;
  let dy = 0;
  if (x1 - x0 > ancho - 2 * margen || x0 < margen) dx = margen - x0;
  else if (x1 > ancho - margen) dx = ancho - margen - x1;
  if (y1 - y0 > alto - 2 * margen || y0 < margen) dy = margen - y0;
  else if (y1 > alto - margen) dy = alto - margen - y1;
  return dx || dy ? desplazarVista(v, dx, dy) : v;
}
