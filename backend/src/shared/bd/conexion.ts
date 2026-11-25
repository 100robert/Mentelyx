import { neonConfig, Pool } from '@neondatabase/serverless';
import { drizzle, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import { registrar } from '../registro';

export type ConfigBd = {
  DATABASE_URL: string;
  /** Solo en desarrollo y CI: proxy WebSocket de Neon delante del PostgreSQL de Docker Compose. */
  NEON_WS_PROXY?: string | undefined;
};

export type BdDrizzle = NeonDatabase<Record<string, never>>;
export type TxDrizzle = Parameters<Parameters<BdDrizzle['transaction']>[0]>[0];

let proxyConfigurado: string | undefined;

function configurarProxyLocal(proxy: string | undefined): void {
  if (!proxy || proxyConfigurado === proxy) return;
  // Configuración documentada por Neon para desarrollo local con wsproxy: sin TLS hacia el proxy local.
  neonConfig.wsProxy = () => `${proxy}/v1`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
  proxyConfigurado = proxy;
}

/**
 * Conexión por petición (infraestructura, sección 1): Pool WebSocket del driver serverless de Neon,
 * con transacciones interactivas en una sola conexión. Drizzle y Kysely comparten el mismo Pool (ADR-075).
 */
export function crearConexionBd(config: ConfigBd) {
  configurarProxyLocal(config.NEON_WS_PROXY);
  const pool = new Pool({ connectionString: config.DATABASE_URL, max: 5 });
  // Workers cierra los WebSockets de la petición al terminar; un cliente ocioso emite entonces «error». Sin este
  // oyente sería una excepción no capturada (PR-INF-01). La operación en curso ya recibió su propio error.
  pool.on('error', (e: Error) => registrar('warn', 'bd.pool.cliente_ocioso', { tipo: e.name, resultado: 'descartado' }));
  const db: BdDrizzle = drizzle({ client: pool });
  return {
    pool,
    db,
    cerrar: () => pool.end(),
  };
}

export type ConexionBd = ReturnType<typeof crearConexionBd>;
