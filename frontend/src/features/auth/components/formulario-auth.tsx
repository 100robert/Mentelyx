'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';
import { apiCliente, ErrorApi } from '@/lib/api-cliente';
import { useHidratado } from '@/hooks/hidratado';
import { Icono } from '@/components/ui/iconos';
import { consultaDeIntencion, destinoTrasAcceso } from '../destino';
import { useSesion } from '../hooks/use-sesion';

/**
 * Mensajes de autenticación en lenguaje claro según el código de la API (diseño de API, sección 11): credenciales,
 * CSRF u origen (403), límite de intentos (429), servicio no disponible (503) y falta de conexión.
 */
function mensajeDeAcceso(e: unknown, modo: 'ingresar' | 'registro'): string {
  if (!(e instanceof ErrorApi)) return 'Ocurrió un error inesperado. Inténtalo de nuevo.';
  if (e.code === 'RED') return 'No hay conexión con Mentelyx. Revisa tu conexión e inténtalo de nuevo.';
  if (e.code === 'LIMITE_TASA') {
    const espera = Number(e.details?.reintentarEnSeg);
    return Number.isFinite(espera) && espera > 0 ? `Demasiados intentos seguidos. Espera ${Math.ceil(espera)} s y vuelve a intentarlo.` : 'Demasiados intentos seguidos. Espera un momento y vuelve a intentarlo.';
  }
  if (e.code === 'NO_AUTORIZADO' || e.estado === 403) return 'No pudimos validar la solicitud. Recarga la página e inténtalo de nuevo.';
  if (e.code === 'SERVICIO_NO_DISPONIBLE' || e.estado === 503) return 'El acceso no está disponible en este momento. Inténtalo de nuevo en unos minutos.';
  if (modo === 'ingresar' && (e.estado === 401 || e.code === 'NO_AUTENTICADO' || e.code === 'CREDENCIALES_INVALIDAS')) return 'El correo o la contraseña no son correctos.';
  return e.message || 'No pudimos completar la solicitud. Inténtalo de nuevo.';
}

/**
 * Iniciar sesión o crear la cuenta (M1, Better Auth detrás de la API; la cookie de sesión es HttpOnly).
 * Conserva la intención de entrada (`objetivo`, `siguiente`) y, con una sesión ya iniciada, ofrece continuar o salir.
 */
export function FormularioAuth({ modo }: { modo: 'ingresar' | 'registro' }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const { conSesion, saliendo, prepararSalida, salir } = useSesion();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const hidratado = useHidratado();
  const aviso = useRef<HTMLParagraphElement>(null);
  const destino = destinoTrasAcceso(parametros);
  const consulta = consultaDeIntencion(parametros);

  async function enviar(formulario: FormData) {
    setError(null);
    setEnviando(true);
    try {
      const correo = String(formulario.get('correo') ?? '').trim();
      const contrasena = String(formulario.get('contrasena') ?? '');
      if (modo === 'registro') {
        await apiCliente('/auth/registro', { metodo: 'POST', cuerpo: { nombre: String(formulario.get('nombre') ?? '').trim(), correo, contrasena } });
      } else {
        await apiCliente('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } });
      }
      router.push(destino);
      router.refresh();
    } catch (e) {
      setError(mensajeDeAcceso(e, modo));
      requestAnimationFrame(() => aviso.current?.focus());
    } finally {
      setEnviando(false);
    }
  }

  if (conSesion) {
    return (
      <div className="acceso-sesion" role="status">
        <p className="acceso-sesion-titulo">Ya iniciaste sesión en este dispositivo.</p>
        <p className="acceso-acciones">
          <Link className="boton boton-primario" href={destino}>
            Continuar
          </Link>
          <button type="button" className="boton boton-secundario" aria-busy={saliendo} onClickCapture={prepararSalida} onClick={salir}>
            {saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}
          </button>
        </p>
      </div>
    );
  }

  return (
    // onSubmit (no `action`): React 19 reinicia los campos tras una acción aunque falle; así el correo escrito se conserva.
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar(new FormData(e.currentTarget));
      }}
      className="formulario acceso-formulario"
      aria-describedby={error ? 'error-auth' : undefined}
      aria-busy={enviando}
    >
      {modo === 'registro' && (
        <div className="campo">
          <label htmlFor="nombre">Nombre</label>
          <input id="nombre" name="nombre" autoComplete="name" required minLength={2} maxLength={120} />
        </div>
      )}
      <div className="campo">
        <label htmlFor="correo">Correo electrónico</label>
        <input id="correo" name="correo" type="email" inputMode="email" autoComplete="email" required maxLength={254} />
      </div>
      <div className="campo">
        <label htmlFor="contrasena">Contraseña</label>
        <div className="campo-con-accion">
          <input
            id="contrasena"
            name="contrasena"
            type={verContrasena ? 'text' : 'password'}
            autoComplete={modo === 'registro' ? 'new-password' : 'current-password'}
            required
            minLength={modo === 'registro' ? 8 : 1}
            maxLength={128}
            aria-describedby={modo === 'registro' ? 'ayuda-contrasena' : undefined}
          />
          <button type="button" className="campo-accion" aria-pressed={verContrasena} aria-controls="contrasena" onClick={() => setVerContrasena((v) => !v)}>
            {verContrasena ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {modo === 'registro' && (
          <p id="ayuda-contrasena" className="campo-ayuda">
            Al menos 8 caracteres.
          </p>
        )}
      </div>
      {error && (
        <p id="error-auth" ref={aviso} tabIndex={-1} role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
      <button type="submit" className="boton boton-primario boton-grande boton-ancho" disabled={enviando || !hidratado}>
        {enviando && <span className="girador keep-motion" aria-hidden="true" />}
        {enviando ? (modo === 'registro' ? 'Creando tu cuenta…' : 'Iniciando sesión…') : modo === 'registro' ? 'Crear cuenta' : 'Iniciar sesión'}
      </button>
      <p className="formulario-alterno">
        {modo === 'registro' ? (
          <>
            ¿Ya tienes una cuenta? <Link href={`/auth/ingresar${consulta}`}>Inicia sesión</Link>
          </>
        ) : (
          <>
            ¿Aún no tienes una cuenta? <Link href={`/auth/registro${consulta}`}>Créala gratis</Link>
          </>
        )}
      </p>
    </form>
  );
}
