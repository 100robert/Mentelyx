import { PROFUNDIDAD_MAX, type Carpeta } from './tipos';

/** Operaciones puras sobre el árbol plano de carpetas (padreId). Se prueban sin navegador. */
export type Orden = 'nombre' | 'recientes';

const comparar = (orden: Orden) => (a: Carpeta, b: Carpeta) =>
  orden === 'nombre' ? a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }) : b.actualizadaEn.localeCompare(a.actualizadaEn);

export function hijas(carpetas: Carpeta[], padreId: string | null, orden: Orden = 'nombre') {
  return carpetas.filter((c) => c.padreId === padreId).sort(comparar(orden));
}

/** Ruta desde la raíz hasta la carpeta (para las migas). Se detiene ante datos cíclicos. */
export function ruta(carpetas: Carpeta[], id: string | null): Carpeta[] {
  const porId = new Map(carpetas.map((c) => [c.id, c]));
  const salida: Carpeta[] = [];
  const vistos = new Set<string>();
  let actual = id ? porId.get(id) : undefined;
  while (actual && !vistos.has(actual.id)) {
    vistos.add(actual.id);
    salida.unshift(actual);
    actual = actual.padreId ? porId.get(actual.padreId) : undefined;
  }
  return salida;
}

export function profundidad(carpetas: Carpeta[], id: string | null) {
  return ruta(carpetas, id).length;
}

/** Ids de la carpeta y de todas sus descendientes. */
export function descendientes(carpetas: Carpeta[], id: string): Set<string> {
  const resultado = new Set([id]);
  let cambio = true;
  while (cambio) {
    cambio = false;
    for (const c of carpetas) {
      if (c.padreId && resultado.has(c.padreId) && !resultado.has(c.id)) {
        resultado.add(c.id);
        cambio = true;
      }
    }
  }
  return resultado;
}

/** Altura del subárbol (1 si no tiene hijas). */
function altura(carpetas: Carpeta[], id: string): number {
  const hs = carpetas.filter((c) => c.padreId === id);
  return 1 + (hs.length ? Math.max(...hs.map((h) => altura(carpetas, h.id))) : 0);
}

/** Destinos válidos para mover una carpeta: sin ciclos y sin superar la profundidad máxima. `null` es la raíz. */
export function destinosValidos(carpetas: Carpeta[], id: string): Array<Carpeta | null> {
  const bloqueadas = descendientes(carpetas, id);
  const alto = altura(carpetas, id);
  const actual = carpetas.find((c) => c.id === id);
  const candidatos = carpetas.filter((c) => !bloqueadas.has(c.id) && c.id !== actual?.padreId && profundidad(carpetas, c.id) + alto <= PROFUNDIDAD_MAX);
  return [...(actual?.padreId ? [null] : []), ...candidatos];
}

/** El nombre es único entre hermanas, sin distinguir mayúsculas ni tildes. */
export function nombreDisponible(carpetas: Carpeta[], padreId: string | null, nombre: string, excepto?: string) {
  const clave = nombre.trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  return !carpetas.some(
    (c) => c.padreId === padreId && c.id !== excepto && c.nombre.trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '') === clave,
  );
}

/** Búsqueda por nombre en todo el módulo; devuelve cada coincidencia con su ruta legible. */
export function buscar(carpetas: Carpeta[], texto: string) {
  const q = texto.trim().toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '');
  if (!q) return [];
  return carpetas
    .filter((c) => c.nombre.toLocaleLowerCase('es').normalize('NFD').replace(/\p{Diacritic}/gu, '').includes(q))
    .map((c) => ({ carpeta: c, ruta: ruta(carpetas, c.padreId).map((p) => p.nombre) }));
}
