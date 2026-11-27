import type { MetadataRoute } from 'next';
import { URL_SITIO } from '@/lib/sitio';

/** Solo las páginas públicas se indexan; el espacio personal, el acceso y la API quedan fuera. */
export const dynamic = 'force-static';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/inicio', '/aprendizaje', '/examenes', '/fuentes', '/configuracion', '/espacios', '/tutor', '/auth/', '/api/', '/dashboard', '/login', '/registro', '/biblioteca'] }],
    sitemap: `${URL_SITIO}/sitemap.xml`,
  };
}
