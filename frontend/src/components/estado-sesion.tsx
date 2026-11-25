'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiCliente } from '@/lib/api-cliente';
import { limpiarCuadernoLocal } from './cuaderno';
import { Icono } from './iconos';

/**
 * Muestra «Ingresar» o «Salir» según la sesión del servidor (consulta /api/v1/auth/sesion en el navegador).
 * `cabecera` es la variante de las páginas públicas; `barra`, la de la barra lateral de la aplicación.
 */
export function EstadoSesion({ variante = 'cabecera', compacta = false }: { variante?: 'cabecera' | 'barra'; compacta?: boolean }) {
  const [conSesion, setConSesion] = useState<boolean | null>(null);
  const [saliendo, setSaliendo] = useState(false);
  const ruta = usePathname();
  const router = useRouter();

  useEffect(() => {
    let vigente = true;
    setSaliendo(false);
    apiCliente('/auth/sesion')
      .then(() => vigente && setConSesion(true))
      .catch(() => vigente && setConSesion(false));
    return () => {
      vigente = false;
    };
  }, [ruta]);

  if (conSesion === null) return <span aria-hidden="true" className="sesion-reserva" />;
  if (!conSesion)
    return (
      <Link href="/auth/ingresar" className={variante === 'barra' ? 'barra-enlace' : 'boton boton-secundario boton-chico'}>
        {variante === 'barra' && <Icono nombre="salir" />}
        <span className={compacta ? 'visually-hidden' : undefined}>Ingresar</span>
      </Link>
    );
  return (
    <button
      type="button"
      className={variante === 'barra' ? 'barra-enlace' : 'boton boton-secundario boton-chico'}
      aria-busy={saliendo}
      aria-label={compacta ? 'Salir' : undefined}
      // La captura marca la espera («Saliendo…») y borra el cuaderno local antes de que corra el cierre de sesión, que no cambia.
      // No se deshabilita el botón aquí: React omite el clic de un elemento deshabilitado y el cierre de sesión no llegaría a ejecutarse.
      onClickCapture={() => {
        setSaliendo(true);
        limpiarCuadernoLocal();
      }}
      onClick={async () => {
        await apiCliente('/auth/logout', { metodo: 'POST' }).catch(() => {});
        setConSesion(false);
        router.push('/');
        router.refresh();
      }}
    >
      {variante === 'barra' && <Icono nombre="salir" />}
      {!compacta && <span>{saliendo ? 'Saliendo…' : 'Salir'}</span>}
    </button>
  );
}
