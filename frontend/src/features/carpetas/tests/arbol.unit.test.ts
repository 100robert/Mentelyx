import { describe, expect, it } from 'vitest';
import { buscar, destinosValidos, hijas, nombreDisponible, ruta } from '../arbol';
import type { Carpeta } from '../tipos';

const c = (id: string, nombre: string, padreId: string | null, actualizadaEn = '2026-11-20T00:00:00Z'): Carpeta => ({
  id, nombre, padreId, modulo: 'APRENDIZAJE', estado: 'ACTIVA', elementos: 0, actualizadaEn,
});
// Astronomía > Agujeros negros > Horizonte ; Matemáticas
const datos = [c('a', 'Astronomía', null), c('b', 'Agujeros negros', 'a', '2026-11-24T00:00:00Z'), c('h', 'Horizonte', 'b'), c('m', 'Matemáticas', null, '2026-11-25T00:00:00Z')];

describe('árbol de carpetas', () => {
  it('ordena las hijas por nombre o por actividad reciente', () => {
    expect(hijas(datos, null).map((x) => x.id)).toEqual(['a', 'm']);
    expect(hijas(datos, null, 'recientes').map((x) => x.id)).toEqual(['m', 'a']);
  });

  it('construye la ruta para las migas', () => {
    expect(ruta(datos, 'h').map((x) => x.nombre)).toEqual(['Astronomía', 'Agujeros negros', 'Horizonte']);
    expect(ruta(datos, null)).toEqual([]);
  });

  it('no permite mover una carpeta dentro de sí misma ni superar tres niveles', () => {
    const destinosDeA = destinosValidos(datos, 'a').map((x) => x?.id ?? 'raiz');
    expect(destinosDeA).not.toContain('b');
    expect(destinosDeA).not.toContain('h');
    expect(destinosDeA).not.toContain('m'); // a tiene altura 3: bajo «m» quedaría en el nivel 4
    expect(destinosValidos(datos, 'h').map((x) => x?.id ?? 'raiz')).toEqual(['raiz', 'a', 'm']);
  });

  it('rechaza nombres repetidos entre hermanas sin distinguir mayúsculas ni tildes', () => {
    expect(nombreDisponible(datos, null, 'astronomia')).toBe(false);
    expect(nombreDisponible(datos, 'a', 'Astronomía')).toBe(true);
    expect(nombreDisponible(datos, null, 'Astronomía', 'a')).toBe(true);
  });

  it('busca en todo el módulo con la ruta de cada coincidencia', () => {
    expect(buscar(datos, 'horiz')).toEqual([{ carpeta: datos[2], ruta: ['Astronomía', 'Agujeros negros'] }]);
    expect(buscar(datos, '  ')).toEqual([]);
  });
});
