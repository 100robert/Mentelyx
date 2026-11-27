'use client';

import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import { ACCIONES, MODOS, type AccionRapida, type ModoPedagogico } from '../pedagogia';

export type Ficha = { id: string; texto: string; icono: NombreIcono; quitar: () => void; detalle?: string };
export type OpcionMas = { id: string; texto: string; ayuda: string; icono: NombreIcono; elegir: () => void };
export type ErrorEntrada = { texto: string; reintentable: boolean; ingresar: boolean };

/**
 * Entrada del Tutor, abajo de la pizarra: campo amplio, botón «+» (solo lo que funciona de verdad), fichas de lo que se
 * envía (contexto elegido, fuentes, texto seleccionado) que se pueden quitar, modo pedagógico, acciones rápidas según la
 * actividad, enviar, indicador de proceso y cancelar. Los errores se muestran tal cual, con reintento si sirve.
 */
export function EntradaTutor(o: {
  campo: RefObject<HTMLTextAreaElement | null>;
  pregunta: string;
  setPregunta: (t: string) => void;
  enviando: string | null;
  error: ErrorEntrada | null;
  aviso: ReactNode;
  alEnviar: (accion?: AccionRapida) => void;
  alCancelar: () => void;
  alReintentar: () => void;
  modo: ModoPedagogico;
  setModo: (m: ModoPedagogico) => void;
  modos: ModoPedagogico[];
  acciones: AccionRapida[];
  fichas: Ficha[];
  opcionesMas: OpcionMas[];
  info: string;
  estadoProceso: string;
  ultima: ReactNode;
  maximo: number;
  hidratado: boolean;
}) {
  const id = useId();
  const [mas, setMas] = useState(false);
  const [modos, setModos] = useState(false);
  const menuMas = useRef<HTMLDivElement>(null);
  const menuModos = useRef<HTMLDivElement>(null);
  const botonMas = useRef<HTMLButtonElement>(null);
  const botonModo = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!mas && !modos) return;
    const fuera = (e: PointerEvent) => {
      const t = e.target as Node;
      if (mas && !menuMas.current?.contains(t) && !botonMas.current?.contains(t)) setMas(false);
      if (modos && !menuModos.current?.contains(t) && !botonModo.current?.contains(t)) setModos(false);
    };
    document.addEventListener('pointerdown', fuera);
    requestAnimationFrame(() => (mas ? menuMas : menuModos).current?.querySelector<HTMLButtonElement>('[role^="menuitem"]')?.focus());
    return () => document.removeEventListener('pointerdown', fuera);
  }, [mas, modos]);

  const navegarMenu = (e: React.KeyboardEvent<HTMLElement>, menu: RefObject<HTMLDivElement | null>, cerrar: () => void, boton: RefObject<HTMLButtonElement | null>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      cerrar();
      boton.current?.focus();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const lista = [...(menu.current?.querySelectorAll<HTMLButtonElement>('[role^="menuitem"]') ?? [])];
    const k = lista.indexOf(document.activeElement as HTMLButtonElement);
    lista[(k + (e.key === 'ArrowDown' ? 1 : -1) + lista.length) % lista.length]?.focus();
  };

  const ocupado = !!o.enviando;
  return (
    <div className="pz-entrada">
      {o.error && (
        <div role="alert" className="mensaje mensaje-error pz-entrada-error">
          <Icono nombre="aviso" />
          <span>{o.error.texto}</span>
          {o.error.reintentable && (
            <button type="button" className="boton boton-secundario boton-chico" onClick={o.alReintentar} disabled={ocupado}>
              <Icono nombre="reintentar" />
              Reintentar
            </button>
          )}
          {o.error.ingresar && (
            <a className="boton boton-secundario boton-chico" href="/auth/ingresar">
              Ingresar
            </a>
          )}
        </div>
      )}
      {o.aviso}
      {o.acciones.length > 0 && (
        <div className="pz-rapidas" role="group" aria-label="Acciones rápidas del Tutor">
          {o.acciones.map((a) => (
            <button key={a} type="button" className="pz-rapida" disabled={ocupado || !o.hidratado} onClick={() => o.alEnviar(a)}>
              {ACCIONES[a].texto}
            </button>
          ))}
        </div>
      )}
      <form
        className="pz-consulta"
        method="post"
        aria-busy={ocupado}
        onSubmit={(e) => {
          e.preventDefault();
          o.alEnviar();
        }}
      >
        {o.fichas.length > 0 && (
          <ul className="pz-fichas" aria-label="Se enviará con tu pregunta">
            {o.fichas.map((f) => (
              <li key={f.id} className="pz-ficha" title={f.detalle}>
                <Icono nombre={f.icono} tamano={16} />
                <span className="pz-ficha-texto">{f.texto}</span>
                <button type="button" className="pz-ficha-quitar" onClick={f.quitar}>
                  <Icono nombre="cerrar" tamano={14} />
                  <span className="visually-hidden">Quitar: {f.texto}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="pz-consulta-fila">
          <div className="pz-mas">
            <button
              ref={botonMas}
              type="button"
              className="pz-boton-mas"
              aria-expanded={mas}
              aria-controls={`${id}-mas`}
              aria-haspopup="menu"
              disabled={o.opcionesMas.length === 0}
              title="Agregar fuentes, recursos o contenido de la pizarra"
              onClick={() => {
                setModos(false);
                setMas((v) => !v);
              }}
            >
              <Icono nombre="mas" />
              <span className="visually-hidden">Agregar a la pregunta</span>
            </button>
            {mas && (
              <div ref={menuMas} id={`${id}-mas`} className="pz-menu pz-menu-mas" role="menu" aria-label="Agregar a la pregunta" onKeyDown={(e) => navegarMenu(e, menuMas, () => setMas(false), botonMas)}>
                {o.opcionesMas.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMas(false);
                      op.elegir();
                    }}
                  >
                    <Icono nombre={op.icono} />
                    <span>
                      <span className="pz-menu-nombre">{op.texto}</span>
                      <span className="pz-menu-ayuda">{op.ayuda}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <label htmlFor={`${id}-pregunta`} className="visually-hidden">
            Tu pregunta al Tutor
          </label>
          <textarea
            ref={o.campo}
            id={`${id}-pregunta`}
            rows={1}
            maxLength={o.maximo}
            value={o.pregunta}
            onChange={(e) => o.setPregunta(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            placeholder={MODOS[o.modo].api === 'PISTA' ? 'Escribe tu duda o pide ayuda con lo que estás resolviendo' : 'Pregunta al Tutor lo que quieras entender'}
            aria-describedby={`${id}-info`}
          />
          {ocupado ? (
            <button type="button" className="boton boton-secundario pz-enviar" onClick={o.alCancelar}>
              <Icono nombre="detener" />
              <span className="pz-enviar-texto">Cancelar</span>
            </button>
          ) : (
            <button type="submit" className="boton boton-primario pz-enviar" disabled={!o.hidratado || !o.pregunta.trim()}>
              <Icono nombre="enviar" />
              <span className="pz-enviar-texto">Enviar</span>
            </button>
          )}
        </div>
        <div className="pz-consulta-pie">
          <div className="pz-modo">
            <button
              ref={botonModo}
              type="button"
              className="pz-modo-boton"
              aria-expanded={modos}
              aria-controls={`${id}-modos`}
              aria-haspopup="menu"
              onClick={() => {
                setMas(false);
                setModos((v) => !v);
              }}
            >
              <span className="pz-modo-rotulo">Modo:</span> {MODOS[o.modo].nombre}
              <Icono nombre="abajo" tamano={14} />
            </button>
            {modos && (
              <div ref={menuModos} id={`${id}-modos`} className="pz-menu pz-menu-modos" role="menu" aria-label="Modo del Tutor" onKeyDown={(e) => navegarMenu(e, menuModos, () => setModos(false), botonModo)}>
                {o.modos.map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="menuitemradio"
                    aria-checked={o.modo === m}
                    onClick={() => {
                      o.setModo(m);
                      setModos(false);
                      botonModo.current?.focus();
                    }}
                  >
                    <span>
                      <span className="pz-menu-nombre">{MODOS[m].nombre}</span>
                      <span className="pz-menu-ayuda">{MODOS[m].descripcion}</span>
                    </span>
                    {o.modo === m && <Icono nombre="listo" tamano={16} />}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p id={`${id}-info`} className="pz-info">
            {ocupado ? (
              <span className="pz-proceso" role="status">
                <span className="girador keep-motion" aria-hidden="true" />
                {o.estadoProceso}
              </span>
            ) : (
              <>
                {o.info} <span className="solo-escritorio">Enter envía · Mayús + Enter, otra línea.</span>
              </>
            )}
          </p>
          {!ocupado && o.ultima}
        </div>
      </form>
    </div>
  );
}
