import type { BdDrizzle } from '../../shared/bd/conexion';
import type { ResolverActor } from '../../shared/sesion';
import { BetterAuthAdapter, crearBetterAuth, type ConfigAuth } from './infraestructura/better-auth.adapter';
import { PostgresLimiteAutenticacion } from './infraestructura/postgres-limite-autenticacion.adapter';
import { PostgresPreferencias } from './infraestructura/postgres-preferencias.repository';
import { crearRutasCuenta } from './presentacion/cuenta.controller';
import { OpenAPIHono } from '@hono/zod-openapi';
import type { VariablesBase } from '../../shared/http';
import { crearRutasAuth } from './presentacion/auth.controller';

/** Raíz de composición de M1 (I-0: prototipo de autenticación con Better Auth). */
export function crearModuloUsuariosAdmin(deps: { db: BdDrizzle; auth: ConfigAuth }) {
  const autenticacion = new BetterAuthAdapter(crearBetterAuth(deps.db, deps.auth));
  const resolverActor: ResolverActor = async (cabeceras) => {
    const sesion = await autenticacion.obtenerSesion(cabeceras);
    return sesion ? { actorId: sesion.usuarioId } : null;
  };
  return {
    nombre: 'M1 — Usuarios y Administración',
    rutas: (() => {
      const limite = new PostgresLimiteAutenticacion(deps.db, deps.auth.secret);
      const r = new OpenAPIHono<{ Variables: VariablesBase }>();
      r.route('/', crearRutasAuth(autenticacion, limite));
      r.route('/', crearRutasCuenta(autenticacion, new PostgresPreferencias(deps.db), limite));
      return r;
    })(),
    /** API pública: actor autenticado según la sesión del servidor. */
    resolverActor,
  };
}
