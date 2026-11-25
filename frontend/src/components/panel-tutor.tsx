'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { apiCliente, ErrorApi, mensajeDeError, nuevaClave } from '@/lib/api-cliente';
import {
  BarraSeleccion,
  CapaSeleccion,
  HerramientasCuaderno,
  HilosCita,
  leerSeleccion,
  NotaBloque,
  resaltadoDisponible,
  usePintarResaltados,
  useCuaderno,
  type Herramienta,
  type SeleccionTexto,
} from './cuaderno';
import { FormularioFuente, SelectorFuente } from './espacios';
import { useHidratado } from './hidratado';
import { Icono } from './iconos';
import { Markdown } from './markdown';

export type CitaVista = { id: string; titulo: string; fragmento: string };
export type MensajeVista = { id: string; rol: 'user' | 'assistant'; texto: string; citas?: CitaVista[] };
export type FuenteVista = { contentId: string; titulo: string; formato: string; bytes: number; seleccionada: boolean; estadoLectura: string };

type Respuesta = {
  mensajeId: string;
  conversacionId: string;
  estado: 'RESPONDIDA' | 'SIN_CONTEXTO' | 'PARCIAL';
  modoFuentes: 'FUNDAMENTADA' | 'MIXTA' | 'GENERAL';
  segmentos: Array<{ markdown: string }>;
  citas: CitaVista[];
  uso: { recurso: string; consumido: number; restantesPeriodo: number; ruta: { etiqueta: string } };
  avisos: string[];
};
type InfoRespuesta = { etiqueta: string; avisos: string[]; modo: Respuesta['modoFuentes']; estado: Respuesta['estado'] };
type Intercambio = { clave: string; pregunta?: MensajeVista; respuesta?: MensajeVista };

