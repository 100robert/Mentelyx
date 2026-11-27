/**
 * Pizarra educativa: superficie con zoom y desplazamiento, capa de contenido (bloques `mentelyx.bloque/v1`) y capa de
 * trabajo (trazos, formas, textos y expresiones con Pointer Events), barra de herramientas, entrada del Tutor con modos
 * pedagógicos y paneles bajo demanda. API pública.
 */
import './components/pizarra.css';
export { SuperficiePizarra } from './components/superficie';
export { BarraHerramientas, ControlesZoom, INSERCIONES, type Insercion } from './components/barra-herramientas';
export { EntradaTutor, type Ficha, type OpcionMas, type ErrorEntrada } from './components/entrada-tutor';
export { Cajon } from './components/cajon';
export { DialogoInsertar } from './components/dialogo-insertar';
export { usePizarra, type Pizarra, type Fondo, type Seleccion } from './hooks/use-pizarra';
export { diagramaInicial, MAX_PROPIOS } from './insercion';
export { lineasDeTrabajo, nuevoId, resumenTrabajo, type Elemento } from './modelo';
export * from './pedagogia';
export { propiosDe, textoGuardado } from './persistencia';
export { olvidarTodo, recordar, recuperar, trasladar as trasladarRecuerdo, type Recuerdo } from './memoria';
