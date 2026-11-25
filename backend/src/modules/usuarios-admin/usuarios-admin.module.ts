import type { BdDrizzle } from '../../shared/bd/conexion';
import type { ResolverActor } from '../../shared/sesion';
import { BetterAuthAdapter, crearBetterAuth, type ConfigAuth } from './infraestructura/better-auth.adapter';
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
    rutas: crearRutasAuth(autenticacion),
    /** API pública: actor autenticado según la sesión del servidor. */
    resolverActor,
  };
}
