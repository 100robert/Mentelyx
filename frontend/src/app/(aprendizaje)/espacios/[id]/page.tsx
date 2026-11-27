import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { bloquesDeMensajes } from '@/features/bloques';
import { EspacioEstudio } from '@/features/estudio';
import type { FuenteVista, MensajeVista } from '@/features/tutor';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Tema' };
export const dynamic = 'force-dynamic';

type Detalle = { id: string; titulo: string; listaFuentes: FuenteVista[] };
type Conversacion = { id: string; espacioId: string | null; titulo: string; actualizadaEn: string; expiraEn: string };
type Mensajes = { listaMensajes: MensajeVista[] };
type Derechos = { recursos: Array<{ recurso: string; limite: number; disponibles: number }> };
type Parametros = { sesion?: string | string[]; nueva?: string | string[]; pregunta?: string | string[] };

/**
 * Un tema (espacio de M2) como espacio educativo. La sesión es una conversación real del Tutor con identidad estable en la
 * URL (`?sesion=`); sin ella se abre la más reciente, y `?nueva=1` empieza otra. Los bloques se reconstruyen desde los
 * mensajes guardados: la continuidad no depende del navegador. Las fuentes son opcionales.
 */
export default async function TemaPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Parametros> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/espacios/${id}`);
  const espacio = await apiServidor<Detalle>(`/espacios/${encodeURIComponent(id)}`);
  if (espacio.estado === 404 || espacio.estado === 400 || !espacio.datos) notFound();
  const [conversaciones, derechos] = await Promise.all([apiServidor<Conversacion[]>('/tutor-ia/conversaciones'), apiServidor<Derechos>('/suscripciones/me/derechos')]);
  const delTema = (conversaciones.datos ?? []).filter((c) => c.espacioId === id).sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
  const pedida = typeof sp.sesion === 'string' ? delTema.find((c) => c.id === sp.sesion) : undefined;
  const actual = sp.nueva === '1' ? undefined : (pedida ?? delTema[0]);
  const detalle = actual ? await apiServidor<Mensajes>(`/tutor-ia/conversaciones/${encodeURIComponent(actual.id)}`) : undefined;
  const bloques = bloquesDeMensajes(detalle?.datos?.listaMensajes ?? []);
  const general = derechos.datos?.recursos.find((r) => r.recurso === 'CONSULTA_GENERAL');
  const pregunta = typeof sp.pregunta === 'string' ? sp.pregunta.slice(0, 600) : undefined;
  const e = espacio.datos;

  return (
    <EspacioEstudio
      key={actual?.id ?? 'nueva'}
      migas={[{ texto: 'Aprendizaje', href: '/aprendizaje' }, { texto: 'Temas', href: '/espacios' }, { texto: e.titulo }]}
      titulo={e.titulo}
      bloques={bloques}
      tutor={{
        superficie: 'TUTOR',
        espacioId: e.id,
        ...(actual ? { conversacionId: actual.id, expiraEn: actual.expiraEn } : {}),
        ...(general ? { disponibles: { recurso: general.recurso, cantidad: general.disponibles } } : {}),
        ...(pregunta ? { preguntaInicial: pregunta } : {}),
      }}
      sesiones={{ lista: delTema.map((c) => ({ id: c.id, titulo: c.titulo, actualizadaEn: c.actualizadaEn })), ...(actual ? { actual: actual.id } : {}), nueva: `/espacios/${e.id}?nueva=1` }}
      fuentes={e.listaFuentes}
    />
  );
}
