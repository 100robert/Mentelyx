'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/iconos';

/**
 * Cuaderno de estudio sobre el lienzo: resaltados, notas y selección por región o lazo.
 * Los resaltados usan la API CSS Custom Highlight (no alteran el DOM que pinta React). Resaltados y notas se guardan en
 * este navegador (localStorage) y se borran al cerrar sesión (estado local del dispositivo, diseño de interfaces 8.6).
 */
export type Resaltado = { id: string; ancla: string; inicio: number; fin: number };
export type Nota = { id: string; ancla: string; texto: string };
export type Herramienta = 'texto' | 'resaltar' | 'region' | 'lazo' | 'nota';
type Datos = { resaltados: Resaltado[]; notas: Nota[] };

const PREFIJO = 'mx:cuaderno:';
const vacio: Datos = { resaltados: [], notas: [] };
const nuevoId = () => Math.random().toString(36).slice(2, 10);

/** Borra del navegador todo lo guardado por el cuaderno (se llama al cerrar sesión). */
export function limpiarCuadernoLocal() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIJO)) localStorage.removeItem(k);
    }
  } catch {
    /* almacenamiento no disponible: nada que borrar */
  }
}

export function useCuaderno(clave: string) {
  const [datos, setDatos] = useState<Datos>(vacio);
  useEffect(() => {
    try {
      const guardado = localStorage.getItem(PREFIJO + clave);
      setDatos(guardado ? { ...vacio, ...(JSON.parse(guardado) as Datos) } : vacio);
    } catch {
      setDatos(vacio);
    }
  }, [clave]);
  const guardar = useCallback(
    (cambio: (d: Datos) => Datos) =>
      setDatos((d) => {
        const nuevo = cambio(d);
        try {
          localStorage.setItem(PREFIJO + clave, JSON.stringify(nuevo));
        } catch {
          /* sin almacenamiento: el cambio vive solo en esta pestaña */
        }
        return nuevo;
      }),
    [clave],
  );
  return {
    ...datos,
    resaltar: (r: Omit<Resaltado, 'id'>) => guardar((d) => ({ ...d, resaltados: [...d.resaltados, { ...r, id: nuevoId() }] })),
    quitarResaltados: (ancla: string, inicio: number, fin: number) =>
      guardar((d) => ({ ...d, resaltados: d.resaltados.filter((r) => !(r.ancla === ancla && r.inicio < fin && r.fin > inicio)) })),
    anotar: (ancla: string, texto = '') => {
      const id = nuevoId();
      guardar((d) => ({ ...d, notas: [...d.notas, { id, ancla, texto }] }));
      return id;
    },
    editarNota: (id: string, texto: string) => guardar((d) => ({ ...d, notas: d.notas.map((n) => (n.id === id ? { ...n, texto } : n)) })),
    borrarNota: (id: string) => guardar((d) => ({ ...d, notas: d.notas.filter((n) => n.id !== id) })),
  };
}

/** Recorre los nodos de texto de un bloque en orden; la posición de un punto es la suma de los textos anteriores. */
function textos(el: Element) {
  const lista: Text[] = [];
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  while (w.nextNode()) lista.push(w.currentNode as Text);
  return lista;
}
export function posicion(el: Element, nodo: Node, offset: number) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.setEnd(nodo, offset);
  return r.toString().length;
}
function rango(el: Element, inicio: number, fin: number) {
  const r = document.createRange();
  let total = 0;
  let empezado = false;
  for (const t of textos(el)) {
    const largo = t.data.length;
    if (!empezado && inicio <= total + largo) {
      r.setStart(t, Math.max(0, inicio - total));
      empezado = true;
    }
    if (empezado && fin <= total + largo) {
      r.setEnd(t, Math.max(0, fin - total));
      return r;
    }
    total += largo;
  }
  return null;
}

export const resaltadoDisponible = () => typeof CSS !== 'undefined' && 'highlights' in CSS && typeof Highlight !== 'undefined';

