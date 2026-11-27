'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Icono } from '@/components/ui/iconos';
import { mensajeDeError } from '@/lib/api-cliente';
import { cambiarCarpeta, crearCarpeta, eliminarCarpeta, listarCarpetas, listarElementos, moverElemento, ServicioNoDisponible } from '../api';
import { buscar, destinosValidos, hijas, nombreDisponible, profundidad, ruta, type Orden } from '../arbol';
import { NOMBRE_MAX, PROFUNDIDAD_MAX, type Carpeta, type Elemento, type EstadoCarpeta, type Modulo } from '../tipos';
import { Dialogo } from './dialogo';
import { MenuAcciones } from './menu-acciones';

const NOMBRE_MODULO: Record<Modulo, string> = { APRENDIZAJE: 'Aprendizaje', EXAMENES: 'Exámenes' };
const VACIO: Record<Modulo, string> = {
  APRENDIZAJE: 'Agrupa tus temas y sesiones por área: Astronomía, Matemáticas, Mecánica…',
  EXAMENES: 'Agrupa tus preparaciones por asignatura: un parcial y un final de la misma materia van juntos.',
};
const enlaceElemento = (e: Elemento) =>
  e.tipo === 'TEMA' ? `/espacios/${e.id}` : e.tipo === 'SESION' ? `/tutor/${e.id}` : '/examenes';
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short', timeZone: 'America/Lima' });

type Estado = 'cargando' | 'no-disponible' | 'error' | 'listo';
type Dialogo =
  | { tipo: 'crear' }
  | { tipo: 'renombrar'; carpeta: Carpeta }
  | { tipo: 'mover'; carpeta: Carpeta }
  | { tipo: 'mover-elemento'; elemento: Elemento }
  | { tipo: 'eliminar'; carpeta: Carpeta }
  | null;

/**
 * Carpetas de un módulo (Aprendizaje o Exámenes, nunca mezclados): migas, árbol, búsqueda, orden, archivo y acciones
 * con confirmación. La carpeta abierta vive en la URL (`?carpeta=`) para volver atrás y compartir la ubicación.
 * Si la API todavía no ofrece carpetas, se dice así y no se simula nada.
 */
