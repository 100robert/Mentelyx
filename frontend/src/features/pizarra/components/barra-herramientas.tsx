'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import type { Bloque } from '@/features/bloques/esquema';
import { NOMBRE_COLOR, RESALTADORES, TINTAS, type Color, type Herramienta } from '../modelo';
import type { Pizarra } from '../hooks/use-pizarra';

export type Insercion = 'ecuacion' | 'grafico' | 'diagrama' | 'imagen' | 'tabla' | 'modelo' | 'documento' | 'ejercicio';

const HERRAMIENTAS: Array<{ id: Herramienta; nombre: string; icono: NombreIcono; tecla: string }> = [
  { id: 'seleccion', nombre: 'Seleccionar y mover', icono: 'cursor', tecla: 'V' },
  { id: 'mano', nombre: 'Desplazar la pizarra', icono: 'mano', tecla: 'H' },
  { id: 'lapiz', nombre: 'Lápiz', icono: 'lapiz', tecla: 'P' },
  { id: 'plumon', nombre: 'Plumón', icono: 'plumon', tecla: 'M' },
  { id: 'resaltador', nombre: 'Resaltador', icono: 'resaltar', tecla: 'Y' },
  { id: 'borrador', nombre: 'Borrador', icono: 'borrador', tecla: 'E' },
  { id: 'texto', nombre: 'Texto o expresión', icono: 'texto', tecla: 'T' },
  { id: 'linea', nombre: 'Línea', icono: 'linea', tecla: 'L' },
  { id: 'flecha', nombre: 'Flecha', icono: 'flecha', tecla: 'A' },
  { id: 'rectangulo', nombre: 'Rectángulo', icono: 'rectangulo', tecla: 'R' },
  { id: 'circulo', nombre: 'Círculo', icono: 'circulo', tecla: 'O' },
];
const GRUPOS: Herramienta[][] = [['seleccion', 'mano'], ['lapiz', 'plumon', 'resaltador', 'borrador'], ['texto', 'linea', 'flecha', 'rectangulo', 'circulo']];
export const INSERCIONES: Array<{ id: Insercion; nombre: string; icono: NombreIcono; ayuda: string }> = [
  { id: 'ecuacion', nombre: 'Ecuación', icono: 'ecuacion', ayuda: 'Escríbela con el teclado; se muestra como matemática' },
  { id: 'grafico', nombre: 'Gráfico', icono: 'grafico', ayuda: 'Una o varias funciones de x, interactivas' },
  { id: 'diagrama', nombre: 'Diagrama', icono: 'diagrama', ayuda: 'Cajas y flechas editables' },
  { id: 'tabla', nombre: 'Tabla', icono: 'tabla', ayuda: 'Filas y columnas' },
  { id: 'ejercicio', nombre: 'Ejercicio', icono: 'examen', ayuda: 'Escribe el enunciado y resuélvelo con el Tutor' },
  { id: 'modelo', nombre: 'Modelo 3D', icono: 'cubo', ayuda: 'Del catálogo de Mentelyx' },
  { id: 'documento', nombre: 'Documento', icono: 'fuente', ayuda: 'PDF del catálogo o de tu equipo' },
  { id: 'imagen', nombre: 'Imagen', icono: 'imagen', ayuda: 'De tu equipo: solo en esta pantalla' },
];
export const NOMBRE_HERRAMIENTA = Object.fromEntries(HERRAMIENTAS.map((h) => [h.id, h.nombre])) as Record<Herramienta, string>;
const CON_ESTILO: ReadonlySet<Herramienta> = new Set(['lapiz', 'plumon', 'resaltador', 'texto', 'linea', 'flecha', 'rectangulo', 'circulo']);
const GROSORES: Record<string, number[]> = { lapiz: [1.5, 2.5, 4, 6], plumon: [4, 6, 10, 16], resaltador: [12, 18, 26, 36], forma: [1.5, 2.5, 4, 8], texto: [2.5] };
const esCampo = (t: EventTarget | null) => t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/**
 * Barra de herramientas real (ninguna decorativa): puntero, mano, lápiz, plumón, resaltador, borrador, texto, línea,
 * flecha, rectángulo y círculo, con sus opciones (color, grosor, opacidad) en un panel contextual; deshacer y rehacer;
 * y las herramientas educativas. Atajos de teclado en cada ayuda; flechas para recorrerla.
 */