/** Vuelve a pintar los resaltados guardados cada vez que cambian o cambia lo que muestra el lienzo. */
export function usePintarResaltados(contenedor: RefObject<HTMLElement | null>, resaltados: Resaltado[], dependencia: unknown) {
  useEffect(() => {
    if (!resaltadoDisponible() || !contenedor.current) return;
    const rangos: Range[] = [];
    for (const r of resaltados) {
      const el = contenedor.current.querySelector(`[data-ancla="${CSS.escape(r.ancla)}"]`);
      const rg = el ? rango(el, r.inicio, r.fin) : null;
      if (rg) rangos.push(rg);
    }
    CSS.highlights.set('mx-resaltado', new Highlight(...rangos));
    return () => {
      CSS.highlights.delete('mx-resaltado');
    };
  }, [contenedor, resaltados, dependencia]);
}

export type SeleccionTexto = { ancla: string; inicio: number; fin: number; texto: string; caja: DOMRect };

/** Selección de texto dentro de un único bloque del lienzo (se recorta al bloque donde empieza). */
export function leerSeleccion(contenedor: HTMLElement): SeleccionTexto | null {
  const sel = window.getSelection();
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;
  const r = sel.getRangeAt(0);
  const inicioEl = (r.startContainer.nodeType === Node.ELEMENT_NODE ? (r.startContainer as Element) : r.startContainer.parentElement)?.closest('[data-ancla]');
  if (!inicioEl || !contenedor.contains(inicioEl)) return null;
  const ancla = inicioEl.getAttribute('data-ancla') ?? '';
  const inicio = posicion(inicioEl, r.startContainer, r.startOffset);
  const fin = inicioEl.contains(r.endContainer) ? posicion(inicioEl, r.endContainer, r.endOffset) : (inicioEl.textContent ?? '').length;
  if (fin <= inicio) return null;
  const texto = (inicioEl.textContent ?? '').slice(inicio, fin).trim();
  return texto ? { ancla, inicio, fin, texto, caja: r.getBoundingClientRect() } : null;
}

const HERRAMIENTAS: Array<{ id: Herramienta; texto: string; icono: NombreIcono; ayuda: string }> = [
  { id: 'texto', texto: 'Seleccionar texto', icono: 'cursor', ayuda: 'Selecciona texto para resaltar, anotar o preguntar' },
  { id: 'resaltar', texto: 'Resaltador', icono: 'resaltar', ayuda: 'Lo que selecciones queda resaltado' },
  { id: 'region', texto: 'Región', icono: 'region', ayuda: 'Arrastra un rectángulo sobre la hoja' },
  { id: 'lazo', texto: 'Lazo', icono: 'lazo', ayuda: 'Rodea a mano alzada lo que quieras consultar' },
  { id: 'nota', texto: 'Nota', icono: 'nota', ayuda: 'Pulsa un párrafo para anotarlo' },
];

export function HerramientasCuaderno({ actual, alCambiar, sinResaltado }: { actual: Herramienta; alCambiar: (h: Herramienta) => void; sinResaltado: boolean }) {
  return (
    <div className="herramientas" role="toolbar" aria-label="Herramientas del cuaderno" aria-orientation="vertical">
      {HERRAMIENTAS.filter((h) => !(sinResaltado && h.id === 'resaltar')).map((h) => (
        <button key={h.id} type="button" className="herramienta" aria-pressed={actual === h.id} title={h.ayuda} onClick={() => alCambiar(h.id)}>
          <Icono nombre={h.icono} />
          <span className="visually-hidden">{h.texto}</span>
        </button>
      ))}
    </div>
  );
}

