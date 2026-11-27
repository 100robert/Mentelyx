'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { tramo, type Suscribir } from '../../hooks/use-recorrido';

/**
 * Agujero negro sin rotación (métrica de Schwarzschild), con radios exactos en unidades de rₛ: horizonte de sucesos (1 rₛ),
 * esfera de fotones (1,5 rₛ) y órbita circular estable más interna (3 rₛ), borde interior de un disco de acreción delgado.
 * Al avanzar, la vista se acerca y las fronteras se revelan de fuera hacia dentro. Esquema, no a escala de un objeto real.
 */
const C = { x: 236, y: 248 };
const RS = 40;
const INCLINACION = 0.27;
const ANILLOS = Array.from({ length: 8 }, (_, k) => 3 * RS + k * 15);

/** Mitad de una elipse del disco: la trasera pasa detrás del horizonte y la delantera, por delante. */
const medioArco = (rx: number, delantera: boolean) =>
  `M${C.x - rx} ${C.y} A${rx} ${rx * INCLINACION} 0 0 ${delantera ? 0 : 1} ${C.x + rx} ${C.y}`;

export function EscenaAgujeroNegro({ suscribir, indice, formula }: { suscribir: Suscribir; indice: number; formula: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  useEffect(
    () =>
      suscribir((e) => {
        const p = e.progresos[indice] ?? 1;
        const nodo = raiz.current;
        if (!nodo) return;
        nodo.style.setProperty('--disco', tramo(p, 0, 0.3).toFixed(3));
        nodo.style.setProperty('--isco', tramo(p, 0.25, 0.5).toFixed(3));
        nodo.style.setProperty('--fotones', tramo(p, 0.45, 0.7).toFixed(3));
        nodo.style.setProperty('--horizonte', tramo(p, 0.65, 0.9).toFixed(3));
        nodo.style.setProperty('--zoom', (0.9 + 0.1 * tramo(p, 0, 1)).toFixed(4));
      }),
    [suscribir, indice],
  );

  return (
    <div ref={raiz} className="escena escena-agujero">
      <svg viewBox="0 0 640 480" aria-hidden="true">
        <g className="agujero-vista">
          <g className="agujero-disco">
            {ANILLOS.map((rx) => (
              <path key={`t${rx}`} d={medioArco(rx, false)} className="lam-disco" />
            ))}
          </g>
          <circle cx={C.x} cy={C.y} r={RS * 1.5} className="lam-fotones agujero-fotones" />
          <circle cx={C.x} cy={C.y} r={RS} className="lam-horizonte" />
          <g className="agujero-disco">
            {ANILLOS.map((rx) => (
              <path key={`d${rx}`} d={medioArco(rx, true)} className="lam-disco" />
            ))}
          </g>
          <ellipse cx={C.x} cy={C.y} rx={3 * RS} ry={3 * RS * INCLINACION} className="lam-isco agujero-isco" />
        </g>
        <g className="lam-rotulos">
          <g className="agujero-r-isco">
            <path d={`M${C.x + 3 * RS * 0.72} ${C.y + 3 * RS * INCLINACION * 0.7}L436 344H446`} className="lam-guia" />
            <text x="452" y="340" className="lam-texto-chico">
              Órbita estable
              <tspan x="452" dy="1.25em">más interna</tspan>
              <tspan x="452" dy="1.3em" className="lam-cifra">
                3 r<tspan baselineShift="sub">s</tspan>
              </tspan>
            </text>
          </g>
          <g className="agujero-r-fotones">
            <path d={`M${C.x + RS * 1.5 * 0.7} ${C.y - RS * 1.5 * 0.71}L436 190H446`} className="lam-guia" />
            <text x="452" y="186" className="lam-texto-chico">
              Esfera de fotones
              <tspan x="452" dy="1.3em" className="lam-cifra">
                1,5 r<tspan baselineShift="sub">s</tspan>
              </tspan>
            </text>
          </g>
          <g className="agujero-r-horizonte">
            <path d={`M${C.x + RS * 0.5} ${C.y - RS * 0.87}L300 84H446`} className="lam-guia" />
            <text x="452" y="80" className="lam-texto-chico">
              Horizonte
              <tspan x="452" dy="1.25em">de sucesos</tspan>
              <tspan x="452" dy="1.3em" className="lam-cifra">
                r<tspan baselineShift="sub">s</tspan>
              </tspan>
            </text>
          </g>
        </g>
      </svg>
      <div className="escena-formula">{formula}</div>
    </div>
  );
}
