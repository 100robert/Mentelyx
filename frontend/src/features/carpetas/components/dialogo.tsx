'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Diálogo modal nativo (`<dialog>` con `showModal`): atrapa el foco, se cierra con Esc y devuelve el foco al elemento
 * que lo abrió. El contenido decide su primer foco con `autoFocus`.
 */
export function Dialogo({ abierto, titulo, descripcion, alCerrar, children }: { abierto: boolean; titulo: string; descripcion?: string | undefined; alCerrar: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const origen = useRef<HTMLElement | null>(null);
  const id = useId();

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) {
      origen.current = document.activeElement as HTMLElement | null;
      d.showModal();
    } else if (!abierto && d.open) {
      d.close();
    }
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="dialogo"
      aria-labelledby={`${id}-titulo`}
      aria-describedby={descripcion ? `${id}-descripcion` : undefined}
      onClose={() => {
        alCerrar();
        origen.current?.focus();
      }}
    >
      <h2 id={`${id}-titulo`} className="dialogo-titulo">
        {titulo}
      </h2>
      {descripcion && (
        <p id={`${id}-descripcion`} className="dialogo-descripcion">
          {descripcion}
        </p>
      )}
      {abierto && children}
    </dialog>
  );
}
