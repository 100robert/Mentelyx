'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { apiCliente, mensajeDeError } from '@/lib/api-cliente';
import { useHidratado } from './hidratado';
import { Icono } from './iconos';

/** Registro o inicio de sesión (M1, Better Auth detrás de la API). La cookie de sesión es HttpOnly. */
export function FormularioAuth({ modo }: { modo: 'ingresar' | 'registro' }) {
  const router = useRouter();
  const parametros = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verContrasena, setVerContrasena] = useState(false);
  const hidratado = useHidratado();
  const siguiente = parametros.get('siguiente');
  const destino = siguiente && siguiente.startsWith('/') && !siguiente.startsWith('//') ? siguiente : '/espacios';

  async function enviar(formulario: FormData) {
    setError(null);
    setEnviando(true);
    try {
      const correo = String(formulario.get('correo') ?? '');
      const contrasena = String(formulario.get('contrasena') ?? '');
      if (modo === 'registro') {
        await apiCliente('/auth/registro', { metodo: 'POST', cuerpo: { nombre: String(formulario.get('nombre') ?? ''), correo, contrasena } });
      } else {
        await apiCliente('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena } });
      }
      router.push(destino);
      router.refresh();
    } catch (e) {
      setError(modo === 'ingresar' ? 'Correo o contraseña incorrectos.' : mensajeDeError(e));
    } finally {
      setEnviando(false);
    }
  }

  return (
    // onSubmit (no `action`): React 19 reinicia los campos tras una acción aunque falle; así el correo escrito se conserva.
    <form
      method="post"
      onSubmit={(e) => {
        e.preventDefault();
        void enviar(new FormData(e.currentTarget));
      }}
      className="formulario"
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
        <label htmlFor="correo">Correo</label>
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
            minLength={8}
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
        <p id="error-auth" role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
      <button type="submit" className="boton boton-primario boton-ancho" disabled={enviando || !hidratado}>
        {enviando && <span className="girador keep-motion" aria-hidden="true" />}
        {enviando ? 'Enviando…' : modo === 'registro' ? 'Crear cuenta' : 'Ingresar'}
      </button>
      <p className="suave formulario-alterno">
        {modo === 'registro' ? (
          <>
            ¿Ya tienes cuenta? <Link href="/auth/ingresar">Ingresa</Link>
          </>
        ) : (
          <>
            ¿Aún no tienes cuenta? <Link href="/auth/registro">Regístrate</Link>
          </>
        )}
      </p>
    </form>
  );
}
