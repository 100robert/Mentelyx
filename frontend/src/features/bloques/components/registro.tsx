'use client';

import { Component, type ComponentType, type ReactNode } from 'react';
import type { Accion, Interaccion } from '../acciones';
import { NOMBRE_TIPO, type Bloque, type TipoBloque } from '../esquema';
import {
  BloqueCodigoVista,
  BloqueComparacionVista,
  BloqueDesconocidoVista,
  BloqueFormulaVista,
  BloqueLineaTiempoVista,
  BloquePasosVista,
  BloqueTablaVista,
  BloqueTextoVista,
  type PropsBloque,
} from './basicos';
import { BloqueEjercicioVista } from './ejercicio';
import { BloqueGraficoVista, BloqueVectoresVista } from './grafico';
import { BloqueModeloVista, BloquePdfVista } from './medios';
import { BloqueObraVista } from './obra';

/**
 * Registro de renderizadores: un componente por tipo de bloque. Los que dependen de bibliotecas pesadas (Three.js, PDF.js,
 * KaTeX) las descargan solo al mostrarse. Agregar un tipo exige su esquema, su validación semántica, sus capacidades,
 * su renderizador aquí y sus pruebas; mientras tanto, el bloque llega como `desconocido` (alternativa segura).
 */
export const RENDERIZADORES: { [T in TipoBloque]: ComponentType<PropsBloque<T>> } = {
  texto: BloqueTextoVista,
  formula: BloqueFormulaVista,
  pasos: BloquePasosVista,
  grafico: BloqueGraficoVista,
  vectores: BloqueVectoresVista,
  tabla: BloqueTablaVista,
  'linea-tiempo': BloqueLineaTiempoVista,
  codigo: BloqueCodigoVista,
  comparacion: BloqueComparacionVista,
  ejercicio: BloqueEjercicioVista,
  obra: BloqueObraVista,
  'modelo-3d': BloqueModeloVista,
  pdf: BloquePdfVista,
  desconocido: BloqueDesconocidoVista,
};

const ORIGEN: Record<Bloque['origen'], string> = { tutor: 'Del Tutor', recorrido: 'Recorrido guiado', persona: 'Tuyo', ejemplo: 'Ejemplo ilustrativo' };

/** Si un renderizador falla, solo ese bloque muestra el aviso; el espacio sigue funcionando. */
class Contencion extends Component<{ children: ReactNode; tipo: string }, { fallo: boolean }> {
  override state = { fallo: false };
  static getDerivedStateFromError() {
    return { fallo: true };
  }
  override render() {
    if (this.state.fallo)
      return (
        <div className="bloque-desconocido" role="note">
          <p>No pudimos mostrar esta parte ({this.props.tipo}). El resto de la sesión sigue disponible.</p>
        </div>
      );
    return this.props.children;
  }
}

function Contenido({ bloque, interaccion, despachar, alPreguntar }: PropsBloque) {
  const Vista = RENDERIZADORES[bloque.tipo] as ComponentType<PropsBloque>;
  return <Vista bloque={bloque} interaccion={interaccion} despachar={despachar} alPreguntar={alPreguntar} />;
}

/** Un bloque completo: cabecera (tipo, título y origen), contenido y referencias. */
export function BloqueVista({
  bloque,
  interaccion,
  despachar,
  alPreguntar,
  activo = false,
  nivel = 2,
}: {
  bloque: Bloque;
  interaccion: Interaccion;
  despachar: (a: Accion) => void;
  alPreguntar?: ((texto: string) => void) | undefined;
  activo?: boolean;
  nivel?: 2 | 3;
}) {
  const Titulo = nivel === 2 ? 'h2' : 'h3';
  const citas = (bloque.referencias ?? []).filter((r) => r.tipo === 'cita');
  const paginas = (bloque.referencias ?? []).filter((r) => r.tipo === 'pagina');
  return (
    <article className="bloque-educativo" data-tipo={bloque.tipo} data-origen={bloque.origen} data-activo={activo || undefined} aria-labelledby={`bloque-${bloque.id}`} data-bloque={bloque.id}>
      <header className="bloque-cabecera-edu">
        <p className="bloque-tipo">
          <span>{NOMBRE_TIPO[bloque.tipo]}</span>
          <span className="bloque-origen" data-origen={bloque.origen}>
            {ORIGEN[bloque.origen]}
          </span>
        </p>
        <Titulo id={`bloque-${bloque.id}`} className="bloque-titulo-edu">
          {/* Una respuesta del Tutor se titula con la pregunta que la originó. */}
          {bloque.origen === 'tutor' && bloque.tipo === 'texto' && bloque.contenido.pregunta ? <span className="visually-hidden">Tu pregunta: </span> : null}
          {bloque.titulo ?? NOMBRE_TIPO[bloque.tipo]}
        </Titulo>
      </header>
      <Contencion tipo={NOMBRE_TIPO[bloque.tipo]}>
        <Contenido bloque={bloque} interaccion={interaccion} despachar={despachar} alPreguntar={alPreguntar} />
      </Contencion>
      {(citas.length > 0 || paginas.length > 0) && (
        <footer className="bloque-referencias">
          <h4 className="visually-hidden">Referencias</h4>
          <ul>
            {citas.map((r) =>
              r.tipo === 'cita' ? (
                <li key={r.id}>
                  <button type="button" className="referencia" aria-pressed={interaccion.referencia === r.id} onClick={() => despachar({ accion: 'mostrar-referencia', bloqueId: bloque.id, referenciaId: interaccion.referencia === r.id ? null : r.id })}>
                    <span className="cita-numero num">{r.numero}</span> {r.titulo}
                    {r.fragmento && <q className="referencia-extracto">{r.fragmento.replace(/^#{1,6}\s+/gm, '').replace(/\s+/g, ' ').slice(0, 110)}{r.fragmento.length > 110 ? '…' : ''}</q>}
                  </button>
                </li>
              ) : null,
            )}
            {paginas.map((r) =>
              r.tipo === 'pagina' ? (
                <li key={r.id}>
                  <button type="button" className="referencia" onClick={() => despachar({ accion: 'mostrar-referencia', bloqueId: bloque.id, referenciaId: r.id })}>
                    Página {r.pagina}
                    {r.texto ? `: ${r.texto}` : ''}
                  </button>
                </li>
              ) : null,
            )}
          </ul>
        </footer>
      )}
    </article>
  );
}
