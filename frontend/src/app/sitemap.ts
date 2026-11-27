import type { MetadataRoute } from 'next';
import { URL_SITIO } from '@/lib/sitio';

/** Mapa del sitio con las páginas públicas existentes. */
export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${URL_SITIO}/`, changeFrequency: 'monthly', priority: 1 },
    { url: `${URL_SITIO}/planes`, changeFrequency: 'monthly', priority: 0.6 },
    ...['/privacidad', '/terminos', '/accesibilidad', '/creditos'].map((ruta) => ({ url: `${URL_SITIO}${ruta}`, changeFrequency: 'yearly' as const, priority: 0.2 })),
  ];
}
