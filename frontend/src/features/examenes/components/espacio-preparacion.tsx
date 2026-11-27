'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Dialogo } from '@/features/carpetas';
import { Icono } from '@/components/ui/iconos';
import { mensajeDeError } from '@/lib/api-cliente';
import { ejemploPorId } from '../ejemplo/datos';
import type { Respuesta } from '../preguntas/corregir';
import { validarBanco } from '../preguntas/esquema';
import { hoyIso, MAX_TEMAS_UNICA, siguienteActividad, temaDeActividad, tituloPreparacion, type ActividadApi, type PreparacionVista, type TemaVista } from '../preparaciones/modelo';
import { actividad, recomendaciones, rendimientoObservado, type Intento } from '../progreso/progreso';
import { completarActividad, crearPreparacion } from '../servicios/api';
import { Practica, ResultadosConRespuestas, Simulacro } from './evaluacion';
import { EvaluacionServidor, HistorialServidor } from './evaluacion-servidor';
import { actualizarTemario } from '../servicios/evaluaciones';
import { FechaExamen } from './preparaciones';
import { TarjetasVista } from './tarjetas-vista';
import { TemarioEditor } from './temario-editor';

const SECCIONES = [
  ['resumen', 'Resumen'],
  ['temario', 'Temario'],
  ['plan', 'Plan de estudio'],
  ['estudiar', 'Estudiar temas'],
  ['fuentes', 'Fuentes'],
  ['tarjetas', 'Tarjetas'],
  ['practica', 'Práctica'],
  ['simulacro', 'Simulacros'],
  ['resultados', 'Resultados'],
] as const;
type Seccion = (typeof SECCIONES)[number][0];
const TIPO: Record<ActividadApi['tipo'], string> = { LECCION: 'Estudiar', PRACTICA: 'Practicar', SIMULACRO: 'Simulacro', REPASO: 'Repasar' };
const fechaCorta = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' });

/**
 * Espacio de una preparación: resumen, temario, plan, estudio por tema (con el espacio educativo), fuentes, tarjetas,
 * práctica, simulacros y resultados. Lo guardado viene del servidor (plan y avance); lo que se hace en esta visita
 * (intentos, tarjetas propias) no se guarda y se dice. Un ejemplo ilustrativo se rotula y nunca se guarda.
 */
