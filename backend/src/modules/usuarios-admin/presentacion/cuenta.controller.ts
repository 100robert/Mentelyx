import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { Fallo, exito } from '@mentelyx/contratos';
import { ErrorAplicacion } from '../../../shared/errores';
import { ganchoValidacion, responderFallo, responderOk, type VariablesBase } from '../../../shared/http';
import { CredencialesInvalidas, type AutenticacionPort, type PreferenciasRepositorio } from '../dominio/autenticacion.port';
import type { LimiteAutenticacionPort } from '../dominio/limite-autenticacion.port';

/**
 * Cuenta, preferencias y seguridad de la cuenta (diseño de API, 12.3 y 12.10). Todo sale de la sesión del servidor:
 * nunca se acepta un identificador de usuario del cliente. El cambio de contraseña exige la actual, comparte el
 * límite de intentos de M1 y revoca las demás sesiones. Recuperar/verificar por correo y eliminar la cuenta quedan
 * pendientes: requieren proveedor de correo y el procedimiento de borrado (persistencia, sección 11).
 */
const json = <T extends z.ZodType>(schema: T) => ({ content: { 'application/json': { schema } } });
const errores = { 400: { description: 'Entrada inválida', ...json(Fallo) }, 401: { description: 'Sin sesión', ...json(Fallo) }, 403: { description: 'Origen o CSRF inválido', ...json(Fallo) } };
const HERRAMIENTAS = ['formula', 'pasos', 'grafico', 'vectores', 'tabla', 'linea-tiempo', 'codigo', 'comparacion', 'ejercicio', 'obra', 'modelo-3d', 'pdf'] as const;

const Cuenta = z.object({ usuarioId: z.uuid(), nombre: z.string(), correo: z.string(), correoVerificado: z.boolean(), tipoCuenta: z.literal('ESTUDIANTE'), creadaEn: z.string() });
const CambiarNombre = z.strictObject({ nombre: z.string().trim().min(2).max(120) });
const Preferencias = z.strictObject({
  profundidad: z.enum(['inicial', 'intermedio', 'avanzado']).nullable(),
  herramientasVisuales: z.array(z.enum(HERRAMIENTAS)).max(HERRAMIENTAS.length),
  idioma: z.literal('es'),
});
const CambioContrasena = z.strictObject({ actual: z.string().min(1).max(128), nueva: z.string().min(8).max(128) });
const Sesion = z.object({ id: z.string(), creadaEn: z.string(), expiraEn: z.string(), actual: z.boolean(), dispositivo: z.string().nullable() });

const rutas = {
  cuenta: createRoute({ method: 'get', path: '/cuenta/me', responses: { 200: { description: 'Datos de la cuenta', ...json(exito(Cuenta)) }, ...errores } }),
  nombre: createRoute({ method: 'patch', path: '/cuenta/me', request: { body: { ...json(CambiarNombre), required: true } }, responses: { 200: { description: 'Nombre actualizado', ...json(exito(Cuenta)) }, ...errores } }),
  preferencias: createRoute({ method: 'get', path: '/cuenta/me/preferencias', responses: { 200: { description: 'Preferencias (o valores por omisión)', ...json(exito(Preferencias.extend({ actualizadasEn: z.string().nullable() }))) }, ...errores } }),
  guardarPreferencias: createRoute({
    method: 'put',
    path: '/cuenta/me/preferencias',
    request: { body: { ...json(Preferencias), required: true } },
    responses: { 200: { description: 'Preferencias guardadas', ...json(exito(Preferencias.extend({ actualizadasEn: z.string().nullable() }))) }, ...errores },
  }),
  contrasena: createRoute({
    method: 'post',
    path: '/auth/contrasena/cambio',
    request: { body: { ...json(CambioContrasena), required: true } },
    responses: { 200: { description: 'Contraseña cambiada; las demás sesiones se revocaron', ...json(exito(z.object({ otrasSesionesRevocadas: z.literal(true) }))) }, ...errores, 429: { description: 'Límite de intentos', ...json(Fallo) } },
  }),
  sesiones: createRoute({ method: 'get', path: '/auth/sesiones', responses: { 200: { description: 'Sesiones activas (sin tokens)', ...json(exito(z.array(Sesion))) }, ...errores } }),
  revocar: createRoute({
    method: 'delete',
    path: '/auth/sesiones/{id}',
    request: { params: z.object({ id: z.string().min(1).max(64) }) },
    responses: { 200: { description: 'Sesión revocada', ...json(exito(z.object({ revocada: z.literal(true) }))) }, ...errores, 404: { description: 'No es una sesión de la cuenta', ...json(Fallo) } },
  }),
};

