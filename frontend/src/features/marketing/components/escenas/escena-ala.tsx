'use client';

import { useEffect, useRef } from 'react';
import type { Suscribir } from '../../hooks/use-recorrido';

/**
 * Perfil alar NACA 2412 (curvatura 2 %, en el 40 % de la cuerda; espesor 12 %) calculado con las ecuaciones de la serie de
 * cuatro dígitos. Al avanzar, el ángulo de ataque sube de 0° a 10°: la flecha de sustentación crece según la teoría del perfil
 * delgado (CL ≈ 2π·(α − α₀), α₀ ≈ −2° para este perfil), válida por debajo de la entrada en pérdida, y el flujo se desvía hacia abajo.
 */
const CUERDA = 340;
const BORDE = { x: 150, y: 250 };
const CENTRO = { x: BORDE.x + CUERDA / 4, y: BORDE.y };

function perfilNaca2412() {
  const m = 0.02, p = 0.4, t = 0.12, n = 56;
  const arriba: string[] = [];
  const abajo: string[] = [];
  for (let i = 0; i <= n; i++) {
    const x = (1 - Math.cos((Math.PI * i) / n)) / 2;
    const yt = 5 * t * (0.2969 * Math.sqrt(x) - 0.126 * x - 0.3516 * x ** 2 + 0.2843 * x ** 3 - 0.1036 * x ** 4);
    const yc = x < p ? (m / p ** 2) * (2 * p * x - x ** 2) : (m / (1 - p) ** 2) * (1 - 2 * p + 2 * p * x - x ** 2);
    const dyc = x < p ? ((2 * m) / p ** 2) * (p - x) : ((2 * m) / (1 - p) ** 2) * (p - x);
    const th = Math.atan(dyc);
    const punto = (px: number, py: number) => `${(BORDE.x + px * CUERDA).toFixed(1)} ${(BORDE.y - py * CUERDA).toFixed(1)}`;
    arriba.push(punto(x - yt * Math.sin(th), yc + yt * Math.cos(th)));
    abajo.push(punto(x + yt * Math.sin(th), yc - yt * Math.cos(th)));
  }
  return `M${arriba.reverse().join(' L')} L${abajo.slice(1).join(' L')} Z`;
}
const PERFIL = perfilNaca2412();
const LINEAS = [118, 156, 190, 318, 352, 388];

function lineaDeFlujo(y0: number, alfa: number) {
  const atenuacion = Math.exp(-Math.abs(y0 - BORDE.y) / 120);
  const ascenso = alfa * 1.1 * atenuacion;
  const descenso = alfa * 2.6 * atenuacion;
  const puntos: string[] = [];
  for (let x = 16; x <= 624; x += 16) {
    const previo = Math.exp(-(((x - 190) / 95) ** 2));
    const t = Math.min(1, Math.max(0, (x - 230) / 330));
    const suave = t * t * (3 - 2 * t);
    puntos.push(`${x} ${(y0 - ascenso * previo + descenso * suave).toFixed(1)}`);
  }
  return `M${puntos.join(' L')}`;
}

export function EscenaAla({ suscribir, indice }: { suscribir: Suscribir; indice: number }) {
  const ala = useRef<SVGGElement>(null);
  const vector = useRef<SVGPathElement>(null);
  const punta = useRef<SVGGElement>(null);
  const angulo = useRef<SVGTSpanElement>(null);
  const arco = useRef<SVGPathElement>(null);
  const flujo = useRef<SVGGElement>(null);

  useEffect(
    () =>
      suscribir((e) => {
        const p = e.progresos[indice] ?? 1;
        const alfa = 10 * p;
        const cl = 2 * Math.PI * (((alfa + 2) * Math.PI) / 180);
        const largo = 34 + cl * 66;
        ala.current?.setAttribute('transform', `rotate(${-alfa} ${CENTRO.x} ${CENTRO.y})`);
        vector.current?.setAttribute('d', `M0 0V${(-largo + 10).toFixed(1)}`);
        punta.current?.setAttribute('transform', `translate(0 ${(-largo).toFixed(1)})`);
        if (angulo.current) angulo.current.textContent = `${Math.round(alfa)}°`;
        const rad = (alfa * Math.PI) / 180;
        const r = 120;
        arco.current?.setAttribute('d', `M${CENTRO.x + r} ${CENTRO.y} A${r} ${r} 0 0 0 ${(CENTRO.x + r * Math.cos(rad)).toFixed(1)} ${(CENTRO.y - r * Math.sin(rad)).toFixed(1)}`);
        flujo.current?.querySelectorAll('path').forEach((path, k) => path.setAttribute('d', lineaDeFlujo(LINEAS[k] ?? 0, alfa)));
      }),
    [suscribir, indice],
  );

  return (
    <svg viewBox="0 0 640 480" className="escena" aria-hidden="true">
      <g ref={flujo} className="lam-flujo">
        {LINEAS.map((y) => (
          <path key={y} d={lineaDeFlujo(y, 10)} />
        ))}
      </g>
      <g className="lam-suave">
        <path d="M24 250h76" className="lam-flecha-linea" />
        <path d="M92 244l10 6-10 6" />
        <text x="24" y="276" className="lam-texto-chico">
          Viento relativo
        </text>
      </g>
      <path d={`M${CENTRO.x} ${CENTRO.y}h170`} className="lam-referencia" />
      <path ref={arco} d={`M${CENTRO.x + 120} ${CENTRO.y}`} className="lam-arco" />
      <g ref={ala} transform={`rotate(-10 ${CENTRO.x} ${CENTRO.y})`}>
        <path d={PERFIL} className="lam-solido" />
        <path d={`M${BORDE.x - 18} ${BORDE.y}h${CUERDA + 40}`} className="lam-referencia" />
      </g>
      <g transform={`translate(${CENTRO.x} ${CENTRO.y})`} className="lam-acento">
        <path ref={vector} d="M0 0V-111" className="lam-vector" />
        <g ref={punta} transform="translate(0 -121)">
          <path d="M-8 12L0 0L8 12Z" />
          <text x="14" y="10" className="lam-texto">
            Sustentación
          </text>
        </g>
      </g>
      <text x="420" y="138" className="lam-texto-chico">
        Menor presión
      </text>
      <text x="420" y="436" className="lam-texto-chico">
        Mayor presión
      </text>
      <text x="24" y="44" className="lam-texto-chico lam-dato">
        Ángulo de ataque <tspan ref={angulo} className="lam-cifra">10°</tspan>
      </text>
    </svg>
  );
}
