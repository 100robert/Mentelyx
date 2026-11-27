'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { useRecorrido } from '../hooks/use-recorrido';

const RECORRIDO = [
  { titulo: 'Define tu examen', texto: 'La asignatura, los temas y, si la tienes, la fecha. No necesitas documentos.', zona: 'temario' },
  { titulo: 'Suma tus materiales, si quieres', texto: 'Tus apuntes y guías en texto: el Tutor los cita cuando responde.', zona: 'fuentes' },
  { titulo: 'Ten un plan por tema', texto: 'Una actividad para estudiar y otra para practicar cada tema, repartidas hasta la fecha.', zona: 'diagnostico' },
  { titulo: 'Aprende los contenidos', texto: 'Estudio guiado con el Tutor, tema por tema, con la pizarra y los modelos cuando el tema lo pide.', zona: 'plan' },
  { titulo: 'Practica con el Tutor', texto: 'Pídele ejercicios del tema y resuélvelos a tu ritmo.', zona: 'practica' },
  { titulo: 'Mide tu avance', texto: 'Cada actividad del plan que completas queda registrada.', zona: 'simulacro' },
  { titulo: 'Pregunta cuando te trabes', texto: 'El Tutor explica tu error paso a paso y cita tus apuntes cuando los usa.', zona: 'retro' },
  { titulo: 'Sigue con lo pendiente', texto: 'Mentelyx te muestra la siguiente actividad y los temas que aún no empiezas.', zona: 'siguiente' },
];

const TEMAS = [
  { nombre: 'Atributos de calidad', estimacion: 'Estudiado', nivel: 3 },
  { nombre: 'Estilos arquitectónicos', estimacion: 'En curso', nivel: 2 },
  { nombre: 'Patrones de diseño', estimacion: 'En curso', nivel: 2 },
  { nombre: 'Modelo C4', estimacion: 'Sin empezar', nivel: 0 },
  { nombre: 'Decisiones arquitectónicas', estimacion: 'Sin empezar', nivel: 0 },
];

/**
 * Preparación de exámenes: el recorrido de quien estudia (8 pasos) junto a una preparación de ejemplo. Al avanzar, el paso
 * activo señala su zona. Solo se describe lo que el producto hace hoy (plan por temas, estudio y ejercicios con el Tutor,
 * seguimiento de actividades); los datos son un ejemplo ilustrativo y así se rotulan.
 */
export function Examenes() {
  const raiz = useRef<HTMLDivElement>(null);
  const { activo } = useRecorrido(raiz, { linea: 0.55, lineaMovil: 0.7 });
  const zona = RECORRIDO[activo]?.zona ?? 'temario';

  return (
    <section id="examenes" className="seccion-editorial examenes" aria-labelledby="titulo-examenes">
      <div className="marco reticula">
        <header className="seccion-cabecera examenes-cabecera">
          <h2 id="titulo-examenes">No estudies únicamente para responder. Estudia para comprender.</h2>
          <p className="texto-destacado">
            Crea una preparación para tu examen: Mentelyx organiza tu plan por temas y te acompaña con el Tutor hasta que lo entiendas
            de verdad.
          </p>
          <p className="acciones">
            <Link className="boton boton-primario boton-grande" href="/auth/registro?objetivo=examen">
              Preparar mi examen
            </Link>
          </p>
        </header>
      </div>
      <div ref={raiz} className="marco reticula recorrido examenes-recorrido" data-activo="0">
        <ol className="examenes-pasos">
          {RECORRIDO.map((r, i) => (
            <li key={r.titulo} data-paso className="examen-paso" data-activo={i === 0 || undefined}>
              <span className="examen-paso-numero" aria-hidden="true">
                {i + 1}
              </span>
              <h3>{r.titulo}</h3>
              <p>{r.texto}</p>
            </li>
          ))}
        </ol>
        <div className="examenes-columna">
          <figure className="espacio-examen" data-zona-activa={zona} aria-labelledby="pie-espacio-examen">
            <div className="ee-cabecera" data-zona="temario">
              <p className="ee-asignatura">Arquitectura de Software</p>
              <p className="ee-examen">
                Examen parcial <span className="ee-fecha">10 de diciembre</span>
              </p>
              <span className="ee-ejemplo">Ejemplo ilustrativo</span>
            </div>
            <div className="ee-cuerpo">
              <div className="ee-columna">
                <section className="ee-bloque" data-zona="temario" aria-label="Temario">
                  <p className="ee-titulo">Temario</p>
                  <ul className="ee-temas">
                    {TEMAS.map((t) => (
                      <li key={t.nombre}>
                        <span className="ee-tema">{t.nombre}</span>
                        <span className="ee-estimacion" data-zona="diagnostico" data-nivel={t.nivel}>
                          <span className="ee-nivel" aria-hidden="true">
                            <i />
                            <i />
                            <i />
                          </span>
                          {t.estimacion}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="ee-nota" data-zona="diagnostico">
                    Estado según las actividades del plan que completaste.
                  </p>
                </section>
                <section className="ee-bloque" data-zona="fuentes" aria-label="Fuentes">
                  <p className="ee-titulo">Fuentes</p>
                  <ul className="ee-fuentes">
                    <li>Sílabo del curso</li>
                    <li>Apuntes de clase</li>
                  </ul>
                </section>
              </div>
              <div className="ee-columna">
                <section className="ee-bloque" data-zona="plan" aria-label="Plan de estudio">
                  <p className="ee-titulo">Plan de esta semana</p>
                  <ol className="ee-plan">
                    <li>
                      <span>Lun</span> Estudiar: estilos arquitectónicos
                    </li>
                    <li>
                      <span>Mié</span> Practicar: estilos arquitectónicos
                    </li>
                    <li>
                      <span>Vie</span> Estudiar: patrones de diseño
                    </li>
                  </ol>
                </section>
                <section className="ee-bloque ee-practica" data-zona="practica" aria-label="Ejercicio con el Tutor">
                  <p className="ee-titulo">Ejercicio del Tutor</p>
                  <p className="ee-pregunta">¿Qué atributo de calidad prioriza un sistema que debe seguir atendiendo cuando falla uno de sus servidores?</p>
                  <div className="ee-retro" data-zona="retro">
                    <p>
                      <span className="ee-clave">Tu respuesta</span>Rendimiento
                    </p>
                    <p className="ee-explicacion">
                      <span className="ee-clave">Tutor</span>No exactamente: el rendimiento mide qué tan rápido responde el sistema; la disponibilidad, que siga en
                      servicio cuando algo falla.
                    </p>
                    <p className="ee-fuente">Según tus apuntes de clase</p>
                  </div>
                </section>
                <section className="ee-bloque ee-simulacro" data-zona="simulacro" aria-label="Seguimiento">
                  <p className="ee-titulo">Seguimiento</p>
                  <p>4 de 10 actividades del plan hechas</p>
                </section>
                <section className="ee-bloque ee-siguiente" data-zona="siguiente" aria-label="Siguiente actividad">
                  <p className="ee-titulo">Siguiente actividad</p>
                  <p>Practicar: estilos arquitectónicos</p>
                </section>
              </div>
            </div>
            <figcaption id="pie-espacio-examen" className="ee-pie">
              Ejemplo ilustrativo de una preparación. El estado de cada tema sale de las actividades completadas; no es una calificación.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
