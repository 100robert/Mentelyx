/**
 * Segunda entrada pública de visor-3d, solo para la landing: carga diferida de la escena del motor vinculada al
 * desplazamiento y sus tipos, sin el visor de Aprendizaje ni sus estilos (la landing no debe descargar ese CSS).
 */
export type { Ancla, EstadoMotor, ParteMotor } from './modelos/motor';
export type { Motor } from './escena-motor';
export const cargarEscenaMotor = () => import('./escena-motor');
