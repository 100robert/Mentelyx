import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { NuevaPreparacion } from '@/features/examenes';
import { sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Nueva preparación' };
export const dynamic = 'force-dynamic';

export default async function NuevaPreparacionPagina() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/examenes/nueva');
  return (
    <div className="pagina pagina-modulo">
      <header className="pagina-cabecera">
        <nav aria-label="Migas de pan" className="estudio-migas">
          <ol>
            <li>
              <Link href="/examenes">Exámenes</Link>
            </li>
            <li>
              <span aria-current="page">Nueva preparación</span>
            </li>
          </ol>
        </nav>
        <h1>Nueva preparación</h1>
        <p className="suave">Cuéntanos qué examen se acerca. Solo hacen falta la asignatura y un tema; lo demás puedes completarlo después. No necesitas subir documentos.</p>
      </header>
      <NuevaPreparacion />
    </div>
  );
}
