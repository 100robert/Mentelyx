import { Formula } from './formula';
import { IslaPreguntas } from './islas';

/** «Todo empieza con una pregunta»: la curiosidad no tiene una sola disciplina. Las fórmulas se renderizan aquí, en el servidor. */
export function Preguntas() {
  return (
    <section className="seccion-editorial preguntas" aria-labelledby="titulo-preguntas">
      <div className="marco reticula">
        <header className="seccion-cabecera preguntas-cabecera">
          <h2 id="titulo-preguntas">Todo empieza con una pregunta</h2>
          <p className="texto-destacado">
            Algo que escuchaste en una conversación, una noticia, una clase que no terminó de convencerte. Cualquier pregunta puede ser el
            comienzo de un tema que llegues a dominar.
          </p>
        </header>
      </div>
      <IslaPreguntas
        recursos={{
          formulaAgujero: <Formula tex="r_s = \dfrac{2GM}{c^{2}}" />,
          enunciadoEcuacion: 'Dos cuadernos iguales más 3 soles de envío cuestan 11 soles. ¿Cuánto cuesta cada cuaderno?',
          lineasEcuacion: [
            { izquierda: <Formula tex="2x + 3" />, derecha: <Formula tex="11" />, nota: 'x es el precio de un cuaderno' },
            { izquierda: <Formula tex="2x + 3 - 3" />, derecha: <Formula tex="11 - 3" />, nota: 'Restamos 3 a ambos lados' },
            { izquierda: <Formula tex="2x" />, derecha: <Formula tex="8" /> },
            { izquierda: <Formula tex="\dfrac{2x}{2}" />, derecha: <Formula tex="\dfrac{8}{2}" />, nota: 'Dividimos ambos lados entre 2' },
            { izquierda: <Formula tex="x" />, derecha: <Formula tex="4" />, nota: 'Cada cuaderno cuesta 4 soles', resultado: true },
          ],
        }}
      />
    </section>
  );
}
