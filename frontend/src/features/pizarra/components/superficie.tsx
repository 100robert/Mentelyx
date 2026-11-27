'use client';

import { memo, useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { FormulaSegura } from '@/features/bloques';
import { expresionALatex } from '../insercion';
import {
  ajustarA,
  aMundo,
  cajaDe,
  cajaEnMundo,
  caminoForma,
  caminoSuave,
  conPresion,
  contornoPresion,
  dentroDeMarco,
  desplazarVista,
  elementoEn,
  HERRAMIENTAS_DIBUJO,
  intersectan,
  moverVarios,
  normalizar,
  nuevoId,
  quitar,
  siguienteEtiqueta,
  simplificar,
  tocadosPorBorrador,
  union,
  zoomEn,
  type Caja,
  type Elemento,
  type Forma,
  type Herramienta,
  type Pincel,
  type TextoTrabajo,
  type Vec,
  type Vista,
} from '../modelo';
import type { Pizarra } from '../hooks/use-pizarra';

type Gesto =
  | { tipo: 'pan'; x: number; y: number; vista: Vista }
  | { tipo: 'pinza'; ids: [number, number]; distancia: number; centro: Vec; vista: Vista }
  | { tipo: 'trazo'; pincel: Pincel; puntos: Array<[number, number, number]>; ancla?: string; origen: Vec; id: number }
  | { tipo: 'forma'; forma: Forma['tipo']; desde: Vec; hasta: Vec; ancla?: string; origen: Vec; id: number }
  | { tipo: 'borrar'; ultimo: Vec; ids: Set<string>; id: number }
  | { tipo: 'mover'; inicio: Vec; ids: Set<string>; dx: number; dy: number; id: number }
  | { tipo: 'marco'; inicio: Vec; actual: Vec; id: number; suma: boolean }
  | { tipo: 'toque'; x: number; y: number; bloque: string | null; id: number; suma: boolean; pan: boolean; vista: Vista };

type Editor = { id: string | null; en: Vec; ancla?: string; texto: string; expresion: boolean };

const INTERACTIVO = 'button, a[href], input, select, textarea, label, summary, [role="slider"], [role="tab"], [contenteditable="true"], canvas, .grafico-lienzo svg, .obra-vista, .visor-pdf-pagina, .pizarra-editor';
const reducido = () => typeof window !== 'undefined' && (window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.movimiento === 'reducido');

/** Un elemento de la capa de trabajo en SVG (memorizado: solo se vuelve a pintar si cambia). */
const ElementoSvg = memo(function ElementoSvg({ e }: { e: Elemento }) {
  if (e.tipo === 'texto') return null;
  if (e.tipo === 'imagen') return <image data-el={e.id} href={e.src} x={e.en[0]} y={e.en[1]} width={e.w} height={e.h} opacity={e.estilo.opacidad} preserveAspectRatio="xMidYMid meet" />;
  const comun = { 'data-el': e.id, 'data-tinta': e.estilo.color, opacity: e.estilo.opacidad } as const;
  if (e.tipo === 'trazo') {
    if (e.pincel === 'lapiz' && conPresion(e)) return <path {...comun} className="pz-relleno" d={contornoPresion(e.puntos, e.estilo.grosor)} />;
    return <path {...comun} className={e.pincel === 'resaltador' ? 'pz-trazo pz-resaltador' : 'pz-trazo'} d={caminoSuave(e.puntos)} strokeWidth={e.estilo.grosor} />;
  }
  return <path {...comun} className="pz-trazo" d={caminoForma(e.tipo, e.desde, e.hasta, e.estilo.grosor)} strokeWidth={e.estilo.grosor} />;
});

const TextoVista = memo(function TextoVista({ e, x, y, comentada, alIr }: { e: TextoTrabajo; x: number; y: number; comentada?: string | undefined; alIr?: ((bloqueId: string) => void) | undefined }) {
  const formula = e.expresion ? expresionALatex(e.texto) : null;
  return (
    <div className="pizarra-texto" data-el={e.id} data-tinta={e.estilo.color} style={{ left: x, top: y, fontSize: e.tamano, opacity: e.estilo.opacidad }}>
      <span className="pizarra-etiqueta" aria-hidden="true">
        {e.etiqueta}
      </span>
      {formula?.entendida ? <FormulaSegura latex={formula.latex} /> : <span className="pizarra-texto-plano">{e.texto}</span>}
      {comentada && (
        <button type="button" className="pizarra-comentada" onClick={() => alIr?.(comentada)}>
          El Tutor comentó {e.etiqueta}
        </button>
      )}
    </div>
  );
});

/**
 * Superficie de la pizarra: dos capas en el mismo plano transformado (zoom y desplazamiento comunes). Debajo, el contenido
 * educativo (los bloques, accesibles e interactivos); encima, la capa de trabajo (SVG y textos) con Pointer Events: ratón,
 * dedo y lápiz con presión. El trazo en curso se pinta directo en el DOM (sin renderizar React por cada movimiento) y se
 * confirma al soltar; desplazar y acercar mueven solo la transformación. Con un lápiz óptico, el dedo desplaza.
 */
export function SuperficiePizarra({
  p,
  contenido,
  claveContenido,
  comentadas,
  alIrABloque,
  etiqueta,
  descripcionId,
}: {
  p: Pizarra;
  contenido: ReactNode;
  claveContenido: string;
  comentadas: ReadonlyMap<string, string>;
  alIrABloque: (id: string) => void;
  etiqueta: string;
  descripcionId: string;
}) {
  const superficie = useRef<HTMLDivElement>(null);
  const mundo = useRef<HTMLDivElement>(null);
  const columna = useRef<HTMLDivElement>(null);
  const borradorRef = useRef<SVGPathElement>(null);
  const marcoRef = useRef<SVGRectElement>(null);
  const vista = useRef<Vista>({ x: 0, y: 24, escala: 1 });
  const tocada = useRef(false);
  const gesto = useRef<Gesto | null>(null);
  const punteros = useRef(new Map<number, { x: number; y: number; tipo: string }>());
  const lapizVisto = useRef(false);
  const medidas = useRef(new Map<string, { w: number; h: number }>());
  const [origenes, setOrigenes] = useState<Map<string, Vec>>(new Map());
  const cajasBloques = useRef(new Map<string, Caja>());
  const [editor, setEditorEstado] = useState<Editor | null>(null);
  // El editor se lee desde una referencia: al confirmar con un clic afuera, el «blur» y el clic no lo guardan dos veces.
  const editorVivo = useRef<Editor | null>(null);
  const setEditor = useCallback((e: Editor | null) => {
    editorVivo.current = e;
    setEditorEstado(e);
  }, []);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const pEstable = useRef(p);
  pEstable.current = p;
  const origenesRef = useRef(origenes);
  origenesRef.current = origenes;

  /* ------------------------------------------------------------ vista */
  const marcoEscala = useRef(0);
  const aplicarVista = useCallback((v: Vista, animar = false) => {
    vista.current = v;
    const m = mundo.current;
    const s = superficie.current;
    if (!m || !s) return;
    // Una vista nueva es absoluta: un desplazamiento nativo pendiente (scrollIntoView, foco) ya no cuenta.
    for (const el of [s, s.parentElement]) {
      if (el && (el.scrollTop || el.scrollLeft)) {
        el.scrollTop = 0;
        el.scrollLeft = 0;
      }
    }
    m.style.transition = animar && !reducido() ? 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)' : '';
    m.style.transform = `translate3d(${v.x}px, ${v.y}px, 0) scale(${v.escala})`;
    s.style.setProperty('--fondo-x', `${v.x}px`);
    s.style.setProperty('--fondo-y', `${v.y}px`);
    s.style.setProperty('--fondo-escala', String(v.escala));
    if (!marcoEscala.current)
      marcoEscala.current = requestAnimationFrame(() => {
        marcoEscala.current = 0;
        pEstable.current.setEscala(Math.round(vista.current.escala * 100) / 100);
      });
  }, []);
  const tamano = () => {
    const r = superficie.current?.getBoundingClientRect();
    return { ancho: r?.width ?? 800, alto: r?.height ?? 600, izq: r?.left ?? 0, arriba: r?.top ?? 0 };
  };
  const enPantalla = (cx: number, cy: number) => {
    const t = tamano();
    return [cx - t.izq, cy - t.arriba] as const;
  };
  const enMundo = (cx: number, cy: number): Vec => {
    const [sx, sy] = enPantalla(cx, cy);
    return aMundo(vista.current, sx, sy);
  };

  // Ancho de la columna de contenido según la pantalla (legible en móvil) y vista inicial centrada.
  useLayoutEffect(() => {
    const s = superficie.current;
    const c = columna.current;
    if (!s || !c) return;
    const ajustar = () => {
      const { ancho } = tamano();
      const columnaAncho = Math.max(300, Math.min(760, ancho - (ancho < 640 ? 24 : 96)));
      c.style.setProperty('--ancho-columna', `${columnaAncho}px`);
      if (!tocada.current) aplicarVista({ x: Math.round((ancho - columnaAncho) / 2), y: ancho < 640 ? 12 : 28, escala: 1 });
    };
    ajustar();
    const ro = new ResizeObserver(ajustar);
    ro.observe(s);
    return () => ro.disconnect();
  }, [aplicarVista]);

  // Origen de cada bloque en el mundo (para las anotaciones ancladas) y su caja (para el marco de selección).
  const medir = useCallback(() => {
    const c = columna.current;
    if (!c) return;
    const nuevos = new Map<string, Vec>();
    for (const el of c.querySelectorAll<HTMLElement>('[data-bloque-pz]')) {
      const id = el.dataset.bloquePz!;
      const x = c.offsetLeft + el.offsetLeft;
      const y = c.offsetTop + el.offsetTop;
      nuevos.set(id, [x, y]);
      cajasBloques.current.set(id, { x, y, w: el.offsetWidth, h: el.offsetHeight });
    }
    setOrigenes((v) => (v.size === nuevos.size && [...nuevos].every(([k, [x, y]]) => v.get(k)?.[0] === x && v.get(k)?.[1] === y) ? v : nuevos));
  }, []);
  useLayoutEffect(() => {
    medir();
    const c = columna.current;
    if (!c) return;
    const ro = new ResizeObserver(medir);
    ro.observe(c);
    return () => ro.disconnect();
  }, [medir, claveContenido]);
  // Medida real de los textos (para seleccionarlos y borrarlos con precisión).
  useLayoutEffect(() => {
    for (const el of mundo.current?.querySelectorAll<HTMLElement>('.pizarra-texto[data-el]') ?? []) medidas.current.set(el.dataset.el!, { w: el.offsetWidth, h: el.offsetHeight });
  }, [p.elementos, origenes]);
  // Espacio reservado debajo de cada bloque para el trabajo anclado a él (como en un cuaderno).
  useLayoutEffect(() => {
    const c = columna.current;
    if (!c) return;
    const extension = new Map<string, number>();
    for (const e of p.elementos) {
      if (!e.ancla) continue;
      const k = cajaDe(e, medidas.current);
      extension.set(e.ancla, Math.max(extension.get(e.ancla) ?? 0, k.y + k.h));
    }
    for (const el of c.querySelectorAll<HTMLElement>('[data-bloque-pz]')) {
      const fondo = extension.get(el.dataset.bloquePz!) ?? 0;
      const extra = Math.max(0, Math.ceil(fondo - el.offsetHeight + 16));
      const actual = el.style.marginBlockEnd;
      const nuevo = extra ? `${extra}px` : '';
      if (actual !== nuevo) el.style.marginBlockEnd = nuevo;
    }
  }, [p.elementos, origenes, claveContenido]);

  /* ---------------------------------------------------- controles */
  const centroMundo = useCallback((): Vec => {
    const { ancho, alto } = tamano();
    return aMundo(vista.current, ancho / 2, alto / 2);
  }, []);
  const enfocarCaja = useCallback(
    (caja: Caja | null, maxima = 1.25) => {
      if (!caja) return;
      const { ancho, alto } = tamano();
      tocada.current = true;
      aplicarVista(ajustarA(caja, ancho, alto, 40, maxima), true);
    },
    [aplicarVista],
  );
  useEffect(() => {
    p.controles.current = {
      zoom: (f) => {
        const { ancho, alto } = tamano();
        tocada.current = true;
        aplicarVista(zoomEn(vista.current, f, ancho / 2, alto / 2), true);
      },
      restablecer: () => {
        const { ancho, alto } = tamano();
        aplicarVista(zoomEn(vista.current, 1 / vista.current.escala, ancho / 2, alto / 2), true);
      },
      ajustarTodo: () => {
        const cajas = [...cajasBloques.current.values()];
        for (const e of pEstable.current.elementos) {
          const c = cajaEnMundo(e, origenesRef.current, medidas.current);
          if (c) cajas.push(c);
        }
        enfocarCaja(union(cajas), 1);
      },
      enfocarSeleccion: () => {
        const s = pEstable.current.seleccion;
        const cajas: Caja[] = [];
        for (const id of s.bloques) {
          const c = cajasBloques.current.get(id);
          if (c) cajas.push(c);
        }
        for (const e of pEstable.current.elementos) {
          if (!s.elementos.includes(e.id)) continue;
          const c = cajaEnMundo(e, origenesRef.current, medidas.current);
          if (c) cajas.push(c);
        }
        enfocarCaja(union(cajas), 2);
      },
      enfocarBloque: (id, animar = true) => {
        const c = cajasBloques.current.get(id);
        if (!c) return;
        const { ancho } = tamano();
        const v = vista.current;
        const x = c.x * v.escala + v.x < 0 || (c.x + c.w) * v.escala + v.x > ancho ? Math.round((ancho - c.w * v.escala) / 2 - c.x * v.escala) : v.x;
        tocada.current = true;
        aplicarVista({ ...v, x, y: Math.round(24 - c.y * v.escala) }, animar);
      },
      ajustarBloque: (id) => enfocarCaja(cajasBloques.current.get(id) ?? null, 2),
      centro: centroMundo,
      insertarEnCentro: (h) => {
        const [cx, cy] = centroMundo();
        if (h === 'texto') return setEditor({ id: null, en: [cx - 60, cy - 12], texto: '', expresion: pEstable.current.expresion });
        if (h === 'linea' || h === 'flecha' || h === 'rectangulo' || h === 'circulo') {
          pEstable.current.agregarElementos([{ id: nuevoId(), tipo: h, desde: [cx - 80, cy - 40], hasta: [cx + 80, cy + 40], estilo: pEstable.current.estilo }]);
        }
      },
    };
    return () => {
      p.controles.current = null;
    };
  }, [p.controles, aplicarVista, enfocarCaja, centroMundo]);

  // El navegador puede desplazar la superficie al enfocar o mostrar un elemento (Tab, buscar en la página): ese
  // desplazamiento nativo se convierte en un desplazamiento de la vista, así las dos capas siguen alineadas.
  useEffect(() => {
    const s = superficie.current;
    const area = s?.parentElement;
    if (!s) return;
    const absorber = (el: HTMLElement) => () => {
      const dx = el.scrollLeft;
      const dy = el.scrollTop;
      if (!dx && !dy) return;
      el.scrollLeft = 0;
      el.scrollTop = 0;
      tocada.current = true;
      aplicarVista(desplazarVista(vista.current, -dx, -dy));
    };
    const enSuperficie = absorber(s);
    // El área contiene también la barra y el zoom: su desplazamiento nativo solo se anula, no mueve la vista.
    const enArea = area
      ? () => {
          if (area.scrollTop || area.scrollLeft) {
            area.scrollTop = 0;
            area.scrollLeft = 0;
          }
        }
      : null;
    s.addEventListener('scroll', enSuperficie);
    if (area && enArea) area.addEventListener('scroll', enArea);
    return () => {
      s.removeEventListener('scroll', enSuperficie);
      if (area && enArea) area.removeEventListener('scroll', enArea);
    };
  }, [aplicarVista]);

  /* --------------------------------------------- rueda y teclado */
  useEffect(() => {
    const s = superficie.current;
    if (!s) return;
    const alRodar = (e: WheelEvent) => {
      const [sx, sy] = enPantalla(e.clientX, e.clientY);
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        tocada.current = true;
        aplicarVista(zoomEn(vista.current, Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0025)), sx, sy));
        return;
      }
      // Un elemento con desplazamiento propio (un documento, una tabla ancha) se desplaza primero.
      for (let el = e.target as HTMLElement | null; el && el !== s; el = el.parentElement) {
        const estilo = getComputedStyle(el);
        const puedeY = /(auto|scroll)/.test(estilo.overflowY) && el.scrollHeight > el.clientHeight + 1 && (e.deltaY < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1);
        const puedeX = /(auto|scroll)/.test(estilo.overflowX) && el.scrollWidth > el.clientWidth + 1 && Math.abs(e.deltaX) > Math.abs(e.deltaY);
        if (puedeY || puedeX) return;
      }
      e.preventDefault();
      tocada.current = true;
      const k = e.deltaMode === 1 ? 32 : 1;
      aplicarVista(desplazarVista(vista.current, -(e.shiftKey ? e.deltaY : e.deltaX) * k, -(e.shiftKey ? 0 : e.deltaY) * k));
    };
    s.addEventListener('wheel', alRodar, { passive: false });
    return () => s.removeEventListener('wheel', alRodar);
  }, [aplicarVista]);

  const alTeclado = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== superficie.current) return;
    const paso = e.shiftKey ? 192 : 48;
    const mover: Record<string, Vec> = { ArrowLeft: [paso, 0], ArrowRight: [-paso, 0], ArrowUp: [0, paso], ArrowDown: [0, -paso] };
    if (mover[e.key]) {
      e.preventDefault();
      const ids = new Set(p.seleccion.elementos);
      if (ids.size) {
        const [dx, dy] = mover[e.key]!;
        p.confirmar((els) => moverVarios(els, ids, -dx / 4 / vista.current.escala, -dy / 4 / vista.current.escala));
      } else {
        tocada.current = true;
        aplicarVista(desplazarVista(vista.current, ...mover[e.key]!), true);
      }
    } else if (e.key === 'Enter' && (p.herramienta === 'texto' || ['linea', 'flecha', 'rectangulo', 'circulo'].includes(p.herramienta))) {
      e.preventDefault();
      p.controles.current?.insertarEnCentro(p.herramienta);
    }
  };

  /* ------------------------------------------- foco por teclado */
  // Si el foco entra en algo fuera de la vista (con Tab), la pizarra se desplaza hasta mostrarlo.
  const alEnfocar = (e: React.FocusEvent<HTMLDivElement>) => {
    const s = superficie.current;
    if (!s || e.target === s || !mundo.current?.contains(e.target)) return;
    const r = (e.target as HTMLElement).getBoundingClientRect();
    const b = s.getBoundingClientRect();
    let dx = 0;
    let dy = 0;
    if (r.top < b.top + 8) dy = b.top + 24 - r.top;
    else if (r.bottom > b.bottom - 8) dy = Math.max(b.bottom - 24 - r.bottom, b.top + 24 - r.top);
    if (r.left < b.left + 8) dx = b.left + 24 - r.left;
    else if (r.right > b.right - 8) dx = Math.max(b.right - 24 - r.right, b.left + 24 - r.left);
    if (dx || dy) {
      tocada.current = true;
      aplicarVista(desplazarVista(vista.current, dx, dy));
    }
  };

  /* ------------------------------------------------- punteros */
  const bloqueBajo = (t: EventTarget | null) => ((t as Element | null)?.closest?.('[data-bloque-pz]') as HTMLElement | null)?.dataset.bloquePz ?? null;
  const anclaPara = (pm: Vec): string | null => {
    const col = columna.current;
    if (!col) return null;
    const x0 = col.offsetLeft;
    if (pm[0] < x0 - 48 || pm[0] > x0 + col.offsetWidth + 48) return null;
    let mejor: string | null = null;
    let arriba = -Infinity;
    for (const [id, c] of cajasBloques.current) if (c.y <= pm[1] && c.y > arriba) [mejor, arriba] = [id, c.y];
    return mejor;
  };
  const origenDe = (ancla: string | undefined): Vec => (ancla ? (origenesRef.current.get(ancla) ?? [0, 0]) : [0, 0]);
  const radio = () => 6 / vista.current.escala;
  const nodosDe = (ids: Iterable<string>) => {
    const lista: Element[] = [];
    const m = mundo.current;
    if (!m) return lista;
    for (const id of ids) lista.push(...m.querySelectorAll(`[data-el="${CSS.escape(id)}"]`));
    return lista;
  };
  const pintarBorrador = (d: string, h?: Elemento['estilo'], resaltador = false) => {
    const b = borradorRef.current;
    if (!b) return;
    b.setAttribute('d', d);
    if (h) {
      b.setAttribute('data-tinta', h.color);
      b.setAttribute('stroke-width', String(h.grosor));
      b.setAttribute('opacity', String(h.opacidad));
      b.setAttribute('class', resaltador ? 'pz-trazo pz-resaltador' : 'pz-trazo');
    }
  };

  const empezarPinza = () => {
    const [a, b] = [...punteros.current.entries()];
    if (!a || !b) return;
    // Un trazo empezado con el primer dedo se descarta: dos dedos son para mover y acercar.
    pintarBorrador('');
    gesto.current = { tipo: 'pinza', ids: [a[0], b[0]], distancia: Math.hypot(a[1].x - b[1].x, a[1].y - b[1].y), centro: [(a[1].x + b[1].x) / 2, (a[1].y + b[1].y) / 2], vista: vista.current };
  };

  const alBajar = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = superficie.current!;
    if ((e.target as Element).closest('.pizarra-editor')) return;
    if (e.pointerType === 'pen') lapizVisto.current = true;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY, tipo: e.pointerType });
    if (e.pointerType === 'touch' && punteros.current.size === 2) {
      e.preventDefault();
      e.stopPropagation();
      empezarPinza();
      return;
    }
    if (punteros.current.size > 2) return;
    if (editorVivo.current) {
      confirmarEditor();
      if (p.herramienta === 'texto') {
        e.preventDefault();
        return;
      }
    }
    const pm = enMundo(e.clientX, e.clientY);
    const bloqueDirecto = bloqueBajo(e.target);
    // Lo que se escribe sobre un bloque o debajo de él (en el ancho de la columna) le pertenece: se mueve con él y la
    // pizarra le reserva espacio, así una respuesta nueva nunca cae encima del trabajo.
    const bloque = bloqueDirecto ?? anclaPara(pm);
    const interactivo = !!(e.target as Element).closest(INTERACTIVO);
    let h: Herramienta = p.soloLectura ? 'seleccion' : p.herramienta;
    if (e.button === 1 || h === 'mano' || (e.pointerType === 'touch' && lapizVisto.current && h !== 'seleccion')) h = 'mano';
    if (e.button !== 0 && e.button !== 1 && e.pointerType === 'mouse') return;

    const capturar = () => {
      e.preventDefault();
      e.stopPropagation();
      s.setPointerCapture(e.pointerId);
      // El foco va a la pizarra (atajos y flechas) sin el anillo de foco del teclado.
      s.focus({ preventScroll: true, focusVisible: false } as FocusOptions);
    };

    if (h === 'mano') {
      capturar();
      gesto.current = { tipo: 'pan', x: e.clientX, y: e.clientY, vista: vista.current };
      return;
    }
    if (h === 'seleccion') {
      const tocado = elementoEn(p.elementos, pm, radio(), origenesRef.current, medidas.current);
      if (tocado && !interactivo) {
        capturar();
        const ya = p.seleccion.elementos.includes(tocado.id);
        const ids = e.shiftKey ? (ya ? p.seleccion.elementos.filter((x) => x !== tocado.id) : [...p.seleccion.elementos, tocado.id]) : ya ? p.seleccion.elementos : [tocado.id];
        p.setSeleccion({ elementos: ids, bloques: e.shiftKey ? p.seleccion.bloques : [] });
        gesto.current = { tipo: 'mover', inicio: pm, ids: new Set(ids), dx: 0, dy: 0, id: e.pointerId };
        return;
      }
      if (interactivo) return; // botones, deslizadores, el visor 3D… siguen funcionando
      if (bloqueDirecto) {
        // Toque o clic sobre un bloque: lo elige al soltar sin moverse. Con el dedo, arrastrar desplaza la pizarra;
        // con el ratón, arrastrar selecciona texto como siempre.
        gesto.current = { tipo: 'toque', x: e.clientX, y: e.clientY, bloque: bloqueDirecto, id: e.pointerId, suma: e.shiftKey, pan: e.pointerType === 'touch', vista: vista.current };
        if (e.pointerType === 'touch') s.setPointerCapture(e.pointerId);
        return;
      }
      capturar();
      if (e.pointerType === 'touch') {
        gesto.current = { tipo: 'toque', x: e.clientX, y: e.clientY, bloque: null, id: e.pointerId, suma: false, pan: true, vista: vista.current };
        return;
      }
      gesto.current = { tipo: 'marco', inicio: pm, actual: pm, id: e.pointerId, suma: e.shiftKey };
      return;
    }
    if (h === 'texto') {
      e.preventDefault();
      e.stopPropagation();
      const tocado = elementoEn(p.elementos, pm, radio(), origenesRef.current, medidas.current);
      if (tocado?.tipo === 'texto') {
        const o = origenDe(tocado.ancla);
        setEditor({ id: tocado.id, en: [tocado.en[0] + o[0], tocado.en[1] + o[1]], texto: tocado.texto, expresion: tocado.expresion, ...(tocado.ancla ? { ancla: tocado.ancla } : {}) });
      } else setEditor({ id: null, en: [pm[0], pm[1] - 12], texto: '', expresion: p.expresion, ...(bloque ? { ancla: bloque } : {}) });
      return;
    }
    capturar();
    if (h === 'borrador') {
      const ids = new Set(tocadosPorBorrador(p.elementos, pm, pm, radio() * 2, origenesRef.current, filtroBorrador(), medidas.current));
      for (const n of nodosDe(ids)) n.setAttribute('data-borrando', '');
      gesto.current = { tipo: 'borrar', ultimo: pm, ids, id: e.pointerId };
      return;
    }
    const origen = origenDe(bloque ?? undefined);
    if (h === 'lapiz' || h === 'plumon' || h === 'resaltador') {
      const presion = e.pointerType === 'pen' ? e.pressure || 0.5 : 0.5;
      gesto.current = { tipo: 'trazo', pincel: h, puntos: [[pm[0], pm[1], presion]], ...(bloque ? { ancla: bloque } : {}), origen, id: e.pointerId };
      pintarBorrador(caminoSuave([[pm[0], pm[1]]]), p.estilo, h === 'resaltador');
      return;
    }
    if (h === 'linea' || h === 'flecha' || h === 'rectangulo' || h === 'circulo') {
      gesto.current = { tipo: 'forma', forma: h, desde: pm, hasta: pm, ...(bloque ? { ancla: bloque } : {}), origen, id: e.pointerId };
      pintarBorrador('', p.estilo);
    }
  };

  const filtroBorrador = () => (p.borrador === 'trazos' ? (x: Elemento) => x.tipo === 'trazo' : () => true);

  const alMover = (e: React.PointerEvent<HTMLDivElement>) => {
    const pt = punteros.current.get(e.pointerId);
    if (pt) {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }
    const g = gesto.current;
    if (!g) return;
    if (g.tipo === 'pinza') {
      const a = punteros.current.get(g.ids[0]);
      const b = punteros.current.get(g.ids[1]);
      if (!a || !b) return;
      const distancia = Math.hypot(a.x - b.x, a.y - b.y);
      const centro: Vec = [(a.x + b.x) / 2, (a.y + b.y) / 2];
      const [sx, sy] = enPantalla(...g.centro);
      const movida = desplazarVista(g.vista, centro[0] - g.centro[0], centro[1] - g.centro[1]);
      tocada.current = true;
      aplicarVista(zoomEn(movida, distancia / Math.max(g.distancia, 1), sx + centro[0] - g.centro[0], sy + centro[1] - g.centro[1]));
      return;
    }
    if (g.tipo === 'pan' || (g.tipo === 'toque' && g.pan)) {
      if (g.tipo === 'toque' && Math.hypot(e.clientX - g.x, e.clientY - g.y) < 6) return;
      tocada.current = true;
      aplicarVista(desplazarVista(g.vista, e.clientX - g.x, e.clientY - g.y));
      return;
    }
    if (g.id !== e.pointerId) return;
    const eventos = typeof e.nativeEvent.getCoalescedEvents === 'function' ? e.nativeEvent.getCoalescedEvents() : [e.nativeEvent];
    const ultimo = eventos.at(-1) ?? e.nativeEvent;
    const pm = enMundo(ultimo.clientX, ultimo.clientY);
    switch (g.tipo) {
      case 'trazo': {
        for (const ev of eventos.length ? eventos : [e.nativeEvent]) {
          const q = enMundo(ev.clientX, ev.clientY);
          const prev = g.puntos.at(-1)!;
          if (Math.hypot(q[0] - prev[0], q[1] - prev[1]) * vista.current.escala < 0.75) continue;
          g.puntos.push([q[0], q[1], ev.pointerType === 'pen' ? ev.pressure || 0.5 : 0.5]);
        }
        pintarBorrador(caminoSuave(g.puntos));
        return;
      }
      case 'forma':
        g.hasta = e.shiftKey && (g.forma === 'rectangulo' || g.forma === 'circulo') ? cuadrar(g.desde, pm) : pm;
        pintarBorrador(caminoForma(g.forma, g.desde, g.hasta, p.estilo.grosor));
        return;
      case 'borrar': {
        const nuevos = tocadosPorBorrador(p.elementos, g.ultimo, pm, radio() * 2, origenesRef.current, filtroBorrador(), medidas.current).filter((id) => !g.ids.has(id));
        for (const id of nuevos) g.ids.add(id);
        for (const n of nodosDe(nuevos)) n.setAttribute('data-borrando', '');
        g.ultimo = pm;
        return;
      }
      case 'mover': {
        g.dx = pm[0] - g.inicio[0];
        g.dy = pm[1] - g.inicio[1];
        for (const n of nodosDe(g.ids)) {
          if (n instanceof HTMLElement) n.style.translate = `${g.dx}px ${g.dy}px`;
          else n.setAttribute('transform', `translate(${g.dx} ${g.dy})`);
        }
        return;
      }
      case 'marco': {
        g.actual = pm;
        const c = normalizar(g.inicio, pm);
        const r = marcoRef.current;
        if (r) {
          r.setAttribute('x', String(c.x));
          r.setAttribute('y', String(c.y));
          r.setAttribute('width', String(c.w));
          r.setAttribute('height', String(c.h));
          r.style.display = '';
        }
        return;
      }
      default:
    }
  };

  const terminar = (e: React.PointerEvent<HTMLDivElement>, cancelado = false) => {
    punteros.current.delete(e.pointerId);
    const g = gesto.current;
    if (!g) return;
    if (g.tipo === 'pinza') {
      if (!g.ids.includes(e.pointerId)) return;
      gesto.current = null;
      // El dedo que queda sigue desplazando.
      const [resto] = [...punteros.current.entries()];
      if (resto && resto[1].tipo === 'touch') gesto.current = { tipo: 'pan', x: resto[1].x, y: resto[1].y, vista: vista.current };
      return;
    }
    if (g.tipo !== 'pan' && 'id' in g && g.id !== e.pointerId) return;
    gesto.current = null;
    pintarBorrador('');
    if (cancelado) {
      if (g.tipo === 'borrar') for (const n of nodosDe(g.ids)) n.removeAttribute('data-borrando');
      if (g.tipo === 'mover') for (const n of nodosDe(g.ids)) {
          if (n instanceof HTMLElement) n.style.removeProperty('translate');
          else n.removeAttribute('transform');
        }
      if (marcoRef.current) marcoRef.current.style.display = 'none';
      return;
    }
    switch (g.tipo) {
      case 'trazo': {
        if (g.puntos.length === 1) g.puntos.push([g.puntos[0]![0] + 0.01, g.puntos[0]![1], g.puntos[0]![2]]);
        const puntos = simplificar(g.puntos, 0.35 / vista.current.escala).map(([x, y, pr]) => [x - g.origen[0], y - g.origen[1], pr] as [number, number, number]);
        p.agregarElementos([{ id: nuevoId(), tipo: 'trazo', pincel: g.pincel, puntos, estilo: p.estilo, ...(g.ancla ? { ancla: g.ancla } : {}) }]);
        return;
      }
      case 'forma': {
        const c = normalizar(g.desde, g.hasta);
        if (Math.max(c.w, c.h) * vista.current.escala < 4) return;
        const desplazar = (v: Vec): Vec => [v[0] - g.origen[0], v[1] - g.origen[1]];
        p.agregarElementos([{ id: nuevoId(), tipo: g.forma, desde: desplazar(g.desde), hasta: desplazar(g.hasta), estilo: p.estilo, ...(g.ancla ? { ancla: g.ancla } : {}) }]);
        return;
      }
      case 'borrar':
        if (g.ids.size) p.confirmar((els) => quitar(els, g.ids));
        return;
      case 'mover':
        for (const n of nodosDe(g.ids)) {
          if (n instanceof HTMLElement) n.style.removeProperty('translate');
          else n.removeAttribute('transform');
        }
        if (Math.hypot(g.dx, g.dy) * vista.current.escala > 1) p.confirmar((els) => moverVarios(els, g.ids, g.dx, g.dy));
        return;
      case 'marco': {
        if (marcoRef.current) marcoRef.current.style.display = 'none';
        const marco = normalizar(g.inicio, g.actual);
        if (Math.max(marco.w, marco.h) * vista.current.escala < 4) {
          if (!g.suma) p.limpiarSeleccion();
          return;
        }
        const elementos = dentroDeMarco(p.elementos, marco, origenesRef.current, medidas.current).map((x) => x.id);
        const bloques = [...cajasBloques.current].filter(([, c]) => intersectan(c, marco)).map(([id]) => id);
        p.setSeleccion(g.suma ? { elementos: [...new Set([...p.seleccion.elementos, ...elementos])], bloques: [...new Set([...p.seleccion.bloques, ...bloques])] } : { elementos, bloques });
        return;
      }
      case 'toque': {
        if (Math.hypot(e.clientX - g.x, e.clientY - g.y) >= 6) return;
        if (!g.bloque) return p.limpiarSeleccion();
        // Un clic que termina una selección de texto no elige el bloque.
        if (e.pointerType === 'mouse' && !window.getSelection()?.isCollapsed) return;
        const ya = p.seleccion.bloques.includes(g.bloque);
        p.setSeleccion(g.suma ? { ...p.seleccion, bloques: ya ? p.seleccion.bloques.filter((x) => x !== g.bloque) : [...p.seleccion.bloques, g.bloque] } : { elementos: [], bloques: ya && p.seleccion.bloques.length === 1 ? [] : [g.bloque] });
        return;
      }
      default:
    }
  };

  /* ----------------------------------------------- editor de texto */
  useEffect(() => {
    if (editor) requestAnimationFrame(() => editorRef.current?.focus());
  }, [editor?.id, editor?.en]);

  function confirmarEditor(cancelar = false) {
    const ed = editorVivo.current;
    setEditor(null);
    if (!ed || cancelar) return;
    const texto = ed.texto.trim();
    const o = origenDe(ed.ancla);
    if (ed.id) {
      const id = ed.id;
      p.confirmar((els) => (texto ? els.map((x) => (x.id === id && x.tipo === 'texto' ? { ...x, texto: texto.slice(0, 400), expresion: ed.expresion } : x)) : quitar(els, [id])));
      return;
    }
    if (!texto) return;
    p.agregarElementos([{ id: nuevoId(), tipo: 'texto', en: [ed.en[0] - o[0], ed.en[1] - o[1]], texto, expresion: ed.expresion, tamano: 20, etiqueta: siguienteEtiqueta(p.elementos), estilo: p.estilo, ...(ed.ancla ? { ancla: ed.ancla } : {}) }]);
  }

  /* ------------------------------------------------------ render */
  const libres: Elemento[] = [];
  const porBloque = new Map<string, Elemento[]>();
  for (const e of p.elementos) {
    if (!e.ancla) libres.push(e);
    else if (origenes.has(e.ancla)) porBloque.set(e.ancla, [...(porBloque.get(e.ancla) ?? []), e]);
  }
  const editando = editor?.id ?? null;
  const textos = p.elementos.filter((e): e is TextoTrabajo => e.tipo === 'texto' && e.id !== editando && (!e.ancla || origenes.has(e.ancla)));
  const elegidos = p.elementos.filter((e) => p.seleccion.elementos.includes(e.id));

  return (
    <div
      ref={superficie}
      className="pizarra"
      data-fondo={p.fondo}
      data-herramienta={p.soloLectura ? 'seleccion' : p.herramienta}
      data-dibujo={HERRAMIENTAS_DIBUJO.has(p.herramienta) || p.herramienta === 'borrador' || undefined}
      role="region"
      aria-label={etiqueta}
      aria-describedby={descripcionId}
      tabIndex={0}
      onPointerDownCapture={alBajar}
      onPointerMove={alMover}
      onPointerUp={(e) => terminar(e)}
      onPointerCancel={(e) => terminar(e, true)}
      onContextMenu={(e) => {
        if (gesto.current && gesto.current.tipo !== 'toque') e.preventDefault();
      }}
      onDoubleClick={(e) => {
        if (p.herramienta !== 'seleccion') return;
        const tocado = elementoEn(p.elementos, enMundo(e.clientX, e.clientY), radio(), origenesRef.current, medidas.current);
        if (tocado?.tipo !== 'texto') return;
        const o = origenDe(tocado.ancla);
        setEditor({ id: tocado.id, en: [tocado.en[0] + o[0], tocado.en[1] + o[1]], texto: tocado.texto, expresion: tocado.expresion, ...(tocado.ancla ? { ancla: tocado.ancla } : {}) });
      }}
      onKeyDown={alTeclado}
      onFocus={alEnfocar}
    >
      <div ref={mundo} className="pizarra-mundo">
        <div ref={columna} className="pizarra-columna">
          {contenido}
        </div>
        <svg className="pizarra-trabajo" width="1" height="1" aria-hidden="true">
          <g data-capa="trabajo">
            {libres.map((e) => (
              <ElementoSvg key={e.id} e={e} />
            ))}
          </g>
          {[...porBloque].map(([ancla, lista]) => {
            const o = origenes.get(ancla)!;
            return (
              <g key={ancla} data-capa="anotaciones" transform={`translate(${o[0]} ${o[1]})`}>
                {lista.map((e) => (
                  <ElementoSvg key={e.id} e={e} />
                ))}
              </g>
            );
          })}
          <g className="pz-seleccion">
            {elegidos.map((e) => {
              const c = cajaEnMundo(e, origenes, medidas.current);
              return c ? <rect key={e.id} x={c.x - 4} y={c.y - 4} width={c.w + 8} height={c.h + 8} rx="4" /> : null;
            })}
          </g>
          <path ref={borradorRef} className="pz-trazo" d="" />
          <rect ref={marcoRef} className="pz-marco" style={{ display: 'none' }} />
        </svg>
        <div className="pizarra-textos">
          {textos.map((e) => {
            const o = e.ancla ? origenes.get(e.ancla)! : ([0, 0] as const);
            return <TextoVista key={e.id} e={e} x={e.en[0] + o[0]} y={e.en[1] + o[1]} comentada={comentadas.get(e.etiqueta)} alIr={alIrABloque} />;
          })}
        </div>
        {editor && (
          <div className="pizarra-editor" style={{ left: editor.en[0], top: editor.en[1] }}>
            <label className="visually-hidden" htmlFor="pizarra-editor-campo">
              {editor.expresion ? 'Expresión matemática (por ejemplo, 2x + 3 = 7)' : 'Texto en la pizarra'}
            </label>
            <textarea
              id="pizarra-editor-campo"
              ref={editorRef}
              value={editor.texto}
              rows={Math.max(1, editor.texto.split('\n').length)}
              maxLength={400}
              spellCheck={!editor.expresion}
              placeholder={editor.expresion ? '2x + 3 = 7' : 'Escribe aquí'}
              onChange={(e) => setEditor({ ...editor, texto: e.target.value })}
              onBlur={() => confirmarEditor()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Escape') {
                  e.preventDefault();
                  confirmarEditor(true);
                } else if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  confirmarEditor();
                }
              }}
            />
            <span className="pizarra-editor-ayuda">{editor.expresion ? 'Expresión · Enter guarda · Mayús + Enter, otra línea' : 'Texto · Enter guarda · Esc cancela'}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function cuadrar(desde: Vec, hasta: Vec): Vec {
  const lado = Math.max(Math.abs(hasta[0] - desde[0]), Math.abs(hasta[1] - desde[1]));
  return [desde[0] + Math.sign(hasta[0] - desde[0] || 1) * lado, desde[1] + Math.sign(hasta[1] - desde[1] || 1) * lado];
}
