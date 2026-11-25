import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioAuth } from '@/components/formulario-auth';

export const metadata: Metadata = { title: 'Ingresar' };

/** CSR: el formulario se ejecuta en el navegador; la página en sí es estática. */
export default function Ingresar() {
  return (
    <div className="acceso-tarea">
      <h1>Ingresar</h1>
      <p className="suave">Qué bueno verte de nuevo. Tu estudio te espera donde lo dejaste.</p>
      <Suspense>
        <FormularioAuth modo="ingresar" />
      </Suspense>
    </div>
  );
}
