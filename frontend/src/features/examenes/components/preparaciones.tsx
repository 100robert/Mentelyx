'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { Icono } from '@/components/ui/iconos';
import { mensajeDeError } from '@/lib/api-cliente';
import { EJEMPLOS } from '../ejemplo/datos';
import { diasRestantes, estadoPreparacion, hoyIso, siguienteActividad, tituloPreparacion, type EstadoPreparacion, type PreparacionVista } from '../preparaciones/modelo';
import { cargarPreparaciones, type ModoServicio } from '../servicios/api';

export type { PreparacionVista as Preparacion };
type Carga = { estado: 'cargando' } | { estado: 'error'; mensaje: string } | { estado: 'listo'; modo: ModoServicio; lista: PreparacionVista[] };

const fechaLarga = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });
const FILTROS: Array<[EstadoPreparacion | 'todas', string]> = [
  ['todas', 'Todas'],
  ['activa', 'Activas'],
  ['proxima', 'Próximas'],
  ['completada', 'Completadas'],
  ['archivada', 'Archivadas'],
];

export function usePreparaciones() {
  const [carga, setCarga] = useState<Carga>({ estado: 'cargando' });
  const recargar = useCallback(async () => {
    setCarga({ estado: 'cargando' });
    try {
      const r = await cargarPreparaciones();
      setCarga({ estado: 'listo', ...r });
    } catch (e) {
      setCarga({ estado: 'error', mensaje: mensajeDeError(e) });
    }
  }, []);
  useEffect(() => {
    void recargar();
  }, [recargar]);
  return { carga, recargar };
}

/** Fecha del examen: solo si la persona la indicó (sin cuentas regresivas inventadas). */
export function FechaExamen({ fecha, hoy }: { fecha: string | null; hoy: string }) {
  if (!fecha) return <span className="suave">Sin fecha indicada</span>;
  const d = diasRestantes(fecha, hoy);
  return (
    <span>
      {fechaLarga(fecha)}
      {d > 0 ? ` · ${d === 1 ? 'mañana' : `faltan ${d} días`}` : d === 0 ? ' · hoy' : ' · ya pasó'}
    </span>
  );
}

function Fila({ p, hoy }: { p: PreparacionVista; hoy: string }) {
  const siguiente = siguienteActividad(p);
  const pct = p.avance.total ? Math.round((p.avance.completadas / p.avance.total) * 100) : 0;
  return (
    <li className="prep-fila" data-estado={estadoPreparacion(p, hoy)}>
      <Link href={`/examenes/${encodeURIComponent(p.id)}`} className="prep-enlace">
        <span className="prep-titulo">{tituloPreparacion(p)}</span>
        <span className="prep-meta">
          {p.asignatura && <span>{p.asignatura}</span>}
          <FechaExamen fecha={p.fechaExamen} hoy={hoy} />
        </span>
        <span className="prep-avance">
          <span className="num">
            {p.avance.completadas} de {p.avance.total}
          </span>{' '}
          actividades del plan
          <span className="medidor-barra" aria-hidden="true">
            <span style={{ inlineSize: `${pct}%` }} />
          </span>
        </span>
        {siguiente && <span className="prep-siguiente">Siguiente: {siguiente.titulo}</span>}
      </Link>
    </li>
  );
}

