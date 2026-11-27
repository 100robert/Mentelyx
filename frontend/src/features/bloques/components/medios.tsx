'use client';

import { useId, useState } from 'react';
import { VisorModelo, type VistaCamara } from '@/features/visor-3d';
import { VisorPdf, type DocumentoPdf } from '@/features/visor-pdf';
import { parametrosDe } from '../acciones';
import { MODELOS } from '../catalogo';
import type { PropsBloque } from './basicos';

const TIEMPOS = ['admisión', 'compresión', 'combustión (expansión)', 'escape'];

/** Modelo 3D: el visor reutilizable conectado a las acciones (selección, parámetros y vistas) del bloque. */
export function BloqueModeloVista({ bloque, interaccion, despachar }: PropsBloque<'modelo-3d'>) {
  const m = bloque.contenido.modelo;
  const catalogo = m.tipo === 'catalogo' ? MODELOS[m.clave] : null;
  const textos = new Map((bloque.contenido.partes ?? []).map((p) => [p.id, p]));
  const partes = catalogo
    ? catalogo.partes.map((p) => ({ id: p.id, nombre: textos.get(p.id)?.nombre ?? p.nombre, texto: textos.get(p.id)?.texto ?? '' }))
    : (bloque.contenido.partes ?? []).map((p) => ({ id: p.id, nombre: p.nombre, texto: p.texto }));
  const credito = (bloque.referencias ?? []).find((r) => r.tipo === 'credito');
  const vista = interaccion.vista?.tipo === 'camara' ? (interaccion.vista.preset as VistaCamara) : null;
  return (
    <VisorModelo
      origen={m}
      titulo={bloque.titulo ?? catalogo?.titulo ?? 'Modelo 3D'}
      descripcion={bloque.accesibilidad.descripcion}
      partes={partes}
      parametros={parametrosDe(bloque)}
      valores={interaccion.parametros}
      seleccion={interaccion.seleccion}
      resaltado={interaccion.resaltado}
      vista={vista}
      credito={credito?.tipo === 'credito' ? `${credito.autor}. ${credito.licencia}.` : (catalogo?.credito ?? '')}
      alSeleccionar={(parte) => despachar({ accion: 'seleccionar-estructura', bloqueId: bloque.id, parte })}
      alParametro={(parametro, valor) => despachar({ accion: 'modificar-parametro', bloqueId: bloque.id, parametro, valor })}
      alVista={(preset) => despachar({ accion: 'cambiar-vista', bloqueId: bloque.id, vista: { tipo: 'camara', preset } })}
      lecturaParametro={
        m.tipo === 'catalogo' && m.clave === 'motor-4t'
          ? (id, valor) => (id === 'giro' ? `${Math.round(valor)}° · ${TIEMPOS[Math.min(3, Math.floor((valor % 720) / 180))]}` : id === 'despiece' ? `${Math.round(valor * 100)} %` : null)
          : (id, valor) => (id === 'despiece' ? `${Math.round(valor * 100)} %` : null)
      }
    />
  );
}

/**
 * Documento: un PDF del catálogo propio o uno que la persona abre desde su equipo. El archivo local se lee solo en este
 * navegador: no se sube ni se guarda (las fuentes que el Tutor puede citar se agregan como TXT o MD en el tema).
 */
export function BloquePdfVista({ bloque, interaccion, despachar, alPreguntar }: PropsBloque<'pdf'>) {
  const id = useId();
  const [archivo, setArchivo] = useState<File | null>(null);
  const d = bloque.contenido.documento;
  const documento: DocumentoPdf | null = d.tipo === 'catalogo' ? { tipo: 'url', src: d.src } : archivo ? { tipo: 'archivo', archivo } : null;
  const pagina = interaccion.vista?.tipo === 'pagina' ? interaccion.vista.pagina : null;
  return (
    <div className="bloque-pdf">
      {d.tipo === 'local' && (
        <div className="pdf-local">
          <label htmlFor={`${id}-archivo`} className="boton boton-secundario boton-chico">
            {archivo ? 'Abrir otro PDF' : 'Abrir un PDF de tu equipo'}
          </label>
          <input id={`${id}-archivo`} type="file" accept="application/pdf,.pdf" className="visually-hidden" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
          <span className="suave">Se abre solo en este navegador: no se sube ni se guarda en Mentelyx. Máximo 50 MB.</span>
        </div>
      )}
      {documento ? (
        <VisorPdf
          documento={documento}
          titulo={bloque.titulo ?? archivo?.name ?? 'Documento'}
          pagina={pagina}
          alCambiarPagina={(n) => despachar({ accion: 'cambiar-vista', bloqueId: bloque.id, vista: { tipo: 'pagina', pagina: n } })}
          {...(alPreguntar ? { alPreguntar: (texto: string, n: number) => alPreguntar(`Sobre la página ${n} del documento «${bloque.titulo ?? archivo?.name ?? 'Documento'}»: «${texto.slice(0, 800)}». `) } : {})}
        />
      ) : (
        <p className="suave">Elige un archivo PDF para verlo aquí con sus páginas, búsqueda y miniaturas.</p>
      )}
    </div>
  );
}
