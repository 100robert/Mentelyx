import { Hono } from 'hono';
import { crearProteccionCsrf } from '../../backend/src/shared/csrf';
import { manejarErrores, responderOk, verificarOrigen } from '../../backend/src/shared/http';
import { exigirActor, exigirClaveIdempotencia } from '../../backend/src/shared/sesion';

/**
 * Autenticación y protección de sesiones (RF de M1; EQ de seguridad; hallazgos F02 de la auditoría original).
 * Se monta la misma cadena de middleware que backend/src/app.ts: Origin/Fetch Metadata → token CSRF ligado a sesión.
 */
const ORIGEN = 'https://mentelyx.test';
function app() {
  const csrf = crearProteccionCsrf('secreto-de-prueba-jest-0123456789-abcdef', false);
  const a = new Hono();
  a.use('*', verificarOrigen([ORIGEN]));
  a.use('*', csrf.verificar);
  a.onError(manejarErrores);
  a.get('/csrf', (c) => csrf.emitir(c));
  a.get('/privado', async (c) => responderOk(c, { actor: await exigirActor(async (h) => (h.get('cookie')?.includes('mentelyx.session_token=valida') ? { actorId: 'actor-1' } : null), c.req.raw.headers) }));
  a.post('/mutar', (c) => responderOk(c, { clave: exigirClaveIdempotencia(c.req.raw.headers) }));
  return a;
}
const sesion = 'mentelyx.session_token=valida';
async function token(a: Hono, cookie = sesion) {
  const r = await a.request('/csrf', { headers: { cookie } });
  return ((await r.json()) as { data: { token: string } }).data.token;
}

describe('Sesión y autorización', () => {
  it('sin sesión responde 401 NO_AUTENTICADO; con sesión, el actor sale del servidor (nunca del cuerpo)', async () => {
    const a = app();
    const sin = await a.request('/privado');
    expect(sin.status).toBe(401);
    expect(((await sin.json()) as { error: { code: string } }).error.code).toBe('NO_AUTENTICADO');
    const con = await a.request('/privado', { headers: { cookie: sesion } });
    expect(((await con.json()) as { data: { actor: string } }).data.actor).toBe('actor-1');
  });

  it('la Idempotency-Key es obligatoria en mutaciones y tiene formato acotado', async () => {
    const a = app();
    const t = await token(a);
    const base = { method: 'POST', headers: { cookie: sesion, origin: ORIGEN, 'x-csrf-token': t } };
    expect((await a.request('/mutar', base)).status).toBe(400);
    expect((await a.request('/mutar', { ...base, headers: { ...base.headers, 'idempotency-key': 'corta' } })).status).toBe(400);
    const ok = await a.request('/mutar', { ...base, headers: { ...base.headers, 'idempotency-key': 'clave-valida-123' } });
    expect(ok.status).toBe(200);
  });
});

describe('Protección CSRF y de origen (F02)', () => {
  it('rechaza mutaciones sin Origin, con Origin ajeno o con Fetch Metadata cross-site, antes de cualquier efecto', async () => {
    const a = app();
    const t = await token(a);
    const h = { cookie: sesion, 'x-csrf-token': t, 'idempotency-key': 'clave-valida-123' };
    expect((await a.request('/mutar', { method: 'POST', headers: h })).status).toBe(403);
    expect((await a.request('/mutar', { method: 'POST', headers: { ...h, origin: 'https://atacante.test' } })).status).toBe(403);
    expect((await a.request('/mutar', { method: 'POST', headers: { ...h, origin: ORIGEN, 'sec-fetch-site': 'cross-site' } })).status).toBe(403);
  });

  it('rechaza un token ausente, alterado o emitido para otra sesión; acepta el de la misma sesión', async () => {
    const a = app();
    const h = { origin: ORIGEN, cookie: sesion, 'idempotency-key': 'clave-valida-123' };
    expect((await a.request('/mutar', { method: 'POST', headers: h })).status).toBe(403);
    const t = await token(a);
    const alterado = t.slice(0, -1) + (t.endsWith('a') ? 'b' : 'a');
    expect((await a.request('/mutar', { method: 'POST', headers: { ...h, 'x-csrf-token': alterado } })).status).toBe(403);
    const deOtra = await token(a, 'mentelyx.session_token=otra');
    expect((await a.request('/mutar', { method: 'POST', headers: { ...h, 'x-csrf-token': deOtra } })).status).toBe(403);
    expect((await a.request('/mutar', { method: 'POST', headers: { ...h, 'x-csrf-token': t } })).status).toBe(200);
  });

  it('el token se entrega sin caché compartida y nunca a una petición cross-site', async () => {
    const a = app();
    const r = await a.request('/csrf', { headers: { cookie: sesion } });
    expect(r.headers.get('cache-control')).toBe('private, no-store');
    expect((await a.request('/csrf', { headers: { 'sec-fetch-site': 'cross-site' } })).status).toBe(403);
  });
});
