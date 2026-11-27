'use client';

import { useState } from 'react';
import { Markdown } from '@/features/tutor';
import type { Accion, Interaccion } from '../acciones';
import type { BloqueDe, TipoBloque } from '../esquema';
import { FormulaSegura } from './formula-segura';

export type PropsBloque<T extends TipoBloque = TipoBloque> = {
  bloque: BloqueDe<T>;
  interaccion: Interaccion;
  despachar: (a: Accion) => void;
  alPreguntar?: ((texto: string) => void) | undefined;
};

/** Explicación en Markdown seguro (sin HTML); cada [n] abre la cita correspondiente junto al texto. */
export function BloqueTextoVista({ bloque, interaccion, despachar }: PropsBloque<'texto'>) {
  const citas = (bloque.referencias ?? []).flatMap((r) => (r.tipo === 'cita' ? [r] : []));
  const abierta = citas.find((c) => c.id === interaccion.referencia);
  return (
    <div className="bloque-texto-cuerpo">
      <div className="explicacion estudio">
        <Markdown
          texto={bloque.contenido.markdown}
          citas={citas.map((c) => c.numero)}
          fijadas={abierta ? [abierta.numero] : []}
          ancla={`b:${bloque.id}`}
          alCitar={(n) => {
            const c = citas.find((x) => x.numero === n);
            if (c) despachar({ accion: 'mostrar-referencia', bloqueId: bloque.id, referenciaId: abierta?.id === c.id ? null : c.id });
          }}
        />
      </div>
      {abierta && (
        <aside className="bloque-cita-abierta" aria-label={`Cita ${abierta.numero}: ${abierta.titulo}`}>
          <p className="bloque-cita-titulo">
            <span className="cita-numero num">{abierta.numero}</span> {abierta.titulo}
          </p>
          <blockquote className="estudio">{abierta.fragmento.replace(/^#{1,6}\s+/gm, '')}</blockquote>
        </aside>
      )}
    </div>
  );
}

export function BloqueFormulaVista({ bloque }: PropsBloque<'formula'>) {
  return <FormulaSegura latex={bloque.contenido.latex} bloque quimica={bloque.contenido.quimica ?? false} lectura={bloque.contenido.lectura} />;
}

/** Procedimiento paso a paso: se revela de a uno (por la persona, el recorrido o el Tutor) y un paso puede quedar señalado. */
export function BloquePasosVista({ bloque, interaccion, despachar, alPreguntar }: PropsBloque<'pasos'>) {
  const pasos = bloque.contenido.pasos;
  const revelados = Math.max(1, Math.min(interaccion.revelados, pasos.length));
  return (
    <div className="bloque-pasos">
      <ol className="pasos-lista">
        {pasos.slice(0, revelados).map((p, k) => (
          <li key={p.id} className="paso" data-resaltado={interaccion.resaltado === p.id || undefined} aria-current={k === revelados - 1 ? 'step' : undefined}>
            <span className="paso-numero num" aria-hidden="true">
              {k + 1}
            </span>
            <div className="paso-contenido">
              <h4 className="paso-titulo">{p.titulo}</h4>
              {p.latex && <FormulaSegura latex={p.latex} bloque />}
              {p.texto && <p>{p.texto}</p>}
              {alPreguntar && (
                <button type="button" className="enlace-accion paso-preguntar" onClick={() => alPreguntar(`Sobre el paso ${k + 1} («${p.titulo}»): no entiendo por qué. ${p.texto}`)}>
                  Preguntar al Tutor por este paso
                </button>
              )}
            </div>
          </li>
        ))}
      </ol>
      <div className="pasos-control" role="group" aria-label="Avanzar en el procedimiento">
        <span className="suave num">
          Paso {revelados} de {pasos.length}
        </span>
        <button type="button" className="boton boton-terciario boton-chico" disabled={revelados <= 1} onClick={() => despachar({ accion: 'revelar-paso', bloqueId: bloque.id, paso: '@anterior' })}>
          Anterior
        </button>
        <button type="button" className="boton boton-secundario boton-chico" disabled={revelados >= pasos.length} onClick={() => despachar({ accion: 'revelar-paso', bloqueId: bloque.id, paso: '@siguiente' })}>
          Siguiente paso
        </button>
        {revelados < pasos.length && (
          <button type="button" className="boton boton-terciario boton-chico" onClick={() => despachar({ accion: 'revelar-paso', bloqueId: bloque.id, paso: '@todos' })}>
            Ver todos
          </button>
        )}
      </div>
    </div>
  );
}

export function BloqueTablaVista({ bloque, interaccion }: PropsBloque<'tabla'>) {
  const c = bloque.contenido;
  return (
    <div className="bloque-tabla" role="region" aria-label={bloque.titulo ?? 'Tabla'} tabIndex={0}>
      <table>
        {c.leyenda && <caption>{c.leyenda}</caption>}
        <thead>
          <tr>
            {c.columnas.map((col, k) => (
              <th key={k} scope="col">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.filas.map((f) => (
            <tr key={f.id} data-resaltado={interaccion.resaltado === f.id || undefined}>
              {f.celdas.map((celda, k) =>
                k === 0 ? (
                  <th key={k} scope="row">
                    {celda}
                  </th>
                ) : (
                  <td key={k}>{celda}</td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Línea de tiempo: los eventos en orden cronológico; al elegir uno se muestra su detalle. */
export function BloqueLineaTiempoVista({ bloque, interaccion, despachar }: PropsBloque<'linea-tiempo'>) {
  const eventos = [...bloque.contenido.eventos].sort((a, b) => a.orden - b.orden);
  const elegido = eventos.find((e) => e.id === interaccion.seleccion);
  return (
    <div className="bloque-linea">
      <ol className="linea-eventos">
        {eventos.map((e) => (
          <li key={e.id} data-resaltado={interaccion.resaltado === e.id || undefined}>
            <button type="button" className="linea-evento" aria-pressed={e.id === interaccion.seleccion} onClick={() => despachar({ accion: 'seleccionar-estructura', bloqueId: bloque.id, parte: e.id === interaccion.seleccion ? null : e.id })}>
              <span className="linea-fecha num">{e.fecha}</span>
              <span className="linea-titulo">{e.titulo}</span>
            </button>
          </li>
        ))}
      </ol>
      <div className="linea-detalle" aria-live="polite">
        {elegido ? (
          <>
            <h4>
              {elegido.fecha} · {elegido.titulo}
            </h4>
            <p>{elegido.texto}</p>
          </>
        ) : (
          <p className="suave">Elige un momento de la línea para ver qué ocurrió.</p>
        )}
      </div>
    </div>
  );
}

const NOMBRE_LENGUAJE: Record<string, string> = { python: 'Python', javascript: 'JavaScript', typescript: 'TypeScript', java: 'Java', c: 'C', cpp: 'C++', sql: 'SQL', html: 'HTML', css: 'CSS', texto: 'Texto' };

/** Código como texto: con números de línea y copia; Mentelyx nunca lo ejecuta. */
export function BloqueCodigoVista({ bloque }: PropsBloque<'codigo'>) {
  const [copiado, setCopiado] = useState(false);
  const lineas = bloque.contenido.codigo.split('\n');
  return (
    <div className="bloque-codigo">
      <div className="codigo-barra">
        <span className="etiqueta">{NOMBRE_LENGUAJE[bloque.contenido.lenguaje]}</span>
        <span className="suave">Solo lectura: Mentelyx no ejecuta código.</span>
        <button
          type="button"
          className="boton boton-terciario boton-chico"
          onClick={() =>
            void navigator.clipboard?.writeText(bloque.contenido.codigo).then(
              () => setCopiado(true),
              () => setCopiado(false),
            )
          }
        >
          {copiado ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <pre tabIndex={0} aria-label={`Código en ${NOMBRE_LENGUAJE[bloque.contenido.lenguaje]}`}>
        <code>
          {lineas.map((l, k) => (
            <span key={k} className="codigo-linea">
              <span className="codigo-numero" aria-hidden="true">
                {k + 1}
              </span>
              {l || ' '}
              {'\n'}
            </span>
          ))}
        </code>
      </pre>
    </div>
  );
}

export function BloqueComparacionVista({ bloque, interaccion }: PropsBloque<'comparacion'>) {
  return (
    <div className="bloque-comparacion" style={{ ['--columnas' as string]: bloque.contenido.columnas.length }}>
      {bloque.contenido.columnas.map((c) => (
        <section key={c.id} className="comparacion-columna" data-resaltado={interaccion.resaltado === c.id || undefined} aria-labelledby={`${bloque.id}-${c.id}`}>
          <h4 id={`${bloque.id}-${c.id}`}>{c.titulo}</h4>
          <ul>
            {c.puntos.map((p, k) => (
              <li key={k}>{p}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

const MOTIVOS = { tipo: 'es de un tipo que esta versión de Mentelyx todavía no sabe mostrar', version: 'usa una versión de formato más nueva', invalido: 'llegó con datos que no superaron la validación' };

/** Alternativa segura: dice qué no se pudo mostrar, sin mostrar ni interpretar el contenido recibido. */
export function BloqueDesconocidoVista({ bloque }: PropsBloque<'desconocido'>) {
  return (
    <div className="bloque-desconocido" role="note">
      <p>
        Esta parte {MOTIVOS[bloque.contenido.motivo]}, así que no se muestra. El resto de la sesión sigue disponible.
      </p>
      {bloque.contenido.errores.length > 0 && (
        <details>
          <summary>Detalles técnicos</summary>
          <ul>
            {bloque.contenido.errores.map((e, k) => (
              <li key={k}>
                <code>{e}</code>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
