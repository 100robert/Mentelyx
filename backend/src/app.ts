import '@mentelyx/contratos'; // Configura Zod sin JIT antes de declarar o validar cualquier esquema.
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { exito, z } from '@mentelyx/contratos';
import type { Db } from 'mongodb';
import type { ConexionBd } from './shared/bd/conexion';
import { crearProteccionCsrf } from './shared/csrf';
import { enriquecerOpenApi, SWAGGER_HTML } from './shared/openapi';
import { correlacion } from './shared/correlacion';
import { ganchoValidacion, manejarErrores, responderFallo, responderOk, verificarOrigen, type VariablesBase } from './shared/http';
import type { Reloj } from './shared/fechas';
import type { SegundoPlano } from './shared/sesion';
import { crearModuloUsuariosAdmin } from './modules/usuarios-admin';
import { crearModuloCursosContenidos } from './modules/cursos-contenidos';
import { crearModuloEvaluacionesAprendizaje, type ModuloEvaluacionesAprendizaje } from './modules/evaluaciones-aprendizaje';
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
  /**
   * Proveedor del Tutor. Sin valor por omisión: `configIa` lo resuelve por entorno. `simulado` solo en desarrollo y CI;
   * `workers-ai` exige el binding `AI`; `deshabilitado` apaga las consultas (503) sin respuestas ficticias.
   */
  IA_PROVEEDOR: z.enum(['simulado', 'workers-ai', 'nvidia', 'deshabilitado']).optional(),
  /** NVIDIA API Catalog (ADR-094): la clave es un SECRETO (.dev.vars.externo o `wrangler secret put`), nunca una var. */
  NVIDIA_API_KEY: z.string().min(20).optional(),
  NVIDIA_BASE_URL: z.url().default('https://integrate.api.nvidia.com/v1'),
  NVIDIA_MODELO: z.string().regex(/^[a-z0-9._-]+\/[a-z0-9._-]+$/i).default('moonshotai/kimi-k3.1-pro'),
  NVIDIA_TIMEOUT_MS: z.coerce.number().int().min(5_000).max(120_000).default(90_000),
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

/** Entornos donde el proveedor simulado está permitido de forma expresa (y es el valor por omisión). */
const ENTORNOS_CON_SIMULADO = new Set<EntornoApp['ENTORNO']>(['desarrollo', 'ci']);

/**
 * Resuelve el proveedor del Tutor (diseño de API, 12.11, riesgos; orquestación, sección 5.11). Falla al iniciar —y
 * con ello toda petición— si staging o producción no declaran un proveedor real o la deshabilitación explícita: un
 * despliegue mal configurado nunca entrega respuestas simuladas como si fueran del Tutor.
 */
