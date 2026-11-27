'use client';

import { useEffect, useId, useRef } from 'react';

export type PasoRecorrido = { titulo: string; texto: string; acciones: unknown[] };

/**
 * Recorrido guiado local: una secuencia preparada por Mentelyx (no es el Tutor ni usa IA) que mueve los bloques con las
 * mismas acciones validadas. Se puede avanzar, retroceder o salir en cualquier momento; ir a un paso es determinista.
 */
export function Recorrido({ pasos, actual, alIr, alSalir }: { pasos: PasoRecorrido[]; actual: number; alIr: (k: number) => void; alSalir: () => void }) {
  const id = useId();
  const titulo = useRef<HTMLHeadingElement>(null);
  const paso = pasos[actual];
  useEffect(() => titulo.current?.focus(), [actual]);
  if (!paso) return null;
  return (
    <section className="estudio-recorrido" aria-labelledby={`${id}-titulo`}>
      <p className="estudio-recorrido-rotulo">
        Recorrido guiado · preparado por Mentelyx, sin IA · <span className="num">{actual + 1} de {pasos.length}</span>
      </p>
      <h2 id={`${id}-titulo`} ref={titulo} tabIndex={-1}>
        {paso.titulo}
      </h2>
      <p aria-live="polite">{paso.texto}</p>
      <div className="acciones">
        <button type="button" className="boton boton-terciario boton-chico" disabled={actual === 0} onClick={() => alIr(actual - 1)}>
          Anterior
        </button>
        {actual < pasos.length - 1 ? (
          <button type="button" className="boton boton-primario boton-chico" onClick={() => alIr(actual + 1)}>
            Siguiente
          </button>
        ) : (
          <button type="button" className="boton boton-primario boton-chico" onClick={alSalir}>
            Terminar
          </button>
        )}
        <button type="button" className="boton boton-terciario boton-chico" onClick={alSalir}>
          Salir
        </button>
      </div>
      <ol className="estudio-recorrido-puntos" aria-label="Pasos del recorrido">
        {pasos.map((p, k) => (
          <li key={k}>
            <button type="button" aria-current={k === actual ? 'step' : undefined} onClick={() => alIr(k)}>
              <span className="visually-hidden">
                Paso {k + 1}: {p.titulo}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </section>
  );
}
