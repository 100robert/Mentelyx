'use client';

import { useCallback, useId, useRef, useState } from 'react';
import { Markdown } from '@/features/tutor';
import { Icono } from '@/components/ui/iconos';
import { conservarClave, consultar, crearConversacion, errorTutor, MAX_PREGUNTA, nuevaClave, type ErrorTutor, type Superficie } from '../tutor-api';

export type RespuestaEnLinea = { markdown: string; citas: number; modo: string; avisos: string[] };

/**
 * El mismo Tutor real del espacio educativo, en línea: abre una conversación al primer uso y consulta con una
 * Idempotency-Key estable por pregunta. Sirve para pedir ayuda sin salir de una actividad o para sugerir un temario.
 */
export function useTutorEnLinea(superficie: Superficie, contexto?: string) {
  const conversacion = useRef<string | null>(null);
  const pendiente = useRef<{ clave: string; pregunta: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<ErrorTutor | null>(null);
  const preguntar = useCallback(
    async (texto: string): Promise<RespuestaEnLinea | null> => {
      const completa = (contexto ? `${texto}\n\n(Contexto: ${contexto})` : texto).slice(0, MAX_PREGUNTA);
      if (!pendiente.current || pendiente.current.pregunta !== completa) pendiente.current = { clave: nuevaClave(), pregunta: completa };
      setEnviando(true);
      setError(null);
      try {
        conversacion.current ??= await crearConversacion(superficie);
        const r = await consultar({ conversacionId: conversacion.current, pregunta: completa, clave: pendiente.current.clave });
        pendiente.current = null;
        return { markdown: r.segmentos.map((s) => s.markdown).join('\n\n'), citas: r.citas.length, modo: r.modoFuentes, avisos: r.avisos };
      } catch (e) {
        const err = errorTutor(e);
        setError(err);
        if (!conservarClave(err.codigo)) pendiente.current = null;
        return null;
      } finally {
        setEnviando(false);
      }
    },
    [superficie, contexto],
  );
  return { preguntar, enviando, error, conversacionId: () => conversacion.current };
}

/** Caja de ayuda del Tutor dentro de una actividad: la persona edita la pregunta y la envía; la respuesta es orientativa. */
export function TutorEnLinea({ preguntaInicial, contexto, titulo = 'Pedir ayuda al Tutor', nota }: { preguntaInicial: string; contexto?: string; titulo?: string; nota?: string }) {
  const id = useId();
  const [pregunta, setPregunta] = useState(preguntaInicial);
  const [respuesta, setRespuesta] = useState<RespuestaEnLinea | null>(null);
  const { preguntar, enviando, error } = useTutorEnLinea('EJERCICIO', contexto);
  return (
    <section className="tutor-en-linea" aria-labelledby={`${id}-titulo`}>
      <h4 id={`${id}-titulo`}>
        <img src="/marca/mentelyx-buho-64.webp" width={24} height={24} alt="" /> {titulo}
      </h4>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!pregunta.trim()) return;
          const r = await preguntar(pregunta.trim());
          if (r) setRespuesta(r);
        }}
      >
        <label htmlFor={`${id}-pregunta`} className="visually-hidden">
          Tu pregunta al Tutor
        </label>
        <textarea id={`${id}-pregunta`} rows={3} maxLength={MAX_PREGUNTA} value={pregunta} onChange={(e) => setPregunta(e.target.value)} />
        <button type="submit" className="boton boton-secundario boton-chico" disabled={enviando || !pregunta.trim()}>
          {enviando ? <span className="girador keep-motion" aria-hidden="true" /> : <Icono nombre="enviar" tamano={16} />}
          {enviando ? 'Consultando…' : 'Preguntar'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error.texto}</span>
        </p>
      )}
      <div aria-live="polite">
        {respuesta && (
          <div className="tutor-en-linea-respuesta">
            <div className="explicacion estudio">
              <Markdown texto={respuesta.markdown} />
            </div>
            <p className="suave">{nota ?? 'Orientación del Tutor: no es una nota ni una corrección oficial.'}</p>
          </div>
        )}
      </div>
    </section>
  );
}
