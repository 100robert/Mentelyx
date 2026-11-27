'use client';

import { useCallback, useRef, useState } from 'react';
import { aplicarAccion, aplicarAcciones, crearEstado, type Accion, type ErrorAccion, type EstadoEspacio } from '@/features/bloques';

/**
 * Estado del espacio educativo: los bloques y su interacción, cambiados solo con acciones validadas por el reductor.
 * Un error no destruye nada: se informa (aviso breve) y el estado anterior sigue en pantalla.
 */
export function useEspacio(bloquesIniciales: readonly unknown[], alCambiar?: (anterior: EstadoEspacio, nuevo: EstadoEspacio) => Accion[]) {
  const [estado, setEstado] = useState<EstadoEspacio>(() => crearEstado(bloquesIniciales));
  const [aviso, setAviso] = useState<ErrorAccion | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const actual = useRef(estado);
  actual.current = estado;
  const vinculo = useRef(alCambiar);
  vinculo.current = alCambiar;

  const aplicar = useCallback((acciones: readonly unknown[]) => {
    const previo = actual.current;
    let r = aplicarAcciones(previo, acciones);
    // Vínculos entre bloques (por ejemplo, el gráfico actualiza el procedimiento): son acciones validadas como las demás.
    const extra = vinculo.current?.(previo, r.estado) ?? [];
    if (extra.length > 0) {
      const v = aplicarAcciones(r.estado, extra);
      r = { estado: v.estado, error: r.error ?? v.error, anuncio: r.anuncio ?? v.anuncio };
    }
    actual.current = r.estado;
    setEstado(r.estado);
    setAviso(r.error);
    if (r.anuncio) setAnuncio(r.anuncio);
    return r;
  }, []);

  const despachar = useCallback((a: Accion | unknown) => aplicar([a]), [aplicar]);
  const reemplazar = useCallback((nuevo: EstadoEspacio) => {
    actual.current = nuevo;
    setEstado(nuevo);
  }, []);

  return { estado, despachar, aplicar, reemplazar, aviso, cerrarAviso: () => setAviso(null), anuncio, aplicarUna: (a: unknown) => aplicarAccion(actual.current, a) };
}
