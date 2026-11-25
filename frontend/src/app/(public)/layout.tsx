import { CabeceraPublica, PiePublico } from '@/features/navegacion';

/** Marco de las páginas públicas (SSG/ISR): cabecera, contenido y pie. */
export default function PublicoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="sitio">
      <CabeceraPublica />
      <main id="principal" tabIndex={-1}>
        {children}
      </main>
      <PiePublico />
    </div>
  );
}
