/**
 * Documentación OpenAPI 3.1 y Swagger UI (Sprint 2, actividad 4). El documento se genera desde los mismos esquemas Zod
 * que validan cada ruta (`@hono/zod-openapi`), así que no puede divergir de la validación real; aquí solo se añaden
 * la agrupación por módulo (M1–M6) y los esquemas de seguridad que aplican las capas transversales:
 *  - `sesion`: cookie HttpOnly de Better Auth (`mentelyx.session_token`), exigida por cada caso de uso privado;
 *  - `csrf`: cabecera `X-CSRF-Token` (GET /auth/csrf) exigida en toda mutación, junto con un `Origin` permitido.
 */
type Operacion = { tags?: string[]; security?: Array<Record<string, string[]>>; responses?: Record<string, unknown> };
type Documento = { paths?: Record<string, Record<string, Operacion>>; components?: Record<string, unknown>; tags?: Array<{ name: string; description: string }> };

const MODULOS: Array<[RegExp, string, string]> = [
  [/^\/(auth|cuenta)\b/, 'M1 · Usuarios y cuenta', 'Registro, sesión, perfil, preferencias y seguridad de la cuenta (Better Auth).'],
  [/^\/(espacios|carpetas)\b/, 'M2 · Contenidos y carpetas', 'Temas privados, fuentes (TXT, MD y texto de PDF) y carpetas por módulo.'],
  [/^\/(preparacion|preparaciones|intentos|tarjetas)\b/, 'M3 · Preparación y evaluaciones', 'Preparaciones, plan, banco de preguntas, intentos, calificación oficial y tarjetas.'],
  [/^\/suscripciones\b/, 'M5 · Suscripciones y recursos', 'Derechos y recursos del plan del periodo.'],
  [/^\/tutor-ia\b/, 'M6 · Tutor IA y RAG', 'Conversaciones, consultas con fuentes, bloques educativos y estado de la sesión.'],
];
const PLATAFORMA = 'Plataforma';
const PUBLICAS = new Set(['get /salud', 'get /docs', 'get /auth/csrf', 'post /auth/registro', 'post /auth/login', 'get /auth/sesion']);
const MUTACIONES = new Set(['post', 'put', 'patch', 'delete']);

export function enriquecerOpenApi<T extends object>(entrada: T): T {
  const doc = entrada as unknown as Documento;
  for (const [ruta, operaciones] of Object.entries(doc.paths ?? {})) {
    const modulo = MODULOS.find(([re]) => re.test(ruta));
    for (const [metodo, op] of Object.entries(operaciones)) {
      op.tags = [modulo?.[1] ?? PLATAFORMA];
      const clave = `${metodo} ${ruta}`;
      if (PUBLICAS.has(clave)) op.security = MUTACIONES.has(metodo) ? [{ csrf: [] }] : [];
      else op.security = MUTACIONES.has(metodo) ? [{ sesion: [], csrf: [] }] : [{ sesion: [] }];
      if (MUTACIONES.has(metodo) && op.responses && !op.responses['403']) op.responses['403'] = { description: 'Origin no permitido o token CSRF ausente o inválido (NO_AUTORIZADO)' };
    }
  }
  doc.tags = [{ name: PLATAFORMA, description: 'Salud, documentación y protección CSRF.' }, ...MODULOS.map(([, name, description]) => ({ name, description }))];
  doc.components = {
    ...(doc.components ?? {}),
    securitySchemes: {
      sesion: { type: 'apiKey', in: 'cookie', name: 'mentelyx.session_token', description: 'Cookie HttpOnly que crea POST /auth/login o /auth/registro.' },
      csrf: { type: 'apiKey', in: 'header', name: 'x-csrf-token', description: 'Token de GET /auth/csrf, ligado a la sesión. Las mutaciones exigen además un Origin permitido.' },
    },
  };
  return entrada;
}

/** Swagger UI (swagger-ui-dist desde jsDelivr). En las mutaciones obtiene el token CSRF de la misma sesión antes de enviar. */
export const SWAGGER_HTML = `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>API Mentelyx · Swagger UI</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui.css">
</head><body><div id="swagger"></div>
<script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14/swagger-ui-bundle.js" crossorigin="anonymous"></script>
<script>
window.ui = SwaggerUIBundle({
  url: '/api/v1/openapi.json', dom_id: '#swagger', deepLinking: true, docExpansion: 'none', tagsSorter: 'alpha', withCredentials: true,
  requestInterceptor: async (req) => {
    req.credentials = 'same-origin';
    if (!['GET', 'HEAD', 'OPTIONS'].includes((req.method || 'GET').toUpperCase()) && !/\\/auth\\/csrf$/.test(req.url)) {
      const r = await fetch('/api/v1/auth/csrf', { credentials: 'same-origin' });
      const j = await r.json();
      req.headers['x-csrf-token'] = j.data.token;
    }
    return req;
  },
});
</script></body></html>`;
