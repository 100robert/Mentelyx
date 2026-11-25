import Link from 'next/link';
import { Icono } from '@/components/ui/iconos';
import { LogoCompleto } from '@/components/ui/marca';
import { PLANES } from '@/features/planes';

/** Marco de registro e ingreso: panel de marca con el búho y lo que ofrece Mentelyx; el formulario como única tarea. */
export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  const consultas = PLANES.find((p) => p.codigo === 'EST_GRATUITO')?.recursos.find(([n]) => n === 'Consultas generales')?.[1];
  const hechos = [
    'Cada explicación cita el pasaje exacto de tus apuntes.',
    'Un espacio privado por tema, con sus fuentes y conversaciones.',
    consultas ? `Plan Gratuito con ${consultas} consultas generales al mes.` : 'Empieza con el plan Gratuito.',
  ];
  return (
    <div className="acceso">
      <aside className="acceso-identidad" aria-label="Mentelyx">
        <div className="acceso-mensaje">
          <p className="acceso-lema">Aprende con claridad. Avanza con confianza.</p>
          <ul className="acceso-hechos">
            {hechos.map((h) => (
              <li key={h}>
                <Icono nombre="listo" />
                {h}
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <main id="principal" className="acceso-contenido" tabIndex={-1}>
        <div className="acceso-marca">
          <Link href="/" aria-label="Mentelyx, inicio">
            <LogoCompleto tamano={120} />
          </Link>
        </div>
        {children}
      </main>
    </div>
  );
}
