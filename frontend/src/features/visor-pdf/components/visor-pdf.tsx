'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { PDFDocumentProxy, PDFPageProxy, RenderTask } from 'pdfjs-dist';
import { buscarEnPaginas, normalizar, type Coincidencia } from '../busqueda';

export type DocumentoPdf = { tipo: 'url'; src: string } | { tipo: 'archivo'; archivo: File };
type Estado = 'cargando' | 'listo' | 'error' | 'clave';
type Resaltado = { id: string; pagina: number; texto: string; rects: Array<{ x: number; y: number; w: number; h: number }> };
type Nota = { id: string; pagina: number; texto: string };

const ZOOM_MIN = 0.5, ZOOM_MAX = 3;
const MAX_MINIATURAS = 60;
const MAX_BYTES = 50 * 1024 * 1024;
const RUTA = /^\/documentos\/[a-z0-9-]+\.pdf$/;
let siguienteId = 0;
const nuevoId = (p: string) => `${p}${++siguienteId}`;

/**
 * Visor de documentos con PDF.js (Apache-2.0; worker, fuentes estándar y CMaps servidos desde el mismo origen). Muestra
 * una página por vez con su capa de texto (selección y búsqueda), miniaturas, zoom, pantalla completa y referencias de
 * página. Los resaltados y notas viven solo en esta pantalla y se rotulan así: no hay persistencia de anotaciones.
 * Las páginas sin texto (escaneadas) se señalan: Mentelyx no hace OCR. Nunca ejecuta el JavaScript que pueda traer un PDF
 * (no se carga el entorno de scripts de PDF.js) ni sigue sus enlaces.
 */
