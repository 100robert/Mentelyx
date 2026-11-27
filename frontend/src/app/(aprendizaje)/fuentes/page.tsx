import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icono } from '@/components/ui/iconos';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Mis fuentes' };
export const dynamic = 'force-dynamic';

type Tema = { id: string; titulo: string; fuentes: number };
type Fuente = { contentId: string; titulo: string; formato: string; estadoLectura: string };
type Detalle = { id: string; titulo: string; listaFuentes: Fuente[] };
const ESTADOS: Record<string, string> = { LISTA: 'Lista', PENDIENTE: 'En cola', INDEXANDO: 'Leyendo', FALLIDA: 'No se pudo leer' };
const MAX_TEMAS = 12;

/** Fuentes personales (opcionales), agrupadas por el tema en el que se usan. Datos reales de M2; privadas de la cuenta. */
export default async function MisFuentes() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/fuentes');
  const temas = await apiServidor<Tema[]>('/espacios');
  const lista = temas.datos ?? [];
  const conFuentes = lista.filter((t) => t.fuentes > 0).slice(0, MAX_TEMAS);
  const detalles = await Promise.all(conFuentes.map((t) => apiServidor<Detalle>(`/espacios/${encodeURIComponent(t.id)}`)));
  const grupos = detalles.flatMap((d) => (d.datos ? [d.datos] : []));
  const primero = lista[0];

  return (
    <div className="pagina pagina-modulo">
      <header className="pagina-cabecera">
        <h1>Mis fuentes</h1>
        <p className="suave">
          Tus apuntes, libros y documentos. Son opcionales y privados: los usas dentro de un tema y el Tutor cita el pasaje del que sale cada explicación.
        </p>
      </header>
      {temas.error && !temas.datos ? (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>No pudimos cargar tus fuentes. Recarga la página para intentarlo de nuevo.</span>
        </p>
      ) : grupos.length === 0 ? (
        <div className="vacio">
          <Icono nombre="fuente" tamano={24} />
          <div>
            <p className="vacio-titulo">Aún no has agregado fuentes.</p>
            <p className="suave">Las fuentes se agregan dentro de un tema. Empieza uno y suma tus apuntes cuando quieras.</p>
            <p>
              <Link className="boton boton-secundario" href={primero ? `/espacios/${primero.id}?agregar=1` : '/aprendizaje?empezar=1'}>
                {primero ? `Agregar una fuente a ${primero.titulo}` : 'Empezar un tema'}
              </Link>
            </p>
          </div>
        </div>
      ) : (
        grupos.map((g) => (
          <section key={g.id} className="bloque" aria-labelledby={`fuentes-${g.id}`}>
            <div className="bloque-cabecera">
              <h2 id={`fuentes-${g.id}`} className="titulo-bloque">
                {g.titulo}
              </h2>
              <Link href={`/espacios/${g.id}?agregar=1`} className="enlace-accion">
                Agregar fuente
              </Link>
            </div>
            <ul className="filas" aria-label={`Fuentes de ${g.titulo}`}>
              {g.listaFuentes.map((f) => (
                <li key={f.contentId}>
                  <Link href={`/espacios/${g.id}`} className="fila fila-enlace fila-fuente">
                    <span className="fila-titulo">
                      <Icono nombre="fuente" tamano={16} />
                      {f.titulo}
                    </span>
                    <span className="fila-dato">{f.formato}</span>
                    <span className={`estado-fuente estado-${f.estadoLectura.toLowerCase()}`}>{ESTADOS[f.estadoLectura] ?? f.estadoLectura}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
