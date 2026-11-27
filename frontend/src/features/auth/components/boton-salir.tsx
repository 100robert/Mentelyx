'use client';

import { useSesion } from '../hooks/use-sesion';

/** Cerrar la sesión en este dispositivo (revoca la sesión en el servidor y borra el cuaderno local). */
export function BotonSalir() {
  const { saliendo, prepararSalida, salir } = useSesion();
  return (
    <button type="button" className="boton boton-secundario" aria-busy={saliendo} onClickCapture={prepararSalida} onClick={salir}>
      {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
    </button>
  );
}
