import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { EXPERIENCIAS_DISPONIBLES } from '@/features/experiencias';
import { sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Experiencias de aprendizaje' };
export const dynamic = 'force-dynamic';

/** Experiencias con contenido preparado (rotulado como ejemplo) para explorar el espacio de estudio con el Tutor real. */
export default async function Experiencias() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/aprendizaje');
  return (
    <div className="pagina pagina-modulo">
      <header className="pagina-cabecera">
        <h1>Experiencias</h1>
        <p className="suave">
          Contenido preparado por Mentelyx para ver cómo se estudia aquí: pizarra, modelos 3D, obras y documentos. Son ejemplos ilustrativos; el Tutor que las acompaña es el real.
        </p>
      </header>
      <ul className="experiencias-lista">
        {EXPERIENCIAS_DISPONIBLES.map((e) => (
          <li key={e.clave}>
            <Link href={`/aprendizaje/experiencias/${e.clave}`} className="experiencia-tarjeta">
              <span className="experiencia-disciplina">{e.disciplina}</span>
              <span className="experiencia-titulo">{e.titulo}</span>
              <span className="experiencia-texto">{e.descripcion}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
