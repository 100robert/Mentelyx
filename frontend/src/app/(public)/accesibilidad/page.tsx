import type { Metadata } from 'next';
import { DocumentoLegal, Provisional } from '@/features/legal/documento-legal';

export const metadata: Metadata = { title: 'Declaración de accesibilidad' };

export default function Accesibilidad() {
  return (
    <DocumentoLegal titulo="Declaración de accesibilidad" actualizado="27 de noviembre de 2026">
      <h2>Objetivo</h2>
      <p>Mentelyx busca cumplir las Pautas de Accesibilidad para el Contenido Web (WCAG) 2.2, nivel AA. Es un objetivo, no una conformidad declarada: todavía no se ha verificado por completo.</p>

      <h2>Qué se comprobó</h2>
      <ul>
        <li>Revisión automática con axe-core 4.14.0 en las vistas auditadas, incluido el modo oscuro: 0 violaciones detectadas.</li>
        <li>Recorrido con teclado: foco visible, foco en la pregunta al empezar, diálogos con Escape, pestañas con flechas y menú móvil (17 comprobaciones).</li>
        <li>Movimiento reducido: se respeta la preferencia del dispositivo y también se puede elegir en Configuración.</li>
        <li>La interfaz se adapta al zoom del navegador hasta el 200 %, sin desplazamiento horizontal entre 360 y 1920 píxeles.</li>
        <li>Gráficos, modelos 3D y obras tienen descripción textual; las fórmulas se pueden leer con lectores de pantalla.</li>
      </ul>

      <h2>Limitaciones conocidas</h2>
      <ul>
        <li>No se ha probado con lectores de pantalla (NVDA, JAWS, VoiceOver, TalkBack) en el espacio educativo, el simulacro con temporizador ni el visor PDF.</li>
        <li>Las páginas de un PDF sin texto (escaneadas) no tienen reconocimiento óptico de caracteres.</li>
        <li>Las respuestas del Tutor pueden incluir representaciones cuya descripción genera la IA y que podrían ser incompletas.</li>
      </ul>

      <Provisional>el canal de contacto para informar de barreras y el plazo de respuesta, y la evaluación de conformidad completa con usuarios de tecnologías de apoyo.</Provisional>
    </DocumentoLegal>
  );
}
