import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Icono } from '@/components/iconos';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Tutor' };
export const dynamic = 'force-dynamic';

type Conversacion = { id: string; titulo: string; espacioId: string | null; mensajes: number; actualizadaEn: string; expiraEn: string };
type Espacio = { id: string; titulo: string };
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Lima' });

/** Conversaciones vigentes con su fecha de eliminación automática (90 días desde la última actividad, ADR-079). */
export default async function Tutor() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/tutor');
  const [r, espacios] = await Promise.all([apiServidor<Conversacion[]>('/tutor-ia/conversaciones'), apiServidor<Espacio[]>('/espacios')]);
  const lista = [...(r.datos ?? [])].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
  const espacio = (id: string | null) => espacios.datos?.find((e) => e.id === id)?.titulo;
  return (
    <div className="pagina">
      <header className="pagina-cabecera">
        <h1>Mis conversaciones</h1>
        <p className="suave">
          Para preguntar sobre tus fuentes, abre uno de tus espacios. Cada conversación se eliminará el día indicado: 90 días después de su última actividad.
        </p>
      </header>
      {r.error && !r.datos ? (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>No pudimos cargar tus conversaciones. Recarga la página para intentarlo de nuevo.</span>
        </p>
      ) : lista.length === 0 ? (
        <div className="vacio">
          <Icono nombre="conversaciones" tamano={24} />
          <div>
            <p className="vacio-titulo">Aún no tienes conversaciones.</p>
            <p className="suave">Abre un espacio y pregúntale al Tutor sobre tus fuentes.</p>
            <p>
              <Link href="/espacios" className="boton boton-primario">
                Ir a mis espacios
              </Link>
            </p>
          </div>
        </div>
      ) : (
        <div className="tabla-contenedor" data-desplazable>
          <table className="tabla tabla-apilable">
            <caption className="visually-hidden">Conversaciones guardadas</caption>
            <thead>
              <tr>
                <th scope="col">Conversación</th>
                <th scope="col">Espacio</th>
                <th scope="col" className="num">Mensajes</th>
                <th scope="col">Última actividad</th>
                <th scope="col">Se elimina el</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((c) => (
                <tr key={c.id}>
                  <th scope="row">
                    <Link href={`/tutor/${c.id}`}>{c.titulo}</Link>
                  </th>
                  <td data-titulo="Espacio">{espacio(c.espacioId) ?? 'Sin espacio'}</td>
                  <td data-titulo="Mensajes" className="num">
                    {c.mensajes}
                  </td>
                  <td data-titulo="Última actividad">{fecha(c.actualizadaEn)}</td>
                  <td data-titulo="Se elimina el">{fecha(c.expiraEn)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
