'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { decimal, useRecorrido } from '../hooks/use-recorrido';

export type PasoPizarra = { titulo: string; texto: string; formula: ReactNode };

/** Sistema del gráfico: x ∈ [−3; 3,3], y ∈ [−1; 10,5] sobre un área de 416 × 352 unidades. */
const XMIN = -3, XMAX = 3.3, YMIN = -1, YMAX = 10.5;
const AX = { x0: 40, x1: 456, y0: 392, y1: 40 };
const X = (x: number) => AX.x0 + ((x - XMIN) / (XMAX - XMIN)) * (AX.x1 - AX.x0);
const Y = (y: number) => AX.y0 - ((y - YMIN) / (YMAX - YMIN)) * (AX.y0 - AX.y1);
const PARABOLA = (() => {
  const puntos: string[] = [];
  for (let x = -3.24; x <= 3.25; x += 0.05) puntos.push(`${X(x).toFixed(1)} ${Y(x * x).toFixed(1)}`);
  return `M${puntos.join(' L')}`;
})();
const H_INICIAL = 1.5;

/**
 * Pizarra: la derivada de f(x) = x² construida paso a paso. En escritorio la pizarra queda fija mientras avanzan los pasos:
 * la secante entre P y Q se convierte en la tangente cuando h tiende a 0 (morphing con significado: es el límite que define la
 * derivada). Cada paso anterior sigue visible y el Tutor responde sobre un paso concreto, que queda señalado.
 * En tableta y móvil la pizarra va en el flujo y la distancia h se mueve con un control propio.
 */
