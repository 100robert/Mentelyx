/**
 * Búsqueda en el texto de un PDF (código puro, con pruebas). Ignora mayúsculas y tildes; devuelve la página y un extracto
 * alrededor de cada coincidencia. Las páginas sin capa de texto (escaneadas) no producen resultados: no hay OCR.
 */
export type Coincidencia = { pagina: number; extracto: string };
export const MAX_RESULTADOS = 200;

export const normalizar = (t: string) =>
  t
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ');

export function buscarEnPaginas(paginas: ReadonlyArray<{ numero: number; items: readonly string[] }>, consulta: string, contexto = 40): Coincidencia[] {
  const q = normalizar(consulta.trim());
  if (q.length < 2) return [];
  const resultados: Coincidencia[] = [];
  for (const p of paginas) {
    const texto = p.items.join(' ').replace(/\s+/g, ' ');
    // La normalización NFD + eliminación de diacríticos conserva la longitud en español (una letra por letra).
    const plano = normalizar(texto);
    let desde = 0;
    for (;;) {
      const i = plano.indexOf(q, desde);
      if (i < 0) break;
      const a = Math.max(0, i - contexto);
      const b = Math.min(texto.length, i + q.length + contexto);
      resultados.push({ pagina: p.numero, extracto: `${a > 0 ? '…' : ''}${texto.slice(a, b).trim()}${b < texto.length ? '…' : ''}` });
      if (resultados.length >= MAX_RESULTADOS) return resultados;
      desde = i + q.length;
    }
  }
  return resultados;
}