export function VisorPdf(props: {
  documento: DocumentoPdf;
  titulo: string;
  pagina: number | null;
  alCambiarPagina: (n: number) => void;
  alPreguntar?: (texto: string, pagina: number) => void;
}) {
  const id = useId();
  const marco = useRef<HTMLDivElement>(null);
  const zona = useRef<HTMLDivElement>(null);
  const lienzo = useRef<HTMLCanvasElement>(null);
  const capaTexto = useRef<HTMLDivElement>(null);
  const hoja = useRef<HTMLDivElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [error, setError] = useState('');
  const [paginaLocal, setPaginaLocal] = useState(props.pagina ?? 1);
  const [zoom, setZoom] = useState<number | 'ancho'>('ancho');
  const [escala, setEscala] = useState(1);
  const [sinTexto, setSinTexto] = useState<Record<number, boolean>>({});
  const [miniaturas, setMiniaturas] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState<Coincidencia[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [indiceResultado, setIndiceResultado] = useState(0);
  const [seleccion, setSeleccion] = useState<{ texto: string; rects: Resaltado['rects'] } | null>(null);
  const [resaltados, setResaltados] = useState<Resaltado[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [notaAbierta, setNotaAbierta] = useState(false);
  const [completa, setCompleta] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const textos = useRef(new Map<number, string[]>());
  const [entradaPagina, setEntradaPagina] = useState(String(props.pagina ?? 1));

  const total = doc?.numPages ?? 0;
  const pagina = Math.min(Math.max(1, paginaLocal), Math.max(1, total));

  // La página que pide el estado educativo (una referencia del Tutor o del recorrido) manda sobre la local.
  useEffect(() => {
    if (props.pagina) setPaginaLocal(props.pagina);
  }, [props.pagina]);
  useEffect(() => setEntradaPagina(String(pagina)), [pagina]);

  const ir = useCallback(
    (n: number) => {
      const destino = Math.min(Math.max(1, Math.round(n)), Math.max(1, total));
      setPaginaLocal(destino);
      setSeleccion(null);
      props.alCambiarPagina(destino);
    },
    [total, props],
  );

  // Carga del documento (PDF.js se descarga solo aquí).
  const claveDoc = props.documento.tipo === 'url' ? props.documento.src : `${props.documento.archivo.name}:${props.documento.archivo.size}:${props.documento.archivo.lastModified}`;
  useEffect(() => {
    let cancelado = false;
    let tarea: { destroy: () => Promise<void> } | null = null;
    setEstado('cargando');
    setDoc(null);
    setSinTexto({});
    setResultados(null);
    setResaltados([]);
    setNotas([]);
    textos.current.clear();
    (async () => {
      try {
        const d = props.documento;
        let fuente: { url: string } | { data: Uint8Array };
        if (d.tipo === 'url') {
          if (!RUTA.test(d.src)) throw new Error('RUTA');
          fuente = { url: d.src };
        } else {
          if (d.archivo.size > MAX_BYTES) throw new Error('GRANDE');
          const datos = new Uint8Array(await d.archivo.arrayBuffer());
          // Firma «%PDF-» al inicio del archivo: lo demás no se intenta abrir.
          if (!(datos[0] === 0x25 && datos[1] === 0x50 && datos[2] === 0x44 && datos[3] === 0x46)) throw new Error('FORMATO');
          fuente = { data: datos };
        }
        const pdfjs = await import('pdfjs-dist');
        const base = `/pdfjs/${pdfjs.version}`;
        pdfjs.GlobalWorkerOptions.workerSrc = `${base}/pdf.worker.min.mjs`;
        const t = pdfjs.getDocument({ ...fuente, cMapUrl: `${base}/cmaps/`, cMapPacked: true, standardFontDataUrl: `${base}/standard_fonts/`, wasmUrl: `${base}/wasm/`, enableXfa: false });
        tarea = t;
        const cargado = await t.promise;
        if (cancelado) return;
        setDoc(cargado);
        setEstado('listo');
      } catch (e) {
        if (cancelado) return;
        const nombre = e instanceof Error ? e.name : '';
        const mensaje = e instanceof Error ? e.message : '';
        if (nombre === 'PasswordException') {
          setEstado('clave');
          return;
        }
        setError(
          mensaje === 'GRANDE'
            ? 'El archivo supera 50 MB.'
            : mensaje === 'FORMATO' || nombre === 'InvalidPDFException'
              ? 'El archivo no es un PDF válido.'
              : mensaje === 'RUTA'
                ? 'El documento no está en el catálogo de Mentelyx.'
                : 'No pudimos abrir el documento. Inténtalo de nuevo.',
        );
        setEstado('error');
      }
    })();
    return () => {
      cancelado = true;
      void tarea?.destroy();
    };
    // El documento se vuelve a abrir solo si cambia su identidad (claveDoc).
  }, [claveDoc]);

  // Escala: «ajustar al ancho» usa el ancho disponible; si no, el zoom elegido.
  useEffect(() => {
    if (!doc || !zona.current) return;
    let vivo = true;
    const calcular = async () => {
      if (zoom !== 'ancho') return setEscala(zoom);
      const p = await doc.getPage(pagina);
      if (!vivo || !zona.current) return;
      const ancho = zona.current.clientWidth - 24;
      const base = p.getViewport({ scale: 1 }).width;
      setEscala(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, ancho / base)));
    };
    void calcular();
    const obs = new ResizeObserver(() => void calcular());
    obs.observe(zona.current);
    return () => {
      vivo = false;
      obs.disconnect();
    };
  }, [doc, zoom, pagina]);

  const textoDe = useCallback(
    async (n: number, p?: PDFPageProxy) => {
      const guardado = textos.current.get(n);
      if (guardado) return guardado;
      const pag = p ?? (await doc!.getPage(n));
      const c = await pag.getTextContent();
      const lista = c.items.map((i) => ('str' in i ? i.str : ''));
      textos.current.set(n, lista);
      return lista;
    },
    [doc],
  );

  // Render de la página actual: lienzo (con densidad de píxeles limitada a 2) y capa de texto seleccionable.
  useEffect(() => {
    if (!doc || !lienzo.current || !capaTexto.current || !hoja.current) return;
    let tarea: RenderTask | null = null;
    let capa: { cancel: () => void } | null = null;
    let vivo = true;
    (async () => {
      const pdfjs = await import('pdfjs-dist');
      const p = await doc.getPage(pagina);
      if (!vivo || !lienzo.current || !capaTexto.current || !hoja.current) return;
      const vista = p.getViewport({ scale: escala });
      const densidad = Math.min(window.devicePixelRatio || 1, 2);
      const c = lienzo.current;
      c.width = Math.floor(vista.width * densidad);
      c.height = Math.floor(vista.height * densidad);
      c.style.width = `${Math.floor(vista.width)}px`;
      c.style.height = `${Math.floor(vista.height)}px`;
      hoja.current.style.setProperty('--total-scale-factor', String(escala));
      hoja.current.style.width = `${Math.floor(vista.width)}px`;
      hoja.current.style.height = `${Math.floor(vista.height)}px`;
      tarea = p.render({ canvas: c, viewport: vista, ...(densidad !== 1 ? { transform: [densidad, 0, 0, densidad, 0, 0] } : {}) });
      // Al cambiar de página o de zoom, el render en curso se cancela: su rechazo se maneja aquí mismo.
      const dibujo = tarea.promise.catch(() => {});
      const contenido = await p.getTextContent();
      if (!vivo) return;
      textos.current.set(pagina, contenido.items.map((i) => ('str' in i ? i.str : '')));
      setSinTexto((s) => ({ ...s, [pagina]: contenido.items.every((i) => !('str' in i) || i.str.trim() === '') }));
      capaTexto.current.replaceChildren();
      const t = new pdfjs.TextLayer({ textContentSource: contenido, container: capaTexto.current, viewport: vista });
      capa = t;
      await t.render();
      await dibujo;
      if (!vivo) return;
      marcarCoincidencias();
    })().catch(() => {});
    return () => {
      vivo = false;
      tarea?.cancel();
      capa?.cancel();
    };
    // marcarCoincidencias lee la consulta actual; se vuelve a marcar en su propio efecto.
  }, [doc, pagina, escala]);

  // Coincidencias de la búsqueda en la capa de texto de la página visible.
  const consultaActiva = resultados ? consulta : '';
  const marcarCoincidencias = useCallback(() => {
    const capa = capaTexto.current;
    if (!capa) return;
    const q = normalizar(consultaActiva.trim());
    capa.querySelectorAll('span[data-coincide]').forEach((s) => s.removeAttribute('data-coincide'));
    if (q.length < 2) return;
    capa.querySelectorAll<HTMLSpanElement>(':scope > span, .markedContent span').forEach((s) => {
      if (normalizar(s.textContent ?? '').includes(q)) s.setAttribute('data-coincide', '');
    });
  }, [consultaActiva]);
  useEffect(() => marcarCoincidencias(), [marcarCoincidencias, pagina]);

  async function buscar() {
    const q = consulta.trim();
    if (!doc || q.length < 2) {
      setResultados(q.length === 0 ? null : []);
      return;
    }
    setBuscando(true);
    const paginas: Array<{ numero: number; items: string[] }> = [];
    for (let n = 1; n <= doc.numPages; n++) paginas.push({ numero: n, items: await textoDe(n) });
    const r = buscarEnPaginas(paginas, q);
    setResultados(r);
    setIndiceResultado(0);
    setBuscando(false);
    setAnuncio(r.length === 0 ? 'Sin resultados en el texto del documento.' : `${r.length} ${r.length === 1 ? 'resultado' : 'resultados'}.`);
    if (r[0]) ir(r[0].pagina);
  }

  // Selección de texto en la página: se ofrece resaltar, anotar o preguntar al Tutor.
  useEffect(() => {
    const h = hoja.current;
    if (!h) return;
    const alSoltar = () =>
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || !capaTexto.current?.contains(sel.anchorNode)) return setSeleccion(null);
        const texto = sel.toString().trim();
        if (!texto) return setSeleccion(null);
        const caja = h.getBoundingClientRect();
        const rects = [...sel.getRangeAt(0).getClientRects()]
          .filter((r) => r.width > 1 && r.height > 1)
          .slice(0, 40)
          .map((r) => ({ x: (r.left - caja.left) / caja.width, y: (r.top - caja.top) / caja.height, w: r.width / caja.width, h: r.height / caja.height }));
        setSeleccion({ texto: texto.slice(0, 2000), rects });
      });
    h.addEventListener('mouseup', alSoltar);
    h.addEventListener('keyup', alSoltar);
    h.addEventListener('touchend', alSoltar);
    return () => {
      h.removeEventListener('mouseup', alSoltar);
      h.removeEventListener('keyup', alSoltar);
      h.removeEventListener('touchend', alSoltar);
    };
  }, [estado]);

  useEffect(() => {
    const alCambiar = () => setCompleta(document.fullscreenElement === marco.current);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  // Teclado en la página: ← y → cambian de página (sin interferir con campos de texto).
  const alTecla = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).closest('input, textarea, button')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') ir(pagina + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') ir(pagina - 1);
  };

  const enPagina = useMemo(() => resaltados.filter((r) => r.pagina === pagina), [resaltados, pagina]);
  const notasPagina = notas.filter((n) => n.pagina === pagina);
  const anotaciones = resaltados.length + notas.length;

  if (estado === 'error' || estado === 'clave')
    return (
      <div className="visor-pdf visor-pdf-error" role="alert">
        <p className="mensaje mensaje-error">{estado === 'clave' ? 'El PDF está protegido con contraseña: Mentelyx no abre documentos cifrados.' : error}</p>
      </div>
    );

  return (
    <div ref={marco} className="visor-pdf" data-completa={completa || undefined} data-miniaturas={miniaturas || undefined}>
      <div className="visor-pdf-barra" role="toolbar" aria-label={`Controles del documento: ${props.titulo}`}>
        <div className="visor-pdf-grupo">
          <button type="button" className="boton-icono" onClick={() => ir(pagina - 1)} disabled={pagina <= 1 || estado !== 'listo'}>
            <span aria-hidden="true">‹</span>
            <span className="visually-hidden">Página anterior</span>
          </button>
          <form
            className="visor-pdf-pagina"
            onSubmit={(e) => {
              e.preventDefault();
              const n = Number(entradaPagina);
              if (Number.isFinite(n)) ir(n);
            }}
          >
            <label htmlFor={`${id}-pagina`}>Página</label>
            <input id={`${id}-pagina`} inputMode="numeric" value={entradaPagina} onChange={(e) => setEntradaPagina(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))} disabled={estado !== 'listo'} />
            <span>de {total || '—'}</span>
          </form>
          <button type="button" className="boton-icono" onClick={() => ir(pagina + 1)} disabled={pagina >= total || estado !== 'listo'}>
            <span aria-hidden="true">›</span>
            <span className="visually-hidden">Página siguiente</span>
          </button>
        </div>
        <div className="visor-pdf-grupo">
          <button type="button" className="boton-icono" onClick={() => setZoom(Math.max(ZOOM_MIN, Math.round((escala - 0.25) * 4) / 4))} disabled={estado !== 'listo'}>
            <span aria-hidden="true">−</span>
            <span className="visually-hidden">Reducir</span>
          </button>
          <span className="visor-pdf-zoom num" aria-live="polite">
            {Math.round(escala * 100)} %
          </span>
          <button type="button" className="boton-icono" onClick={() => setZoom(Math.min(ZOOM_MAX, Math.round((escala + 0.25) * 4) / 4))} disabled={estado !== 'listo'}>
            <span aria-hidden="true">+</span>
            <span className="visually-hidden">Ampliar</span>
          </button>
          <button type="button" className="boton boton-terciario boton-chico" aria-pressed={zoom === 'ancho'} onClick={() => setZoom('ancho')} disabled={estado !== 'listo'}>
            Ajustar al ancho
          </button>
        </div>
        <div className="visor-pdf-grupo">
          <button type="button" className="boton boton-terciario boton-chico" aria-pressed={miniaturas} aria-controls={miniaturas ? `${id}-miniaturas` : undefined} onClick={() => setMiniaturas((m) => !m)} disabled={estado !== 'listo'}>
            Miniaturas
          </button>
          <button
            type="button"
            className="boton boton-terciario boton-chico"
            aria-pressed={completa}
            onClick={() => (document.fullscreenElement ? void document.exitFullscreen() : void marco.current?.requestFullscreen?.().catch(() => {}))}
          >
            {completa ? 'Salir de pantalla completa' : 'Pantalla completa'}
          </button>
        </div>
        <form
          role="search"
          className="visor-pdf-buscar"
          onSubmit={(e) => {
            e.preventDefault();
            void buscar();
          }}
        >
          <label htmlFor={`${id}-buscar`} className="visually-hidden">
            Buscar en el documento
          </label>
          <input id={`${id}-buscar`} type="search" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Buscar en el documento" maxLength={100} disabled={estado !== 'listo'} />
          <button type="submit" className="boton boton-secundario boton-chico" disabled={estado !== 'listo' || buscando}>
            {buscando ? 'Buscando…' : 'Buscar'}
          </button>
        </form>
      </div>

      {resultados && (
        <div className="visor-pdf-resultados" aria-label="Resultados de la búsqueda">
          {resultados.length === 0 ? (
            <p className="suave">Sin resultados en el texto del documento{Object.values(sinTexto).some(Boolean) ? ' (las páginas escaneadas no tienen texto buscable)' : ''}.</p>
          ) : (
            <>
              <p>
                <span className="num">{resultados.length}</span> {resultados.length === 1 ? 'resultado' : 'resultados'}.{' '}
                <button
                  type="button"
                  className="boton boton-terciario boton-chico"
                  onClick={() => {
                    const k = (indiceResultado + 1) % resultados.length;
                    setIndiceResultado(k);
                    ir(resultados[k]!.pagina);
                  }}
                >
                  Siguiente resultado
                </button>
              </p>
              <ol>
                {resultados.slice(0, 30).map((r, k) => (
                  <li key={`${r.pagina}-${k}`}>
                    <button type="button" className="visor-pdf-resultado" aria-current={k === indiceResultado || undefined} onClick={() => (setIndiceResultado(k), ir(r.pagina))}>
                      <span className="num">Pág. {r.pagina}</span> <span>{r.extracto}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}

      <div className="visor-pdf-cuerpo">
        {miniaturas && doc && <Miniaturas id={`${id}-miniaturas`} doc={doc} actual={pagina} alElegir={ir} />}
        <div ref={zona} className="visor-pdf-zona" tabIndex={0} onKeyDown={alTecla} aria-label={`Página ${pagina} de ${total}. Usa las flechas para cambiar de página.`}>
          {estado === 'cargando' && (
            <p className="visor-pdf-cargando" role="status">
              <span className="girador keep-motion" aria-hidden="true" /> Abriendo el documento…
            </p>
          )}
          {sinTexto[pagina] && (
            <p className="mensaje mensaje-info visor-pdf-aviso" role="note">
              Esta página no tiene texto seleccionable: parece una imagen escaneada. Mentelyx no reconoce texto en imágenes (no hace OCR), así que aquí no se puede buscar ni seleccionar.
            </p>
          )}
          <div ref={hoja} className="visor-pdf-hoja" style={{ ['--scale-round-x' as string]: '1px', ['--scale-round-y' as string]: '1px' }}>
            <canvas ref={lienzo} aria-hidden="true" />
            <div ref={capaTexto} className="textLayer" />
            <div className="visor-pdf-resaltados" aria-hidden="true">
              {enPagina.flatMap((r) => r.rects.map((x, k) => <span key={`${r.id}-${k}`} style={{ left: `${x.x * 100}%`, top: `${x.y * 100}%`, width: `${x.w * 100}%`, height: `${x.h * 100}%` }} />))}
            </div>
          </div>
        </div>
        <aside className="visor-pdf-notas" aria-labelledby={`${id}-anotaciones`}>
          <h4 id={`${id}-anotaciones`}>
            Resaltados y notas <span className="contador">{anotaciones}</span>
          </h4>
          <p className="visor-pdf-temporal">Solo en esta pantalla: se pierden al salir, porque Mentelyx todavía no guarda anotaciones de documentos.</p>
          {seleccion && (
            <div className="visor-pdf-seleccion" role="group" aria-label="Texto seleccionado">
              <q>{seleccion.texto.length > 160 ? `${seleccion.texto.slice(0, 160)}…` : seleccion.texto}</q>
              <div className="acciones">
                <button
                  type="button"
                  className="boton boton-secundario boton-chico"
                  onClick={() => {
                    setResaltados((r) => [...r, { id: nuevoId('r'), pagina, texto: seleccion.texto, rects: seleccion.rects }]);
                    setAnuncio('Resaltado agregado (no se guarda).');
                    window.getSelection()?.removeAllRanges();
                    setSeleccion(null);
                  }}
                >
                  Resaltar
                </button>
                {props.alPreguntar && (
                  <button type="button" className="boton boton-terciario boton-chico" onClick={() => (props.alPreguntar?.(seleccion.texto, pagina), setSeleccion(null))}>
                    Preguntar al Tutor
                  </button>
                )}
              </div>
            </div>
          )}
          <ul className="visor-pdf-lista">
            {resaltados.map((r) => (
              <li key={r.id}>
                <button type="button" className="visor-pdf-ir" onClick={() => ir(r.pagina)}>
                  <span className="num">Pág. {r.pagina}</span> «{r.texto.length > 90 ? `${r.texto.slice(0, 90)}…` : r.texto}»
                </button>
                <button type="button" className="boton-icono" onClick={() => setResaltados((l) => l.filter((x) => x.id !== r.id))}>
                  <span aria-hidden="true">×</span>
                  <span className="visually-hidden">Quitar el resaltado</span>
                </button>
              </li>
            ))}
            {notas.map((n) => (
              <li key={n.id}>
                <button type="button" className="visor-pdf-ir" onClick={() => ir(n.pagina)}>
                  <span className="num">Pág. {n.pagina}</span> {n.texto}
                </button>
                <button type="button" className="boton-icono" onClick={() => setNotas((l) => l.filter((x) => x.id !== n.id))}>
                  <span aria-hidden="true">×</span>
                  <span className="visually-hidden">Borrar la nota</span>
                </button>
              </li>
            ))}
          </ul>
          {notaAbierta ? (
            <form
              className="visor-pdf-nota"
              onSubmit={(e) => {
                e.preventDefault();
                const texto = String(new FormData(e.currentTarget).get('nota') ?? '').trim();
                if (texto) setNotas((l) => [...l, { id: nuevoId('n'), pagina, texto: texto.slice(0, 500) }]);
                setNotaAbierta(false);
              }}
            >
              <label htmlFor={`${id}-nota`}>Nota en la página {pagina}</label>
              <textarea id={`${id}-nota`} name="nota" rows={3} maxLength={500} autoFocus />
              <div className="acciones">
                <button type="submit" className="boton boton-secundario boton-chico">
                  Agregar
                </button>
                <button type="button" className="boton boton-terciario boton-chico" onClick={() => setNotaAbierta(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button type="button" className="boton boton-terciario boton-chico" onClick={() => setNotaAbierta(true)} disabled={estado !== 'listo'}>
              Agregar una nota en esta página
            </button>
          )}
          {notasPagina.length > 0 && <p className="suave">{notasPagina.length} {notasPagina.length === 1 ? 'nota' : 'notas'} en esta página.</p>}
        </aside>
      </div>
      <p className="visually-hidden" role="status">
        {anuncio}
      </p>
    </div>
  );
}

/** Miniaturas que se dibujan solo al hacerse visibles (hasta 60 páginas; más allá, la lista numerada). */
function Miniaturas({ id, doc, actual, alElegir }: { id: string; doc: PDFDocumentProxy; actual: number; alElegir: (n: number) => void }) {
  const lista = useRef<HTMLOListElement>(null);
  const total = Math.min(doc.numPages, MAX_MINIATURAS);
  useEffect(() => {
    const raiz = lista.current;
    if (!raiz) return;
    const tareas: RenderTask[] = [];
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          obs.unobserve(e.target);
          const c = e.target.querySelector('canvas');
          const n = Number((e.target as HTMLElement).dataset.pagina);
          if (!c || !n) continue;
          void doc.getPage(n).then((p) => {
            const v = p.getViewport({ scale: 1 });
            const vista = p.getViewport({ scale: 120 / v.width });
            c.width = Math.floor(vista.width);
            c.height = Math.floor(vista.height);
            const t = p.render({ canvas: c, viewport: vista });
            tareas.push(t);
            return t.promise.catch(() => {});
          });
        }
      },
      { root: raiz, rootMargin: '200px' },
    );
    raiz.querySelectorAll('li').forEach((li) => obs.observe(li));
    return () => {
      obs.disconnect();
      tareas.forEach((t) => t.cancel());
    };
  }, [doc]);
  return (
    <ol ref={lista} id={id} className="visor-pdf-miniaturas" aria-label="Miniaturas de las páginas">
      {Array.from({ length: total }, (_, k) => k + 1).map((n) => (
        <li key={n} data-pagina={n}>
          <button type="button" aria-current={n === actual ? 'page' : undefined} onClick={() => alElegir(n)}>
            <canvas aria-hidden="true" />
            <span className="num">Página {n}</span>
          </button>
        </li>
      ))}
      {doc.numPages > MAX_MINIATURAS && <li className="suave">Y {doc.numPages - MAX_MINIATURAS} páginas más: usa el número de página.</li>}
    </ol>
  );
}
