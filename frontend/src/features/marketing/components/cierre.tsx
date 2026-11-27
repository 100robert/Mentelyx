import Link from 'next/link';

/** Cierre: vuelve a la curiosidad del inicio, sin promesas de resultados ni presión comercial. */
export function Cierre() {
  return (
    <section className="cierre-final" aria-labelledby="titulo-cierre">
      <div className="marco reticula">
        <h2 id="titulo-cierre" className="cierre-titulo">
          Siempre hay algo nuevo por comprender.
        </h2>
        <div className="cierre-acciones">
          <p>Tu próxima pregunta puede ser el comienzo de algo que llegues a dominar.</p>
          <p className="acciones">
            <Link className="boton boton-primario boton-grande" href="/auth/registro?objetivo=aprendizaje">
              Comenzar a aprender
            </Link>
            <Link className="boton boton-campo boton-grande" href="/auth/registro?objetivo=examen">
              Preparar mi próximo examen
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
