import type { Metadata } from 'next';
import { DocumentoLegal } from '@/features/legal/documento-legal';

export const metadata: Metadata = { title: 'Créditos y licencias' };

export default function Creditos() {
  return (
    <DocumentoLegal titulo="Créditos y licencias" actualizado="27 de noviembre de 2026">
      <h2>Recursos educativos</h2>
      <ul>
        <li>
          «La gran ola de Kanagawa», Katsushika Hokusai (c. 1830-1832). The Metropolitan Museum of Art, objeto 45434. Dominio público (CC0), vía el programa Open Access del museo.
        </li>
        <li>Modelo 3D de la molécula de metano y documento «Apuntes de derivadas»: elaborados para Mentelyx.</li>
        <li>Preguntas y apuntes de la demostración: escritos para Mentelyx, con datos ficticios.</li>
      </ul>

      <h2>Tipografías</h2>
      <ul>
        <li>Lexend y Source Serif 4: SIL Open Font License 1.1, autoalojadas.</li>
      </ul>

      <h2>Software de código abierto</h2>
      <ul>
        <li>Next.js, React, Hono, Better Auth, Zod, KaTeX y three.js: licencia MIT.</li>
        <li>PDF.js (pdfjs-dist), Drizzle ORM, OpenNext para Cloudflare y el driver de MongoDB: licencia Apache 2.0.</li>
        <li>Kysely: licencia MIT. pgvector: licencia PostgreSQL.</li>
      </ul>

      <h2>Modelos de inteligencia artificial</h2>
      <ul>
        <li>Kimi K3.1 Pro (Moonshot AI), servido por NVIDIA API Catalog.</li>
        <li>Gemma 4 (Google) y BGE-M3 (BAAI), servidos por Cloudflare Workers AI cuando ese proveedor está activo.</li>
      </ul>
      <p className="suave">Cada respuesta del Tutor indica qué proveedor y qué modelo la generó.</p>
    </DocumentoLegal>
  );
}
