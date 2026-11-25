import type { Metadata } from 'next';
import Link from 'next/link';
import { Icono } from '@/components/iconos';

export const metadata: Metadata = { title: 'Biblioteca pública' };
/** ISR (PR-INF-01): la página se regenera como máximo cada 5 minutos; solo contenido público entra en la caché. */
export const revalidate = 300;

/**
 * La biblioteca pública (publicar, valorar y retirar recursos) aún no está construida: la página muestra un estado vacío
 * honesto en lugar de recursos de ejemplo. `data-generada` conserva la marca de tiempo que verifica el ISR (humo-e2e).
 */
export default function Biblioteca() {
  const generada = new Date().toISOString();
  return (
    <div className="contenedor pagina-publica" data-generada={generada}>
      <header className="pagina-cabecera">
        <h1>Biblioteca pública</h1>
        <p className="suave">Recursos que docentes y estudiantes publican para que cualquiera los use en sus espacios.</p>
      </header>
      <div className="vacio">
        <Icono nombre="biblioteca" tamano={24} />
        <div>
          <p className="vacio-titulo">Todavía no hay recursos publicados.</p>
          <p className="suave">Aquí aparecerán ejercicios resueltos, diagramas y plantillas. Mientras tanto, puedes estudiar con tus propias fuentes.</p>
          <p>
            <Link href="/espacios" className="boton boton-secundario">
              Ir a mis espacios
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
