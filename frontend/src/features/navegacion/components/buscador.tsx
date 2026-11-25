'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import type { EspacioMenu } from './marco-app';

type Destino = { id: string; texto: string; detalle: string; href: string; icono: NombreIcono };

const FIJOS: Destino[] = [
  { id: 'mis-espacios', texto: 'Mis espacios', detalle: 'Panel de estudio', href: '/espacios', icono: 'espacios' },
  { id: 'nuevo', texto: 'Nuevo espacio', detalle: 'Crear un espacio de estudio', href: '/espacios#nuevo-espacio', icono: 'mas' },
  { id: 'conversaciones', texto: 'Conversaciones', detalle: 'Todas tus sesiones con el Tutor', href: '/tutor', icono: 'historial' },
  { id: 'biblioteca', texto: 'Biblioteca pública', detalle: 'Recursos publicados', href: '/biblioteca', icono: 'biblioteca' },
  { id: 'planes', texto: 'Planes', detalle: 'Recursos de cada plan', href: '/planes', icono: 'planes' },
];
const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/**
 * Buscador rápido (Ctrl o ⌘ + K): filtra tus espacios y las secciones de la aplicación y navega con el teclado.
 * Usa los datos que ya cargó el marco; no hace peticiones nuevas.
 */
export function Buscador({ espacios }: { espacios: EspacioMenu[] }) {
  const router = useRouter();
  const dialogo = useRef<HTMLDialogElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const [consulta, setConsulta] = useState('');
  const [activo, setActivo] = useState(0);

  const resultados = useMemo(() => {
    const todos: Destino[] = [
      ...espacios.map((e) => ({ id: `e-${e.id}`, texto: e.titulo, detalle: 'Espacio privado', href: `/espacios/${e.id}`, icono: 'fuente' as const })),
      ...FIJOS,
    ];
    const q = normalizar(consulta.trim());
    return q ? todos.filter((d) => normalizar(`${d.texto} ${d.detalle}`).includes(q)) : todos;
  }, [consulta, espacios]);

  const abrir = () => {
    setConsulta('');
    setActivo(0);
    dialogo.current?.showModal();
    requestAnimationFrame(() => campo.current?.focus());
  };

  useEffect(() => {
    const atajo = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (dialogo.current?.open) dialogo.current.close();
        else abrir();
      }
    };
    document.addEventListener('keydown', atajo);
    return () => document.removeEventListener('keydown', atajo);
  }, []);

  const ir = (d: Destino | undefined) => {
    if (!d) return;
    dialogo.current?.close();
    router.push(d.href);
  };

  return (
    <>
      <button type="button" className="boton-buscar" onClick={abrir} aria-haspopup="dialog">
        <Icono nombre="buscar" />
        <span className="boton-buscar-texto">Buscar</span>
        <kbd className="atajo">Ctrl K</kbd>
      </button>
      <dialog ref={dialogo} className="buscador" aria-label="Buscar" onClick={(e) => e.target === dialogo.current && dialogo.current?.close()}>
        <div className="buscador-campo">
          <Icono nombre="buscar" />
          <input
            ref={campo}
            role="combobox"
            aria-expanded="true"
            aria-controls="buscador-resultados"
            aria-activedescendant={resultados[activo] ? `opcion-${resultados[activo].id}` : undefined}
            aria-label="Buscar espacios y secciones"
            placeholder="Busca un espacio o una sección"
            value={consulta}
            onChange={(e) => {
              setConsulta(e.target.value);
              setActivo(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActivo((a) => Math.min(a + 1, resultados.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActivo((a) => Math.max(a - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                ir(resultados[activo]);
              }
            }}
          />
          <kbd className="atajo">Esc</kbd>
        </div>
        <ul id="buscador-resultados" role="listbox" className="buscador-resultados" aria-label="Resultados">
          {resultados.length === 0 ? (
            <li className="buscador-vacio" role="presentation">
              Sin resultados para «{consulta}».
            </li>
          ) : (
            resultados.map((d, i) => (
              <li
                key={d.id}
                id={`opcion-${d.id}`}
                role="option"
                aria-selected={i === activo}
                className="buscador-opcion"
                onPointerMove={() => setActivo(i)}
                onClick={() => ir(d)}
              >
                <Icono nombre={d.icono} />
                <span className="buscador-opcion-texto">
                  <span>{d.texto}</span>
                  <span className="buscador-opcion-detalle">{d.detalle}</span>
                </span>
              </li>
            ))
          )}
        </ul>
      </dialog>
    </>
  );
}
