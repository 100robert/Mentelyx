import { OpenAPIHono } from '@hono/zod-openapi';
import type { Db } from 'mongodb';
import type { BdDrizzle } from '../../shared/bd/conexion';
import type { VariablesBase } from '../../shared/http';
import type { ResolverActor } from '../../shared/sesion';
import {
  crearCompletarActividad,
  crearConsultarPlan,
  crearConsultarSeguimiento,
  crearDefinirObjetivo,
} from './aplicacion/preparacion.use-cases';
import { crearCasosPreparacionesV1, type CarpetasPort } from './aplicacion/preparaciones-v1.use-cases';
import type { FuentesAutorizadasPort } from './dominio/preparacion';
import { MongoBancosPreguntas } from './infraestructura/mongo-bancos.repository';
import { PostgresIntentosRepositorio, PostgresTarjetasRepositorio } from './infraestructura/postgres-intentos.repository';
import { PostgresPreparacionRepositorio } from './infraestructura/postgres-preparacion.repository';
import { crearRutasPreparacion } from './presentacion/preparacion.controller';
import { crearRutasPreparacionesV1 } from './presentacion/preparaciones-v1.controller';

export { asegurarIndicesBancos } from './infraestructura/mongo-bancos.repository';
export type { CarpetasPort };

/**
 * Raíz de composición de M3 — Evaluaciones y Aprendizaje. Preparaciones (varias por cuenta, ADR-093), plan
 * determinista, banco de preguntas versionado (MongoDB), intentos con calificación oficial y tarjetas (PostgreSQL).
 * M2 (fuentes y carpetas) llega por puertos que conecta app.ts. `/preparacion/*` queda como alias de transición.
 */
export function crearModuloEvaluacionesAprendizaje(deps: {
  db: BdDrizzle;
  mongo: () => Promise<Db>;
  resolverActor: ResolverActor;
  fuentesAutorizadas: FuentesAutorizadasPort;
  carpetas: CarpetasPort;
  ahora?: () => Date;
}) {
  const repo = new PostgresPreparacionRepositorio(deps.db);
  const ahora = deps.ahora ?? (() => new Date());
  const v1 = crearCasosPreparacionesV1({
    repo,
    bancos: new MongoBancosPreguntas(deps.mongo),
    intentos: new PostgresIntentosRepositorio(deps.db),
    tarjetas: new PostgresTarjetasRepositorio(deps.db),
    fuentesAutorizadas: deps.fuentesAutorizadas,
    carpetas: deps.carpetas,
    ahora,
  });
  const rutas = new OpenAPIHono<{ Variables: VariablesBase }>();
  rutas.route(
    '/',
    crearRutasPreparacion({
      resolverActor: deps.resolverActor,
      casos: {
        definirObjetivo: crearDefinirObjetivo({ repo, fuentesAutorizadas: deps.fuentesAutorizadas, ahora }),
        consultarPlan: crearConsultarPlan({ repo }),
        completarActividad: crearCompletarActividad({ repo, ahora }),
        consultarSeguimiento: crearConsultarSeguimiento({ repo }),
      },
    }),
  );
  rutas.route('/', crearRutasPreparacionesV1({ resolverActor: deps.resolverActor, casos: v1 }));
  return {
    nombre: 'M3 — Evaluaciones y Aprendizaje',
    rutas,
    /** API pública para M2: títulos de las preparaciones propias (elementos de carpetas). */
    resumenPreparaciones: v1.resumenes,
  };
}

export type ModuloEvaluacionesAprendizaje = ReturnType<typeof crearModuloEvaluacionesAprendizaje>;