export function ExploradorCarpetas({ modulo }: { modulo: Modulo }) {
  const parametros = useSearchParams();
  const actualId = parametros.get('carpeta');
  const [carpetas, setCarpetas] = useState<Carpeta[]>([]);
  const [estado, setEstado] = useState<Estado>('cargando');
  const [errorCarga, setErrorCarga] = useState('');
  const [vista, setVista] = useState<EstadoCarpeta>('ACTIVA');
  const [orden, setOrden] = useState<Orden>('nombre');
  const [consulta, setConsulta] = useState('');
  const [elementos, setElementos] = useState<{ estado: Estado; lista: Elemento[] }>({ estado: 'listo', lista: [] });
  const [dialogo, setDialogo] = useState<Dialogo>(null);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState('');
  const idTitulo = useId();

  const abrir = useCallback((id: string | null) => {
    const q = new URLSearchParams(window.location.search);
    if (id) q.set('carpeta', id);
    else q.delete('carpeta');
    const texto = q.toString();
    window.history.pushState(null, '', `${window.location.pathname}${texto ? `?${texto}` : ''}`);
  }, []);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    try {
      setCarpetas(await listarCarpetas(modulo, vista));
      setEstado('listo');
    } catch (e) {
      if (e instanceof ServicioNoDisponible) setEstado('no-disponible');
      else {
        setErrorCarga(mensajeDeError(e));
        setEstado('error');
      }
    }
  }, [modulo, vista]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const actual = useMemo(() => carpetas.find((c) => c.id === actualId) ?? null, [carpetas, actualId]);
  const migas = useMemo(() => ruta(carpetas, actual?.id ?? null), [carpetas, actual]);
  const subcarpetas = useMemo(() => hijas(carpetas, actual?.id ?? null, orden), [carpetas, actual, orden]);
  const resultados = useMemo(() => buscar(carpetas, consulta), [carpetas, consulta]);

  useEffect(() => {
    if (!actual) return setElementos({ estado: 'listo', lista: [] });
    let vigente = true;
    setElementos({ estado: 'cargando', lista: [] });
    listarElementos(actual.id)
      .then((lista) => vigente && setElementos({ estado: 'listo', lista }))
      .catch(() => vigente && setElementos({ estado: 'error', lista: [] }));
    return () => {
      vigente = false;
    };
  }, [actual]);

  async function ejecutar(accion: () => Promise<unknown>, exito: string) {
    setErrorAccion('');
    try {
      await accion();
      setDialogo(null);
      setAviso(exito);
      await cargar();
    } catch (e) {
      setAviso('');
      throw new Error(mensajeDeError(e), { cause: e });
    }
  }

  const accionesDe = (c: Carpeta) => [
    { texto: 'Abrir', icono: 'carpeta' as const, alElegir: () => abrir(c.id) },
    { texto: 'Renombrar', icono: 'editar' as const, alElegir: () => setDialogo({ tipo: 'renombrar', carpeta: c }) },
    ...(c.estado === 'ACTIVA' ? [{ texto: 'Mover a…', icono: 'mover' as const, alElegir: () => setDialogo({ tipo: 'mover', carpeta: c }) }] : []),
    c.estado === 'ACTIVA'
      ? { texto: 'Archivar', icono: 'archivar' as const, alElegir: () => void ejecutar(() => cambiarCarpeta(c.id, { estado: 'ARCHIVADA' }), `Archivaste «${c.nombre}».`).catch((e: Error) => setErrorAccion(e.message)) }
      : { texto: 'Restaurar', icono: 'reintentar' as const, alElegir: () => void ejecutar(() => cambiarCarpeta(c.id, { estado: 'ACTIVA' }), `Restauraste «${c.nombre}».`).catch((e: Error) => setErrorAccion(e.message)) },
    { texto: 'Eliminar', icono: 'borrar' as const, peligrosa: true, alElegir: () => setDialogo({ tipo: 'eliminar', carpeta: c }) },
  ];

  const filaCarpeta = (c: Carpeta, detalle?: string) => (
    <li key={c.id} className="carpeta-fila">
      <button type="button" className="carpeta-abrir" onClick={() => abrir(c.id)}>
        <Icono nombre="carpeta" />
        <span className="carpeta-nombre">{c.nombre}</span>
        <span className="carpeta-dato">{detalle ?? `${c.elementos} ${c.elementos === 1 ? 'elemento' : 'elementos'}`}</span>
        <span className="carpeta-dato carpeta-fecha">{fecha(c.actualizadaEn)}</span>
      </button>
      <MenuAcciones etiqueta={`Acciones de ${c.nombre}`} acciones={accionesDe(c)} />
    </li>
  );

  const puedeCrearAqui = profundidad(carpetas, actual?.id ?? null) < PROFUNDIDAD_MAX && vista === 'ACTIVA';

  return (
    <section className="carpetas" aria-labelledby={idTitulo}>
      <header className="carpetas-cabecera">
        <h2 id={idTitulo} className="carpetas-titulo">
          Carpetas
        </h2>
        {estado === 'listo' && (
          <div className="carpetas-herramientas">
            <label className="campo-busqueda">
              <Icono nombre="buscar" tamano={18} />
              <span className="visually-hidden">Buscar carpetas de {NOMBRE_MODULO[modulo]}</span>
              <input type="search" value={consulta} onChange={(e) => setConsulta(e.target.value)} placeholder="Buscar carpetas" />
            </label>
            <label className="campo-orden">
              <span className="visually-hidden">Ordenar carpetas</span>
              <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)}>
                <option value="nombre">Nombre</option>
                <option value="recientes">Recientes</option>
              </select>
            </label>
            <button type="button" className="boton boton-terciario boton-chico" aria-pressed={vista === 'ARCHIVADA'} onClick={() => setVista((v) => (v === 'ACTIVA' ? 'ARCHIVADA' : 'ACTIVA'))}>
              <Icono nombre="archivar" tamano={18} />
              Archivadas
            </button>
            {puedeCrearAqui && (
              <button type="button" className="boton boton-secundario boton-chico" onClick={() => setDialogo({ tipo: 'crear' })}>
                <Icono nombre="mas" tamano={18} />
                Nueva carpeta
              </button>
            )}
          </div>
        )}
      </header>

      <p className="visually-hidden" role="status" aria-live="polite">
        {aviso}
      </p>
      {errorAccion && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{errorAccion}</span>
        </p>
      )}

      {estado === 'cargando' && (
        <ul className="carpetas-esqueleto" aria-label="Cargando carpetas">
          {[0, 1, 2].map((k) => (
            <li key={k} />
          ))}
        </ul>
      )}

      {estado === 'no-disponible' && (
        <div className="vacio">
          <Icono nombre="carpeta" tamano={24} />
          <div>
            <p className="vacio-titulo">Las carpetas no están disponibles en este momento.</p>
            <p className="suave">No hay carpetas guardadas que mostrar ni se puede crear una ahora. El resto de {NOMBRE_MODULO[modulo]} sigue funcionando.</p>
            <p>
              <button type="button" className="boton boton-secundario boton-chico" onClick={() => void cargar()}>
                <Icono nombre="reintentar" tamano={18} />
                Volver a intentar
              </button>
            </p>
          </div>
        </div>
      )}

      {estado === 'error' && (
        <div role="alert" className="mensaje mensaje-error carpetas-error">
          <Icono nombre="aviso" />
          <span>No pudimos cargar tus carpetas. {errorCarga}</span>
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => void cargar()}>
            Reintentar
          </button>
        </div>
      )}

      {estado === 'listo' && (
        <>
          <nav aria-label={`Ubicación en ${NOMBRE_MODULO[modulo]}`} className="migas-carpetas">
            <ol>
              <li>
                {migas.length ? (
                  <button type="button" onClick={() => abrir(null)}>
                    {vista === 'ARCHIVADA' ? 'Archivadas' : NOMBRE_MODULO[modulo]}
                  </button>
                ) : (
                  <span aria-current="location">{vista === 'ARCHIVADA' ? 'Archivadas' : NOMBRE_MODULO[modulo]}</span>
                )}
              </li>
              {migas.map((m, i) => (
                <li key={m.id}>
                  {i < migas.length - 1 ? (
                    <button type="button" onClick={() => abrir(m.id)}>
                      {m.nombre}
                    </button>
                  ) : (
                    <span aria-current="location">{m.nombre}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {consulta.trim() ? (
            resultados.length ? (
              <ul className="carpetas-lista" aria-label="Resultados de la búsqueda">
                {resultados.map((r) => filaCarpeta(r.carpeta, [NOMBRE_MODULO[modulo], ...r.ruta].join(' / ')))}
              </ul>
            ) : (
              <p className="suave carpetas-sin-resultados">No hay carpetas con «{consulta.trim()}».</p>
            )
          ) : (
            <>
              {subcarpetas.length > 0 && <ul className="carpetas-lista">{subcarpetas.map((c) => filaCarpeta(c))}</ul>}
              {actual && (
                <div className="carpeta-contenido">
                  {elementos.estado === 'cargando' && <p className="suave">Cargando el contenido…</p>}
                  {elementos.estado === 'error' && (
                    <p role="alert" className="mensaje mensaje-error">
                      <Icono nombre="aviso" />
                      <span>No pudimos cargar el contenido de «{actual.nombre}».</span>
                    </p>
                  )}
                  {elementos.estado === 'listo' && elementos.lista.length > 0 && (
                    <ul className="carpetas-lista" aria-label={`Contenido de ${actual.nombre}`}>
                      {elementos.lista.map((e) => (
                        <li key={e.id} className="carpeta-fila">
                          <Link href={enlaceElemento(e)} className="carpeta-abrir">
                            <Icono nombre={e.tipo === 'SESION' ? 'conversaciones' : e.tipo === 'PREPARACION' ? 'examen' : 'fuente'} />
                            <span className="carpeta-nombre">{e.titulo}</span>
                            <span className="carpeta-dato">{e.tipo === 'TEMA' ? 'Tema' : e.tipo === 'SESION' ? 'Sesión' : 'Preparación'}</span>
                            <span className="carpeta-dato carpeta-fecha">{fecha(e.actualizadoEn)}</span>
                          </Link>
                          <MenuAcciones etiqueta={`Acciones de ${e.titulo}`} acciones={[{ texto: 'Mover a…', icono: 'mover', alElegir: () => setDialogo({ tipo: 'mover-elemento', elemento: e }) }]} />
                        </li>
                      ))}
                    </ul>
                  )}
                  {elementos.estado === 'listo' && elementos.lista.length === 0 && subcarpetas.length === 0 && (
                    <p className="suave carpetas-sin-resultados">«{actual.nombre}» está vacía.</p>
                  )}
                </div>
              )}
              {!actual && subcarpetas.length === 0 && (
                <div className="vacio">
                  <Icono nombre="carpeta" tamano={24} />
                  <div>
                    <p className="vacio-titulo">{vista === 'ARCHIVADA' ? 'No tienes carpetas archivadas.' : 'Aún no tienes carpetas.'}</p>
                    {vista === 'ACTIVA' && <p className="suave">{VACIO[modulo]}</p>}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <DialogosCarpeta
        modulo={modulo}
        dialogo={dialogo}
        carpetas={carpetas}
        padreActual={actual?.id ?? null}
        alCerrar={() => setDialogo(null)}
        ejecutar={ejecutar}
      />
    </section>
  );
}

/** Crear, renombrar, mover (carpetas o elementos) y eliminar con confirmación. Los errores se muestran en el propio diálogo. */
function DialogosCarpeta({
  modulo,
  dialogo,
  carpetas,
  padreActual,
  alCerrar,
  ejecutar,
}: {
  modulo: Modulo;
  dialogo: Dialogo;
  carpetas: Carpeta[];
  padreActual: string | null;
  alCerrar: () => void;
  ejecutar: (accion: () => Promise<unknown>, exito: string) => Promise<void>;
}) {
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  useEffect(() => setError(''), [dialogo]);

  const enviar = async (accion: () => Promise<unknown>, exito: string) => {
    setEnviando(true);
    setError('');
    try {
      await ejecutar(accion, exito);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setEnviando(false);
    }
  };

  const titulo =
    dialogo?.tipo === 'crear'
      ? 'Nueva carpeta'
      : dialogo?.tipo === 'renombrar'
        ? 'Renombrar carpeta'
        : dialogo?.tipo === 'mover' || dialogo?.tipo === 'mover-elemento'
          ? 'Mover a otra carpeta'
          : dialogo?.tipo === 'eliminar'
            ? `¿Eliminar «${dialogo.carpeta.nombre}»?`
            : '';

  const formularioNombre = (inicial: string, padreId: string | null, excepto?: string) => (
    <form
      method="post"
      className="formulario dialogo-formulario"
      onSubmit={(e) => {
        e.preventDefault();
        const nombre = String(new FormData(e.currentTarget).get('nombre') ?? '').trim();
        if (!nombreDisponible(carpetas, padreId, nombre, excepto)) return setError('Ya hay una carpeta con ese nombre en esta ubicación.');
        if (dialogo?.tipo === 'renombrar') void enviar(() => cambiarCarpeta(dialogo.carpeta.id, { nombre }), `Renombraste la carpeta a «${nombre}».`);
        else void enviar(() => crearCarpeta({ modulo, nombre, padreId }), `Creaste la carpeta «${nombre}».`);
      }}
    >
      <div className="campo">
        <label htmlFor="nombre-carpeta">Nombre</label>
        <input id="nombre-carpeta" name="nombre" defaultValue={inicial} required maxLength={NOMBRE_MAX} autoFocus autoComplete="off" />
      </div>
      {error && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
      <p className="dialogo-acciones">
        <button type="button" className="boton boton-terciario" onClick={alCerrar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={enviando}>
          {dialogo?.tipo === 'renombrar' ? 'Guardar' : 'Crear carpeta'}
        </button>
      </p>
    </form>
  );

  const formularioMover = (opciones: Array<Carpeta | null>, alMover: (destino: Carpeta | null) => void) => (
    <form
      method="post"
      className="formulario dialogo-formulario"
      onSubmit={(e) => {
        e.preventDefault();
        const valor = String(new FormData(e.currentTarget).get('destino') ?? '');
        alMover(valor === '__raiz' ? null : (carpetas.find((c) => c.id === valor) ?? null));
      }}
    >
      {opciones.length === 0 ? (
        <p className="suave">No hay otra ubicación válida: una carpeta no puede ir dentro de sí misma ni superar {PROFUNDIDAD_MAX} niveles.</p>
      ) : (
        <fieldset className="opciones-destino">
          <legend className="visually-hidden">Destino</legend>
          {opciones.map((c, i) => (
            <label key={c?.id ?? '__raiz'} className="opcion-destino">
              <input type="radio" name="destino" value={c?.id ?? '__raiz'} defaultChecked={i === 0} />
              <span>{c ? [...ruta(carpetas, c.id)].map((x) => x.nombre).join(' / ') : `${NOMBRE_MODULO[modulo]} (sin carpeta)`}</span>
            </label>
          ))}
        </fieldset>
      )}
      {error && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
      <p className="dialogo-acciones">
        <button type="button" className="boton boton-terciario" onClick={alCerrar}>
          Cancelar
        </button>
        <button type="submit" className="boton boton-primario" disabled={enviando || opciones.length === 0}>
          Mover aquí
        </button>
      </p>
    </form>
  );

  return (
    <Dialogo
      abierto={dialogo !== null}
      titulo={titulo}
      descripcion={dialogo?.tipo === 'eliminar' ? 'Sus subcarpetas y su contenido no se borran: pasan a la raíz del módulo. Esta acción no se puede deshacer.' : undefined}
      alCerrar={alCerrar}
    >
      {dialogo?.tipo === 'crear' && formularioNombre('', padreActual)}
      {dialogo?.tipo === 'renombrar' && formularioNombre(dialogo.carpeta.nombre, dialogo.carpeta.padreId, dialogo.carpeta.id)}
      {dialogo?.tipo === 'mover' &&
        formularioMover(destinosValidos(carpetas, dialogo.carpeta.id), (destino) => {
          if (!nombreDisponible(carpetas, destino?.id ?? null, dialogo.carpeta.nombre, dialogo.carpeta.id)) return setError('En el destino ya hay una carpeta con ese nombre.');
          void enviar(() => cambiarCarpeta(dialogo.carpeta.id, { padreId: destino?.id ?? null }), `Moviste «${dialogo.carpeta.nombre}».`);
        })}
      {dialogo?.tipo === 'mover-elemento' &&
        formularioMover(
          carpetas.filter((c) => c.id !== dialogo.elemento.carpetaId),
          (destino) => destino && void enviar(() => moverElemento(destino.id, dialogo.elemento), `Moviste «${dialogo.elemento.titulo}».`),
        )}
      {dialogo?.tipo === 'eliminar' && (
        <div className="formulario dialogo-formulario">
          {error && (
            <p role="alert" className="mensaje mensaje-error">
              <Icono nombre="aviso" />
              <span>{error}</span>
            </p>
          )}
          <p className="dialogo-acciones">
            <button type="button" className="boton boton-terciario" onClick={alCerrar} autoFocus>
              Cancelar
            </button>
            <button type="button" className="boton boton-peligro" disabled={enviando} onClick={() => void enviar(() => eliminarCarpeta(dialogo.carpeta.id), `Eliminaste «${dialogo.carpeta.nombre}».`)}>
              Eliminar carpeta
            </button>
          </p>
        </div>
      )}
    </Dialogo>
  );
}
