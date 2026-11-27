'use client';

import { lazy, Suspense, type ComponentType } from 'react';

/**
 * Hidratación por proximidad. En el servidor cada isla se renderiza completa (HTML legible e indexable). En el navegador,
 * React deja ese HTML tal cual —sin descargar ni ejecutar el código de la isla— hasta que el contenedor se acerca a la
 * pantalla; entonces importa el componente y lo hidrata. Así la lógica de las secciones inferiores no compite con el hero.
 * Se apoya en el comportamiento documentado de React: un componente `lazy` pendiente dentro de un `Suspense` conserva el
 * HTML del servidor y se hidrata cuando su código está disponible.
 */
function cuandoCerca(id: string, margen: string): Promise<void> {
  return new Promise((resolver) => {
    const nodo = document.querySelector(`[data-isla="${id}"]`);
    if (!nodo || !('IntersectionObserver' in window)) return resolver();
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        observador.disconnect();
        resolver();
      },
      { rootMargin: margen },
    );
    observador.observe(nodo);
  });
}

function crearIsla<P extends object>(id: string, cargar: () => Promise<ComponentType<P>>, margen = '150% 0px') {
  const Perezoso = lazy(async () => ({
    default: typeof window === 'undefined' ? await cargar() : await cuandoCerca(id, margen).then(cargar),
  }));
  function Isla(props: P) {
    return (
      <div data-isla={id} className="isla">
        <Suspense fallback={null}>
          <Perezoso {...props} />
        </Suspense>
      </div>
    );
  }
  Isla.displayName = `Isla(${id})`;
  return Isla;
}

export const IslaPreguntas = crearIsla('preguntas', () => import('./recorrido-preguntas').then((m) => m.RecorridoPreguntas));
export const IslaPizarra = crearIsla('pizarra', () => import('./pizarra-derivada').then((m) => m.PizarraDerivada));
export const IslaMotor = crearIsla('motor', () => import('./motor-recorrido').then((m) => m.MotorRecorrido), '200% 0px');
export const IslaExamenes = crearIsla('examenes', () => import('./examenes').then((m) => m.Examenes));
export const IslaComoFunciona = crearIsla('como-funciona', () => import('./como-funciona').then((m) => m.ComoFunciona));
