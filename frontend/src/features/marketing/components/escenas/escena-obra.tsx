import type { CSSProperties } from 'react';

/**
 * Lectura de una obra: «Bajo la ola en alta mar frente a Kanagawa» (La gran ola), Katsushika Hokusai, c. 1830–1832.
 * Imagen de The Metropolitan Museum of Art (JP1847), dominio público, Open Access CC0; los colores de la obra no se alteran.
 * Tres observaciones de composición aparecen con el avance (`--p`, solo CSS): el arco de la ola, el Fuji y las barcas.
 * Coordenadas en el sistema de la imagen original (1400 × 941). La figura es decorativa para el lector de pantalla: la
 * descripción de la obra va en el texto del paso que la acompaña.
 */
const OBSERVACIONES = [
  { clase: 'obra-nota-ola', texto: 'La ola forma un arco que encierra la escena' },
  { clase: 'obra-nota-fuji', texto: 'El Fuji, pequeño e inmóvil, queda en el centro' },
  { clase: 'obra-nota-barcas', texto: 'Las barcas dan la escala de la fuerza del mar' },
];

export function EscenaObra() {
  return (
    <div className="escena escena-obra">
      <div className="obra-marco">
        <img
          src="/recursos/obras/hokusai-gran-ola-1400.webp"
          srcSet="/recursos/obras/hokusai-gran-ola-760.webp 760w, /recursos/obras/hokusai-gran-ola-1400.webp 1400w"
          sizes="(min-width: 64rem) 40vw, 92vw"
          width={1400}
          height={941}
          loading="lazy"
          decoding="async"
          alt=""
        />
        <svg viewBox="0 0 1400 941" aria-hidden="true">
          <path d="M28 553C110 276 332 110 553 96C700 92 810 221 820 387" pathLength={1} className="obra-trazo" style={{ '--umbral': 0 } as CSSProperties} />
          <circle cx="893" cy="632" r="98" pathLength={1} className="obra-trazo" style={{ '--umbral': 0.33 } as CSSProperties} />
          <g className="obra-trazo-grupo" style={{ '--umbral': 0.66 } as CSSProperties}>
            <circle cx="205" cy="590" r="58" pathLength={1} className="obra-trazo" />
            <circle cx="812" cy="820" r="58" pathLength={1} className="obra-trazo" />
            <circle cx="1105" cy="600" r="58" pathLength={1} className="obra-trazo" />
          </g>
        </svg>
        {OBSERVACIONES.map((o, k) => (
          <p key={o.clase} className={`obra-nota ${o.clase}`} style={{ '--umbral': k / 3 } as CSSProperties} aria-hidden="true">
            {o.texto}
          </p>
        ))}
      </div>
    </div>
  );
}
