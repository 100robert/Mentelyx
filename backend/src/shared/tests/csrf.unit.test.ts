import { Hono } from 'hono';
import { describe, expect, it } from 'vitest';
import { crearProteccionCsrf } from '../csrf';
import { verificarOrigen } from '../http';

const ORIGEN = 'https://app.example.test';
const crear = (seguro = false) => {
  const app = new Hono();
  const csrf = crearProteccionCsrf('secreto-sintetico-para-pruebas-000000000', seguro);
  app.use('*', verificarOrigen([ORIGEN]), csrf.verificar);
  app.get('/auth/csrf', csrf.emitir);
  app.post('/mutacion', (c) => c.json({ cambiado: true }));
  return app;
};
async function obtener(app: ReturnType<typeof crear>, cookie = '') {
  const r = await app.request('/auth/csrf', { headers: { cookie } });
  const { data } = await r.json() as { data: { token: string } };
  return { token: data.token, cookie: cookie || r.headers.getSetCookie().map((c) => c.split(';')[0]).join('; '), r };
}
describe('CSRF y origen en la frontera HTTP', () => {
  it('admite token anónimo válido y cookie HttpOnly antes del registro', async () => {
    const app = crear(); const t = await obtener(app);
    expect(t.r.headers.get('cache-control')).toContain('no-store');
    expect(t.r.headers.get('set-cookie')).toContain('HttpOnly');
    expect((await app.request('/mutacion', { method: 'POST', headers: { origin: ORIGEN, cookie: t.cookie, 'x-csrf-token': t.token } })).status).toBe(200);
  });
  it.each([undefined, 'null', 'https://ajeno.example.test'])('rechaza origen ausente, opaco o ajeno: %s', async (origin) => {
    const app = crear(); const t = await obtener(app);
    const headers = new Headers({ cookie: t.cookie, 'x-csrf-token': t.token });
    if (origin) headers.set('origin', origin);
    expect((await app.request('/mutacion', { method: 'POST', headers })).status).toBe(403);
  });
  it('rechaza Fetch Metadata cross-site aunque el Origin parezca permitido', async () => {
    const app = crear(); const t = await obtener(app);
    expect((await app.request('/mutacion', { method: 'POST', headers: { origin: ORIGEN, cookie: t.cookie, 'x-csrf-token': t.token, 'sec-fetch-site': 'cross-site' } })).status).toBe(403);
    expect((await app.request('/auth/csrf', { headers: { 'sec-fetch-site': 'cross-site' } })).status).toBe(403);
  });
  it('rechaza token ausente, adulterado y ligado a otro navegador', async () => {
    const app = crear(); const t = await obtener(app); const otro = await obtener(app);
    for (const [token, cookie] of [['', t.cookie], [t.token + '0', t.cookie], [t.token, otro.cookie]]) {
      expect((await app.request('/mutacion', { method: 'POST', headers: { origin: ORIGEN, cookie: cookie!, 'x-csrf-token': token! } })).status).toBe(403);
    }
  });
  it('invalida el token anterior al cambiar la sesión y usa cookies con prefijo seguro', async () => {
    const app = crear(true); const pre = await obtener(app);
    expect(pre.r.headers.get('set-cookie')).toContain('__Host-mentelyx.csrf=');
    expect(pre.r.headers.get('set-cookie')).toContain('Secure');
    const sesion = '__Secure-mentelyx.session_token=sesion-ficticia-A';
    const t = await obtener(app, sesion);
    expect((await app.request('/mutacion', { method: 'POST', headers: { origin: ORIGEN, cookie: sesion, 'x-csrf-token': pre.token } })).status).toBe(403);
    expect((await app.request('/mutacion', { method: 'POST', headers: { origin: ORIGEN, cookie: sesion, 'x-csrf-token': t.token } })).status).toBe(200);
    expect((await app.request('/mutacion', { method: 'POST', headers: { origin: ORIGEN, cookie: '__Secure-mentelyx.session_token=sesion-ficticia-B', 'x-csrf-token': t.token } })).status).toBe(403);
  });
});
