'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Bloque } from '@/features/bloques/esquema';
import {
  agregar,
  cambiarEstilo,
  crearHistorial,
  deshacer as deshacerH,
  duplicar,
  ESTILO_INICIAL,
  normalizarEstilo,
  quitar,
  registrar,
  rehacer as rehacerH,
  type Elemento,
  type Estilo,
  type Herramienta,
  type Historial,
  type Vec,
} from '../modelo';

export type Fondo = 'cuadricula' | 'puntos' | 'limpio';
export type ModoBorrador = 'todo' | 'trazos';
type Instantanea = { elementos: Elemento[]; propios: Bloque[] };
export type Seleccion = { elementos: string[]; bloques: string[] };
const VACIA: Seleccion = { elementos: [], bloques: [] };

/** Lo que la superficie expone a la barra de herramientas y al espacio (zoom, ajuste, foco de un bloque). */
export type ControlesVista = {
  zoom: (factor: number) => void;
  restablecer: () => void;
  ajustarTodo: () => void;
  enfocarSeleccion: () => void;
  enfocarBloque: (id: string, animar?: boolean) => void;
  ajustarBloque: (id: string) => void;
  centro: () => Vec;
  insertarEnCentro: (h: Herramienta) => void;
};

const CLAVE_FONDO = 'mentelyx.pizarra.fondo';
const estiloDe = (h: Herramienta): keyof typeof ESTILO_INICIAL => (h === 'lapiz' || h === 'plumon' || h === 'resaltador' ? h : h === 'texto' ? 'texto' : 'forma');

/**
 * Estado de la pizarra: herramienta, estilos por pincel, fondo, selección y la capa de trabajo con deshacer y rehacer.
 * El historial incluye los bloques propios (insertar una ecuación se deshace igual que un trazo); los cambios llegan
 * agrupados (un trazo completo, un borrado completo), nunca por cada movimiento del puntero.
 */
