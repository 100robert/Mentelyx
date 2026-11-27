/**
 * Visor 3D (motor visual): el motor de cuatro tiempos y los modelos glTF/GLB del catálogo propio, con selección, aislar,
 * ocultar, despiece, vistas, rótulos y pantalla completa. Three.js se carga siempre de forma diferida. API pública.
 */
import './components/visor-3d.css';
export { VisorModelo, type ParametroVista, type ParteVista } from './components/visor-modelo';
export type { OrigenModelo } from './modelos/cargador';
export type { VistaCamara } from './visor';
// La escena del motor vinculada al desplazamiento (landing) se expone aparte, en `./escena`, sin estos estilos.
