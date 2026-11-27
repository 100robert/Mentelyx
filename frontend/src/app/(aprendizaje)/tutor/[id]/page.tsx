import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { bloquesDeMensajes } from '@/features/bloques';
import { EspacioEstudio } from '@/features/estudio';
import type { FuenteVista, MensajeVista } from '@/features/tutor';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Sesión' };
export const dynamic = 'force-dynamic';

type Detalle = { id: string; titulo: string; espacioId: string | null; expiraEn: string; listaMensajes: MensajeVista[] };
type Espacio = { id: string; titulo: string; listaFuentes: FuenteVista[] };

/**
 * Una sesión guardada, en el mismo espacio educativo que los temas: los bloques se reconstruyen desde los mensajes y se
 * puede continuar. Si la sesión pertenece a un tema, usa sus fuentes y sus migas; si no (una experiencia o un examen),
 * se muestra sin fuentes.
 */
export default async function SesionPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/tutor/${id}`);
  const r = await apiServidor<Detalle>(`/tutor-ia/conversaciones/${encodeURIComponent(id)}`);
  if (!r.datos) notFound();
  const s = r.datos;
  const tema = s.espacioId ? (await apiServidor<Espacio>(`/espacios/${encodeURIComponent(s.espacioId)}`)).datos : undefined;
  return (
    <EspacioEstudio
      migas={[{ texto: 'Aprendizaje', href: '/aprendizaje' }, ...(tema ? [{ texto: tema.titulo, href: `/espacios/${tema.id}?sesion=${s.id}` }] : [{ texto: 'Sesiones', href: '/tutor' }]), { texto: s.titulo }]}
      titulo={s.titulo}
      bloques={bloquesDeMensajes(s.listaMensajes)}
      tutor={{ superficie: 'TUTOR', conversacionId: s.id, expiraEn: s.expiraEn, ...(tema ? { espacioId: tema.id } : {}) }}
      {...(tema ? { fuentes: tema.listaFuentes } : {})}
    />
  );
}
