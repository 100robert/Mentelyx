import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { CredencialesInvalidas, RegistroRechazado, type AutenticacionPort, type SesionVigente } from '../dominio/autenticacion.port';
import { authAccounts, authRateLimits, authVerifications, userSessions, users } from './schema';

export type ConfigAuth = { secret: string; baseURL: string; origenesConfiables?: string[]; produccion: boolean };

const SIETE_DIAS = 60 * 60 * 24 * 7;

/**
 * Better Auth con su adaptador Drizzle sobre el mismo esquema (ADR-075; seguridad, sección 3).
 * Sesiones solo en SQL; límites de tasa en base de datos; sin rastreo de IP; cookies Secure fuera de desarrollo.
 */
export function crearBetterAuth(db: BdDrizzle, config: ConfigAuth) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: '/api/v1/auth/biblioteca',
    // CSRF: solo se aceptan peticiones con estado desde el origen público y los orígenes de desarrollo declarados.
    trustedOrigins: config.origenesConfiables ?? [],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user: users, session: userSessions, account: authAccounts, verification: authVerifications, rateLimit: authRateLimits },
    }),
    emailAndPassword: { enabled: true, autoSignIn: true },
    session: { expiresIn: SIETE_DIAS, cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 30 },
    advanced: {
      cookiePrefix: 'mentelyx',
      useSecureCookies: config.produccion,
      database: { generateId: 'uuid' },
      ipAddress: { disableIpTracking: true },
    },
    telemetry: { enabled: false },
  });
}

type Auth = ReturnType<typeof crearBetterAuth>;

export class BetterAuthAdapter implements AutenticacionPort {
  constructor(private readonly auth: Auth) {}

  async registrar(datos: { nombre: string; correo: string; contrasena: string }, entrada: Headers) {
    try {
      const { headers, response } = await this.auth.api.signUpEmail({
        body: { name: datos.nombre, email: datos.correo, password: datos.contrasena },
        headers: entrada,
        returnHeaders: true,
      });
      return { usuarioId: response.user.id, cabeceras: headers };
    } catch (e) {
      if (e instanceof APIError) throw new RegistroRechazado();
      throw e;
    }
  }

  async iniciarSesion(datos: { correo: string; contrasena: string }, entrada: Headers) {
    try {
      const { headers, response } = await this.auth.api.signInEmail({
        body: { email: datos.correo, password: datos.contrasena },
        headers: entrada,
        returnHeaders: true,
      });
      return { usuarioId: response.user.id, cabeceras: headers };
    } catch (e) {
      if (e instanceof APIError) throw new CredencialesInvalidas();
      throw e;
    }
  }

  async cerrarSesion(entrada: Headers) {
    const { headers } = await this.auth.api.signOut({ headers: entrada, returnHeaders: true });
    return { cabeceras: headers };
  }

  async obtenerSesion(entrada: Headers): Promise<SesionVigente | null> {
    const resultado = await this.auth.api.getSession({ headers: entrada, query: { disableCookieCache: true } });
    if (!resultado) return null;
    return { usuarioId: resultado.user.id, expiraEn: new Date(resultado.session.expiresAt).toISOString() };
  }
}
