// Copia a public/ los archivos de PDF.js que el navegador descarga bajo demanda (worker, fuentes estándar, CMaps y
// decodificadores WASM) en una carpeta con la versión instalada, junto con sus licencias. Ejecutar tras actualizar
// pdfjs-dist: `node frontend/scripts/copiar-pdfjs.mjs`. La prueba visor-pdf/tests comprueba que la versión coincida.
import { cpSync, mkdirSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(join(raiz, 'package.json'));
const origen = dirname(require.resolve('pdfjs-dist/package.json'));
const { version } = JSON.parse(readFileSync(join(origen, 'package.json'), 'utf8'));
const destino = join(raiz, 'public', 'pdfjs');
if (existsSync(destino)) rmSync(destino, { recursive: true });
const carpeta = join(destino, version);
mkdirSync(carpeta, { recursive: true });
cpSync(join(origen, 'build', 'pdf.worker.min.mjs'), join(carpeta, 'pdf.worker.min.mjs'));
for (const d of ['standard_fonts', 'cmaps', 'wasm']) cpSync(join(origen, d), join(carpeta, d), { recursive: true });
cpSync(join(origen, 'LICENSE'), join(carpeta, 'LICENSE'));
console.log(`PDF.js ${version} copiado en public/pdfjs/${version}`);
