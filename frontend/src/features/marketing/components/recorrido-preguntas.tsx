'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRecorrido, type Suscribir } from '../hooks/use-recorrido';
import { PREGUNTAS } from './preguntas-datos';
import { EscenaAla } from './escenas/escena-ala';
import { EscenaCorazon } from './escenas/escena-corazon';
import { EscenaAgujeroNegro } from './escenas/escena-agujero-negro';
import { EscenaDinero } from './escenas/escena-dinero';
import { EscenaEcuacion, type LineaEcuacion } from './escenas/escena-ecuacion';
import { EscenaObra } from './escenas/escena-obra';

export type RecursosPreguntas = { formulaAgujero: ReactNode; enunciadoEcuacion: string; lineasEcuacion: LineaEcuacion[] };

function Escena({ indice, suscribir, recursos }: { indice: number; suscribir: Suscribir; recursos: RecursosPreguntas }) {
  switch (PREGUNTAS[indice]?.escena) {
    case 'ala':
      return <EscenaAla suscribir={suscribir} indice={indice} />;
    case 'corazon':
      return <EscenaCorazon suscribir={suscribir} indice={indice} />;
    case 'agujero':
      return <EscenaAgujeroNegro suscribir={suscribir} indice={indice} formula={recursos.formulaAgujero} />;
    case 'dinero':
      return <EscenaDinero suscribir={suscribir} indice={indice} />;
    case 'ecuacion':
      return <EscenaEcuacion enunciado={recursos.enunciadoEcuacion} lineas={recursos.lineasEcuacion} />;
    case 'obra':
      return <EscenaObra />;
    default:
      return null;
  }
}

/**
 * Scrollytelling de las preguntas. En escritorio, el texto avanza a la izquierda (5 columnas) y una lámina persistente
 * (7 columnas) cambia de figura y la transforma con el avance de cada pregunta; la lámina se libera al terminar la sección.
 * En tableta y móvil cada pregunta lleva su propia figura en el flujo. Sin JavaScript, todas las figuras quedan visibles.
 */
export function RecorridoPreguntas({ recursos }: { recursos: RecursosPreguntas }) {
  const raiz = useRef<HTMLDivElement>(null);
  const { activo, suscribir } = useRecorrido(raiz);
  const actual = PREGUNTAS[activo] ?? PREGUNTAS[0]!;
  // Las figuras de la lámina persistente solo existen en escritorio y se montan tras hidratar: el HTML inicial lleva una
  // sola copia de cada figura (la del flujo) y la hidratación en móvil es más ligera.
  const [escritorio, setEscritorio] = useState(false);
  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 64rem)');
    const actualizar = () => setEscritorio(consulta.matches);
    actualizar();
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);

  return (
    <div ref={raiz} className="marco reticula recorrido preguntas-recorrido" data-activo="0" data-interactivo={escritorio || undefined}>
      <ol className="preguntas-pasos">
        {PREGUNTAS.map((q, i) => (
          <li key={q.id} id={q.id} data-paso className="pregunta-paso" data-activo={i === 0 || undefined}>
            <p className="pregunta-area">{q.area}</p>
            <h3 className="pregunta-texto">{q.pregunta}</h3>
            <p className="pregunta-respuesta">{q.respuesta}</p>
            <p className="visually-hidden">{q.descripcion}</p>
            <figure className="lamina figura-en-linea" aria-hidden="true">
              <div className="lamina-lienzo">
                <Escena indice={i} suscribir={suscribir} recursos={recursos} />
              </div>
              <figcaption className="lamina-pie-texto">{q.figura}</figcaption>
            </figure>
          </li>
        ))}
      </ol>
      <div className="preguntas-lamina" aria-hidden="true">
        <figure className="lamina lamina-pegajosa">
          <div className="lamina-lienzo">
            {escritorio &&
              PREGUNTAS.map((q, i) => (
                <div key={q.id} className="lamina-escena" data-visible={i === activo || undefined}>
                  <Escena indice={i} suscribir={suscribir} recursos={recursos} />
                </div>
              ))}
          </div>
          <figcaption className="lamina-pie">
            <span className="lamina-pie-texto">{actual.figura}</span>
            <span className="lamina-contador">
              {activo + 1} de {PREGUNTAS.length}
            </span>
          </figcaption>
        </figure>
      </div>
    </div>
  );
}
