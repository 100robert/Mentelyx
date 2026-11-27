'use client';

import { useEffect, useRef } from 'react';
import { tramo, type Suscribir } from '../../hooks/use-recorrido';

/**
 * Circulación doble en esquema, vista anterior (el lado derecho del corazón aparece a la izquierda, como en los atlas).
 * Recorrido de la sangre: cuerpo → venas cavas → aurícula derecha → ventrículo derecho → arteria pulmonar → pulmones →
 * venas pulmonares → aurícula izquierda → ventrículo izquierdo → aorta → cuerpo. Al avanzar, cada tramo se dibuja en orden.
 * Colores semánticos (no de marca): rojo para sangre rica en oxígeno, azul para sangre pobre en oxígeno.
 */
const TRAMOS: Array<{ d: string; tipo: 'pobre' | 'rica'; etiqueta?: { x: number; y: number; texto: string; fin?: boolean } }> = [
  { d: 'M196 424H128V206H198', tipo: 'pobre', etiqueta: { x: 118, y: 316, texto: 'Venas cavas', fin: true } },
  { d: 'M255 244V262', tipo: 'pobre' },
  { d: 'M300 262V253H321V118', tipo: 'pobre', etiqueta: { x: 332, y: 146, texto: 'Arteria pulmonar' } },
  { d: 'M410 78H544V206H444', tipo: 'rica', etiqueta: { x: 432, y: 66, texto: 'Venas pulmonares' } },
  { d: 'M387 244V262', tipo: 'rica' },
  { d: 'M444 300H512V424H446', tipo: 'rica', etiqueta: { x: 524, y: 316, texto: 'Aorta' } },
];
const CAMARAS = [
  { x: 198, y: 170, linea1: 'Aurícula', linea2: 'derecha' },
  { x: 330, y: 170, linea1: 'Aurícula', linea2: 'izquierda' },
  { x: 198, y: 262, linea1: 'Ventrículo', linea2: 'derecho' },
  { x: 330, y: 262, linea1: 'Ventrículo', linea2: 'izquierdo' },
];

export function EscenaCorazon({ suscribir, indice }: { suscribir: Suscribir; indice: number }) {
  const raiz = useRef<SVGSVGElement>(null);
  useEffect(
    () =>
      suscribir((e) => {
        const p = e.progresos[indice] ?? 1;
        raiz.current?.querySelectorAll<SVGPathElement>('[data-tramo]').forEach((path, k) => {
          const avance = tramo(p, k / TRAMOS.length - 0.04, (k + 1) / TRAMOS.length - 0.04);
          path.style.strokeDashoffset = String(1 - avance);
        });
        raiz.current?.querySelectorAll<SVGElement>('[data-etiqueta]').forEach((t) => {
          const k = Number(t.dataset.etiqueta);
          // Rótulos: visibles u ocultos (sin opacidad intermedia que baje el contraste); la transición la da el CSS.
          t.style.opacity = tramo(p, k / TRAMOS.length, (k + 0.6) / TRAMOS.length) > 0 ? '1' : '0';
        });
      }),
    [suscribir, indice],
  );

  return (
    <svg ref={raiz} viewBox="0 0 640 480" className="escena" aria-hidden="true">
      <rect x="230" y="40" width="180" height="76" rx="38" className="lam-organo" />
      <text x="320" y="84" textAnchor="middle" className="lam-texto">
        Pulmones
      </text>
      <rect x="196" y="392" width="250" height="64" rx="8" className="lam-organo" />
      <text x="321" y="430" textAnchor="middle" className="lam-texto">
        Resto del cuerpo
      </text>
      {CAMARAS.map((c) => (
        <g key={c.linea1 + c.linea2}>
          <rect x={c.x} y={c.y} width="114" height={c.linea1 === 'Aurícula' ? 74 : 96} rx="10" className="lam-camara" />
          <text x={c.x + 57} y={c.y + (c.linea1 === 'Aurícula' ? 33 : 44)} textAnchor="middle" className="lam-texto-chico">
            {c.linea1}
            <tspan x={c.x + 57} dy="17">
              {c.linea2}
            </tspan>
          </text>
        </g>
      ))}
      {TRAMOS.map((t, k) => (
        <g key={t.d}>
          <path d={t.d} pathLength={1} data-tramo={k} className={`lam-sangre lam-sangre-${t.tipo}`} />
          {t.etiqueta && (
            <text data-etiqueta={k} x={t.etiqueta.x} y={t.etiqueta.y} textAnchor={t.etiqueta.fin ? 'end' : undefined} className="lam-texto-chico">
              {t.etiqueta.texto}
            </text>
          )}
        </g>
      ))}
      <g className="lam-leyenda">
        <path d="M30 470h22" className="lam-sangre lam-sangre-rica" />
        <text x="60" y="474" className="lam-texto-chico">
          Rica en oxígeno
        </text>
        <path d="M212 470h22" className="lam-sangre lam-sangre-pobre" />
        <text x="242" y="474" className="lam-texto-chico">
          Pobre en oxígeno
        </text>
      </g>
    </svg>
  );
}
