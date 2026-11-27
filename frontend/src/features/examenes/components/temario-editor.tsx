'use client';

import { useId, useState } from 'react';
import { useTutorEnLinea } from '@/features/estudio';
import { Icono } from '@/components/ui/iconos';
import type { OrigenTema, TemaVista } from '../preparaciones/modelo';
import { aceptarTema, agregarTema, editarTema, moverTema, quitarTema, sugerenciasDeTexto } from '../temario/temario';

const ORIGEN: Record<OrigenTema, string> = { persona: 'Escrito por ti', fuentes: 'De tus fuentes', tutor: 'Sugerido por el Tutor · revísalo' };

/**
 * Temario editable: agregar, editar, quitar y reordenar con botones (accesible con teclado). Las sugerencias del Tutor
 * (llamada real) llegan marcadas y se aceptan o se quitan; no se extrae temario de PDF: el backend no lo hace.
 */
export function TemarioEditor({ temas, alCambiar, asignatura, maximo }: { temas: TemaVista[]; alCambiar: (t: TemaVista[]) => void; asignatura: string; maximo?: number }) {
  const id = useId();
  const [nuevo, setNuevo] = useState('');
  const [aviso, setAviso] = useState('');
  const tutor = useTutorEnLinea('LECCION');
  const lleno = maximo !== undefined && temas.length >= maximo;

  async function sugerir() {
    setAviso('');
    const r = await tutor.preguntar(
      `Propón el temario de un examen de ${asignatura || 'la asignatura'}: una lista de 4 a 8 temas, uno por línea con un guion, sin explicaciones.`,
    );
    if (!r) return;
    const s = sugerenciasDeTexto(r.markdown).filter((t) => !temas.some((x) => x.titulo.toLowerCase() === t.toLowerCase()));
    if (s.length === 0) {
      setAviso('El Tutor no devolvió una lista de temas que se pueda usar. Puedes escribirlos tú.');
      return;
    }
    let lista = temas;
    for (const t of s) if (maximo === undefined || lista.length < maximo) lista = agregarTema(lista, t, 'tutor');
    alCambiar(lista);
    setAviso(`El Tutor sugirió ${s.length} ${s.length === 1 ? 'tema' : 'temas'}: revísalos antes de guardar.`);
  }

  return (
    <div className="temario-editor">
      {temas.length > 0 ? (
        <ol className="temario-lista">
          {temas.map((t, k) => (
            <li key={t.codigo} data-origen={t.origen}>
              <span className="temario-numero num" aria-hidden="true">
                {k + 1}
              </span>
              <label className="visually-hidden" htmlFor={`${id}-${t.codigo}`}>
                Tema {k + 1}
              </label>
              <input id={`${id}-${t.codigo}`} value={t.titulo} maxLength={160} onChange={(e) => alCambiar(editarTema(temas, t.codigo, e.target.value))} />
              <span className="temario-origen">{ORIGEN[t.origen]}</span>
              <span className="temario-acciones">
                {t.origen === 'tutor' && (
                  <button type="button" className="boton boton-terciario boton-chico" onClick={() => alCambiar(aceptarTema(temas, t.codigo))}>
                    Aceptar
                  </button>
                )}
                <button type="button" className="boton-icono" disabled={k === 0} onClick={() => alCambiar(moverTema(temas, t.codigo, -1))}>
                  <span aria-hidden="true">↑</span>
                  <span className="visually-hidden">Subir «{t.titulo}»</span>
                </button>
                <button type="button" className="boton-icono" disabled={k === temas.length - 1} onClick={() => alCambiar(moverTema(temas, t.codigo, 1))}>
                  <span aria-hidden="true">↓</span>
                  <span className="visually-hidden">Bajar «{t.titulo}»</span>
                </button>
                <button type="button" className="boton-icono" onClick={() => alCambiar(quitarTema(temas, t.codigo))}>
                  <Icono nombre="cerrar" tamano={16} />
                  <span className="visually-hidden">Quitar «{t.titulo}»</span>
                </button>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="suave">Todavía no hay temas. Escribe el primero o pide una sugerencia al Tutor.</p>
      )}
      <div className="temario-agregar">
        <label htmlFor={`${id}-nuevo`} className="visually-hidden">
          Nuevo tema
        </label>
        <input
          id={`${id}-nuevo`}
          value={nuevo}
          maxLength={160}
          placeholder={lleno ? `Máximo ${maximo} temas por ahora` : 'Escribe un tema y pulsa Agregar'}
          disabled={lleno}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              alCambiar(agregarTema(temas, nuevo));
              setNuevo('');
            }
          }}
        />
        <button
          type="button"
          className="boton boton-secundario boton-chico"
          disabled={!nuevo.trim() || lleno}
          onClick={() => {
            alCambiar(agregarTema(temas, nuevo));
            setNuevo('');
          }}
        >
          Agregar
        </button>
        <button type="button" className="boton boton-terciario boton-chico" disabled={tutor.enviando || lleno} onClick={() => void sugerir()}>
          {tutor.enviando ? 'Consultando al Tutor…' : 'Pedir sugerencias al Tutor'}
        </button>
      </div>
      <p className="suave temario-nota" aria-live="polite">
        {tutor.error ? tutor.error.texto : aviso || 'Las sugerencias del Tutor usan una consulta de tu plan y quedan marcadas para que las revises.'}
      </p>
    </div>
  );
}
