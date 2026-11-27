'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/iconos';

export type Accion = { texto: string; icono: NombreIcono; alElegir: () => void; peligrosa?: boolean };

/**
 * Menú contextual con el patrón de botón de menú (WAI-ARIA): Intro, espacio o flecha abajo lo abren con el foco en la
 * primera opción; las flechas recorren las opciones; Esc o un clic fuera lo cierran y devuelven el foco al botón.
 */
export function MenuAcciones({ etiqueta, acciones }: { etiqueta: string; acciones: Accion[] }) {
  const [abierto, setAbierto] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLUListElement>(null);
  const id = useId();

  const opciones = () => Array.from(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? []);
  const cerrar = (devolverFoco = true) => {
    setAbierto(false);
    if (devolverFoco) boton.current?.focus();
  };

  useEffect(() => {
    if (!abierto) return;
    opciones()[0]?.focus();
    const fuera = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !boton.current?.contains(e.target as Node)) cerrar(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [abierto]);

  return (
    <div className="menu-acciones">
      <button
        ref={boton}
        type="button"
        className="boton-icono"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls={abierto ? id : undefined}
        onClick={() => setAbierto((a) => !a)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setAbierto(true);
          }
        }}
      >
        <Icono nombre="opciones" />
        <span className="visually-hidden">{etiqueta}</span>
      </button>
      {abierto && (
        <ul
          ref={menu}
          id={id}
          role="menu"
          aria-label={etiqueta}
          className="menu-lista"
          onKeyDown={(e) => {
            const lista = opciones();
            const i = lista.indexOf(document.activeElement as HTMLButtonElement);
            if (e.key === 'ArrowDown') lista[(i + 1) % lista.length]?.focus();
            else if (e.key === 'ArrowUp') lista[(i - 1 + lista.length) % lista.length]?.focus();
            else if (e.key === 'Home') lista[0]?.focus();
            else if (e.key === 'End') lista[lista.length - 1]?.focus();
            else if (e.key === 'Escape' || e.key === 'Tab') {
              if (e.key === 'Escape') e.preventDefault();
              cerrar(e.key === 'Escape');
              return;
            } else return;
            e.preventDefault();
          }}
        >
          {acciones.map((a) => (
            <li key={a.texto} role="none">
              <button
                type="button"
                role="menuitem"
                tabIndex={-1}
                className={a.peligrosa ? 'menu-opcion menu-opcion-peligrosa' : 'menu-opcion'}
                onClick={() => {
                  // El foco vuelve al botón del menú: así el diálogo que se abra lo devuelve ahí al cerrarse.
                  cerrar(true);
                  a.alElegir();
                }}
              >
                <Icono nombre={a.icono} tamano={18} />
                {a.texto}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
