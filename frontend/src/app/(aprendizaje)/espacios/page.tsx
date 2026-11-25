import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CrearEspacio } from '@/components/espacios';
import { Icono, type NombreIcono } from '@/components/iconos';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Mis espacios' };
/** SSR autenticado sin caché compartida (PR-INF-01): cada petición consulta la API con la cookie del usuario. */
export const dynamic = 'force-dynamic';

type Espacio = { id: string; titulo: string; fuentes: number; almacenamientoBytes: number };
type Fuente = { contentId: string; titulo: string; formato: string; estadoLectura: string; seleccionada: boolean };
type Detalle = { id: string; titulo: string; listaFuentes: Fuente[] };
type Derechos = { producto: string; recursos: Array<{ recurso: string; limite: number; disponibles: number }> };
type Conversacion = { id: string; titulo: string; espacioId: string | null; mensajes: number; actualizadaEn: string };

const NOMBRES: Record<string, string> = { CONSULTA_GENERAL: 'Consultas generales', CONSULTA_TECNICA: 'Consultas técnicas', ALMACENAMIENTO_BYTES: 'Almacenamiento' };
const ORDEN = ['CONSULTA_GENERAL', 'CONSULTA_TECNICA', 'ALMACENAMIENTO_BYTES'];
const ESTADOS: Record<string, string> = { LISTA: 'Lista', PENDIENTE: 'En cola', INDEXANDO: 'Leyendo', FALLIDA: 'No se pudo leer' };
const formato = (recurso: string, n: number) => (recurso.endsWith('_BYTES') ? `${(n / 1e6).toLocaleString('es-PE', { maximumFractionDigits: 1 })} MB` : n.toLocaleString('es-PE'));
const tamano = (bytes: number) => (bytes >= 1e6 ? `${(bytes / 1e6).toLocaleString('es-PE', { maximumFractionDigits: 1 })} MB` : `${(bytes / 1000).toLocaleString('es-PE', { maximumFractionDigits: 1 })} KB`);
const fecha = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', timeZone: 'America/Lima' });
const plan = (producto: string) => (producto === 'EST_GRATUITO' ? 'Gratuito' : producto);
const ESPACIOS_CON_FUENTES = 4;

