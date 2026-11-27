'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useRecorrido } from '../hooks/use-recorrido';
import { cargarEscenaMotor, type Ancla, type Motor } from '@/features/visor-3d/escena';
import { MotorEsquema } from './motor-esquema';
import { estadoDelPaso, rotulosDelPaso, type EstadoMotor, type ParteMotor } from './motor-estado';

export type PasoMotor = { titulo: string; texto: string; tutor?: string };

const NOMBRES: Record<ParteMotor, string> = {
  culata: 'Culata',
  bujia: 'Bujía',
  admision: 'Válvula de admisión',
  escape: 'Válvula de escape',
  piston: 'Pistón',
  biela: 'Biela',
  ciguenal: 'Cigüeñal',
  cilindro: 'Cilindro (en corte)',
};
const A_LA_IZQUIERDA: ParteMotor[] = ['culata', 'admision', 'piston', 'ciguenal'];
const TIEMPOS = ['Admisión', 'Compresión', 'Combustión', 'Escape'];

type Carga = 'espera' | 'cargando' | 'listo' | 'sin-webgl';

/**
 * Modelo 3D vinculado al desplazamiento. Three.js se descarga solo cuando la sección se acerca a la pantalla y se libera al
 * salir de la página; el lienzo se renderiza bajo demanda (cuando cambia el paso, el avance o la vista), nunca en bucle.
 * El arrastre para girar solo se activa con puntero fino: en pantallas táctiles el lienzo no captura el desplazamiento y
 * se gira con los botones. Sin WebGL, se muestra el mismo motor en corte 2D.
 */
