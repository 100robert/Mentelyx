'use client';

import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { acercar, analizar, decimal, derivar, desplazar, evaluar, funcionDe, marcas, muestrear, type Nodo, type Vista } from '@/features/matematicas';
import type { PropsBloque } from './basicos';

const W = 640, H = 400;
const M = { izq: 46, der: 14, arr: 14, aba: 30 };

function escalas(v: Vista) {
  const X = (x: number) => M.izq + ((x - v.xMin) / (v.xMax - v.xMin)) * (W - M.izq - M.der);
  const Y = (y: number) => H - M.aba - ((y - v.yMin) / (v.yMax - v.yMin)) * (H - M.arr - M.aba);
  return { X, Y };
}
const camino = (tramos: Array<Array<[number, number]>>, X: (x: number) => number, Y: (y: number) => number) =>
  tramos.map((t) => `M${t.map(([x, y]) => `${X(x).toFixed(1)} ${Y(Math.max(-1e5, Math.min(1e5, y))).toFixed(1)}`).join('L')}`).join('');

function Ejes({ v, ejes }: { v: Vista; ejes?: { x: string; y: string } | undefined }) {
  const { X, Y } = escalas(v);
  const mx = marcas(v.xMin, v.xMax, 8);
  const my = marcas(v.yMin, v.yMax, 6);
  const x0 = Math.min(Math.max(0, v.yMin), v.yMax);
  const y0 = Math.min(Math.max(0, v.xMin), v.xMax);
  return (
    <g className="grafico-ejes" aria-hidden="true">
      {mx.map((m) => (
        <g key={`x${m}`}>
          <path d={`M${X(m)} ${M.arr}V${H - M.aba}`} className="grafico-rejilla" />
          <text x={X(m)} y={H - M.aba + 18} textAnchor="middle" className="grafico-cifra">
            {decimal(m, 3)}
          </text>
        </g>
      ))}
      {my.map((m) => (
        <g key={`y${m}`}>
          <path d={`M${M.izq} ${Y(m)}H${W - M.der}`} className="grafico-rejilla" />
          <text x={M.izq - 6} y={Y(m) + 4} textAnchor="end" className="grafico-cifra">
            {decimal(m, 3)}
          </text>
        </g>
      ))}
      <path d={`M${M.izq} ${Y(x0)}H${W - M.der}M${X(y0)} ${M.arr}V${H - M.aba}`} className="grafico-eje" />
      {ejes && (
        <>
          <text x={W - M.der - 4} y={Y(x0) - 6} textAnchor="end" className="grafico-nombre-eje">
            {ejes.x}
          </text>
          <text x={X(y0) + 6} y={M.arr + 12} className="grafico-nombre-eje">
            {ejes.y}
          </text>
        </>
      )}
    </g>
  );
}

