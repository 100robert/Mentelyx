import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { EstudioTemaExamen } from '@/features/examenes';
import { cargarPreparacionServidor } from '@/features/examenes/servidor';
import { sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Estudiar un tema' };
export const dynamic = 'force-dynamic';

export default async function EstudiarTemaPagina({ params, searchParams }: { params: Promise<{ id: string; tema: string }>; searchParams: Promise<{ intencion?: string; previos?: string }> }) {
  const { id, tema } = await params;
  const sp = await searchParams;
  if (!(await sesionActual())) redirect(`/auth/ingresar?siguiente=/examenes/${encodeURIComponent(id)}`);
  const p = await cargarPreparacionServidor(id);
  if (!p || !p.temas.some((t) => t.codigo === tema)) notFound();
  return <EstudioTemaExamen p={p} temaCodigo={tema} {...(sp.intencion ? { intencion: sp.intencion } : {})} {...(sp.previos ? { previos: sp.previos } : {})} />;
}
