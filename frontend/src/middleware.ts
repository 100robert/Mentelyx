import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware en el runtime edge, el que OpenNext admite de forma estable (el middleware de Node.js, `proxy.ts`, es
 * experimental en OpenNext 1.20; ver PR-INF-01). Solo redirige a quien no tiene cookie de sesión: la autorización
 * real la hace la API en cada petición. No valida la sesión aquí.
 */
export function middleware(req: NextRequest) {
  const tieneSesion = req.cookies.getAll().some((c) => c.name.endsWith('mentelyx.session_token'));
  if (tieneSesion) return NextResponse.next();
  const url = req.nextUrl.clone();
  url.pathname = '/auth/ingresar';
  url.search = `?siguiente=${encodeURIComponent(req.nextUrl.pathname)}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/inicio/:ruta*', '/aprendizaje/:ruta*', '/examenes/:ruta*', '/fuentes/:ruta*', '/configuracion/:ruta*', '/espacios/:ruta*', '/tutor/:ruta*'],
};
