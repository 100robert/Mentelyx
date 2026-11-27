'use client';

import { useSearchParams } from 'next/navigation';
import { leerObjetivo, type Objetivo } from '../destino';

const TEXTOS = {
  ingresar: { titulo: 'Inicia sesión', general: 'Continúa justo donde lo dejaste.', aprendizaje: 'Continúa aprendiendo donde lo dejaste.', examen: 'Continúa preparando tu examen.' },
  registro: { titulo: 'Crea tu cuenta', general: 'Empieza gratis, sin tarjeta.', aprendizaje: 'Empieza a aprender lo que quieras, gratis.', examen: 'Prepara tu examen con un plan a tu medida, gratis.' },
} as const;

/** Título y entradilla del acceso para una intención dada (presentacional: sirve también como contenido de reserva). */
export function IntroAcceso({ modo, objetivo }: { modo: 'ingresar' | 'registro'; objetivo: Objetivo | null }) {
  const t = TEXTOS[modo];
  return (
    <header className="acceso-cabecera">
      <h1>{t.titulo}</h1>
      <p className="acceso-intro">{objetivo ? t[objetivo] : t.general}</p>
    </header>
  );
}

/** La misma entradilla, según la intención con la que se llegó (`?objetivo=`). */
export function IntroAccesoConIntencion({ modo }: { modo: 'ingresar' | 'registro' }) {
  return <IntroAcceso modo={modo} objetivo={leerObjetivo(useSearchParams().get('objetivo'))} />;
}
