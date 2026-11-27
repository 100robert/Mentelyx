/**
 * Contrato propuesto de carpetas independientes por módulo (diseño de API, sección 12.1; ADR-093). El backend aún no lo
 * implementa: estos tipos son la referencia que el frontend consume y que el backend debe validar o ajustar.
 */
export type Modulo = 'APRENDIZAJE' | 'EXAMENES';
export type EstadoCarpeta = 'ACTIVA' | 'ARCHIVADA';
export type TipoElemento = 'TEMA' | 'SESION' | 'PREPARACION';

export type Carpeta = {
  id: string;
  modulo: Modulo;
  nombre: string;
  padreId: string | null;
  estado: EstadoCarpeta;
  /** Elementos directos (temas, sesiones o preparaciones). */
  elementos: number;
  actualizadaEn: string;
};

export type Elemento = { id: string; tipo: TipoElemento; titulo: string; carpetaId: string | null; actualizadoEn: string };

export type CrearCarpeta = { modulo: Modulo; nombre: string; padreId?: string | null };
export type CambiarCarpeta = { nombre?: string; padreId?: string | null; estado?: EstadoCarpeta };

/** Reglas compartidas con el backend propuesto. */
export const NOMBRE_MAX = 80;
export const PROFUNDIDAD_MAX = 3;

/** Tipos de elemento admitidos por módulo: aprendizaje y exámenes no se mezclan. */
export const ELEMENTOS_POR_MODULO: Record<Modulo, TipoElemento[]> = {
  APRENDIZAJE: ['TEMA', 'SESION'],
  EXAMENES: ['PREPARACION'],
};
