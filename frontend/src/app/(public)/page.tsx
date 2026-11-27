import type { Metadata } from 'next';
import { PaginaInicio } from '@/features/marketing';

/** Inicio público: SSG (se genera en el build; PR-INF-01). Contenido indexable en HTML; las demostraciones lo acompañan. */
export const dynamic = 'force-static';

const DESCRIPCION =
  'Aprende cualquier tema desde cero o prepara tus exámenes con explicaciones visuales, modelos interactivos y un tutor que se adapta a ti.';

export const metadata: Metadata = {
  title: { absolute: 'Mentelyx: ¿qué te gustaría entender hoy?' },
  description: DESCRIPCION,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_PE',
    siteName: 'Mentelyx',
    url: '/',
    title: '¿Qué te gustaría entender hoy? | Mentelyx',
    description: DESCRIPCION,
    images: [{ url: '/og/mentelyx-portada.png', width: 1200, height: 630, alt: 'Mentelyx: ¿qué te gustaría entender hoy?' }],
  },
  twitter: { card: 'summary_large_image', title: '¿Qué te gustaría entender hoy? | Mentelyx', description: DESCRIPCION, images: ['/og/mentelyx-portada.png'] },
};

export default function Inicio() {
  return <PaginaInicio />;
}
