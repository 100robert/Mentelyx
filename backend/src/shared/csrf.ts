import type { Context, MiddlewareHandler } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import { responderFallo, responderOk } from './http';

const SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);
const UNA_HORA = 3600;
const UUID = /^[0-9a-f-]{36}$/;
const hex = (bytes: ArrayBuffer) => [...new Uint8Array(bytes)].map((x) => x.toString(16).padStart(2, '0')).join('');

/** Token firmado con Web Crypto, ligado a la cookie de sesión o a una cookie anónima HttpOnly antes del login.
 * No sustituye Origin/Fetch Metadata ni valida una sesión: la autenticación sigue perteneciendo a M1.
 * GET entrega el token por JSON privado; una web ajena no puede leerlo (sin CORS). Nunca va en URL ni logs.
 */
export function crearProteccionCsrf(secreto: string, seguro: boolean) {
  const anonima = seguro ? '__Host-mentelyx.csrf' : 'mentelyx.csrf';
  const sesion = seguro ? '__Secure-mentelyx.session_token' : 'mentelyx.session_token';
  let clave: Promise<CryptoKey> | undefined;
  const key = () => (clave ??= crypto.subtle.importKey('raw', new TextEncoder().encode(secreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']));
  const contexto = (c: Context) => {
    const tokenSesion = getCookie(c, sesion);
    if (tokenSesion) return `sesion:${tokenSesion}`;
    const pre = getCookie(c, anonima);
    return pre && UUID.test(pre) ? `anonima:${pre}` : null;
  };
  const mensaje = (ctx: string, vence: string, nonce: string) => new TextEncoder().encode(JSON.stringify(['mentelyx:csrf:v1', ctx, vence, nonce]));

  const emitir = async (c: Context) => {
    // No permitir que una navegación/imagen de otro sitio establezca la cookie previa al login.
    if (c.req.header('sec-fetch-site') === 'cross-site') return responderFallo(c, 'NO_AUTORIZADO', 'Origen no permitido.');
    let ctx = contexto(c);
    if (!ctx) {
      const valor = crypto.randomUUID();
      setCookie(c, anonima, valor, { httpOnly: true, secure: seguro, sameSite: 'Strict', path: '/', maxAge: UNA_HORA });
      ctx = `anonima:${valor}`;
    }
    const vence = String(Math.floor(Date.now() / 1000) + UNA_HORA);
    const nonce = crypto.randomUUID();
    const firma = hex(await crypto.subtle.sign('HMAC', await key(), mensaje(ctx, vence, nonce)));
    c.header('Cache-Control', 'private, no-store');
    c.header('Vary', 'Cookie');
    return responderOk(c, { token: `${vence}.${nonce}.${firma}` });
  };

  const verificar: MiddlewareHandler = async (c, next) => {
    if (SEGUROS.has(c.req.method)) return next();
    const token = c.req.header('x-csrf-token') ?? '';
    const partes = /^(\d{10})\.([0-9a-f-]{36})\.([0-9a-f]{64})$/.exec(token);
    const ctx = contexto(c);
    const ahora = Math.floor(Date.now() / 1000);
    if (!partes || !ctx || Number(partes[1]) <= ahora || Number(partes[1]) > ahora + UNA_HORA) {
      return responderFallo(c, 'NO_AUTORIZADO', 'Protección CSRF inválida o vencida.');
    }
    const firma = Uint8Array.from(partes[3]!.match(/../g)!, (b) => parseInt(b, 16));
    if (!(await crypto.subtle.verify('HMAC', await key(), firma, mensaje(ctx, partes[1]!, partes[2]!)))) {
      return responderFallo(c, 'NO_AUTORIZADO', 'Protección CSRF inválida o vencida.');
    }
    return next();
  };
  return { emitir, verificar };
}
