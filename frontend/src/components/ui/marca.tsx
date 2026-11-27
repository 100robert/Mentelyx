import Link from 'next/link';

/**
 * Identidad de Mentelyx con los logotipos oficiales (originales en `marca/`; derivados recortados y redimensionados, sin
 * recolorear, en `public/marca/`). El búho se muestra sobre una placa blanca: sus partes azul marino se perderían sobre el
 * campo azul de la barra lateral o en modo oscuro. El nombre acompaña al símbolo en la navegación.
 */
export function Marca({ href = '/', tono = 'tinta', compacta = false }: { href?: string; tono?: 'tinta' | 'campo'; compacta?: boolean }) {
  return (
    <Link href={href} className={`marca marca-${tono}${compacta ? ' marca-compacta' : ''}`} aria-label="Mentelyx, inicio">
      <span className="marca-simbolo">
        <img src="/marca/mentelyx-buho-64.webp" width={64} height={64} alt="" />
      </span>
      {!compacta && (
        <span className="marca-texto" aria-hidden="true">
          Mentelyx
        </span>
      )}
    </Link>
  );
}

/** Logotipo completo (búho y nombre) para los momentos de marca: acceso y registro. */
export function LogoCompleto({ tamano = 120 }: { tamano?: number }) {
  return (
    <span className="logo-completo" style={{ inlineSize: tamano }}>
      <img src="/marca/mentelyx-logo-completo-256.webp" width={256} height={256} alt="Mentelyx" />
    </span>
  );
}
