import type { Metadata } from 'next';
import { Suspense } from 'react';
import { FormularioAuth } from '@/components/formulario-auth';

export const metadata: Metadata = { title: 'Crear cuenta' };

export default function Registro() {
  return (
    <div className="acceso-tarea">
      <h1>Crear cuenta</h1>
      <p className="suave">Comienza gratis y transforma tu manera de estudiar.</p>
      <Suspense>
        <FormularioAuth modo="registro" />
      </Suspense>
    </div>
  );
}
