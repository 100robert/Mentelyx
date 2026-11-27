import './acceso.css';
import Link from 'next/link';
import { Suspense, type ReactNode } from 'react';
import { LogoCompleto } from '@/components/ui/marca';
import { ZonaVisual, ZonaVisualGeneral } from './zona-visual';

/**
 * Marco del acceso (iniciar sesión y crear cuenta). En escritorio, dos zonas sobre la retícula: el formulario (5 columnas,
 * sobre blanco) y una zona azul marino que recuerda para qué se entra (7 columnas). En móvil manda el formulario y la
 * zona visual no se muestra. Sin tarjeta flotante ni degradados: superficies planas de la marca.
 */
export function MarcoAcceso({ children }: { children: ReactNode }) {
  return (
    <div className="acceso">
      <main id="principal" className="acceso-zona-formulario" tabIndex={-1}>
        <div className="acceso-columna">
          <Link href="/" className="acceso-logo" aria-label="Mentelyx, inicio">
            <LogoCompleto tamano={88} />
          </Link>
          <div className="acceso-tarea">{children}</div>
          <p className="acceso-pie">
            <Link href="/">Volver al inicio</Link>
          </p>
        </div>
      </main>
      <aside className="acceso-zona-visual" aria-label="Mentelyx">
        <Suspense fallback={<ZonaVisualGeneral />}>
          <ZonaVisual />
        </Suspense>
      </aside>
    </div>
  );
}