/** Barra contextual sobre la selección de texto (divulgación progresiva: solo aparece cuando hay algo seleccionado). */
export function BarraSeleccion({
  seleccion,
  yaResaltado,
  sinResaltado,
  alResaltar,
  alQuitar,
  alAnotar,
  alPreguntar,
}: {
  seleccion: SeleccionTexto;
  yaResaltado: boolean;
  sinResaltado: boolean;
  alResaltar: () => void;
  alQuitar: () => void;
  alAnotar: () => void;
  alPreguntar: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const top = Math.max(8, seleccion.caja.top - 52);
  const left = Math.min(Math.max(8, seleccion.caja.left + seleccion.caja.width / 2 - 170), window.innerWidth - 348);
  return (
    <div className="barra-seleccion" role="toolbar" aria-label="Acciones sobre la selección" style={{ top, left }}>
      {!sinResaltado &&
        (yaResaltado ? (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={alQuitar}>
            <Icono nombre="borrar" tamano={16} />
            Quitar resaltado
          </button>
        ) : (
          <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={alResaltar}>
            <Icono nombre="resaltar" tamano={16} />
            Resaltar
          </button>
        ))}
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={alAnotar}>
        <Icono nombre="nota" tamano={16} />
        Anotar
      </button>
      <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={alPreguntar}>
        <Icono nombre="conversaciones" tamano={16} />
        Preguntar
      </button>
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          void navigator.clipboard?.writeText(seleccion.texto).then(() => {
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1500);
          });
        }}
      >
        <Icono nombre={copiado ? 'listo' : 'copiar'} tamano={16} />
        {copiado ? 'Copiado' : 'Copiar'}
      </button>
    </div>
  );
}

/** Nota al lado de un párrafo: se guarda mientras se escribe. */
export function NotaBloque({ nota, alEditar, alBorrar, enfocar }: { nota: Nota; alEditar: (t: string) => void; alBorrar: () => void; enfocar: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (enfocar) ref.current?.focus();
  }, [enfocar]);
  return (
    <div className="nota" data-nota>
      <Icono nombre="nota" tamano={16} />
      <label className="visually-hidden" htmlFor={`nota-${nota.id}`}>
        Nota sobre el párrafo
      </label>
      <textarea id={`nota-${nota.id}`} ref={ref} rows={2} value={nota.texto} placeholder="Escribe tu nota" onChange={(e) => alEditar(e.target.value)} />
      <button type="button" className="boton-icono" onClick={alBorrar}>
        <Icono nombre="borrar" tamano={16} />
        <span className="visually-hidden">Eliminar la nota</span>
      </button>
    </div>
  );
}

/** Capa de selección por región (rectángulo) o lazo (trazo libre). Devuelve las anclas de los bloques abarcados. */
export function CapaSeleccion({ modo, tablero, alSeleccionar }: { modo: 'region' | 'lazo'; tablero: RefObject<HTMLElement | null>; alSeleccionar: (anclas: string[]) => void }) {
  const [puntos, setPuntos] = useState<Array<[number, number]>>([]);
  const arrastrando = useRef(false);
  const relativo = (e: React.PointerEvent): [number, number] => {
    const r = tablero.current!.getBoundingClientRect();
    return [e.clientX - r.left, e.clientY - r.top];
  };
  const terminar = () => {
    arrastrando.current = false;
    const t = tablero.current;
    if (!t || puntos.length < 2) return setPuntos([]);
    const base = t.getBoundingClientRect();
    const [x0, y0] = puntos[0]!;
    const [x1, y1] = puntos.at(-1)!;
    const dentro = (px: number, py: number) => {
      if (modo === 'region') return px >= Math.min(x0, x1) && px <= Math.max(x0, x1) && py >= Math.min(y0, y1) && py <= Math.max(y0, y1);
      let c = false;
      for (let i = 0, j = puntos.length - 1; i < puntos.length; j = i++) {
        const [xi, yi] = puntos[i]!;
        const [xj, yj] = puntos[j]!;
        if (yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
      }
      return c;
    };
    const anclas = [...t.querySelectorAll<HTMLElement>('[data-ancla]')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        const cx = r.left - base.left + r.width / 2;
        const cy = r.top - base.top + r.height / 2;
        return dentro(cx, cy) || dentro(r.left - base.left + 8, cy) || dentro(r.right - base.left - 8, cy);
      })
      .map((el) => el.dataset.ancla!)
      .filter(Boolean);
    setPuntos([]);
    alSeleccionar(anclas);
  };
  const forma =
    modo === 'region' && puntos.length > 1
      ? (() => {
          const [x0, y0] = puntos[0]!;
          const [x1, y1] = puntos.at(-1)!;
          return <rect x={Math.min(x0, x1)} y={Math.min(y0, y1)} width={Math.abs(x1 - x0)} height={Math.abs(y1 - y0)} />;
        })()
      : puntos.length > 1 && <polygon points={puntos.map((p) => p.join(',')).join(' ')} />;
  return (
    <svg
      className="capa-seleccion"
      data-modo={modo}
      aria-hidden="true"
      onPointerDown={(e) => {
        (e.target as Element).setPointerCapture(e.pointerId);
        arrastrando.current = true;
        setPuntos([relativo(e)]);
      }}
      onPointerMove={(e) => {
        if (!arrastrando.current) return;
        const p = relativo(e);
        setPuntos((ps) => (modo === 'region' ? [ps[0]!, p] : [...ps, p]));
      }}
      onPointerUp={terminar}
      onPointerCancel={() => {
        arrastrando.current = false;
        setPuntos([]);
      }}
    >
      {forma}
    </svg>
  );
}

