import type { Metadata } from 'next';
import { DocumentoLegal, Provisional } from '@/features/legal/documento-legal';

export const metadata: Metadata = { title: 'Términos y condiciones' };

export default function Terminos() {
  return (
    <DocumentoLegal titulo="Términos y condiciones" actualizado="27 de noviembre de 2026">
      <h2>Qué es Mentelyx V1</h2>
      <p>
        Mentelyx V1 es una demostración académica de una plataforma de aprendizaje y preparación de exámenes, con un Tutor de inteligencia artificial. No es un servicio comercial abierto al público:
        no se cobran pagos reales y los planes que se muestran son informativos.
      </p>

      <h2>Tu cuenta</h2>
      <p>Eres responsable de la confidencialidad de tu contraseña y de lo que se haga con tu sesión. Usa solo datos ficticios durante la demostración.</p>

      <h2>Tu contenido</h2>
      <p>
        Lo que subes y escribes (fuentes, preguntas, tarjetas) sigue siendo tuyo. Mentelyx lo usa solo para prestarte el servicio: guardarlo, mostrártelo y, cuando tú lo eliges, dárselo al Tutor como
        contexto. Debes tener derecho a usar las fuentes que subas.
      </p>

      <h2>El Tutor puede equivocarse</h2>
      <p>
        Las respuestas del Tutor son generadas por modelos de IA y pueden contener errores. Comprueba la información importante con tus materiales y docentes. La corrección automática de exámenes es
        determinista solo en los tipos cerrados y numéricos; las respuestas abiertas quedan pendientes de evaluación y no son una nota.
      </p>

      <h2>Uso aceptable</h2>
      <p>No uses Mentelyx para dañar a otras personas, vulnerar derechos de terceros, intentar acceder a cuentas ajenas ni eludir los límites de uso.</p>

      <Provisional>limitación de responsabilidad, ley aplicable y jurisdicción, condiciones comerciales de los planes (precios, renovación, devoluciones), causas de suspensión de cuentas y procedimiento de reclamos (Libro de Reclamaciones, si corresponde).</Provisional>
    </DocumentoLegal>
  );
}
