'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Buscador } from './buscador';
import { EstadoSesion } from '@/features/auth';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import { Marca } from '@/components/ui/marca';

export type EspacioMenu = { id: string; titulo: string };

const ESTUDIO: Array<{ href: string; texto: string; icono: NombreIcono }> = [
  { href: '/espacios', texto: 'Mis espacios', icono: 'espacios' },
  { href: '/tutor', texto: 'Conversaciones', icono: 'conversaciones' },
];
const EXPLORAR: Array<{ href: string; texto: string; icono: NombreIcono }> = [{ href: '/biblioteca', texto: 'Biblioteca pública', icono: 'biblioteca' }];
const CUENTA: Array<{ href: string; texto: string; icono: NombreIcono }> = [{ href: '/planes', texto: 'Planes y recursos', icono: 'planes' }];
const VISIBLES = 8;

/** Las pantallas de trabajo (un espacio o una conversación) arrancan con la barra contraída para dar el ancho al lienzo. */
const esPantallaDeTrabajo = (ruta: string) => /^\/(espacios|tutor)\/[^/]+/.test(ruta);

function migas(ruta: string, espacios: EspacioMenu[]): Array<{ texto: string; href?: string }> {
  const espacio = /^\/espacios\/([^/]+)$/.exec(ruta)?.[1];
  if (espacio) return [{ texto: 'Mis espacios', href: '/espacios' }, { texto: espacios.find((e) => e.id === espacio)?.titulo ?? 'Espacio' }];
  if (/^\/tutor\/[^/]+$/.test(ruta)) return [{ texto: 'Conversaciones', href: '/tutor' }, { texto: 'Conversación' }];
  if (ruta.startsWith('/tutor')) return [{ texto: 'Conversaciones' }];
  return [{ texto: 'Mis espacios' }];
}

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

  const activo = (href: string) => (href === '/espacios' ? ruta === '/espacios' : ruta === href || ruta.startsWith(`${href}/`));
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
  const ruteo = migas(ruta, espacios);

  return (
    <div className="app" data-barra={rail ? 'rail' : 'completa'}>
      <aside id="barra-lateral" ref={barra} className="barra-lateral" data-abierta={abierta || undefined} aria-label="Navegación de la aplicación">
        <div className="barra-cabeza">
          <Marca href="/espacios" tono="campo" compacta={rail} />
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

        <nav aria-label="Estudio" className="barra-grupo">
          <ul className="barra-lista">{enlaces(ESTUDIO)}</ul>
        </nav>

        {!rail && (
          <section className="barra-grupo barra-espacios" aria-labelledby="titulo-tus-espacios">
            <h2 id="titulo-tus-espacios" className="barra-titulo">
              Espacios privados
            </h2>
            {espacios.length === 0 ? (
              <p className="barra-nota">Aún no tienes espacios.</p>
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
                Ver los {espacios.length} espacios
              </Link>
            )}
            <Link href="/espacios#nuevo-espacio" className="barra-enlace barra-enlace-accion">
              <Icono nombre="mas" />
              <span className="barra-texto">Nuevo espacio</span>
            </Link>
          </section>
        )}

        <nav aria-label="Explorar" className="barra-grupo barra-secundaria">
          {!rail && <h2 className="barra-titulo">Explorar</h2>}
          <ul className="barra-lista">{enlaces(EXPLORAR)}</ul>
        </nav>
        <nav aria-label="Cuenta" className="barra-grupo">
          {!rail && <h2 className="barra-titulo">Cuenta</h2>}
          <ul className="barra-lista">{enlaces(CUENTA)}</ul>
        </nav>

        <div className="barra-pie">
          {!rail && (
            <p className="barra-nota">
              <Icono nombre="candado" tamano={16} />
              Tus espacios son privados.
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
            <Marca href="/espacios" />
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