/** Panel del estudiante: retomar el estudio, accesos rápidos, espacios privados, fuentes, conversaciones y recursos reales del mes. */
export default async function MisEspacios() {
  if (!(await sesionActual())) redirect('/auth/ingresar?siguiente=/espacios');
  const [espacios, derechos, conversaciones] = await Promise.all([
    apiServidor<Espacio[]>('/espacios'),
    apiServidor<Derechos>('/suscripciones/me/derechos'),
    apiServidor<Conversacion[]>('/tutor-ia/conversaciones'),
  ]);
  const lista = espacios.datos ?? [];
  const recientes = [...(conversaciones.datos ?? [])].sort((a, b) => b.actualizadaEn.localeCompare(a.actualizadaEn));
  const ultima = recientes[0];
  const tituloEspacio = (id: string | null) => lista.find((e) => e.id === id)?.titulo;
  // Espacio de referencia para los accesos rápidos: el de la última conversación o el primero de la lista.
  const espacioActivo = lista.find((e) => e.id === ultima?.espacioId) ?? lista[0];
  const detalles = await Promise.all(lista.slice(0, ESPACIOS_CON_FUENTES).map((e) => apiServidor<Detalle>(`/espacios/${encodeURIComponent(e.id)}`)));
  const fuentes = detalles.flatMap((d) => (d.datos ? d.datos.listaFuentes.map((f) => ({ ...f, espacioId: d.datos!.id, espacio: d.datos!.titulo })) : [])).slice(0, 6);

  const accesos: Array<{ href: string; titulo: string; texto: string; icono: NombreIcono }> = [
    { href: '/espacios#nuevo-espacio', titulo: 'Nuevo espacio', texto: 'Para un curso o una unidad', icono: 'mas' },
    ...(espacioActivo
      ? [
          { href: `/espacios/${espacioActivo.id}?agregar=1`, titulo: 'Agregar fuente', texto: `En ${espacioActivo.titulo}`, icono: 'subir' as const },
          { href: `/espacios/${espacioActivo.id}?preguntar=1`, titulo: 'Preguntar al Tutor', texto: `Sobre ${espacioActivo.titulo}`, icono: 'conversaciones' as const },
        ]
      : []),
    { href: '/tutor', titulo: 'Conversaciones', texto: 'Sesiones guardadas', icono: 'historial' },
  ];

  return (
    <div className="pagina pagina-tablero">
      <header className="pagina-cabecera">
        <h1>Mis espacios</h1>
        <p className="suave">Retoma tu estudio, organiza tus fuentes y pregunta al Tutor. Solo tú ves este contenido.</p>
      </header>

      {ultima ? (
        <section className="continuar" aria-labelledby="titulo-continuar">
          <div className="continuar-texto">
            <h2 id="titulo-continuar" className="continuar-tema">
              {ultima.titulo}
            </h2>
            <p className="continuar-meta">
              {tituloEspacio(ultima.espacioId) ? `En ${tituloEspacio(ultima.espacioId)}. ` : ''}Última actividad: {fecha(ultima.actualizadaEn)}.
            </p>
          </div>
          <div className="acciones">
            <Link className="boton boton-primario" href={ultima.espacioId && tituloEspacio(ultima.espacioId) ? `/espacios/${ultima.espacioId}` : `/tutor/${ultima.id}`}>
              Continuar en el Tutor
            </Link>
            <Link className="boton boton-campo" href={`/tutor/${ultima.id}`}>
              Ver la conversación
            </Link>
          </div>
        </section>
      ) : lista.length === 0 ? (
        <section className="continuar continuar-inicio" aria-labelledby="titulo-empezar">
          <div className="continuar-texto">
            <h2 id="titulo-empezar" className="continuar-tema">
              Crea tu primer espacio de estudio
            </h2>
            <p className="continuar-meta">Ponle el nombre de un curso o una unidad. Después sube tus apuntes y pregunta al Tutor.</p>
          </div>
        </section>
      ) : null}

      <nav aria-label="Accesos rápidos" className="accesos">
        <ul>
          {accesos.map((a) => (
            <li key={a.titulo}>
              <Link href={a.href} className="acceso-rapido">
                <span className="acceso-rapido-icono">
                  <Icono nombre={a.icono} />
                </span>
                <span className="acceso-rapido-texto">
                  <span className="acceso-rapido-titulo">{a.titulo}</span>
                  <span className="acceso-rapido-detalle">{a.texto}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="tablero">
        <div className="tablero-principal">
          <section aria-labelledby="titulo-espacios" className="bloque">
            <div className="bloque-cabecera">
              <h2 id="titulo-espacios" className="titulo-bloque">
                Tus espacios <span className="contador">{lista.length}</span>
              </h2>
            </div>
            <CrearEspacio secundario={Boolean(ultima)} />
            {espacios.error && !espacios.datos ? (
              <p role="alert" className="mensaje mensaje-error">
                <Icono nombre="aviso" />
                <span>No pudimos cargar tus espacios. Recarga la página para intentarlo de nuevo.</span>
              </p>
            ) : lista.length === 0 ? (
              <div className="vacio">
                <Icono nombre="espacios" tamano={24} />
                <div>
                  <p className="vacio-titulo">Aún no tienes espacios. Crea el primero.</p>
                  <p className="suave">Un espacio reúne los apuntes de un tema y tus conversaciones con el Tutor sobre ellos.</p>
                </div>
              </div>
            ) : (
              <ul className="tarjetas-espacio" aria-label="Espacios">
                {lista.map((e) => (
                  <li key={e.id}>
                    <Link href={`/espacios/${e.id}`} className="tarjeta-espacio">
                      <span className="tarjeta-espacio-titulo">{e.titulo}</span>
                      <span className="tarjeta-espacio-datos">
                        <span>
                          {e.fuentes} {e.fuentes === 1 ? 'fuente' : 'fuentes'}
                        </span>
                        <span className="num">{tamano(e.almacenamientoBytes)}</span>
                      </span>
                      <span className="etiqueta">
                        <Icono nombre="candado" tamano={14} />
                        Privado
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {fuentes.length > 0 && (
            <section aria-labelledby="titulo-fuentes" className="bloque">
              <div className="bloque-cabecera">
                <h2 id="titulo-fuentes" className="titulo-bloque">
                  Tus fuentes
                </h2>
              </div>
              <ul className="filas" aria-label="Fuentes">
                {fuentes.map((f) => (
                  <li key={f.contentId}>
                    <Link href={`/espacios/${f.espacioId}`} className="fila fila-enlace fila-fuente">
                      <span className="fila-titulo">
                        <Icono nombre="fuente" tamano={16} />
                        {f.titulo}
                      </span>
                      <span className="fila-dato">{f.espacio}</span>
                      <span className={`estado-fuente estado-${f.estadoLectura.toLowerCase()}`}>{ESTADOS[f.estadoLectura] ?? f.estadoLectura}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="titulo-recientes" className="bloque">
            <div className="bloque-cabecera">
              <h2 id="titulo-recientes" className="titulo-bloque">
                Conversaciones recientes
              </h2>
              {recientes.length > 0 && (
                <Link href="/tutor" className="enlace-accion">
                  Ver todas
                </Link>
              )}
            </div>
            {recientes.length === 0 ? (
              <p className="suave">Aún no tienes conversaciones. Abre un espacio y pregúntale al Tutor sobre tus fuentes.</p>
            ) : (
              <ul className="filas" aria-label="Conversaciones recientes">
                {recientes.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link href={`/tutor/${c.id}`} className="fila fila-enlace fila-conversacion">
                      <span className="fila-titulo">{c.titulo}</span>
                      <span className="fila-dato">{tituloEspacio(c.espacioId) ?? 'Sin espacio'}</span>
                      <span className="fila-dato">{fecha(c.actualizadaEn)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="tablero-lateral">
          {derechos.datos ? (
            <section className="recursos" aria-labelledby="recursos">
              <h2 id="recursos" className="titulo-bloque">
                Recursos de este mes
              </h2>
              <p className="suave">Plan {plan(derechos.datos.producto)}</p>
              <dl className="medidores">
                {derechos.datos.recursos
                  .filter((r) => NOMBRES[r.recurso])
                  .sort((a, b) => ORDEN.indexOf(a.recurso) - ORDEN.indexOf(b.recurso))
                  .map((r) => (
                    <div key={r.recurso} className="medidor">
                      <dt>{NOMBRES[r.recurso]}</dt>
                      <dd>
                        <span className="num">
                          {formato(r.recurso, r.disponibles)} de {formato(r.recurso, r.limite)}
                        </span>{' '}
                        <span className="suave">disponibles</span>
                        <span className="medidor-barra" aria-hidden="true">
                          <span style={{ inlineSize: `${r.limite > 0 ? Math.min(100, (r.disponibles / r.limite) * 100) : 0}%` }} />
                        </span>
                      </dd>
                    </div>
                  ))}
              </dl>
              <Link href="/planes" className="enlace-accion">
                Comparar planes
              </Link>
            </section>
          ) : (
            <p className="mensaje mensaje-info">
              <Icono nombre="info" />
              <span>Los recursos de tu plan no están disponibles en este momento.</span>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
