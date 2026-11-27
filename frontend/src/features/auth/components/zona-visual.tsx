'use client';

import { useSearchParams } from 'next/navigation';
import { leerObjetivo, type Objetivo } from '../destino';

const TEXTOS: Record<'aprendizaje' | 'examen' | 'general', { pregunta: string; texto: string }> = {
  aprendizaje: {
    pregunta: '¿Qué te gustaría entender hoy?',
    texto: 'Empieza por cualquier tema, desde cero o para profundizar, y aprende con explicaciones que puedes ver y explorar.',
  },
  examen: {
    pregunta: '¿Qué examen se acerca?',
    texto: 'Reúne el temario, descubre qué te falta comprender y practica con un plan a tu medida hasta el día de la evaluación.',
  },
  general: {
    pregunta: 'Todo empieza con algo que quieres comprender.',
    texto: 'Tu espacio para aprender a tu ritmo y preparar tus exámenes, con un tutor que se adapta a ti.',
  },
};

function Contenido({ objetivo }: { objetivo: Objetivo | null }) {
  const t = TEXTOS[objetivo ?? 'general'];
  return (
    <div className="acceso-visual">
      <p className="acceso-visual-pregunta">{t.pregunta}</p>
      <p className="acceso-visual-texto">{t.texto}</p>
      <img
        className="acceso-visual-buho"
        src="/marca/buho-esculpido-560.webp"
        srcSet="/marca/buho-esculpido-320.webp 320w, /marca/buho-esculpido-560.webp 560w"
        sizes="16rem"
        width={960}
        height={1389}
        alt=""
        decoding="async"
      />
    </div>
  );
}

/** Zona visual del acceso: el mensaje acompaña la intención con la que se llegó (aprender o preparar un examen). */
export function ZonaVisual() {
  const objetivo = leerObjetivo(useSearchParams().get('objetivo'));
  return <Contenido objetivo={objetivo} />;
}

/** Mientras se leen los parámetros (o sin ellos): el mensaje general. */
export function ZonaVisualGeneral() {
  return <Contenido objetivo={null} />;
}
