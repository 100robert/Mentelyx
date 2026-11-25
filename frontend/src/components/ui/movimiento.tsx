'use client';

import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Apariciones al desplazar: marca con `data-visible` los elementos `[data-aparece]` cuando entran en pantalla.
 * El contenido es visible sin JavaScript y con movimiento reducido: el estado oculto solo existe bajo `.js` (ver CSS).
 */
export function Revelador() {
  useEffect(() => {
    const elementos = document.querySelectorAll<HTMLElement>('[data-aparece]:not([data-visible])');
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      elementos.forEach((e) => e.setAttribute('data-visible', ''));
      return;
    }
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (!entrada.isIntersecting) continue;
          entrada.target.setAttribute('data-visible', '');
          observador.unobserve(entrada.target);
        }
      },
      { rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    );
    elementos.forEach((e) => observador.observe(e));
    return () => observador.disconnect();
  });
  return null;
}

/**
 * Inclinación sutil del búho siguiendo al puntero (solo con puntero fino y sin movimiento reducido).
 * Responde a la persona; no es una animación en bucle.
 */
export function Inclinable({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const nodo = ref.current;
    const zona = nodo?.closest('section');
    if (!nodo || !zona) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let marco = 0;
    const mover = (e: PointerEvent) => {
      cancelAnimationFrame(marco);
      marco = requestAnimationFrame(() => {
        const r = zona.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        nodo.style.transform = `perspective(1200px) rotateY(${(x * 8).toFixed(2)}deg) rotateX(${(-y * 6).toFixed(2)}deg)`;
      });
    };
    const salir = () => {
      cancelAnimationFrame(marco);
      nodo.style.transform = '';
    };
    zona.addEventListener('pointermove', mover);
    zona.addEventListener('pointerleave', salir);
    return () => {
      cancelAnimationFrame(marco);
      zona.removeEventListener('pointermove', mover);
      zona.removeEventListener('pointerleave', salir);
    };
  }, []);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
