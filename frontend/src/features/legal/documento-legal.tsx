import type { ReactNode } from 'react';

/**
 * Documento legal o institucional. Describe las prácticas REALES del sistema en V1 (27/11/2026). Las secciones marcadas
 * como provisionales requieren revisión jurídica antes de abrir Mentelyx a usuarios reales: no se declara cumplimiento
 * normativo ni certificaciones que no se hayan verificado.
 */
export function DocumentoLegal({ titulo, actualizado, children }: { titulo: string; actualizado: string; children: ReactNode }) {
  return (
    <article className="contenedor pagina-publica documento-legal">
      <header className="pagina-cabecera">
        <h1>{titulo}</h1>
        <p className="suave">Última actualización: {actualizado}.</p>
        <p className="estudio-rotulo">
          Versión provisional para la demostración académica de Mentelyx V1. Debe revisarla un profesional del derecho antes de que la usen personas reales.
        </p>
      </header>
      {children}
    </article>
  );
}

export const Provisional = ({ children }: { children: ReactNode }) => (
  <p className="suave">
    <strong>Pendiente de revisión jurídica:</strong> {children}
  </p>
);
