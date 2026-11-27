import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioAuth, IntroAcceso, IntroAccesoConIntencion } from '@/features/auth';

export const metadata: Metadata = { title: 'Iniciar sesión', robots: { index: false } };

/** Página estática; el formulario (CSR) lee la intención de entrada de la URL. */
export default function Pagina() {
  return (
    <Suspense fallback={<IntroAcceso modo="ingresar" objetivo={null} />}>
      <IntroAccesoConIntencion modo="ingresar" />
      <FormularioAuth modo="ingresar" />
    </Suspense>
  );
}
