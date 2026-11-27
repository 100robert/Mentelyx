import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { InicioPersonal } from '@/features/inicio';
import type { Sesion, Tema } from '@/features/aprendizaje';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Inicio' };
/** SSR autenticado sin caché compartida: temas (espacios) y sesiones reales de la cuenta. */
export const dynamic = 'force-dynamic';

export default async function Inicio() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/inicio');
  const [temas, sesiones] = await Promise.all([apiServidor<Tema[]>('/espacios'), apiServidor<Sesion[]>('/tutor-ia/conversaciones')]);
  return <InicioPersonal temas={temas.datos ?? []} sesiones={sesiones.datos ?? []} />;
}
