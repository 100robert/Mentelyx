'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { mensajeDeError } from '@/lib/api-cliente';
import { respondida, type Correccion, type Respuesta } from '../preguntas/corregir';
import type { Pregunta } from '../preguntas/esquema';
import {
  agregarPreguntas,
  cargarBanco,
  cargarIntento,
  cargarIntentos,
  entregarIntento,
  guardarRespuesta,
  iniciarIntento,
  type BancoApi,
  type DetalleIntento,
  type IntentoApi,
  type ModoIntento,
  type ResultadosApi,
} from '../servicios/evaluaciones';
import { Enunciado, RespuestaControles, Retroalimentacion } from './pregunta-vista';

/**
 * Práctica y simulacro de una preparación real (diseño de API, 12.9): el banco, el intento, cada respuesta y la
 * calificación oficial viven en el servidor. Se monta solo la pregunta activa (rendimiento, fase 10C). Un intento en
 * curso se recupera al volver; el límite de tiempo lo controla el servidor y aquí solo se muestra.
 */
const NOMBRE: Record<ModoIntento, string> = { PRACTICA: 'Práctica', SIMULACRO: 'Simulacro', DIAGNOSTICO: 'Diagnóstico' };
const fecha = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const cifra = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

export function EvaluacionServidor({ preparacionId, modo, temas }: { preparacionId: string; modo: 'PRACTICA' | 'SIMULACRO'; temas: string[] }) {
  const id = useId();
  const [banco, setBanco] = useState<BancoApi | null>(null);
  const [pendiente, setPendiente] = useState<IntentoApi | null>(null);
  const [detalle, setDetalle] = useState<DetalleIntento | null>(null);
  const [final, setFinal] = useState<{ intento: IntentoApi; resultados: ResultadosApi } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(5);
  const [minutos, setMinutos] = useState<number | null>(modo === 'SIMULACRO' ? 20 : null);
  const [elegidos, setElegidos] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const recargar = useCallback(async () => {
    try {
      const [b, lista] = await Promise.all([cargarBanco(preparacionId), cargarIntentos(preparacionId)]);
      setBanco(b);
      setPendiente(lista.find((i) => i.estado === 'EN_CURSO' && i.modo === modo) ?? null);
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [preparacionId, modo]);
  useEffect(() => void recargar(), [recargar]);

  async function empezar() {
    setEnviando(true);
    setError(null);
    try {
      setDetalle(await iniciarIntento(preparacionId, { modo, cantidad, ...(elegidos.length ? { temas: elegidos } : {}), ...(modo === 'SIMULACRO' ? { minutos } : {}) }));
    } catch (e) {
      setError(mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  if (final) return <ResultadosServidor intento={final.intento} r={final.resultados} alVolver={() => (setFinal(null), setDetalle(null), void recargar())} />;
  if (detalle) return <IntentoEnCurso detalle={detalle} alEntregar={(f) => setFinal(f)} />;
  if (!banco) return <p className="suave">{error ?? 'Cargando el banco de preguntas…'}</p>;
  if (banco.total === 0) return <BancoVacio preparacionId={preparacionId} temas={temas} alAgregar={() => void recargar()} />;

  return (
    <form
      className="eval-config"
      onSubmit={(e) => {
        e.preventDefault();
        void empezar();
      }}
    >
      <h3>{modo === 'PRACTICA' ? 'Practicar' : 'Simulacro'}</h3>
      <p className="suave">
        {modo === 'PRACTICA'
          ? 'Compruebas cada respuesta en el momento; una pregunta comprobada ya no se puede cambiar. El intento y su resultado se guardan en tu cuenta.'
          : 'Respondes sin ver las soluciones; el servidor mide el tiempo y califica al entregar. Puedes salir y continuar después.'}
      </p>
      {pendiente && (
        <p className="estudio-guardado" data-estado="guardado">
          <span className="estudio-guardado-punto" aria-hidden="true" />
          Tienes {modo === 'PRACTICA' ? 'una práctica' : 'un simulacro'} sin terminar del {fecha(pendiente.iniciadoEn)}.{' '}
          <button type="button" className="boton boton-secundario" onClick={() => void cargarIntento(pendiente.id).then(setDetalle, (e: unknown) => setError(mensajeDeError(e)))}>
            Continuar
          </button>
        </p>
      )}
      <fieldset className="campo">
        <legend>Temas ({banco.total} preguntas en el banco, versión {banco.version})</legend>
        {banco.temas.map((t) => (
          <label key={t.tema} className="opcion-check">
            <input type="checkbox" checked={elegidos.includes(t.tema)} onChange={(e) => setElegidos((l) => (e.target.checked ? [...l, t.tema] : l.filter((x) => x !== t.tema)))} /> {t.tema} ({t.total})
          </label>
        ))}
        <p className="suave campo-ayuda">Sin marcar ninguno, se usan todos.</p>
      </fieldset>
      <div className="campo campo-corto">
        <label htmlFor={`${id}-n`}>Número de preguntas</label>
        <input id={`${id}-n`} type="number" min={1} max={Math.min(40, banco.total)} value={Math.min(cantidad, banco.total)} onChange={(e) => setCantidad(Math.max(1, Math.min(40, Number(e.target.value) || 1)))} />
      </div>
      {modo === 'SIMULACRO' && (
        <div className="campo campo-corto">
          <label htmlFor={`${id}-m`}>Minutos (vacío: sin límite)</label>
          <input id={`${id}-m`} type="number" min={1} max={240} value={minutos ?? ''} onChange={(e) => setMinutos(e.target.value ? Math.max(1, Math.min(240, Number(e.target.value))) : null)} />
        </div>
      )}
      {error && <p className="campo-error" role="alert">{error}</p>}
      <button type="submit" className="boton boton-primario" disabled={enviando}>
        {modo === 'PRACTICA' ? 'Empezar la práctica' : 'Empezar el simulacro'}
      </button>
    </form>
  );
}

function IntentoEnCurso({ detalle, alEntregar }: { detalle: DetalleIntento; alEntregar: (f: { intento: IntentoApi; resultados: ResultadosApi }) => void }) {
  const id = useId();
  const { intento, preguntas } = detalle;
  const [k, setK] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, Respuesta>>(detalle.respuestas);
  const [comprobadas, setComprobadas] = useState(detalle.comprobadas);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const titulo = useRef<HTMLDivElement>(null);
  // Desfase con el reloj del servidor: el tiempo restante se calcula con su hora, no con la del equipo.
  const desfase = useRef(Date.parse(detalle.ahora) - Date.now());
  const [restante, setRestante] = useState<number | null>(null);
  const practica = intento.modo === 'PRACTICA';

  useEffect(() => titulo.current?.focus(), [k]);
  useEffect(() => {
    if (!intento.venceEn) return;
    const tic = () => setRestante(Math.max(0, Date.parse(intento.venceEn!) - (Date.now() + desfase.current)));
    tic();
    const t = setInterval(tic, 1000);
    return () => clearInterval(t);
  }, [intento.venceEn]);

  const p = preguntas[k];
  if (!p) return null;
  const r = respuestas[p.id];
  const hecha = comprobadas[p.id];
  const agotado = restante === 0;

  async function guardar(comprobar: boolean) {
    if (!p || !r) return true;
    try {
      const g = await guardarRespuesta(intento.id, p.id, r, comprobar);
      if (comprobar && g.correccion && g.pregunta) setComprobadas((c) => ({ ...c, [p.id]: { correccion: g.correccion as Correccion, pregunta: g.pregunta as Pregunta } }));
      setError(null);
      return true;
    } catch (e) {
      setError(mensajeDeError(e));
      return false;
    }
  }
  async function entregar() {
    setEnviando(true);
    if (!agotado && r && !hecha) await guardar(false);
    try {
      alEntregar(await entregarIntento(intento.id));
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  const mm = restante === null ? null : `${Math.floor(restante / 60_000)}:${String(Math.floor((restante % 60_000) / 1000)).padStart(2, '0')}`;
  return (
    <section className="eval-curso" aria-labelledby={`${id}-p`}>
      <p className="estudio-guardado" data-estado="guardado">
        <span className="estudio-guardado-punto" aria-hidden="true" />
        {NOMBRE[intento.modo]} guardado en tu cuenta{mm ? ` · tiempo restante ${mm}` : ''}
      </p>
      <div className="eval-progreso" aria-hidden="true">
        {preguntas.map((x, j) => (
          <span key={x.id} data-actual={j === k || undefined} data-estado={comprobadas[x.id]?.correccion.estado ?? (respondida(respuestas[x.id]) ? 'respondida' : undefined)} />
        ))}
      </div>
      <div id={`${id}-p`} ref={titulo} tabIndex={-1} className="eval-foco">
        <Enunciado p={hecha?.pregunta ?? p} numero={k + 1} total={preguntas.length} />
      </div>
      <RespuestaControles key={`${p.id}-${!!hecha}`} p={p} valor={r} bloqueado={!!hecha || agotado} alCambiar={(x) => setRespuestas((v) => ({ ...v, [p.id]: x }))} />
      <div aria-live="polite">{hecha && <Retroalimentacion p={hecha.pregunta} r={r} correccion={hecha.correccion} />}</div>
      {agotado && <p className="campo-error" role="alert">El tiempo terminó: entrega el simulacro para ver tus resultados.</p>}
      {error && <p className="campo-error" role="alert">{error}</p>}
      <div className="acciones">
        {practica && !hecha && (
          <button type="button" className="boton boton-primario" disabled={!respondida(r)} onClick={() => void guardar(true)}>
            Comprobar
          </button>
        )}
        {k > 0 && (
          <button type="button" className="boton boton-secundario" onClick={() => void guardar(false).then((ok) => ok && setK(k - 1))}>
            Anterior
          </button>
        )}
        {k < preguntas.length - 1 && (
          <button type="button" className={practica && !hecha ? 'boton boton-secundario' : 'boton boton-primario'} disabled={agotado} onClick={() => void (hecha ? Promise.resolve(true) : guardar(false)).then((ok) => ok && setK(k + 1))}>
            Siguiente pregunta
          </button>
        )}
        <button type="button" className={k === preguntas.length - 1 ? 'boton boton-primario' : 'boton boton-terciario'} disabled={enviando} onClick={() => void entregar()}>
          {practica ? 'Terminar y ver el resumen' : 'Entregar el simulacro'}
        </button>
      </div>
    </section>
  );
}

export function ResultadosServidor({ intento, r, alVolver }: { intento: IntentoApi; r: ResultadosApi; alVolver?: () => void }) {
  return (
    <section className="eval-resultados" aria-label={`Resultados: ${NOMBRE[intento.modo]}`}>
      <h3>
        {NOMBRE[intento.modo]} del {fecha(intento.iniciadoEn)}
      </h3>
      <p className="eval-total">
        <strong>
          {cifra(r.puntaje)} de {r.maximo}
        </strong>{' '}
        ({r.porcentaje} %) · calificación oficial del servidor{r.pendientes ? ` · ${r.pendientes} abierta${r.pendientes === 1 ? '' : 's'} pendiente${r.pendientes === 1 ? '' : 's'} de evaluación (no cuentan)` : ''}
        {intento.fueraDeTiempo ? ' · entregado fuera de tiempo' : ''}
      </p>
      <ul className="lista-simple">
        {r.porTema.map((t) => (
          <li key={t.tema}>
            {t.tema}: {cifra(t.puntaje)} de {t.maximo}
          </li>
        ))}
      </ul>
      <ol className="eval-revision">
        {r.preguntas.map((x) =>
          x.pregunta ? (
            <li key={x.preguntaId}>
              <Enunciado p={x.pregunta} />
              <Retroalimentacion p={x.pregunta} r={x.respuesta ?? undefined} correccion={x.correccion} />
            </li>
          ) : null,
        )}
      </ol>
      {alVolver && (
        <button type="button" className="boton boton-secundario" onClick={alVolver}>
          Volver
        </button>
      )}
    </section>
  );
}

/** Historial persistente de intentos (Resultados): «los resultados de ayer siguen disponibles». */
export function HistorialServidor({ preparacionId }: { preparacionId: string }) {
  const [lista, setLista] = useState<IntentoApi[] | null>(null);
  const [abierto, setAbierto] = useState<DetalleIntento | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    cargarIntentos(preparacionId).then(setLista, (e: unknown) => setError(mensajeDeError(e)));
  }, [preparacionId]);
  if (abierto?.resultados) return <ResultadosServidor intento={abierto.intento} r={abierto.resultados} alVolver={() => setAbierto(null)} />;
  if (!lista) return <p className="suave">{error ?? 'Cargando tus intentos…'}</p>;
  const calificados = lista.filter((i) => i.estado === 'CALIFICADO');
  if (!calificados.length) return <p className="suave">Todavía no entregaste prácticas ni simulacros en esta preparación. Sus resultados se guardan en tu cuenta.</p>;
  return (
    <ul className="lista-simple">
      {calificados.map((i) => (
        <li key={i.id}>
          <button type="button" className="boton boton-terciario" onClick={() => void cargarIntento(i.id).then(setAbierto, (e: unknown) => setError(mensajeDeError(e)))}>
            {NOMBRE[i.modo]} · {fecha(i.iniciadoEn)} · {cifra(i.puntaje ?? 0)} de {i.maximo} ({i.porcentaje ?? 0} %)
          </button>
        </li>
      ))}
      {error && <li className="campo-error">{error}</li>}
    </ul>
  );
}

/** Banco vacío: la persona agrega preguntas de opción única (las valida el servidor con mentelyx.pregunta/v1). */
function BancoVacio({ preparacionId, temas, alAgregar }: { preparacionId: string; temas: string[]; alAgregar: () => void }) {
  const id = useId();
  const [tema, setTema] = useState(temas[0] ?? '');
  const [enunciado, setEnunciado] = useState('');
  const [opciones, setOpciones] = useState(['', '', '', '']);
  const [correcta, setCorrecta] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const llenas = opciones.map((o) => o.trim()).filter(Boolean);
  return (
    <form
      className="eval-config"
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        const ops = opciones.map((texto, k) => ({ id: `o${k + 1}`, texto: texto.trim() })).filter((o) => o.texto);
        try {
          await agregarPreguntas(preparacionId, [
            { id: `q${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`, version: 1, tipo: 'opcion-unica', tema: tema || 'General', dificultad: 'media', enunciado: enunciado.trim(), origen: 'persona', opciones: ops, correcta: `o${correcta + 1}` },
          ]);
          alAgregar();
        } catch (er) {
          setError(mensajeDeError(er));
        }
      }}
    >
      <h3>Todavía no hay preguntas en el banco de esta preparación</h3>
      <p className="suave">Agrega tu primera pregunta de opción única. El servidor la valida y la guarda en una versión nueva del banco; las soluciones no se muestran durante un simulacro.</p>
      <div className="campo">
        <label htmlFor={`${id}-t`}>Tema</label>
        <select id={`${id}-t`} value={tema} onChange={(e) => setTema(e.target.value)}>
          {(temas.length ? temas : ['General']).map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div className="campo">
        <label htmlFor={`${id}-e`}>Enunciado</label>
        <textarea id={`${id}-e`} required maxLength={2000} value={enunciado} onChange={(e) => setEnunciado(e.target.value)} />
      </div>
      <fieldset className="campo">
        <legend>Opciones (marca la correcta)</legend>
        {opciones.map((o, k) => (
          <div key={k} className="opcion-check">
            <input type="radio" name={`${id}-c`} aria-label={`Opción ${k + 1} es la correcta`} checked={correcta === k} onChange={() => setCorrecta(k)} />
            <input aria-label={`Opción ${k + 1}`} maxLength={400} value={o} onChange={(e) => setOpciones((l) => l.map((x, j) => (j === k ? e.target.value : x)))} />
          </div>
        ))}
      </fieldset>
      {error && <p className="campo-error" role="alert">{error}</p>}
      <button type="submit" className="boton boton-primario" disabled={!enunciado.trim() || llenas.length < 2 || !opciones[correcta]?.trim()}>
        Guardar la pregunta
      </button>
    </form>
  );
}
