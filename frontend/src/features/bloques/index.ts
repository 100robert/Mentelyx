/**
 * Bloques educativos (`mentelyx.bloque/v1`) y acciones validadas: esquema, validación, reductor determinista, adaptador
 * del Tutor IA y registro de renderizadores (texto, fórmula, procedimiento, gráfico, vectores, tabla, línea de tiempo,
 * código, comparación, actividad, obra, modelo 3D, documento y alternativa segura). API pública.
 */
import 'katex/dist/katex.min.css';
import './components/bloques.css';
export { ESQUEMA_BLOQUE, NOMBRE_TIPO, TIPOS, CAPACIDADES, type Bloque, type BloqueDe, type TipoBloque, type Referencia } from './esquema';
export { validarBloque, bloqueDeEjemplo, type ErrorValidacion, type ResultadoBloque } from './validacion';
export {
  Accion,
  aplicarAccion,
  aplicarAcciones,
  crearEstado,
  interaccionInicial,
  objetivosDe,
  parametrosDe,
  MAX_BLOQUES,
  type EstadoEspacio,
  type ErrorAccion,
  type Interaccion,
  type Resultado,
} from './acciones';
export { MODELOS } from './catalogo';
export { bloqueDeRespuesta, bloquesDeMensajes, deRespuesta, idDeMensaje, type MensajeTutor, type RespuestaTutorVista } from './tutor';
export { BloqueVista, RENDERIZADORES } from './components/registro';
export { FormulaSegura } from './components/formula-segura';
