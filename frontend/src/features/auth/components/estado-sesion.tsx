'use client';

import Link from 'next/link';
import { Icono } from '@/components/ui/iconos';
import { useSesion } from '../hooks/use-sesion';

/**
 * Muestra «Ingresar» o «Salir» según la sesión del servidor. Variante de la barra lateral de la aplicación; la cabecera
 * pública usa `useSesion` directamente para mostrar sus propias acciones.
 */
export function EstadoSesion({ compacta = false }: { variante?: 'barra'; compacta?: boolean }) {
  const { conSesion, saliendo, prepararSalida, salir } = useSesion();

  if (conSesion === null) return <span aria-hidden="true" className="sesion-reserva" />;
  if (!conSesion)
    return (
      <Link href="/auth/ingresar" className="barra-enlace">
        <Icono nombre="salir" />
        <span className={compacta ? 'visually-hidden' : undefined}>Ingresar</span>
      </Link>
    );
  return (
    <button
      type="button"
      className="barra-enlace"
      aria-busy={saliendo}
      aria-label={compacta ? 'Salir' : undefined}
      // La captura marca la espera y borra el cuaderno local antes de que corra el cierre de sesión.
      // No se deshabilita el botón aquí: React omite el clic de un elemento deshabilitado y el cierre no llegaría a ejecutarse.
      onClickCapture={prepararSalida}
      onClick={salir}
    >
      <Icono nombre="salir" />
      {!compacta && <span>{saliendo ? 'Saliendo…' : 'Salir'}</span>}
    </button>
  );
}
