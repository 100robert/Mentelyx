import Link from 'next/link';

/**
 * Un universo de conocimientos: índice tipográfico agrupado (no una cuadrícula de tarjetas). La lista comunica amplitud;
 * no es cerrada ni promete modelos 3D o recursos especializados en todas las áreas.
 */
const GRUPOS = [
  { nombre: 'Ciencias exactas', areas: ['Matemáticas', 'Física', 'Química', 'Informática'], pregunta: '¿Por qué un algoritmo es más rápido que otro?' },
  { nombre: 'Vida y salud', areas: ['Biología', 'Medicina', 'Anatomía'], pregunta: '¿Cómo viaja un impulso nervioso?' },
  { nombre: 'Tierra y universo', areas: ['Astronomía', 'Geografía'], pregunta: '¿Por qué existen las estaciones del año?' },
  {
    nombre: 'Ingeniería y técnica',
    areas: ['Ingeniería', 'Arquitectura', 'Mecánica automotriz', 'Aeronáutica'],
    pregunta: '¿Cómo sostiene un puente su propio peso?',
  },
  { nombre: 'Sociedad y economía', areas: ['Economía', 'Finanzas', 'Historia', 'Ciencias sociales'], pregunta: '¿Para qué sirve un banco central?' },
  { nombre: 'Humanidades y artes', areas: ['Filosofía', 'Literatura', 'Lingüística', 'Arte', 'Música'], pregunta: '¿Por qué nos conmueve una melodía?' },
];

export function Universo() {
  return (
    <section className="seccion-editorial universo" aria-labelledby="titulo-universo">
      <div className="marco reticula">
        <header className="seccion-cabecera universo-cabecera">
          <h2 id="titulo-universo">Un universo de conocimientos</h2>
          <p className="texto-destacado">
            Ciencia, técnica, humanidades o arte: puedes empezar por cualquier tema. Las herramientas se adaptan a cada área y a lo que
            quieres lograr.
          </p>
        </header>
        <ul className="universo-grupos">
          {GRUPOS.map((g) => (
            <li key={g.nombre} className="universo-grupo">
              <h3 className="universo-nombre">{g.nombre}</h3>
              <ul className="universo-areas">
                {g.areas.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
              <p className="universo-pregunta">{g.pregunta}</p>
            </li>
          ))}
        </ul>
        <p className="universo-cierre">
          Y cualquier otra disciplina que despierte tu curiosidad.{' '}
          <span className="suave">Los modelos 3D y los recursos especializados dependen de cada tema y de los materiales disponibles.</span>
        </p>
        <p className="acciones universo-accion">
          <Link className="boton boton-primario boton-grande" href="/auth/registro?objetivo=aprendizaje">
            Empezar a aprender
          </Link>
        </p>
      </div>
    </section>
  );
}
