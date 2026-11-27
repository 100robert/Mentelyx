'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useSesion } from '@/features/auth';
import { Icono } from '@/components/ui/iconos';
import { Marca } from '@/components/ui/marca';

/** Secciones de la landing (anclas absolutas para que funcionen desde cualquier página pública) y los planes. */
const ENLACES = [
  { href: '/#aprendizaje', texto: 'Aprendizaje' },
  { href: '/#como-funciona', texto: 'Cómo funciona' },
  { href: '/#examenes', texto: 'Preparación de exámenes' },
  { href: '/planes', texto: 'Planes' },
];

/**
 * Cabecera pública alineada a la retícula: transparente sobre el hero y, al desplazar, sobre la superficie blanca.
 * Por debajo de 60 rem, la navegación pasa a un menú desplegable (Esc lo cierra y devuelve el foco al botón).
 */
export function CabeceraPublica() {
  const ruta = usePathname();
  const { conSesion, saliendo, prepararSalida, salir } = useSesion();
  const [abierto, setAbierto] = useState(false);
  const [desplazada, setDesplazada] = useState(false);
  const boton = useRef<HTMLButtonElement>(null);
  const sobrePortada = ruta === '/';
  useEffect(() => setAbierto(false), [ruta]);
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

  const cerrarMenu = () => setAbierto(false);
  const botonSalir = (clase: string) => (
    <button type="button" className={clase} aria-busy={saliendo} onClickCapture={prepararSalida} onClick={salir}>
      {saliendo ? 'Saliendo…' : 'Salir'}
    </button>
  );

  return (
    <header className="cabecera" data-portada={(sobrePortada && !desplazada && !abierto) || undefined}>
      <div className="marco cabecera-fila">
        <Marca />
        <nav aria-label="Principal" className="cabecera-nav" id="menu-publico" data-abierto={abierto || undefined}>
          <ul>
            {ENLACES.map((e) => (
              <li key={e.href}>
                <Link href={e.href} aria-current={ruta === e.href ? 'page' : undefined} onClick={cerrarMenu}>
                  {e.texto}
                </Link>
              </li>
            ))}
            {conSesion === false && (
              <li className="solo-menu">
                <Link href="/auth/ingresar" onClick={cerrarMenu}>
                  Iniciar sesión
                </Link>
              </li>
            )}
            {conSesion && <li className="solo-menu">{botonSalir('cabecera-nav-boton')}</li>}
          </ul>
        </nav>
        <div className="cabecera-sesion">
          {conSesion === null && <span aria-hidden="true" className="sesion-reserva" />}
          {conSesion === false && (
            <>
              <Link href="/auth/ingresar" className="enlace-sesion fuera-menu">
                Iniciar sesión
              </Link>
              <Link href="/auth/registro" className="boton boton-primario boton-chico">
                Comenzar
              </Link>
            </>
          )}
          {conSesion && (
            <>
              <Link href="/inicio" className="boton boton-primario boton-chico">
                Mi inicio
              </Link>
              <span className="fuera-menu">{botonSalir('enlace-sesion')}</span>
            </>
          )}
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

const GRUPOS_PIE = [
  {
    titulo: 'Producto',
    enlaces: [
      { href: '/#aprendizaje', texto: 'Aprendizaje' },
      { href: '/#examenes', texto: 'Preparación de exámenes' },
      { href: '/#como-funciona', texto: 'Cómo funciona' },
      { href: '/planes', texto: 'Planes' },
    ],
  },
  {
    titulo: 'Cuenta',
    enlaces: [
      { href: '/auth/ingresar', texto: 'Iniciar sesión' },
      { href: '/auth/registro', texto: 'Crear cuenta' },
    ],
  },
];

/** Pie público alineado a la retícula: marca, navegación por grupos y créditos de los recursos usados en la landing. */
export function PiePublico() {
  return (
    <footer className="pie">
      <div className="marco reticula pie-reticula">
        <div className="pie-marca">
          <Marca />
          <p>Mentelyx convierte la curiosidad en experiencias de aprendizaje interactivas.</p>
        </div>
        {GRUPOS_PIE.map((g) => (
          <nav key={g.titulo} className="pie-grupo" aria-label={g.titulo}>
            <h2 className="pie-titulo">{g.titulo}</h2>
            <ul>
              {g.enlaces.map((e) => (
                <li key={e.href}>
                  <Link href={e.href}>{e.texto}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
        <div className="pie-creditos">
          <h2 className="pie-titulo">Créditos de recursos</h2>
          <p>
            Ilustraciones, diagramas y modelo 3D: elaboración propia de Mentelyx. «La gran ola de Kanagawa», de Katsushika Hokusai: The
            Metropolitan Museum of Art, dominio público (CC0). Tipografías Lexend y Source Serif 4, con licencia SIL Open Font License.
          </p>
        </div>
        <p className="pie-legal">
          © 2026 Mentelyx · <Link href="/privacidad">Privacidad</Link> · <Link href="/terminos">Términos</Link> · <Link href="/accesibilidad">Accesibilidad</Link> ·{' '}
          <Link href="/creditos">Créditos y licencias</Link>
        </p>
      </div>
    </footer>
  );
}
