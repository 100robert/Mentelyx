'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useRecorrido } from '../hooks/use-recorrido';

const PASOS = [
  { titulo: 'Dinos qué quieres entender', texto: 'Con tus palabras: una duda puntual, un tema completo o un examen que se acerca.' },
  {
    titulo: 'Mentelyx prepara tu experiencia',
    texto: 'Elige cómo explicarlo según el tema y tu punto de partida: pizarra, modelos, lecturas o ejercicios.',
  },
  { titulo: 'Explora, practica y continúa', texto: 'Tus sesiones quedan guardadas: retoma cuando quieras, justo donde lo dejaste.' },
];

const DUDAS = [
  { p: '¿Necesito ser estudiante?', r: 'No. Mentelyx es para cualquier persona con ganas de entender algo, estudie o no en una institución.' },
  { p: '¿Tengo que subir documentos?', r: 'No. Puedes empezar solo con tu pregunta. Tus materiales son opcionales y sirven para estudiar con tu propio curso.' },
  { p: '¿Debo saber algo del tema?', r: 'No. Indica desde dónde partes y la explicación empieza ahí, con el rigor que el tema merece.' },
];

/** Cómo funciona: tres pasos (una secuencia real) con una línea que avanza con el desplazamiento, y las dudas de quien llega. */
export function ComoFunciona() {
  const raiz = useRef<HTMLDivElement>(null);
  useRecorrido(raiz, { linea: 0.75, lineaMovil: 0.8 });

  return (
    <section id="como-funciona" className="seccion-editorial seccion-pozo-editorial como-funciona" aria-labelledby="titulo-como">
      <div className="marco reticula">
        <header className="seccion-cabecera como-cabecera">
          <h2 id="titulo-como">Cómo funciona Mentelyx</h2>
        </header>
        <div ref={raiz} className="recorrido como-recorrido">
          <span className="como-linea" aria-hidden="true" />
          <ol className="como-pasos">
            {PASOS.map((p, i) => (
              <li key={p.titulo} data-paso>
                <span className="como-numero" aria-hidden="true">
                  {i + 1}
                </span>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
        <div className="dudas">
          <h3 className="dudas-titulo">Lo que suelen preguntarnos</h3>
          <dl>
            {DUDAS.map((d) => (
              <div key={d.p}>
                <dt>{d.p}</dt>
                <dd>{d.r}</dd>
              </div>
            ))}
            <div>
              <dt>¿Cuánto cuesta?</dt>
              <dd>
                Puedes empezar con el plan Gratuito. Los planes de pago amplían la capacidad. <Link href="/planes">Ver los planes</Link>
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </section>
  );
}
