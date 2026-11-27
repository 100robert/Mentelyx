import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioAuth, IntroAcceso, IntroAccesoConIntencion } from '@/features/auth';

export const metadata: Metadata = { title: 'Crear cuenta', robots: { index: false } };

/** Página estática; el formulario (CSR) lee la intención de entrada de la URL. */
export default function Pagina() {
  return (
    <Suspense fallback={<IntroAcceso modo="registro" objetivo={null} />}>
      <IntroAccesoConIntencion modo="registro" />
      <FormularioAuth modo="registro" />
    </Suspense>
  );
}
