import type { Bloque } from '@/features/bloques/esquema';
import { validarBloque } from '@/features/bloques/validacion';
import { aLatex, analizar } from '@/features/matematicas/expresion';
import { ESTILO_INICIAL, nuevoId, siguienteEtiqueta, type Elemento, type Vec } from './modelo';

/**
 * Herramientas educativas de la pizarra: cada una crea un bloque propio (`origen: persona`) del mismo esquema
 * `mentelyx.bloque/v1` que usa el Tutor, o elementos editables de la capa de trabajo (el diagrama). Los bloques propios se
 * guardan con la sesión (`bloquesPropios`, API 12.5, hasta 20). Todo pasa por `validarBloque`: si algo no valida, no se crea.
 */
export const MAX_PROPIOS = 20;
/** Título del ejercicio escrito por la persona: la pizarra lo trata como una resolución (pista, siguiente paso…). */
export const TITULO_EJERCICIO = 'Tu ejercicio';
export const VARIABLES = ['x', 'y', 'z', 't', 'a', 'b', 'c', 'n', 'k', 'm'] as const;

export const idPropio = () => `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type ResultadoInsercion = { ok: true; bloque: Bloque } | { ok: false; mensaje: string };
const validar = (b: unknown): ResultadoInsercion => {
  const r = validarBloque(b);
  return r.ok ? { ok: true, bloque: r.bloque } : { ok: false, mensaje: r.errores[0]?.mensaje ?? 'No se pudo crear.' };
};
const base = (tipo: string, titulo: string, descripcion: string, orden: number) => ({ id: idPropio(), version: 1, tipo, orden, origen: 'persona', titulo: titulo.slice(0, 160), accesibilidad: { descripcion: descripcion.slice(0, 1500) } });

/**
 * Una expresión o ecuación escrita en notación de teclado («2x + 3 = 7», «x^2 - 4») a LaTeX, lado por lado, con el
 * analizador seguro. Lo que no entiende se devuelve tal cual (como texto) y se informa.
 */
export function expresionALatex(texto: string): { latex: string; entendida: boolean } {
  const lados = texto.split(/(<=|>=|=|<|>)/);
  const OPERADOR: Record<string, string> = { '=': '=', '<': '<', '>': '>', '<=': '\\le', '>=': '\\ge' };
  let entendida = true;
  const partes = lados.map((l, k) => {
    if (k % 2 === 1) return OPERADOR[l] ?? l;
    const limpio = l.trim();
    if (!limpio) return '';
    const r = analizar(limpio.replace(/·|×/g, '*').replace(/÷/g, '/').replace(/−/g, '-'), VARIABLES);
    if (r.ok) return aLatex(r.nodo);
    entendida = false;
    return `\\text{${limpio.replace(/[\\{}$&#^_%~]/g, '')}}`;
  });
  return { latex: partes.join(' '), entendida };
}

export function bloqueEcuacion(texto: string, orden: number): ResultadoInsercion & { entendida?: boolean } {
  const t = texto.trim();
  if (!t) return { ok: false, mensaje: 'Escribe la ecuación o la expresión.' };
  const { latex, entendida } = expresionALatex(t);
  const r = validar({ ...base('formula', 'Tu ecuación', `Ecuación escrita por ti: ${t}`, orden), contenido: { latex, lectura: t.slice(0, 600) } });
  return r.ok ? { ...r, entendida } : r;
}

export function bloqueGrafico(expresiones: string, orden: number): ResultadoInsercion {
  const funciones = expresiones
    .split(/[;\n]/)
    .map((s) => s.replace(/^\s*(y|f\(x\))\s*=\s*/i, '').trim())
    .filter(Boolean)
    .slice(0, 6);
  if (funciones.length === 0) return { ok: false, mensaje: 'Escribe al menos una función de x, por ejemplo x^2 - 4.' };
  for (const f of funciones) {
    const a = analizar(f, ['x']);
    if (!a.ok) return { ok: false, mensaje: `«${f}»: ${a.error.mensaje}` };
  }
  const colores = ['serie1', 'serie2', 'serie3', 'serie4', 'serie5', 'serie6'] as const;
  return validar({
    ...base('grafico', funciones.length === 1 ? `y = ${funciones[0]}` : 'Tus funciones', `Gráfico de ${funciones.map((f) => `y = ${f}`).join(', ')} entre x = −10 y x = 10.`, orden),
    contenido: { vista: { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }, ejes: { x: 'x', y: 'y' }, funciones: funciones.map((expresion, k) => ({ id: `f${k + 1}`, expresion, color: colores[k]!, etiqueta: `y = ${expresion}`.slice(0, 60) })) },
  });
}

export function bloqueTabla(columnas: readonly string[], filas: ReadonlyArray<readonly string[]>, orden: number, titulo = 'Tu tabla'): ResultadoInsercion {
  const cols = columnas.map((c) => c.trim().slice(0, 60)).filter((c, k) => c || k === 0).slice(0, 8);
  if (cols.length === 0 || !cols.some(Boolean)) return { ok: false, mensaje: 'Escribe el nombre de al menos una columna.' };
  const nombres = cols.map((c, k) => c || `Columna ${k + 1}`);
  const cuerpo = filas
    .map((f) => nombres.map((_, k) => (f[k] ?? '').trim().slice(0, 200)))
    .filter((f) => f.some(Boolean))
    .slice(0, 60);
  const filasFinales = cuerpo.length ? cuerpo : [nombres.map(() => '')];
  return validar({
    ...base('tabla', titulo, `Tabla con las columnas ${nombres.join(', ')} y ${filasFinales.length} ${filasFinales.length === 1 ? 'fila' : 'filas'}.`, orden),
    contenido: { columnas: nombres, filas: filasFinales.map((celdas, k) => ({ id: `f${k + 1}`, celdas: celdas.map((c) => c || '—') })) },
  });
}

export const MODELOS_INSERTABLES = [
  { clave: 'metano', titulo: 'Molécula de metano (CH₄)', descripcion: 'Modelo 3D del metano: un átomo de carbono unido a cuatro de hidrógeno en forma de tetraedro.' },
  { clave: 'motor-4t', titulo: 'Motor de cuatro tiempos', descripcion: 'Modelo 3D de un motor de combustión de cuatro tiempos: cilindro, pistón, válvulas y cigüeñal.' },
] as const;
export function bloqueModelo(clave: (typeof MODELOS_INSERTABLES)[number]['clave'], orden: number): ResultadoInsercion {
  const m = MODELOS_INSERTABLES.find((x) => x.clave === clave)!;
  return validar({ ...base('modelo-3d', m.titulo, m.descripcion, orden), contenido: { modelo: { tipo: 'catalogo', clave } } });
}

export const DOCUMENTOS_INSERTABLES = [{ src: '/documentos/apuntes-derivadas.pdf', titulo: 'Apuntes de derivadas', descripcion: 'Documento PDF de elaboración propia de Mentelyx, de tres páginas, sobre la derivada.' }] as const;
export function bloqueDocumento(src: (typeof DOCUMENTOS_INSERTABLES)[number]['src'] | 'local', orden: number): ResultadoInsercion {
  if (src === 'local') return validar({ ...base('pdf', 'Documento de tu equipo', 'Documento PDF abierto desde tu equipo: no se sube a Mentelyx.', orden), contenido: { documento: { tipo: 'local' } } });
  const d = DOCUMENTOS_INSERTABLES.find((x) => x.src === src)!;
  return validar({ ...base('pdf', d.titulo, d.descripcion, orden), contenido: { documento: { tipo: 'catalogo', src: d.src }, pagina: 1 } });
}

/** Ejercicio escrito por la persona: un enunciado (sin respuesta guardada; el Tutor guía, la persona resuelve). */
export function bloqueEjercicio(enunciado: string, orden: number): ResultadoInsercion {
  const t = enunciado.trim();
  if (t.length < 3) return { ok: false, mensaje: 'Escribe el enunciado del ejercicio.' };
  return validar({ ...base('texto', TITULO_EJERCICIO, `Ejercicio propuesto por ti: ${t}`, orden), contenido: { markdown: t.slice(0, 20_000) } });
}

/** Diagrama inicial editable (tres cajas unidas por flechas, con su texto) en la capa de trabajo, desde `en`. */
export function diagramaInicial(en: Vec, existentes: readonly Elemento[], rotulos: readonly [string, string, string] = ['Causa', 'Proceso', 'Efecto']): Elemento[] {
  const estilo = ESTILO_INICIAL.forma;
  const ancho = 168;
  const alto = 72;
  const hueco = 64;
  const elementos: Elemento[] = [];
  let todos = [...existentes];
  rotulos.forEach((r, k) => {
    const x = en[0] + k * (ancho + hueco);
    const caja: Elemento = { id: nuevoId(), tipo: 'rectangulo', desde: [x, en[1]], hasta: [x + ancho, en[1] + alto], estilo };
    const texto: Elemento = { id: nuevoId(), tipo: 'texto', en: [x + 16, en[1] + 22], texto: r, expresion: false, tamano: 18, etiqueta: siguienteEtiqueta(todos), estilo: ESTILO_INICIAL.texto };
    elementos.push(caja, texto);
    todos = [...todos, caja, texto];
    if (k < rotulos.length - 1) elementos.push({ id: nuevoId(), tipo: 'flecha', desde: [x + ancho + 8, en[1] + alto / 2], hasta: [x + ancho + hueco - 8, en[1] + alto / 2], estilo });
  });
  return elementos;
}
