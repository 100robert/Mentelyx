import type { Metadata } from 'next';
import { DocumentoLegal, Provisional } from '@/features/legal/documento-legal';

export const metadata: Metadata = { title: 'Política de privacidad' };

export default function Privacidad() {
  return (
    <DocumentoLegal titulo="Política de privacidad" actualizado="27 de noviembre de 2026">
      <h2>Quién trata tus datos</h2>
      <p>Mentelyx es un proyecto académico en fase de demostración. En esta fase solo deben usarse cuentas y contenidos ficticios.</p>
      <Provisional>la identidad legal del responsable del tratamiento, su domicilio y el canal de contacto para ejercer derechos.</Provisional>

      <h2>Qué datos guardamos y para qué</h2>
      <ul>
        <li><strong>Cuenta:</strong> nombre, correo y contraseña (guardada solo como hash, nunca en texto). Sirven para identificarte y proteger tu cuenta.</li>
        <li><strong>Sesiones:</strong> una cookie de sesión HttpOnly que dura hasta 7 días y la lista de tus sesiones abiertas, que puedes cerrar desde Configuración.</li>
        <li><strong>Lo que estudias:</strong> temas, fuentes que subes, carpetas, preparaciones de examen, preguntas, intentos, resultados, tarjetas y preferencias de aprendizaje. Son privados: otra cuenta no puede verlos.</li>
        <li><strong>Conversaciones con el Tutor:</strong> preguntas, respuestas, citas, bloques y el estado de cada sesión. Se eliminan automáticamente 90 días después de la última actividad, y puedes borrarlas antes.</li>
        <li><strong>Consumo:</strong> cuántas consultas usaste de tu plan y el costo técnico de cada operación, sin el contenido de la pregunta.</li>
        <li><strong>Seguridad:</strong> para limitar intentos de acceso se usa tu dirección IP transformada con una función criptográfica (HMAC); no se guarda la IP en claro.</li>
        <li><strong>En tu navegador:</strong> solo la apariencia elegida (tema y movimiento). No usamos cookies de publicidad ni de analítica.</li>
      </ul>

      <h2>Inteligencia artificial</h2>
      <p>
        Para responderte, el Tutor envía tu pregunta y fragmentos de las fuentes que elegiste al proveedor de IA configurado. Hoy es NVIDIA API Catalog o Cloudflare Workers AI. Antes del envío se ocultan
        automáticamente correos, teléfonos, números de documento y enlaces. No uses el Tutor para compartir datos personales.
      </p>

      <h2>Proveedores que procesan datos por cuenta de Mentelyx</h2>
      <ul>
        <li>Cloudflare: ejecución de la aplicación, archivos y, cuando se usa, Workers AI.</li>
        <li>Neon: base de datos PostgreSQL alojada en EE. UU. (us-east-2).</li>
        <li>MongoDB Atlas: conversaciones y banco de preguntas.</li>
        <li>NVIDIA: inferencia del Tutor.</li>
      </ul>
      <Provisional>las bases legales del tratamiento, las transferencias internacionales a EE. UU. y su adecuación a la Ley 29733 de Protección de Datos Personales del Perú y su reglamento, y los contratos con cada proveedor.</Provisional>

      <h2>Tus derechos</h2>
      <p>
        Puedes ver y corregir tu nombre, cambiar tu contraseña, cerrar sesiones y borrar tus conversaciones desde la aplicación. Recuperar la contraseña por correo y eliminar la cuenta todavía no
        están disponibles en la aplicación.
      </p>
      <Provisional>el procedimiento y los plazos para atender las solicitudes de acceso, rectificación, cancelación y oposición, y la retención aplicable a cada dato al eliminar una cuenta.</Provisional>

      <h2>Menores de edad</h2>
      <Provisional>el consentimiento del adulto responsable para menores de 14 años no está implementado en V1. No deben registrarse menores hasta que exista.</Provisional>

      <h2>Lo que no hacemos</h2>
      <p>No vendemos datos, no mostramos publicidad y no compartimos tu progreso con terceros.</p>
    </DocumentoLegal>
  );
}
