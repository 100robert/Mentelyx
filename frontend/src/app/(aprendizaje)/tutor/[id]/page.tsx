import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { Icono } from '@/components/ui/iconos';
import { PanelTutor, type MensajeVista } from '@/features/tutor';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Conversación' };
export const dynamic = 'force-dynamic';

type Detalle = { id: string; titulo: string; espacioId: string | null; expiraEn: string; listaMensajes: MensajeVista[] };

/** Recuperación de una conversación guardada en MongoDB; se puede continuar desde aquí. */
export default async function ConversacionPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/tutor/${id}`);
  const r = await apiServidor<Detalle>(`/tutor-ia/conversaciones/${encodeURIComponent(id)}`);
  if (!r.datos) notFound();
  return (
    <PanelTutor
      conversacionId={r.datos.id}
      mensajes={r.datos.listaMensajes}
      titulo={r.datos.titulo}
      expiraEn={r.datos.expiraEn}
      contexto={
        r.datos.espacioId ? (
          <Link href={`/espacios/${r.datos.espacioId}`} className="enlace-volver">
            <Icono nombre="espacios" tamano={16} />
            Ir al espacio
          </Link>
        ) : undefined
      }
      {...(r.datos.espacioId ? { espacioId: r.datos.espacioId } : {})}
    />
  );
}
