/**
 * Lienzo (motor visual): resaltados, notas, selección por región o lazo e hilos de cita sobre la hoja de estudio.
 * Las escenas 3D propias del lienzo irán en `scene/` cuando se incorporen. API pública de la feature.
 */
export {
  BarraSeleccion,
  CapaSeleccion,
  HerramientasCuaderno,
  HilosCita,
  leerSeleccion,
  limpiarCuadernoLocal,
  NotaBloque,
  resaltadoDisponible,
  usePintarResaltados,
  useCuaderno,
} from './components/cuaderno';
export type { Herramienta, SeleccionTexto } from './components/cuaderno';
