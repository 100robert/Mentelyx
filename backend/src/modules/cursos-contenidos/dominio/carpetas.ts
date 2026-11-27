/**
 * M2 · carpetas personales independientes por módulo (API 12.1; ADR-093). Reglas puras y puertos.
 * Una carpeta pertenece a APRENDIZAJE o a EXAMENES y solo contiene elementos de ese módulo; profundidad máxima 3;
 * sin ciclos; nombre único entre hermanas sin distinguir mayúsculas. Solo la persona propietaria la ve (404 a otras).
 */
export type ModuloCarpeta = 'APRENDIZAJE' | 'EXAMENES';
export type EstadoCarpeta = 'ACTIVA' | 'ARCHIVADA';
export type TipoElemento = 'TEMA' | 'SESION' | 'PREPARACION';

export const PROFUNDIDAD_MAXIMA = 3;
export const ELEMENTOS_POR_MODULO: Record<ModuloCarpeta, readonly TipoElemento[]> = { APRENDIZAJE: ['TEMA', 'SESION'], EXAMENES: ['PREPARACION'] };

export type Carpeta = { id: string; modulo: ModuloCarpeta; nombre: string; padreId: string | null; estado: EstadoCarpeta; elementos: number; actualizadaEn: string };
export type Elemento = { id: string; tipo: TipoElemento; titulo: string; carpetaId: string | null; actualizadoEn: string };

/** Títulos de los recursos propios por tipo: M2 (temas), M6 (sesiones) y M3 (preparaciones), vía API pública. */
export type ResumenRecurso = { id: string; titulo: string; actualizadoEn: string };
export type ElementosPort = Record<TipoElemento, (actorId: string, ids: string[]) => Promise<ResumenRecurso[]>>;

export interface CarpetasRepositorio {
  listar(ownerId: string, modulo: ModuloCarpeta, estado: EstadoCarpeta): Promise<Carpeta[]>;
  obtener(ownerId: string, id: string): Promise<(Carpeta & { profundidad: number; alturaSubarbol: number }) | null>;
  /** Ancestros de `id` incluido él mismo (para detectar ciclos al mover). */
  ancestros(ownerId: string, id: string): Promise<string[]>;
  crear(ownerId: string, c: { modulo: ModuloCarpeta; nombre: string; padreId: string | null }, operationKey: string, ahora: Date): Promise<{ carpeta: Carpeta; repetida: boolean }>;
  actualizar(ownerId: string, id: string, cambios: { nombre?: string | undefined; padreId?: string | null | undefined; estado?: EstadoCarpeta | undefined }, ahora: Date): Promise<Carpeta>;
  /** Elimina la carpeta: subcarpetas y elementos pasan a la raíz del módulo (no se borran). */
  eliminar(ownerId: string, id: string): Promise<boolean>;
  elementos(ownerId: string, carpetaId: string): Promise<Array<{ tipo: TipoElemento; id: string }>>;
  ubicar(ownerId: string, carpetaId: string, tipo: TipoElemento, id: string, ahora: Date): Promise<void>;
  ubicacion(ownerId: string, tipo: TipoElemento, ids: string[]): Promise<Map<string, string>>;
}

export function admiteElemento(modulo: ModuloCarpeta, tipo: TipoElemento) {
  return ELEMENTOS_POR_MODULO[modulo].includes(tipo);
}
