import { env, exports } from 'cloudflare:workers';
import { describe, expect, it } from 'vitest';
import { crearConexionBd } from '../src/shared/bd/conexion';
import { crearModuloSuscripcionesPagos } from '../src/modules/suscripciones-pagos';

// PR-INF-01 (parte local, 21/11/2026): el Worker de la API dentro de workerd (Miniflare), con nodejs_compat.
// Comprueba Hono + Zod jitless, Better Auth con Drizzle sobre el driver serverless de Neon, transacciones Drizzle y
// lecturas Kysely en el runtime de Workers. Datos sintéticos; PostgreSQL de Docker Compose vía wsproxy.
const API = 'http://localhost/api/v1';
const worker = (exports as unknown as { default: Fetcher }).default;

const correo = `prinf01+${crypto.randomUUID().slice(0, 8)}@ejemplo.test`;
const contrasena = 'Clave-sintetica-2026';
let cookie = '';

const enviar = (ruta: string, init: RequestInit = {}) =>
  worker.fetch(`${API}${ruta}`, { ...init, headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...init.headers } });

const cookiesDe = (r: Response) =>
  r.headers
    .getSetCookie()
    .map((c) => c.split(';')[0])
    .join('; ');

describe('PR-INF-01 · API Hono en workerd', () => {
  it('responde /salud con el envoltorio de la API y los siete módulos', async () => {
    const r = await enviar('/salud');
    expect(r.status).toBe(200);
    const cuerpo = (await r.json()) as { ok: boolean; data: { modulos: string[] }; meta: { requestId: string } };
    expect(cuerpo.ok).toBe(true);
    expect(cuerpo.data.modulos).toHaveLength(7);
    expect(r.headers.get('x-request-id')).toBe(cuerpo.meta.requestId);
  });

  it('Better Auth: registro, sesión, login fallido, login y cierre de sesión', async () => {
    const registro = await enviar('/auth/registro', { method: 'POST', body: JSON.stringify({ nombre: 'Prueba Workerd', correo, contrasena }) });
    expect(registro.status).toBe(201);
    cookie = cookiesDe(registro);
    expect(cookie).toMatch(/mentelyx\.session_token=/);
    const usuarioId = ((await registro.json()) as { data: { usuarioId: string } }).data.usuarioId;

    const sesion = await enviar('/auth/sesion');
    expect(sesion.status).toBe(200);
    expect(((await sesion.json()) as { data: { usuarioId: string } }).data.usuarioId).toBe(usuarioId);
    expect(sesion.headers.get('cache-control')).toContain('no-store');

    cookie = '';
    const fallido = await enviar('/auth/login', { method: 'POST', body: JSON.stringify({ correo, contrasena: 'otra-clave-incorrecta' }) });
    expect(fallido.status).toBe(401);
    const login = await enviar('/auth/login', { method: 'POST', body: JSON.stringify({ correo, contrasena }) });
    expect(login.status).toBe(200);
    cookie = cookiesDe(login);

    expect((await enviar('/auth/logout', { method: 'POST' })).status).toBe(200);
    expect((await enviar('/auth/sesion')).status).toBe(401);
    cookie = '';
  });

  it('rechaza entradas fuera de contrato con 400 y el envoltorio de error', async () => {
    const r = await enviar('/auth/registro', { method: 'POST', body: JSON.stringify({ nombre: 'X', correo: 'no-es-correo', contrasena: '1', extra: true }) });
    expect(r.status).toBe(400);
    expect(((await r.json()) as { ok: boolean; error: { code: string } }).error.code).toBe('ENTRADA_INVALIDA');
  });

  it('Drizzle (transacción interactiva) y Kysely (lectura) contra Neon serverless dentro de workerd', async () => {
    const conexion = crearConexionBd({ DATABASE_URL: env.DATABASE_URL!, NEON_WS_PROXY: env.NEON_WS_PROXY });
    try {
      const m5 = crearModuloSuscripcionesPagos({ db: conexion.db, pool: conexion.pool, resolverActor: async () => null, reloj: { hoy: () => '2026-11-21' } });
      const actor = crypto.randomUUID();
      expect((await m5.iniciarRecursosDelPeriodo({ actorId: actor, producto: 'EST_GRATUITO', policyVersion: 'piloto-2026-11-20', inicio: '2026-11-01', fin: '2026-12-01' })).creados).toBe(6);
      const api = m5.recursosDePlan('M6');
      const reservas = await Promise.all(
        Array.from({ length: 4 }, (_, i) => api.reservarRecursoPlan({ actorId: actor, recurso: 'RAZONAMIENTO_PROFUNDO', cantidad: 1, operationKey: `workerd:${actor.slice(0, 8)}:${i}` })),
      );
      expect(reservas.filter((r) => r.estado === 'RESERVADO')).toHaveLength(2); // límite del plan Gratuito: 2
      const derechos = await api.consultarDerechosPlan(actor);
      expect(derechos?.recursos.find((r) => r.recurso === 'RAZONAMIENTO_PROFUNDO')).toMatchObject({ limite: 2, reservado: 2, disponibles: 0 });
    } finally {
      await conexion.cerrar();
    }
  });
});
