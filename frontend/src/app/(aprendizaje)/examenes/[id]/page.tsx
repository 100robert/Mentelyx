import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { EspacioPreparacion } from '@/features/examenes';
import { cargarPreparacionServidor } from '@/features/examenes/servidor';
import { sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Preparación' };
export const dynamic = 'force-dynamic';

export default async function PreparacionPagina({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ seccion?: string; creada?: string; previos?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/examenes/${encodeURIComponent(id)}`);
  const p = await cargarPreparacionServidor(id);
  if (!p) notFound();
  return <EspacioPreparacion key={p.id} inicial={p} {...(sp.seccion ? { seccionInicial: sp.seccion } : {})} creada={sp.creada === '1'} {...(sp.previos ? { previos: sp.previos } : {})} />;
}
