import Link from 'next/link';
import { Suspense } from 'react';
import { ExploradorCarpetas } from '@/features/carpetas';
import { EXPERIENCIAS_DISPONIBLES } from '@/features/experiencias';
import { Icono } from '@/components/ui/iconos';
import { EmpezarTema } from './empezar-tema';

export type Tema = { id: string; titulo: string; fuentes: number };
export type Sesion = { id: string; titulo: string; espacioId: string | null; actualizadaEn: string };

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', timeZone: 'America/Lima' });

/**
 * Módulo de Aprendizaje: empezar un tema con lenguaje natural, organizar en carpetas propias del módulo y retomar los temas
 * (espacios) y las sesiones con el Tutor. Solo datos reales de la API; nada de exámenes aquí.
 */
export function ModuloAprendizaje({ temas, sesiones, errorTemas }: { temas: Tema[]; sesiones: Sesion[]; errorTemas: boolean }) {
  const tituloDe = (id: string | null) => temas.find((t) => t.id === id)?.titulo;
  return (
    <div className="pagina pagina-modulo">
      <header className="modulo-cabecera">
        <h1 className="modulo-etiqueta">
          <Icono nombre="espacios" tamano={18} /> Aprendizaje
        </h1>
        <Suspense>
          <EmpezarTema titulo="¿Qué quieres aprender hoy?" />
        </Suspense>
      </header>

      <div className="modulo-cuerpo">
        <section aria-labelledby="titulo-temas" className="bloque">
          <div className="bloque-cabecera">
            <h2 id="titulo-temas" className="titulo-bloque">
              Tus temas <span className="contador">{temas.length}</span>
            </h2>
            {temas.length > 0 && (
              <Link href="/espacios" className="enlace-accion">
                Ver todos
              </Link>
            )}
          </div>
          {errorTemas ? (
            <p role="alert" className="mensaje mensaje-error">
              <Icono nombre="aviso" />
              <span>No pudimos cargar tus temas. Recarga la página para intentarlo de nuevo.</span>
            </p>
          ) : temas.length === 0 ? (
            <p className="suave">Aún no tienes temas. Escribe arriba lo que quieres aprender y empieza el primero.</p>
          ) : (
            <ul className="filas" aria-label="Temas">
              {temas.slice(0, 8).map((t) => (
                <li key={t.id}>
                  <Link href={`/espacios/${t.id}`} className="fila fila-enlace fila-fuente">
                    <span className="fila-titulo">
                      <Icono nombre="fuente" tamano={16} />
                      {t.titulo}
                    </span>
                    <span className="fila-dato">
                      {t.fuentes} {t.fuentes === 1 ? 'fuente' : 'fuentes'}
                    </span>
                    <span className="fila-dato">Privado</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-sesiones" className="bloque">
          <div className="bloque-cabecera">
            <h2 id="titulo-sesiones" className="titulo-bloque">
              Sesiones recientes
            </h2>
            {sesiones.length > 0 && (
              <Link href="/tutor" className="enlace-accion">
                Ver todas
              </Link>
            )}
          </div>
          {sesiones.length === 0 ? (
            <p className="suave">Tus sesiones con el Tutor aparecerán aquí para que las retomes cuando quieras.</p>
          ) : (
            <ul className="filas" aria-label="Sesiones recientes">
              {sesiones.slice(0, 5).map((s) => (
                <li key={s.id}>
                  <Link href={s.espacioId && tituloDe(s.espacioId) ? `/espacios/${s.espacioId}?sesion=${s.id}` : `/tutor/${s.id}`} className="fila fila-enlace fila-conversacion">
                    <span className="fila-titulo">{s.titulo}</span>
                    <span className="fila-dato">{tituloDe(s.espacioId) ?? 'Sin tema'}</span>
                    <span className="fila-dato">{fecha(s.actualizadaEn)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="titulo-experiencias" className="bloque">
          <div className="bloque-cabecera">
            <h2 id="titulo-experiencias" className="titulo-bloque">
              Experiencias para explorar
            </h2>
            <Link href="/aprendizaje/experiencias" className="enlace-accion">
              Ver todas
            </Link>
          </div>
          <p className="suave">Ejemplos preparados por Mentelyx con pizarra, modelos 3D, obras y documentos. El Tutor que los acompaña es el real.</p>
          <ul className="filas" aria-label="Experiencias">
            {EXPERIENCIAS_DISPONIBLES.map((e) => (
              <li key={e.clave}>
                <Link href={`/aprendizaje/experiencias/${e.clave}`} className="fila fila-enlace">
                  <span className="fila-titulo">{e.titulo}</span>
                  <span className="fila-dato">{e.disciplina}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <div className="modulo-carpetas">
          <Suspense>
            <ExploradorCarpetas modulo="APRENDIZAJE" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