/** Lista completa de /examenes: búsqueda, filtros por estado y orden; la acción principal es continuar o empezar. */
export function ListaPreparaciones() {
  const { carga, recargar } = usePreparaciones();
  const [consulta, setConsulta] = useState('');
  const [filtro, setFiltro] = useState<EstadoPreparacion | 'todas'>('todas');
  const [orden, setOrden] = useState<'fecha' | 'avance' | 'nombre'>('fecha');
  const id = useId();
  const hoy = hoyIso();

  const lista = useMemo(() => {
    if (carga.estado !== 'listo') return [];
    const q = consulta.trim().toLowerCase();
    return carga.lista
      .filter((p) => filtro === 'todas' || estadoPreparacion(p, hoy) === filtro)
      .filter((p) => !q || `${tituloPreparacion(p)} ${p.asignatura ?? ''} ${p.temas.map((t) => t.titulo).join(' ')}`.toLowerCase().includes(q))
      .sort((a, b) =>
        orden === 'nombre'
          ? tituloPreparacion(a).localeCompare(tituloPreparacion(b), 'es')
          : orden === 'avance'
            ? a.avance.completadas / Math.max(1, a.avance.total) - b.avance.completadas / Math.max(1, b.avance.total)
            : (a.fechaExamen ?? '9999').localeCompare(b.fechaExamen ?? '9999'),
      );
  }, [carga, consulta, filtro, orden, hoy]);

  return (
    <section className="preparaciones" aria-labelledby={`${id}-titulo`}>
      <div className="bloque-cabecera">
        <h2 id={`${id}-titulo`} className="titulo-bloque">
          Preparaciones {carga.estado === 'listo' && <span className="contador">{carga.lista.length}</span>}
        </h2>
        {carga.estado === 'listo' && carga.modo !== 'no-disponible' && (
          <Link href="/examenes/nueva" className="boton boton-primario boton-chico">
            <Icono nombre="mas" tamano={18} />
            Nueva preparación
          </Link>
        )}
      </div>

      {carga.estado === 'cargando' && (
        <ul className="carpetas-esqueleto" aria-label="Cargando preparaciones">
          <li />
          <li />
        </ul>
      )}
      {carga.estado === 'error' && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>No pudimos cargar tus preparaciones. {carga.mensaje}</span>
          <button type="button" className="boton boton-secundario boton-chico" onClick={() => void recargar()}>
            Reintentar
          </button>
        </p>
      )}
      {carga.estado === 'listo' && carga.modo === 'no-disponible' && (
        <div className="vacio">
          <Icono nombre="examen" tamano={24} />
          <div>
            <p className="vacio-titulo">La preparación de exámenes no está disponible en este momento.</p>
            <p className="suave">No hay preparaciones guardadas que mostrar ni se puede crear una ahora.</p>
          </div>
        </div>
      )}
      {carga.estado === 'listo' && carga.modo === 'unica' && (
        <p className="mensaje mensaje-info prep-aviso">
          <Icono nombre="info" />
          <span>Por ahora Mentelyx guarda una preparación a la vez: crear otra reemplaza la vigente. Pronto podrás preparar varios exámenes al mismo tiempo.</span>
        </p>
      )}
      {carga.estado === 'listo' && carga.modo !== 'no-disponible' && carga.lista.length === 0 && (
        <div className="vacio prep-vacio">
          <Icono nombre="examen" tamano={24} />
          <div>
            <p className="vacio-titulo">Aún no preparas ningún examen.</p>
            <p className="suave">Cuéntanos qué examen se acerca; no necesitas subir documentos para empezar.</p>
            <p>
              <Link href="/examenes/nueva" className="boton boton-primario">
                Preparar un examen
              </Link>
            </p>
          </div>
        </div>
      )}
      {carga.estado === 'listo' && carga.lista.length > 0 && (
        <>
          <div className="prep-herramientas">
            <label className="visually-hidden" htmlFor={`${id}-buscar`}>
              Buscar preparaciones
            </label>
            <input id={`${id}-buscar`} type="search" placeholder="Buscar por examen, asignatura o tema" value={consulta} onChange={(e) => setConsulta(e.target.value)} />
            <label className="visually-hidden" htmlFor={`${id}-orden`}>
              Ordenar
            </label>
            <select id={`${id}-orden`} value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)}>
              <option value="fecha">Por fecha del examen</option>
              <option value="avance">Menos avanzadas primero</option>
              <option value="nombre">Por nombre</option>
            </select>
          </div>
          <div className="prep-filtros" role="group" aria-label="Filtrar por estado">
            {FILTROS.map(([f, nombre]) => (
              <button key={f} type="button" className="estudio-intencion" aria-pressed={filtro === f} onClick={() => setFiltro(f)}>
                {nombre}
                {f !== 'todas' && <span className="num"> {carga.lista.filter((p) => estadoPreparacion(p, hoy) === f).length}</span>}
              </button>
            ))}
          </div>
          {lista.length === 0 ? (
            <p className="suave">Ninguna preparación coincide con la búsqueda o el filtro.</p>
          ) : (
            <ul className="prep-lista">
              {lista.map((p) => (
                <Fila key={p.id} p={p} hoy={hoy} />
              ))}
            </ul>
          )}
        </>
      )}

      <aside className="prep-ejemplos" aria-labelledby={`${id}-ejemplos`}>
        <h3 id={`${id}-ejemplos`}>Para probar sin crear nada</h3>
        <ul>
          {EJEMPLOS.map((e) => (
            <li key={e.clave}>
              <Link href={`/examenes/${e.preparacion.id}`}>{e.preparacion.nombre}</Link>
              <span className="suave"> · Ejemplo ilustrativo: {e.descripcion}</span>
            </li>
          ))}
        </ul>
      </aside>
    </section>
  );
}

/** Versión compacta para el inicio personal: lo que se está preparando y cómo seguir. */
export function Preparaciones({ compacta = false }: { compacta?: boolean }) {
  const { carga } = usePreparaciones();
  const hoy = hoyIso();
  if (!compacta) return <ListaPreparaciones />;
  if (carga.estado === 'cargando') return <p className="suave">Cargando tus exámenes…</p>;
  if (carga.estado === 'error' || carga.modo === 'no-disponible') return <p className="suave">La preparación de exámenes no está disponible en este momento.</p>;
  if (carga.lista.length === 0)
    return (
      <p className="suave">
        Aún no preparas ningún examen. <Link href="/examenes/nueva">Preparar un examen</Link>
      </p>
    );
  return (
    <ul className="prep-lista prep-lista-compacta" aria-label="Tus exámenes">
      {carga.lista.slice(0, 3).map((p) => (
        <Fila key={p.id} p={p} hoy={hoy} />
      ))}
    </ul>
  );
}
