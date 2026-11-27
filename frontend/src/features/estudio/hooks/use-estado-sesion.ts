'use client';

import { useEffect, useRef, useState } from 'react';
import { apiCliente, ErrorApi } from '@/lib/api-cliente';
import type { EstadoEspacio } from '@/features/bloques';
import type { Bloque } from '@/features/bloques/esquema';
import { claveCambio, cuerpoEstado, propiosDe, restaurar, type EstadoRemoto } from '@/features/pizarra/persistencia';

export type Guardado = 'sin-sesion' | 'cargando' | 'guardado' | 'guardando' | 'error' | 'demasiado-grande';

const ESPERA_MS = 1200;

/**
 * Guardado del estado de una sesión (diseño de API, 12.5): pasos revelados, parámetros, vistas y selección de cada
 * bloque, y los bloques propios de la pizarra (`bloquesPropios`). Se carga al abrir la sesión (recuperando los bloques
 * propios con `crear-bloque`, que los valida) y se guarda poco después de cada cambio, agrupado, con `If-Match`; si otra
 * pestaña guardó antes (412), se adopta la versión del servidor y se reintenta una vez con el estado de esta pestaña.
 */
export function useEstadoSesion(
  conversacionId: string | undefined,
  estado: EstadoEspacio,
  o: { reemplazar: (e: EstadoEspacio) => void; aplicar: (acciones: readonly unknown[]) => { estado: EstadoEspacio }; alRestaurar?: (propios: Bloque[]) => void },
) {
  const [guardado, setGuardado] = useState<Guardado>(conversacionId ? 'cargando' : 'sin-sesion');
  const [carga, setCarga] = useState(0);
  const version = useRef(0);
  const anotaciones = useRef<unknown[]>([]);
  const cargado = useRef<string | null>(null);
  const listo = useRef(false);
  const ultimo = useRef<string>('');
  const actual = useRef(estado);
  actual.current = estado;
  const ops = useRef(o);
  ops.current = o;

  useEffect(() => {
    if (!conversacionId || cargado.current === conversacionId) return;
    cargado.current = conversacionId;
    listo.current = false;
    setGuardado('cargando');
    apiCliente<EstadoRemoto>(`/tutor-ia/conversaciones/${encodeURIComponent(conversacionId)}/estado`)
      .then((r) => {
        version.current = r.version;
        anotaciones.current = r.anotaciones;
        const { acciones, interaccion } = restaurar(actual.current, r);
        let siguiente = actual.current;
        if (acciones.length) siguiente = ops.current.aplicar(acciones).estado;
        const combinada = { ...siguiente.interaccion, ...interaccion };
        if (Object.keys(interaccion).length) {
          siguiente = { ...siguiente, interaccion: combinada };
          ops.current.reemplazar(siguiente);
        }
        // Lo restaurado ya está guardado: no se vuelve a enviar. Sin estado previo, la base es la interacción inicial;
        // los bloques propios creados antes de existir la sesión se guardan enseguida.
        ultimo.current = claveCambio({ bloques: r.version > 0 ? siguiente.bloques : [], interaccion: combinada });
        if (acciones.length) ops.current.alRestaurar?.(propiosDe(siguiente.bloques));
        listo.current = true;
        setGuardado('guardado');
        setCarga((n) => n + 1);
      })
      .catch(() => setGuardado('error'));
  }, [conversacionId]);

  const clave = claveCambio(estado);
  useEffect(() => {
    if (!conversacionId || cargado.current !== conversacionId || !listo.current) return;
    if (clave === ultimo.current) return;
    const t = setTimeout(async () => {
      const r0 = cuerpoEstado(actual.current, anotaciones.current);
      if (!r0.ok) return setGuardado('demasiado-grande');
      const enviar = (cuerpo: unknown) =>
        apiCliente<EstadoRemoto>(`/tutor-ia/conversaciones/${encodeURIComponent(conversacionId)}/estado`, {
          metodo: 'PUT',
          cuerpo,
          cabeceras: { 'if-match': `"${version.current}"` },
        });
      setGuardado('guardando');
      try {
        let r: EstadoRemoto;
        try {
          r = await enviar(r0.cuerpo);
        } catch (e) {
          if (!(e instanceof ErrorApi) || e.code !== 'CONFLICTO_VERSION') throw e;
          const remoto = await apiCliente<EstadoRemoto>(`/tutor-ia/conversaciones/${encodeURIComponent(conversacionId)}/estado`);
          version.current = remoto.version;
          anotaciones.current = remoto.anotaciones;
          const r1 = cuerpoEstado(actual.current, anotaciones.current);
          if (!r1.ok) return setGuardado('demasiado-grande');
          r = await enviar(r1.cuerpo);
        }
        version.current = r.version;
        ultimo.current = clave;
        setGuardado('guardado');
      } catch {
        setGuardado('error');
      }
    }, ESPERA_MS);
    return () => clearTimeout(t);
  }, [conversacionId, clave, carga]);

  // Sin sesión todavía: el indicador lo dice (nada se guarda hasta que exista la conversación).
  useEffect(() => {
    if (!conversacionId) setGuardado('sin-sesion');
  }, [conversacionId]);

  return guardado;
}
