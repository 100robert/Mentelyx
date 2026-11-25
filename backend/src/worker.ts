import { crearApp, EntornoApp } from './app';
import { R2AlmacenObjetos } from './modules/cursos-contenidos';
import { clienteMongoPerezoso, type BindingIa } from './modules/tutor-ia-rag';
import { crearConexionBd } from './shared/bd/conexion';
import { registrar } from './shared/registro';

/**
 * Infraestructura por petición: PostgreSQL (Neon serverless), MongoDB perezoso, R2 y Workers AI. Nada se comparte
 * entre peticiones. El binding `AI` solo existe en el entorno de despliegue (wrangler.jsonc, env.demostracion).
 */
function crearInfra(env: Env) {
  const entorno = EntornoApp.parse(env);
  const ia = (env as { AI?: unknown }).AI as BindingIa | undefined;
  const conexion = crearConexionBd(entorno);
  // El driver se carga solo si la petición usa MongoDB (conversaciones del Tutor): menos trabajo en el arranque en frío.
  const mongo = clienteMongoPerezoso(async () => new (await import('mongodb')).MongoClient(entorno.MONGODB_URL, { maxPoolSize: 1, serverSelectionTimeoutMS: 5000 }), entorno.MONGODB_DB);
  const tareas: Promise<unknown>[] = [];
  const { app, m2 } = crearApp(entorno, conexion, {
    almacen: new R2AlmacenObjetos(env.ARCHIVOS),
    mongo: mongo.db,
    ia,
    segundoPlano: (t) => {
      tareas.push(t.catch((e: unknown) => registrar('warn', 'segundo_plano.fallo', { tipo: e instanceof Error ? e.name : typeof e })));
    },
  });
  /** Cierra conexiones DESPUÉS de las tareas en segundo plano (p. ej. el relay del outbox), no antes. */
  const cerrar = async () => {
    await Promise.allSettled(tareas);
    await Promise.allSettled([conexion.cerrar(), mongo.cerrar()]);
  };
  return { app, m2, cerrar };
}

/**
 * Entrada de Cloudflare Workers. Conexión por petición (infraestructura, sección 1). El cron reintenta los eventos
 * pendientes del outbox de M2 (entrega al menos una vez); el consumidor de M6 es idempotente.
 */
export default {
  async fetch(request, env, ctx): Promise<Response> {
    const { app, cerrar } = crearInfra(env);
    try {
      return await app.fetch(request, env, ctx);
    } finally {
      ctx.waitUntil(cerrar());
    }
  },
  async scheduled(_evento, env, ctx): Promise<void> {
    const { m2, cerrar } = crearInfra(env);
    ctx.waitUntil(
      m2
        .publicarEventos()
        .then((r) => registrar('info', 'outbox.relay', { modulo: 'M2', resultado: `${r.publicados}/${r.fallidos}` }))
        .finally(cerrar),
    );
  },
} satisfies ExportedHandler<Env>;
