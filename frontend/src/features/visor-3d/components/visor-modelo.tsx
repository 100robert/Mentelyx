'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { OrigenModelo } from '../modelos/cargador';
import type { AnclaVisor, Visor, VistaCamara } from '../visor';


export type ParteVista = { id: string; nombre: string; texto?: string };
export type ParametroVista = { id: string; etiqueta?: string | undefined; min: number; max: number; paso: number };
type Carga = 'espera' | 'cargando' | 'listo' | 'sin-webgl' | 'error' | 'perdido';

const VISTAS: Array<[VistaCamara, string]> = [
  ['inicial', 'Inicial'],
  ['frontal', 'Frontal'],
  ['lateral', 'Lateral'],
  ['superior', 'Superior'],
];

const cifra = (v: number, paso: number) => (paso >= 1 ? String(Math.round(v)) : v.toFixed(2).replace('.', ','));

/**
 * Visor 3D de Aprendizaje: el mismo motor de render de la landing, sin desplazamiento vinculado. Las piezas se eligen
 * tocando el modelo o desde la lista (accesible con teclado), y se pueden ocultar o aislar. Three.js se descarga solo al
 * acercarse el visor a la pantalla. Sin WebGL, o si se pierde el contexto, la lista de piezas y su descripción siguen
 * disponibles y se ofrece volver a cargar el modelo.
 */
