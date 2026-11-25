import type { BdDrizzle } from '../../shared/bd/conexion';
import { relojSistema, type Reloj } from '../../shared/fechas';
import type { ResolverActor } from '../../shared/sesion';
import { crearConfirmarRecurso } from './aplicacion/confirmar-recurso.use-case';
import { crearConsultarDerechos } from './aplicacion/consultar-entitlements.use-case';
import { crearIniciarRecursosDelPeriodo } from './aplicacion/iniciar-recursos-del-periodo.use-case';
import { crearLiberarRecurso } from './aplicacion/liberar-recurso.use-case';
import { crearReintegrarRecurso } from './aplicacion/reintegrar-recurso.use-case';
import { crearReservarRecurso } from './aplicacion/reservar-recurso.use-case';
import type { ModuloOrigen } from './dominio/recurso-plan';
import { crearKyselyM5 } from './infraestructura/kysely';
import { PostgresConsultaRecursos } from './infraestructura/postgres-entitlement-query.adapter';
import { PostgresLibroRecursos } from './infraestructura/postgres-resource-ledger.adapter';
import { crearRutasSuscripciones } from './presentacion/suscripciones.controller';

/** Raíz de composición de M5: único archivo que conoce dominio, aplicación, infraestructura y presentación. */
export function crearModuloSuscripcionesPagos(deps: { db: BdDrizzle; pool: unknown; resolverActor: ResolverActor; reloj?: Reloj }) {
  const reloj = deps.reloj ?? relojSistema;
  const libro = new PostgresLibroRecursos(deps.db);
  const consulta = new PostgresConsultaRecursos(crearKyselyM5(deps.pool));

  const reservar = crearReservarRecurso(libro, reloj);
  const confirmar = crearConfirmarRecurso(libro);
  const liberar = crearLiberarRecurso(libro);
  const reintegrar = crearReintegrarRecurso(libro);
  const consultarDerechos = crearConsultarDerechos(consulta, libro, reloj);

  return {
    nombre: 'M5 — Suscripciones y Pagos',
    rutas: crearRutasSuscripciones({ resolverActor: deps.resolverActor, consultarDerechos }),
    /** API pública para M2, M3 y M6 (API, sección 2.8). El módulo consumidor queda registrado como origen del movimiento. */
    recursosDePlan: (origen: ModuloOrigen) => ({
      reservarRecursoPlan: (cmd: unknown) => reservar(origen, cmd),
      confirmarRecursoPlan: (cmd: unknown) => confirmar(origen, cmd),
      liberarRecursoPlan: (cmd: unknown) => liberar(origen, cmd),
      reintegrarRecursoPlan: (cmd: unknown) => reintegrar(origen, cmd),
      consultarDerechosPlan: consultarDerechos,
    }),
    /** Uso interno de M5 (confirmación de pago en I-6) y de pruebas con datos sintéticos. */
    iniciarRecursosDelPeriodo: crearIniciarRecursosDelPeriodo(libro),
  };
}

export type ModuloSuscripcionesPagos = ReturnType<typeof crearModuloSuscripcionesPagos>;
export type RecursosDePlanApi = ReturnType<ModuloSuscripcionesPagos['recursosDePlan']>;