export function MotorRecorrido({ pasos, encabezado }: { pasos: PasoMotor[]; encabezado: ReactNode }) {
  const raiz = useRef<HTMLDivElement>(null);
  const escenario = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const motor = useRef<Motor | null>(null);
  const rotulos = useRef<HTMLDivElement>(null);
  const visibles = useRef<ParteMotor[]>([]);
  const { activo, suscribir } = useRecorrido(raiz, { linea: 0.5, lineaMovil: 0.78 });
  const [carga, setCarga] = useState<Carga>('espera');
  const [estado, setEstado] = useState<EstadoMotor>(estadoDelPaso(0, 0, false));
  const ultimo = useRef(estado);
  const cargaActual = useRef<Carga>('espera');
  const ciclo = useRef<HTMLDivElement>(null);
  cargaActual.current = carga;

  // Carga diferida de la escena cuando la sección está a una pantalla de distancia.
  useEffect(() => {
    const nodo = escenario.current;
    if (!nodo) return;
    let cancelado = false;
    const sinWebgl = () => {
      setEstado(ultimo.current);
      setCarga('sin-webgl');
    };
    const observador = new IntersectionObserver(
      async ([entrada]) => {
        if (!entrada?.isIntersecting) return;
        observador.disconnect();
        const prueba = document.createElement('canvas');
        if (!prueba.getContext('webgl2') && !prueba.getContext('webgl')) {
          sinWebgl();
          return;
        }
        setCarga('cargando');
        try {
          const { crearMotor } = await cargarEscenaMotor();
          // La escena se crea en un momento ocioso para no retrasar la respuesta a lo que el visitante esté haciendo.
          await new Promise<void>((r) => ('requestIdleCallback' in window ? window.requestIdleCallback(() => r(), { timeout: 1500 }) : setTimeout(r, 200)));
          if (cancelado || !lienzo.current) return;
          const fino = window.matchMedia('(pointer: fine)').matches;
          const modesto = (navigator.hardwareConcurrency ?? 8) <= 4;
          motor.current = crearMotor(lienzo.current, {
            arrastre: fino,
            calidad: modesto ? 1.25 : 1.75,
            entornoReducido: modesto || !fino,
            alRenderizar: (anclas: Ancla[]) => {
              rotulos.current?.querySelectorAll<HTMLElement>('[data-ancla]').forEach((el) => {
                const a = anclas.find((x) => x.parte === el.dataset.ancla);
                const ver = !!a && a.visible && visibles.current.includes(a.parte);
                el.toggleAttribute('data-visible', ver);
                if (a) el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`;
              });
            },
          });
          const r = nodo.getBoundingClientRect();
          motor.current.redimensionar(r.width, r.height);
          motor.current.actualizar(ultimo.current);
          lienzo.current.addEventListener('webglcontextlost', sinWebgl, { once: true });
          setCarga('listo');
        } catch {
          sinWebgl();
        }
      },
      { rootMargin: '100% 0px 100% 0px' },
    );
    observador.observe(nodo);
    const tamano = new ResizeObserver(([e]) => {
      if (e && motor.current) motor.current.redimensionar(e.contentRect.width, e.contentRect.height);
    });
    tamano.observe(nodo);
    return () => {
      cancelado = true;
      observador.disconnect();
      tamano.disconnect();
      motor.current?.destruir();
      motor.current = null;
    };
  }, []);

  useEffect(
    () =>
      suscribir((e) => {
        const nuevo = estadoDelPaso(e.activo, e.progresos[e.activo] ?? 0, e.reducido);
        visibles.current = rotulosDelPaso(e.activo, nuevo);
        ultimo.current = nuevo;
        motor.current?.actualizar(nuevo);
        // Indicador del ciclo: se escribe directamente en el DOM para no renderizar React en cada fotograma.
        const nodo = ciclo.current;
        if (nodo) {
          const vuelta = ((nuevo.angulo % 720) + 720) % 720;
          const tiempo = Math.min(3, Math.floor(vuelta / 180));
          nodo.toggleAttribute('data-visible', nuevo.ciclo);
          nodo.querySelectorAll('li').forEach((li, i) => li.toggleAttribute('data-actual', nuevo.ciclo && i === tiempo));
          nodo.querySelector<HTMLElement>('[data-barra]')?.style.setProperty('transform', `scaleX(${(vuelta / 720).toFixed(4)})`);
          const dato = nodo.querySelector('[data-giro]');
          if (dato) dato.textContent = `${Math.floor(vuelta)}°`;
        }
        if (cargaActual.current !== 'listo') setEstado(nuevo);
      }),
    [suscribir],
  );

  return (
    <div ref={raiz} className="marco reticula recorrido motor-recorrido" data-activo="0">
      <div className="motor-texto">
        {encabezado}
        <ol className="motor-pasos">
          {pasos.map((p, i) => (
            <li key={p.titulo} data-paso className="motor-paso" data-activo={i === 0 || undefined}>
              <h4>{p.titulo}</h4>
              <p>{p.texto}</p>
              {p.tutor && (
                <p className="motor-tutor">
                  <img src="/marca/mentelyx-buho-64.webp" width={64} height={64} alt="" />
                  <span>
                    <span className="visually-hidden">El Tutor explica: </span>
                    {p.tutor}
                  </span>
                </p>
              )}
            </li>
          ))}
        </ol>
      </div>
      <div className="motor-columna">
        <div className="motor-escenario" data-carga={carga}>
          <div ref={escenario} className="motor-lienzo" role="img" aria-label={`Motor de cuatro tiempos en corte: ${pasos[activo]?.titulo ?? ''}`}>
            <canvas ref={lienzo} />
            {carga !== 'listo' && <MotorEsquema estado={estado} />}
            <div ref={rotulos} className="motor-rotulos" aria-hidden="true">
              {(Object.keys(NOMBRES) as ParteMotor[]).map((parte) => (
                <span key={parte} data-ancla={parte} className={A_LA_IZQUIERDA.includes(parte) ? 'rotulo rotulo-izq' : 'rotulo'}>
                  <span className="rotulo-texto">{NOMBRES[parte]}</span>
                </span>
              ))}
            </div>
          </div>
          <div ref={ciclo} className="motor-ciclo" aria-hidden="true">
            <ol>
              {TIEMPOS.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
            <span className="motor-ciclo-barra">
              <span data-barra />
            </span>
            <span className="motor-ciclo-dato">
              Giro del cigüeñal: <span data-giro className="lam-cifra">0°</span> de 720°
            </span>
          </div>
          {carga === 'listo' && (
            <div className="motor-controles">
              <button type="button" className="boton-icono boton-icono-campo" onClick={() => motor.current?.girar(-30)}>
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="icono">
                  <path d="M8 6H4.5V2.5M4.8 6A6.5 6.5 0 1 1 3.6 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="visually-hidden">Girar el modelo a la izquierda</span>
              </button>
              <button type="button" className="boton-icono boton-icono-campo" onClick={() => motor.current?.girar(30)}>
                <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" className="icono">
                  <path d="M12 6h3.5V2.5M15.2 6A6.5 6.5 0 1 0 16.4 12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="visually-hidden">Girar el modelo a la derecha</span>
              </button>
              <button type="button" className="boton boton-campo boton-chico" onClick={() => motor.current?.restablecer()}>
                Restablecer vista
              </button>
            </div>
          )}
        </div>
        <p className="motor-credito">Modelo 3D de elaboración propia. Tiempos de válvulas simplificados y proporciones ilustrativas.</p>
      </div>
    </div>
  );
}