export function VisorModelo(props: {
  origen: OrigenModelo;
  titulo: string;
  descripcion: string;
  partes: ParteVista[];
  parametros: ParametroVista[];
  valores: Record<string, number>;
  seleccion: string | null;
  resaltado: string | null;
  vista: VistaCamara | null;
  credito: string;
  alSeleccionar: (id: string | null) => void;
  alParametro: (id: string, valor: number) => void;
  alVista: (v: VistaCamara) => void;
  lecturaParametro?: (id: string, valor: number) => string | null;
}) {
  const marco = useRef<HTMLDivElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const rotulos = useRef<HTMLDivElement>(null);
  const visor = useRef<Visor | null>(null);
  const [carga, setCarga] = useState<Carga>('espera');
  const [intento, setIntento] = useState(0);
  const [ocultas, setOcultas] = useState<string[]>([]);
  const [aislada, setAislada] = useState<string | null>(null);
  const [etiquetas, setEtiquetas] = useState(true);
  const [completa, setCompleta] = useState(false);
  const id = useId();
  const ultimo = useRef(props);
  ultimo.current = props;
  const etiquetasRef = useRef(etiquetas);
  etiquetasRef.current = etiquetas;

  const clave = props.origen.tipo === 'catalogo' ? props.origen.clave : props.origen.src;

  // Carga diferida: el modelo se crea cuando el visor está a una pantalla de distancia.
  useEffect(() => {
    const nodo = escenario.current;
    if (!nodo) return;
    let cancelado = false;
    const observador = new IntersectionObserver(
      async ([e]) => {
        if (!e?.isIntersecting) return;
        observador.disconnect();
        const prueba = document.createElement('canvas');
        if (!prueba.getContext('webgl2') && !prueba.getContext('webgl')) return setCarga('sin-webgl');
        setCarga('cargando');
        try {
          const [{ crearVisor }, { cargarModelo }] = await Promise.all([import('../visor'), import('../modelos/cargador')]);
          // El contexto WebGL y el entorno de reflejos se crean en un momento ocioso: si se crean en esta misma vuelta,
          // retrasan el fotograma de la interacción que mostró el visor (medido al empezar un simulacro).
          await new Promise<void>((r) => ('requestIdleCallback' in window ? window.requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 200)));
          if (cancelado || !lienzo.current) return;
          const fino = window.matchMedia('(pointer: fine)').matches;
          const modesto = (navigator.hardwareConcurrency ?? 8) <= 4;
          const v = crearVisor(lienzo.current, {
            calidad: modesto ? 1.25 : 1.75,
            entornoReducido: modesto || !fino,
            alRenderizar: (anclas: AnclaVisor[]) => {
              const p = ultimo.current;
              // Rótulos sin solaparse: los destacados primero; si uno choca con otro ya colocado, baja un renglón.
              const colocados: Array<{ x: number; y: number; ancho: number }> = [];
              const elementos = [...(rotulos.current?.querySelectorAll<HTMLElement>('[data-ancla]') ?? [])];
              const peso = (el: HTMLElement) => (el.dataset.ancla === p.seleccion || el.dataset.ancla === p.resaltado ? 0 : 1);
              elementos.sort((x, y) => peso(x) - peso(y));
              for (const el of elementos) {
                const a = anclas.find((x) => x.id === el.dataset.ancla);
                const destacado = a?.id === p.seleccion || a?.id === p.resaltado;
                const visible = !!a && a.visible && (etiquetasRef.current || destacado);
                el.toggleAttribute('data-visible', visible);
                el.toggleAttribute('data-destacado', destacado);
                if (!a) continue;
                let y = a.y;
                const ancho = el.offsetWidth || 80;
                if (visible) {
                  for (let k = 0; k < 6 && colocados.some((c) => Math.abs(c.x - a.x) < (c.ancho + ancho) / 2 && Math.abs(c.y - y) < 22); k++) y += 24;
                  colocados.push({ x: a.x, y, ancho });
                }
                el.style.transform = `translate(${a.x.toFixed(1)}px, ${y.toFixed(1)}px)`;
              }
            },
            alSeleccionar: (pieza) => ultimo.current.alSeleccionar(pieza),
            alPerderContexto: () => {
              visor.current?.destruir();
              visor.current = null;
              setCarga('perdido');
            },
          });
          const modelo = await cargarModelo(props.origen);
          if (cancelado) {
            modelo.destruir();
            v.destruir();
            return;
          }
          const r = nodo.getBoundingClientRect();
          v.redimensionar(r.width, r.height);
          v.mostrar(modelo, ultimo.current.valores);
          v.seleccionar(ultimo.current.seleccion);
          v.resaltar(ultimo.current.resaltado);
          visor.current = v;
          setCarga('listo');
        } catch {
          if (!cancelado) setCarga('error');
        }
      },
      { rootMargin: '100% 0px' },
    );
    observador.observe(nodo);
    const tamano = new ResizeObserver(([e]) => {
      if (e && visor.current) visor.current.redimensionar(e.contentRect.width, e.contentRect.height);
    });
    tamano.observe(nodo);
    return () => {
      cancelado = true;
      observador.disconnect();
      tamano.disconnect();
      visor.current?.destruir();
      visor.current = null;
    };
    // El modelo se vuelve a crear solo si cambia su origen (clave) o si la persona pide recargarlo (intento).
  }, [clave, intento]);

  // El estado educativo (Tutor, recorrido o la propia persona) llega por props y se refleja en la escena.
  useEffect(() => visor.current?.parametros(props.valores), [props.valores, carga]);
  useEffect(() => visor.current?.seleccionar(props.seleccion), [props.seleccion, carga]);
  useEffect(() => visor.current?.resaltar(props.resaltado), [props.resaltado, carga]);
  useEffect(() => {
    if (props.vista) visor.current?.vista(props.vista);
  }, [props.vista, carga]);
  useEffect(() => {
    for (const p of props.partes) visor.current?.ocultar(p.id, ocultas.includes(p.id));
  }, [ocultas, props.partes, carga]);
  useEffect(() => visor.current?.aislar(aislada), [aislada, carga]);
  // Al mostrar u ocultar los rótulos se vuelve a pintar la escena (los rótulos se colocan tras cada render).
  useEffect(() => visor.current?.seleccionar(ultimo.current.seleccion), [etiquetas]);

  useEffect(() => {
    const alCambiar = () => setCompleta(document.fullscreenElement === marco.current);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  const elegida = props.partes.find((p) => p.id === props.seleccion);
  const listo = carga === 'listo';
  const pantallaCompleta = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void marco.current?.requestFullscreen?.().catch(() => {});
  };

  return (
    <div ref={marco} className="visor-3d" data-carga={carga} data-completa={completa || undefined}>
      <div className="visor-3d-barra" role="toolbar" aria-label={`Controles del modelo: ${props.titulo}`}>
        <div className="visor-3d-grupo" role="group" aria-label="Vistas">
          {VISTAS.map(([v, nombre]) => (
            <button key={v} type="button" className="boton boton-terciario boton-chico" disabled={!listo} aria-pressed={props.vista === v} onClick={() => props.alVista(v)}>
              {nombre}
            </button>
          ))}
        </div>
        <div className="visor-3d-grupo" role="group" aria-label="Zoom y giro">
          <button type="button" className="boton-icono" disabled={!listo} onClick={() => visor.current?.acercar(0.8)}>
            <span aria-hidden="true">+</span>
            <span className="visually-hidden">Acercar</span>
          </button>
          <button type="button" className="boton-icono" disabled={!listo} onClick={() => visor.current?.acercar(1.25)}>
            <span aria-hidden="true">−</span>
            <span className="visually-hidden">Alejar</span>
          </button>
          <button type="button" className="boton-icono" disabled={!listo} onClick={() => visor.current?.girar(-30)}>
            <span aria-hidden="true">↺</span>
            <span className="visually-hidden">Girar a la izquierda</span>
          </button>
          <button type="button" className="boton-icono" disabled={!listo} onClick={() => visor.current?.girar(30)}>
            <span aria-hidden="true">↻</span>
            <span className="visually-hidden">Girar a la derecha</span>
          </button>
        </div>
        <div className="visor-3d-grupo">
          <button type="button" className="boton boton-terciario boton-chico" aria-pressed={etiquetas} onClick={() => setEtiquetas((e) => !e)}>
            Rótulos
          </button>
          <button type="button" className="boton boton-terciario boton-chico" aria-pressed={completa} onClick={pantallaCompleta}>
            {completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
          </button>
        </div>
      </div>

      <div className="visor-3d-cuerpo">
        <div ref={escenario} className="visor-3d-escenario" role="img" aria-label={`${props.titulo}. ${props.descripcion}${elegida ? ` Pieza elegida: ${elegida.nombre}.` : ''}`}>
          <canvas ref={lienzo} />
          <div ref={rotulos} className="visor-3d-rotulos" aria-hidden="true">
            {props.partes.map((p) => (
              <span key={p.id} data-ancla={p.id} className="visor-3d-rotulo">
                {p.nombre}
              </span>
            ))}
          </div>
          {carga !== 'listo' && (
            <div className="visor-3d-estado" role={carga === 'error' || carga === 'perdido' ? 'alert' : 'status'}>
              {carga === 'espera' || carga === 'cargando' ? (
                <>
                  <span className="girador keep-motion" aria-hidden="true" />
                  <span>Cargando el modelo 3D…</span>
                </>
              ) : carga === 'sin-webgl' ? (
                <span>Este navegador no puede mostrar modelos 3D. Las piezas y su descripción siguen disponibles en la lista.</span>
              ) : (
                <>
                  <span>{carga === 'perdido' ? 'El navegador liberó la memoria gráfica del modelo.' : 'No pudimos cargar el modelo.'}</span>
                  <button
                    type="button"
                    className="boton boton-secundario boton-chico"
                    onClick={() => {
                      setCarga('espera');
                      setIntento((n) => n + 1);
                    }}
                  >
                    Volver a cargar el modelo
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="visor-3d-panel">
          {props.parametros.length > 0 && (
            <div className="visor-3d-parametros">
              {props.parametros.map((p) => {
                const valor = props.valores[p.id] ?? p.min;
                const lectura = props.lecturaParametro?.(p.id, valor);
                return (
                  <div key={p.id} className="control-deslizante">
                    <label htmlFor={`${id}-${p.id}`}>{p.etiqueta ?? p.id}</label>
                    <input id={`${id}-${p.id}`} type="range" min={p.min} max={p.max} step={p.paso} value={valor} onChange={(e) => props.alParametro(p.id, Number(e.target.value))} />
                    <output htmlFor={`${id}-${p.id}`} className="lam-cifra">
                      {lectura ?? cifra(valor, p.paso)}
                    </output>
                  </div>
                );
              })}
            </div>
          )}
          <fieldset className="visor-3d-piezas">
            <legend>Piezas</legend>
            <ul>
              {props.partes.map((p) => {
                const oculta = ocultas.includes(p.id);
                return (
                  <li key={p.id} data-elegida={p.id === props.seleccion || undefined}>
                    <button type="button" className="visor-3d-pieza" aria-pressed={p.id === props.seleccion} onClick={() => props.alSeleccionar(p.id === props.seleccion ? null : p.id)}>
                      {p.nombre}
                    </button>
                    <label className="visor-3d-ver">
                      <input type="checkbox" checked={!oculta} onChange={() => setOcultas((o) => (oculta ? o.filter((x) => x !== p.id) : [...o, p.id]))} disabled={aislada !== null} />
                      <span className="visually-hidden">Mostrar {p.nombre}</span>
                      <span aria-hidden="true">Ver</span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <div className="acciones">
              <button type="button" className="boton boton-secundario boton-chico" disabled={!props.seleccion} aria-pressed={aislada !== null} onClick={() => setAislada((a) => (a ? null : props.seleccion))}>
                {aislada ? 'Mostrar todas' : 'Aislar la elegida'}
              </button>
              {ocultas.length > 0 && (
                <button type="button" className="boton boton-terciario boton-chico" onClick={() => setOcultas([])}>
                  Mostrar las ocultas
                </button>
              )}
            </div>
          </fieldset>
          <div className="visor-3d-info" aria-live="polite">
            {elegida ? (
              <>
                <h4>{elegida.nombre}</h4>
                {elegida.texto && <p>{elegida.texto}</p>}
              </>
            ) : (
              <p className="suave">Toca una pieza del modelo o elígela en la lista.</p>
            )}
          </div>
        </div>
      </div>
      <p className="visor-3d-credito">{props.credito}</p>
    </div>
  );
}
