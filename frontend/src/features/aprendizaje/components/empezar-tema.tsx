'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { Icono } from '@/components/ui/iconos';
import { useHidratado } from '@/hooks/hidratado';
import { apiCliente, mensajeDeError } from '@/lib/api-cliente';
import { primeraPregunta, type Opciones } from '../primera-pregunta';

const EJEMPLOS = ['Agujeros negros', 'Derivadas desde cero', 'El motor de combustión', 'La Revolución francesa'];
/**
 * Empezar a aprender con lenguaje natural: una sola línea, sin formularios previos. Crea un tema (un espacio de M2,
 * `POST /espacios`) con lo que la persona escribió y abre su espacio con la consulta al Tutor lista para usarse.
 * Con `?empezar=1` (intención «aprendizaje» desde la landing) el campo recibe el foco.
 */
export function EmpezarTema({ titulo = '¿Qué quieres aprender hoy?', compacto = false }: { titulo?: string; compacto?: boolean }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const hidratado = useHidratado();
  const campo = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opciones, setOpciones] = useState<Opciones>({ profundidad: 'inicial', previos: 'nada', objetivo: 'entender' });
  const id = useId();

  useEffect(() => {
    if (parametros.get('empezar') === '1') campo.current?.focus();
  }, [parametros]);

  async function empezar() {
    const tema = texto.trim();
    if (!tema) return;
    setEnviando(true);
    setError(null);
    try {
      const espacio = await apiCliente<{ id: string }>('/espacios', { metodo: 'POST', cuerpo: { titulo: tema.slice(0, 200) } });
      // El tema abre una sesión nueva con la primera pregunta preparada en el Tutor (sin enviarla: la persona la revisa).
      router.push(`/espacios/${espacio.id}?nueva=1&pregunta=${encodeURIComponent(primeraPregunta(tema, opciones).slice(0, 600))}`);
      router.refresh();
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  return (
    <form
      method="post"
      className={compacto ? 'empezar empezar-compacto' : 'empezar'}
      aria-labelledby={`${id}-titulo`}
      onSubmit={(e) => {
        e.preventDefault();
        void empezar();
      }}
    >
      <label id={`${id}-titulo`} htmlFor={`${id}-campo`} className="empezar-titulo">
        {titulo}
      </label>
      <div className="empezar-fila">
        <input
          ref={campo}
          id={`${id}-campo`}
          className="empezar-campo"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Por ejemplo: quiero entender los agujeros negros"
          maxLength={200}
          autoComplete="off"
          required
          aria-describedby={error ? `${id}-error` : `${id}-ayuda`}
        />
        <button type="submit" className="boton boton-primario boton-grande" disabled={!hidratado || enviando || !texto.trim()}>
          {enviando ? 'Preparando…' : 'Empezar'}
          {!enviando && <Icono nombre="enviar" tamano={18} />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      ) : (
        <p id={`${id}-ayuda`} className="empezar-ayuda">
          Escribe con tus palabras: un tema, una duda o lo que quieres lograr. Puedes sumar tus apuntes después.
        </p>
      )}
      {!compacto && (
        <details className="empezar-opciones">
          <summary>Ajustar cómo empezar</summary>
          <div className="empezar-opciones-grupos">
            {(
              [
                ['profundidad', 'Profundidad', { inicial: 'Desde cero', intermedio: 'Intermedia', avanzado: 'Avanzada' }],
                ['previos', 'Lo que ya sabes', { nada: 'Nada', algo: 'Algo', bastante: 'Lo básico' }],
                ['objetivo', 'Para qué', { entender: 'Entender', practicar: 'Practicar', duda: 'Una duda' }],
              ] as const
            ).map(([clave, titulo, valores]) => (
              <fieldset key={clave}>
                <legend>{titulo}</legend>
                {Object.entries(valores).map(([v, texto]) => (
                  <label key={v} className="empezar-opcion">
                    <input type="radio" name={`${id}-${clave}`} value={v} checked={opciones[clave] === v} onChange={() => setOpciones((o) => ({ ...o, [clave]: v }) as Opciones)} />
                    {texto}
                  </label>
                ))}
              </fieldset>
            ))}
          </div>
          <p className="suave">Con esto se prepara tu primera pregunta al Tutor; podrás cambiarla antes de enviarla.</p>
        </details>
      )}
      {!compacto && (
        <div className="empezar-ejemplos" role="group" aria-label="Ejemplos para empezar">
          {EJEMPLOS.map((e) => (
            <button key={e} type="button" className="ejemplo" onClick={() => {
              setTexto(e);
              campo.current?.focus();
            }}>
              {e}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
