'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** Estado de un recorrido narrativo: el paso activo, el avance de cada paso (0 a 1) y el avance de toda la sección. */
export type EstadoRecorrido = { activo: number; progresos: number[]; total: number; reducido: boolean };
export type Suscribir = (oyente: (estado: EstadoRecorrido) => void) => () => void;

const limitar = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/**
 * Recorrido vinculado al desplazamiento, sin bibliotecas y sin secuestrar el scroll: la página se desplaza con normalidad y
 * este hook solo mide. Cada elemento `[data-paso]` dentro del contenedor es un paso; el activo es el último cuyo borde
 * superior cruzó la línea de lectura (`linea`, fracción de la altura de la ventana, distinta en móvil y escritorio).
 *
 * - Escribe `--p` (avance local) en cada paso y `--p`, `--total` y `data-activo` en el contenedor, para el CSS.
 * - Notifica a los suscriptores en cada fotograma con cambios (las escenas SVG y 3D se actualizan sin renderizar React).
 * - Solo escucha el scroll mientras la sección está cerca de la pantalla.
 * - Con `prefers-reduced-motion`, cada paso queda en su estado representativo (avance 1): sin interpolaciones.
 */
export function useRecorrido(contenedor: RefObject<HTMLElement | null>, { linea = 0.5, lineaMovil = 0.72 } = {}) {
  const [activo, setActivo] = useState(0);
  const oyentes = useRef(new Set<(e: EstadoRecorrido) => void>());
  const estado = useRef<EstadoRecorrido>({ activo: 0, progresos: [], total: 0, reducido: false });

  useEffect(() => {
    const raiz = contenedor.current;
    if (!raiz) return;
    const pasos = Array.from(raiz.querySelectorAll<HTMLElement>('[data-paso]'));
    if (pasos.length === 0) return;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)');
    const escritorio = window.matchMedia('(min-width: 64rem)');
    let marco = 0;

    const medir = () => {
      marco = 0;
      const y = window.innerHeight * (escritorio.matches ? linea : lineaMovil);
      const progresos = pasos.map((p) => {
        const r = p.getBoundingClientRect();
        return limitar((y - r.top) / Math.max(r.height, 1));
      });
      let i = 0;
      for (let k = 0; k < pasos.length; k++) if (pasos[k]!.getBoundingClientRect().top <= y) i = k;
      const rr = raiz.getBoundingClientRect();
      const total = limitar((y - rr.top) / Math.max(rr.height, 1));
      const quieto = reducido.matches;
      const finales = quieto ? progresos.map((_, k) => (k <= i ? 1 : 0)) : progresos;

      finales.forEach((v, k) => pasos[k]!.style.setProperty('--p', v.toFixed(4)));
      raiz.style.setProperty('--p', (finales[i] ?? 0).toFixed(4));
      raiz.style.setProperty('--total', (quieto ? (total > 0 ? 1 : 0) : total).toFixed(4));
      if (raiz.dataset.activo !== String(i)) {
        raiz.dataset.activo = String(i);
        pasos.forEach((p, k) => p.toggleAttribute('data-activo', k === i));
        setActivo(i);
      }
      estado.current = { activo: i, progresos: finales, total, reducido: quieto };
      oyentes.current.forEach((f) => f(estado.current));
    };
    const pedir = () => {
      if (!marco) marco = requestAnimationFrame(medir);
    };

    let escuchando = false;
    const observador = new IntersectionObserver(
      ([entrada]) => {
        if (entrada?.isIntersecting && !escuchando) {
          window.addEventListener('scroll', pedir, { passive: true });
          escuchando = true;
          pedir();
        } else if (!entrada?.isIntersecting && escuchando) {
          window.removeEventListener('scroll', pedir);
          escuchando = false;
          pedir();
        }
      },
      { rootMargin: '30% 0px 30% 0px' },
    );
    observador.observe(raiz);
    window.addEventListener('resize', pedir);
    reducido.addEventListener('change', pedir);
    escritorio.addEventListener('change', pedir);
    raiz.classList.add('recorrido-activo');
    medir();

    return () => {
      cancelAnimationFrame(marco);
      observador.disconnect();
      window.removeEventListener('scroll', pedir);
      window.removeEventListener('resize', pedir);
      reducido.removeEventListener('change', pedir);
      escritorio.removeEventListener('change', pedir);
    };
  }, [contenedor, linea, lineaMovil]);

  const suscribir = useCallback<Suscribir>((oyente) => {
    oyentes.current.add(oyente);
    oyente(estado.current);
    return () => {
      oyentes.current.delete(oyente);
    };
  }, []);

  return { activo, suscribir };
}

/** Avance de un tramo [desde, hasta] dentro de un progreso 0–1, ya limitado. */
export function tramo(p: number, desde: number, hasta: number) {
  return limitar((p - desde) / (hasta - desde));
}

/** Formato numérico de la página (coma decimal, como el resto de Mentelyx). */
export function decimal(n: number, cifras = 1) {
  return n.toFixed(cifras).replace('.', ',');
}
