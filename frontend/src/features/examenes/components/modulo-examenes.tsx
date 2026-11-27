import { Suspense } from 'react';
import { ExploradorCarpetas } from '@/features/carpetas';
import { Icono } from '@/components/ui/iconos';
import { ListaPreparaciones } from './preparaciones';

/**
 * Módulo de Exámenes: espacio propio, separado de Aprendizaje, con sus preparaciones y sus carpetas por asignatura.
 * Cada preparación reúne temario, plan, estudio por tema, tarjetas, práctica, simulacros y resultados.
 */
export function ModuloExamenes() {
  return (
    <div className="pagina pagina-modulo">
      <header className="modulo-cabecera modulo-cabecera-examenes">
        <h1 className="modulo-etiqueta">
          <Icono nombre="examen" tamano={18} /> Exámenes
        </h1>
        <p className="modulo-titulo">¿Qué examen se acerca?</p>
        <p className="modulo-texto">Organiza tu examen con su temario y tu plan de estudio. No estudies solo para responder: estudia para comprender.</p>
      </header>
      <div className="modulo-cuerpo">
        <ListaPreparaciones />
        <div className="modulo-carpetas">
          <Suspense>
            <ExploradorCarpetas modulo="EXAMENES" />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
