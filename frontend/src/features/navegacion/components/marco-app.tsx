'use client';

import { migasDeRuta } from '../migas';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Buscador } from './buscador';
import { EstadoSesion } from '@/features/auth';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import { Marca } from '@/components/ui/marca';

export type EspacioMenu = { id: string; titulo: string };

// Navegación de Mentelyx V1 (ADR-093): los dos módulos principales, separados, y lo que comparten.
const ESTUDIO: Array<{ href: string; texto: string; icono: NombreIcono }> = [
  { href: '/inicio', texto: 'Inicio', icono: 'inicio' },
  { href: '/aprendizaje', texto: 'Aprendizaje', icono: 'espacios' },
  { href: '/examenes', texto: 'Exámenes', icono: 'examen' },
  { href: '/fuentes', texto: 'Mis fuentes', icono: 'fuente' },
];
const CUENTA: Array<{ href: string; texto: string; icono: NombreIcono }> = [{ href: '/configuracion', texto: 'Configuración', icono: 'ajustes' }];
const VISIBLES = 8;

/** Las pantallas de trabajo (un espacio o una conversación) arrancan con la barra contraída para dar el ancho al lienzo. */
/** Pantallas del espacio educativo (tema, sesión, experiencia o estudio de un examen): la barra lateral se contrae. */
const esPantallaDeTrabajo = (ruta: string) => /^\/(espacios|tutor)\/[^/]+|^\/aprendizaje\/experiencias\/[^/]+|^\/examenes\/[^/]+\/estudiar\//.test(ruta);


/**
 * Marco de la aplicación autenticada: barra lateral contraíble (cajón por debajo de 64 rem) con el estudio, los espacios
 * privados, la exploración y la cuenta; barra superior con la ruta, el buscador y la sesión. La autorización real la hace la API.
 */
