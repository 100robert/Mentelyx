import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { EXPERIENCIAS_DISPONIBLES, ExperienciaVista } from '@/features/experiencias';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const dynamic = 'force-dynamic';
type Derechos = { recursos: Array<{ recurso: string; limite: number; disponibles: number }> };

export async function generateMetadata({ params }: { params: Promise<{ clave: string }> }): Promise<Metadata> {
  const { clave } = await params;
  return { title: EXPERIENCIAS_DISPONIBLES.find((e) => e.clave === clave)?.titulo ?? 'Experiencia' };
}

export default async function ExperienciaPagina({ params }: { params: Promise<{ clave: string }> }) {
  const { clave } = await params;
  if (!EXPERIENCIAS_DISPONIBLES.some((e) => e.clave === clave)) notFound();
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/aprendizaje/experiencias/${clave}`);
  const derechos = await apiServidor<Derechos>('/suscripciones/me/derechos');
  const general = derechos.datos?.recursos.find((r) => r.recurso === 'CONSULTA_GENERAL');
  return <ExperienciaVista clave={clave} {...(general ? { disponibles: { recurso: general.recurso, cantidad: general.disponibles } } : {})} />;
}
