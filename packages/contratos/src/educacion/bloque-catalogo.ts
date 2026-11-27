import type { ClaveModelo, Parametro } from './bloque-esquema';

/**
 * Catálogo de modelos 3D propios (datos puros, sin Three.js). Cada pieza tiene un identificador estable que el Tutor,
 * el recorrido guiado y la persona usan para seleccionarla, aislarla u ocultarla. Los parámetros se validan contra este
 * catálogo antes de llegar a la escena.
 */
export type ModeloCatalogo = {
  clave: ClaveModelo;
  titulo: string;
  partes: Array<{ id: string; nombre: string }>;
  parametros: Parametro[];
  credito: string;
};

export const MODELOS: Record<ClaveModelo, ModeloCatalogo> = {
  'motor-4t': {
    clave: 'motor-4t',
    titulo: 'Motor monocilíndrico de cuatro tiempos',
    partes: [
      { id: 'culata', nombre: 'Culata' },
      { id: 'bujia', nombre: 'Bujía' },
      { id: 'admision', nombre: 'Válvula de admisión' },
      { id: 'escape', nombre: 'Válvula de escape' },
      { id: 'piston', nombre: 'Pistón' },
      { id: 'biela', nombre: 'Biela' },
      { id: 'ciguenal', nombre: 'Cigüeñal' },
      { id: 'cilindro', nombre: 'Cilindro (en corte)' },
    ],
    parametros: [
      { id: 'giro', etiqueta: 'Giro del cigüeñal', min: 0, max: 720, paso: 5, valor: 40 },
      { id: 'despiece', etiqueta: 'Despiece', min: 0, max: 1, paso: 0.05, valor: 0 },
    ],
    credito: 'Modelo 3D de elaboración propia de Mentelyx. Cinemática biela-manivela exacta; tiempos de válvulas simplificados y proporciones ilustrativas.',
  },
  metano: {
    clave: 'metano',
    titulo: 'Molécula de metano (CH₄)',
    partes: [
      { id: 'carbono', nombre: 'Átomo de carbono' },
      { id: 'h1', nombre: 'Hidrógeno 1' },
      { id: 'h2', nombre: 'Hidrógeno 2' },
      { id: 'h3', nombre: 'Hidrógeno 3' },
      { id: 'h4', nombre: 'Hidrógeno 4' },
      { id: 'enlaces', nombre: 'Enlaces C–H' },
    ],
    parametros: [{ id: 'despiece', etiqueta: 'Separar átomos', min: 0, max: 1, paso: 0.05, valor: 0 }],
    credito: 'Modelo 3D de elaboración propia de Mentelyx (archivo glTF binario generado a partir de la geometría tetraédrica: ángulo H–C–H de 109,5°). Radios de los átomos a escala ilustrativa.',
  },
};

/** Parámetros y piezas de un modelo; para un glTF fuera del catálogo, las piezas son las que declara el bloque. */
export const parametrosModelo = (clave: ClaveModelo | null): Parametro[] => (clave ? MODELOS[clave].parametros : []);
