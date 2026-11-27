import { derivadas } from './datos/derivadas';
import { documento } from './datos/documento';
import { galeria } from './datos/galeria';
import { motor } from './datos/motor';
import { obra } from './datos/obra';
import { turquia } from './datos/turquia';
import type { Experiencia } from './tipos';

/** Experiencias de Aprendizaje con contenido preparado (rotulado como ejemplo) y el Tutor real a un lado. */
export const EXPERIENCIAS: readonly Experiencia[] = [derivadas, motor, obra, documento, turquia, galeria];
export const experiencia = (clave: string) => EXPERIENCIAS.find((e) => e.clave === clave) ?? null;
/** Resumen serializable para listados (las rutas de servidor no reciben funciones). */
export const RESUMENES = EXPERIENCIAS.map(({ clave, titulo, disciplina, descripcion }) => ({ clave, titulo, disciplina, descripcion }));
