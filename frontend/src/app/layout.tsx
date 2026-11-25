import type { Metadata, Viewport } from 'next';
import { Lexend, Source_Serif_4 } from 'next/font/google';
import './globals.css';

/**
 * Tipografías autoalojadas por next/font (se descargan en el build; el navegador no consulta a Google):
 * Lexend para la interfaz y los títulos, Source Serif 4 para el material de estudio (explicaciones y pasajes citados).
 */
const lexend = Lexend({ subsets: ['latin', 'latin-ext'], variable: '--fuente-lexend', display: 'swap' });
const serif = Source_Serif_4({ subsets: ['latin', 'latin-ext'], variable: '--fuente-serif', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'Mentelyx', template: '%s · Mentelyx' },
  description: 'Aprendizaje con fuentes propias y un Tutor que cita lo que usa.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/marca/icono-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/marca/apple-touch-icon.png',
  },
};

// Azul marino de la marca (#0A1F44) para la barra del navegador y la PWA.
export const viewport: Viewport = { themeColor: 'rgb(10 31 68)', width: 'device-width', initialScale: 1 };

/** Diseño raíz estático: cada grupo de rutas aporta su propio marco (público, acceso o aplicación). */
export default function RaizLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${lexend.variable} ${serif.variable}`} suppressHydrationWarning>
      <head>
        {/* Con JavaScript, los paneles móviles empiezan cerrados; sin él, todo el contenido queda visible en el flujo. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
      </head>
      <body>
        <a className="saltar" href="#principal">
          Saltar al contenido
        </a>
        {children}
      </body>
    </html>
  );
}
