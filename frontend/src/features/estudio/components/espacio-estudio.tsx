'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { BloqueVista, deRespuesta, interaccionInicial, NOMBRE_TIPO, type Accion, type Bloque, type EstadoEspacio } from '@/features/bloques';
import { FormularioFuente, SelectorFuente } from '@/features/espacios';
import {
  accionesPara,
  BarraHerramientas,
  Cajon,
  componerConsulta,
  ControlesZoom,
  diagramaInicial,
  DialogoInsertar,
  EntradaTutor,
  lineasDeTrabajo,
  lineasMencionadas,
  MAX_PROPIOS,
  modoInicial,
  modosPara,
  nuevoId,
  propiosDe,
  recordar,
  recuperar,
  resumenBloque,
  resumenTrabajo,
  rolDeTitulo,
  SuperficiePizarra,
  textoGuardado,
  tipoActividad,
  trasladarRecuerdo,
  usePizarra,
  type AccionRapida,
  type Asistencia,
  type ContextoConsulta,
  type ErrorEntrada,
  type Ficha,
  type Fondo,
  type Insercion,
  type ModoPedagogico,
  type OpcionMas,
} from '@/features/pizarra';
import type { FuenteVista } from '@/features/tutor';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import { useHidratado } from '@/hooks/hidratado';
import { apiCliente } from '@/lib/api-cliente';
import { useEspacio } from '../hooks/use-espacio';
import { useEstadoSesion } from '../hooks/use-estado-sesion';
import { conservarClave, consultar, crearConversacion, errorTutor, MAX_PREGUNTA, nuevaClave, type ErrorTutor, type RespuestaTutor, type Superficie } from '../tutor-api';
import { Recorrido, type PasoRecorrido } from './recorrido';

export type SesionTema = { id: string; titulo: string; actualizadaEn: string };
type Panel = 'sesiones' | 'conversacion' | 'fuentes' | 'referencias' | 'tema';
type Ultima = { modo: string; etiqueta: string; avisos: string[] };

const NOMBRE_RECURSO: Record<string, string> = { CONSULTA_GENERAL: 'consultas generales', CONSULTA_TECNICA: 'consultas técnicas' };
const MODOS_FUENTE: Record<RespuestaTutor['modoFuentes'], string> = { FUNDAMENTADA: 'Según tus fuentes', MIXTA: 'Tus fuentes y explicación general', GENERAL: 'Explicación general' };
const ESTADOS_FUENTE: Record<string, string> = { LISTA: 'Lista para el Tutor', PENDIENTE: 'En cola', INDEXANDO: 'Leyendo…', FALLIDA: 'No se pudo leer' };
const FONDOS: Array<[Fondo, string]> = [
  ['cuadricula', 'Cuadrícula'],
  ['puntos', 'Puntos'],
  ['limpio', 'Limpio'],
];
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', timeZone: 'America/Lima' });
const ATAJOS: Array<[string, string]> = [
  ['V · H', 'Seleccionar · desplazar'],
  ['P · M · Y · E', 'Lápiz · plumón · resaltador · borrador'],
  ['T · L · A · R · O', 'Texto · línea · flecha · rectángulo · círculo'],
  ['Ctrl + Z · Ctrl + Mayús + Z', 'Deshacer · rehacer'],
  ['Supr · Ctrl + D', 'Eliminar · duplicar lo seleccionado'],
  ['+ · − · 0', 'Acercar · alejar · 100 %'],
  ['Mayús + 1 · Mayús + 2', 'Ajustar todo · enfocar la selección'],
  ['Flechas', 'Desplazar la pizarra (o mover lo seleccionado)'],
  ['Enter', 'Con texto o una forma: insertarlo en el centro'],
  ['Ctrl + rueda · dos dedos', 'Acercar y alejar'],
];

/**
 * Espacio educativo: una pizarra inteligente donde la persona escribe y resuelve con el Tutor (no un chat con una pizarra
 * al lado). Encabezado compacto (ruta, título, guardado real y paneles); la pizarra ocupa la pantalla: contenido educativo
 * en bloques y la capa de trabajo encima, con la misma vista; herramientas a un lado, zoom en una esquina y la entrada del
 * Tutor abajo. Sesiones, conversación, fuentes, referencias e información del tema son paneles cerrados por omisión.
 * Todo cambio en los bloques pasa por acciones validadas; lo que se guarda (y lo que no) se dice tal cual.
 */
