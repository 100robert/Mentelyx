/**
 * Espacio educativo de Aprendizaje: barra superior, panel del tema, contenido en bloques y Tutor contextual con llamadas
 * reales; recorrido guiado local y vínculos entre bloques mediante acciones validadas. API pública.
 */
import './components/estudio.css';
export { EspacioEstudio, type SesionTema } from './components/espacio-estudio';
export type { PasoRecorrido } from './components/recorrido';
export { TutorEnLinea, useTutorEnLinea, type RespuestaEnLinea } from './components/tutor-en-linea';
