'use client';

import { createContext, useContext, useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
import { Dialogo } from '@/features/carpetas';
import { TutorEnLinea } from '@/features/estudio';
import { corregir, respondida, type Respuesta } from '../preguntas/corregir';
import type { Pregunta } from '../preguntas/esquema';
import type { Intento } from '../progreso/progreso';
import { elegirPreguntas, iniciarSimulacro, msRestantes, pendientes, reducirSimulacro, resultados, type ConfigSimulacro, type EstadoSimulacro, type Resultados } from '../simulacro/simulacro';
import { Enunciado, ETIQUETA_ESTADO, RespuestaControles, Retroalimentacion } from './pregunta-vista';

const DIFICULTADES = [
  ['basica', 'Básica'],
  ['media', 'Media'],
  ['avanzada', 'Avanzada'],
] as const;
const minutos = (ms: number) => {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`;
};

function Seleccion({ banco, temas, setTemas, dificultades, setDificultades, idBase }: { banco: Pregunta[]; temas: string[]; setTemas: (t: string[]) => void; dificultades: string[]; setDificultades: (d: string[]) => void; idBase: string }) {
  const todos = [...new Set(banco.map((p) => p.tema))];
  return (
    <>
      <fieldset className="campo">
        <legend>Temas</legend>
        <div className="opciones-pastilla">
          {todos.map((t) => (
            <label key={t} className="pastilla">
              <input type="checkbox" checked={temas.includes(t)} onChange={(e) => setTemas(e.target.checked ? [...temas, t] : temas.filter((x) => x !== t))} />
              {t} <span className="num suave">{banco.filter((p) => p.tema === t).length}</span>
            </label>
          ))}
        </div>
        <p className="suave campo-ayuda" id={`${idBase}-temas`}>
          Sin marcar ninguno, entran todos.
        </p>
      </fieldset>
      <fieldset className="campo">
        <legend>Dificultad</legend>
        <div className="opciones-pastilla">
          {DIFICULTADES.map(([d, n]) => (
            <label key={d} className="pastilla">
              <input type="checkbox" checked={dificultades.includes(d)} onChange={(e) => setDificultades(e.target.checked ? [...dificultades, d] : dificultades.filter((x) => x !== d))} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

/**
 * Práctica: se aprende del error. Cada pregunta se responde y se comprueba de inmediato, con la explicación y la
 * respuesta esperada (solo después de responder, salvo que se pida ayuda). Se puede reintentar y pedir ayuda al Tutor
 * real sin salir de la actividad.
 */
export function Practica({ banco, contexto, alTerminar }: { banco: Pregunta[]; contexto: string; alTerminar: (i: Intento, respuestas: Record<string, Respuesta>) => void }) {
  const id = useId();
  const [temas, setTemas] = useState<string[]>([]);
  const [dificultades, setDificultades] = useState<string[]>([]);
  const [cantidad, setCantidad] = useState(5);
  const [ronda, setRonda] = useState<string[] | null>(null);
  const [k, setK] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>({});
  const [comprobadas, setComprobadas] = useState<string[]>([]);
  const [ayuda, setAyuda] = useState(false);
  const titulo = useRef<HTMLHeadingElement>(null);
  const disponibles = elegirPreguntas(banco, { temas, dificultades: dificultades as Pregunta['dificultad'][], tipos: [], cantidad: 1000, semilla: 1 }).length;

  useEffect(() => titulo.current?.focus(), [k, ronda]);

  if (!ronda)
    return (
      <form
        className="eval-config"
        onSubmit={(e) => {
          e.preventDefault();
          setRonda(elegirPreguntas(banco, { temas, dificultades: dificultades as Pregunta['dificultad'][], tipos: [], cantidad, semilla: Date.now() % 100_000 }));
          setK(0);
          setRespuestas({});
          setComprobadas([]);
        }}
      >
        <h3>Practicar</h3>
        <p className="suave">Respondes, compruebas y ves la explicación en el momento. Nada cuenta como nota.</p>
        <Seleccion banco={banco} temas={temas} setTemas={setTemas} dificultades={dificultades} setDificultades={setDificultades} idBase={id} />
        <div className="campo campo-corto">
          <label htmlFor={`${id}-n`}>Número de preguntas</label>
          <input id={`${id}-n`} type="number" min={1} max={Math.max(1, disponibles)} value={Math.min(cantidad, Math.max(1, disponibles))} onChange={(e) => setCantidad(Math.max(1, Number(e.target.value) || 1))} />
          <p className="suave campo-ayuda">{disponibles} disponibles con esta selección.</p>
        </div>
        <button type="submit" className="boton boton-primario" disabled={disponibles === 0}>
          Empezar la práctica
        </button>
      </form>
    );

  const p = banco.find((x) => x.id === ronda[k]);
  if (!p) return null;
  const r = respuestas[p.id];
  const hecha = comprobadas.includes(p.id);
  const ultima = k === ronda.length - 1;
  const terminar = () => {
    if (comprobadas.length) alTerminar({ modo: 'practica', nombre: 'Práctica', resultados: resultados(banco, ronda.filter((x) => comprobadas.includes(x)), respuestas), terminadoEn: Date.now() }, respuestas);
    setRonda(null);
  };

  return (
    <section className="eval-curso" aria-labelledby={`${id}-p`}>
      <div className="eval-progreso" aria-hidden="true">
        {ronda.map((x, j) => {
          const c = comprobadas.includes(x) ? corregir(banco.find((y) => y.id === x)!, respuestas[x]).estado : null;
          return <span key={x} data-actual={j === k || undefined} data-estado={c ?? undefined} />;
        })}
      </div>
      <div id={`${id}-p`} ref={titulo} tabIndex={-1} className="eval-foco">
        <Enunciado p={p} numero={k + 1} total={ronda.length} />
      </div>
      <RespuestaControles key={`${p.id}-${hecha}`} p={p} valor={r} bloqueado={hecha} alCambiar={(x) => setRespuestas((v) => ({ ...v, [p.id]: x }))} />
      <div aria-live="polite">{hecha && <Retroalimentacion p={p} r={r} />}</div>
      <div className="acciones">
        {!hecha ? (
          <button type="button" className="boton boton-primario" disabled={!respondida(r)} onClick={() => setComprobadas((c) => [...c, p.id])}>
            Comprobar
          </button>
        ) : (
          <>
            {corregir(p, r).estado !== 'correcta' && (
              <button
                type="button"
                className="boton boton-secundario"
                onClick={() => {
                  setComprobadas((c) => c.filter((x) => x !== p.id));
                  setRespuestas((v) => Object.fromEntries(Object.entries(v).filter(([k]) => k !== p.id)));
                }}
              >
                Reintentar
              </button>
            )}
            {ultima ? (
              <button type="button" className="boton boton-primario" onClick={terminar}>
                Terminar y ver el resumen
              </button>
            ) : (
              <button type="button" className="boton boton-primario" onClick={() => (setK(k + 1), setAyuda(false))}>
                Siguiente pregunta
              </button>
            )}
          </>
        )}
        <button type="button" className="boton boton-terciario" aria-expanded={ayuda} onClick={() => setAyuda((a) => !a)}>
          {ayuda ? 'Ocultar la ayuda' : 'Pedir ayuda al Tutor'}
        </button>
        <button type="button" className="boton boton-terciario" onClick={terminar}>
          Salir de la práctica
        </button>
      </div>
      {ayuda && <TutorEnLinea key={p.id} contexto={contexto} preguntaInicial={`No sé cómo resolver esto. Dame una pista sin darme la respuesta: ${p.enunciado}`} />}
    </section>
  );
}

/** Resultados de un intento: totales, por tema, y la revisión de cada pregunta con su respuesta y la esperada. */
export function ResultadosVista({ banco, r, titulo, porTiempo = false }: { banco: Pregunta[]; r: Resultados; titulo: string; porTiempo?: boolean }) {
  const id = useId();
  const [abierta, setAbierta] = useState<string | null>(null);
  const fallos = r.porTema.filter((t) => t.incorrectas > 0).sort((a, b) => b.incorrectas - a.incorrectas);
  return (
    <section className="resultados" aria-labelledby={`${id}-t`}>
      <h3 id={`${id}-t`}>{titulo}</h3>
      {porTiempo && <p className="mensaje mensaje-info">Se entregó al terminar el tiempo (límite medido en este navegador).</p>}
      <dl className="resultados-totales">
        <div>
          <dt>Respondidas</dt>
          <dd className="num">
            {r.respondidas} de {r.total}
          </dd>
        </div>
        <div>
          <dt>Correctas</dt>
          <dd className="num">{r.correctas}</dd>
        </div>
        <div>
          <dt>Incorrectas</dt>
          <dd className="num">{r.incorrectas}</dd>
        </div>
        {r.parciales > 0 && (
          <div>
            <dt>Parciales</dt>
            <dd className="num">{r.parciales}</dd>
          </div>
        )}
        <div>
          <dt>Pendientes de evaluación</dt>
          <dd className="num">{r.pendientes}</dd>
        </div>
        <div>
          <dt>Calificación</dt>
          <dd className="num">{r.puntaje === null ? 'No aplica' : `${Math.round(r.puntaje * 100)} %`}</dd>
        </div>
        {r.tiempoMs !== null && (
          <div>
            <dt>Tiempo</dt>
            <dd className="num">{minutos(r.tiempoMs)}</dd>
          </div>
        )}
      </dl>
      <p className="suave">
        {r.puntaje === null
          ? 'Ninguna pregunta de este intento tiene corrección automática.'
          : `La calificación se calcula sobre las ${r.conCorreccionAutomatica} preguntas con corrección automática; las pendientes de evaluación no cuentan.`}
      </p>
      {r.porTema.length > 1 && (
        <table className="resultados-temas">
          <caption>Resultado por tema</caption>
          <thead>
            <tr>
              <th scope="col">Tema</th>
              <th scope="col">Correctas</th>
              <th scope="col">Incorrectas</th>
              <th scope="col">Pendientes</th>
            </tr>
          </thead>
          <tbody>
            {r.porTema.map((t) => (
              <tr key={t.tema}>
                <th scope="row">{t.tema}</th>
                <td className="num">
                  {t.correctas} de {t.total}
                </td>
                <td className="num">{t.incorrectas}</td>
                <td className="num">{t.pendientes}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {fallos.length > 0 && (
        <p>
          <strong>Para repasar:</strong> {fallos.map((t) => `${t.tema} (${t.incorrectas} ${t.incorrectas === 1 ? 'error' : 'errores'})`).join(', ')}.
        </p>
      )}
      <h4>Revisión pregunta por pregunta</h4>
      <ol className="resultados-detalle">
        {r.detalle.map((d, k) => {
          const p = banco.find((x) => x.id === d.id)!;
          return (
            <li key={d.id} data-estado={d.correccion.estado}>
              <button type="button" className="resultados-pregunta" aria-expanded={abierta === d.id} onClick={() => setAbierta(abierta === d.id ? null : d.id)}>
                <span className="num">{k + 1}.</span> <span>{p.enunciado}</span> <strong>{ETIQUETA_ESTADO[d.correccion.estado]}</strong>
              </button>
              {abierta === d.id && <RevisionPregunta p={p} respuestaEstado={d.correccion} />}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Respuestas del intento que se revisa. */
const RespuestasRevision = createContext<Record<string, Respuesta>>({});

function RevisionPregunta({ p, respuestaEstado }: { p: Pregunta; respuestaEstado: ReturnType<typeof corregir> }) {
  const r = useContext(RespuestasRevision)[p.id];
  return (
    <div className="resultados-revision">
      <Enunciado p={p} />
      <p className="suave">Tu respuesta:</p>
      <RespuestaControles p={p} valor={r} bloqueado alCambiar={() => {}} />
      <Retroalimentacion p={p} r={r} correccion={respuestaEstado} />
    </div>
  );
}

export function ResultadosConRespuestas(props: { banco: Pregunta[]; r: Resultados; titulo: string; respuestas: Record<string, Respuesta>; porTiempo?: boolean }) {
  return (
    <RespuestasRevision.Provider value={props.respuestas}>
      <ResultadosVista banco={props.banco} r={props.r} titulo={props.titulo} porTiempo={props.porTiempo ?? false} />
    </RespuestasRevision.Provider>
  );
}

/**
 * Simulacro: condiciones de examen. No se corrige ni se muestran respuestas hasta entregar. Navegación libre, marcas
 * para revisar, resumen con lo pendiente y confirmación. El tiempo límite es opcional y lo mide este navegador.
 * Sin persistencia de intentos: si se sale de la página, el intento se pierde, y se avisa antes.
 */
export function Simulacro({ banco, alTerminar }: { banco: Pregunta[]; alTerminar: (i: Intento, respuestas: Record<string, Respuesta>) => void }) {
  const id = useId();
  const [config, setConfig] = useState<Omit<ConfigSimulacro, 'semilla'>>({ nombre: 'Simulacro 1', temas: [], cantidad: 8, dificultades: [], tipos: [], minutos: null });
  const [estado, despachar] = useReducer((e: EstadoSimulacro | null, a: Parameters<typeof reducirSimulacro>[1] | { tipo: 'iniciar'; e: EstadoSimulacro } | { tipo: 'cerrar' }) => {
    if (a.tipo === 'iniciar') return a.e;
    if (a.tipo === 'cerrar') return null;
    return e ? reducirSimulacro(e, a) : e;
  }, null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [confirmar, setConfirmar] = useState(false);
  const titulo = useRef<HTMLDivElement>(null);
  const reportado = useRef(false);

  const restante = estado ? msRestantes(estado, ahora) : null;
  useEffect(() => {
    if (!estado || estado.fase === 'entregado' || !estado.config.minutos) return;
    const t = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(t);
  }, [estado]);
  useEffect(() => {
    if (estado && estado.fase !== 'entregado' && restante === 0) despachar({ tipo: 'tiempo-agotado', ahora: Date.now() });
  }, [restante, estado]);
  useEffect(() => {
    if (!estado || estado.fase === 'entregado') return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [estado]);
  useEffect(() => {
    if (estado?.fase === 'en-curso') titulo.current?.focus();
  }, [estado?.actual, estado?.fase]);
  useEffect(() => {
    if (estado?.fase === 'entregado' && !reportado.current) {
      reportado.current = true;
      alTerminar({ modo: 'simulacro', nombre: estado.config.nombre, resultados: resultados(banco, estado.preguntas, estado.respuestas, (estado.fin ?? Date.now()) - estado.inicio), terminadoEn: estado.fin ?? Date.now() }, estado.respuestas);
    }
  }, [estado, banco, alTerminar]);

  const disponibles = useMemo(() => elegirPreguntas(banco, { ...config, cantidad: 1000, semilla: 1 }).length, [banco, config]);

  if (!estado)
    return (
      <form
        className="eval-config"
        onSubmit={(e) => {
          e.preventDefault();
          const nuevo = iniciarSimulacro(banco, { ...config, semilla: Date.now() % 100_000 }, Date.now());
          if (nuevo) {
            reportado.current = false;
            setAhora(Date.now());
            despachar({ tipo: 'iniciar', e: nuevo });
          }
        }}
      >
        <h3>Configurar un simulacro</h3>
        <p className="suave">En condiciones de examen: sin correcciones ni respuestas hasta que entregues. Si sales de esta página, el intento se pierde: todavía no se guardan.</p>
        <div className="campo">
          <label htmlFor={`${id}-nombre`}>Nombre</label>
          <input id={`${id}-nombre`} value={config.nombre} maxLength={80} onChange={(e) => setConfig({ ...config, nombre: e.target.value })} />
        </div>
        <Seleccion banco={banco} temas={config.temas} setTemas={(temas) => setConfig({ ...config, temas })} dificultades={config.dificultades} setDificultades={(d) => setConfig({ ...config, dificultades: d as ConfigSimulacro['dificultades'] })} idBase={id} />
        <div className="nueva-prep-columnas">
          <div className="campo campo-corto">
            <label htmlFor={`${id}-n`}>Número de preguntas</label>
            <input id={`${id}-n`} type="number" min={1} max={Math.max(1, disponibles)} value={Math.min(config.cantidad, Math.max(1, disponibles))} onChange={(e) => setConfig({ ...config, cantidad: Math.max(1, Number(e.target.value) || 1) })} />
            <p className="suave campo-ayuda">{disponibles} disponibles.</p>
          </div>
          <div className="campo campo-corto">
            <label htmlFor={`${id}-min`}>Duración (opcional, minutos)</label>
            <input id={`${id}-min`} type="number" min={1} max={300} placeholder="Sin límite" value={config.minutos ?? ''} onChange={(e) => setConfig({ ...config, minutos: e.target.value ? Math.min(300, Math.max(1, Number(e.target.value))) : null })} />
            <p className="suave campo-ayuda">El límite lo mide este navegador: no es una restricción garantizada por el servidor.</p>
          </div>
        </div>
        <button type="submit" className="boton boton-primario" disabled={disponibles === 0}>
          Empezar el simulacro
        </button>
      </form>
    );

  const total = estado.preguntas.length;
  const faltan = pendientes(estado);

  if (estado.fase === 'entregado') {
    const r = resultados(banco, estado.preguntas, estado.respuestas, (estado.fin ?? 0) - estado.inicio);
    return (
      <div className="simulacro-fin">
        <ResultadosConRespuestas banco={banco} r={r} titulo={`Resultados: ${estado.config.nombre}`} respuestas={estado.respuestas} porTiempo={estado.porTiempo} />
        <button type="button" className="boton boton-secundario" onClick={() => despachar({ tipo: 'cerrar' })}>
          Configurar otro simulacro
        </button>
      </div>
    );
  }

  const reloj =
    restante !== null ? (
      <p className="simulacro-reloj" data-poco={restante < 60_000 || undefined}>
        <span className="num" aria-hidden="true">
          {minutos(restante)}
        </span>
        {/* Para lectores de pantalla, el tiempo se anuncia por minuto, no por segundo. */}
        <span className="visually-hidden" aria-live="polite">
          Quedan {Math.ceil(restante / 60_000)} minutos
        </span>
      </p>
    ) : (
      <p className="simulacro-reloj suave">Sin límite de tiempo</p>
    );

  if (estado.fase === 'resumen')
    return (
      <section className="simulacro-resumen" aria-labelledby={`${id}-resumen`}>
        <div className="simulacro-barra">
          <h3 id={`${id}-resumen`}>Antes de entregar</h3>
          {reloj}
        </div>
        <p>
          Respondiste <span className="num">{total - faltan.length}</span> de <span className="num">{total}</span>.
          {faltan.length > 0 && ` Quedan ${faltan.length} sin responder.`}
          {estado.marcadas.length > 0 && ` Marcaste ${estado.marcadas.length} para revisar.`}
        </p>
        <ol className="simulacro-mapa">
          {estado.preguntas.map((pid, k) => (
            <li key={pid}>
              <button type="button" onClick={() => despachar({ tipo: 'volver', indice: k })} data-respondida={respondida(estado.respuestas[pid]) || undefined} data-marcada={estado.marcadas.includes(pid) || undefined}>
                <span className="num">{k + 1}</span>
                <span className="visually-hidden">
                  {respondida(estado.respuestas[pid]) ? 'respondida' : 'sin responder'}
                  {estado.marcadas.includes(pid) ? ', marcada para revisar' : ''}
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="acciones">
          <button type="button" className="boton boton-secundario" onClick={() => despachar({ tipo: 'volver' })}>
            Seguir respondiendo
          </button>
          <button type="button" className="boton boton-primario" onClick={() => setConfirmar(true)}>
            Entregar
          </button>
        </div>
        <Dialogo abierto={confirmar} titulo="¿Entregar el simulacro?" descripcion={faltan.length ? `Quedan ${faltan.length} preguntas sin responder: contarán como no respondidas.` : 'Ya no podrás cambiar tus respuestas.'} alCerrar={() => setConfirmar(false)}>
          <div className="acciones">
            <button type="button" className="boton boton-primario" onClick={() => (setConfirmar(false), despachar({ tipo: 'entregar', ahora: Date.now() }))}>
              Entregar ahora
            </button>
            <button type="button" className="boton boton-secundario" onClick={() => setConfirmar(false)}>
              Volver
            </button>
          </div>
        </Dialogo>
      </section>
    );

  const pid = estado.preguntas[estado.actual]!;
  const p = banco.find((x) => x.id === pid)!;
  const marcada = estado.marcadas.includes(pid);
  return (
    <section className="simulacro" aria-label={`Simulacro: ${estado.config.nombre}`}>
      <div className="simulacro-barra">
        <p className="num">
          {total - faltan.length} de {total} respondidas
        </p>
        {reloj}
      </div>
      <ol className="simulacro-mapa" aria-label="Ir a una pregunta">
        {estado.preguntas.map((x, k) => (
          <li key={x}>
            <button type="button" aria-current={k === estado.actual ? 'step' : undefined} onClick={() => despachar({ tipo: 'ir', indice: k })} data-respondida={respondida(estado.respuestas[x]) || undefined} data-marcada={estado.marcadas.includes(x) || undefined}>
              <span className="num">{k + 1}</span>
              <span className="visually-hidden">
                {respondida(estado.respuestas[x]) ? 'respondida' : 'sin responder'}
                {estado.marcadas.includes(x) ? ', marcada para revisar' : ''}
              </span>
            </button>
          </li>
        ))}
      </ol>
      <div ref={titulo} tabIndex={-1} className="eval-foco">
        <Enunciado p={p} numero={estado.actual + 1} total={total} />
      </div>
      <RespuestaControles key={pid} p={p} valor={estado.respuestas[pid]} alCambiar={(r) => despachar({ tipo: 'responder', id: pid, respuesta: r })} />
      <div className="acciones">
        <button type="button" className="boton boton-terciario" disabled={estado.actual === 0} onClick={() => despachar({ tipo: 'anterior' })}>
          Anterior
        </button>
        <button type="button" className="boton boton-secundario" aria-pressed={marcada} onClick={() => despachar({ tipo: 'marcar', id: pid })}>
          {marcada ? 'Quitar la marca' : 'Marcar para revisar'}
        </button>
        <button type="button" className="boton boton-primario" onClick={() => despachar({ tipo: 'siguiente' })}>
          {estado.actual === total - 1 ? 'Revisar y entregar' : 'Siguiente'}
        </button>
        <button type="button" className="boton boton-terciario" onClick={() => despachar({ tipo: 'revisar' })}>
          Ver resumen
        </button>
      </div>
    </section>
  );
}