export function EspacioEstudio(props: {
  migas: Array<{ texto: string; href?: string }>;
  titulo: string;
  descripcion?: string;
  rotuloContenido?: string;
  bloques: unknown[];
  tutor: {
    superficie: Superficie;
    espacioId?: string;
    conversacionId?: string;
    expiraEn?: string;
    contexto?: string;
    disponibles?: { recurso: string; cantidad: number };
    preguntaInicial?: string;
    examen?: { preparacionId: string; temaId: string };
  };
  sesiones?: { lista: SesionTema[]; actual?: string; nueva: string };
  fuentes?: FuenteVista[];
  recorrido?: PasoRecorrido[];
  vinculos?: (anterior: EstadoEspacio, nuevo: EstadoEspacio) => Accion[];
  vacio?: ReactNode;
  /** En un examen: «sin-solucion» deja al Tutor solo guiar; «ninguna» quita el Tutor (la pizarra sigue). */
  asistencia?: Asistencia | 'ninguna';
}) {
  const router = useRouter();
  const hidratado = useHidratado();
  const id = useId();
  const raiz = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const asistencia: Asistencia = props.asistencia === 'sin-solucion' ? 'sin-solucion' : 'completa';
  const conTutor = props.asistencia !== 'ninguna';

  const [conversacionId, setConversacionId] = useState(props.tutor.conversacionId);
  const claveMemoria = conversacionId ?? `nueva:${props.tutor.espacioId ?? props.titulo}`;
  // Lo que aún no llegó al servidor (o no tiene contrato) sobrevive a un nuevo montaje en la misma pestaña.
  const [recuerdo] = useState(() => recuperar(claveMemoria));
  const { estado, despachar, aplicar, reemplazar, aviso, cerrarAviso, anuncio } = useEspacio(
    useMemo(() => [...props.bloques, ...(recuerdo?.propios ?? []).filter((b) => !props.bloques.some((x) => (x as { id?: string }).id === b.id))], []),
    props.vinculos,
  );
  const actualEstado = useRef(estado);
  actualEstado.current = estado;

  /** Deshacer o rehacer cambió los bloques propios: se reflejan con acciones validadas. */
  const sincronizarPropios = useCallback(
    (propios: Bloque[]) => {
      const e = actualEstado.current;
      const quedan = new Set(propios.map((b) => b.id));
      const sin = e.bloques.filter((b) => b.origen !== 'persona' || quedan.has(b.id));
      let base = e;
      if (sin.length !== e.bloques.length) {
        base = { ...e, bloques: sin, activo: sin.some((b) => b.id === e.activo) ? e.activo : (sin.at(-1)?.id ?? null), interaccion: Object.fromEntries(Object.entries(e.interaccion).filter(([k]) => sin.some((b) => b.id === k))) };
        reemplazar(base);
      }
      const faltan = propios.filter((b) => !base.bloques.some((x) => x.id === b.id));
      if (faltan.length) aplicar(faltan.map((bloque) => ({ accion: 'crear-bloque', bloque })));
    },
    [aplicar, reemplazar],
  );
  const p = usePizarra({ sincronizarPropios, inicial: recuerdo?.elementos, propiosIniciales: propiosDe(estado.bloques) });
  const guardadoBloques = useEstadoSesion(conversacionId, estado, { reemplazar, aplicar, alRestaurar: p.basePropios });

  const [pregunta, setPregunta] = useState(props.tutor.preguntaInicial ?? '');
  const [enviando, setEnviando] = useState<string | null>(null);
  const [error, setError] = useState<ErrorTutor | null>(null);
  const [cancelada, setCancelada] = useState(false);
  const [ultima, setUltima] = useState<Ultima | null>(recuerdo?.ultima ?? null);
  const [disponibles, setDisponibles] = useState(props.tutor.disponibles);
  const [textoElegido, setTextoElegido] = useState('');
  const [sinFoco, setSinFoco] = useState(false);
  const [sinTrabajo, setSinTrabajo] = useState(false);
  const [guiaIntento, setGuiaIntento] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  const [insertando, setInsertando] = useState<Exclude<Insercion, 'diagrama'> | null>(null);
  const [recorrido, setRecorrido] = useState<{ paso: number; base: EstadoEspacio } | null>(null);
  const [completa, setCompleta] = useState(false);
  const [opciones, setOpciones] = useState(false);
  const [agregarFuente, setAgregarFuente] = useState(false);
  const [comentadas, setComentadas] = useState<Map<string, string>>(() => new Map(recuerdo?.comentadas ?? []));
  const [sesiones, setSesiones] = useState(props.sesiones?.lista ?? []);
  const pendiente = useRef<{ clave: string; pregunta: string } | null>(null);
  const control = useRef<AbortController | null>(null);
  const menuOpciones = useRef<HTMLDivElement>(null);
  const botonOpciones = useRef<HTMLButtonElement>(null);

  const bloques = estado.bloques;
  const activo = bloques.find((b) => b.id === estado.activo) ?? null;
  const fuentes = props.fuentes;
  const elegidas = fuentes?.filter((f) => f.seleccionada && f.estadoLectura === 'LISTA') ?? [];
  const delTutor = bloques.filter((b) => b.origen === 'tutor');
  const refDe = useCallback((bid: string) => `B${bloques.findIndex((b) => b.id === bid) + 1}`, [bloques]);
  const lineas = useMemo(() => lineasDeTrabajo(p.elementos, new Map()), [p.elementos]);
  const citas = useMemo(() => bloques.flatMap((b) => (b.referencias ?? []).flatMap((r) => (r.tipo === 'cita' ? [{ bloque: b, r }] : []))), [bloques]);

  // Memoria de la pestaña (no localStorage): la capa de trabajo, los bloques propios y las marcas de revisión.
  useEffect(() => {
    recordar(claveMemoria, { elementos: p.elementos, propios: propiosDe(bloques), comentadas: [...comentadas], ultima });
  }, [claveMemoria, p.elementos, bloques, comentadas, ultima]);

  /* ---------------------------------------------- efectos de entrada */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has('agregar') && fuentes) {
      setAgregarFuente(true);
      setPanel('fuentes');
    } else if (q.has('preguntar') || props.tutor.preguntaInicial) requestAnimationFrame(() => campo.current?.focus({ preventScroll: true }));
  }, [fuentes, props.tutor.preguntaInicial]);

  // Mientras alguna fuente se está leyendo, los datos se actualizan solos (hasta un minuto).
  const leyendo = fuentes?.some((f) => f.estadoLectura === 'PENDIENTE' || f.estadoLectura === 'INDEXANDO') ?? false;
  const intentos = useRef(0);
  useEffect(() => {
    if (!leyendo || intentos.current >= 24) return;
    const t = setTimeout(() => {
      intentos.current += 1;
      router.refresh();
    }, 2500);
    return () => clearTimeout(t);
  }, [leyendo, fuentes, router]);

  // Texto seleccionado con el ratón dentro de la pizarra: se puede enviar como contexto (ficha que se quita).
  useEffect(() => {
    const alCambiar = () => {
      const s = window.getSelection();
      if (!s || s.isCollapsed) return;
      const zona = raiz.current?.querySelector('.pizarra-columna');
      if (!zona?.contains(s.anchorNode)) return;
      const t = s.toString().replace(/\s+/g, ' ').trim();
      if (t.length >= 3) setTextoElegido(t.slice(0, 600));
    };
    document.addEventListener('selectionchange', alCambiar);
    return () => document.removeEventListener('selectionchange', alCambiar);
  }, []);

  useEffect(() => {
    const alCambiar = () => setCompleta(document.fullscreenElement === raiz.current);
    document.addEventListener('fullscreenchange', alCambiar);
    return () => document.removeEventListener('fullscreenchange', alCambiar);
  }, []);

  useEffect(() => {
    if (!opciones) return;
    const fuera = (e: PointerEvent) => {
      if (!menuOpciones.current?.contains(e.target as Node) && !botonOpciones.current?.contains(e.target as Node)) setOpciones(false);
    };
    document.addEventListener('pointerdown', fuera);
    return () => document.removeEventListener('pointerdown', fuera);
  }, [opciones]);

  // Cuando el Tutor o el recorrido enfocan un bloque, la pizarra lo lleva a la vista.
  const enfocadoAntes = useRef(estado.activo);
  useEffect(() => {
    if (!estado.activo || estado.activo === enfocadoAntes.current) return;
    enfocadoAntes.current = estado.activo;
    const bid = estado.activo;
    requestAnimationFrame(() => requestAnimationFrame(() => p.controles.current?.enfocarBloque(bid)));
  }, [estado.activo, p.controles]);

  /* -------------------------------------------------- contexto */
  const enFoco = useMemo(() => {
    if (p.seleccion.bloques.length) return bloques.filter((b) => p.seleccion.bloques.includes(b.id));
    return activo && !sinFoco ? [activo] : [];
  }, [p.seleccion.bloques, bloques, activo, sinFoco]);
  const lineasElegidas = p.seleccion.elementos.length ? lineas.filter((l) => p.seleccion.elementos.includes(l.id)) : sinTrabajo ? [] : lineas;
  const sinTexto = useMemo(() => {
    const ids = p.seleccion.elementos.length ? new Set(p.seleccion.elementos) : null;
    if (!ids && sinTrabajo) return 0;
    return p.elementos.filter((e) => e.tipo !== 'texto' && (!ids || ids.has(e.id))).length;
  }, [p.elementos, p.seleccion.elementos, sinTrabajo]);
  const actividad = tipoActividad(enFoco.length ? enFoco : bloques.slice(-3), lineas.some((l) => l.expresion));
  const modosDisponibles = modosPara(actividad, asistencia);
  const [modo, setModo] = useState<ModoPedagogico>(() => recuerdo?.modo ?? modoInicial(tipoActividad(estado.bloques.slice(-3), false), asistencia));
  useEffect(() => {
    if (!modosDisponibles.includes(modo)) setModo(modosDisponibles[0] ?? 'aprender');
  }, [modosDisponibles, modo]);

  const contexto = (): ContextoConsulta => ({
    bloques: enFoco.map((b) => ({ ref: refDe(b.id), resumen: resumenBloque(b, estado.interaccion[b.id] ?? interaccionInicial(b)) })).filter((x) => x.resumen),
    lineas: lineasElegidas.map((l) => ({ etiqueta: l.etiqueta, texto: l.texto, expresion: l.expresion })),
    sinTexto,
  });
  const foco = enFoco[0]?.titulo && enFoco[0].origen !== 'tutor' ? enFoco[0].titulo : props.titulo;

  /* ------------------------------------------------- sesiones */
  const asegurarConversacion = useCallback(async () => {
    if (conversacionId) return conversacionId;
    const nueva = await crearConversacion(props.tutor.superficie, props.tutor.espacioId, props.tutor.examen);
    trasladarRecuerdo(claveMemoria, nueva);
    setConversacionId(nueva);
    // La sesión queda en la URL sin volver a montar la pizarra (lo que hay en pantalla se conserva).
    if (props.sesiones) {
      window.history.replaceState(window.history.state, '', `${window.location.pathname}?sesion=${nueva}`);
      setSesiones((s) => [{ id: nueva, titulo: 'Sesión de hoy', actualizadaEn: new Date().toISOString() }, ...s]);
    }
    return nueva;
  }, [conversacionId, props.tutor.superficie, props.tutor.espacioId, props.tutor.examen, props.sesiones, claveMemoria]);

  /* --------------------------------------------------- enviar */
  async function enviar(accion?: AccionRapida) {
    if (enviando || !conTutor) return;
    if (accion === 'revisar' && lineasElegidas.length === 0) {
      setGuiaIntento(true);
      return;
    }
    if (!accion && !pregunta.trim()) return;
    const c = componerConsulta({ texto: accion ? '' : pregunta, modo, accion, contexto: contexto(), foco, pantalla: props.tutor.contexto, asistencia });
    const completaPregunta = textoElegido ? `${c.pregunta}\n\nFragmento que seleccioné: «${textoElegido}»`.slice(0, MAX_PREGUNTA) : c.pregunta;
    if (!pendiente.current || pendiente.current.pregunta !== completaPregunta) pendiente.current = { clave: nuevaClave(), pregunta: completaPregunta };
    setError(null);
    setCancelada(false);
    setGuiaIntento(false);
    setEnviando(c.visible);
    const ctrl = new AbortController();
    control.current = ctrl;
    const etiquetasEnviadas = lineasElegidas.map((l) => l.etiqueta);
    try {
      const conversacion = await asegurarConversacion();
      const r = await consultar({ conversacionId: conversacion, pregunta: completaPregunta, clave: pendiente.current.clave, espacioId: props.tutor.espacioId, modo: c.modo, senal: ctrl.signal });
      const orden = actualEstado.current.bloques.reduce((m, b) => Math.max(m, b.orden), -1) + 1;
      const { bloques: nuevos, acciones } = deRespuesta(r, orden, c.visible);
      aplicar([...nuevos.map((b, k) => ({ accion: 'crear-bloque', bloque: b, enfocar: k === 0 })), ...acciones]);
      const primero = (nuevos[0] as { id?: string } | undefined)?.id;
      // Revisión de un intento: se marcan (sin juzgar) las líneas que la respuesta nombra; el intento no cambia.
      if (primero && etiquetasEnviadas.length) {
        const nombradas = lineasMencionadas(r.segmentos.map((s) => s.markdown).join('\n'), etiquetasEnviadas);
        if (nombradas.length) setComentadas((m) => new Map([...m, ...nombradas.map((e) => [e, primero] as [string, string])]));
      }
      setUltima({ modo: MODOS_FUENTE[r.modoFuentes], etiqueta: r.uso.ruta.etiqueta, avisos: r.avisos });
      setDisponibles({ recurso: r.uso.recurso, cantidad: r.uso.restantesPeriodo });
      if (!accion) setPregunta('');
      setTextoElegido('');
      setSinFoco(false);
      setSinTrabajo(false);
      pendiente.current = null;
    } catch (e) {
      const err = errorTutor(e);
      if (err.codigo === 'CANCELADA') setCancelada(true);
      else setError(err);
      if (!conservarClave(err.codigo)) pendiente.current = null;
    } finally {
      control.current = null;
      setEnviando(null);
    }
  }

  const prepararPregunta = useCallback((texto: string) => {
    setPregunta(texto.slice(0, MAX_PREGUNTA));
    requestAnimationFrame(() => {
      const c = campo.current;
      c?.focus();
      c?.setSelectionRange(c.value.length, c.value.length);
    });
  }, []);

  /* ------------------------------------------------- insertar */
  const insertarBloque = useCallback(
    (b: Bloque) => {
      if (propiosDe(actualEstado.current.bloques).length >= MAX_PROPIOS) {
        p.setAviso(`Una sesión admite hasta ${MAX_PROPIOS} bloques propios. Quita alguno para agregar otro.`);
        return;
      }
      const orden = actualEstado.current.bloques.reduce((m, x) => Math.max(m, x.orden), -1) + 1;
      const r = aplicar([{ accion: 'crear-bloque', bloque: { ...b, orden }, enfocar: true }]);
      if (r.error) return;
      p.registrarPropios(propiosDe(r.estado.bloques));
      // El bloque propio se guarda con la sesión: si aún no existe, se crea (sin consumir consultas).
      void asegurarConversacion().catch(() => p.setAviso('No se pudo empezar la sesión: el bloque está en la pizarra, pero aún no se guardó.'));
    },
    [aplicar, p, asegurarConversacion],
  );
  const alInsertar = (i: Insercion) => {
    if (i === 'diagrama') {
      const [cx, cy] = p.controles.current?.centro() ?? [0, 0];
      p.agregarElementos(diagramaInicial([cx - 300, cy - 36], p.elementos));
      p.setHerramienta('seleccion');
      return;
    }
    setInsertando(i);
  };
  const alImagen = (f: File) => {
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      const [cx, cy] = p.controles.current?.centro() ?? [0, 0];
      const escala = Math.min(1, 480 / img.naturalWidth, 360 / img.naturalHeight);
      const w = Math.round(img.naturalWidth * escala);
      const h = Math.round(img.naturalHeight * escala);
      p.agregarElementos([{ id: nuevoId(), tipo: 'imagen', en: [cx - w / 2, cy - h / 2], w, h, src: url, nombre: f.name.slice(0, 120), estilo: { color: 'tinta', grosor: 1, opacidad: 1 } }]);
    };
    img.src = url;
  };

  function iniciarRecorrido() {
    if (!props.recorrido?.length) return;
    setRecorrido({ paso: 0, base: estado });
    setPanel(null);
    aplicar(props.recorrido[0]!.acciones);
  }
  function irAlPaso(k: number) {
    if (!recorrido || !props.recorrido) return;
    reemplazar(recorrido.base);
    aplicar(props.recorrido.slice(0, k + 1).flatMap((x) => x.acciones));
    setRecorrido({ ...recorrido, paso: k });
  }
  const alPantallaCompleta = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void raiz.current?.requestFullscreen?.().catch(() => p.setAviso('Este navegador no permite la pantalla completa aquí.'));
  };
  const irABloque = useCallback(
    (bid: string) => {
      despachar({ accion: 'enfocar-bloque', bloqueId: bid });
      p.controles.current?.enfocarBloque(bid);
    },
    [despachar, p.controles],
  );

  /* ------------------------------------------------ vista: bloques */
  const interaccion = (b: Bloque) => estado.interaccion[b.id] ?? interaccionInicial(b);
  const contenido =
    bloques.length === 0 ? (
      <div className="pz-vacio">
        {props.vacio ?? (
          <>
            <h2>¿Qué quieres aprender o resolver?</h2>
            <p>Escribe abajo tu pregunta o un ejercicio. La explicación aparecerá en esta pizarra, donde también puedes escribir, dibujar y resolver con las herramientas de la izquierda.</p>
          </>
        )}
        {conTutor && (
          <div className="pz-vacio-sugerencias">
            <button type="button" className="pz-rapida" onClick={() => prepararPregunta(`Explícame desde cero: ${props.titulo}`)}>
              Explícame desde cero
            </button>
            <button type="button" className="pz-rapida" onClick={() => setInsertando('ejercicio')}>
              Tengo un ejercicio
            </button>
          </div>
        )}
      </div>
    ) : (
      bloques.map((b) => {
        const rol = b.origen === 'tutor' ? rolDeTitulo(b.titulo) : null;
        const elegido = p.seleccion.bloques.includes(b.id);
        return (
          <div key={b.id} className="pizarra-bloque" data-bloque-pz={b.id} data-origen={b.origen} data-seleccionado={elegido || undefined} data-activo={b.id === estado.activo || undefined}>
            <div className="pizarra-bloque-barra">
              <span className="pizarra-ref num" title="Identificador para el Tutor">
                {refDe(b.id)}
              </span>
              {rol && <span className="pizarra-rol">{rol}</span>}
              <span className="pizarra-bloque-acciones">
                {conTutor && (
                  <button
                    type="button"
                    className="pizarra-mini"
                    onClick={() => {
                      p.setHerramienta('seleccion');
                      p.setSeleccion({ elementos: [], bloques: [b.id] });
                      requestAnimationFrame(() => campo.current?.focus({ preventScroll: true }));
                    }}
                  >
                    Preguntar sobre esto
                  </button>
                )}
                <button type="button" className="pizarra-mini" onClick={() => p.controles.current?.ajustarBloque(b.id)}>
                  Ampliar<span className="visually-hidden">: {b.titulo ?? NOMBRE_TIPO[b.tipo]}</span>
                </button>
              </span>
            </div>
            <BloqueVista bloque={b} interaccion={interaccion(b)} despachar={despachar} alPreguntar={conTutor ? prepararPregunta : undefined} activo={b.id === estado.activo} />
          </div>
        );
      })
    );

  /* ---------------------------------------------- entrada: fichas */
  const fichas: Ficha[] = [];
  if (enFoco.length)
    fichas.push({
      id: 'foco',
      icono: 'seleccionar',
      texto: enFoco.length === 1 ? `${refDe(enFoco[0]!.id)} · ${enFoco[0]!.titulo ?? NOMBRE_TIPO[enFoco[0]!.tipo]}` : `${enFoco.length} bloques: ${enFoco.map((b) => refDe(b.id)).join(', ')}`,
      detalle: p.seleccion.bloques.length ? 'Lo que elegiste en la pizarra' : 'El bloque en el que estás trabajando',
      quitar: () => (p.seleccion.bloques.length ? p.setSeleccion({ ...p.seleccion, bloques: [] }) : setSinFoco(true)),
    });
  if (lineasElegidas.length || sinTexto)
    fichas.push({
      id: 'trabajo',
      icono: 'lapiz',
      texto: lineasElegidas.length ? `Tu trabajo: ${lineasElegidas.length === 1 ? lineasElegidas[0]!.etiqueta : `${lineasElegidas[0]!.etiqueta}–${lineasElegidas.at(-1)!.etiqueta}`}` : 'Tus trazos (no se interpretan)',
      detalle: 'El Tutor lee solo lo escrito como texto; los trazos a mano se mencionan, no se leen.',
      quitar: () => (p.seleccion.elementos.length ? p.setSeleccion({ ...p.seleccion, elementos: [] }) : setSinTrabajo(true)),
    });
  if (textoElegido) fichas.push({ id: 'texto', icono: 'cita', texto: `«${textoElegido.slice(0, 48)}${textoElegido.length > 48 ? '…' : ''}»`, detalle: textoElegido, quitar: () => setTextoElegido('') });
  for (const f of elegidas)
    fichas.push({
      id: `fuente-${f.contentId}`,
      icono: 'fuente',
      texto: f.titulo,
      detalle: 'Fuente del tema elegida para el Tutor',
      quitar: () =>
        void apiCliente(`/espacios/${props.tutor.espacioId}/fuentes/${f.contentId}`, { metodo: 'PATCH', cuerpo: { seleccionada: false } }).then(
          () => router.refresh(),
          () => p.setAviso('No se pudo quitar la fuente. Inténtalo de nuevo.'),
        ),
    });

  const opcionesMas: OpcionMas[] = [
    ...(fuentes && props.tutor.espacioId
      ? [
          { id: 'adjuntar', texto: 'Adjuntar un PDF o un texto', ayuda: 'Se agrega como fuente privada del tema y el Tutor la cita', icono: 'adjuntar' as NombreIcono, elegir: () => (setAgregarFuente(true), setPanel('fuentes')) },
          ...(fuentes.length ? [{ id: 'fuentes', texto: 'Usar una fuente del tema', ayuda: `${fuentes.length} ${fuentes.length === 1 ? 'fuente' : 'fuentes'}; elige cuáles usa el Tutor`, icono: 'fuente' as NombreIcono, elegir: () => (setAgregarFuente(false), setPanel('fuentes')) }] : []),
        ]
      : []),
    { id: 'recurso-modelo', texto: 'Insertar un modelo 3D', ayuda: 'Del catálogo autorizado de Mentelyx', icono: 'cubo', elegir: () => setInsertando('modelo') },
    { id: 'recurso-documento', texto: 'Insertar un documento', ayuda: 'PDF del catálogo o de tu equipo (no se sube)', icono: 'fuente', elegir: () => setInsertando('documento') },
    {
      id: 'seleccionar',
      texto: 'Elegir contenido de la pizarra',
      ayuda: 'Pulsa bloques o arrastra un marco; se envía con tu pregunta',
      icono: 'seleccionar',
      elegir: () => {
        p.setHerramienta('seleccion');
        p.setAviso('Pulsa un bloque o arrastra un marco sobre la pizarra (Mayús suma). Lo elegido aparecerá aquí abajo como ficha.');
      },
    },
    { id: 'intento', texto: 'Escribir mi intento como texto', ayuda: 'Herramienta Texto: cada línea queda como L1, L2…', icono: 'texto', elegir: () => (p.setExpresion(true), p.setHerramienta('texto')) },
  ];

  const info = [
    fuentes ? (elegidas.length > 0 ? `Usará ${elegidas.length} ${elegidas.length === 1 ? 'fuente' : 'fuentes'}.` : 'Sin fuentes elegidas: explicación general.') : null,
    disponibles ? `Te quedan ${disponibles.cantidad} ${NOMBRE_RECURSO[disponibles.recurso] ?? 'consultas'} este mes.` : null,
    asistencia === 'sin-solucion' ? 'En este examen el Tutor solo guía.' : null,
  ]
    .filter(Boolean)
    .join(' ');

  const guardadoTexto = textoGuardado({ estado: guardadoBloques, enviando: !!enviando, errorPregunta: !!error, trabajo: p.elementos });
  const estadoGuardado = enviando || guardadoBloques === 'guardando' || guardadoBloques === 'cargando' ? 'guardando' : error || guardadoBloques === 'error' || guardadoBloques === 'demasiado-grande' ? 'error' : guardadoBloques === 'guardado' ? 'guardado' : 'sin-guardar';
  const resumen = resumenTrabajo(p.elementos);
  const errorEntrada: ErrorEntrada | null = error ? { texto: error.texto, reintentable: error.reintentable, ingresar: error.codigo === 'NO_AUTENTICADO' } : null;
  const avisoEntrada = guiaIntento ? (
    <div className="mensaje mensaje-info pz-entrada-aviso" role="status">
      <Icono nombre="info" />
      <span>Para revisar tu intento, escríbelo como texto (herramienta Texto, tecla T): cada línea queda como L1, L2… Mentelyx no lee la escritura a mano.</span>
      <button type="button" className="boton boton-secundario boton-chico" onClick={() => (p.setExpresion(true), p.setHerramienta('texto'), setGuiaIntento(false), p.controles.current?.insertarEnCentro('texto'))}>
        Escribir mi intento
      </button>
    </div>
  ) : cancelada ? (
    <div className="mensaje mensaje-info pz-entrada-aviso" role="status">
      <Icono nombre="info" />
      <span>Cancelaste la espera. Si el Tutor alcanzó a responder, al reenviar la misma pregunta verás esa respuesta sin otro descuento.</span>
      <button type="button" className="boton-icono" onClick={() => setCancelada(false)}>
        <Icono nombre="cerrar" tamano={16} />
        <span className="visually-hidden">Cerrar</span>
      </button>
    </div>
  ) : null;

  const botonPanel = (cual: Panel, texto: string, icono: NombreIcono, cuenta?: number) => (
    <button type="button" className="pz-cab-boton" aria-expanded={panel === cual} aria-controls={`${id}-${cual}`} onClick={() => setPanel((x) => (x === cual ? null : cual))}>
      <Icono nombre={icono} />
      <span className="pz-cab-texto">{texto}</span>
      {cuenta !== undefined && cuenta > 0 && <span className="contador">{cuenta}</span>}
    </button>
  );

  return (
    <div ref={raiz} className="pz-espacio" data-con-tutor={conTutor || undefined}>
      <header className="pz-cabecera">
        <div className="pz-cab-titulos">
          <nav aria-label="Migas de pan" className="pz-migas">
            <ol>
              {props.migas.slice(0, -1).map((m, i) => (
                <li key={i}>{m.href ? <Link href={m.href}>{m.texto}</Link> : <span>{m.texto}</span>}</li>
              ))}
            </ol>
          </nav>
          <h1 id={`${id}-titulo`}>{props.titulo}</h1>
        </div>
        <div className="pz-cab-estado">
          <p className="estudio-guardado pz-guardado" role="status" data-estado={estadoGuardado} title={guardadoTexto.principal}>
            <span className="estudio-guardado-punto" aria-hidden="true" />
            <span className="pz-guardado-texto">{guardadoTexto.principal}</span>
          </p>
          {guardadoTexto.trabajo && (
            <p className="pz-sin-contrato" title={guardadoTexto.trabajo}>
              <span className="pz-cab-texto">Trazos: solo en esta pantalla</span>
              <span className="visually-hidden">. {guardadoTexto.trabajo}</span>
            </p>
          )}
        </div>
        <div className="pz-cab-acciones">
          {props.sesiones && botonPanel('sesiones', 'Sesiones', 'historial', sesiones.length)}
          {conTutor && botonPanel('conversacion', 'Conversación', 'conversaciones', delTutor.length)}
          {citas.length > 0 && botonPanel('referencias', 'Referencias', 'cita', citas.length)}
          {botonPanel('tema', 'Tema', 'info')}
          <div className="pz-opciones-menu">
            <button ref={botonOpciones} type="button" className="pz-cab-boton" aria-expanded={opciones} aria-controls={`${id}-opciones`} aria-haspopup="menu" onClick={() => setOpciones((v) => !v)}>
              <Icono nombre="ajustes" />
              <span className="pz-cab-texto">Opciones</span>
            </button>
            {opciones && (
              <div ref={menuOpciones} id={`${id}-opciones`} className="pz-menu pz-menu-opciones" role="menu" aria-label="Opciones de la pizarra" onKeyDown={(e) => e.key === 'Escape' && (setOpciones(false), botonOpciones.current?.focus())}>
                <p className="pz-menu-grupo" id={`${id}-fondo`}>
                  Fondo de la pizarra
                </p>
                <div role="group" aria-labelledby={`${id}-fondo`}>
                  {FONDOS.map(([f, t]) => (
                    <button key={f} type="button" role="menuitemradio" aria-checked={p.fondo === f} onClick={() => p.setFondo(f)}>
                      <span className="pz-menu-nombre">{t}</span>
                      {p.fondo === f && <Icono nombre="listo" tamano={16} />}
                    </button>
                  ))}
                </div>
                {props.recorrido && props.recorrido.length > 0 && (
                  <button type="button" role="menuitem" onClick={() => (setOpciones(false), recorrido ? setRecorrido(null) : iniciarRecorrido())}>
                    <span className="pz-menu-nombre">{recorrido ? 'Salir del recorrido guiado' : 'Recorrido guiado'}</span>
                  </button>
                )}
                {props.sesiones && (
                  <Link role="menuitem" href={props.sesiones.nueva} onClick={() => setOpciones(false)}>
                    <span className="pz-menu-nombre">Empezar una sesión nueva</span>
                  </Link>
                )}
                <button type="button" role="menuitem" onClick={() => (setOpciones(false), alPantallaCompleta())}>
                  <span className="pz-menu-nombre">{completa ? 'Salir de la pantalla completa' : 'Pantalla completa'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="pz-area">
        <SuperficiePizarra
          p={p}
          contenido={contenido}
          claveContenido={`${bloques.length}:${bloques.map((b) => b.id).join(',')}`}
          comentadas={comentadas}
          alIrABloque={irABloque}
          etiqueta={`Pizarra: ${props.titulo}`}
          descripcionId={`${id}-descripcion`}
        />
        <p id={`${id}-descripcion`} className="visually-hidden">
          {bloques.length} {bloques.length === 1 ? 'bloque' : 'bloques'} de contenido ({delTutor.length} del Tutor). Tu trabajo: {resumen.trazos} trazos, {resumen.textos} textos, {resumen.formas} formas
          {resumen.imagenes ? `, ${resumen.imagenes} imágenes` : ''}. Elige una herramienta a la izquierda; con el teclado, las flechas desplazan la pizarra y Tab recorre el contenido. Los atajos están en el panel Tema.
        </p>
        <BarraHerramientas p={p} bloques={bloques} alInsertar={alInsertar} alPreguntarSeleccion={() => campo.current?.focus()} />
        <ControlesZoom p={p} completa={completa} alPantallaCompleta={alPantallaCompleta} />
        {(aviso || p.aviso) && (
          <div className="mensaje mensaje-info pz-aviso" role="status">
            <Icono nombre="info" />
            <span>{p.aviso ?? aviso?.mensaje}</span>
            <button type="button" className="boton-icono" onClick={() => (p.aviso ? p.setAviso(null) : cerrarAviso())}>
              <Icono nombre="cerrar" tamano={16} />
              <span className="visually-hidden">Cerrar el aviso</span>
            </button>
          </div>
        )}
        {recorrido && props.recorrido && (
          <div className="pz-recorrido">
            <Recorrido pasos={props.recorrido} actual={recorrido.paso} alIr={irAlPaso} alSalir={() => setRecorrido(null)} />
          </div>
        )}
        <p className="visually-hidden" role="status">
          {anuncio}
        </p>
      </div>

      {conTutor && (
        <EntradaTutor
          campo={campo}
          pregunta={pregunta}
          setPregunta={setPregunta}
          enviando={enviando}
          error={errorEntrada}
          aviso={avisoEntrada}
          alEnviar={(a) => void enviar(a)}
          alCancelar={() => control.current?.abort()}
          alReintentar={() => void enviar()}
          modo={modo}
          setModo={setModo}
          modos={modosDisponibles}
          acciones={accionesPara(actividad, asistencia).filter((a) => a !== 'revisar' || lineas.length > 0 || actividad === 'resolucion')}
          fichas={fichas}
          opcionesMas={opcionesMas}
          info={info}
          estadoProceso={elegidas.length > 0 ? 'El Tutor está buscando en tus fuentes…' : 'El Tutor está preparando la respuesta…'}
          ultima={
            ultima ? (
              <p className="pz-ultima">
                <span className="etiqueta">{ultima.modo}</span>
                <span className="etiqueta etiqueta-ruta">Respondió: {ultima.etiqueta}</span>
              </p>
            ) : null
          }
          maximo={MAX_PREGUNTA}
          hidratado={hidratado}
        />
      )}

      <Cajon id={`${id}-sesiones`} titulo="Sesiones de este tema" abierto={panel === 'sesiones'} alCerrar={() => setPanel(null)}>
        {sesiones.length === 0 ? (
          <p className="suave">Tu primera pregunta abre la primera sesión.</p>
        ) : (
          <ul className="estudio-sesiones">
            {sesiones.map((s) => (
              <li key={s.id}>
                <Link href={`?sesion=${s.id}`} aria-current={s.id === conversacionId ? 'page' : undefined} onClick={() => setPanel(null)}>
                  <span>{s.titulo}</span>
                  <span className="suave">{fecha(s.actualizadaEn)}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {props.sesiones && (
          <Link className="boton boton-secundario boton-chico" href={props.sesiones.nueva}>
            <Icono nombre="mas" tamano={16} />
            Empezar una sesión nueva
          </Link>
        )}
        {props.tutor.expiraEn && <p className="suave pz-nota-panel">Esta sesión se elimina el {fecha(props.tutor.expiraEn)}, 90 días después de la última actividad.</p>}
      </Cajon>

      <Cajon id={`${id}-conversacion`} titulo="Conversación" abierto={panel === 'conversacion'} alCerrar={() => setPanel(null)}>
        {delTutor.length === 0 ? (
          <p className="suave">Aún no hay respuestas en esta sesión. Cada respuesta del Tutor aparece en la pizarra como un bloque.</p>
        ) : (
          <ol className="pz-conversacion">
            {delTutor.map((b) => (
              <li key={b.id}>
                <button type="button" aria-current={b.id === estado.activo ? 'true' : undefined} onClick={() => (irABloque(b.id), setPanel(null))}>
                  <span className="pz-conversacion-ref num">{refDe(b.id)}</span>
                  <span>{b.titulo ?? 'Respuesta del Tutor'}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
        {ultima && (
          <p className="pz-ultima">
            <span className="etiqueta">{ultima.modo}</span>
            <span className="etiqueta etiqueta-ruta">Última respuesta: {ultima.etiqueta}</span>
          </p>
        )}
        {ultima?.avisos.map((a) => (
          <p key={a} className="suave">
            {a}
          </p>
        ))}
        {conversacionId && !props.sesiones && (
          <Link className="enlace-accion" href={`/tutor/${conversacionId}`}>
            Ver esta sesión en Sesiones
          </Link>
        )}
      </Cajon>

      <Cajon id={`${id}-referencias`} titulo="Referencias" abierto={panel === 'referencias'} alCerrar={() => setPanel(null)}>
        <p className="suave">Pasajes de tus fuentes que el Tutor citó. Cada número abre el pasaje junto a su explicación.</p>
        <ol className="pz-referencias">
          {citas.map(({ bloque: b, r }) =>
            r.tipo === 'cita' ? (
              <li key={`${b.id}-${r.id}`}>
                <p className="pz-referencia-titulo">
                  <span className="cita-numero num">{r.numero}</span> {r.titulo} <span className="suave num">· {refDe(b.id)}</span>
                </p>
                {r.fragmento && <blockquote className="estudio">{r.fragmento.replace(/^#{1,6}\s+/gm, '').slice(0, 600)}</blockquote>}
                <button
                  type="button"
                  className="boton boton-terciario boton-chico"
                  onClick={() => {
                    despachar({ accion: 'mostrar-referencia', bloqueId: b.id, referenciaId: r.id });
                    irABloque(b.id);
                    setPanel(null);
                  }}
                >
                  Ver en la pizarra
                </button>
              </li>
            ) : null,
          )}
        </ol>
      </Cajon>

      <Cajon id={`${id}-fuentes`} titulo="Fuentes del tema" abierto={panel === 'fuentes'} alCerrar={() => setPanel(null)}>
        <p className="panel-nota">
          <Icono nombre="candado" tamano={16} />
          Privadas: solo tú las ves. Sin fuentes, el Tutor explica en general.
        </p>
        {fuentes && fuentes.length > 0 && props.tutor.espacioId && (
          <ul className="lista-fuentes">
            {fuentes.map((f) => (
              <li key={f.contentId} className="fuente">
                <p className="fuente-titulo">{f.titulo}</p>
                <p className={`estado-fuente estado-${f.estadoLectura.toLowerCase()}`}>{ESTADOS_FUENTE[f.estadoLectura] ?? f.estadoLectura}</p>
                <SelectorFuente espacioId={props.tutor.espacioId!} contentId={f.contentId} seleccionada={f.seleccionada} />
              </li>
            ))}
          </ul>
        )}
        {props.tutor.espacioId && (
          <details className="agregar-fuente" open={agregarFuente} onToggle={(e) => setAgregarFuente(e.currentTarget.open)}>
            <summary className="boton boton-secundario boton-ancho">
              <Icono nombre="subir" />
              Agregar fuente
            </summary>
            <FormularioFuente espacioId={props.tutor.espacioId} />
          </details>
        )}
      </Cajon>

      <Cajon id={`${id}-tema`} titulo="Tema" abierto={panel === 'tema'} alCerrar={() => setPanel(null)}>
        {props.descripcion && <p>{props.descripcion}</p>}
        {props.rotuloContenido && (
          <p className="estudio-rotulo">
            <Icono nombre="info" tamano={16} />
            {props.rotuloContenido}
          </p>
        )}
        {props.recorrido && props.recorrido.length > 0 && (
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => (recorrido ? setRecorrido(null) : iniciarRecorrido())}>
            {recorrido ? 'Salir del recorrido guiado' : 'Empezar el recorrido guiado'}
          </button>
        )}
        <section className="estudio-seccion" aria-labelledby={`${id}-indice`}>
          <h3 id={`${id}-indice`}>
            En la pizarra <span className="contador">{bloques.length}</span>
          </h3>
          {bloques.length === 0 ? (
            <p className="suave">Todavía no hay contenido.</p>
          ) : (
            <ol className="estudio-indice">
              {bloques.map((b) => (
                <li key={b.id}>
                  <button type="button" aria-current={b.id === estado.activo ? 'true' : undefined} onClick={() => (irABloque(b.id), setPanel(null))}>
                    <span className="estudio-indice-tipo">
                      {refDe(b.id)} · {NOMBRE_TIPO[b.tipo]} · {b.origen === 'tutor' ? 'del Tutor' : b.origen === 'persona' ? 'tuyo' : b.origen === 'ejemplo' ? 'ejemplo' : 'recorrido'}
                    </span>
                    <span className="estudio-indice-titulo">{b.titulo ?? NOMBRE_TIPO[b.tipo]}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="estudio-seccion" aria-labelledby={`${id}-guardado`}>
          <h3 id={`${id}-guardado`}>Qué se guarda</h3>
          <ul className="pz-lista-simple">
            <li>Tus preguntas y las respuestas del Tutor, con sus citas, en tu cuenta (90 días desde la última actividad).</li>
            <li>Los pasos revelados, los parámetros y las vistas de cada bloque, y tus bloques (ecuaciones, gráficos, tablas, ejercicios, modelos y documentos), con la sesión.</li>
            <li>Tus trazos, formas, textos e imágenes de la pizarra todavía no: se conservan mientras no recargues la página.</li>
          </ul>
        </section>
        <section className="estudio-seccion" aria-labelledby={`${id}-atajos`}>
          <h3 id={`${id}-atajos`}>Atajos de la pizarra</h3>
          <dl className="pz-atajos">
            {ATAJOS.map(([k, t]) => (
              <div key={k}>
                <dt>
                  <kbd>{k}</kbd>
                </dt>
                <dd>{t}</dd>
              </div>
            ))}
          </dl>
        </section>
      </Cajon>

      {insertando && (
        <DialogoInsertar
          tipo={insertando}
          orden={bloques.reduce((m, b) => Math.max(m, b.orden), -1) + 1}
          alCerrar={() => setInsertando(null)}
          alBloque={insertarBloque}
          alImagen={alImagen}
        />
      )}
    </div>
  );
}

