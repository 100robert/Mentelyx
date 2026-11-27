import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ModuloAprendizaje, type Sesion, type Tema } from '@/features/aprendizaje';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Aprendizaje' };
export const dynamic = 'force-dynamic';

export default async function Aprendizaje() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/aprendizaje');
  const [temas, sesiones] = await Promise.all([apiServidor<Tema[]>('/espacios'), apiServidor<Sesion[]>('/tutor-ia/conversaciones')]);
  const ordenadas = [...(sesiones.datos ?? [])].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
  return <ModuloAprendizaje temas={temas.datos ?? []} sesiones={ordenadas} errorTemas={Boolean(temas.error && !temas.datos)} />;
}
