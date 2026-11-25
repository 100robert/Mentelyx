'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { EstadoSesion } from '@/features/auth';
import { Icono } from '@/components/ui/iconos';
import { Marca } from '@/components/ui/marca';

const ENLACES = [
  { href: '/planes', texto: 'Planes' },
  { href: '/biblioteca', texto: 'Biblioteca' },
  { href: '/espacios', texto: 'Mis espacios' },
];

/** Cabecera de las páginas públicas: una línea en escritorio; menú desplegable por debajo de 60 rem. */
export function CabeceraPublica() {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const [desplazada, setDesplazada] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const sobrePortada = ruta === '/';
  useEffect(() => setAbierto(false), [ruta]);
  // Sobre la portada la cabecera es transparente; al desplazar pasa a la superficie blanca.
  useEffect(() => {
    if (!sobrePortada) return;
    const medir = () => setDesplazada(window.scrollY > 24);
    medir();
    window.addEventListener('scroll', medir, { passive: true });
    return () => window.removeEventListener('scroll', medir);
  }, [sobrePortada]);
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto]);

  return (
    <header className="cabecera" data-portada={(sobrePortada && !desplazada && !abierto) || undefined}>
      <div className="cabecera-fila contenedor">
        <Marca />
        <nav aria-label="Principal" className="cabecera-nav" id="menu-publico" data-abierto={abierto || undefined}>
          <ul>
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link href={e.href} aria-current={ruta === e.href ? 'page' : undefined}>
                  {e.texto}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="cabecera-sesion">
          <EstadoSesion />
          <button
            ref={boton}
            type="button"
            className="boton-icono solo-movil-publico"
            aria-expanded={abierto}
            aria-controls="menu-publico"
            onClick={() => setAbierto((a) => !a)}
          >
            <Icono nombre={abierto ? 'cerrar' : 'menu'} />
            <span className="visually-hidden">{abierto ? 'Cerrar menú' : 'Abrir menú'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

/** Pie de las páginas públicas: la marca sobre los enlaces y la descripción del producto. */
export function PiePublico() {
  return (
    <footer className="pie">
      <div className="pie-fila contenedor">
        <Marca />
        <ul className="pie-enlaces">
          <li>
            <Link href="/planes">Planes</Link>
          </li>
          <li>
            <Link href="/biblioteca">Biblioteca pública</Link>
          </li>
          <li>
            <Link href="/auth/ingresar">Ingresar</Link>
          </li>
        </ul>
        <p className="pie-nota">Aprendizaje con fuentes propias y un Tutor que cita lo que usa.</p>
      </div>
    </footer>
  );
}
