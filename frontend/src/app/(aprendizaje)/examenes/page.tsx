import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ModuloExamenes } from '@/features/examenes';
import { sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Exámenes' };
export const dynamic = 'force-dynamic';

export default async function Examenes({ searchParams }: { searchParams: Promise<{ nueva?: string }> }) {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/examenes');
  // Intención «examen» desde la landing o el inicio: directo a crear la preparación.
  if ((await searchParams).nueva === '1') redirect('/examenes/nueva');
  return <ModuloExamenes />;
}
