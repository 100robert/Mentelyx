'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { FormulaSegura } from '@/features/bloques';
import type { Bloque } from '@/features/bloques/esquema';
import { bloqueDocumento, bloqueEcuacion, bloqueEjercicio, bloqueGrafico, bloqueModelo, bloqueTabla, DOCUMENTOS_INSERTABLES, expresionALatex, MODELOS_INSERTABLES } from '../insercion';
import type { Insercion } from './barra-herramientas';

const TITULOS: Record<Exclude<Insercion, 'diagrama'>, string> = {
  ecuacion: 'Insertar una ecuación',
  grafico: 'Insertar un gráfico',
  tabla: 'Insertar una tabla',
  ejercicio: 'Escribir un ejercicio',
  modelo: 'Insertar un modelo 3D',
  documento: 'Insertar un documento',
  imagen: 'Insertar una imagen de tu equipo',
};

/** Diálogo de las herramientas educativas: crea un bloque propio validado (o elige una imagen local). */
export function DialogoInsertar({ tipo, orden, alCerrar, alBloque, alImagen }: { tipo: Exclude<Insercion, 'diagrama'>; orden: number; alCerrar: () => void; alBloque: (b: Bloque) => void; alImagen: (f: File) => void }) {
  const id = useId();
  const dialogo = useRef<HTMLDialogElement>(null);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [columnas, setColumnas] = useState(['x', 'y']);
  const [filas, setFilas] = useState<string[][]>([['', ''], ['', ''], ['', '']]);
  const [modelo, setModelo] = useState<(typeof MODELOS_INSERTABLES)[number]['clave']>('metano');
  const [documento, setDocumento] = useState<string>(DOCUMENTOS_INSERTABLES[0].src);
  const [archivo, setArchivo] = useState<File | null>(null);

  useEffect(() => {
    const d = dialogo.current;
    if (d && !d.open) d.showModal();
  }, []);

  const crear = () => {
    setError(null);
    if (tipo === 'imagen') {
      if (!archivo) return setError('Elige una imagen de tu equipo.');
      if (!archivo.type.startsWith('image/')) return setError('El archivo no es una imagen.');
      if (archivo.size > 15 * 1024 * 1024) return setError('La imagen pesa más de 15 MB.');
      alImagen(archivo);
      return alCerrar();
    }
    const r =
      tipo === 'ecuacion'
        ? bloqueEcuacion(texto, orden)
        : tipo === 'grafico'
          ? bloqueGrafico(texto, orden)
          : tipo === 'tabla'
            ? bloqueTabla(columnas, filas, orden)
            : tipo === 'ejercicio'
              ? bloqueEjercicio(texto, orden)
              : tipo === 'modelo'
                ? bloqueModelo(modelo, orden)
                : bloqueDocumento(documento as (typeof DOCUMENTOS_INSERTABLES)[number]['src'] | 'local', orden);
    if (!r.ok) return setError(r.mensaje);
    alBloque(r.bloque);
    alCerrar();
  };

  const vista = tipo === 'ecuacion' && texto.trim() ? expresionALatex(texto) : null;
  return (
    <dialog
      ref={dialogo}
      className="pz-dialogo"
      aria-labelledby={`${id}-titulo`}
      onClose={alCerrar}
      onClick={(e) => {
        if (e.target === dialogo.current) dialogo.current?.close();
      }}
    >
      <form
        method="dialog"
        className="pz-dialogo-cuerpo"
        onSubmit={(e) => {
          e.preventDefault();
          crear();
        }}
      >
        <h2 id={`${id}-titulo`}>{TITULOS[tipo]}</h2>
        {tipo === 'ecuacion' && (
          <>
            <div className="campo">
              <label htmlFor={`${id}-t`}>Ecuación o expresión</label>
              <input id={`${id}-t`} value={texto} maxLength={200} autoComplete="off" spellCheck={false} onChange={(e) => setTexto(e.target.value)} placeholder="2x + 3 = 7" aria-describedby={`${id}-ayuda`} />
              <p id={`${id}-ayuda`} className="campo-ayuda">
                Usa + − * / ^ y paréntesis; funciones como sqrt, sin o ln.
              </p>
            </div>
            {vista && (
              <div className="pz-vista-previa" aria-live="polite">
                <FormulaSegura latex={vista.latex} bloque />
                {!vista.entendida && <p className="campo-ayuda">Una parte no se entendió como matemática: se mostrará como texto.</p>}
              </div>
            )}
          </>
        )}
        {tipo === 'grafico' && (
          <div className="campo">
            <label htmlFor={`${id}-t`}>Funciones de x</label>
            <input id={`${id}-t`} value={texto} maxLength={600} autoComplete="off" spellCheck={false} onChange={(e) => setTexto(e.target.value)} placeholder="x^2 - 4; 2x + 1" aria-describedby={`${id}-ayuda`} />
            <p id={`${id}-ayuda`} className="campo-ayuda">
              Hasta seis, separadas por «;». Podrás acercar, desplazar y leer cada punto.
            </p>
          </div>
        )}
        {tipo === 'ejercicio' && (
          <div className="campo">
            <label htmlFor={`${id}-t`}>Enunciado</label>
            <textarea id={`${id}-t`} rows={4} value={texto} maxLength={2000} onChange={(e) => setTexto(e.target.value)} placeholder="Resuelve 2x + 3 = 7 y comprueba el resultado." aria-describedby={`${id}-ayuda`} />
            <p id={`${id}-ayuda`} className="campo-ayuda">
              Aparece en la pizarra; resuélvelo debajo y pide al Tutor una pista o que revise tu intento.
            </p>
          </div>
        )}
        {tipo === 'tabla' && (
          <div className="pz-tabla-editor">
            <table>
              <thead>
                <tr>
                  {columnas.map((c, k) => (
                    <th key={k}>
                      <label className="visually-hidden" htmlFor={`${id}-c${k}`}>
                        Columna {k + 1}
                      </label>
                      <input id={`${id}-c${k}`} value={c} maxLength={60} onChange={(e) => setColumnas(columnas.map((x, j) => (j === k ? e.target.value : x)))} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={i}>
                    {columnas.map((_, k) => (
                      <td key={k}>
                        <label className="visually-hidden" htmlFor={`${id}-f${i}-${k}`}>
                          Fila {i + 1}, columna {k + 1}
                        </label>
                        <input id={`${id}-f${i}-${k}`} value={f[k] ?? ''} maxLength={200} onChange={(e) => setFilas(filas.map((x, j) => (j === i ? columnas.map((__, m) => (m === k ? e.target.value : (x[m] ?? ''))) : x)))} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="acciones">
              <button type="button" className="boton boton-terciario boton-chico" disabled={columnas.length >= 6} onClick={() => setColumnas([...columnas, ''])}>
                Agregar columna
              </button>
              <button type="button" className="boton boton-terciario boton-chico" disabled={filas.length >= 12} onClick={() => setFilas([...filas, columnas.map(() => '')])}>
                Agregar fila
              </button>
            </div>
          </div>
        )}
        {tipo === 'modelo' && (
          <fieldset className="pz-opciones-lista">
            <legend className="visually-hidden">Modelo</legend>
            {MODELOS_INSERTABLES.map((m) => (
              <label key={m.clave}>
                <input type="radio" name={`${id}-m`} checked={modelo === m.clave} onChange={() => setModelo(m.clave)} />
                <span>
                  <span className="pz-menu-nombre">{m.titulo}</span>
                  <span className="pz-menu-ayuda">{m.descripcion}</span>
                </span>
              </label>
            ))}
          </fieldset>
        )}
        {tipo === 'documento' && (
          <fieldset className="pz-opciones-lista">
            <legend className="visually-hidden">Documento</legend>
            {DOCUMENTOS_INSERTABLES.map((d) => (
              <label key={d.src}>
                <input type="radio" name={`${id}-d`} checked={documento === d.src} onChange={() => setDocumento(d.src)} />
                <span>
                  <span className="pz-menu-nombre">{d.titulo}</span>
                  <span className="pz-menu-ayuda">{d.descripcion}</span>
                </span>
              </label>
            ))}
            <label>
              <input type="radio" name={`${id}-d`} checked={documento === 'local'} onChange={() => setDocumento('local')} />
              <span>
                <span className="pz-menu-nombre">Un PDF de tu equipo</span>
                <span className="pz-menu-ayuda">Se abre aquí y no se sube a Mentelyx; al volver a la sesión tendrás que elegirlo otra vez.</span>
              </span>
            </label>
          </fieldset>
        )}
        {tipo === 'imagen' && (
          <div className="campo">
            <label htmlFor={`${id}-img`}>Imagen</label>
            <input id={`${id}-img`} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} aria-describedby={`${id}-ayuda`} />
            <p id={`${id}-ayuda`} className="campo-ayuda">
              Se muestra solo en esta pantalla: no se sube, no se guarda y el Tutor no la ve.
            </p>
          </div>
        )}
        {error && (
          <p className="campo-error" role="alert">
            {error}
          </p>
        )}
        <div className="acciones">
          <button type="submit" className="boton boton-primario">
            Insertar
          </button>
          <button type="button" className="boton boton-terciario" onClick={() => dialogo.current?.close()}>
            Cancelar
          </button>
        </div>
      </form>
    </dialog>
  );
}
