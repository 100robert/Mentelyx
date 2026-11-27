import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { LimiteAutenticacionPort } from '../dominio/limite-autenticacion.port';
import { Fallo, exito } from '@mentelyx/contratos';
import { ganchoValidacion, responderFallo, responderOk, type VariablesBase } from '../../../shared/http';
import { CredencialesInvalidas, RegistroRechazado, type AutenticacionPort } from '../dominio/autenticacion.port';

// API, secciones 2.1 y 4.2. Prototipo de I-0: el tipo de cuenta, el consentimiento y la edad se añaden en I-1.
const Registro = z.strictObject({
  nombre: z.string().trim().min(2).max(120),
  correo: z.email().max(254),
  contrasena: z.string().min(8).max(128),
});
const Login = z.strictObject({ correo: z.email().max(254), contrasena: z.string().min(1).max(128) });
// API 12.3: la sesión incluye nombre y correo para la cabecera y la configuración (sin consultar otra ruta).
const Sesion = z.strictObject({ usuarioId: z.uuid(), expiraEn: z.iso.datetime(), nombre: z.string(), correo: z.string(), correoVerificado: z.boolean() });
const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });

const rutas = {
  registro: createRoute({
    method: 'post',
    path: '/auth/registro',
    request: { body: { ...json(Registro), required: true } },
    responses: { 201: { description: 'Cuenta creada', ...json(exito(z.strictObject({ usuarioId: z.uuid() }))) }, 400: { description: 'Rechazado', ...json(Fallo) }, 403: { description: 'Origen o CSRF inválido', ...json(Fallo) }, 429: { description: 'Límite de intentos', ...json(Fallo) }, 503: { description: 'Control no disponible', ...json(Fallo) } },
  }),
  login: createRoute({
    method: 'post',
    path: '/auth/login',
    request: { body: { ...json(Login), required: true } },
    responses: { 200: { description: 'Sesión iniciada', ...json(exito(z.strictObject({ usuarioId: z.uuid() }))) }, 401: { description: 'Credenciales inválidas', ...json(Fallo) }, 403: { description: 'Origen o CSRF inválido', ...json(Fallo) }, 429: { description: 'Límite de intentos', ...json(Fallo) }, 503: { description: 'Control no disponible', ...json(Fallo) } },
  }),
  logout: createRoute({ method: 'post', path: '/auth/logout', responses: { 200: { description: 'Sesión cerrada', ...json(exito(z.strictObject({}))) } } }),
  sesion: createRoute({
    method: 'get',
    path: '/auth/sesion',
    responses: { 200: { description: 'Sesión vigente', ...json(exito(Sesion)) }, 401: { description: 'Sin sesión', ...json(Fallo) } },
  }),
};

/** Copia Set-Cookie y demás cabeceras de la biblioteca sin perderlas (seguridad, sección 3.1). */
function copiarCabeceras(origen: Headers, destino: Headers) {
  for (const cookie of origen.getSetCookie()) destino.append('Set-Cookie', cookie);
}

export function crearRutasAuth(auth: AutenticacionPort, limite: LimiteAutenticacionPort) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });

  app.openapi(rutas.registro, async (c) => {
    const datos = c.req.valid('json');
    await limite.consumir(datos.correo, c.req.header('cf-connecting-ip'));
    try {
      const { usuarioId, cabeceras } = await auth.registrar(datos, c.req.raw.headers);
      const res = responderOk(c, { usuarioId }, 201);
      copiarCabeceras(cabeceras, res.headers);
      res.headers.set('Cache-Control', 'private, no-store');
      return res as never;
    } catch (e) {
      if (e instanceof RegistroRechazado) return responderFallo(c, 'ENTRADA_INVALIDA', e.message) as never;
      throw e;
    }
  });

  app.openapi(rutas.login, async (c) => {
    const datos = c.req.valid('json');
    await limite.consumir(datos.correo, c.req.header('cf-connecting-ip'));
    try {
      const { usuarioId, cabeceras } = await auth.iniciarSesion(datos, c.req.raw.headers);
      const res = responderOk(c, { usuarioId });
      copiarCabeceras(cabeceras, res.headers);
      res.headers.set('Cache-Control', 'private, no-store');
      return res as never;
    } catch (e) {
      if (e instanceof CredencialesInvalidas) return responderFallo(c, 'NO_AUTENTICADO', e.message) as never;
      throw e;
    }
  });

  app.openapi(rutas.logout, async (c) => {
    const { cabeceras } = await auth.cerrarSesion(c.req.raw.headers);
    const res = responderOk(c, {});
    copiarCabeceras(cabeceras, res.headers);
    return res as never;
  });

  app.openapi(rutas.sesion, async (c) => {
    const sesion = await auth.obtenerSesion(c.req.raw.headers);
    c.header('Cache-Control', 'private, no-store');
    if (!sesion) return responderFallo(c, 'NO_AUTENTICADO', 'No hay una sesión vigente.') as never;
    return responderOk(c, sesion) as never;
  });

  return app;
}