const NOMBRE_RECURSO: Record<string, string> = { CONSULTA_GENERAL: 'consultas generales', CONSULTA_TECNICA: 'consultas técnicas' };
const ESTADOS: Record<string, string> = { LISTA: 'Lista para el Tutor', PENDIENTE: 'En cola', INDEXANDO: 'Leyendo…', FALLIDA: 'No se pudo leer' };
const MODOS: Record<Respuesta['modoFuentes'], string> = { FUNDAMENTADA: 'Según tus fuentes', MIXTA: 'Tus fuentes y explicación general', GENERAL: 'Explicación general' };
const REINTENTABLES = new Set(['RED', 'OPERACION_EN_CURSO', 'PROVEEDOR_NO_DISPONIBLE', 'LIMITE_TASA', 'SERVICIO_NO_DISPONIBLE']);
const MAX_PREGUNTA = 4000;
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
const kb = (bytes: number) => `${(bytes / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 })} KB`;
/** Texto de una fuente para leer en pantalla: sin las marcas de título de Markdown (el pasaje original no cambia). */
const legible = (t: string) => t.replace(/^#{1,6}\s+/gm, '').replace(/\n{2,}/g, '\n');

function agrupar(mensajes: MensajeVista[]): Intercambio[] {
  const lista: Intercambio[] = [];
  for (const m of mensajes) {
    const ultimo = lista.at(-1);
    if (m.rol === 'user') lista.push({ clave: m.id, pregunta: m });
    else if (ultimo && !ultimo.respuesta) ultimo.respuesta = m;
    else lista.push({ clave: m.id, respuesta: m });
  }
  return lista;
}

/** Un panel lateral se superpone (en lugar de ocupar una columna) por debajo de este ancho. */
const superpuesto = (rem: number) => typeof window !== 'undefined' && window.matchMedia(`(max-width: ${rem - 0.01}rem)`).matches;

/** Pregunta final: lo escrito más los fragmentos elegidos por región o lazo, dentro del límite de 4000 caracteres. */
function componerPregunta(texto: string, fragmentos: string[]) {
  if (fragmentos.length === 0) return texto;
  const cabecera = '\n\nFragmentos seleccionados:\n';
  let resto = MAX_PREGUNTA - texto.length - cabecera.length;
  const partes: string[] = [];
  for (const f of fragmentos) {
    if (resto <= 8) break;
    const parte = `«${f.length > resto - 4 ? `${f.slice(0, resto - 5)}…` : f}»`;
    partes.push(parte);
    resto -= parte.length + 1;
  }
  return `${texto}${cabecera}${partes.join('\n')}`;
}

/**
 * Espacio de trabajo del Tutor (M6) como cuaderno de estudio. El lienzo central muestra la explicación como una hoja con
 * citas que fijan su pasaje al lado (unidos por el hilo de cita), resaltados, notas y selección por región o lazo para
 * preguntar sobre una parte concreta. Cada pregunta lleva una Idempotency-Key fija: si la red falla, el reintento reutiliza
 * la misma clave y el servidor devuelve la misma respuesta sin volver a consumir ni a invocar al proveedor.
 */
export function PanelTutor(props: {
  conversacionId?: string;
  espacioId?: string;
  mensajes: MensajeVista[];
  titulo?: string;
  contexto?: ReactNode;
  fuentes?: FuenteVista[];
  disponibles?: { recurso: string; cantidad: number };
  expiraEn?: string;
}) {
  const router = useRouter();
  const [conversacionId, setConversacionId] = useState(props.conversacionId);
  const [mensajes, setMensajes] = useState<MensajeVista[]>(props.mensajes);
  const [error, setError] = useState<{ texto: string; codigo: string } | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [pregunta, setPregunta] = useState('');
  const [enCurso, setEnCurso] = useState<string | null>(null);
  const [info, setInfo] = useState<Record<string, InfoRespuesta>>({});
  const [disponibles, setDisponibles] = useState(props.disponibles);
  const [anuncio, setAnuncio] = useState('');
  const [historial, setHistorial] = useState(false);
  const [fuentesAbiertas, setFuentesAbiertas] = useState(false);
  const [agregarAbierto, setAgregarAbierto] = useState((props.fuentes?.length ?? 1) === 0);
  const [herramienta, setHerramienta] = useState<Herramienta>('texto');
  const [seleccion, setSeleccion] = useState<SeleccionTexto | null>(null);
  const [bloquesSel, setBloquesSel] = useState<string[]>([]);
  const [fijadas, setFijadas] = useState<Record<string, number[]>>({});
  const [notaNueva, setNotaNueva] = useState<string | null>(null);
  const [conResaltado, setConResaltado] = useState(true);
  const pendiente = useRef<{ clave: string; pregunta: string } | null>(null);
  const botonConversacion = useRef<HTMLButtonElement>(null);
  const botonFuentes = useRef<HTMLButtonElement>(null);
  const tituloPanel = useRef<HTMLHeadingElement>(null);
  const tituloFuentes = useRef<HTMLHeadingElement>(null);
  const tablero = useRef<HTMLDivElement>(null);
  const campoPregunta = useRef<HTMLTextAreaElement>(null);
  const hidratado = useHidratado();

  const intercambios = useMemo(() => agrupar(mensajes), [mensajes]);
  const [elegido, setElegido] = useState<string | undefined>(intercambios.at(-1)?.clave);
  const actual = intercambios.find((i) => i.clave === elegido) ?? intercambios.at(-1);
  const respuesta = actual?.respuesta;
  const fijadasActuales = respuesta ? (fijadas[respuesta.id] ?? []) : [];

  const cuaderno = useCuaderno(props.espacioId ? `espacio:${props.espacioId}` : `conversacion:${conversacionId ?? 'nueva'}`);
  usePintarResaltados(tablero, cuaderno.resaltados, `${actual?.clave}|${fijadasActuales.join(',')}|${cuaderno.notas.length}`);

  const fuentes = props.fuentes;
  const elegidas = fuentes?.filter((f) => f.seleccionada && f.estadoLectura === 'LISTA').length ?? 0;
  const leyendo = fuentes?.some((f) => f.estadoLectura === 'PENDIENTE' || f.estadoLectura === 'INDEXANDO') ?? false;

  useEffect(() => setConResaltado(resaltadoDisponible()), []);

  // Mientras alguna fuente se está leyendo, la lista se actualiza sola (hasta un minuto) para mostrar cuándo queda lista.
  const intentos = useRef(0);
  useEffect(() => {
    if (!leyendo || intentos.current >= 24) return;
    const t = setTimeout(() => {
      intentos.current += 1;
      router.refresh();
    }, 2500);
    return () => clearTimeout(t);
  }, [leyendo, fuentes, router]);

  // Accesos directos del panel: ?agregar=1 abre la carga de fuentes; ?preguntar=1 lleva el cursor a la barra de consulta.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.has('agregar')) {
      setAgregarAbierto(true);
      if (superpuesto(64)) setFuentesAbiertas(true);
      else requestAnimationFrame(() => document.getElementById('titulo-fuente')?.focus());
    } else if (p.has('preguntar')) requestAnimationFrame(() => campoPregunta.current?.focus());
  }, []);

  // Esc: cierra la barra de selección, el panel abierto o el cajón de fuentes, en ese orden.
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (seleccion) return setSeleccion(null);
      if (herramienta !== 'texto') return setHerramienta('texto');
      if (fuentesAbiertas) {
        setFuentesAbiertas(false);
        botonFuentes.current?.focus();
      } else if (historial) {
        setHistorial(false);
        botonConversacion.current?.focus();
      }
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [historial, fuentesAbiertas, seleccion, herramienta]);

  useEffect(() => {
    if (historial) tituloPanel.current?.focus();
  }, [historial]);
  useEffect(() => {
    if (fuentesAbiertas) tituloFuentes.current?.focus();
  }, [fuentesAbiertas]);

  // Selección de texto en la hoja o en un pasaje: con el resaltador se resalta al soltar; si no, aparece la barra contextual.
  useEffect(() => {
    const t = tablero.current;
    if (!t) return;
    const alSoltar = () =>
      requestAnimationFrame(() => {
        const s = leerSeleccion(t);
        if (s && herramienta === 'resaltar' && conResaltado) {
          cuaderno.resaltar({ ancla: s.ancla, inicio: s.inicio, fin: s.fin });
          window.getSelection()?.removeAllRanges();
          setSeleccion(null);
        } else setSeleccion(s);
      });
    const alCambiar = () => {
      if (window.getSelection()?.isCollapsed) setSeleccion(null);
    };
    t.addEventListener('mouseup', alSoltar);
    t.addEventListener('keyup', alSoltar);
    t.addEventListener('touchend', alSoltar);
    document.addEventListener('selectionchange', alCambiar);
    return () => {
      t.removeEventListener('mouseup', alSoltar);
      t.removeEventListener('keyup', alSoltar);
      t.removeEventListener('touchend', alSoltar);
      document.removeEventListener('selectionchange', alCambiar);
    };
  }, [herramienta, conResaltado, cuaderno]);

  async function preguntar(texto: string) {
    if (!texto) return;
    setError(null);
    setEnviando(true);
    setEnCurso(texto);
    if (!pendiente.current || pendiente.current.pregunta !== texto) pendiente.current = { clave: nuevaClave(), pregunta: texto };
    try {
      let id = conversacionId;
      if (!id) {
        const c = await apiCliente<{ id: string }>('/tutor-ia/conversaciones', {
          metodo: 'POST',
          cuerpo: { contexto: { superficie: 'TUTOR', ...(props.espacioId ? { espacioId: props.espacioId } : {}) } },
        });
        id = c.id;
        setConversacionId(id);
      }
      const r = await apiCliente<Respuesta>('/tutor-ia/consultas', {
        metodo: 'POST',
        clave: pendiente.current.clave,
        cuerpo: { conversacionId: id, pregunta: texto, ...(props.espacioId ? { fuentes: { espacioId: props.espacioId } } : {}) },
      });
      setMensajes((m) => [
        ...m,
        { id: `u-${r.mensajeId}`, rol: 'user', texto },
        { id: r.mensajeId, rol: 'assistant', texto: r.segmentos.map((s) => s.markdown).join('\n\n'), citas: r.citas },
      ]);
      setElegido(`u-${r.mensajeId}`);
      setInfo((i) => ({ ...i, [r.mensajeId]: { etiqueta: r.uso.ruta.etiqueta, avisos: r.avisos, modo: r.modoFuentes, estado: r.estado } }));
      setDisponibles({ recurso: r.uso.recurso, cantidad: r.uso.restantesPeriodo });
      setAnuncio(`Respuesta del Tutor lista${r.citas.length ? `, con ${r.citas.length} ${r.citas.length === 1 ? 'cita' : 'citas'} de tus fuentes` : ''}.`);
      pendiente.current = null;
      setPregunta('');
      setBloquesSel([]);
      router.refresh();
    } catch (e) {
      setError({ texto: mensajeDeError(e), codigo: e instanceof ErrorApi ? e.code : 'ERROR_INTERNO' });
      // Se conserva la clave solo si el resultado es desconocido (red) o sigue en curso; en otro caso, la próxima es nueva.
      if (e instanceof ErrorApi && e.code !== 'RED' && e.code !== 'OPERACION_EN_CURSO') pendiente.current = null;
    } finally {
      setEnviando(false);
      setEnCurso(null);
    }
  }

  const largoDe = (ancla: string) => tablero.current?.querySelector(`[data-ancla="${CSS.escape(ancla)}"]`)?.textContent?.length ?? 0;
  const textoDe = (ancla: string) => tablero.current?.querySelector(`[data-ancla="${CSS.escape(ancla)}"]`)?.textContent?.trim() ?? '';
  function enviarDesdeFormulario() {
    const texto = pregunta.trim();
    if (!texto) return;
    void preguntar(componerPregunta(texto, bloquesSel.map(textoDe).filter(Boolean)));
  }
  function alternarFijada(mensajeId: string, n: number) {
    setFijadas((f) => {
      const lista = f[mensajeId] ?? [];
      return { ...f, [mensajeId]: lista.includes(n) ? lista.filter((x) => x !== n) : [...lista, n].sort((a, b) => a - b) };
    });
  }
  function elegir(clave: string) {
    setElegido(clave);
    setBloquesSel([]);
    if (superpuesto(80)) setHistorial(false);
  }
  function anotar(ancla: string) {
    setNotaNueva(cuaderno.anotar(ancla));
    setSeleccion(null);
    window.getSelection()?.removeAllRanges();
  }
  function preguntarSobre(texto: string) {
    setPregunta((p) => `${p ? `${p} ` : ''}Sobre «${texto.length > 600 ? `${texto.slice(0, 600)}…` : texto}»: `);
    setSeleccion(null);
    requestAnimationFrame(() => {
      const c = campoPregunta.current;
      c?.focus();
      c?.setSelectionRange(c.value.length, c.value.length);
    });
  }
  const notasDe = (ancla: string) =>
    cuaderno.notas
      .filter((n) => n.ancla === ancla)
      .map((n) => <NotaBloque key={n.id} nota={n} enfocar={notaNueva === n.id} alEditar={(t) => cuaderno.editarNota(n.id, t)} alBorrar={() => cuaderno.borrarNota(n.id)} />);
  const yaResaltado = seleccion ? cuaderno.resaltados.some((r) => r.ancla === seleccion.ancla && r.inicio < seleccion.fin && r.fin > seleccion.inicio) : false;

  const resumenFuentes = !fuentes
    ? null
    : fuentes.length === 0
      ? 'Sin fuentes todavía'
      : elegidas > 0
        ? `${elegidas} de ${fuentes.length} ${fuentes.length === 1 ? 'fuente elegida' : 'fuentes elegidas'} para el Tutor`
        : 'Ninguna fuente lista y elegida: el Tutor dará una explicación general';
  const contextoConsulta = [
    fuentes ? (elegidas > 0 ? `Usará ${elegidas} ${elegidas === 1 ? 'fuente elegida' : 'fuentes elegidas'}.` : 'Sin fuentes elegidas: explicación general.') : null,
    disponibles ? `Te quedan ${disponibles.cantidad} ${NOMBRE_RECURSO[disponibles.recurso] ?? 'consultas'} este mes.` : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="area-trabajo" data-con-fuentes={fuentes ? true : undefined} data-panel={historial || undefined}>
      {fuentes && (
        <>
          <aside id="panel-fuentes" className="panel panel-fuentes" data-abierto={fuentesAbiertas || undefined} aria-labelledby="fuentes">
            <div className="panel-cabecera">
              <h2 id="fuentes" ref={tituloFuentes} tabIndex={-1}>
                Fuentes <span className="contador">{fuentes.length}</span>
              </h2>
              <button
                type="button"
                className="boton-icono solo-compacto"
                onClick={() => {
                  setFuentesAbiertas(false);
                  botonFuentes.current?.focus();
                }}
              >
                <Icono nombre="cerrar" />
                <span className="visually-hidden">Cerrar fuentes</span>
              </button>
            </div>
            <p className="panel-nota">
              <Icono nombre="candado" tamano={16} />
              Privadas: solo tú las ves.
            </p>
            {fuentes.length === 0 ? (
              <p className="suave panel-vacio">Agrega tu primera fuente para que el Tutor la cite.</p>
            ) : (
              <ul className="lista-fuentes">
                {fuentes.map((f) => (
                  <li key={f.contentId} className="fuente">
                    <div className="fuente-cabeza">
                      <Icono nombre="fuente" />
                      <div className="fuente-datos">
                        <p className="fuente-titulo">{f.titulo}</p>
                        <p className="fuente-meta">
                          <span>{f.formato}</span>
                          <span className="num">{kb(f.bytes)}</span>
                        </p>
                      </div>
                    </div>
                    <p className={`estado-fuente estado-${f.estadoLectura.toLowerCase()}`}>
                      {f.estadoLectura === 'LISTA' ? <Icono nombre="listo" tamano={16} /> : f.estadoLectura === 'FALLIDA' ? <Icono nombre="aviso" tamano={16} /> : <span className="girador girador-chico keep-motion" aria-hidden="true" />}
                      {ESTADOS[f.estadoLectura] ?? f.estadoLectura}
                    </p>
                    <SelectorFuente espacioId={props.espacioId ?? ''} contentId={f.contentId} seleccionada={f.seleccionada} />
                  </li>
                ))}
              </ul>
            )}
            <details className="agregar-fuente" open={agregarAbierto} onToggle={(e) => setAgregarAbierto(e.currentTarget.open)}>
              <summary className="boton boton-secundario boton-ancho">
                <Icono nombre="subir" />
                Agregar fuente
              </summary>
              {props.espacioId && <FormularioFuente espacioId={props.espacioId} />}
            </details>
          </aside>
          {fuentesAbiertas && <button type="button" className="velo velo-fuentes" tabIndex={-1} aria-hidden="true" onClick={() => setFuentesAbiertas(false)} />}
        </>
      )}

      <section className="lienzo" aria-labelledby="titulo-trabajo">
        <header className="lienzo-barra">
          <div className="lienzo-titulos">
            {props.contexto}
            <h1 id="titulo-trabajo">{props.titulo ?? 'Tutor'}</h1>
            {resumenFuentes && <p className="lienzo-resumen">{resumenFuentes}</p>}
          </div>
          <div className="lienzo-acciones">
            {fuentes && (
              <button
                ref={botonFuentes}
                type="button"
                className="boton boton-terciario solo-compacto"
                aria-expanded={fuentesAbiertas}
                aria-controls="panel-fuentes"
                onClick={() => setFuentesAbiertas(true)}
              >
                <Icono nombre="fuente" />
                Fuentes <span className="contador">{fuentes.length}</span>
              </button>
            )}
            <button
              ref={botonConversacion}
              type="button"
              className="boton boton-terciario"
              aria-expanded={historial}
              aria-controls="panel-lateral"
              onClick={() => setHistorial((h) => !h)}
            >
              <Icono nombre="historial" />
              Conversación <span className="contador">{intercambios.length}</span>
            </button>
          </div>
        </header>

        <div className="lienzo-superficie" aria-label="Cuaderno de estudio" role="region" data-herramienta={herramienta}>
          {actual && !enCurso && <HerramientasCuaderno actual={herramienta} alCambiar={(h) => setHerramienta((a) => (a === h ? 'texto' : h))} sinResaltado={!conResaltado} />}
          <div
            ref={tablero}
            className="tablero-lienzo"
            data-con-fijadas={fijadasActuales.length > 0 || undefined}
            onClick={(e) => {
              if (herramienta !== 'nota') return;
              const ancla = (e.target as Element).closest<HTMLElement>('[data-ancla]')?.dataset.ancla;
              if (ancla) {
                anotar(ancla);
                setHerramienta('texto');
              }
            }}
          >
            {enCurso ? (
              <article className="hoja objeto-pendiente" aria-busy="true" aria-labelledby="objeto-en-curso">
                <header className="objeto-pregunta">
                  <Icono nombre="conversaciones" />
                  <h2 id="objeto-en-curso" className="objeto-titulo">
                    <span className="visually-hidden">Tu pregunta: </span>
                    {enCurso}
                  </h2>
                </header>
                <p role="status" className="pendiente-estado">
                  <span className="girador keep-motion" aria-hidden="true" />
                  {fuentes && elegidas > 0 ? 'El Tutor está buscando en tus fuentes…' : 'El Tutor está preparando la explicación…'}
                </p>
                <div className="esqueleto" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
              </article>
            ) : actual ? (
              <>
                <Hoja
                  intercambio={actual}
                  {...(respuesta && info[respuesta.id] ? { info: info[respuesta.id] } : {})}
                  fijadas={fijadasActuales}
                  seleccionados={bloquesSel}
                  alCitar={alternarFijada}
                  notasDe={notasDe}
                />
                {respuesta && fijadasActuales.length > 0 && (
                  <aside className="fijadas" aria-label="Pasajes de tus fuentes">
                    {fijadasActuales.map((n) => {
                      const c = respuesta.citas?.find((x) => Number(x.id) === n);
                      if (!c) return null;
                      const ancla = `c:${respuesta.id}:${n}`;
                      return (
                        <article key={n} className="fijada" data-n={n} aria-labelledby={`fijada-${n}`}>
                          <header className="fijada-cabeza">
                            <span className="cita-numero num">{n}</span>
                            <h3 id={`fijada-${n}`} className="fijada-fuente">
                              {c.titulo}
                            </h3>
                            <button type="button" className="boton-icono" onClick={() => alternarFijada(respuesta.id, n)}>
                              <Icono nombre="cerrar" tamano={16} />
                              <span className="visually-hidden">Quitar el pasaje {n} del lienzo</span>
                            </button>
                          </header>
                          <blockquote className="estudio bloque-texto" data-ancla={ancla} data-seleccionado={bloquesSel.includes(ancla) || undefined}>
                            {legible(c.fragmento)}
                          </blockquote>
                          {notasDe(ancla)}
                        </article>
                      );
                    })}
                  </aside>
                )}
                <HilosCita tablero={tablero} claves={`${actual.clave}|${fijadasActuales.join(',')}|${cuaderno.notas.length}|${historial}`} />
                {(herramienta === 'region' || herramienta === 'lazo') && (
                  <CapaSeleccion
                    modo={herramienta}
                    tablero={tablero}
                    alSeleccionar={(anclas) => {
                      setBloquesSel(anclas);
                      setHerramienta('texto');
                    }}
                  />
                )}
              </>
            ) : (
              <div className="lienzo-vacio">
                {fuentes && fuentes.length === 0 ? (
                  <>
                    <h2>Agrega tu primera fuente</h2>
                    <p className="suave">El Tutor responde con tus apuntes y cita el pasaje que usa.</p>
                    <button
                      type="button"
                      className="boton boton-secundario"
                      onClick={() => {
                        setAgregarAbierto(true);
                        if (superpuesto(64)) setFuentesAbiertas(true);
                        else requestAnimationFrame(() => document.getElementById('titulo-fuente')?.focus());
                      }}
                    >
                      <Icono nombre="subir" />
                      Agregar fuente
                    </button>
                  </>
                ) : fuentes && leyendo && elegidas === 0 ? (
                  <>
                    <h2>Tus fuentes se están leyendo</h2>
                    <p className="suave">En unos segundos podrás preguntar sobre ellas. Esta lista se actualiza sola.</p>
                  </>
                ) : (
                  <>
                    <h2>{fuentes ? 'Pregunta sobre tus fuentes' : 'Continúa la conversación'}</h2>
                    <p className="suave">
                      {fuentes ? 'La respuesta aparecerá aquí como una hoja: podrás resaltarla, anotarla y abrir cada cita junto a su pasaje.' : 'Escribe tu pregunta abajo.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          {actual && !enCurso && (
            <p className="lienzo-guardado">
              <Icono nombre="candado" tamano={16} />
              Tus resaltados y notas se guardan en este navegador hasta que cierres sesión.
            </p>
          )}
        </div>

        {seleccion && (
          <BarraSeleccion
            seleccion={seleccion}
            yaResaltado={yaResaltado}
            sinResaltado={!conResaltado}
            alResaltar={() => {
              cuaderno.resaltar({ ancla: seleccion.ancla, inicio: seleccion.inicio, fin: seleccion.fin });
              window.getSelection()?.removeAllRanges();
              setSeleccion(null);
            }}
            alQuitar={() => {
              cuaderno.quitarResaltados(seleccion.ancla, seleccion.inicio, seleccion.fin);
              window.getSelection()?.removeAllRanges();
              setSeleccion(null);
            }}
            alAnotar={() => anotar(seleccion.ancla)}
            alPreguntar={() => preguntarSobre(seleccion.texto)}
          />
        )}

        <div className="consulta">
          {error && (
            <div role="alert" className="mensaje mensaje-error consulta-error">
              <Icono nombre="aviso" />
              <span>{error.texto}</span>
              {REINTENTABLES.has(error.codigo) && (
                <button type="button" className="boton boton-secundario boton-chico" onClick={() => void preguntar(pendiente.current?.pregunta ?? pregunta.trim())} disabled={enviando}>
                  <Icono nombre="reintentar" />
                  Reintentar
                </button>
              )}
              {error.codigo === 'NO_AUTENTICADO' && (
                <a className="boton boton-secundario boton-chico" href="/auth/ingresar">
                  Ingresar
                </a>
              )}
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviarDesdeFormulario();
            }}
            className="barra-consulta"
            method="post"
            aria-busy={enviando}
          >
            {bloquesSel.length > 0 && (
              <div className="consulta-seleccion" role="status">
                <Icono nombre={herramienta === 'lazo' ? 'lazo' : 'region'} tamano={16} />
                <span>
                  {bloquesSel.length} {bloquesSel.length === 1 ? 'fragmento seleccionado' : 'fragmentos seleccionados'}: la pregunta se hará sobre ellos.
                </span>
                {conResaltado && (
                  <button
                    type="button"
                    className="boton boton-terciario boton-chico"
                    onClick={() => {
                      for (const a of bloquesSel) cuaderno.resaltar({ ancla: a, inicio: 0, fin: largoDe(a) });
                      setBloquesSel([]);
                    }}
                  >
                    Resaltar
                  </button>
                )}
                <button type="button" className="boton boton-terciario boton-chico" onClick={() => setBloquesSel([])}>
                  Quitar
                </button>
              </div>
            )}
            <label htmlFor="pregunta" className="visually-hidden">
              Tu pregunta
            </label>
            <textarea
              ref={campoPregunta}
              id="pregunta"
              name="pregunta"
              required
              maxLength={MAX_PREGUNTA}
              rows={2}
              value={pregunta}
              onChange={(e) => setPregunta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  e.currentTarget.form?.requestSubmit();
                }
              }}
              placeholder={bloquesSel.length > 0 ? '¿Qué quieres saber de lo seleccionado?' : fuentes ? 'Ej.: ¿Dónde ocurre la fotosíntesis?' : 'Escribe tu pregunta'}
              aria-describedby="consulta-contexto"
            />
            <div className="barra-consulta-pie">
              <p id="consulta-contexto" className="consulta-contexto">
                {contextoConsulta} <span className="solo-escritorio">Ctrl + Enter envía.</span>
              </p>
              <span className="consulta-cuenta num" aria-hidden="true">
                {pregunta.length}/{MAX_PREGUNTA}
              </span>
              <button type="submit" className="boton boton-primario" disabled={enviando || !hidratado}>
                {enviando ? <span className="girador keep-motion" aria-hidden="true" /> : <Icono nombre="enviar" />}
                {enviando ? 'Consultando…' : 'Preguntar'}
              </button>
            </div>
          </form>
          <p className="visually-hidden" role="status">
            {anuncio}
          </p>
        </div>
      </section>

      <aside id="panel-lateral" className="panel panel-lateral" data-abierto={historial || undefined} aria-labelledby="titulo-panel">
        <div className="panel-cabecera">
          <h2 id="titulo-panel" ref={tituloPanel} tabIndex={-1}>
            Conversación
          </h2>
          <button
            type="button"
            className="boton-icono"
            onClick={() => {
              setHistorial(false);
              botonConversacion.current?.focus();
            }}
          >
            <Icono nombre="cerrar" />
            <span className="visually-hidden">Cerrar el panel</span>
          </button>
        </div>
        {props.expiraEn && <p className="panel-nota">Se elimina automáticamente el {fecha(props.expiraEn)}, 90 días después de la última actividad.</p>}
        {intercambios.length === 0 ? (
          <p className="suave panel-vacio">Aún no hay preguntas en esta conversación.</p>
        ) : (
          <ol className="historial">
            {intercambios.map((i) => {
              const citas = i.respuesta?.citas?.length ?? 0;
              return (
                <li key={i.clave}>
                  <button type="button" className="historial-item" aria-current={i.clave === actual?.clave ? 'true' : undefined} onClick={() => elegir(i.clave)}>
                    <span className="historial-pregunta">{i.pregunta?.texto ?? 'Respuesta sin pregunta guardada'}</span>
                    <span className="historial-meta">{!i.respuesta ? 'Sin respuesta guardada' : citas > 0 ? `${citas} ${citas === 1 ? 'cita' : 'citas'} de tus fuentes` : 'Sin citas de tus fuentes'}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </aside>
      {historial && <button type="button" className="velo velo-panel" tabIndex={-1} aria-hidden="true" onClick={() => setHistorial(false)} />}
    </div>
  );
}

/** Hoja del cuaderno: la pregunta, la explicación (tipografía de estudio) con sus notas y la lista de citas. */
function Hoja({
  intercambio,
  info,
  fijadas,
  seleccionados,
  alCitar,
  notasDe,
}: {
  intercambio: Intercambio;
  info?: InfoRespuesta;
  fijadas: number[];
  seleccionados: string[];
  alCitar: (mensajeId: string, n: number) => void;
  notasDe: (ancla: string) => ReactNode;
}) {
  const r = intercambio.respuesta;
  const citas = r?.citas ?? [];
  const numeros = citas.map((c) => Number(c.id)).filter(Number.isFinite);
  const modo = info ? MODOS[info.modo] : citas.length > 0 ? 'Según tus fuentes' : 'Sin citas de tus fuentes';
  return (
    <article className="hoja" aria-labelledby={`pregunta-${intercambio.clave}`}>
      {intercambio.pregunta && (
        <header className="objeto-pregunta">
          <Icono nombre="conversaciones" />
          <h2 id={`pregunta-${intercambio.clave}`} className="objeto-titulo">
            <span className="visually-hidden">Tu pregunta: </span>
            {intercambio.pregunta.texto}
          </h2>
        </header>
      )}
      {r ? (
        <>
          <div className="objeto-etiquetas">
            <span className={`etiqueta ${citas.length > 0 ? 'etiqueta-fuentes' : 'etiqueta-general'}`}>{modo}</span>
            {info && <span className="etiqueta etiqueta-ruta">Respondió: {info.etiqueta}</span>}
          </div>
          <div className="explicacion estudio" aria-label="Respuesta del Tutor">
            <Markdown texto={r.texto} citas={numeros} fijadas={fijadas} ancla={`m:${r.id}`} seleccionados={seleccionados} alCitar={(n) => alCitar(r.id, n)} despues={notasDe} />
          </div>
          {info && info.avisos.length > 0 && (
            <ul className="objeto-avisos">
              {info.avisos.map((a) => (
                <li key={a}>
                  <Icono nombre="info" tamano={16} />
                  {a}
                </li>
              ))}
            </ul>
          )}
          {citas.length > 0 && (
            <section className="citas" aria-labelledby={`citas-${r.id}`}>
              <h3 id={`citas-${r.id}`}>Fuentes citadas</h3>
              <ol>
                {citas.map((c) => (
                  <li key={c.id} value={Number(c.id) || undefined}>
                    <button type="button" className="cita-boton" aria-pressed={fijadas.includes(Number(c.id))} onClick={() => alCitar(r.id, Number(c.id))}>
                      <span className="cita-numero num">{c.id}</span>
                      <span className="cita-texto">
                        <span className="cita-titulo">{c.titulo}</span>
                        <q className="cita-extracto">
                          {legible(c.fragmento).replace(/\s+/g, ' ').slice(0, 140)}
                          {c.fragmento.length > 140 ? '…' : ''}
                        </q>
                      </span>
                      <span className="cita-accion">
                        <Icono nombre="fijar" tamano={16} />
                        {fijadas.includes(Number(c.id)) ? 'En el lienzo' : 'Ver al lado'}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </>
      ) : (
        <p className="suave">Esta pregunta no tiene una respuesta guardada. Puedes volver a hacerla.</p>
      )}
    </article>
  );
}
