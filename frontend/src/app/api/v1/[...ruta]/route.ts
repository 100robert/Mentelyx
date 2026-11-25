import { getCloudflareContext } from '@opennextjs/cloudflare';

/**
 * Pasarela /api/v1/* → Worker de la API (service binding `API`). Mantiene el mismo origen para las cookies de Better
 * Auth (SameSite=Lax, HttpOnly) y no añade lógica: método, cabeceras y cuerpo pasan tal cual. Nunca se cachea.
 */
export const dynamic = 'force-dynamic';

const SEGMENTO = /^[A-Za-z0-9_.:-]{1,200}$/;

async function reenviar(req: Request, ctx: { params: Promise<{ ruta: string[] }> }) {
  const { ruta } = await ctx.params;
  if (!ruta.every((s) => SEGMENTO.test(s) && s !== '..' && s !== '.')) {
    return Response.json({ ok: false, error: { code: 'RECURSO_NO_ENCONTRADO', message: 'Ruta no encontrada.', recuperable: false } }, { status: 404 });
  }
  const destino = new URL(`/api/v1/${ruta.join('/')}${new URL(req.url).search}`, 'https://api.interno');
  const headers = new Headers(req.headers);
  headers.delete('host');
  const init: RequestInit = { method: req.method, headers, redirect: 'manual' };
  if (req.method !== 'GET' && req.method !== 'HEAD') init.body = await req.arrayBuffer();
  const { env } = await getCloudflareContext({ async: true });
  const r = await env.API.fetch(new Request(destino, init));
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: r.headers });
}

export { reenviar as GET, reenviar as POST, reenviar as PATCH, reenviar as PUT, reenviar as DELETE };