/** Zoom con botones o teclado y desplazamiento arrastrando; la vista se guarda en el estado del bloque al soltar. */
function useVista(inicial: Vista, guardada: Vista | null, guardar: (v: Vista) => void) {
  const [vista, setVista] = useState<Vista>(guardada ?? inicial);
  const arrastre = useRef<{ x: number; y: number; v: Vista } | null>(null);
  useEffect(() => setVista(guardada ?? inicial), [guardada, inicial]);
  const svgProps = {
    onPointerDown: (e: PointerEvent<SVGSVGElement>) => {
      if (e.pointerType === 'touch') return; // en táctil, el arrastre desplaza la página; el zoom va con los botones
      e.currentTarget.setPointerCapture(e.pointerId);
      arrastre.current = { x: e.clientX, y: e.clientY, v: vista };
    },
    onPointerMove: (e: PointerEvent<SVGSVGElement>) => {
      const a = arrastre.current;
      if (!a) return;
      const r = e.currentTarget.getBoundingClientRect();
      const dx = ((e.clientX - a.x) / r.width) * (W / (W - M.izq - M.der)) * (a.v.xMax - a.v.xMin);
      const dy = ((e.clientY - a.y) / r.height) * (H / (H - M.arr - M.aba)) * (a.v.yMax - a.v.yMin);
      setVista(desplazar(a.v, -dx, dy));
    },
    onPointerUp: () => {
      if (arrastre.current) guardar(vista);
      arrastre.current = null;
    },
    onKeyDown: (e: KeyboardEvent<SVGSVGElement>) => {
      const px = (vista.xMax - vista.xMin) / 10, py = (vista.yMax - vista.yMin) / 10;
      const mapa: Record<string, () => Vista> = {
        ArrowLeft: () => desplazar(vista, -px, 0),
        ArrowRight: () => desplazar(vista, px, 0),
        ArrowUp: () => desplazar(vista, 0, py),
        ArrowDown: () => desplazar(vista, 0, -py),
        '+': () => acercar(vista, 0.8),
        '=': () => acercar(vista, 0.8),
        '-': () => acercar(vista, 1.25),
        '0': () => inicial,
      };
      const f = mapa[e.key];
      if (!f) return;
      e.preventDefault();
      const nueva = f();
      setVista(nueva);
      guardar(nueva);
    },
  };
  const zoom = (factor: number | null) => {
    const nueva = factor === null ? inicial : acercar(vista, factor);
    setVista(nueva);
    guardar(nueva);
  };
  return { vista, svgProps, zoom };
}

function ControlesVista({ zoom }: { zoom: (f: number | null) => void }) {
  return (
    <div className="grafico-vista" role="group" aria-label="Zoom del gráfico">
      <button type="button" className="boton-icono" onClick={() => zoom(0.8)}>
        <span aria-hidden="true">+</span>
        <span className="visually-hidden">Acercar</span>
      </button>
      <button type="button" className="boton-icono" onClick={() => zoom(1.25)}>
        <span aria-hidden="true">−</span>
        <span className="visually-hidden">Alejar</span>
      </button>
      <button type="button" className="boton boton-terciario boton-chico" onClick={() => zoom(null)}>
        Restablecer
      </button>
    </div>
  );
}

/**
 * Gráfico de funciones: curvas con parámetros (deslizadores), puntos sobre una función y rectas tangentes calculadas con la
 * derivada simbólica (`derivar`) evaluada en el punto. Todo lo calcula el código determinista; el Tutor solo declara qué
 * dibujar. La lectura de cada tangente (punto, valor y pendiente) se anuncia como texto.
 */