export function BarraHerramientas({ p, bloques, alInsertar, alPreguntarSeleccion }: { p: Pizarra; bloques: readonly Bloque[]; alInsertar: (i: Insercion) => void; alPreguntarSeleccion: () => void }) {
  const id = useId();
  const barra = useRef<HTMLDivElement>(null);
  const [insertar, setInsertar] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const botonInsertar = useRef<HTMLButtonElement>(null);
  const hay = p.seleccion.elementos.length + p.seleccion.bloques.length;
  const propiosElegidos = p.seleccion.bloques.filter((b) => bloques.find((x) => x.id === b)?.origen === 'persona').length;

  // Atajos: letra de cada herramienta, Ctrl+Z / Ctrl+Mayús+Z / Ctrl+Y, Supr, Ctrl+D y Esc (fuera de los campos de texto).
  useEffect(() => {
    if (p.soloLectura) return;
    const alPulsar = (e: globalThis.KeyboardEvent) => {
      if (esCampo(e.target) || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('.visor-3d, .visor-pdf, dialog')) return;
      const k = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && k === 'z') {
        e.preventDefault();
        return e.shiftKey ? p.rehacer() : p.deshacer();
      }
      if ((e.ctrlKey || e.metaKey) && k === 'y') {
        e.preventDefault();
        return p.rehacer();
      }
      if ((e.ctrlKey || e.metaKey) && k === 'd' && p.seleccion.elementos.length) {
        e.preventDefault();
        return p.duplicarSeleccion();
      }
      if (e.ctrlKey || e.metaKey) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && hay) {
        e.preventDefault();
        return p.eliminarSeleccion(bloques);
      }
      if (e.key === 'Escape') {
        if (insertar) return setInsertar(false);
        if (hay) return p.limpiarSeleccion();
        if (p.herramienta !== 'seleccion') return p.setHerramienta('seleccion');
        return;
      }
      const h = HERRAMIENTAS.find((x) => x.tecla.toLowerCase() === k);
      if (h && !e.shiftKey) p.setHerramienta(h.id);
      else if (e.key === '+' || e.key === '=') p.controles.current?.zoom(1.2);
      else if (e.key === '-') p.controles.current?.zoom(1 / 1.2);
      else if (e.key === '0') p.controles.current?.restablecer();
      else if (e.key === '!' || (e.shiftKey && e.code === 'Digit1')) p.controles.current?.ajustarTodo();
      else if (e.key === '@' || (e.shiftKey && e.code === 'Digit2')) p.controles.current?.enfocarSeleccion();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [p, bloques, hay, insertar]);

  // El menú de inserción se cierra al hacer clic afuera.
  useEffect(() => {
    if (!insertar) return;
    const fuera = (e: PointerEvent) => {
      if (!menu.current?.contains(e.target as Node) && !botonInsertar.current?.contains(e.target as Node)) setInsertar(false);
    };
    document.addEventListener('pointerdown', fuera);
    requestAnimationFrame(() => menu.current?.querySelector<HTMLButtonElement>('button')?.focus());
    return () => document.removeEventListener('pointerdown', fuera);
  }, [insertar]);

  const recorrer = (e: KeyboardEvent<HTMLDivElement>) => {
    const ejes = barra.current?.getAttribute('aria-orientation') === 'horizontal' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
    if (![...ejes, 'Home', 'End'].includes(e.key)) return;
    const botones = [...(barra.current?.querySelectorAll<HTMLButtonElement>('.pz-herramienta:not(:disabled)') ?? [])];
    const k = botones.indexOf(document.activeElement as HTMLButtonElement);
    if (k === -1) return;
    e.preventDefault();
    const destino = e.key === 'Home' ? 0 : e.key === 'End' ? botones.length - 1 : (k + (e.key === ejes[0] ? -1 : 1) + botones.length) % botones.length;
    botones[destino]?.focus();
  };

  if (p.soloLectura) return null;
  const opciones = CON_ESTILO.has(p.herramienta) || p.herramienta === 'borrador' || p.seleccion.elementos.length > 0;
  const paleta: readonly Color[] = p.herramienta === 'resaltador' ? RESALTADORES : TINTAS;
  const grosores = GROSORES[p.herramienta === 'lapiz' || p.herramienta === 'plumon' || p.herramienta === 'resaltador' ? p.herramienta : p.herramienta === 'texto' ? 'texto' : 'forma']!;

  return (
    <div className="pz-herramientas">
      <div ref={barra} className="pz-barra" role="toolbar" aria-label="Herramientas de la pizarra" aria-orientation="vertical" onKeyDown={recorrer}>
        {GRUPOS.map((g, k) => (
          <div key={k} className="pz-grupo" role="group" aria-label={['Navegar', 'Escribir a mano', 'Texto y formas'][k]}>
            {g.map((hid) => {
              const h = HERRAMIENTAS.find((x) => x.id === hid)!;
              return (
                <button key={h.id} type="button" className="pz-herramienta" aria-pressed={p.herramienta === h.id} title={`${h.nombre} (${h.tecla})`} onClick={() => p.setHerramienta(h.id)}>
                  <Icono nombre={h.icono} />
                  <span className="visually-hidden">{h.nombre}</span>
                </button>
              );
            })}
          </div>
        ))}
        <div className="pz-grupo" role="group" aria-label="Insertar">
          <button
            ref={botonInsertar}
            type="button"
            className="pz-herramienta"
            aria-expanded={insertar}
            aria-controls={`${id}-insertar`}
            aria-haspopup="menu"
            title="Insertar ecuación, gráfico, diagrama, tabla, ejercicio, modelo 3D, documento o imagen"
            onClick={() => setInsertar((v) => !v)}
          >
            <Icono nombre="mas" />
            <span className="visually-hidden">Insertar</span>
          </button>
        </div>
        <div className="pz-grupo" role="group" aria-label="Historial">
          <button type="button" className="pz-herramienta" disabled={!p.puedeDeshacer} title="Deshacer (Ctrl + Z)" onClick={p.deshacer}>
            <Icono nombre="deshacer" />
            <span className="visually-hidden">Deshacer</span>
          </button>
          <button type="button" className="pz-herramienta" disabled={!p.puedeRehacer} title="Rehacer (Ctrl + Mayús + Z)" onClick={p.rehacer}>
            <Icono nombre="rehacer" />
            <span className="visually-hidden">Rehacer</span>
          </button>
        </div>
      </div>

      {insertar && (
        <div ref={menu} id={`${id}-insertar`} className="pz-menu pz-menu-insertar" role="menu" aria-label="Insertar en la pizarra">
          {INSERCIONES.map((i) => (
            <button
              key={i.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setInsertar(false);
                alInsertar(i.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  const lista = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])];
                  const k = lista.indexOf(e.currentTarget);
                  lista[(k + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % lista.length]?.focus();
                } else if (e.key === 'Escape') {
                  setInsertar(false);
                  botonInsertar.current?.focus();
                }
              }}
            >
              <Icono nombre={i.icono} />
              <span>
                <span className="pz-menu-nombre">{i.nombre}</span>
                <span className="pz-menu-ayuda">{i.ayuda}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {(opciones || hay > 0) && (
        <div className="pz-opciones" role="group" aria-label={hay && !CON_ESTILO.has(p.herramienta) ? 'Lo seleccionado' : `Opciones: ${NOMBRE_HERRAMIENTA[p.herramienta]}`}>
          {CON_ESTILO.has(p.herramienta) || p.seleccion.elementos.length > 0 ? (
            <>
              <fieldset className="pz-colores">
                <legend className="visually-hidden">Color</legend>
                {paleta.map((c) => (
                  <label key={c} className="pz-color" data-tinta={c} title={NOMBRE_COLOR[c]}>
                    <input type="radio" name={`${id}-color`} checked={p.estilo.color === c} onChange={() => p.cambiarEstilo({ color: c })} />
                    <span className="visually-hidden">{NOMBRE_COLOR[c]}</span>
                  </label>
                ))}
              </fieldset>
              {p.herramienta !== 'texto' && (
                <fieldset className="pz-grosores">
                  <legend className="visually-hidden">Grosor</legend>
                  {grosores.map((g) => (
                    <label key={g} className="pz-grosor" title={`Grosor ${g}`}>
                      <input type="radio" name={`${id}-grosor`} checked={Math.abs(p.estilo.grosor - g) < 0.01} onChange={() => p.cambiarEstilo({ grosor: g })} />
                      <span aria-hidden="true" style={{ blockSize: Math.min(18, Math.max(2, g * (p.herramienta === 'resaltador' ? 0.5 : 1))) }} />
                      <span className="visually-hidden">Grosor {g}</span>
                    </label>
                  ))}
                </fieldset>
              )}
              <label className="pz-opacidad">
                <span>Opacidad</span>
                <input type="range" min={10} max={100} step={5} value={Math.round(p.estilo.opacidad * 100)} onChange={(e) => p.cambiarEstilo({ opacidad: Number(e.target.value) / 100 })} />
                <output className="num">{Math.round(p.estilo.opacidad * 100)} %</output>
              </label>
            </>
          ) : null}
          {p.herramienta === 'borrador' && (
            <div className="pz-segmentado" role="radiogroup" aria-label="Qué borra">
              {(
                [
                  ['todo', 'Todo lo que toque'],
                  ['trazos', 'Solo trazos a mano'],
                ] as const
              ).map(([v, t]) => (
                <button key={v} type="button" role="radio" aria-checked={p.borrador === v} onClick={() => p.setBorrador(v)}>
                  {t}
                </button>
              ))}
            </div>
          )}
          {p.herramienta === 'borrador' && <p className="pz-nota">Solo borra tu trabajo: el contenido del Tutor no se borra.</p>}
          {p.herramienta === 'texto' && (
            <div className="pz-segmentado" role="radiogroup" aria-label="Tipo de texto">
              {(
                [
                  [true, 'Expresión matemática'],
                  [false, 'Texto'],
                ] as const
              ).map(([v, t]) => (
                <button key={t} type="button" role="radio" aria-checked={p.expresion === v} onClick={() => p.setExpresion(v)}>
                  {t}
                </button>
              ))}
            </div>
          )}
          {hay > 0 && (
            <div className="pz-acciones-seleccion">
              <span className="pz-nota num">
                {p.seleccion.bloques.length > 0 && `${p.seleccion.bloques.length} ${p.seleccion.bloques.length === 1 ? 'bloque' : 'bloques'}`}
                {p.seleccion.bloques.length > 0 && p.seleccion.elementos.length > 0 && ' · '}
                {p.seleccion.elementos.length > 0 && `${p.seleccion.elementos.length} ${p.seleccion.elementos.length === 1 ? 'elemento' : 'elementos'}`}
              </span>
              <button type="button" className="boton boton-primario boton-chico" onClick={alPreguntarSeleccion}>
                Preguntar sobre esto
              </button>
              <button type="button" className="boton-icono" title="Enfocar la selección (Mayús + 2)" onClick={() => p.controles.current?.enfocarSeleccion()}>
                <Icono nombre="enfocar" />
                <span className="visually-hidden">Enfocar la selección</span>
              </button>
              {p.seleccion.elementos.length > 0 && (
                <button type="button" className="boton-icono" title="Duplicar (Ctrl + D)" onClick={p.duplicarSeleccion}>
                  <Icono nombre="copiar" />
                  <span className="visually-hidden">Duplicar</span>
                </button>
              )}
              {(p.seleccion.elementos.length > 0 || propiosElegidos > 0) && (
                <button type="button" className="boton-icono" title="Eliminar lo seleccionado (Supr)" onClick={() => p.eliminarSeleccion(bloques)}>
                  <Icono nombre="borrar" />
                  <span className="visually-hidden">Eliminar lo seleccionado</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Zoom, ajuste y pantalla completa (abajo a la derecha de la pizarra). */
export function ControlesZoom({ p, alPantallaCompleta, completa }: { p: Pizarra; alPantallaCompleta: () => void; completa: boolean }) {
  const hay = p.seleccion.elementos.length + p.seleccion.bloques.length > 0;
  return (
    <div className="pz-zoom" role="group" aria-label="Vista de la pizarra">
      <button type="button" className="pz-herramienta" title="Alejar (−)" onClick={() => p.controles.current?.zoom(1 / 1.2)}>
        <Icono nombre="alejar" />
        <span className="visually-hidden">Alejar</span>
      </button>
      <button type="button" className="pz-zoom-valor num" title="Restablecer al 100 % (0)" onClick={() => p.controles.current?.restablecer()}>
        {Math.round(p.escala * 100)} %<span className="visually-hidden">: restablecer al 100 %</span>
      </button>
      <button type="button" className="pz-herramienta" title="Acercar (+)" onClick={() => p.controles.current?.zoom(1.2)}>
        <Icono nombre="acercar" />
        <span className="visually-hidden">Acercar</span>
      </button>
      <button type="button" className="pz-herramienta" title="Ajustar todo a la pantalla (Mayús + 1)" onClick={() => p.controles.current?.ajustarTodo()}>
        <Icono nombre="ajustar" />
        <span className="visually-hidden">Ajustar a la pantalla</span>
      </button>
      <button type="button" className="pz-herramienta" disabled={!hay} title="Enfocar la selección (Mayús + 2)" onClick={() => p.controles.current?.enfocarSeleccion()}>
        <Icono nombre="enfocar" />
        <span className="visually-hidden">Enfocar la selección</span>
      </button>
      <button type="button" className="pz-herramienta" aria-pressed={completa} title={completa ? 'Salir de la pantalla completa' : 'Pantalla completa'} onClick={alPantallaCompleta}>
        <Icono nombre="pantalla" />
        <span className="visually-hidden">{completa ? 'Salir de la pantalla completa' : 'Pantalla completa'}</span>
      </button>
    </div>
  );
}
