/**
 * Carpetas: organización personal independiente por módulo (Aprendizaje y Exámenes no se mezclan; ADR-093).
 * Contrato propuesto en el diseño de API, sección 12.1. API pública de la feature.
 */
import './components/carpetas.css';
export { ExploradorCarpetas } from './components/explorador';
export { Dialogo } from './components/dialogo';
export { MenuAcciones, type Accion } from './components/menu-acciones';
export type { Carpeta, Elemento, Modulo } from './tipos';
