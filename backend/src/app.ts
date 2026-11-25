import '@mentelyx/contratos'; // Configura Zod sin JIT antes de declarar o validar cualquier esquema.
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { exito, z } from '@mentelyx/contratos';
import type { Db } from 'mongodb';
import type { ConexionBd } from './shared/bd/conexion';
import { correlacion } from './shared/correlacion';
import { ganchoValidacion, manejarErrores, responderFallo, responderOk, verificarOrigen, type VariablesBase } from './shared/http';
import type { Reloj } from './shared/fechas';
import type { SegundoPlano } from './shared/sesion';
import { crearModuloUsuariosAdmin } from './modules/usuarios-admin';
import { crearModuloCursosContenidos } from './modules/cursos-contenidos';
import { crearModuloEvaluacionesAprendizaje } from './modules/evaluaciones-aprendizaje';
import { crearModuloDocentesClases } from './modules/docentes-clases';
import { crearModuloSuscripcionesPagos } from './modules/suscripciones-pagos';
import { crearModuloTutorIaRag, type BindingIa, type ConfigIa, type ModuloTutorIaRag } from './modules/tutor-ia-rag';
import { crearModuloPublicidadPatrocinios } from './modules/publicidad-patrocinios';

const lista = z
  .string()
  .optional()
  .transform((s) => (s ? s.split(',').map((x) => x.trim()).filter(Boolean) : []));

export const EntornoApp = z.object({
  ENTORNO: z.enum(['desarrollo', 'ci', 'staging', 'produccion']),
  DATABASE_URL: z.string().min(1),
  NEON_WS_PROXY: z.string().optional(),
  AUTH_SECRET: z.string().min(32),
  /** Origen público (el del frontend, que reenvía /api/v1 a este Worker). */
  AUTH_URL: z.url(),
  AUTH_ORIGENES: lista,
  MONGODB_URL: z.string().min(1).default('mongodb://127.0.0.1:57017'),
  MONGODB_DB: z.string().min(1).default('mentelyx'),
  /** Presupuesto técnico mensual de IA (SC-11). Valores locales de prueba; los de producción los aprueba el propietario. */
  PRESUPUESTO_IA_MENSUAL_USD: z.coerce.number().nonnegative().default(5),
  PRESUPUESTO_IA_TOPE_USD: z.coerce.number().nonnegative().default(5),
  /** `simulado` en local/CI (sin cuenta ni costo); `workers-ai` en el despliegue (exige el binding `AI`). */
  IA_PROVEEDOR: z.enum(['simulado', 'workers-ai']).default('simulado'),
  /** DeepSeek V4.1 Flash requiere Workers Paid o créditos: por defecto la ruta técnica usa Gemma con aviso (sección 5.11). */
  IA_RUTA_TECNICA: z.enum(['respaldo-general', 'deepseek']).default('respaldo-general'),
  /** Upstash REST para el límite de tasa; sin ellos se usa el respaldo SQL (API-08). El token es un secreto de Workers. */
  UPSTASH_REDIS_REST_URL: z.url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
});
export type EntornoApp = z.infer<typeof EntornoApp>;

type DepsM6 = Parameters<typeof crearModuloTutorIaRag>[0];

export type InfraestructuraApp = {
  almacen: Parameters<typeof crearModuloCursosContenidos>[0]['almacen'];
  mongo: () => Promise<Db>;
  segundoPlano: SegundoPlano;
  reloj?: Reloj;
  ahora?: () => Date;
  /** Binding `AI` de Workers (solo en el despliegue). */
  ia?: BindingIa | undefined;
  /** Sustitutos para pruebas: proveedor, embeddings y límite de tasa. */
  proveedorIa?: DepsM6['proveedor'];
  embeddings?: DepsM6['embeddings'];
  limiteTasa?: DepsM6['limiteTasa'];
};

function configIa(entorno: EntornoApp, ia: BindingIa | undefined): ConfigIa {
  if (entorno.IA_PROVEEDOR === 'simulado') return { proveedor: 'simulado' };
  if (!ia) throw new Error('IA_PROVEEDOR=workers-ai requiere el binding AI de Workers.');
  return { proveedor: 'workers-ai', ai: ia, rutaTecnica: entorno.IA_RUTA_TECNICA };
}

/**
 * Composición general (diseño interno, sección 2): monta los siete módulos bajo /api/v1. Los módulos no se importan
 * entre sí: M2 ↔ M5 ↔ M6 se conectan aquí mediante sus API públicas (puertos). El enlace M2 → M6 es tardío porque
 * cada uno usa una función del otro.
 */
