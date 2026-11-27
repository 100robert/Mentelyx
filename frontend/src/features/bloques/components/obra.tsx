'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { PropsBloque } from './basicos';

/**
 * Lectura de una obra: la imagen con zoom y desplazamiento, regiones que se eligen tocando la imagen o desde la lista
 * (accesible con teclado), líneas de composición y notas propias que no se guardan. El crédito y la licencia son
 * obligatorios (la validación rechaza una obra sin ellos) y siempre se muestran.
 */
export function BloqueObraVista({ bloque, interaccion, despachar, alPreguntar }: PropsBloque<'obra'>) {
  const c = bloque.contenido;
  const id = useId();
  const marco = useRef<HTMLDivElement>(null);
  const [lineas, setLineas] = useState(true);
  const [regiones, setRegiones] = useState(true);
  const [completa, setCompleta] = useState(false);
  const [notas, setNotas] = useState<Array<{ id: number; region: string | null; texto: string }>>([]);
  const [borrador, setBorrador] = useState('');
  const zoom = interaccion.vista?.tipo === 'zoom' ? interaccion.vista.nivel : 1;
  const elegida = c.regiones.find((r) => r.id === interaccion.seleccion);
  const lineaElegida = (c.lineas ?? []).find((l) => l.id === interaccion.resaltado);
  const credito = (bloque.referencias ?? []).find((r) => r.tipo === 'credito');

  useEffect(() => {
    const alCambiar = () => setCompleta(document.fullscreenElement === marco.current);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  const elegir = (region: string | null) => despachar({ accion: 'seleccionar-estructura', bloqueId: bloque.id, parte: region });
  const ampliar = (nivel: number) => despachar({ accion: 'cambiar-vista', bloqueId: bloque.id, vista: { tipo: 'zoom', nivel: Math.min(8, Math.max(1, nivel)) } });

  return (
    <div ref={marco} className="bloque-obra" data-completa={completa || undefined}>
      <div className="obra-barra" role="toolbar" aria-label="Controles de la obra">
        <div className="obra-grupo">
          <button type="button" className="boton-icono" onClick={() => ampliar(zoom / 1.5)} disabled={zoom <= 1}>
            <span aria-hidden="true">−</span>
            <span className="visually-hidden">Reducir</span>
          </button>
          <span className="num obra-zoom" aria-live="polite">
            {Math.round(zoom * 100)} %
          </span>
          <button type="button" className="boton-icono" onClick={() => ampliar(zoom * 1.5)} disabled={zoom >= 8}>
            <span aria-hidden="true">+</span>
            <span className="visually-hidden">Ampliar</span>
          </button>
        </div>
        <div className="obra-grupo">
          <button type="button" className="boton boton-terciario boton-chico" aria-pressed={regiones} onClick={() => setRegiones((r) => !r)}>
            Regiones
          </button>
          {(c.lineas?.length ?? 0) > 0 && (
            <button type="button" className="boton boton-terciario boton-chico" aria-pressed={lineas} onClick={() => setLineas((l) => !l)}>
              Líneas de composición
            </button>
          )}
          <button type="button" className="boton boton-terciario boton-chico" aria-pressed={completa} onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void marco.current?.requestFullscreen?.().catch(() => {}))}>
            {completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
          </button>
        </div>
      </div>

      <div className="obra-cuerpo">
        <div className="obra-vista" tabIndex={0} aria-label={`${bloque.accesibilidad.descripcion} Ampliación: ${Math.round(zoom * 100)} %.`} role="group">
          <div className="obra-lienzo" style={{ inlineSize: `${zoom * 100}%` }}>
            <img
              src={c.imagen.src}
              srcSet={c.imagen.srcChica ? `${c.imagen.srcChica} 760w, ${c.imagen.src} ${c.imagen.ancho}w` : undefined}
              sizes={c.imagen.srcChica ? `(min-width: 64rem) ${Math.round(55 * zoom)}vw, ${Math.round(92 * zoom)}vw` : undefined}
              width={c.imagen.ancho}
              height={c.imagen.alto}
              alt=""
              decoding="async"
            />
            <svg viewBox={`0 0 ${c.imagen.ancho} ${c.imagen.alto}`} aria-hidden="true">
              {lineas &&
                (c.lineas ?? []).map((l) => (
                  <polyline key={l.id} points={l.puntos.map((p) => p.join(',')).join(' ')} className="obra-linea" data-resaltado={l.id === interaccion.resaltado || undefined} onClick={() => despachar({ accion: 'resaltar', bloqueId: bloque.id, objetivo: l.id === interaccion.resaltado ? null : l.id })} />
                ))}
              {regiones &&
                c.regiones.map((r) =>
                  r.forma.tipo === 'circulo' ? (
                    <circle key={r.id} cx={r.forma.centro[0]} cy={r.forma.centro[1]} r={r.forma.radio} className="obra-region" data-elegida={r.id === interaccion.seleccion || undefined} onClick={() => elegir(r.id === interaccion.seleccion ? null : r.id)} />
                  ) : (
                    <rect
                      key={r.id}
                      x={Math.min(r.forma.desde[0], r.forma.hasta[0])}
                      y={Math.min(r.forma.desde[1], r.forma.hasta[1])}
                      width={Math.abs(r.forma.hasta[0] - r.forma.desde[0])}
                      height={Math.abs(r.forma.hasta[1] - r.forma.desde[1])}
                      rx={12}
                      className="obra-region"
                      data-elegida={r.id === interaccion.seleccion || undefined}
                      onClick={() => elegir(r.id === interaccion.seleccion ? null : r.id)}
                    />
                  ),
                )}
            </svg>
          </div>
        </div>

        <div className="obra-panel">
          <fieldset className="obra-regiones">
            <legend>Qué mirar</legend>
            <ul>
              {c.regiones.map((r) => (
                <li key={r.id}>
                  <button type="button" className="obra-region-boton" aria-pressed={r.id === interaccion.seleccion} onClick={() => elegir(r.id === interaccion.seleccion ? null : r.id)}>
                    {r.etiqueta}
                  </button>
                </li>
              ))}
              {(c.lineas ?? []).map((l) => (
                <li key={l.id}>
                  <button type="button" className="obra-region-boton obra-linea-boton" aria-pressed={l.id === interaccion.resaltado} onClick={() => despachar({ accion: 'resaltar', bloqueId: bloque.id, objetivo: l.id === interaccion.resaltado ? null : l.id })}>
                    {l.etiqueta}
                  </button>
                </li>
              ))}
            </ul>
          </fieldset>
          <div className="obra-detalle" aria-live="polite">
            {elegida || lineaElegida ? (
              <>
                <h4>{(elegida ?? lineaElegida)!.etiqueta}</h4>
                <p>{(elegida ?? lineaElegida)!.texto}</p>
                {alPreguntar && (
                  <button type="button" className="enlace-accion" onClick={() => alPreguntar(`En «${bloque.titulo ?? 'la obra'}», ¿qué significa este detalle: ${(elegida ?? lineaElegida)!.etiqueta}?`)}>
                    Preguntar al Tutor por este detalle
                  </button>
                )}
              </>
            ) : (
              <p className="suave">Elige una región o una línea para leer la obra por partes.</p>
            )}
          </div>
          <form
            className="obra-notas"
            onSubmit={(e) => {
              e.preventDefault();
              const t = borrador.trim();
              if (!t) return;
              setNotas((n) => [...n, { id: Date.now(), region: elegida?.etiqueta ?? null, texto: t.slice(0, 500) }]);
              setBorrador('');
            }}
          >
            <label htmlFor={`${id}-nota`}>Tu nota{elegida ? ` sobre «${elegida.etiqueta}»` : ''}</label>
            <textarea id={`${id}-nota`} rows={2} maxLength={500} value={borrador} onChange={(e) => setBorrador(e.target.value)} />
            <div className="acciones">
              <button type="submit" className="boton boton-secundario boton-chico" disabled={!borrador.trim()}>
                Agregar nota
              </button>
              <span className="suave">Solo en esta pantalla: no se guardan.</span>
            </div>
            {notas.length > 0 && (
              <ul className="obra-lista-notas">
                {notas.map((n) => (
                  <li key={n.id}>
                    {n.region && <strong>{n.region}: </strong>}
                    {n.texto}
                    <button type="button" className="boton-icono" onClick={() => setNotas((l) => l.filter((x) => x.id !== n.id))}>
                      <span aria-hidden="true">×</span>
                      <span className="visually-hidden">Borrar la nota</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </form>
        </div>
      </div>
      {credito && credito.tipo === 'credito' && (
        <p className="obra-credito">
          {credito.autor}, «{credito.titulo}»{credito.fecha ? `, ${credito.fecha}` : ''}.{credito.institucion ? ` ${credito.institucion}.` : ''} {credito.licencia}.{' '}
          {credito.enlace && (
            <a href={credito.enlace} rel="noopener noreferrer" target="_blank">
              Ficha de la obra<span className="visually-hidden"> (abre en otra pestaña)</span>
            </a>
          )}
        </p>
      )}
    </div>
  );
}
