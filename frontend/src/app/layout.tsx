import { SCRIPT_APARIENCIA } from '@/features/cuenta';
import type { Metadata, Viewport } from 'next';
import { Lexend, Source_Serif_4 } from 'next/font/google';
import './globals.css';
import { URL_SITIO } from '@/lib/sitio';

/**
 * Tipografías autoalojadas por next/font (se descargan en el build; el navegador no consulta a Google):
 * Lexend para la interfaz y los títulos; Source Serif 4 (normal y cursiva) para el material de estudio y para la voz de quien
 * aprende: las preguntas. Solo el subconjunto latino (cubre el español): con latin-ext y el eje óptico se precargaban
 * seis archivos (~527 KB) que retrasaban el LCP en redes móviles lentas (medido el 25/11/2026).
 */
const lexend = Lexend({ subsets: ['latin'], variable: '--fuente-lexend', display: 'swap' });
// Sin precarga: en redes lentas competía con el CSS; con `swap` y el respaldo ajustado de next/font el titular se pinta igual.
const serif = Source_Serif_4({ subsets: ['latin'], style: ['normal', 'italic'], variable: '--fuente-serif', display: 'swap', preload: false });

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: { default: 'Mentelyx', template: '%s · Mentelyx' },
  description: 'Mentelyx convierte la curiosidad en experiencias de aprendizaje interactivas: explicaciones visuales, modelos y un tutor que se adapta a ti.',
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
        <script dangerouslySetInnerHTML={{ __html: `document.documentElement.classList.add('js');${SCRIPT_APARIENCIA}` }} />
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
