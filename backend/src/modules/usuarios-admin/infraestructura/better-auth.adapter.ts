import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError } from 'better-auth/api';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { CredencialesInvalidas, RegistroRechazado, type AutenticacionPort, type Cuenta, type SesionActiva, type SesionVigente } from '../dominio/autenticacion.port';
import { authAccounts, authRateLimits, authVerifications, userSessions, users } from './schema';

export type ConfigAuth = { secret: string; baseURL: string; origenesConfiables?: string[]; produccion: boolean };

const SIETE_DIAS = 60 * 60 * 24 * 7;

/**
 * Better Auth con su adaptador Drizzle sobre el mismo esquema (ADR-075; seguridad, sección 3).
 * Sesiones solo en SQL; límite propio de M1 antes de auth.api; Better Auth no rastrea IP; cookies Secure fuera de desarrollo.
 */
export function crearBetterAuth(db: BdDrizzle, config: ConfigAuth) {
  return betterAuth({
    secret: config.secret,
    baseURL: config.baseURL,
    basePath: '/api/v1/auth/biblioteca',
    // trustedOrigins no protege auth.api: la frontera HTTP aplica Origin y token CSRF ligado a sesión.
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
    return {
      usuarioId: resultado.user.id,
      expiraEn: new Date(resultado.session.expiresAt).toISOString(),
      nombre: resultado.user.name,
      correo: resultado.user.email,
      correoVerificado: resultado.user.emailVerified,
    };
  }

  async cuenta(entrada: Headers): Promise<Cuenta | null> {
    const r = await this.auth.api.getSession({ headers: entrada, query: { disableCookieCache: true } });
    if (!r) return null;
    return { usuarioId: r.user.id, nombre: r.user.name, correo: r.user.email, correoVerificado: r.user.emailVerified, tipoCuenta: 'ESTUDIANTE', creadaEn: new Date(r.user.createdAt).toISOString() };
  }

  async cambiarNombre(entrada: Headers, nombre: string) {
    await this.auth.api.updateUser({ body: { name: nombre }, headers: entrada });
  }

  async cambiarContrasena(entrada: Headers, actual: string, nueva: string) {
    try {
      const { headers } = await this.auth.api.changePassword({ body: { currentPassword: actual, newPassword: nueva, revokeOtherSessions: true }, headers: entrada, returnHeaders: true });
      return { cabeceras: headers };
    } catch (e) {
      if (e instanceof APIError) throw new CredencialesInvalidas();
      throw e;
    }
  }

  async sesiones(entrada: Headers): Promise<SesionActiva[]> {
    const actual = await this.auth.api.getSession({ headers: entrada, query: { disableCookieCache: true } });
    if (!actual) return [];
    const lista = await this.auth.api.listSessions({ headers: entrada });
    // El token nunca sale del servidor: solo id, fechas y un resumen del navegador.
    return lista
      .filter((s) => new Date(s.expiresAt).getTime() > Date.now())
      .map((s) => ({
        id: s.id,
        creadaEn: new Date(s.createdAt).toISOString(),
        expiraEn: new Date(s.expiresAt).toISOString(),
        actual: s.id === actual.session.id,
        dispositivo: s.userAgent ? resumirAgente(s.userAgent) : null,
      }));
  }

  async revocarSesion(entrada: Headers, sesionId: string) {
    const lista = await this.auth.api.listSessions({ headers: entrada });
    const objetivo = lista.find((s) => s.id === sesionId);
    if (!objetivo) return false;
    await this.auth.api.revokeSession({ body: { token: objetivo.token }, headers: entrada });
    return true;
  }
}

/** Resumen legible del agente de usuario (sin versión exacta): «Chrome en Windows», «Safari en iPhone». */
function resumirAgente(ua: string): string {
  const navegador = /Edg\//.test(ua) ? 'Edge' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Navegador';
  const sistema = /Windows/.test(ua) ? 'Windows' : /iPhone|iPad/.test(ua) ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'otro sistema';
  return `${navegador} en ${sistema}`;
}
