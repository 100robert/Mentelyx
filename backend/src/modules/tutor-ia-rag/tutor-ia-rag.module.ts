import type { Db } from 'mongodb';
import type { BdDrizzle } from '../../shared/bd/conexion';
import { relojSistema, type Reloj } from '../../shared/fechas';
import type { ResolverActor } from '../../shared/sesion';
import { crearCrearConversacion, crearEliminarConversacion, crearListarConversaciones, crearObtenerConversacion } from './aplicacion/conversaciones.use-cases';
import { crearIndexarFuente } from './aplicacion/indexar-fuente.use-case';
import { crearResponderConsulta } from './aplicacion/responder-consulta.use-case';
import type { EmbeddingsPort, FuentesAutorizadasPort, LeerContenidoPort, LimiteTasaPort, ProveedorIaPort, RecursosPlanPort } from './dominio/tutor';
import { RedisLimiteTasa, SqlLimiteTasa } from './infraestructura/limite-tasa.adapters';
import { MongoConversaciones } from './infraestructura/mongo-conversaciones.repository';
import { PostgresIndiceRag } from './infraestructura/postgres-indice-rag.repository';
import { PostgresUsoIa, type ConfigPresupuesto } from './infraestructura/postgres-uso-ia.repository';
import { ProveedorSimulado } from './infraestructura/proveedor-simulado.adapter';
import { POLITICA_TECNICA } from './infraestructura/rutas-ia';
import { WorkersAiEmbeddings, WorkersAiProveedor, type BindingIa } from './infraestructura/workers-ai.adapter';
import { crearRutasTutor } from './presentacion/tutor.controller';

export { asegurarIndicesConversaciones, clienteMongoPerezoso } from './infraestructura/mongo-conversaciones.repository';
export type { BindingIa, ConfigPresupuesto };

export type ConfigIa =
  /** Local y CI: sin cuenta ni costo; recuperación solo léxica salvo que una prueba inyecte embeddings. */
  | { proveedor: 'simulado' }
  /** Demostración/producción: binding `AI` de Workers (Gemma 4 + BGE-M3). DeepSeek solo con `rutaTecnica: 'deepseek'`. */
  | { proveedor: 'workers-ai'; ai: BindingIa; rutaTecnica: 'deepseek' | 'respaldo-general' };

/**
 * Raíz de composición de M6 — Tutor IA y RAG: conversaciones en MongoDB, índice híbrido de fuentes privadas
 * (BGE-M3 + texto), presupuestos técnicos, límite de tasa y rutas de Workers AI. M2 y M5 llegan como puertos que
 * conecta app.ts. Las pruebas pueden sustituir proveedor, embeddings y límite de tasa.
 */
export function crearModuloTutorIaRag(deps: {
  db: BdDrizzle;
  mongo: () => Promise<Db>;
  resolverActor: ResolverActor;
  fuentesAutorizadas: FuentesAutorizadasPort;
  leerContenido: LeerContenidoPort;
  recursos: RecursosPlanPort;
  presupuesto: ConfigPresupuesto;
  ia: ConfigIa;
  /** Upstash REST (rate limit). Sin configuración: respaldo SQL. */
  redis?: { url: string; token: string; entorno: string; secreto: string } | undefined;
  proveedor?: ProveedorIaPort;
  embeddings?: EmbeddingsPort | null;
  limiteTasa?: LimiteTasaPort;
  reloj?: Reloj;
  ahora?: () => Date;
}) {
  const reloj = deps.reloj ?? relojSistema;
  const ahora = deps.ahora ?? (() => new Date());
  const conversaciones = new MongoConversaciones(deps.mongo);
  const indice = new PostgresIndiceRag(deps.db);
  const uso = new PostgresUsoIa(deps.db, deps.presupuesto);
  const real = deps.ia.proveedor === 'workers-ai' ? deps.ia : undefined;
  const proveedor = deps.proveedor ?? (real ? new WorkersAiProveedor(real.ai, { rutaTecnica: real.rutaTecnica }) : new ProveedorSimulado());
  const embeddings = deps.embeddings !== undefined ? deps.embeddings : real ? new WorkersAiEmbeddings(real.ai) : null;
  const respaldoTasa = new SqlLimiteTasa(deps.db);
  const limiteTasa = deps.limiteTasa ?? (deps.redis ? new RedisLimiteTasa(deps.redis, respaldoTasa) : respaldoTasa);

  return {
    nombre: 'M6 — Tutor IA y RAG',
    rutas: crearRutasTutor({
      resolverActor: deps.resolverActor,
      casos: {
        crearConversacion: crearCrearConversacion({ conversaciones, fuentesAutorizadas: deps.fuentesAutorizadas, ahora }),
        listarConversaciones: crearListarConversaciones({ conversaciones, ahora }),
        obtenerConversacion: crearObtenerConversacion({ conversaciones, ahora }),
        eliminarConversacion: crearEliminarConversacion({ conversaciones }),
        responderConsulta: crearResponderConsulta({
          conversaciones,
          fuentesAutorizadas: deps.fuentesAutorizadas,
          indice,
          uso,
          recursos: deps.recursos,
          proveedor,
          embeddings,
          limiteTasa,
          politica: POLITICA_TECNICA,
          reloj,
          ahora,
        }),
      },
    }),
    /** API pública para M2: estado de lectura (indexación) de sus fuentes. */
    estadoLectura: (contentIds: string[]) => indice.estados(contentIds),
    /** Consumidor de eventos de M2 (Idempotent Receiver). */
    consumirEvento: crearIndexarFuente({ leerContenido: deps.leerContenido, indexador: indice, embeddings }),
  };
}

export type ModuloTutorIaRag = ReturnType<typeof crearModuloTutorIaRag>;