export function crearRutasCuenta(auth: AutenticacionPort, preferencias: PreferenciasRepositorio, limite: LimiteAutenticacionPort, ahora: () => Date = () => new Date()) {
  const app = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  const privado = (c: { header: (k: string, v: string) => void }) => c.header('Cache-Control', 'private, no-store');
  const exigirCuenta = async (h: Headers) => {
    const c = await auth.cuenta(h);
    if (!c) throw new ErrorAplicacion('NO_AUTENTICADO', 'Inicia sesión para continuar.');
    return c;
  };

  app.openapi(rutas.cuenta, async (c) => {
    privado(c);
    return responderOk(c, await exigirCuenta(c.req.raw.headers)) as never;
  });
  app.openapi(rutas.nombre, async (c) => {
    await exigirCuenta(c.req.raw.headers);
    await auth.cambiarNombre(c.req.raw.headers, c.req.valid('json').nombre);
    privado(c);
    return responderOk(c, await exigirCuenta(c.req.raw.headers)) as never;
  });
  app.openapi(rutas.preferencias, async (c) => {
    const cuenta = await exigirCuenta(c.req.raw.headers);
    privado(c);
    return responderOk(c, await preferencias.obtener(cuenta.usuarioId)) as never;
  });
  app.openapi(rutas.guardarPreferencias, async (c) => {
    const cuenta = await exigirCuenta(c.req.raw.headers);
    const p = c.req.valid('json');
    privado(c);
    return responderOk(c, await preferencias.guardar(cuenta.usuarioId, { ...p, herramientasVisuales: [...new Set(p.herramientasVisuales)] }, ahora())) as never;
  });
  app.openapi(rutas.contrasena, async (c) => {
    const cuenta = await exigirCuenta(c.req.raw.headers);
    // Mismo límite que el ingreso (por correo e IP confiable): evita adivinar la contraseña actual con la sesión abierta.
    await limite.consumir(cuenta.correo, c.req.header('cf-connecting-ip'));
    const { actual, nueva } = c.req.valid('json');
    try {
      const { cabeceras } = await auth.cambiarContrasena(c.req.raw.headers, actual, nueva);
      const res = responderOk(c, { otrasSesionesRevocadas: true as const });
      for (const cookie of cabeceras.getSetCookie()) res.headers.append('Set-Cookie', cookie);
      res.headers.set('Cache-Control', 'private, no-store');
      return res as never;
    } catch (e) {
      if (e instanceof CredencialesInvalidas) return responderFallo(c, 'ENTRADA_INVALIDA', 'La contraseña actual no es correcta.') as never;
      throw e;
    }
  });
  app.openapi(rutas.sesiones, async (c) => {
    await exigirCuenta(c.req.raw.headers);
    privado(c);
    return responderOk(c, await auth.sesiones(c.req.raw.headers)) as never;
  });
  app.openapi(rutas.revocar, async (c) => {
    await exigirCuenta(c.req.raw.headers);
    if (!(await auth.revocarSesion(c.req.raw.headers, c.req.valid('param').id))) return responderFallo(c, 'RECURSO_NO_ENCONTRADO', 'Sesión no encontrada.') as never;
    privado(c);
    return responderOk(c, { revocada: true as const }) as never;
  });
  return app;
}
