import type { CSSProperties, ReactNode } from 'react';

export type LineaEcuacion = { izquierda: ReactNode; derecha: ReactNode; nota?: string; resultado?: boolean };

/**
 * De un enunciado a una ecuación y su solución. Cada paso conserva la igualdad: lo que se hace en un lado se hace en el otro.
 * Las líneas aparecen con el avance del paso (`--p`, solo CSS) y se alinean en el signo igual.
 */
export function EscenaEcuacion({ enunciado, lineas }: { enunciado: string; lineas: LineaEcuacion[] }) {
  const total = lineas.length + 1;
  return (
    <div className="escena escena-ecuacion" aria-hidden="true">
      <p className="ecuacion-enunciado" style={{ '--umbral': 0 } as CSSProperties}>
        {enunciado}
      </p>
      <div className="ecuacion-lineas">
        {lineas.map((l, k) => (
          <div key={k} className={l.resultado ? 'ecuacion-linea ecuacion-resultado' : 'ecuacion-linea'} style={{ '--umbral': (k + 1) / total } as CSSProperties}>
            <span className="ecuacion-izq">{l.izquierda}</span>
            <span className="ecuacion-igual">=</span>
            <span className="ecuacion-der">{l.derecha}</span>
            {l.nota && <span className="ecuacion-nota">{l.nota}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
