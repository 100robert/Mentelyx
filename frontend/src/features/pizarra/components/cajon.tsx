'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { Icono } from '@/components/ui/iconos';

/**
 * Panel secundario bajo demanda (cerrado por omisión): a la derecha en escritorio y tableta, como hoja inferior en móvil.
 * Recibe el foco al abrirse, se cierra con Esc o con su botón y devuelve el foco a quien lo abrió.
 */
export function Cajon({ id, titulo, abierto, alCerrar, children, acciones }: { id: string; titulo: string; abierto: boolean; alCerrar: () => void; children: ReactNode; acciones?: ReactNode }) {
  const encabezado = useRef<HTMLHeadingElement>(null);
  const previo = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (!abierto) return;
    previo.current = document.activeElement as HTMLElement | null;
    requestAnimationFrame(() => encabezado.current?.focus());
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLElement && e.target.closest('.pz-menu'))) {
        e.preventDefault();
        alCerrar();
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => {
      document.removeEventListener('keydown', alPulsar);
      if (previo.current?.isConnected) previo.current.focus({ preventScroll: true });
    };
  }, [abierto, alCerrar]);
  if (!abierto) return null;
  return (
    <>
      <button type="button" className="pz-velo" tabIndex={-1} aria-hidden="true" onClick={alCerrar} />
      <aside id={id} className="pz-cajon" aria-labelledby={`${id}-titulo`}>
        <header className="pz-cajon-cabecera">
          <h2 id={`${id}-titulo`} ref={encabezado} tabIndex={-1}>
            {titulo}
          </h2>
          {acciones}
          <button type="button" className="boton-icono" onClick={alCerrar}>
            <Icono nombre="cerrar" />
            <span className="visually-hidden">Cerrar {titulo.toLowerCase()}</span>
          </button>
        </header>
        <div className="pz-cajon-cuerpo">{children}</div>
      </aside>
    </>
  );
}
