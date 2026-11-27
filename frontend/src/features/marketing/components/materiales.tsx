import type { ReactNode } from 'react';

/**
 * Aprender con o sin materiales propios. Las fuentes son opcionales; cuando existen, el original sigue a la vista con su
 * página. La leyenda distingue cuatro procedencias con forma y texto (no solo con color); lo generado por IA nunca es una cita.
 */
const PROCEDENCIAS: Array<{ clave: string; titulo: string; texto: string; marca: ReactNode }> = [
  {
    clave: 'propia',
    titulo: 'Tus fuentes',
    texto: 'Los documentos que agregas. Son privados: solo tú puedes verlos.',
    marca: <path d="M5 2.5h6.5L15 6v11.5H5zM11.5 2.5V6H15" />,
  },
  {
    clave: 'biblioteca',
    titulo: 'Recursos de Mentelyx',
    texto: 'Pizarras, modelos y documentos preparados por Mentelyx, con su autor y su licencia.',
    marca: <path d="M4 3.5v13M8 3.5v13M11.5 4.2l3.6 12.1M3 16.5h14" />,
  },
  {
    clave: 'externa',
    titulo: 'Obras de dominio público',
    texto: 'Imágenes de museos con licencia abierta, con su crédito y el enlace a su origen.',
    marca: <path d="M10 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zM3 10h14M10 3c2 2.2 2.8 4.5 2.8 7s-.8 4.8-2.8 7c-2-2.2-2.8-4.5-2.8-7S8 5.2 10 3z" />,
  },
  {
    clave: 'ia',
    titulo: 'Explicación del Tutor',
    texto: 'Contenido generado por IA. Se identifica como tal y nunca se presenta como una cita.',
    marca: <path d="M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z" />,
  },
];

export function Materiales() {
  return (
    <section className="seccion-editorial seccion-pozo-editorial materiales" aria-labelledby="titulo-materiales">
      <div className="marco reticula">
        <header className="seccion-cabecera materiales-cabecera">
          <h2 id="titulo-materiales">Con tus materiales o sin ellos</h2>
          <p className="texto-destacado">
            No necesitas subir nada para empezar. Si tienes apuntes o el temario de tu curso, Mentelyx estudia contigo a partir de
            ellos.
          </p>
        </header>

        <article className="escenario escenario-cero" aria-labelledby="titulo-desde-cero">
          <h3 id="titulo-desde-cero">Desde cero</h3>
          <p>Cuéntale a Mentelyx qué quieres entender. Identifica el tema y tu punto de partida, y arma la explicación con los recursos disponibles.</p>
          <div className="peticion">
            <p className="peticion-texto">No sé nada de astronomía y quiero entender los agujeros negros.</p>
            <dl className="peticion-lectura">
              <div>
                <dt>Tema</dt>
                <dd>Agujeros negros</dd>
              </div>
              <div>
                <dt>Punto de partida</dt>
                <dd>Sin conocimientos previos</dd>
              </div>
              <div>
                <dt>Primer paso</dt>
                <dd>Qué es la gravedad y por qué la luz puede quedar atrapada</dd>
              </div>
              <div>
                <dt>Recursos</dt>
                <dd>Explicaciones del Tutor y, cuando ayudan, pizarras y modelos</dd>
              </div>
            </dl>
            <p className="peticion-nota">Puedes corregir cualquiera de estos datos cuando quieras.</p>
          </div>
        </article>

        <article className="escenario escenario-propios" aria-labelledby="titulo-con-materiales">
          <h3 id="titulo-con-materiales">Con tus materiales</h3>
          <p>Tus apuntes, guías o el temario de tu curso, en texto. Cada cita del Tutor abre, junto a la explicación, el pasaje exacto que usó.</p>
          <div className="documento" aria-hidden="true">
            <div className="documento-hoja">
              <p className="documento-titulo">Física II, unidad 3</p>
              <span className="documento-linea" />
              <span className="documento-linea" />
              <span className="documento-linea documento-linea-corta" />
              <p className="documento-pasaje">La fuerza gravitatoria es inversamente proporcional al cuadrado de la distancia.</p>
              <span className="documento-linea" />
              <span className="documento-linea documento-linea-corta" />
              <p className="documento-pagina">12</p>
            </div>
            <div className="documento-cita">
              <span className="documento-cita-marca">Cita 1</span>
              <p>Por eso, a la mitad de la distancia, la atracción es cuatro veces mayor.</p>
            </div>
          </div>
        </article>

        <div className="procedencias">
          <h3 className="procedencias-titulo">Siempre sabes de dónde viene cada explicación</h3>
          <ul>
            {PROCEDENCIAS.map((p) => (
              <li key={p.clave} className={`procedencia procedencia-${p.clave}`}>
                <svg viewBox="0 0 20 20" width="22" height="22" aria-hidden="true" className="procedencia-marca">
                  {p.marca}
                </svg>
                <span className="procedencia-titulo">{p.titulo}</span>
                <span className="procedencia-texto">{p.texto}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
