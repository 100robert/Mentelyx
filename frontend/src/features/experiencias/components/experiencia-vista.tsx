'use client';

import { EspacioEstudio } from '@/features/estudio';
import { experiencia } from '../catalogo';

/**
 * Una experiencia en el espacio educativo: contenido preparado y rotulado como ejemplo (no es IA), recorrido guiado local
 * y el Tutor real a un lado. Lo que se pregunta se guarda como una sesión de verdad.
 */
export function ExperienciaVista({ clave, disponibles }: { clave: string; disponibles?: { recurso: string; cantidad: number } }) {
  const e = experiencia(clave);
  if (!e) return null;
  return (
    <EspacioEstudio
      migas={[{ texto: 'Aprendizaje', href: '/aprendizaje' }, { texto: 'Experiencias', href: '/aprendizaje/experiencias' }, { texto: e.titulo }]}
      titulo={e.titulo}
      descripcion={e.descripcion}
      rotuloContenido="Ejemplo ilustrativo: contenido preparado por Mentelyx, no generado por IA. Tus preguntas al Tutor sí son reales y se guardan como una sesión."
      bloques={e.bloques}
      tutor={{ superficie: 'LECCION', contexto: e.contexto, ...(disponibles ? { disponibles } : {}) }}
      {...(e.recorrido ? { recorrido: e.recorrido } : {})}
      {...(e.vinculos ? { vinculos: e.vinculos } : {})}
    />
  );
}
