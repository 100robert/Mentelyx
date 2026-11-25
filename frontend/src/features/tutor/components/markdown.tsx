import { Fragment, type ReactNode } from 'react';

/**
 * Markdown mínimo y SEGURO para respuestas del Tutor: párrafos, listas con «- » y **negrita**. No interpreta HTML ni
 * usa dangerouslySetInnerHTML: todo el texto se inserta como texto. El motor visual completo llega en I-2/I-3.
 * Cada bloque (párrafo o elemento de lista) lleva `data-ancla` para resaltados, notas y selección por región en el cuaderno.
 * Con `alCitar`, cada marcador [N] que corresponde a una cita existente se vuelve un botón que fija el pasaje en el lienzo.
 */
type Opciones = {
  alCitar?: ((n: number) => void) | undefined;
  citas?: number[] | undefined;
  fijadas?: number[] | undefined;
};

function enLinea(texto: string, o: Opciones): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*|\[\d{1,2}\])/g).map((parte, i) => {
    if (parte.startsWith('**') && parte.endsWith('**')) return <strong key={i}>{parte.slice(2, -2)}</strong>;
    const cita = /^\[(\d{1,2})\]$/.exec(parte);
    if (cita && o.alCitar && o.citas?.includes(Number(cita[1]))) {
      const n = Number(cita[1]);
      const fijada = o.fijadas?.includes(n) ?? false;
      return (
        <button key={i} type="button" className="ref-cita" data-n={n} aria-pressed={fijada} onClick={() => o.alCitar?.(n)} aria-label={fijada ? `Quitar el pasaje de la cita ${n}` : `Ver el pasaje de la cita ${n}`}>
          {n}
        </button>
      );
    }
    return <Fragment key={i}>{parte}</Fragment>;
  });
}

export function Markdown({
  texto,
  alCitar,
  citas,
  fijadas,
  ancla,
  despues,
  seleccionados,
}: { texto: string; ancla?: string | undefined; despues?: ((ancla: string) => ReactNode) | undefined; seleccionados?: string[] | undefined } & Opciones) {
  const o = { alCitar, citas, fijadas };
  const bloques = texto.split(/\n{2,}/);
  let n = 0;
  const id = () => (ancla ? `${ancla}:${n++}` : undefined);
  return (
    <>
      {bloques.map((b, i) => {
        const lineas = b.split('\n');
        if (lineas.every((l) => l.startsWith('- '))) {
          return (
            <ul key={i}>
              {lineas.map((l, j) => {
                const a = id();
                return (
                  <li key={j}>
                    <span className="bloque-texto" data-ancla={a} data-seleccionado={(a && seleccionados?.includes(a)) || undefined}>
                      {enLinea(l.slice(2), o)}
                    </span>
                    {a && despues?.(a)}
                  </li>
                );
              })}
            </ul>
          );
        }
        const a = id();
        return (
          <Fragment key={i}>
            <p className="bloque-texto" data-ancla={a} data-seleccionado={(a && seleccionados?.includes(a)) || undefined}>
              {enLinea(b, o)}
            </p>
            {a && despues?.(a)}
          </Fragment>
        );
      })}
    </>
  );
}
