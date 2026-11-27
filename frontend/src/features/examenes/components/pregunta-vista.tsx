'use client';

import { useId, useMemo, useState } from 'react';
import { aplicarAccion, BloqueVista, crearEstado, FormulaSegura, MODELOS, validarBloque, type Bloque, type BloqueDe, type EstadoEspacio } from '@/features/bloques';
import { aLatex, analizar } from '@/features/matematicas';
import { VisorModelo, type VistaCamara } from '@/features/visor-3d';
import { aleatorio } from '../simulacro/simulacro';
import { corregir, corregirSubpreguntas, type Correccion, type Respuesta } from '../preguntas/corregir';
import type { Pregunta, SubPregunta } from '../preguntas/esquema';

const LETRAS = 'ABCDEFGHIJKL';
export const ETIQUETA_ESTADO: Record<Correccion['estado'], string> = {
  correcta: 'Correcta',
  incorrecta: 'Incorrecta',
  parcial: 'Parcialmente correcta',
  pendiente: 'Pendiente de evaluación',
  'sin-responder': 'Sin responder',
  invalida: 'Respuesta no válida',
};
const cifra = (n: number) => String(Number(n.toPrecision(10))).replace('.', ',').replace('-', '−');

/** Bloque de apoyo con su propio estado de interacción (las acciones pasan por el mismo reductor validado). */
function Apoyo({ entrada }: { entrada: unknown }) {
  const [estado, setEstado] = useState<EstadoEspacio>(() => crearEstado([entrada]));
  const b = estado.bloques[0];
  if (!b) return null;
  return (
    <div className="pregunta-apoyo">
      <BloqueVista bloque={b} interaccion={estado.interaccion[b.id]!} despachar={(a) => setEstado((e) => aplicarAccion(e, a).estado)} nivel={3} />
    </div>
  );
}