export function PizarraDerivada({ pasos, encabezado }: { pasos: PasoPizarra[]; encabezado: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const { activo, suscribir } = useRecorrido(raiz, { linea: 0.5, lineaMovil: 0.6 });
  const [a, setA] = useState(1);
  const [hManual, setHManual] = useState(H_INICIAL);
  const [escritorio, setEscritorio] = useState(false);
  const hScroll = useRef(H_INICIAL);
  const graficos = useRef<SVGSVGElement>(null);
  const lecturaRef = useRef<HTMLParagraphElement>(null);
  const idA = useId();
  const idH = useId();

  useEffect(() => {
    const consulta = window.matchMedia('(min-width: 64rem)');
    const actualizar = () => setEscritorio(consulta.matches);
    actualizar();
    consulta.addEventListener('change', actualizar);
    return () => consulta.removeEventListener('change', actualizar);
  }, []);

  const dibujar = useCallback((aa: number, h: number) => {
    const svg = graficos.current;
    if (!svg) return;
    const m = 2 * aa + h;
    const recta = (x: number) => aa * aa + m * (x - aa);
    svg.querySelector('[data-recta]')?.setAttribute('d', `M${X(XMIN)} ${Y(recta(XMIN)).toFixed(1)} L${X(XMAX)} ${Y(recta(XMAX)).toFixed(1)}`);
    svg.querySelector('[data-p]')?.setAttribute('transform', `translate(${X(aa).toFixed(1)} ${Y(aa * aa).toFixed(1)})`);
    svg.querySelector('[data-q]')?.setAttribute('transform', `translate(${X(aa + h).toFixed(1)} ${Y((aa + h) ** 2).toFixed(1)})`);
    svg.querySelector('[data-h]')?.setAttribute('d', `M${X(aa).toFixed(1)} ${Y(-0.55)} H${X(aa + h).toFixed(1)}`);
    const lectura = lecturaRef.current;
    if (lectura) lectura.textContent = h < 0.005 ? `Pendiente de la tangente: ${decimal(m)}` : `Pendiente de la secante: ${decimal(m, 2)}`;
    svg.dataset.tangente = h < 0.005 ? 'si' : 'no';
  }, []);

  // En escritorio, h depende del avance del paso 4 (índice 3); antes vale 1,5 y después, 0.
  useEffect(
    () =>
      suscribir((e) => {
        if (!window.matchMedia('(min-width: 64rem)').matches) return;
        const h = e.activo < 3 ? H_INICIAL : e.activo > 3 ? 0 : H_INICIAL * (1 - (e.progresos[3] ?? 0));
        hScroll.current = h;
        dibujar(Number(graficos.current?.dataset.a ?? 1), h);
      }),
    [suscribir, dibujar],
  );

  useEffect(() => {
    if (graficos.current) graficos.current.dataset.a = String(a);
    dibujar(a, escritorio ? hScroll.current : hManual);
  }, [a, hManual, escritorio, dibujar]);

  const pasoVisible = escritorio ? activo : pasos.length - 1;

  return (
    <div ref={raiz} className="marco reticula recorrido pizarra-recorrido" data-activo="0">
      <div className="pizarra-texto">
        {encabezado}
        <ol className="pizarra-pasos">
          {pasos.map((p, i) => (
            <li key={p.titulo} data-paso id={i === 2 ? 'tutor' : undefined} className="pizarra-paso" data-activo={i === 0 || undefined}>
              <p className="pizarra-paso-numero">Paso {i + 1}</p>
              <h4>{p.titulo}</h4>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
      <div className="pizarra-columna">
        <div className="pizarra" role="group" aria-label="Pizarra: derivada de f de x igual a x al cuadrado">
          <div className="pizarra-barra">
            <span className="pizarra-tema">Derivada de una función</span>
            <span className="pizarra-estado" aria-hidden="true">
              Paso {pasoVisible + 1} de {pasos.length}
            </span>
          </div>
          <div className="pizarra-cuerpo">
            <div className="pizarra-figura">
            <svg ref={graficos} viewBox="0 0 480 420" className="pizarra-grafico" data-etapa={pasoVisible} data-a="1" aria-hidden="true">
              <defs>
                <clipPath id="pizarra-area">
                  <rect x={AX.x0} y={AX.y1} width={AX.x1 - AX.x0} height={AX.y0 - AX.y1} />
                </clipPath>
              </defs>
              {[-2, -1, 1, 2, 3].map((v) => (
                <g key={`x${v}`}>
                  <path d={`M${X(v)} ${AX.y1}V${AX.y0}`} className="lam-rejilla" />
                  <text x={X(v)} y={Y(0) + 18} textAnchor="middle" className="lam-texto-chico lam-cifra">
                    {v}
                  </text>
                </g>
              ))}
              {[2, 4, 6, 8, 10].map((v) => (
                <g key={`y${v}`}>
                  <path d={`M${AX.x0} ${Y(v)}H${AX.x1}`} className="lam-rejilla" />
                  <text x={X(0) - 8} y={Y(v) + 4} textAnchor="end" className="lam-texto-chico lam-cifra">
                    {v}
                  </text>
                </g>
              ))}
              <path d={`M${AX.x0} ${Y(0)}H${AX.x1}M${X(0)} ${AX.y1}V${AX.y0}`} className="lam-eje" />
              <g clipPath="url(#pizarra-area)">
                <path d={PARABOLA} className="lam-curva-tinta" />
                <path data-recta d="" className="pizarra-recta" />
              </g>
              <text x={X(2.2)} y={Y(9.6)} className="lam-texto pizarra-f">
                f(x) = x²
              </text>
              <path data-h d="" className="pizarra-h" />
              <g data-p>
                <circle r="6" className="lam-punto-tinta" />
                <text x="-12" y="-10" textAnchor="end" className="lam-texto">
                  P
                </text>
              </g>
              <g data-q className="pizarra-q">
                <circle r="6" className="lam-punto" />
                <text x="12" y="-8" className="lam-texto">
                  Q
                </text>
              </g>
            </svg>
            <p ref={lecturaRef} className="pizarra-lectura" data-etapa={pasoVisible} aria-hidden="true">
              Pendiente de la secante: 3,50
            </p>
            </div>
            <ol className="pizarra-desarrollo">
              {pasos.map((p, i) => (
                <li
                  key={p.titulo}
                  className="pizarra-fila"
                  data-estado={!escritorio || i < activo ? 'hecho' : i === activo ? 'actual' : 'pendiente'}
                  data-senalada={(escritorio ? activo === 2 : true) && i === 2 ? '' : undefined}
                >
                  <span className="pizarra-fila-numero" aria-hidden="true">
                    {i + 1}
                  </span>
                  <span className="pizarra-fila-formula">{p.formula}</span>
                </li>
              ))}
            </ol>
            <aside className="pizarra-tutor" data-visible={!escritorio || activo >= 2 || undefined} aria-label="Conversación con el Tutor sobre el paso 3">
              <p className="tutor-pregunta">¿Por qué se puede dividir entre h?</p>
              <div className="tutor-respuesta">
                <p className="tutor-firma">
                  <img src="/marca/mentelyx-buho-64.webp" width={64} height={64} alt="" />
                  Tutor, sobre el paso 3
                </p>
                <p>
                  Porque h no es cero: P y Q son puntos distintos. Por eso, en el paso siguiente calculamos el límite cuando h tiende a cero,
                  en lugar de reemplazar h por cero.
                </p>
              </div>
            </aside>
          </div>
          <div className="pizarra-control">
            <div className="control-deslizante">
              <label htmlFor={idA}>Punto a</label>
              <input id={idA} type="range" min={-2} max={1.6} step={0.1} value={a} onChange={(e) => setA(Number(e.target.value))} />
              <output htmlFor={idA} className="lam-cifra">
                f′({decimal(a)}) = {decimal(2 * a)}
              </output>
            </div>
            <div className="control-deslizante control-h">
              <label htmlFor={idH}>Distancia h</label>
              <input id={idH} type="range" min={0} max={1.5} step={0.05} value={hManual} onChange={(e) => setHManual(Number(e.target.value))} />
              <output htmlFor={idH} className="lam-cifra">
                h = {decimal(hManual, 2)}
              </output>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
