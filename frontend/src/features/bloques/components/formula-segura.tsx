'use client';

import { useEffect, useRef, useState } from 'react';
import type KatexModulo from 'katex';

type Katex = typeof KatexModulo;
let cargaKatex: Promise<Katex> | null = null;
let cargaQuimica: Promise<unknown> | null = null;
const katex = () => (cargaKatex ??= import('katex').then((m) => m.default));
// mhchem registra la macro \ce en KaTeX (química: fórmulas y ecuaciones). Se descarga solo si un bloque la necesita.
const quimica = () => (cargaQuimica ??= katex().then(() => import('katex/contrib/mhchem')));

/**
 * Fórmula con KaTeX en el navegador, para contenido que no se conoce en el build (bloques del Tutor o del recorrido).
 * Opciones de la validación semántica del motor visual (sección 7): `trust: false` (sin \href, \url, \html…),
 * `maxExpand: 1000`, `maxSize: 10` y errores explícitos. `katex.render` construye nodos del DOM, no HTML en texto, y el
 * contenido nunca se inserta como HTML. Si el LaTeX no es válido se muestra su texto y el aviso, sin romper el bloque.
 */
export function FormulaSegura({ latex, bloque = false, quimica: conQuimica = false, lectura }: { latex: string; bloque?: boolean; quimica?: boolean; lectura?: string | undefined }) {
  const nodo = useRef<HTMLSpanElement>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let vivo = true;
    // React no gestiona el contenido de este nodo: lo escribe KaTeX (o el texto del LaTeX mientras carga o si falla).
    if (nodo.current) nodo.current.textContent = latex;
    void (conQuimica ? quimica().then(katex) : katex())
      .then((k) => {
        if (!vivo || !nodo.current) return;
        try {
          k.render(latex, nodo.current, { displayMode: bloque, output: 'htmlAndMathml', throwOnError: true, trust: false, strict: 'ignore', maxExpand: 1000, maxSize: 10 });
          setError(false);
        } catch {
          nodo.current.textContent = latex;
          setError(true);
        }
      })
      .catch(() => vivo && setError(true));
    return () => {
      vivo = false;
    };
  }, [latex, bloque, conQuimica]);
  const Etiqueta = bloque ? 'div' : 'span';
  return (
    <Etiqueta className={bloque ? 'formula formula-bloque' : 'formula'} data-error={error || undefined}>
      <span ref={nodo} aria-hidden={lectura ? true : undefined} />
      {lectura && <span className="visually-hidden">{lectura}</span>}
      {error && <span className="formula-aviso">No pudimos dibujar esta fórmula; se muestra tal como llegó.</span>}
    </Etiqueta>
  );
}
