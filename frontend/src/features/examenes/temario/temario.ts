import type { OrigenTema, TemaVista } from '../preparaciones/modelo';

/**
 * Operaciones puras del temario: agregar, editar, quitar y reordenar temas, y leer sugerencias del Tutor desde una
 * respuesta en Markdown (líneas con viñeta o numeradas). Las sugerencias llegan marcadas como «tutor» para revisarlas.
 */
let secuencia = 0;
export const nuevoCodigo = () => `n${Date.now().toString(36)}${(secuencia++).toString(36)}`;

export function agregarTema(lista: readonly TemaVista[], titulo: string, origen: OrigenTema = 'persona'): TemaVista[] {
  const t = titulo.trim().replace(/\s+/g, ' ').slice(0, 160);
  if (!t || lista.some((x) => x.titulo.toLowerCase() === t.toLowerCase())) return [...lista];
  return [...lista, { codigo: nuevoCodigo(), titulo: t, origen }];
}
export const editarTema = (lista: readonly TemaVista[], codigo: string, titulo: string): TemaVista[] =>
  lista.map((x) => (x.codigo === codigo ? { ...x, titulo: titulo.slice(0, 160) } : x));
export const quitarTema = (lista: readonly TemaVista[], codigo: string): TemaVista[] => lista.filter((x) => x.codigo !== codigo);
/** Al editar una sugerencia del Tutor, pasa a ser de la persona: ella la revisó. */
export const aceptarTema = (lista: readonly TemaVista[], codigo: string): TemaVista[] => lista.map((x) => (x.codigo === codigo ? { ...x, origen: 'persona' } : x));

export function moverTema(lista: readonly TemaVista[], codigo: string, delta: -1 | 1): TemaVista[] {
  const i = lista.findIndex((x) => x.codigo === codigo);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= lista.length) return [...lista];
  const copia = [...lista];
  [copia[i], copia[j]] = [copia[j]!, copia[i]!];
  return copia;
}

/** Temas propuestos en una respuesta del Tutor: viñetas o numeración, sin negritas, de 3 a 160 caracteres. */
export function sugerenciasDeTexto(markdown: string, max = 10): string[] {
  const vistos = new Set<string>();
  const salida: string[] = [];
  for (const linea of markdown.split('\n')) {
    const m = /^\s*(?:[-*•]|\d{1,2}[.)])\s+(.+)$/.exec(linea);
    if (!m) continue;
    const t = m[1]!
      .replace(/\*\*/g, '')
      .replace(/\[\d{1,2}\]/g, '')
      .replace(/[:.;]\s*$/, '')
      .split(/\s[—–-]\s|:\s/)[0]!
      .trim();
    if (t.length < 3 || t.length > 160 || vistos.has(t.toLowerCase())) continue;
    vistos.add(t.toLowerCase());
    salida.push(t);
    if (salida.length >= max) break;
  }
  return salida;
}
