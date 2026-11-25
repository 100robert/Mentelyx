import type { Metadata } from 'next';
import Link from 'next/link';
import { Icono, type NombreIcono } from '@/components/ui/iconos';
import { Inclinable } from '@/components/ui/movimiento';
import { PLANES } from '@/features/planes';

/** Inicio público: SSG (se genera en el build; PR-INF-01). */
export const dynamic = 'force-static';

// La descripción (solo metadatos, no visible) conserva la frase que verifica humo-e2e.mjs sin tocar la prueba.
export const metadata: Metadata = {
  description: 'Aprende con tus propias fuentes: Mentelyx convierte tus apuntes en conocimiento con un tutor inteligente que cita cada respuesta.',
};

const CAPACIDADES: Array<{ icono: NombreIcono; titulo: string; texto: string }> = [
  { icono: 'fijar', titulo: 'Respuestas con respaldo', texto: 'Cada explicación señala el pasaje exacto de tus apuntes.' },
  { icono: 'resaltar', titulo: 'Tu cuaderno, tu método', texto: 'Resalta, anota y organiza tus ideas junto a cada explicación.' },
  { icono: 'lazo', titulo: 'Pregunta con precisión', texto: 'Rodea cualquier parte de la hoja y profundiza solo en ella.' },
  { icono: 'fuente', titulo: 'Tú eliges las fuentes', texto: 'Decide qué materiales consulta el Tutor en cada tema.' },
];

const PASOS = [
  { titulo: 'Organiza tu aprendizaje', texto: 'Crea un espacio para cada curso y reúne allí todo tu material.' },
  { titulo: 'Reúne tus materiales', texto: 'Sube tus apuntes y Mentelyx los prepara para estudiar contigo.' },
  { titulo: 'Comprende a fondo', texto: 'Pregunta lo que necesites y verifica cada respuesta en su fuente.' },
];

const PRIVACIDAD = [
  { icono: 'candado' as const, texto: 'Tus espacios, tus fuentes y tus conversaciones son solo tuyos.' },
  { icono: 'historial' as const, texto: 'Las conversaciones se eliminan automáticamente tras 90 días sin actividad.' },
  { icono: 'fuente' as const, texto: 'El Tutor consulta únicamente los materiales que tú eliges.' },
];

export default function Inicio() {
  const estudiantes = PLANES.filter((p) => p.publico === 'ESTUDIANTE');
  return (
    <>
      <section className="portada" aria-labelledby="titulo-portada">
        <div className="contenedor portada-centro">
          <div className="portada-texto">
            <h1 id="titulo-portada" className="portada-titulo">
              Convierte tus apuntes en conocimiento
            </h1>
            <p className="lead portada-lead">Tu tutor inteligente comprende tus materiales y te guía paso a paso.</p>
            <p className="acciones portada-acciones">
              <Link className="boton boton-primario boton-grande" href="/auth/registro">
                Comenzar gratis
              </Link>
              <Link className="boton boton-campo boton-grande" href="/auth/ingresar">
                Ingresar
              </Link>
            </p>
          </div>
          <div className="portada-figura" aria-hidden="true">
            <img
              src="/marca/buho-esculpido-960.webp"
              srcSet="/marca/buho-esculpido-560.webp 560w, /marca/buho-esculpido-960.webp 960w"
              sizes="(min-width: 64rem) 25rem, 13rem"
              width={960}
              height={1389}
              fetchPriority="high"
              alt=""
            />
          </div>
        </div>
        <div className="contenedor portada-producto">
          <Inclinable className="pantalla">
            <img
              src="/capturas/cuaderno.webp"
              width={2012}
              height={1218}
              loading="lazy"
              alt="El cuaderno de Mentelyx: una explicación del Tutor con un resaltado y una nota, y a su lado el pasaje citado de la fuente."
            />
          </Inclinable>
        </div>
      </section>

      <section className="seccion contenedor respaldo" aria-labelledby="titulo-respaldo">
        <div className="seccion-encabezado" data-aparece>
          <h2 id="titulo-respaldo">Aprende con la certeza de cada fuente</h2>
          <p className="lead suave">Mentelyx explica, cita y te permite comprobarlo todo en tus propios apuntes.</p>
        </div>
        <ul className="capacidades" data-aparece>
          {CAPACIDADES.map((c) => (
            <li key={c.titulo}>
              <span className="capacidad-icono">
                <Icono nombre={c.icono} />
              </span>
              <h3>{c.titulo}</h3>
              <p>{c.texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="seccion seccion-pozo" aria-labelledby="titulo-pasos">
        <div className="contenedor">
          <h2 id="titulo-pasos" data-aparece>
            Del primer apunte al dominio del tema
          </h2>
          <ol className="pasos" data-aparece>
            {PASOS.map((p) => (
              <li key={p.titulo}>
                <h3>{p.titulo}</h3>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="seccion contenedor privacidad" aria-labelledby="titulo-privacidad">
        <h2 id="titulo-privacidad" data-aparece>
          Tu conocimiento, siempre protegido
        </h2>
        <ul className="privacidad-lista" data-aparece>
          {PRIVACIDAD.map((p) => (
            <li key={p.texto}>
              <span className="privacidad-icono">
                <Icono nombre={p.icono} />
              </span>
              <p>{p.texto}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="seccion seccion-pozo" aria-labelledby="titulo-precios">
        <div className="contenedor precios-resumen">
          <div className="precios-texto" data-aparece>
            <h2 id="titulo-precios">Elige cómo quieres crecer</h2>
            <p className="suave">Empieza gratis y amplía tu capacidad cuando lo necesites, sin perder ninguna función.</p>
            <Link href="/planes" className="enlace-accion">
              Ver todos los planes, también los de docentes
            </Link>
          </div>
          <table className="tabla tabla-precios" data-aparece>
            <caption className="visually-hidden">Planes para estudiantes: precio mensual y consultas generales</caption>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col" className="num">
                  Precio al mes
                </th>
                <th scope="col" className="num">
                  Consultas generales
                </th>
              </tr>
            </thead>
            <tbody>
              {estudiantes.map((p) => (
                <tr key={p.codigo}>
                  <th scope="row">{p.nombre}</th>
                  <td className="num precio">{p.precio}</td>
                  <td className="num">{p.recursos.find(([n]) => n === 'Consultas generales')?.[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="cierre" aria-labelledby="titulo-cierre">
        <div className="contenedor cierre-fila" data-aparece>
          <div className="cierre-texto">
            <h2 id="titulo-cierre">Tu próximo gran logro empieza hoy</h2>
            <p>Crea tu cuenta gratis y descubre una forma más clara de aprender.</p>
          </div>
          <Link className="boton boton-primario boton-grande" href="/auth/registro">
            Comenzar gratis
          </Link>
        </div>
      </section>
    </>
  );
}