export function MarcoApp({ espacios, children }: { espacios: EspacioMenu[]; children: ReactNode }) {
  const ruta = usePathname();
  const trabajo = esPantallaDeTrabajo(ruta);
  const [contraida, setContraida] = useState(trabajo);
  const [abierta, setAbierta] = useState(false);
  const botonMenu = useRef<HTMLButtonElement>(null);
  const barra = useRef<HTMLElement>(null);

  // Al pasar de una lista a una pantalla de trabajo (o al revés) la barra recupera su estado por defecto.
  useEffect(() => setContraida(trabajo), [trabajo]);
  useEffect(() => setAbierta(false), [ruta]);

  // El diseño no se vuelve a pedir al navegar: si se abre un espacio que la barra aún no lista (recién creado), se refresca una vez.
  const router = useRouter();
  const idsConocidos = espacios.map((e) => e.id).join(',');
  useEffect(() => {
    const id = /^\/espacios\/([^/]+)$/.exec(ruta)?.[1];
    if (id && !idsConocidos.split(',').includes(id)) router.refresh();
  }, [ruta, idsConocidos, router]);

  useEffect(() => {
    if (!abierta) return;
    barra.current?.querySelector<HTMLElement>('a, button')?.focus();
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAbierta(false);
        botonMenu.current?.focus();
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierta]);

  // Los temas (/espacios) y las sesiones (/tutor) pertenecen a Aprendizaje: ese módulo queda marcado mientras se usan.
  const activo = (href: string) =>
    ruta === href || ruta.startsWith(`${href}/`) || (href === '/aprendizaje' && (ruta.startsWith('/espacios') || ruta.startsWith('/tutor')));
  const rail = contraida && !abierta;
  const enlaces = (lista: typeof ESTUDIO) =>
    lista.map((e) => (
      <li key={e.href}>
        <Link href={e.href} className="barra-enlace" aria-current={activo(e.href) ? 'page' : undefined} title={rail ? e.texto : undefined}>
          <Icono nombre={e.icono} />
          <span className="barra-texto">{e.texto}</span>
        </Link>
      </li>
    ));
  const ruteo = migasDeRuta(ruta);

  return (
    <div className="app" data-barra={rail ? 'rail' : 'completa'}>
      <aside id="barra-lateral" ref={barra} className="barra-lateral" data-abierta={abierta || undefined} aria-label="Navegación de la aplicación">
        <div className="barra-cabeza">
          <Marca href="/inicio" tono="campo" compacta={rail} />
          <button
            type="button"
            className="boton-icono boton-icono-campo solo-escritorio"
            aria-expanded={!contraida}
            aria-controls="barra-lateral"
            onClick={() => setContraida((c) => !c)}
          >
            <Icono nombre={contraida ? 'expandir' : 'contraer'} />
            <span className="visually-hidden">{contraida ? 'Expandir la barra lateral' : 'Contraer la barra lateral'}</span>
          </button>
          <button
            type="button"
            className="boton-icono boton-icono-campo solo-movil"
            onClick={() => {
              setAbierta(false);
              botonMenu.current?.focus();
            }}
          >
            <Icono nombre="cerrar" />
            <span className="visually-hidden">Cerrar menú</span>
          </button>
        </div>

        <nav aria-label="Principal" className="barra-grupo">
          <ul className="barra-lista">{enlaces(ESTUDIO)}</ul>
        </nav>

        {!rail && (
          <section className="barra-grupo barra-espacios" aria-labelledby="titulo-tus-espacios">
            <h2 id="titulo-tus-espacios" className="barra-titulo">
              Temas recientes
            </h2>
            {espacios.length === 0 ? (
              <p className="barra-nota">Aún no tienes temas.</p>
            ) : (
              <ul className="barra-lista">
                {espacios.slice(0, VISIBLES).map((e) => (
                  <li key={e.id}>
                    <Link href={`/espacios/${e.id}`} className="barra-enlace barra-enlace-espacio" aria-current={ruta === `/espacios/${e.id}` ? 'page' : undefined}>
                      <span className="barra-texto">{e.titulo}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {espacios.length > VISIBLES && (
              <Link href="/espacios" className="barra-mas">
                Ver los {espacios.length} temas
              </Link>
            )}
            <Link href="/aprendizaje?empezar=1" className="barra-enlace barra-enlace-accion">
              <Icono nombre="mas" />
              <span className="barra-texto">Empezar un tema</span>
            </Link>
          </section>
        )}

        <nav aria-label="Cuenta" className="barra-grupo barra-secundaria">
          {!rail && <h2 className="barra-titulo">Cuenta</h2>}
          <ul className="barra-lista">{enlaces(CUENTA)}</ul>
        </nav>

        <div className="barra-pie">
          {!rail && (
            <p className="barra-nota">
              <Icono nombre="candado" tamano={16} />
              Tus temas y fuentes son privados.
            </p>
          )}
          <EstadoSesion variante="barra" compacta={rail} />
        </div>
      </aside>

      {abierta && <button type="button" className="velo solo-movil" tabIndex={-1} aria-hidden="true" onClick={() => setAbierta(false)} />}

      <div className="app-columna">
        <header className="barra-superior">
          <button
            ref={botonMenu}
            type="button"
            className="boton-icono solo-movil"
            aria-expanded={abierta}
            aria-controls="barra-lateral"
            onClick={() => setAbierta(true)}
          >
            <Icono nombre="menu" />
            <span className="visually-hidden">Abrir menú</span>
          </button>
          <span className="solo-movil barra-superior-marca">
            <Marca href="/inicio" />
          </span>
          <nav aria-label="Ruta" className="migas-app solo-escritorio">
            <ol>
              {ruteo.map((m, i) => (
                <li key={`${m.texto}-${i}`}>
                  {m.href ? (
                    <Link href={m.href}>{m.texto}</Link>
                  ) : (
                    <span aria-current={i === ruteo.length - 1 ? 'page' : undefined}>{m.texto}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className="barra-superior-acciones">
            <Buscador espacios={espacios} />
          </div>
        </header>
        <main id="principal" className="app-contenido" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