export function EspacioPreparacion({ inicial, seccionInicial, creada = false, previos }: { inicial: PreparacionVista; seccionInicial?: string; creada?: boolean; previos?: string }) {
  const router = useRouter();
  const id = useId();
  const hoy = hoyIso();
  const ejemplo = inicial.modo === 'ejemplo' ? ejemploPorId(inicial.id) : null;
  const [p, setP] = useState(inicial);
  const [seccion, setSeccion] = useState<Seccion>(SECCIONES.some(([s]) => s === seccionInicial) ? (seccionInicial as Seccion) : 'resumen');
  const [intentos, setIntentos] = useState<Array<{ intento: Intento; respuestas: Record<string, Respuesta> }>>([]);
  const [verIntento, setVerIntento] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState(creada ? 'Preparación creada. Empieza por la siguiente actividad del plan o estudia un tema.' : '');
  const banco = useMemo(() => validarBanco(ejemplo?.banco ?? []).preguntas, [ejemplo]);

  const ir = useCallback((s: Seccion) => {
    setSeccion(s);
    const u = new URL(window.location.href);
    u.searchParams.set('seccion', s);
    u.searchParams.delete('creada');
    window.history.replaceState(null, '', u);
    requestAnimationFrame(() => document.getElementById(`${id}-seccion`)?.focus());
  }, [id]);

  const registrar = useCallback((intento: Intento, respuestas: Record<string, Respuesta>) => {
    setIntentos((l) => [{ intento, respuestas }, ...l]);
    setVerIntento(0);
  }, []);

  async function completar(a: ActividadApi) {
    setError(null);
    try {
      if (p.modo !== 'ejemplo') await completarActividad(p, a.id);
      const ahora = new Date().toISOString();
      setP((x) => {
        const actividades = x.actividades.map((y) => (y.id === a.id ? { ...y, estado: 'COMPLETADA' as const, completadaEn: ahora } : y));
        return { ...x, actividades, avance: { completadas: actividades.filter((y) => y.estado === 'COMPLETADA').length, total: actividades.length } };
      });
      setAviso(`«${a.titulo}» marcada como hecha${p.modo === 'ejemplo' ? ' (en este ejemplo no se guarda)' : ''}.`);
      if (p.modo !== 'ejemplo') router.refresh();
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }

  const siguiente = siguienteActividad(p);
  const contexto = `Me preparo para ${tituloPreparacion(p).toLowerCase()}${p.fechaExamen ? ` (el examen es el ${p.fechaExamen})` : ''}. Temario: ${p.temas.map((t) => t.titulo).join(', ')}.`;
  const hrefEstudiar = (t: { codigo: string }, intencion?: string) => {
    const q = new URLSearchParams({ ...(intencion ? { intencion } : {}), ...(previos ? { previos } : {}) }).toString();
    return `/examenes/${encodeURIComponent(p.id)}/estudiar/${encodeURIComponent(t.codigo)}${q ? `?${q}` : ''}`;
  };
  const temaDe = (a: ActividadApi) => p.temas.find((t) => t.codigo === a.temaCodigo);

  return (
    <div className="prep-espacio">
      <header className="prep-cabecera">
        <nav aria-label="Migas de pan" className="estudio-migas">
          <ol>
            <li>
              <Link href="/examenes">Exámenes</Link>
            </li>
            <li>
              <span aria-current="page">{tituloPreparacion(p)}</span>
            </li>
          </ol>
        </nav>
        <h1>{tituloPreparacion(p)}</h1>
        <p className="prep-datos">
          {p.asignatura && <span>{p.asignatura}</span>}
          <FechaExamen fecha={p.fechaExamen} hoy={hoy} />
          <span>{p.fuente === 'FUENTES' ? 'Con tus fuentes' : 'Sin documentos'}</span>
        </p>
        {p.modo === 'ejemplo' ? (
          <p className="estudio-rotulo">
            <Icono nombre="info" tamano={16} />
            Ejemplo ilustrativo: preparación de muestra de Mentelyx. No es tuya y nada de lo que hagas aquí se guarda.
          </p>
        ) : p.modo === 'multiple' ? (
          <p className="estudio-guardado" data-estado="guardado">
            <span className="estudio-guardado-punto" aria-hidden="true" />
            Plan, avance, banco de preguntas, prácticas, simulacros y resultados guardados en tu cuenta.
          </p>
        ) : p.modo === 'unica' ? (
          <p className="estudio-guardado" data-estado="guardado">
            <span className="estudio-guardado-punto" aria-hidden="true" />
            Plan y avance guardados en tu cuenta. El nombre del examen y lo que hagas en práctica, simulacros y tarjetas todavía no se guardan.
          </p>
        ) : null}
      </header>

      <nav className="prep-secciones" aria-label="Secciones de la preparación">
        <ul>
          {SECCIONES.map(([s, nombre]) => (
            <li key={s}>
              <button type="button" aria-current={seccion === s ? 'page' : undefined} onClick={() => ir(s)}>
                {nombre}
              </button>
            </li>
          ))}
        </ul>
        <label className="visually-hidden" htmlFor={`${id}-sel`}>
          Sección
        </label>
        <select id={`${id}-sel`} value={seccion} onChange={(e) => ir(e.target.value as Seccion)}>
          {SECCIONES.map(([s, nombre]) => (
            <option key={s} value={s}>
              {nombre}
            </option>
          ))}
        </select>
      </nav>

      {aviso && (
        <p className="mensaje mensaje-exito prep-aviso" role="status">
          <Icono nombre="listo" />
          <span>{aviso}</span>
          <button type="button" className="boton-icono" onClick={() => setAviso('')}>
            <Icono nombre="cerrar" tamano={16} />
            <span className="visually-hidden">Cerrar el aviso</span>
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}

      <section className="prep-seccion" aria-labelledby={`${id}-seccion`}>
        <h2 id={`${id}-seccion`} tabIndex={-1} className="visually-hidden">
          {SECCIONES.find(([s]) => s === seccion)?.[1]}
        </h2>

        {seccion === 'resumen' && (
          <Resumen
            p={p}
            intentos={intentos.map((x) => x.intento)}
            siguiente={siguiente}
            accionSiguiente={(a) => {
              const t = temaDe(a);
              if (a.tipo === 'PRACTICA' && banco.some((q) => q.tema === t?.titulo)) ir('practica');
              else if (t) router.push(hrefEstudiar(t, a.tipo === 'PRACTICA' ? 'ejercicios' : undefined));
            }}
            irA={ir}
            hrefEstudiar={hrefEstudiar}
          />
        )}
        {seccion === 'temario' && <Temario p={p} alRehacer={(np) => (setP(np), setAviso('Plan rehecho con el nuevo temario.'))} alCambiarLocal={(temas) => setP({ ...p, temas })} />}
        {seccion === 'plan' && <Plan p={p} alCompletar={(a) => void completar(a)} hrefEstudiar={hrefEstudiar} temaDe={temaDe} />}
        {seccion === 'estudiar' && (
          <div className="prep-bloque">
            <p>Cada tema se estudia en el espacio educativo, con el Tutor, la pizarra y los visores. El Tutor recibe el contexto de este examen en cada pregunta.</p>
            <ul className="prep-temas">
              {p.temas.map((t) => {
                const acts = p.actividades.filter((a) => a.temaCodigo === t.codigo);
                const hechas = acts.filter((a) => a.estado === 'COMPLETADA').length;
                return (
                  <li key={t.codigo}>
                    <Link href={hrefEstudiar(t)} className="prep-tema-enlace">
                      <span className="prep-titulo">{t.titulo}</span>
                      <span className="suave">
                        {acts.length ? `${hechas} de ${acts.length} actividades hechas` : 'Sin actividades en el plan'}
                        {ejemplo?.estudio[t.codigo] ? ' · con pizarra interactiva' : ''}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <p className="suave">Las preguntas al Tutor se guardan como sesiones (en Aprendizaje, Sesiones); todavía no quedan vinculadas a esta preparación.</p>
          </div>
        )}
        {seccion === 'fuentes' && (
          <div className="prep-bloque">
            {p.fuente === 'FUENTES' ? (
              <p>Esta preparación usa fuentes de tu cuenta. El servidor todavía no devuelve cuáles son, así que no podemos listarlas aquí.</p>
            ) : (
              <p>Esta preparación no usa documentos. No hace falta: el Tutor explica en general, y puedes sumar apuntes cuando quieras.</p>
            )}
            <p>
              Tus sílabos, apuntes y guías se agregan en <Link href="/fuentes">Mis fuentes</Link> (como texto o Markdown). Los originales no se modifican. Las preguntas que procedan de un material indicarán su procedencia solo cuando sea verificable; las del Tutor nunca se atribuyen a tu docente.
            </p>
          </div>
        )}
        {seccion === 'tarjetas' && <TarjetasVista base={ejemplo?.tarjetas ?? []} temas={p.temas.map((t) => t.titulo)} {...(p.modo === 'multiple' ? { preparacionId: p.id } : {})} />}
        {(seccion === 'practica' || seccion === 'simulacro') && p.modo === 'multiple' && (
          <EvaluacionServidor key={seccion} preparacionId={p.id} modo={seccion === 'practica' ? 'PRACTICA' : 'SIMULACRO'} temas={p.temas.map((t) => t.titulo)} />
        )}
        {(seccion === 'practica' || seccion === 'simulacro') &&
          p.modo !== 'multiple' &&
          (banco.length === 0 ? (
            <div className="vacio prep-vacio">
              <Icono nombre="examen" tamano={24} />
              <div>
                <p className="vacio-titulo">Todavía no hay un banco de preguntas para esta preparación.</p>
                <p className="suave">El banco de preguntas propio depende de un servicio que aún no existe. Mientras tanto puedes pedir ejercicios al Tutor en cada tema, o probar la práctica y el simulacro con una preparación de ejemplo.</p>
                <p className="acciones">
                  {p.temas[0] && (
                    <Link className="boton boton-primario" href={hrefEstudiar(p.temas[0], 'ejercicios')}>
                      Pedir ejercicios al Tutor
                    </Link>
                  )}
                  <Link className="boton boton-secundario" href={`/examenes/ejemplo-calculo-diferencial?seccion=${seccion}`}>
                    Probar con el ejemplo
                  </Link>
                </p>
              </div>
            </div>
          ) : seccion === 'practica' ? (
            <Practica banco={banco} contexto={contexto} alTerminar={(i, r) => (registrar(i, r), setAviso('Práctica terminada: el resumen está en Resultados.'))} />
          ) : (
            <Simulacro banco={banco} alTerminar={registrar} />
          ))}
        {seccion === 'resultados' && p.modo === 'multiple' && <HistorialServidor preparacionId={p.id} />}
        {seccion === 'resultados' &&
          p.modo !== 'multiple' &&
          (intentos.length === 0 ? (
            <p className="suave">Aún no hiciste prácticas ni simulacros en esta visita. Sus resultados aparecerán aquí; por ahora no se guardan al salir.</p>
          ) : (
            <div className="prep-bloque">
              <label htmlFor={`${id}-intento`}>Intento</label>
              <select id={`${id}-intento`} value={verIntento} onChange={(e) => setVerIntento(Number(e.target.value))}>
                {intentos.map((x, k) => (
                  <option key={k} value={k}>
                    {x.intento.nombre} · {new Date(x.intento.terminadoEn).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                  </option>
                ))}
              </select>
              {intentos[verIntento] && <ResultadosConRespuestas banco={banco} r={intentos[verIntento]!.intento.resultados} respuestas={intentos[verIntento]!.respuestas} titulo={intentos[verIntento]!.intento.nombre} />}
            </div>
          ))}
      </section>
    </div>
  );
}

function Resumen({ p, intentos, siguiente, accionSiguiente, irA, hrefEstudiar }: { p: PreparacionVista; intentos: Intento[]; siguiente: ActividadApi | null; accionSiguiente: (a: ActividadApi) => void; irA: (s: Seccion) => void; hrefEstudiar: (t: { codigo: string }) => string }) {
  const a = actividad(p, intentos);
  const rendimiento = rendimientoObservado(intentos);
  const recs = recomendaciones(p, intentos).slice(0, 5);
  const recientes = p.actividades.filter((x) => x.completadaEn).sort((x, y) => (y.completadaEn ?? '').localeCompare(x.completadaEn ?? '')).slice(0, 4);
  const pct = a.planTotal ? Math.round((a.planCompletadas / a.planTotal) * 100) : 0;
  return (
    <div className="prep-resumen">
      <section className="prep-siguiente-bloque" aria-labelledby="prep-siguiente">
        <h3 id="prep-siguiente">Siguiente actividad</h3>
        {siguiente ? (
          <>
            <p className="prep-siguiente-titulo">{siguiente.titulo}</p>
            <p className="suave">
              {TIPO[siguiente.tipo]} · unos {siguiente.minutosEstimados} min{siguiente.fechaLimite ? ` · para el ${fechaCorta(siguiente.fechaLimite)}` : ''} · según el orden del plan
            </p>
            <button type="button" className="boton boton-primario" onClick={() => accionSiguiente(siguiente)}>
              {siguiente.tipo === 'PRACTICA' ? 'Practicar ahora' : 'Estudiar ahora'}
            </button>
          </>
        ) : p.actividades.length ? (
          <p>Completaste todas las actividades del plan. Repasa con práctica, tarjetas o un simulacro.</p>
        ) : (
          <p className="suave">Esta preparación aún no tiene un plan.</p>
        )}
      </section>

      <section aria-labelledby="prep-seguimiento" className="prep-seguimiento">
        <h3 id="prep-seguimiento">Seguimiento</h3>
        <div className="prep-metricas">
          <div>
            <h4>Actividad</h4>
            <p className="num prep-cifra">
              {a.planCompletadas} de {a.planTotal}
            </p>
            <p className="suave">actividades del plan hechas</p>
            <span className="medidor-barra" aria-hidden="true">
              <span style={{ inlineSize: `${pct}%` }} />
            </span>
            {a.preguntasPracticadas > 0 && <p className="suave">{a.preguntasPracticadas} preguntas respondidas en esta visita.</p>}
          </div>
          <div>
            <h4>Rendimiento observado</h4>
            {rendimiento.length === 0 ? (
              <p className="suave">Aparecerá cuando practiques. Solo cuenta preguntas con corrección automática.</p>
            ) : (
              <ul className="prep-rendimiento">
                {rendimiento.map((t) => (
                  <li key={t.tema}>
                    <span>{t.tema}</span>
                    <span className="num">
                      {t.correctas} de {t.evaluadas} correctas
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="suave">De esta visita; todavía no se guarda.</p>
          </div>
          <div>
            <h4>Dominio estimado</h4>
            <p className="suave">No lo estimamos todavía. Hacerlo exige guardar tus intentos a lo largo del tiempo; un porcentaje sin esa evidencia sería inventado.</p>
          </div>
        </div>
      </section>

      {recs.length > 0 && (
        <section aria-labelledby="prep-repaso" className="prep-repaso">
          <h3 id="prep-repaso">Qué repasar</h3>
          <p className="suave">Sugerencias a partir de tus datos; tú eliges el orden.</p>
          <ul>
            {recs.map((r) => {
              const t = p.temas.find((x) => x.titulo === r.tema);
              return (
                <li key={r.clave}>
                  <div>
                    <strong>{r.texto}</strong>
                    <p className="suave">{r.evidencia}</p>
                  </div>
                  {r.motivo === 'errores' || r.motivo === 'pendiente-evaluacion' ? (
                    <button type="button" className="boton boton-terciario boton-chico" onClick={() => irA(r.motivo === 'errores' ? 'practica' : 'resultados')}>
                      {r.motivo === 'errores' ? 'Practicar' : 'Revisar'}
                    </button>
                  ) : t ? (
                    <Link className="boton boton-terciario boton-chico" href={hrefEstudiar(t)}>
                      Estudiar
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {recientes.length > 0 && (
        <section aria-labelledby="prep-reciente">
          <h3 id="prep-reciente">Actividad reciente</h3>
          <ul className="prep-reciente">
            {recientes.map((x) => (
              <li key={x.id}>
                {x.titulo} <span className="suave">· {fechaCorta(x.completadaEn!)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Temario({ p, alRehacer, alCambiarLocal }: { p: PreparacionVista; alRehacer: (p: PreparacionVista) => void; alCambiarLocal: (t: TemaVista[]) => void }) {
  const [editando, setEditando] = useState(p.modo === 'ejemplo');
  const [temas, setTemas] = useState(p.temas);
  const [confirmar, setConfirmar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  useEffect(() => setTemas(p.temas), [p.temas]);
  if (p.modo === 'ejemplo')
    return (
      <div className="prep-bloque">
        <p className="suave">En el ejemplo puedes editar el temario para probar; los cambios no se guardan.</p>
        <TemarioEditor temas={p.temas} alCambiar={alCambiarLocal} asignatura={p.asignatura ?? ''} />
      </div>
    );
  return (
    <div className="prep-bloque">
      {!editando ? (
        <>
          <ol className="prep-temario">
            {p.temas.map((t) => {
              const acts = p.actividades.filter((a) => a.temaCodigo === t.codigo);
              const estado = acts.every((a) => a.estado === 'COMPLETADA') ? 'Estudiado' : acts.some((a) => a.estado === 'COMPLETADA') ? 'En curso' : 'Sin empezar';
              return (
                <li key={t.codigo}>
                  <span>{t.titulo}</span>
                  <span className="etiqueta">{estado}</span>
                </li>
              );
            })}
          </ol>
          <p className="suave">Subtemas, prioridades y referencias por tema necesitan un servicio que todavía no existe. Para cambiar los temas hay que rehacer el plan.</p>
          <button type="button" className="boton boton-secundario" onClick={() => setEditando(true)}>
            Cambiar el temario
          </button>
        </>
      ) : (
        <>
          <TemarioEditor temas={temas} alCambiar={setTemas} asignatura={p.asignatura ?? ''} maximo={p.modo === 'multiple' ? 30 : MAX_TEMAS_UNICA} />
          {error && <p className="campo-error">{error}</p>}
          <div className="acciones">
            <button type="button" className="boton boton-primario" disabled={enviando || temas.filter((t) => t.titulo.trim()).length === 0} onClick={() => setConfirmar(true)}>
              Rehacer el plan con este temario
            </button>
            <button type="button" className="boton boton-terciario" onClick={() => (setEditando(false), setTemas(p.temas))}>
              Cancelar
            </button>
          </div>
        </>
      )}
      <Dialogo
        abierto={confirmar}
        titulo="¿Rehacer el plan?"
        descripcion={p.modo === 'multiple' ? 'El servidor crea una versión nueva del plan: los temas que conservas mantienen su avance y los nuevos empiezan sin hacer.' : `El servidor crea un plan nuevo con estos temas y el avance actual (${p.avance.completadas} de ${p.avance.total}) deja de mostrarse.`}
        alCerrar={() => setConfirmar(false)}
      >
        <div className="acciones">
          <button
            type="button"
            className="boton boton-primario"
            onClick={async () => {
              setConfirmar(false);
              setEnviando(true);
              setError(null);
              try {
                if (p.modo === 'multiple') {
                  // Temario editable (API 12.9): versión nueva del plan que conserva el avance de los temas que siguen.
                  const plan = await actualizarTemario(p.id, temas.filter((t) => t.titulo.trim()).map((t) => ({ ...(p.temas.some((x) => x.codigo === t.codigo) ? { id: t.codigo } : {}), titulo: t.titulo.trim() })));
                  const actividades = [...plan.actividades].sort((a, b) => a.orden - b.orden);
                  const nuevosTemas = [...new Map(actividades.map((a) => [a.temaCodigo, { codigo: a.temaCodigo, titulo: temaDeActividad(a.titulo), origen: 'persona' as const }])).values()];
                  alRehacer({ ...p, actividades, temas: nuevosTemas, avance: { completadas: actividades.filter((a) => a.estado === 'COMPLETADA').length, total: actividades.length }, reglaPlan: plan.reglaVersion });
                  setEditando(false);
                  return;
                }
                const nueva = await crearPreparacion(
                  { nombre: p.nombre ?? '', asignatura: p.asignatura ?? 'General', temas, fechaExamen: p.fechaExamen && p.fechaExamen > hoyIso() ? p.fechaExamen : '', minutosSemanales: p.minutosSemanales, previos: null, objetivo: null, fuentes: [], carpetaId: null },
                  'unica',
                );
                alRehacer(nueva);
                setEditando(false);
                window.history.replaceState(null, '', `/examenes/${encodeURIComponent(nueva.id)}?seccion=temario`);
              } catch (e) {
                setError(mensajeDeError(e));
              } finally {
                setEnviando(false);
              }
            }}
          >
            Rehacer el plan
          </button>
          <button type="button" className="boton boton-secundario" onClick={() => setConfirmar(false)}>
            Volver
          </button>
        </div>
      </Dialogo>
    </div>
  );
}

function Plan({ p, alCompletar, hrefEstudiar, temaDe }: { p: PreparacionVista; alCompletar: (a: ActividadApi) => void; hrefEstudiar: (t: { codigo: string }, intencion?: string) => string; temaDe: (a: ActividadApi) => TemaVista | undefined }) {
  const pendientes = p.actividades.filter((a) => a.estado === 'PENDIENTE');
  const hechas = p.actividades.filter((a) => a.estado !== 'PENDIENTE');
  const fila = (a: ActividadApi) => {
    const t = temaDe(a);
    return (
      <li key={a.id} data-estado={a.estado}>
        <div>
          <p className="plan-titulo">{a.titulo}</p>
          <p className="suave">
            {TIPO[a.tipo]} · unos {a.minutosEstimados} min{a.fechaLimite ? ` · para el ${fechaCorta(a.fechaLimite)}` : ''}
            {a.completadaEn ? ` · hecha el ${fechaCorta(a.completadaEn)}` : ''}
          </p>
        </div>
        <span className="acciones">
          {a.estado === 'PENDIENTE' && t && (
            <Link className="boton boton-terciario boton-chico" href={hrefEstudiar(t, a.tipo === 'PRACTICA' ? 'ejercicios' : undefined)}>
              {a.tipo === 'PRACTICA' ? 'Practicar' : 'Estudiar'}
            </Link>
          )}
          {a.estado === 'PENDIENTE' ? (
            <button type="button" className="boton boton-secundario boton-chico" onClick={() => alCompletar(a)}>
              Marcar como hecha
            </button>
          ) : (
            <span className="etiqueta">{a.estado === 'COMPLETADA' ? 'Hecha' : 'Omitida'}</span>
          )}
        </span>
      </li>
    );
  };
  return (
    <div className="prep-bloque">
      <p className="suave">
        Plan calculado por una regla determinista ({p.reglaPlan ?? 'del servidor'}): una actividad para estudiar y otra para practicar cada tema
        {p.fechaExamen ? ', repartidas hasta la fecha del examen' : ', sin plazos porque no indicaste fecha'}. No lo genera el Tutor, que todavía no propone actividades al plan.
        {p.modo === 'unica' ? ' Marcar una actividad como hecha se guarda y no se puede deshacer.' : ''}
      </p>
      <h3>Pendientes ({pendientes.length})</h3>
      {pendientes.length ? <ul className="plan-lista">{pendientes.map(fila)}</ul> : <p className="suave">No hay actividades pendientes.</p>}
      {hechas.length > 0 && (
        <>
          <h3>Hechas ({hechas.length})</h3>
          <ul className="plan-lista">{hechas.map(fila)}</ul>
        </>
      )}
    </div>
  );
}
