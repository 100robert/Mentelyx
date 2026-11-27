import katex from 'katex';

/**
 * Fórmula matemática renderizada con KaTeX en el servidor (la landing es estática: se genera en el build).
 * Salida HTML para la vista y MathML para lectores de pantalla; KaTeX no llega al JavaScript del navegador.
 * Solo recibe expresiones escritas en el código de Mentelyx, nunca contenido generado por el Tutor ni por usuarios.
 * Debe usarse únicamente desde componentes de servidor: los componentes de cliente la reciben ya renderizada como prop.
 */
export function Formula({ tex, bloque = false, className }: { tex: string; bloque?: boolean; className?: string }) {
  const html = katex.renderToString(tex, { displayMode: bloque, output: 'htmlAndMathml', throwOnError: true, strict: 'error' });
  const Etiqueta = bloque ? 'div' : 'span';
  return <Etiqueta className={className ? `formula ${className}` : 'formula'} dangerouslySetInnerHTML={{ __html: html }} />;
}