function IdentificarEnObra({ obra, valor, alCambiar, bloqueado }: { obra: BloqueDe<'obra'>; valor: string | null; alCambiar: (id: string) => void; bloqueado: boolean }) {
  const c = obra.contenido;
  const credito = (obra.referencias ?? []).find((r) => r.tipo === 'credito');
  return (
    <div className="identificar-obra">
      <div className="identificar-imagen">
        <img src={c.imagen.src} srcSet={c.imagen.srcChica ? `${c.imagen.srcChica} 760w, ${c.imagen.src} ${c.imagen.ancho}w` : undefined} sizes="(min-width: 64rem) 50vw, 92vw" width={c.imagen.ancho} height={c.imagen.alto} alt={obra.accesibilidad.descripcion} />
        <svg viewBox={`0 0 ${c.imagen.ancho} ${c.imagen.alto}`} aria-hidden="true">
          {c.regiones.map((r, k) => {
            const centro = r.forma.tipo === 'circulo' ? r.forma.centro : [(r.forma.desde[0] + r.forma.hasta[0]) / 2, (r.forma.desde[1] + r.forma.hasta[1]) / 2];
            return (
              <g key={r.id} data-elegida={valor === r.id || undefined} className="identificar-region" onClick={() => !bloqueado && alCambiar(r.id)}>
                {r.forma.tipo === 'circulo' ? (
                  <circle cx={r.forma.centro[0]} cy={r.forma.centro[1]} r={r.forma.radio} />
                ) : (
                  <rect x={r.forma.desde[0]} y={r.forma.desde[1]} width={r.forma.hasta[0] - r.forma.desde[0]} height={r.forma.hasta[1] - r.forma.desde[1]} rx={12} />
                )}
                <text x={centro[0]} y={centro[1]} textAnchor="middle" dominantBaseline="central">
                  {LETRAS[k]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="opciones-pastilla" role="radiogroup" aria-label="Regiones marcadas">
        {c.regiones.map((r, k) => (
          <label key={r.id} className="pastilla">
            <input type="radio" name={`obra-${obra.id}`} checked={valor === r.id} disabled={bloqueado} onChange={() => alCambiar(r.id)} />
            Región {LETRAS[k]}
          </label>
        ))}
      </div>
      {credito?.tipo === 'credito' && (
        <p className="obra-credito">
          {credito.autor}, «{credito.titulo}», {credito.fecha}. {credito.institucion}. {credito.licencia}.
        </p>
      )}
    </div>
  );
}

function IdentificarEn3D({ modelo, valor, alCambiar, bloqueado }: { modelo: BloqueDe<'modelo-3d'>; valor: string | null; alCambiar: (id: string) => void; bloqueado: boolean }) {
  const [vista, setVista] = useState<VistaCamara | null>(null);
  const clave = modelo.contenido.modelo.tipo === 'catalogo' ? modelo.contenido.modelo.clave : null;
  // Piezas anónimas: los nombres reales darían la respuesta.
  const partes = (modelo.contenido.partes ?? []).map((p, k) => ({ id: p.id, nombre: `Pieza ${LETRAS[k]}` }));
  return (
    <VisorModelo
      origen={modelo.contenido.modelo}
      titulo={modelo.titulo ?? 'Modelo 3D'}
      descripcion={modelo.accesibilidad.descripcion}
      partes={partes}
      parametros={[]}
      valores={{}}
      seleccion={valor}
      resaltado={null}
      vista={vista}
      credito={clave ? MODELOS[clave].credito : ''}
      alSeleccionar={(id) => !bloqueado && id && alCambiar(id)}
      alParametro={() => {}}
      alVista={setVista}
    />
  );
}

function EntradaExpresion({ id, valor, alCambiar, variables, prefijo, bloqueado }: { id: string; valor: string; alCambiar: (v: string) => void; variables: string[]; prefijo?: string | undefined; bloqueado: boolean }) {
  const r = valor.trim() ? analizar(valor, variables) : null;
  return (
    <div className="entrada-expresion">
      <label htmlFor={id}>
        Tu respuesta {prefijo && <span className="num">({prefijo} …)</span>}
      </label>
      <input id={id} value={valor} maxLength={200} autoComplete="off" spellCheck={false} disabled={bloqueado} onChange={(e) => alCambiar(e.target.value)} aria-describedby={`${id}-vista`} placeholder="Por ejemplo: 6x + 2" />
      <p id={`${id}-vista`} className="entrada-vista" aria-live="polite">
        {!r ? (
          <span className="suave">Escribe con x, ^ para potencias, * o multiplicación implícita, sin(), cos(), sqrt(), ln().</span>
        ) : r.ok ? (
          <>
            <span className="suave">Se leerá como: </span>
            <FormulaSegura latex={`${prefijo ? `${prefijo.replace("'", "'")} ` : ''}${aLatex(r.nodo)}`} />
          </>
        ) : (
          <span className="campo-error">{r.error.mensaje}</span>
        )}
      </p>
    </div>
  );
}

function SubPreguntaVista({ s, valor, alCambiar, bloqueado }: { s: SubPregunta; valor: Respuesta | undefined; alCambiar: (r: Respuesta) => void; bloqueado: boolean }) {
  const id = useId();
  const texto = valor?.tipo === 'texto' ? valor.valor : '';
  return (
    <div className="subpregunta">
      <p className="subpregunta-enunciado" id={`${id}-e`}>
        {s.enunciado}
      </p>
      {s.tipo === 'opcion-unica' ? (
        <div role="radiogroup" aria-labelledby={`${id}-e`} className="pregunta-opciones">
          {s.opciones.map((o) => (
            <label key={o.id} className="ejercicio-opcion" data-elegida={(valor?.tipo === 'opcion' && valor.id === o.id) || undefined}>
              <input type="radio" name={id} disabled={bloqueado} checked={valor?.tipo === 'opcion' && valor.id === o.id} onChange={() => alCambiar({ tipo: 'opcion', id: o.id })} />
              {o.texto}
            </label>
          ))}
        </div>
      ) : s.tipo === 'numerica' ? (
        <input aria-labelledby={`${id}-e`} inputMode="decimal" value={texto} disabled={bloqueado} onChange={(e) => alCambiar({ tipo: 'texto', valor: e.target.value })} />
      ) : (
        <textarea aria-labelledby={`${id}-e`} rows={3} maxLength={3000} value={texto} disabled={bloqueado} onChange={(e) => alCambiar({ tipo: 'texto', valor: e.target.value })} />
      )}
    </div>
  );
}

/** Controles de respuesta para cada tipo de pregunta. `bloqueado` impide cambiarla (revisión o tras comprobar). */
export function RespuestaControles({ p, valor, alCambiar, bloqueado = false }: { p: Pregunta; valor: Respuesta | undefined; alCambiar: (r: Respuesta) => void; bloqueado?: boolean }) {
  const id = useId();
  const objeto = useMemo(() => (p.tipo === 'identificar' ? validarBloque(p.objeto) : null), [p]);
  const desordenados = useMemo(() => {
    if (p.tipo !== 'ordenamiento' && p.tipo !== 'relacion') return [];
    const azar = aleatorio(p.id.split('').reduce((a, c) => a * 31 + c.charCodeAt(0), 7));
    const base = p.tipo === 'ordenamiento' ? p.elementos.map((e) => e.id) : p.pares.map((x) => x.id);
    let lista = base.map((x) => ({ x, k: azar() })).sort((a, b) => a.k - b.k).map((x) => x.x);
    // Una pregunta proyectada por el servidor (simulacro) no trae `orden`: se compara con el orden mostrado.
    if (lista.join() === (p.tipo === 'ordenamiento' ? (p.orden ?? base) : base).join()) lista = [...lista.slice(1), lista[0]!];
    return lista;
  }, [p]);
  const texto = valor?.tipo === 'texto' ? valor.valor : '';

  switch (p.tipo) {
    case 'opcion-unica':
      return (
        <div role="radiogroup" aria-label="Opciones" className="pregunta-opciones">
          {p.opciones.map((o, k) => (
            <label key={o.id} className="ejercicio-opcion" data-elegida={(valor?.tipo === 'opcion' && valor.id === o.id) || undefined}>
              <input type="radio" name={id} disabled={bloqueado} checked={valor?.tipo === 'opcion' && valor.id === o.id} onChange={() => alCambiar({ tipo: 'opcion', id: o.id })} />
              <span className="opcion-letra" aria-hidden="true">
                {LETRAS[k]}
              </span>
              {o.texto}
            </label>
          ))}
        </div>
      );
    case 'opcion-multiple': {
      const ids = valor?.tipo === 'opciones' ? valor.ids : [];
      return (
        <fieldset className="pregunta-opciones">
          <legend className="suave">Elige todas las correctas.</legend>
          {p.opciones.map((o, k) => (
            <label key={o.id} className="ejercicio-opcion" data-elegida={ids.includes(o.id) || undefined}>
              <input type="checkbox" disabled={bloqueado} checked={ids.includes(o.id)} onChange={(e) => alCambiar({ tipo: 'opciones', ids: e.target.checked ? [...ids, o.id] : ids.filter((x) => x !== o.id) })} />
              <span className="opcion-letra" aria-hidden="true">
                {LETRAS[k]}
              </span>
              {o.texto}
            </label>
          ))}
        </fieldset>
      );
    }
    case 'verdadero-falso':
      return (
        <div role="radiogroup" aria-label="Verdadero o falso" className="opciones-pastilla">
          {([true, false] as const).map((v) => (
            <label key={String(v)} className="pastilla pastilla-grande">
              <input type="radio" name={id} disabled={bloqueado} checked={valor?.tipo === 'booleano' && valor.valor === v} onChange={() => alCambiar({ tipo: 'booleano', valor: v })} />
              {v ? 'Verdadero' : 'Falso'}
            </label>
          ))}
        </div>
      );
    case 'numerica':
      return (
        <div className="ejercicio-respuesta">
          <label htmlFor={id}>Tu respuesta{p.unidad ? ` (en ${p.unidad})` : ''}</label>
          <input id={id} inputMode="decimal" autoComplete="off" value={texto} maxLength={60} disabled={bloqueado} onChange={(e) => alCambiar({ tipo: 'texto', valor: e.target.value })} />
          <p className="suave">Enteros, decimales con coma o fracciones (por ejemplo, −3/2).</p>
        </div>
      );
    case 'expresion':
      return <EntradaExpresion id={id} valor={texto} alCambiar={(v) => alCambiar({ tipo: 'texto', valor: v })} variables={p.variables} prefijo={p.prefijo} bloqueado={bloqueado} />;
    case 'abierta':
      return (
        <div className="ejercicio-respuesta ejercicio-abierta">
          <label htmlFor={id}>Tu respuesta</label>
          <textarea id={id} rows={5} maxLength={3000} value={texto} disabled={bloqueado} onChange={(e) => alCambiar({ tipo: 'texto', valor: e.target.value })} />
        </div>
      );
    case 'identificar': {
      if (!objeto?.ok) return <p className="mensaje mensaje-error">No pudimos mostrar el objeto de esta pregunta.</p>;
      const elegido = valor?.tipo === 'opcion' ? valor.id : null;
      const cambiar = (x: string) => alCambiar({ tipo: 'opcion', id: x });
      if (objeto.bloque.tipo === 'obra') return <IdentificarEnObra obra={objeto.bloque} valor={elegido} alCambiar={cambiar} bloqueado={bloqueado} />;
      if (objeto.bloque.tipo === 'modelo-3d') return <IdentificarEn3D modelo={objeto.bloque} valor={elegido} alCambiar={cambiar} bloqueado={bloqueado} />;
      return null;
    }
    case 'ordenamiento': {
      const orden = valor?.tipo === 'orden' ? valor.ids : desordenados;
      const mover = (k: number, d: -1 | 1) => {
        const copia = [...orden];
        [copia[k], copia[k + d]] = [copia[k + d]!, copia[k]!];
        alCambiar({ tipo: 'orden', ids: copia });
      };
      return (
        <div className="pregunta-orden">
          <ol>
            {orden.map((x, k) => (
              <li key={x}>
                <span className="num orden-numero">{k + 1}</span>
                <span className="orden-texto">{p.elementos.find((e) => e.id === x)?.texto}</span>
                <span className="temario-acciones">
                  <button type="button" className="boton-icono" disabled={bloqueado || k === 0} onClick={() => mover(k, -1)}>
                    <span aria-hidden="true">↑</span>
                    <span className="visually-hidden">Subir</span>
                  </button>
                  <button type="button" className="boton-icono" disabled={bloqueado || k === orden.length - 1} onClick={() => mover(k, 1)}>
                    <span aria-hidden="true">↓</span>
                    <span className="visually-hidden">Bajar</span>
                  </button>
                </span>
              </li>
            ))}
          </ol>
          {valor?.tipo !== 'orden' && !bloqueado && (
            <button type="button" className="boton boton-terciario boton-chico" onClick={() => alCambiar({ tipo: 'orden', ids: orden })}>
              Dejar este orden
            </button>
          )}
        </div>
      );
    }
    case 'relacion': {
      const asignacion = valor?.tipo === 'pares' ? valor.asignacion : {};
      return (
        <div className="pregunta-relacion">
          {p.pares.map((x) => (
            <div key={x.id} className="relacion-fila">
              <label htmlFor={`${id}-${x.id}`}>{x.izquierda}</label>
              <select id={`${id}-${x.id}`} value={asignacion[x.id] ?? ''} disabled={bloqueado} onChange={(e) => alCambiar({ tipo: 'pares', asignacion: { ...asignacion, [x.id]: e.target.value } })}>
                <option value="">Elige…</option>
                {desordenados.map((d) => (
                  <option key={d} value={d}>
                    {p.pares.find((y) => y.id === d)?.derecha}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }
    case 'caso': {
      const respuestas = valor?.tipo === 'caso' ? valor.respuestas : {};
      return (
        <div className="pregunta-caso">
          <blockquote className="estudio caso-texto">{p.caso}</blockquote>
          {p.preguntas.map((s) => (
            <SubPreguntaVista key={s.id} s={s} valor={respuestas[s.id]} bloqueado={bloqueado} alCambiar={(r) => alCambiar({ tipo: 'caso', respuestas: { ...respuestas, [s.id]: r } })} />
          ))}
        </div>
      );
    }
  }
}

/** Respuesta esperada en lenguaje claro (se muestra solo después de responder). */
function Esperada({ p }: { p: Pregunta }) {
  switch (p.tipo) {
    case 'opcion-unica':
      return <>{p.opciones.find((o) => o.id === p.correcta)?.texto}</>;
    case 'opcion-multiple':
      return <>{p.opciones.filter((o) => p.correctas.includes(o.id)).map((o) => o.texto).join(' · ')}</>;
    case 'verdadero-falso':
      return <>{p.correcta ? 'Verdadero' : 'Falso'}</>;
    case 'numerica':
      return (
        <>
          {cifra(p.respuesta)}
          {p.unidad ? ` ${p.unidad}` : ''} (tolerancia {p.tolerancia.tipo === 'absoluta' ? `±${cifra(p.tolerancia.valor)}` : `±${cifra(p.tolerancia.valor * 100)} %`})
        </>
      );
    case 'expresion': {
      const r = analizar(p.respuesta, p.variables);
      return r.ok ? <FormulaSegura latex={`${p.prefijo ? `${p.prefijo} ` : ''}${aLatex(r.nodo)}`} /> : <>{p.respuesta}</>;
    }
    case 'identificar': {
      const v = validarBloque(p.objeto);
      if (!v.ok) return null;
      const ids = v.bloque.tipo === 'obra' ? v.bloque.contenido.regiones.map((x) => x.id) : v.bloque.tipo === 'modelo-3d' ? (v.bloque.contenido.partes ?? []).map((x) => x.id) : [];
      const k = ids.indexOf(p.correcta);
      return <>{v.bloque.tipo === 'obra' ? `Región ${LETRAS[k]}` : `Pieza ${LETRAS[k]}`}</>;
    }
    case 'ordenamiento':
      return <>{p.orden.map((x, k) => `${k + 1}. ${p.elementos.find((e) => e.id === x)?.texto}`).join(' · ')}</>;
    case 'relacion':
      return <>{p.pares.map((x) => `${x.izquierda} → ${x.derecha}`).join(' · ')}</>;
    default:
      return null;
  }
}

/** Retroalimentación: estado, criterio de corrección, detalle, respuesta esperada, explicación y criterios. */
export function Retroalimentacion({ p, r, correccion }: { p: Pregunta; r: Respuesta | undefined; correccion?: Correccion }) {
  const c = correccion ?? corregir(p, r);
  const esperada = <Esperada p={p} />;
  return (
    <div className="retro" data-estado={c.estado}>
      <p className="retro-estado">
        <strong>{ETIQUETA_ESTADO[c.estado]}</strong>
        {c.puntaje !== null && c.estado === 'parcial' && <span className="num"> · {Math.round(c.puntaje * 100)} %</span>}
        <span className="suave"> · Corrección: {c.criterio}</span>
      </p>
      <p className="retro-detalle">{c.detalle}</p>
      {c.estado !== 'correcta' && p.tipo !== 'abierta' && p.tipo !== 'caso' && (
        <p className="retro-esperada">
          <span className="suave">Respuesta esperada: </span>
          {esperada}
        </p>
      )}
      {p.tipo === 'caso' && (
        <ul className="retro-sub">
          {corregirSubpreguntas(p, r).map((s) => (
            <li key={s.id}>
              {p.preguntas.find((x) => x.id === s.id)?.enunciado} — <strong>{ETIQUETA_ESTADO[s.correccion.estado]}</strong>. {s.correccion.detalle}
            </li>
          ))}
        </ul>
      )}
      {p.tipo === 'abierta' && (
        <div className="retro-criterios">
          <p className="suave">Compara tu respuesta con estos criterios:</p>
          <ul>
            {p.criterios.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          {p.respuestaModelo && (
            <p>
              <span className="suave">Una respuesta posible: </span>
              {p.respuestaModelo}
            </p>
          )}
        </div>
      )}
      {p.explicacion && (
        <p className="retro-explicacion">
          <span className="suave">Por qué: </span>
          {p.explicacion}
        </p>
      )}
    </div>
  );
}

/** Enunciado, apoyo (bloque del núcleo educativo) y procedencia de una pregunta. */
export function Enunciado({ p, numero, total }: { p: Pregunta; numero?: number; total?: number }) {
  const apoyo = useMemo(() => (p.apoyo !== undefined ? (validarBloque(p.apoyo).ok ? p.apoyo : null) : null), [p]);
  return (
    <header className="pregunta-cabecera">
      <p className="pregunta-meta">
        {numero !== undefined && total !== undefined && (
          <span className="num">
            Pregunta {numero} de {total}
          </span>
        )}
        <span>{p.tema}</span>
        <span>{{ basica: 'Básica', media: 'Media', avanzada: 'Avanzada' }[p.dificultad]}</span>
        <span className="bloque-origen" data-origen={p.origen}>
          {{ ejemplo: 'Ejemplo ilustrativo', tutor: 'Generada por el Tutor', persona: 'Tuya', material: 'De tu material' }[p.origen]}
        </span>
      </p>
      <h3 className="pregunta-enunciado">{p.enunciado}</h3>
      {p.procedencia && <p className="suave">Procedencia: {p.procedencia}</p>}
      {apoyo !== null && <Apoyo entrada={apoyo as Bloque} />}
    </header>
  );
}