export function configIa(
  entorno: Pick<EntornoApp, 'ENTORNO' | 'IA_PROVEEDOR' | 'IA_RUTA_TECNICA'> & Partial<Pick<EntornoApp, 'NVIDIA_API_KEY' | 'NVIDIA_BASE_URL' | 'NVIDIA_MODELO' | 'NVIDIA_TIMEOUT_MS'>>,
  ia: BindingIa | undefined,
): ConfigIa {
  const permiteSimulado = ENTORNOS_CON_SIMULADO.has(entorno.ENTORNO);
  const proveedor = entorno.IA_PROVEEDOR ?? (permiteSimulado ? 'simulado' : undefined);
  if (!proveedor) throw new Error(`IA_PROVEEDOR es obligatorio en ENTORNO=${entorno.ENTORNO} (workers-ai o deshabilitado).`);
  if (proveedor === 'simulado') {
    if (!permiteSimulado) throw new Error(`El proveedor simulado no está permitido en ENTORNO=${entorno.ENTORNO}.`);
    return { proveedor: 'simulado' };
  }
  if (proveedor === 'deshabilitado') return { proveedor: 'deshabilitado' };
  if (proveedor === 'nvidia') {
    if (!entorno.NVIDIA_API_KEY) throw new Error('IA_PROVEEDOR=nvidia requiere el secreto NVIDIA_API_KEY.');
    return {
      proveedor: 'nvidia',
      nvidia: { apiKey: entorno.NVIDIA_API_KEY, baseUrl: entorno.NVIDIA_BASE_URL ?? 'https://integrate.api.nvidia.com/v1', modelo: entorno.NVIDIA_MODELO ?? 'moonshotai/kimi-k3.1-pro', timeoutMs: entorno.NVIDIA_TIMEOUT_MS ?? 90_000 },
      // Los embeddings BGE-M3 siguen en Workers AI cuando existe el binding; si no, la recuperación es léxica (con aviso).
      ...(ia ? { embeddingsAi: ia } : {}),
    };
  }
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

  // Enlaces tardíos: M2 ↔ M6 (lectura de fuentes y títulos de sesiones) y M2 ↔ M3 (carpetas y títulos de preparaciones).
  const enlace: { m6?: ModuloTutorIaRag; m3?: ModuloEvaluacionesAprendizaje } = {};
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
    resumenesExternos: {
      SESION: (actorId, ids) => enlace.m6!.resumenSesiones(actorId, ids),
      PREPARACION: (actorId, ids) => enlace.m3!.resumenPreparaciones(actorId, ids),
    },
    ...(infra.ahora ? { ahora: infra.ahora } : {}),
  });
  const m6 = (enlace.m6 = crearModuloTutorIaRag({
    db: conexion.db,
    mongo: infra.mongo,
    resolverActor: m1.resolverActor,
    fuentesAutorizadas: m2.fuentesAutorizadas,
    leerContenido: m2.leerContenidoFuente,
    preparacionPropia: async (actorId, id) => (await enlace.m3!.resumenPreparaciones(actorId, [id])).length === 1,
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

  const m3 = (enlace.m3 = crearModuloEvaluacionesAprendizaje({
    db: conexion.db,
    mongo: infra.mongo,
    resolverActor: m1.resolverActor,
    fuentesAutorizadas: m2.fuentesAutorizadas,
    carpetas: m2.carpetas,
    ...(infra.ahora ? { ahora: infra.ahora } : {}),
  }));
  const modulos = [m1, m2, m3, crearModuloDocentesClases(), m5, m6, crearModuloPublicidadPatrocinios()];

  const v1 = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const csrf = crearProteccionCsrf(entorno.AUTH_SECRET, entorno.ENTORNO === 'produccion' || entorno.ENTORNO === 'staging');
  v1.openapi(createRoute({ method: 'get', path: '/auth/csrf', responses: { 200: { description: 'Token CSRF privado ligado a la sesión o navegador anónimo', content: { 'application/json': { schema: exito(z.object({ token: z.string() })) } } }, 403: { description: 'Solicitud desde otro sitio' } } }), (c) => csrf.emitir(c) as never);
  const salud = createRoute({
    method: 'get',
    path: '/salud',
    responses: { 200: { description: 'Proceso activo y módulos montados (no comprueba dependencias)', content: { 'application/json': { schema: exito(z.object({ estado: z.literal('ok'), modulos: z.array(z.string()) })) } } } },
  });
  v1.openapi(salud, (c) => responderOk(c, { estado: 'ok' as const, modulos: modulos.map((m) => m.nombre) }) as never);
  for (const m of modulos) v1.route('/', m.rutas);
  // Swagger UI (Sprint 2, actividad 4): documentada como ruta pública para que el contrato la incluya.
  v1.openapi(
    createRoute({ method: 'get', path: '/docs', responses: { 200: { description: 'Swagger UI de esta API (HTML)', content: { 'text/html': { schema: z.string() } } } } }),
    (c) => c.html(SWAGGER_HTML) as never,
  );
  const configDoc = {
    openapi: '3.1.0' as const,
    info: {
      title: 'API Mentelyx',
      version: '1.0.0-v1',
      description:
        'Monolito modular (Hono en Cloudflare Workers, Clean Architecture). Envoltura común {ok, data|error, meta}; errores del catálogo (diseño de API, sección 7). ' +
        'Las rutas privadas exigen la cookie de sesión; toda mutación exige además un Origin permitido y X-CSRF-Token (GET /auth/csrf). Un recurso de otra cuenta responde 404.',
    },
    servers: [{ url: '/api/v1' }],
  };
  // Generado en cada petición desde los esquemas Zod de las rutas y enriquecido con módulos y seguridad (shared/openapi.ts).
  v1.get('/openapi.json', (c) => c.json(enriquecerOpenApi(v1.getOpenAPI31Document(configDoc))));

  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  app.use('*', correlacion());
  app.use('/api/v1/*', verificarOrigen([new URL(entorno.AUTH_URL).origin, ...entorno.AUTH_ORIGENES]));
  app.use('/api/v1/*', csrf.verificar);
  app.onError(manejarErrores);
  app.notFound((c) => responderFallo(c, 'RECURSO_NO_ENCONTRADO', 'Ruta no encontrada.'));
  app.route('/api/v1', v1);

  return { app, m1, m2, m5, m6 };
}