export function usePizarra(o: { sincronizarPropios: (propios: Bloque[]) => void; soloLectura?: boolean; inicial?: Elemento[] | undefined; propiosIniciales?: Bloque[] }) {
  const [historial, setHistorial] = useState<Historial<Instantanea>>(() => crearHistorial({ elementos: o.inicial ?? [], propios: o.propiosIniciales ?? [] }));
  const [herramienta, setHerramientaEstado] = useState<Herramienta>('seleccion');
  const [estilos, setEstilos] = useState(ESTILO_INICIAL);
  const [fondo, setFondoEstado] = useState<Fondo>('cuadricula');
  const [seleccion, setSeleccion] = useState<Seleccion>(VACIA);
  const [borrador, setBorrador] = useState<ModoBorrador>('todo');
  const [expresion, setExpresion] = useState(true);
  const [escala, setEscala] = useState(1);
  const [aviso, setAviso] = useState<string | null>(null);
  const controles = useRef<ControlesVista | null>(null);
  const actual = useRef(historial);
  actual.current = historial;
  const sincronizar = useRef(o.sincronizarPropios);
  sincronizar.current = o.sincronizarPropios;

  // El fondo es una preferencia visual de este dispositivo (no es contenido de la sesión).
  useEffect(() => {
    try {
      const f = localStorage.getItem(CLAVE_FONDO);
      if (f === 'cuadricula' || f === 'puntos' || f === 'limpio') setFondoEstado(f);
    } catch {
      /* sin almacenamiento: queda la cuadrícula */
    }
  }, []);
  const setFondo = useCallback((f: Fondo) => {
    setFondoEstado(f);
    try {
      localStorage.setItem(CLAVE_FONDO, f);
    } catch {
      /* preferencia solo en esta pestaña */
    }
  }, []);

  const elementos = historial.presente.elementos;
  const estilo = estilos[estiloDe(herramienta)];

  /** Un cambio agrupado de la capa de trabajo (se puede deshacer). */
  const confirmar = useCallback((cambio: (e: Elemento[]) => Elemento[]) => {
    setHistorial((h) => {
      const nuevos = cambio(h.presente.elementos);
      return nuevos === h.presente.elementos ? h : registrar(h, { ...h.presente, elementos: nuevos });
    });
  }, []);
  const agregarElementos = useCallback((nuevos: Elemento[]) => confirmar((e) => nuevos.reduce((acc, x) => agregar(acc, x), e)), [confirmar]);

  /** Los bloques propios cambiaron por la persona (insertar o quitar): se registra para poder deshacerlo. */
  const registrarPropios = useCallback((propios: Bloque[]) => setHistorial((h) => registrar(h, { ...h.presente, propios })), []);
  /** Los bloques propios restaurados desde el servidor son el punto de partida: no se deshacen. */
  const basePropios = useCallback((propios: Bloque[]) => setHistorial((h) => ({ ...h, presente: { ...h.presente, propios }, pasado: h.pasado.map((p) => ({ ...p, propios })) })), []);

  const moverHistorial = useCallback((f: (h: Historial<Instantanea>) => Historial<Instantanea>) => {
    const antes = actual.current;
    const despues = f(antes);
    if (despues === antes) return;
    actual.current = despues;
    setHistorial(despues);
    if (despues.presente.propios !== antes.presente.propios) sincronizar.current(despues.presente.propios);
    setSeleccion(VACIA);
  }, []);
  const deshacer = useCallback(() => moverHistorial(deshacerH), [moverHistorial]);
  const rehacer = useCallback(() => moverHistorial(rehacerH), [moverHistorial]);

  const setHerramienta = useCallback((h: Herramienta) => {
    setHerramientaEstado(h);
    if (h !== 'seleccion') setSeleccion(VACIA);
  }, []);
  const cambiarEstiloActual = useCallback(
    (cambio: Partial<Estilo>) => {
      const clave = estiloDe(herramienta);
      setEstilos((s) => ({ ...s, [clave]: normalizarEstilo({ ...s[clave], ...cambio }) }));
      // Con elementos elegidos, el color, el grosor y la opacidad se aplican también a ellos.
      if (seleccion.elementos.length) confirmar((e) => cambiarEstilo(e, new Set(seleccion.elementos), cambio));
    },
    [herramienta, seleccion.elementos, confirmar],
  );

  const eliminarSeleccion = useCallback(
    (bloques: readonly Bloque[]) => {
      const ids = new Set(seleccion.elementos);
      const propiosElegidos = seleccion.bloques.filter((id) => bloques.find((b) => b.id === id)?.origen === 'persona');
      const ajenos = seleccion.bloques.length - propiosElegidos.length;
      if (ajenos > 0) setAviso('El contenido del Tutor y los ejemplos no se borran desde la pizarra; solo lo que agregaste tú.');
      if (!ids.size && !propiosElegidos.length) return;
      setHistorial((h) => {
        const propios = propiosElegidos.length ? h.presente.propios.filter((b) => !propiosElegidos.includes(b.id)) : h.presente.propios;
        const siguiente = registrar(h, { elementos: ids.size ? quitar(h.presente.elementos, ids) : h.presente.elementos, propios });
        if (propios !== h.presente.propios) queueMicrotask(() => sincronizar.current(propios));
        return siguiente;
      });
      setSeleccion(VACIA);
    },
    [seleccion],
  );
  const duplicarSeleccion = useCallback(() => {
    if (!seleccion.elementos.length) return;
    let nuevos: string[] = [];
    confirmar((e) => {
      const r = duplicar(e, new Set(seleccion.elementos));
      nuevos = r.nuevos;
      return r.elementos;
    });
    queueMicrotask(() => setSeleccion({ elementos: nuevos, bloques: [] }));
  }, [seleccion.elementos, confirmar]);

  return useMemo(
    () => ({
      elementos,
      herramienta,
      setHerramienta,
      estilo,
      cambiarEstilo: cambiarEstiloActual,
      fondo,
      setFondo,
      seleccion,
      setSeleccion,
      limpiarSeleccion: () => setSeleccion(VACIA),
      borrador,
      setBorrador,
      expresion,
      setExpresion,
      escala,
      setEscala,
      aviso,
      setAviso,
      confirmar,
      agregarElementos,
      registrarPropios,
      basePropios,
      propios: historial.presente.propios,
      deshacer,
      rehacer,
      puedeDeshacer: historial.pasado.length > 0,
      puedeRehacer: historial.futuro.length > 0,
      eliminarSeleccion,
      duplicarSeleccion,
      controles,
      soloLectura: o.soloLectura ?? false,
    }),
    [elementos, herramienta, setHerramienta, estilo, cambiarEstiloActual, fondo, setFondo, seleccion, borrador, expresion, escala, aviso, confirmar, agregarElementos, registrarPropios, basePropios, historial, deshacer, rehacer, eliminarSeleccion, duplicarSeleccion, o.soloLectura],
  );
}
export type Pizarra = ReturnType<typeof usePizarra>;
