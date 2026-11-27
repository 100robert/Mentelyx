import Link from 'next/link';
import { Suspense } from 'react';
import { EmpezarTema, type Sesion, type Tema } from '@/features/aprendizaje';
import { Preparaciones } from '@/features/examenes';
import { Icono, type NombreIcono } from '@/components/ui/iconos';

const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', timeZone: 'America/Lima' });

const PRIMEROS_PASOS: Array<{ icono: NombreIcono; titulo: string; texto: string; enlaces: Array<{ href: string; texto: string }> }> = [
  { icono: 'espacios', titulo: 'Aprende un tema', texto: 'Escribe arriba lo que quieres entender, aunque empieces desde cero.', enlaces: [{ href: '/aprendizaje?empezar=1', texto: 'Ir a Aprendizaje' }] },
  { icono: 'examen', titulo: 'Prepara tu primer examen', texto: 'Crea una preparación con el examen, la asignatura y sus temas.', enlaces: [{ href: '/examenes?nueva=1', texto: 'Preparar un examen' }] },
  {
    icono: 'cursor',
    titulo: 'Mira cómo se explica',
    texto: 'Recorre ejemplos interactivos: una derivada paso a paso y un motor por dentro.',
    enlaces: [
      { href: '/#pizarra', texto: 'La derivada' },
      { href: '/#modelos', texto: 'El motor' },
    ],
  },
  { icono: 'subir', titulo: 'Suma tus apuntes', texto: 'Son opcionales. Agrégalos a un tema cuando quieras estudiar con tu propio material.', enlaces: [{ href: '/fuentes', texto: 'Mis fuentes' }] },
];

/**
 * Inicio personal: no es un panel administrativo. Responde dos preguntas —qué quiero aprender hoy y qué quiero
 * continuar— y separa los dos módulos. Con una cuenta nueva propone primeros pasos en lugar de estadísticas vacías.
 */
export function InicioPersonal({ temas, sesiones }: { temas: Tema[]; sesiones: Sesion[] }) {
  const ultima = [...sesiones].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn))[0];
  const temaDe = (id: string | null) => temas.find((t) => t.id === id);
  const nuevo = temas.length === 0 && sesiones.length === 0;

  return (
    <div className="pagina pagina-inicio">
      <h1 className="visually-hidden">Tu inicio</h1>
      <section className="inicio-empezar" aria-label="Empezar a aprender">
        <Suspense>
          <EmpezarTema />
        </Suspense>
      </section>

      {ultima && (
        <section className="continuar" aria-labelledby="titulo-continuar">
          <div className="continuar-texto">
            <p className="continuar-meta">Continúa donde lo dejaste</p>
            <h2 id="titulo-continuar" className="continuar-tema">
              {ultima.titulo}
            </h2>
            <p className="continuar-meta">
              {temaDe(ultima.espacioId) ? `${temaDe(ultima.espacioId)!.titulo}. ` : ''}Última actividad: {fecha(ultima.actualizadaEn)}.
            </p>
          </div>
          <p className="acciones">
            <Link className="boton boton-primario" href={ultima.espacioId && temaDe(ultima.espacioId) ? `/espacios/${ultima.espacioId}` : `/tutor/${ultima.id}`}>
              Continuar
            </Link>
            <Link className="boton boton-campo" href={`/tutor/${ultima.id}`}>
              Ver la sesión
            </Link>
          </p>
        </section>
      )}

      {nuevo && (
        <section className="primeros-pasos" aria-labelledby="titulo-primeros">
          <h2 id="titulo-primeros" className="titulo-bloque">
            Por dónde empezar
          </h2>
          <ul>
            {PRIMEROS_PASOS.map((p) => (
              <li key={p.titulo}>
                <span className="primeros-icono">
                  <Icono nombre={p.icono} />
                </span>
                <div>
                  <h3>{p.titulo}</h3>
                  <p>{p.texto}</p>
                  <p className="primeros-enlaces">
                    {p.enlaces.map((e) => (
                      <Link key={e.href} href={e.href} className="enlace-accion">
                        {e.texto}
                      </Link>
                    ))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="inicio-modulos">
        <section className="inicio-modulo" aria-labelledby="titulo-mod-aprendizaje">
          <div className="bloque-cabecera">
            <h2 id="titulo-mod-aprendizaje" className="titulo-bloque">
              <Icono nombre="espacios" tamano={18} /> Aprendizaje
            </h2>
            <Link href="/aprendizaje" className="enlace-accion">
              Abrir
            </Link>
          </div>
          {temas.length === 0 ? (
            <p className="suave">Tus temas aparecerán aquí, ordenados por tu actividad.</p>
          ) : (
            <ul className="filas" aria-label="Temas recientes">
              {temas.slice(0, 4).map((t) => (
                <li key={t.id}>
                  <Link href={`/espacios/${t.id}`} className="fila fila-enlace fila-fuente">
                    <span className="fila-titulo">{t.titulo}</span>
                    <span className="fila-dato">
                      {t.fuentes} {t.fuentes === 1 ? 'fuente' : 'fuentes'}
                    </span>
                    <span className="fila-dato" aria-hidden="true">
                      <Icono nombre="derecha" tamano={16} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="inicio-modulo" aria-labelledby="titulo-mod-examenes">
          <div className="bloque-cabecera">
            <h2 id="titulo-mod-examenes" className="titulo-bloque">
              <Icono nombre="examen" tamano={18} /> Exámenes
            </h2>
            <Link href="/examenes" className="enlace-accion">
              Abrir
            </Link>
          </div>
          <Suspense>
            <Preparaciones compacta />
          </Suspense>
        </section>
      </div>
    </div>
  );
}
