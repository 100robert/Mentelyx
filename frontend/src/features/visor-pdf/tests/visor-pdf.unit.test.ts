import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buscarEnPaginas, MAX_RESULTADOS, normalizar } from '../busqueda';

const frontend = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');

describe('búsqueda en el documento', () => {
  const paginas = [
    { numero: 1, items: ['La derivada mide', 'la pendiente de la tangente.'] },
    { numero: 2, items: ['Derivada de una función cuadrática: f′(x) = 2ax + b.'] },
    { numero: 3, items: [] },
  ];
  it('ignora mayúsculas y tildes y devuelve página y extracto', () => {
    const r = buscarEnPaginas(paginas, 'DERIVADA');
    expect(r.map((x) => x.pagina)).toEqual([1, 2]);
    expect(buscarEnPaginas(paginas, 'funcion')[0]).toMatchObject({ pagina: 2 });
    expect(buscarEnPaginas(paginas, 'funcion')[0]!.extracto).toContain('función');
  });
  it('une los fragmentos de una línea al buscar', () => {
    expect(buscarEnPaginas(paginas, 'mide la pendiente')).toHaveLength(1);
  });
  it('no encuentra nada en una página sin texto (sin OCR) ni con consultas de un carácter', () => {
    expect(buscarEnPaginas([paginas[2]!], 'derivada')).toEqual([]);
    expect(buscarEnPaginas(paginas, 'a')).toEqual([]);
  });
  it('limita la cantidad de resultados', () => {
    expect(buscarEnPaginas([{ numero: 1, items: ['ab '.repeat(1000)] }], 'ab')).toHaveLength(MAX_RESULTADOS);
  });
  it('normaliza sin cambiar la longitud del texto en español', () => {
    const t = 'Pequeña función ÁRBOL';
    expect(normalizar(t)).toBe('pequena funcion arbol');
    expect(normalizar(t).length).toBe(t.length);
  });
});

describe('recursos de PDF.js', () => {
  it('sirve el worker de la misma versión instalada', () => {
    const { version } = JSON.parse(readFileSync(join(frontend, 'node_modules', 'pdfjs-dist', 'package.json'), 'utf8')) as { version: string };
    expect(existsSync(join(frontend, 'public', 'pdfjs', version, 'pdf.worker.min.mjs'))).toBe(true);
    expect(existsSync(join(frontend, 'public', 'pdfjs', version, 'LICENSE'))).toBe(true);
  });
  it('incluye el documento de ejemplo propio', () => {
    const pdf = readFileSync(join(frontend, 'public', 'documentos', 'apuntes-derivadas.pdf'));
    expect(pdf.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });
});