export function crearApp(entorno: EntornoApp, conexion: Pick<ConexionBd, 'db' | 'pool'>, infra: InfraestructuraApp) {
  const m1 = crearModuloUsuariosAdmin({
    db: conexion.db,
    auth: {
      secret: entorno.AUTH_SECRET,
      baseURL: entorno.AUTH_URL,
      origenesConfiables: entorno.AUTH_ORIGENES,
      produccion: entorno.ENTORNO === 'produccion' || entorno.ENTORNO === 'staging',
    },
  });
  const m5 = crearModuloSuscripcionesPagos({ db: conexion.db, pool: conexion.pool, resolverActor: m1.resolverActor, ...(infra.reloj ? { reloj: infra.reloj } : {}) });

  const enlace: { m6?: ModuloTutorIaRag } = {}; // enlace tardío M2 → M6
  const m2 = crearModuloCursosContenidos({
    db: conexion.db,
    resolverActor: m1.resolverActor,
    almacen: infra.almacen,
    recursos: m5.recursosDePlan('M2'),
    estadoLectura: (ids) => enlace.m6!.estadoLectura(ids),
    entregarEventos: async (evento) => {
      await enlace.m6!.consumirEvento(evento);
    },
    segundoPlano: infra.segundoPlano,
  });
  const m6 = (enlace.m6 = crearModuloTutorIaRag({
    db: conexion.db,
    mongo: infra.mongo,
    resolverActor: m1.resolverActor,
    fuentesAutorizadas: m2.fuentesAutorizadas,
    leerContenido: m2.leerContenidoFuente,
    recursos: m5.recursosDePlan('M6'),
    presupuesto: { mensualUsd: entorno.PRESUPUESTO_IA_MENSUAL_USD, topeUsd: entorno.PRESUPUESTO_IA_TOPE_USD, policyVersion: 'piloto-2026-11-20' },
    ia: configIa(entorno, infra.ia),
    redis:
      entorno.UPSTASH_REDIS_REST_URL && entorno.UPSTASH_REDIS_REST_TOKEN
        ? { url: entorno.UPSTASH_REDIS_REST_URL, token: entorno.UPSTASH_REDIS_REST_TOKEN, entorno: entorno.ENTORNO, secreto: entorno.AUTH_SECRET }
        : undefined,
    ...(infra.reloj ? { reloj: infra.reloj } : {}),
    ...(infra.ahora ? { ahora: infra.ahora } : {}),
    ...(infra.proveedorIa ? { proveedor: infra.proveedorIa } : {}),
    ...(infra.embeddings !== undefined ? { embeddings: infra.embeddings } : {}),
    ...(infra.limiteTasa ? { limiteTasa: infra.limiteTasa } : {}),
  }));

  const modulos = [m1, m2, crearModuloEvaluacionesAprendizaje(), crearModuloDocentesClases(), m5, m6, crearModuloPublicidadPatrocinios()];

  const v1 = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const salud = createRoute({
    method: 'get',
    path: '/salud',
    responses: { 200: { description: 'Proceso activo y módulos montados (no comprueba dependencias)', content: { 'application/json': { schema: exito(z.object({ estado: z.literal('ok'), modulos: z.array(z.string()) })) } } } },
  });
  v1.openapi(salud, (c) => responderOk(c, { estado: 'ok' as const, modulos: modulos.map((m) => m.nombre) }) as never);
  for (const m of modulos) v1.route('/', m.rutas);
  v1.doc31('/openapi.json', {
    openapi: '3.1.0',
    info: {
      title: 'API Mentelyx',
      version: '0.3.0-sprint03',
      description: 'Monolito modular (Hono en Cloudflare Workers). Envoltura común {ok, data|error, meta}; errores del catálogo de la API, sección 7.',
    },
    servers: [{ url: '/api/v1' }],
  });

  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  app.use('*', correlacion());
  app.use('/api/v1/*', verificarOrigen([new URL(entorno.AUTH_URL).origin, ...entorno.AUTH_ORIGENES]));
  app.onError(manejarErrores);
  app.notFound((c) => responderFallo(c, 'RECURSO_NO_ENCONTRADO', 'Ruta no encontrada.'));
  app.route('/api/v1', v1);

  return { app, m1, m2, m5, m6 };
}
