'use client';

import { useEffect, useId, useState } from 'react';
import { verificarNumero, type Verificacion } from '@/features/matematicas';
import type { PropsBloque } from './basicos';

/**
 * Actividad con comprobación inmediata: respuesta numérica (fracciones y coma decimal, con el analizador seguro) u opción
 * múltiple. La pista y la explicación se muestran a pedido. El resultado no se guarda: la interfaz lo dice.
 */
export function BloqueEjercicioVista({ bloque, alPreguntar }: PropsBloque<'ejercicio'>) {
  const c = bloque.contenido;
  const id = useId();
  const [respuesta, setRespuesta] = useState('');
  const [opcion, setOpcion] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Verificacion | null>(null);
  const [pista, setPista] = useState(false);
  const [solucion, setSolucion] = useState(false);
  const [intentos, setIntentos] = useState(0);

  // Si el enunciado cambia (por ejemplo, al mover un parámetro del gráfico), la actividad empieza de nuevo.
  const clave = c.modo === 'numero' ? `${c.enunciado}|${c.respuesta}` : c.enunciado;
  useEffect(() => {
    setRespuesta('');
    setOpcion(null);
    setResultado(null);
    setSolucion(false);
    setIntentos(0);
  }, [clave]);

  function comprobar() {
    let r: Verificacion;
    if (c.modo === 'numero') r = verificarNumero(respuesta, c.respuesta, c.tolerancia ?? 1e-6);
    else r = opcion ? (opcion === c.correcta ? { estado: 'correcta', mensaje: 'Correcto.' } : { estado: 'incorrecta', mensaje: 'Todavía no: vuelve a mirar las opciones.' }) : { estado: 'invalida', mensaje: 'Elige una opción.' };
    setResultado(r);
    if (r.estado !== 'invalida') setIntentos((n) => n + 1);
  }

  return (
    <form
      className="bloque-ejercicio"
      onSubmit={(e) => {
        e.preventDefault();
        comprobar();
      }}
    >
      <p className="ejercicio-enunciado" id={`${id}-enunciado`}>
        {c.enunciado}
      </p>
      {c.modo === 'numero' ? (
        <div className="ejercicio-respuesta">
          <label htmlFor={`${id}-respuesta`}>Tu respuesta</label>
          <input
            id={`${id}-respuesta`}
            inputMode="decimal"
            autoComplete="off"
            value={respuesta}
            maxLength={60}
            onChange={(e) => {
              setRespuesta(e.target.value);
              setResultado(null);
            }}
            aria-describedby={`${id}-enunciado ${id}-ayuda`}
            aria-invalid={resultado?.estado === 'invalida' || undefined}
          />
          <p id={`${id}-ayuda`} className="suave">
            Puedes escribir enteros, decimales con coma o fracciones (por ejemplo, −3/2).
          </p>
        </div>
      ) : (
        <fieldset className="ejercicio-opciones">
          <legend className="visually-hidden">Opciones</legend>
          {c.opciones.map((o) => (
            <label key={o.id} className="ejercicio-opcion" data-elegida={opcion === o.id || undefined}>
              <input
                type="radio"
                name={`${id}-opcion`}
                value={o.id}
                checked={opcion === o.id}
                onChange={() => {
                  setOpcion(o.id);
                  setResultado(null);
                }}
              />
              {o.texto}
            </label>
          ))}
        </fieldset>
      )}
      <div className="acciones">
        <button type="submit" className="boton boton-primario boton-chico">
          Comprobar
        </button>
        {c.pista && !pista && (
          <button type="button" className="boton boton-terciario boton-chico" onClick={() => setPista(true)}>
            Ver una pista
          </button>
        )}
        {c.explicacion && intentos > 0 && !solucion && (
          <button type="button" className="boton boton-terciario boton-chico" onClick={() => setSolucion(true)}>
            Ver la solución
          </button>
        )}
        {alPreguntar && (
          <button type="button" className="boton boton-terciario boton-chico" onClick={() => alPreguntar(`Necesito ayuda con esta actividad, sin que me des la respuesta: ${c.enunciado}`)}>
            Pedir ayuda al Tutor
          </button>
        )}
      </div>
      <div aria-live="polite">
        {resultado && (
          <p className={`ejercicio-resultado mensaje ${resultado.estado === 'correcta' ? 'mensaje-exito' : resultado.estado === 'incorrecta' ? 'mensaje-info' : 'mensaje-error'}`}>{resultado.mensaje}</p>
        )}
        {pista && c.pista && <p className="ejercicio-pista">Pista: {c.pista}</p>}
        {(solucion || resultado?.estado === 'correcta') && c.explicacion && <p className="ejercicio-explicacion">{c.explicacion}</p>}
      </div>
      <p className="ejercicio-nota suave">Tus respuestas no se guardan.</p>
    </form>
  );
}
