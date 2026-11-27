import type { BdDrizzle } from '../../shared/bd/conexion';
import { publicarPendientes, type Entregador } from '../../shared/bd/relay';
import type { ResolverActor, SegundoPlano } from '../../shared/sesion';
import {
  crearCrearEspacio,
  crearFuentesAutorizadas,
  crearLeerContenidoFuente,
  crearListarEspacios,
  crearObtenerEspacio,
  crearRegistrarFuente,
  crearSeleccionarFuente,
} from './aplicacion/espacios.use-cases';
import type { AlmacenObjetosPort, EstadoLecturaPort, RecursosPlanPort } from './dominio/espacios';
import { PostgresEspaciosRepositorio } from './infraestructura/postgres-espacios.repository';
import { inboxEvents, outboxEvents } from './infraestructura/schema';
import { crearRutasEspacios } from './presentacion/espacios.controller';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { VariablesBase } from '../../shared/http';
import { crearCasosCarpetas } from './aplicacion/carpetas.use-cases';
import type { ElementosPort } from './dominio/carpetas';
import { PostgresCarpetasRepositorio, resumenTemas } from './infraestructura/postgres-carpetas.repository';
import { crearRutasCarpetas } from './presentacion/carpetas.controller';

export { MemoriaAlmacenObjetos, R2AlmacenObjetos } from './infraestructura/almacen-objetos.adapters';

/**
 * Raíz de composición de M2 — Cursos y Contenidos. MVP del Sprint 03: espacios privados y fuentes TXT/MD.
 * Depende de M5 (recursos de plan) y de M6 (estado de lectura) solo mediante puertos que conecta app.ts.
 */
export function crearModuloCursosContenidos(deps: {
  db: BdDrizzle;
  resolverActor: ResolverActor;
  almacen: AlmacenObjetosPort;
  recursos: RecursosPlanPort;
  estadoLectura: EstadoLecturaPort;
  /** Entrega de eventos FuenteRegistrada (la conecta app.ts con el consumidor de M6). */
  entregarEventos: Entregador;
  segundoPlano: SegundoPlano;
  /** Títulos de sesiones (M6) y preparaciones (M3) propias para los elementos de carpetas; enlace tardío en app.ts. */
  resumenesExternos: Pick<ElementosPort, 'SESION' | 'PREPARACION'>;
  ahora?: () => Date;
}) {
  const repo = new PostgresEspaciosRepositorio(deps.db);
  const publicarEventos = () => publicarPendientes(deps.db, { outboxEvents, inboxEvents }, deps.entregarEventos, { modulo: 'M2' });
  const carpetas = crearCasosCarpetas({
    repo: new PostgresCarpetasRepositorio(deps.db),
    elementos: { TEMA: (actorId, ids) => resumenTemas(deps.db, actorId, ids), SESION: deps.resumenesExternos.SESION, PREPARACION: deps.resumenesExternos.PREPARACION },
    ahora: deps.ahora ?? (() => new Date()),
  });
  const rutas = new OpenAPIHono<{ Variables: VariablesBase }>();
  rutas.route(
    '/',
    crearRutasEspacios({
      resolverActor: deps.resolverActor,
      casos: {
        crear: crearCrearEspacio({ repo }),
        listar: crearListarEspacios({ repo }),
        obtener: crearObtenerEspacio({ repo, estadoLectura: deps.estadoLectura }),
        registrarFuente: crearRegistrarFuente({ repo, almacen: deps.almacen, recursos: deps.recursos, estadoLectura: deps.estadoLectura }),
        seleccionarFuente: crearSeleccionarFuente({ repo }),
      },
      trasRegistrarFuente: () => deps.segundoPlano(publicarEventos()),
    }),
  );
  rutas.route('/', crearRutasCarpetas({ resolverActor: deps.resolverActor, casos: carpetas }));
  return {
    nombre: 'M2 — Cursos y Contenidos',
    rutas,
    /** API pública para M3: preparaciones dentro de carpetas de Exámenes (API 12.1 y 12.2). */
    carpetas: carpetas.puerto,
    /** API pública para M6 (API, sección 2.8). */
    fuentesAutorizadas: crearFuentesAutorizadas({ repo }),
    leerContenidoFuente: crearLeerContenidoFuente({ repo, almacen: deps.almacen }),
    /** Relay del outbox de M2 (también lo invoca el cron del Worker para reintentos). */
    publicarEventos,
  };
}

export type ModuloCursosContenidos = ReturnType<typeof crearModuloCursosContenidos>;
