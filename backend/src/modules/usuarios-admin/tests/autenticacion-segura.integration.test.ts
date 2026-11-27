import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Hono } from 'hono';
import { sql } from 'drizzle-orm';
import { crearConexionBd, type ConexionBd } from '../../../shared/bd/conexion';
import { crearProteccionCsrf } from '../../../shared/csrf';
import { manejarErrores, verificarOrigen } from '../../../shared/http';
import { PostgresLimiteAutenticacion } from '../infraestructura/postgres-limite-autenticacion.adapter';
import { crearModuloUsuariosAdmin } from '../usuarios-admin.module';

const secreto = `secreto-sintetico-auth-${crypto.randomUUID()}`;
let conexion: ConexionBd;
const config = { secret: secreto, baseURL: 'http://localhost', produccion: false };
function appNueva() {
  const app = new Hono();
  const csrf = crearProteccionCsrf(secreto, false);
  app.use('*', verificarOrigen(['http://localhost']), csrf.verificar);
  app.onError(manejarErrores);
  app.get('/auth/csrf', csrf.emitir);
  app.route('/', crearModuloUsuariosAdmin({ db: conexion.db, auth: config }).rutas);
  return app;
}
async function proteccion(cookie = '', ip = '198.51.100.42') {
  const r = await appNueva().request('/auth/csrf', { headers: { cookie } });
  const j = await r.json() as { data: { token: string } };
  return { origin: 'http://localhost', 'cf-connecting-ip': ip, 'content-type': 'application/json', 'x-csrf-token': j.data.token, cookie: cookie || r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ') };
}
describe('M1: autenticación real, CSRF y límite SQL compartido', () => {
  beforeAll(() => { conexion = crearConexionBd({ DATABASE_URL: process.env.DATABASE_URL!, NEON_WS_PROXY: process.env.NEON_WS_PROXY }); });
  afterAll(async () => { await conexion?.cerrar(); });
  it('35 admisiones concurrentes en instancias diferentes admiten exactamente 30 por cuenta y normalizan el correo', async () => {
    const correo = `limite-${crypto.randomUUID()}@ejemplo.test`;
    const ip = '198.51.100.42';
    const r = await Promise.allSettled(Array.from({ length: 35 }, (_, i) => new PostgresLimiteAutenticacion(conexion.db, secreto).consumir(i % 2 ? correo.toUpperCase() : correo, ip)));
    expect(r.filter((x) => x.status === 'fulfilled')).toHaveLength(30);
    for (const x of r) if (x.status === 'rejected') expect(x.reason).toMatchObject({ code: 'LIMITE_TASA' });
    await expect(new PostgresLimiteAutenticacion(conexion.db, secreto).consumir(`otro-${correo}`, ip)).resolves.toBeUndefined();
    // La clave de almacenamiento no contiene la dirección; ninguna contraseña interviene en este escenario.
    const filas = await conexion.db.execute<{ key: string }>(sql`select key from m1_users.auth_rate_limits where key like 'm1-auth:v1:%'`);
    expect(filas.rows.every((f) => /^m1-auth:v1:[0-9a-f]{64}$/.test(f.key))).toBe(true);
  });
  it('limita por IP entre cuentas distintas y falla cerrado si falta la IP de Cloudflare', async () => {
    const ip = '203.0.113.15';
    const intentos = await Promise.allSettled(Array.from({ length: 121 }, (_, i) =>
      new PostgresLimiteAutenticacion(conexion.db, secreto).consumir(`ip-${i}-${crypto.randomUUID()}@ejemplo.test`, ip),
    ));
    expect(intentos.filter((x) => x.status === 'fulfilled')).toHaveLength(120);
    for (const x of intentos) if (x.status === 'rejected') expect(x.reason).toMatchObject({ code: 'LIMITE_TASA' });
    await expect(new PostgresLimiteAutenticacion(conexion.db, secreto).consumir('sin-ip@ejemplo.test', undefined)).rejects.toMatchObject({ code: 'SERVICIO_NO_DISPONIBLE' });
  });
  it('429 y Retry-After antes de Better Auth; un origen ajeno o token ausente no modifica sesiones', async () => {
    const correo = `auth-${crypto.randomUUID()}@ejemplo.test`;
    const ip = `192.0.2.${Math.floor(Math.random() * 200) + 1}`;
    const credenciales = { nombre: 'Usuario sintético', correo, contrasena: 'Clave-local-sintetica-2026' };
    const headers = await proteccion('', ip);
    const registro = await appNueva().request('/auth/registro', { method: 'POST', headers, body: JSON.stringify(credenciales) });
    expect(registro.status).toBe(201);
    const cookie = registro.headers.getSetCookie().map((c) => c.split(';')[0]).join('; ');
    const sesion = await proteccion(cookie, ip);
    for (const h of [{ ...sesion, origin: 'https://ajeno.invalid' }, { ...sesion, 'x-csrf-token': '' }]) {
      expect((await appNueva().request('/auth/logout', { method: 'POST', headers: h })).status).toBe(403);
    }
    expect((await appNueva().request('/auth/sesion', { headers: { cookie } })).status).toBe(200);
    // El registro consumió el primero; otros 29 agotan la misma política que usa el controlador real.
    for (let i = 0; i < 29; i++) await new PostgresLimiteAutenticacion(conexion.db, secreto).consumir(correo, ip);
    const login = await appNueva().request('/auth/login', { method: 'POST', headers: sesion, body: JSON.stringify({ correo, contrasena: credenciales.contrasena }) });
    expect(login.status).toBe(429);
    expect(Number(login.headers.get('retry-after'))).toBeGreaterThan(0);
    expect((await appNueva().request('/auth/logout', { method: 'POST', headers: sesion })).status).toBe(200);
    expect((await appNueva().request('/auth/sesion', { headers: { cookie } })).status).toBe(401);
  });
  it('no admite contraseñas si la persistencia del límite falla', async () => {
    const db = { execute: async () => { throw new Error('fallo simulado'); } };
    await expect(new PostgresLimiteAutenticacion(db as never, secreto).consumir('prueba@ejemplo.test', '192.0.2.1')).rejects.toMatchObject({ code: 'SERVICIO_NO_DISPONIBLE' });
  });
});
