import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

/**
 * Next.js híbrido en Workers mediante OpenNext (ADR-074). Next.js no contiene reglas de negocio: consume la API Hono
 * por el service binding `API` (ruta /api/v1/*). Cabeceras de seguridad comunes a todas las respuestas.
 */
const config: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  transpilePackages: ['@mentelyx/contratos'],
  images: { unoptimized: true },
  // Alias fáciles de recordar hacia las rutas reales de la aplicación.
  async redirects() {
    return [
      { source: '/dashboard', destination: '/espacios', permanent: false },
      { source: '/login', destination: '/auth/ingresar', permanent: false },
      { source: '/registro', destination: '/auth/registro', permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: '/:ruta*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
        ],
      },
    ];
  },
};

export default config;

// Enlaces de Cloudflare (service binding `API`, R2) también en `next dev` (documentación de OpenNext).
if (process.env.NODE_ENV === 'development') void initOpenNextCloudflareForDev();