/** Hilos de cita: líneas que unen cada número de cita con su pasaje fijado (el rasgo propio de Mentelyx). */
export function HilosCita({ tablero, claves }: { tablero: RefObject<HTMLElement | null>; claves: string }) {
  const [trazos, setTrazos] = useState<Array<{ n: string; d: string }>>([]);
  useEffect(() => {
    const t = tablero.current;
    if (!t) return;
    const medir = () => {
      // Con la columna al lado de la hoja, los pasajes empiezan a la altura de su primera cita (hilo corto y casi horizontal).
      const columna = t.querySelector<HTMLElement>('.fijadas');
      const hojaEl = t.querySelector<HTMLElement>('.hoja');
      if (columna && hojaEl) {
        const lado = columna.getBoundingClientRect().left >= hojaEl.getBoundingClientRect().right;
        const primera = columna.querySelector<HTMLElement>('.fijada[data-n]');
        const chip = primera ? t.querySelector<HTMLElement>(`.hoja .ref-cita[data-n="${primera.dataset.n}"]`) : null;
        const objetivo = lado && chip ? Math.max(0, Math.round(chip.getBoundingClientRect().top - hojaEl.getBoundingClientRect().top - 16)) : 0;
        if (Math.abs((parseFloat(columna.style.paddingBlockStart) || 0) - objetivo) > 1) columna.style.paddingBlockStart = `${objetivo}px`;
      }
      const base = t.getBoundingClientRect();
      const nuevos: Array<{ n: string; d: string }> = [];
      for (const tarjeta of t.querySelectorAll<HTMLElement>('.fijada[data-n]')) {
        const n = tarjeta.dataset.n!;
        const chip = t.querySelector<HTMLElement>(`.hoja .ref-cita[data-n="${n}"]`);
        const hoja = t.querySelector<HTMLElement>('.hoja');
        if (!chip || !hoja) continue;
        const a = chip.getBoundingClientRect();
        const borde = hoja.getBoundingClientRect().right;
        const b = tarjeta.getBoundingClientRect();
        if (b.left < borde) continue; // apiladas en columna: sin hilo
        // El hilo sale del borde de la hoja a la altura de la cita (no cruza el texto) y llega al pasaje.
        const x1 = borde - base.left;
        const y1 = a.top - base.top + a.height / 2;
        const x2 = b.left - base.left;
        const y2 = b.top - base.top + 22;
        const dx = Math.max(40, (x2 - x1) / 2);
        nuevos.push({ n, d: `M${x1},${y1} C${x1 + dx},${y1} ${x2 - dx},${y2} ${x2},${y2}` });
      }
      setTrazos(nuevos);
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(t);
    void document.fonts?.ready.then(medir);
    window.addEventListener('resize', medir);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', medir);
    };
  }, [tablero, claves]);
  if (trazos.length === 0) return null;
  return (
    <svg className="hilos" aria-hidden="true">
      {trazos.map((t) => (
        <g key={t.n}>
          <path d={t.d} />
          <circle r="3.5" cx={t.d.split(' ').at(-1)!.split(',')[0]} cy={t.d.split(' ').at(-1)!.split(',')[1]} />
        </g>
      ))}
    </svg>
  );
}
