import { getCloudflareContext } from '@opennextjs/cloudflare';
import { cookies } from 'next/headers';

export type Fallo = { code: string; message: string; recuperable: boolean; details?: Record<string, unknown> };
export type Resultado<T> = { estado: number; datos: T | undefined; error: Fallo | undefined };

/**
 * Llamada del servidor de Next.js a la API Hono por el service binding `API` (sin salir a Internet), reenviando solo
 * las cookies de sesión de Mentelyx. Se usa en páginas dinámicas (SSR autenticado); nunca en páginas cacheadas.
 */
export async function apiServidor<T>(ruta: string, init: RequestInit = {}): Promise<Resultado<T>> {
  const jar = await cookies();
  const cookie = jar
    .getAll()
    .filter((c) => c.name.includes('mentelyx.'))
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');
  const headers = new Headers(init.headers);
  if (cookie) headers.set('cookie', cookie);
  const { env } = await getCloudflareContext({ async: true });
  const r = await env.API.fetch(new Request(`https://api.interno/api/v1${ruta}`, { ...init, headers }));
  const cuerpo = (await r.json().catch(() => null)) as { ok: boolean; data?: T; error?: Fallo } | null;
  return { estado: r.status, datos: cuerpo?.ok ? cuerpo.data : undefined, error: cuerpo && !cuerpo.ok ? cuerpo.error : undefined };
}

export async function sesionActual(): Promise<{ usuarioId: string; expiraEn: string } | null> {
  const r = await apiServidor<{ usuarioId: string; expiraEn: string }>('/auth/sesion');
  return r.estado === 200 && r.datos ? r.datos : null;
}
