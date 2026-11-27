import type { Accion, Bloque, EstadoEspacio } from '@/features/bloques';
import type { PasoRecorrido } from '@/features/estudio';

/** Experiencia de Aprendizaje con contenido preparado por Mentelyx (rotulado como ejemplo) y Tutor real. */
export type Experiencia = {
  clave: string;
  titulo: string;
  disciplina: string;
  descripcion: string;
  /** Contexto que acompaña a las preguntas al Tutor desde esta pantalla (se informa en la interfaz). */
  contexto: string;
  bloques: Bloque[];
  recorrido?: PasoRecorrido[];
  vinculos?: (anterior: EstadoEspacio, nuevo: EstadoEspacio) => Accion[];
};
