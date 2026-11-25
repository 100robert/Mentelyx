import Link from 'next/link';
import { CabeceraPublica, PiePublico } from '@/features/navegacion';

export default function NoEncontrado() {
  return (
    <div className="sitio">
      <CabeceraPublica />
      <main id="principal" tabIndex={-1} className="contenedor estado-pagina">
        <h1>No encontrado</h1>
        <p className="suave">La página no existe o no tienes acceso a ella.</p>
        <p className="acciones">
          <Link className="boton boton-primario" href="/">
            Volver al inicio
          </Link>
          <Link className="boton boton-secundario" href="/espacios">
            Ir a mis espacios
          </Link>
        </p>
      </main>
      <PiePublico />
    </div>
  );
}
