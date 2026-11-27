import 'katex/dist/katex.min.css';
import './inicio.css';
import { Aprendizaje } from './aprendizaje';
import { Cierre } from './cierre';
import { IslaComoFunciona, IslaExamenes } from './islas';
import { Materiales } from './materiales';
import { Portada } from './portada';
import { Preguntas } from './preguntas';
import { Universo } from './universo';

/**
 * Landing de Mentelyx V1. Recorrido narrativo: curiosidad → descubrimiento → comprensión → práctica → aprendizaje.
 * El contenido es HTML semántico e indexable; las figuras, la pizarra y el modelo 3D lo acompañan sin sustituirlo.
 * Alterna superficies: hero azul marino, lecturas en blanco, pozos claros y una escena 3D inmersiva en azul profundo.
 */
export function PaginaInicio() {
  return (
    <div className="inicio">
      <Portada />
      {/* Las demostraciones interactivas son islas: su HTML llega completo desde el servidor y su código se descarga e
          hidrata solo cuando el visitante se acerca (ver islas.tsx). El hero no espera a la lógica de las secciones inferiores. */}
      <Preguntas />
      <Aprendizaje />
      <Universo />
      <Materiales />
      <IslaExamenes />
      <IslaComoFunciona />
      <Cierre />
    </div>
  );
}
