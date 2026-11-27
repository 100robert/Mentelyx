'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { apiCliente } from '@/lib/api-cliente';
import { limpiarCuadernoLocal } from '@/features/lienzo';
import { olvidarTodo } from '@/features/pizarra/memoria';

/**
 * Estado de la sesión según el servidor (GET /api/v1/auth/sesion, en el navegador) y la salida.
 * `conSesion` es null mientras se consulta. La autorización real la hace la API en cada petición.
 */
export function useSesion() {
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

  /** Marca la espera y borra el cuaderno local antes del cierre de sesión (debe llamarse en la fase de captura del clic). */
  const prepararSalida = useCallback(() => {
    setSaliendo(true);
    limpiarCuadernoLocal();
    olvidarTodo();
  }, []);

  const salir = useCallback(async () => {
    await apiCliente('/auth/logout', { metodo: 'POST' }).catch(() => {});
    setConSesion(false);
    router.push('/');
    router.refresh();
  }, [router]);

  return { conSesion, saliendo, prepararSalida, salir };
}
