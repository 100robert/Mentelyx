'use client';

import { useEffect, useRef } from 'react';
import { decimal, type Suscribir } from '../../hooks/use-recorrido';

/**
 * Poder de compra de S/ 100 con inflación anual constante: valor(n) = 100 / (1 + r)^n. Al avanzar, la tasa sube de 0 % a 5 %
 * y la curva se transforma; con 5 % durante 10 años el resultado es S/ 61,39. Ejemplo calculado, no una proyección.
 */
const X0 = 84, X1 = 596, Y0 = 404, Y1 = 84;
const x = (anio: number) => X0 + (anio / 10) * (X1 - X0);
const y = (valor: number) => Y0 - (valor / 100) * (Y0 - Y1);

function curva(r: number) {
  const puntos: string[] = [];
  for (let n = 0; n <= 10; n += 0.25) puntos.push(`${x(n).toFixed(1)} ${y(100 / (1 + r) ** n).toFixed(1)}`);
  return puntos;
}

export function EscenaDinero({ suscribir, indice }: { suscribir: Suscribir; indice: number }) {
  const linea = useRef<SVGPathElement>(null);
  const area = useRef<SVGPathElement>(null);
  const punto = useRef<SVGGElement>(null);
  const tasa = useRef<SVGTSpanElement>(null);
  const final = useRef<SVGTextElement>(null);

  useEffect(
    () =>
      suscribir((e) => {
        const p = e.progresos[indice] ?? 1;
        const r = 0.05 * p;
        const puntos = curva(r);
        linea.current?.setAttribute('d', `M${puntos.join(' L')}`);
        area.current?.setAttribute('d', `M${puntos.join(' L')} L${X1} ${Y0} L${X0} ${Y0} Z`);
        const valor = 100 / (1 + r) ** 10;
        punto.current?.setAttribute('transform', `translate(${X1} ${y(valor).toFixed(1)})`);
        if (tasa.current) tasa.current.textContent = `${decimal(r * 100)} %`;
        if (final.current) final.current.textContent = `S/ ${decimal(valor, 2)}`;
      }),
    [suscribir, indice],
  );

  const inicial = curva(0.05);
  return (
    <svg viewBox="0 0 640 480" className="escena" aria-hidden="true">
      <text x={X0} y="44" className="lam-texto">
        Poder de compra de S/ 100
      </text>
      <text x={X1} y="44" textAnchor="end" className="lam-texto-chico lam-dato">
        Inflación anual <tspan ref={tasa} className="lam-cifra">5,0 %</tspan>
      </text>
      {[0, 25, 50, 75, 100].map((v) => (
        <g key={v}>
          <path d={`M${X0} ${y(v)}H${X1}`} className="lam-rejilla" />
          <text x={X0 - 12} y={y(v) + 4} textAnchor="end" className="lam-texto-chico lam-cifra">
            {v}
          </text>
        </g>
      ))}
      {[0, 2, 4, 6, 8, 10].map((a) => (
        <text key={a} x={x(a)} y={Y0 + 24} textAnchor="middle" className="lam-texto-chico lam-cifra">
          {a}
        </text>
      ))}
      <text x={X1} y={Y0 + 50} textAnchor="end" className="lam-texto-chico">
        Años
      </text>
      <path d={`M${X0} ${y(100)}H${X1}`} className="lam-referencia" />
      <text x={X1 - 4} y={y(100) - 10} textAnchor="end" className="lam-texto-chico">
        Sin inflación
      </text>
      <path ref={area} d={`M${inicial.join(' L')} L${X1} ${Y0} L${X0} ${Y0} Z`} className="lam-area" />
      <path ref={linea} d={`M${inicial.join(' L')}`} className="lam-curva" />
      <g ref={punto} transform={`translate(${X1} ${y(61.39)})`}>
        <circle r="6" className="lam-punto" />
        <text ref={final} x="-14" y="30" textAnchor="end" className="lam-texto lam-cifra">
          S/ 61,39
        </text>
      </g>
    </svg>
  );
}
