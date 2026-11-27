'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiCliente, mensajeDeError } from '@/lib/api-cliente';

/**
 * Perfil, seguridad y preferencias de la cuenta (diseño de API, 12.3 y 12.10). Todo lo que se muestra viene del
 * servidor; cada cambio se confirma con su resultado real. Recuperar la contraseña por correo, verificar el correo y
 * eliminar la cuenta siguen sin estar disponibles (necesitan un proveedor de correo y el procedimiento de borrado).
 */
export type CuentaVista = { nombre: string; correo: string; correoVerificado: boolean; creadaEn: string };
export type SesionVista = { id: string; creadaEn: string; expiraEn: string; actual: boolean; dispositivo: string | null };
export type PreferenciasVista = { profundidad: 'inicial' | 'intermedio' | 'avanzado' | null; herramientasVisuales: string[]; idioma: 'es'; actualizadasEn: string | null };

const fecha = (iso: string) => new Date(iso).toLocaleString('es-PE', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'America/Lima' });

export function PerfilCuenta({ inicial }: { inicial: CuentaVista }) {
  const id = useId();
  const router = useRouter();
  const [nombre, setNombre] = useState(inicial.nombre);
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  return (
    <form
      className="formulario"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const r = await apiCliente<CuentaVista>('/cuenta/me', { metodo: 'PATCH', cuerpo: { nombre: nombre.trim() } });
          setNombre(r.nombre);
          setEstado({ tipo: 'ok', texto: 'Nombre guardado.' });
          router.refresh();
        } catch (er) {
          setEstado({ tipo: 'error', texto: mensajeDeError(er) });
        }
      }}
    >
      <dl className="ajustes-lista">
        <div>
          <dt>Correo</dt>
          <dd>
            {inicial.correo} {inicial.correoVerificado ? '' : <span className="etiqueta">Sin verificar</span>}
          </dd>
        </div>
        <div>
          <dt>Cuenta creada</dt>
          <dd>{fecha(inicial.creadaEn)}</dd>
        </div>
      </dl>
      <div className="campo">
        <label htmlFor={`${id}-n`}>Nombre</label>
        <input id={`${id}-n`} value={nombre} minLength={2} maxLength={120} required onChange={(e) => setNombre(e.target.value)} autoComplete="name" />
      </div>
      <button type="submit" className="boton boton-secundario" disabled={nombre.trim() === inicial.nombre || nombre.trim().length < 2}>
        Guardar el nombre
      </button>
      {estado && (
        <p role={estado.tipo === 'error' ? 'alert' : 'status'} className={estado.tipo === 'error' ? 'campo-error' : 'suave'}>
          {estado.texto}
        </p>
      )}
    </form>
  );
}

