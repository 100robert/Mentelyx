/**
 * Extracción del texto de un PDF en el navegador con PDF.js (diseño de API, 12.6). El archivo no se sube: solo su texto,
 * con un marcador «[Página N]» por página, para que el Tutor lo use con el mismo RAG y los mismos permisos que un TXT.
 * Las páginas sin capa de texto (escaneadas) se informan: no hay reconocimiento óptico de caracteres.
 */
export const MAX_PDF_BYTES = 20 * 1024 * 1024;

export type TextoPdf = { texto: string; paginas: number; sinTexto: number[] };

export async function extraerTextoPdf(archivo: File): Promise<TextoPdf> {
  if (archivo.size > MAX_PDF_BYTES) throw new Error('El PDF supera 20 MB.');
  const datos = new Uint8Array(await archivo.arrayBuffer());
  // Firma «%PDF-»: lo demás no se intenta abrir.
  if (!(datos[0] === 0x25 && datos[1] === 0x50 && datos[2] === 0x44 && datos[3] === 0x46)) throw new Error('El archivo no es un PDF.');
  const pdfjs = await import('pdfjs-dist');
  const base = `/pdfjs/${pdfjs.version}`;
  pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;
  const tarea = pdfjs.getDocument({ data: datos, cMapUrl: `${base}/cmaps/`, cMapPacked: true, standardFontDataUrl: `${base}/standard_fonts/`, wasmUrl: `${base}/wasm/`, enableXfa: false });
  const doc = await tarea.promise;
  const partes: string[] = [];
  const sinTexto: number[] = [];
  try {
    for (let n = 1; n <= doc.numPages; n++) {
      const pagina = await doc.getPage(n);
      const contenido = await pagina.getTextContent();
      const texto = contenido.items
        .map((i) => ('str' in i ? i.str + (i.hasEOL ? '\n' : ' ') : ''))
        .join('')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
      if (texto.length < 3) sinTexto.push(n);
      else partes.push(`[Página ${n}]\n${texto}`);
    }
  } finally {
    await tarea.destroy();
  }
  return { texto: partes.join('\n\n'), paginas: doc.numPages, sinTexto };
}
