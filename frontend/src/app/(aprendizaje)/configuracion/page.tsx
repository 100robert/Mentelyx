import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { BotonSalir } from '@/features/auth';
import { AjustesApariencia, PerfilCuenta, PreferenciasAprendizaje, SeguridadCuenta, type CuentaVista, type PreferenciasVista, type SesionVista } from '@/features/cuenta';
import { NOTA_AUN_NO_DISPONIBLE, RECURSOS_AUN_NO_DISPONIBLES } from '@/features/planes';
import { Icono } from '@/components/ui/iconos';
import { apiServidor, sesionActual } from '@/lib/api-servidor';

export const metadata: Metadata = { title: 'Configuración' };
export const dynamic = 'force-dynamic';

type Derechos = { producto: string; recursos: Array<{ recurso: string; limite: number; disponibles: number }> };
const NOMBRES: Record<string, string> = {
  CONSULTA_GENERAL: 'Consultas generales',
  CONSULTA_TECNICA: 'Consultas técnicas',
  RAZONAMIENTO_PROFUNDO: 'Razonamiento profundo',
  EVALUACION_EQUIVALENTE: 'Evaluaciones de 15 preguntas',
  ILUSTRACION_ESTANDAR: 'Ilustraciones',
  ALMACENAMIENTO_BYTES: 'Almacenamiento',
};
const PLANES: Record<string, string> = { EST_GRATUITO: 'Gratuito', EST_ESTANDAR: 'Estándar', EST_PLUS: 'Plus', EST_PREMIUM: 'Premium' };
const cantidad = (recurso: string, n: number) =>
  recurso.endsWith('_BYTES') ? `${(n / 1e6).toLocaleString('es-PE', { maximumFractionDigits: 1 })} MB` : n.toLocaleString('es-PE');
const fechaHora = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

/**
 * Configuración (fase 9): perfil y cuenta, sesión y seguridad, apariencia de este dispositivo, preferencias de
 * aprendizaje, y plan y recursos del mes. Solo se ofrece lo que el backend permite hacer; lo demás se dice sin botones.
 */
export default async function Configuracion() {
  const sesion = await sesionActual();
  if (!sesion) redirect('/auth/ingresar?siguiente=/configuracion');
  const [derechos, cuenta, preferencias, sesiones] = await Promise.all([
    apiServidor<Derechos>('/suscripciones/me/derechos'),
    apiServidor<CuentaVista>('/cuenta/me'),
    apiServidor<PreferenciasVista>('/cuenta/me/preferencias'),
    apiServidor<SesionVista[]>('/auth/sesiones'),
  ]);
  const recursos = (derechos.datos?.recursos ?? []).filter((r) => NOMBRES[r.recurso]);

  return (
    <div className="pagina pagina-modulo pagina-configuracion">
      <header className="pagina-cabecera">
        <h1>Configuración</h1>
      </header>

      <section className="bloque ajustes-bloque" aria-labelledby="ajustes-perfil">
        <h2 id="ajustes-perfil" className="titulo-bloque">
          Perfil y cuenta
        </h2>
        {cuenta.datos ? <PerfilCuenta inicial={cuenta.datos} /> : <p role="alert">No pudimos cargar los datos de tu cuenta. Recarga la página.</p>}
        <p className="suave">Mentelyx no te pide más datos personales que los del registro.</p>
      </section>

      <section className="bloque ajustes-bloque" aria-labelledby="ajustes-sesion">
        <h2 id="ajustes-sesion" className="titulo-bloque">
          Sesión y seguridad
        </h2>
        <p>Tu sesión en este dispositivo está activa hasta el {fechaHora(sesion.expiraEn)}.</p>
        <p>
          <BotonSalir />
        </p>
        <SeguridadCuenta sesiones={sesiones.datos ?? []} />
        <dl className="ajustes-lista">
          <div>
            <dt>Recuperar la contraseña por correo</dt>
            <dd>Todavía no disponible: requiere un proveedor de correo.</dd>
          </div>
          <div>
            <dt>Verificar el correo</dt>
            <dd>Todavía no disponible.</dd>
          </div>
          <div>
            <dt>Eliminar la cuenta</dt>
            <dd>Todavía no disponible desde la aplicación.</dd>
          </div>
        </dl>
      </section>

      <section className="bloque ajustes-bloque" aria-labelledby="ajustes-apariencia">
        <h2 id="ajustes-apariencia" className="titulo-bloque">
          Apariencia de este dispositivo
        </h2>
        <AjustesApariencia />
      </section>

      <section className="bloque ajustes-bloque" aria-labelledby="ajustes-aprendizaje">
        <h2 id="ajustes-aprendizaje" className="titulo-bloque">
          Preferencias de aprendizaje
        </h2>
        <p>
          La profundidad de las explicaciones, lo que ya sabes y tu objetivo se eligen al empezar cada tema o cada preparación, y el Tutor se adapta en cada conversación. No te fijamos en un nivel: puedes cambiar en cualquier momento.
        </p>
        {preferencias.datos && <PreferenciasAprendizaje inicial={preferencias.datos} />}
      </section>

      <section className="bloque ajustes-bloque" aria-labelledby="ajustes-plan">
        <div className="bloque-cabecera">
          <h2 id="ajustes-plan" className="titulo-bloque">
            Plan y recursos del mes
          </h2>
          <Link href="/planes" className="enlace-accion">
            Ver los planes
          </Link>
        </div>
        {derechos.datos ? (
          <>
            <p>
              Plan <strong>{PLANES[derechos.datos.producto] ?? derechos.datos.producto}</strong>.
            </p>
            <table className="tabla">
              <caption className="visually-hidden">Recursos disponibles este mes</caption>
              <thead>
                <tr>
                  <th scope="col">Recurso</th>
                  <th scope="col" className="num">
                    Disponibles
                  </th>
                  <th scope="col" className="num">
                    Del total
                  </th>
                </tr>
              </thead>
              <tbody>
                {recursos.map((r) => (
                  <tr key={r.recurso} data-pendiente={RECURSOS_AUN_NO_DISPONIBLES.codigos.includes(r.recurso) || undefined}>
                    <th scope="row">
                      {NOMBRES[r.recurso]} {RECURSOS_AUN_NO_DISPONIBLES.codigos.includes(r.recurso) && <span className="etiqueta etiqueta-pendiente">Aún no disponible</span>}
                    </th>
                    <td className="num">{cantidad(r.recurso, r.disponibles)}</td>
                    <td className="num">{cantidad(r.recurso, r.limite)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recursos.some((r) => RECURSOS_AUN_NO_DISPONIBLES.codigos.includes(r.recurso)) && <p className="suave">{NOTA_AUN_NO_DISPONIBLE}</p>}
          </>
        ) : (
          <p role="alert" className="mensaje mensaje-error">
            <Icono nombre="aviso" />
            <span>No pudimos cargar los recursos de tu plan. Recarga la página para intentarlo de nuevo.</span>
          </p>
        )}
      </section>

      <section className="bloque ajustes-bloque" aria-labelledby="ajustes-preferencias">
        <h2 id="ajustes-preferencias" className="titulo-bloque">
          Accesibilidad
        </h2>
        <dl className="ajustes-lista">
          <div>
            <dt>Movimiento del dispositivo</dt>
            <dd>Si tu dispositivo pide reducir el movimiento, las animaciones y las demostraciones muestran estados fijos.</dd>
          </div>
          <div>
            <dt>Tamaño del texto</dt>
            <dd>La interfaz se adapta al zoom del navegador hasta el 200 %.</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