export function SeguridadCuenta({ sesiones: iniciales }: { sesiones: SesionVista[] }) {
  const id = useId();
  const [sesiones, setSesiones] = useState(iniciales);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  const recargar = async () => setSesiones(await apiCliente<SesionVista[]>('/auth/sesiones'));
  return (
    <>
      <form
        className="formulario"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await apiCliente('/auth/contrasena/cambio', { metodo: 'POST', cuerpo: { actual, nueva } });
            setActual('');
            setNueva('');
            setEstado({ tipo: 'ok', texto: 'Contraseña cambiada. Cerramos tus sesiones en otros dispositivos.' });
            await recargar();
          } catch (er) {
            setEstado({ tipo: 'error', texto: mensajeDeError(er) });
          }
        }}
      >
        <h3>Cambiar la contraseña</h3>
        <div className="campo">
          <label htmlFor={`${id}-a`}>Contraseña actual</label>
          <input id={`${id}-a`} type="password" autoComplete="current-password" required value={actual} onChange={(e) => setActual(e.target.value)} />
        </div>
        <div className="campo">
          <label htmlFor={`${id}-b`}>Contraseña nueva (mínimo 8 caracteres)</label>
          <input id={`${id}-b`} type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={nueva} onChange={(e) => setNueva(e.target.value)} />
        </div>
        <button type="submit" className="boton boton-secundario" disabled={!actual || nueva.length < 8}>
          Cambiar la contraseña
        </button>
        {estado && (
          <p role={estado.tipo === 'error' ? 'alert' : 'status'} className={estado.tipo === 'error' ? 'campo-error' : 'suave'}>
            {estado.texto}
          </p>
        )}
      </form>
      <h3>Sesiones abiertas</h3>
      <ul className="lista-simple">
        {sesiones.map((s) => (
          <li key={s.id}>
            {s.dispositivo ?? 'Dispositivo sin identificar'} · desde el {fecha(s.creadaEn)} {s.actual ? <span className="etiqueta">Este dispositivo</span> : null}
            {!s.actual && (
              <button
                type="button"
                className="boton boton-terciario"
                onClick={async () => {
                  try {
                    await apiCliente(`/auth/sesiones/${encodeURIComponent(s.id)}`, { metodo: 'DELETE' });
                    await recargar();
                  } catch (er) {
                    setEstado({ tipo: 'error', texto: mensajeDeError(er) });
                  }
                }}
              >
                Cerrar esa sesión
              </button>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}

const PROFUNDIDADES = [
  [null, 'Elegir al empezar cada tema'],
  ['inicial', 'Desde cero'],
  ['intermedio', 'Nivel intermedio'],
  ['avanzado', 'Con profundidad'],
] as const;
const HERRAMIENTAS: Array<[string, string]> = [
  ['grafico', 'Gráficos'],
  ['pasos', 'Procedimientos paso a paso'],
  ['formula', 'Fórmulas'],
  ['tabla', 'Tablas'],
  ['comparacion', 'Comparaciones'],
  ['linea-tiempo', 'Líneas de tiempo'],
  ['codigo', 'Código'],
  ['vectores', 'Vectores'],
  ['modelo-3d', 'Modelos 3D'],
  ['ejercicio', 'Actividades breves'],
];

export function PreferenciasAprendizaje({ inicial }: { inicial: PreferenciasVista }) {
  const id = useId();
  const [p, setP] = useState(inicial);
  const [estado, setEstado] = useState<{ tipo: 'ok' | 'error'; texto: string } | null>(null);
  return (
    <form
      className="formulario"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          setP(await apiCliente<PreferenciasVista>('/cuenta/me/preferencias', { metodo: 'PUT', cuerpo: { profundidad: p.profundidad, herramientasVisuales: p.herramientasVisuales, idioma: 'es' } }));
          setEstado({ tipo: 'ok', texto: 'Preferencias guardadas en tu cuenta.' });
        } catch (er) {
          setEstado({ tipo: 'error', texto: mensajeDeError(er) });
        }
      }}
    >
      <fieldset className="campo">
        <legend>Profundidad por omisión</legend>
        <div className="opciones-pastilla">
          {PROFUNDIDADES.map(([v, t]) => (
            <label key={t} className="pastilla">
              <input type="radio" name={`${id}-p`} checked={p.profundidad === v} onChange={() => setP({ ...p, profundidad: v })} /> {t}
            </label>
          ))}
        </div>
        <p className="suave campo-ayuda">Es solo el valor propuesto al empezar: en cada tema puedes cambiarlo.</p>
      </fieldset>
      <fieldset className="campo">
        <legend>Herramientas visuales que prefieres (sin marcar: todas)</legend>
        {HERRAMIENTAS.map(([v, t]) => (
          <label key={v} className="empezar-opcion">
            <input type="checkbox" checked={p.herramientasVisuales.includes(v)} onChange={(e) => setP({ ...p, herramientasVisuales: e.target.checked ? [...p.herramientasVisuales, v] : p.herramientasVisuales.filter((x) => x !== v) })} /> {t}
          </label>
        ))}
      </fieldset>
      <p className="suave">Idioma de las explicaciones: español.</p>
      <button type="submit" className="boton boton-secundario">
        Guardar las preferencias
      </button>
      {estado && (
        <p role={estado.tipo === 'error' ? 'alert' : 'status'} className={estado.tipo === 'error' ? 'campo-error' : 'suave'}>
          {estado.texto}
        </p>
      )}
    </form>
  );
}