export function BloqueGraficoVista({ bloque, interaccion, despachar }: PropsBloque<'grafico'>) {
  const c = bloque.contenido;
  const id = useId();
  const parametros = useMemo(() => c.parametros ?? [], [c.parametros]);
  const nombres = useMemo(() => parametros.map((p) => p.id), [parametros]);
  const valores = interaccion.parametros;
  const guardada = interaccion.vista?.tipo === 'plano' ? interaccion.vista : null;
  const { vista, svgProps, zoom } = useVista(c.vista, guardada, (v) => despachar({ accion: 'cambiar-vista', bloqueId: bloque.id, vista: { tipo: 'plano', ...v } }));
  const { X, Y } = escalas(vista);

  const funciones = useMemo(
    () =>
      c.funciones.flatMap((f) => {
        const r = analizar(f.expresion, ['x', ...nombres]);
        return r.ok ? [{ ...f, nodo: r.nodo, derivada: derivar(r.nodo, 'x') }] : [];
      }),
    [c.funciones, nombres],
  );
  const abscisa = (x: number | string) => {
    if (typeof x === 'number') return x;
    const r = analizar(x, nombres);
    return r.ok ? evaluar(r.nodo, valores) : Number.NaN;
  };
  const valorEn = (n: Nodo, x: number) => evaluar(n, { ...valores, x });

  const tangentes = (c.tangentes ?? []).flatMap((t) => {
    const f = funciones.find((x) => x.id === t.funcion);
    if (!f) return [];
    const x0 = abscisa(t.x);
    const y0 = valorEn(f.nodo, x0);
    const m = valorEn(f.derivada, x0);
    return Number.isFinite(x0) && Number.isFinite(y0) && Number.isFinite(m) ? [{ ...t, x0, y0, m, f }] : [];
  });
  const puntos = (c.puntos ?? []).flatMap((p) => {
    const f = funciones.find((x) => x.id === p.en);
    if (!f) return [];
    const x = abscisa(p.x);
    const y = valorEn(f.nodo, x);
    return Number.isFinite(x) && Number.isFinite(y) ? [{ ...p, x, y }] : [];
  });
  const resaltado = interaccion.resaltado;

  return (
    <div className="bloque-grafico">
      {parametros.length > 0 && (
        <div className="grafico-parametros">
          {parametros.map((p) => (
            <div key={p.id} className="control-deslizante">
              <label htmlFor={`${id}-${p.id}`}>{p.etiqueta ?? p.id}</label>
              <input
                id={`${id}-${p.id}`}
                type="range"
                min={p.min}
                max={p.max}
                step={p.paso}
                value={valores[p.id] ?? p.valor}
                onChange={(e) => despachar({ accion: 'modificar-parametro', bloqueId: bloque.id, parametro: p.id, valor: Number(e.target.value) })}
              />
              <output htmlFor={`${id}-${p.id}`} className="num">
                {p.id} = {decimal(valores[p.id] ?? p.valor)}
              </output>
            </div>
          ))}
        </div>
      )}
      <div className="grafico-lienzo">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={bloque.accesibilidad.descripcion} tabIndex={0} {...svgProps} aria-describedby={`${id}-lectura`}>
          <title>{bloque.titulo ?? 'Gráfico'}</title>
          <defs>
            <clipPath id={`${id}-area`}>
              <rect x={M.izq} y={M.arr} width={W - M.izq - M.der} height={H - M.arr - M.aba} />
            </clipPath>
          </defs>
          <Ejes v={vista} ejes={c.ejes} />
          <g clipPath={`url(#${id}-area)`}>
            {funciones.map((f) => (
              <path key={f.id} d={camino(muestrear(funcionDe(f.nodo, 'x', valores), vista, 360), X, Y)} className="trazo" data-color={f.color} data-resaltado={resaltado === f.id || undefined} />
            ))}
            {tangentes.map((t) => (
              <path
                key={t.id}
                d={`M${X(vista.xMin)} ${Y(t.y0 + t.m * (vista.xMin - t.x0)).toFixed(1)}L${X(vista.xMax)} ${Y(t.y0 + t.m * (vista.xMax - t.x0)).toFixed(1)}`}
                className="trazo trazo-tangente"
                data-color={t.color}
                data-resaltado={resaltado === t.id || undefined}
              />
            ))}
            {puntos.map((p) => (
              <g key={p.id} transform={`translate(${X(p.x).toFixed(1)} ${Y(p.y).toFixed(1)})`} data-resaltado={resaltado === p.id || undefined} className="grafico-punto" data-color={p.color ?? 'primario'}>
                <circle r={resaltado === p.id ? 8 : 6} />
                {p.etiqueta && (
                  <text x={10} y={-10} className="grafico-etiqueta">
                    {p.etiqueta}
                  </text>
                )}
              </g>
            ))}
          </g>
        </svg>
        <ControlesVista zoom={zoom} />
      </div>
      <ul className="grafico-leyenda" aria-label="Curvas">
        {funciones.map((f) => (
          <li key={f.id} data-color={f.color}>
            <span className="leyenda-muestra" aria-hidden="true" />
            {f.etiqueta ?? f.expresion}
          </li>
        ))}
      </ul>
      <dl id={`${id}-lectura`} className="grafico-lectura" aria-live="polite">
        {tangentes.map((t) => (
          <div key={t.id} data-resaltado={resaltado === t.id || undefined}>
            <dt>Tangente en x = {decimal(t.x0)}</dt>
            <dd>
              Punto ({decimal(t.x0)}; {decimal(t.y0)}) · pendiente <strong className="num">{decimal(t.m)}</strong> · recta y = {decimal(t.m)}x {t.y0 - t.m * t.x0 < 0 ? '−' : '+'} {decimal(Math.abs(t.y0 - t.m * t.x0))}
            </dd>
          </div>
        ))}
        {tangentes.length === 0 &&
          puntos.map((p) => (
            <div key={p.id}>
              <dt>{p.etiqueta ?? p.id}</dt>
              <dd className="num">
                ({decimal(p.x)}; {decimal(p.y)})
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

/** Diagrama de vectores (física): flechas con sus componentes y la resultante calculada como suma. */
export function BloqueVectoresVista({ bloque, interaccion }: PropsBloque<'vectores'>) {
  const c = bloque.contenido;
  const id = useId();
  const { X, Y } = escalas(c.vista);
  const unidad = c.unidad ? ` ${c.unidad}` : '';
  const resultante = c.resultante
    ? (() => {
        const de = c.vectores.filter((v) => c.resultante!.de.includes(v.id));
        const origen = de[0]?.origen ?? [0, 0];
        const comp: [number, number] = [de.reduce((s, v) => s + v.componentes[0], 0), de.reduce((s, v) => s + v.componentes[1], 0)];
        return { id: c.resultante.id, etiqueta: c.resultante.etiqueta, origen, componentes: comp, color: 'acento' as const };
      })()
    : null;
  const todos = [...c.vectores, ...(resultante ? [resultante] : [])];
  const modulo = (v: readonly [number, number]) => Math.hypot(v[0], v[1]);
  const angulo = (v: readonly [number, number]) => (Math.atan2(v[1], v[0]) * 180) / Math.PI;
  return (
    <div className="bloque-grafico bloque-vectores">
      <div className="grafico-lienzo">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={bloque.accesibilidad.descripcion} aria-describedby={`${id}-lectura`}>
          <title>{bloque.titulo ?? 'Vectores'}</title>
          <defs>
            {['primario', 'secundario', 'acento', 'exito', 'alerta', 'peligro', 'neutro', 'serie1', 'serie2', 'serie3', 'serie4', 'serie5', 'serie6'].map((col) => (
              <marker key={col} id={`${id}-punta-${col}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse" data-color={col} className="punta">
                <path d="M0 0L10 5L0 10z" />
              </marker>
            ))}
          </defs>
          <Ejes v={c.vista} />
          {todos.map((v) => {
            const [x0, y0] = v.origen;
            const x1 = x0 + v.componentes[0], y1 = y0 + v.componentes[1];
            const medio = [(X(x0) + X(x1)) / 2, (Y(y0) + Y(y1)) / 2];
            return (
              <g key={v.id} data-resaltado={interaccion.resaltado === v.id || undefined}>
                <path d={`M${X(x0)} ${Y(y0)}L${X(x1)} ${Y(y1)}`} className="trazo trazo-vector" data-color={v.color} markerEnd={`url(#${id}-punta-${v.color})`} data-resultante={v.id === resultante?.id || undefined} />
                <text x={medio[0]! + 8} y={medio[1]! - 8} className="grafico-etiqueta">
                  {v.etiqueta}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <dl id={`${id}-lectura`} className="grafico-lectura">
        {todos.map((v) => (
          <div key={v.id} data-resaltado={interaccion.resaltado === v.id || undefined}>
            <dt>{v.etiqueta}</dt>
            <dd className="num">
              ({decimal(v.componentes[0])}; {decimal(v.componentes[1])}){unidad} · módulo {decimal(modulo(v.componentes))}
              {unidad} · dirección {decimal(angulo(v.componentes), 1)}°
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
