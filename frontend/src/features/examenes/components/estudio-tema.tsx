'use client';

import { EspacioEstudio } from '@/features/estudio';
import { datosExperiencia } from '@/features/experiencias';
import { ejemploPorId } from '../ejemplo/datos';
import { tituloPreparacion, type PreparacionVista } from '../preparaciones/modelo';

const PREVIOS = { nada: 'empiezo de cero', algo: 'sé algo del tema', bastante: 'domino lo básico' } as const;

/**
 * Estudiar un tema de una preparación en el espacio educativo compartido (no se duplica): el Tutor recibe el contexto
 * del examen y del tema en cada pregunta. En el ejemplo de cálculo, la derivada usa la pizarra interactiva.
 */
export function EstudioTemaExamen({ p, temaCodigo, intencion, previos }: { p: PreparacionVista; temaCodigo: string; intencion?: string; previos?: string }) {
  const tema = p.temas.find((t) => t.codigo === temaCodigo)!;
  const clave = p.modo === 'ejemplo' ? ejemploPorId(p.id)?.estudio[temaCodigo] : undefined;
  const exp = clave ? datosExperiencia(clave) : null;
  const sabe = previos && previos in PREVIOS ? `; ${PREVIOS[previos as keyof typeof PREVIOS]}` : '';
  const pregunta =
    intencion === 'ejercicios'
      ? `Propón tres ejercicios graduados sobre «${tema.titulo}» como los de un examen, sin las soluciones: las pediré después.`
      : `Explícame «${tema.titulo}» para mi examen${sabe}. Empieza por lo esencial y dime qué suele preguntarse.`;
  return (
    <EspacioEstudio
      migas={[{ texto: 'Exámenes', href: '/examenes' }, { texto: tituloPreparacion(p), href: `/examenes/${encodeURIComponent(p.id)}` }, { texto: tema.titulo }]}
      titulo={tema.titulo}
      descripcion={`Tema de ${tituloPreparacion(p).toLowerCase()}. Vuelve a la preparación con las migas para seguir con otra actividad.`}
      {...(exp ? { rotuloContenido: 'Ejemplo ilustrativo: pizarra preparada por Mentelyx, no generada por IA. Tus preguntas al Tutor sí son reales.' } : {})}
      bloques={exp?.bloques ?? []}
      tutor={{
        superficie: 'LECCION',
        contexto: `Me preparo para ${tituloPreparacion(p).toLowerCase()}${p.fechaExamen ? ` (examen el ${p.fechaExamen})` : ''}. Tema: ${tema.titulo}.`,
        preguntaInicial: pregunta,
        ...(p.modo === 'multiple' ? { examen: { preparacionId: p.id, temaId: temaCodigo } } : {}),
      }}
      {...(exp?.recorrido ? { recorrido: exp.recorrido } : {})}
      {...(exp?.vinculos ? { vinculos: exp.vinculos } : {})}
      vacio={
        <>
          <h2>Estudia «{tema.titulo}»</h2>
          <p className="suave">La pregunta para el Tutor ya está preparada abajo. Cada respuesta aparece en esta pizarra, donde puedes escribir, resolver y anotar para repasar antes del examen.</p>
        </>
      }
    />
  );
}
