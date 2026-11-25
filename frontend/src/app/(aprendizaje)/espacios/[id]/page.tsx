import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { PanelTutor, type FuenteVista, type MensajeVista } from '@/features/tutor';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Espacio' };
export const dynamic = 'force-dynamic';

type Detalle = { id: string; titulo: string; listaFuentes: FuenteVista[] };
type Conversacion = { id: string; espacioId: string | null; titulo: string; actualizadaEn: string; expiraEn: string };
type Mensajes = { listaMensajes: MensajeVista[] };
type Derechos = { recursos: Array<{ recurso: string; limite: number; disponibles: number }> };

/** Espacio de estudio: fuentes privadas a la izquierda, lienzo del Tutor al centro y conversación o cita a la derecha. */
export default async function EspacioPagina({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/espacios/${id}`);
  const espacio = await apiServidor<Detalle>(`/espacios/${encodeURIComponent(id)}`);
  if (espacio.estado === 404 || espacio.estado === 400 || !espacio.datos) notFound();
  // Recuperación: la conversación más reciente de este espacio se reabre con sus mensajes.
  const [conversaciones, derechos] = await Promise.all([apiServidor<Conversacion[]>('/tutor-ia/conversaciones'), apiServidor<Derechos>('/suscripciones/me/derechos')]);
  const ultima = conversaciones.datos?.filter((c) => c.espacioId === id).sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))[0];
  const detalle = ultima ? await apiServidor<Mensajes>(`/tutor-ia/conversaciones/${ultima.id}`) : undefined;
  const mensajes: MensajeVista[] = detalle?.datos?.listaMensajes ?? [];
  const general = derechos.datos?.recursos.find((r) => r.recurso === 'CONSULTA_GENERAL');
  const e = espacio.datos;

  return (
    <PanelTutor
      espacioId={e.id}
      titulo={e.titulo}
      fuentes={e.listaFuentes}
      mensajes={mensajes}
      {...(ultima ? { conversacionId: ultima.id, expiraEn: ultima.expiraEn } : {})}
      {...(general ? { disponibles: { recurso: general.recurso, cantidad: general.disponibles } } : {})}
    />
  );
}
