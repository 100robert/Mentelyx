import Link from 'next/link';
import { PREGUNTAS } from './preguntas-datos';

/**
 * Hero: la pregunta que abre Mentelyx (en la voz de la curiosidad, Source Serif 4 cursiva) a la izquierda, en 6 columnas, y el
 * búho esculpido de la marca a la derecha, delante de una lámina técnica de trazos finos (una órbita, una parábola con su
 * tangente y marcas de registro) que se dibuja una sola vez al cargar. El texto es HTML: el hero no espera a ningún modelo 3D.
 */
export function Portada() {
  return (
    <section className="portada" aria-labelledby="titulo-portada">
      <div className="marco reticula portada-reticula">
        <div className="portada-texto">
          <h1 id="titulo-portada" className="portada-titulo">
            ¿Qué te gustaría entender hoy?
          </h1>
          <p className="portada-lead">
            Desde aquello que despierta tu curiosidad hasta lo que necesitas dominar para un examen. Aprende con explicaciones visuales,
            experiencias interactivas y un tutor que se adapta a ti.
          </p>
          <p className="acciones portada-acciones">
            <Link className="boton boton-primario boton-grande" href="/auth/registro?objetivo=aprendizaje">
              Empezar a aprender
            </Link>
            <Link className="boton boton-campo boton-grande" href="/auth/registro?objetivo=examen">
              Preparar mi examen
            </Link>
          </p>
        </div>
        <div className="portada-figura" aria-hidden="true">
          <svg className="portada-lamina" viewBox="0 0 600 600">
            <ellipse cx="300" cy="300" rx="262" ry="96" transform="rotate(-18 300 300)" pathLength={1} className="trazo-portada" style={{ animationDelay: '200ms' }} />
            <circle cx="300" cy="300" r="214" pathLength={1} className="trazo-portada trazo-fino" style={{ animationDelay: '320ms' }} />
            <path d="M92 118Q300 560 508 118" pathLength={1} className="trazo-portada trazo-fino" style={{ animationDelay: '440ms' }} />
            {/* Tangente a la parábola en t = 0,25 (pendiente 1,0625 en este sistema), el motivo de la derivada. */}
            <path d="M86 166.9L306 400.6" pathLength={1} className="trazo-portada" style={{ animationDelay: '620ms' }} />
            <circle cx="196" cy="283.8" r="4.5" className="punto-portada" />
            <path d="M28 28h28M28 28v28M572 28h-28M572 28v28M28 572h28M28 572v-28M572 572h-28M572 572v-28" className="registro-portada" />
          </svg>
          <img
            className="portada-buho"
            src="/marca/buho-esculpido-960.webp"
            srcSet="/marca/buho-esculpido-320.webp 320w, /marca/buho-esculpido-560.webp 560w, /marca/buho-esculpido-960.webp 960w"
            sizes="(min-width: 64rem) 26rem, (min-width: 48rem) 12rem, 8.5rem"
            width={960}
            height={1389}
            fetchPriority="high"
            alt=""
          />
        </div>
      </div>
      <nav className="marco portada-indice" aria-label="Preguntas para empezar">
        <ul className="reticula">
          {PREGUNTAS.map((q) => (
            <li key={q.id}>
              <a href={`#${q.id}`}>
                <span className="portada-indice-area">{q.area}</span>
                <span className="portada-indice-pregunta">{q.pregunta}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
