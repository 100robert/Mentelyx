/**
 * Origen público del sitio para URL absolutas (metadatos Open Graph, robots y sitemap). El dominio de producción aún no está
 * contratado: se define con NEXT_PUBLIC_SITIO_URL en el build; en local se usa el Worker de la web (puerto 8788).
 */
export const URL_SITIO = (process.env.NEXT_PUBLIC_SITIO_URL ?? 'http://localhost:8788').replace(/\/$/, '');
