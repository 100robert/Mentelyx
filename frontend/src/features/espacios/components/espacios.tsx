'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { apiCliente, mensajeDeError, nuevaClave } from '@/lib/api-cliente';
import { useHidratado } from '@/hooks/hidratado';
import { Icono } from '@/components/ui/iconos';
import { extraerTextoPdf } from '../extraer-pdf';

const LIMITE_BYTES = 200_000;

/** Formulario de un campo para crear un espacio. `secundario` cuando la pantalla ya tiene otra acción principal. */
export function CrearEspacio({ secundario = false }: { secundario?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const campo = useRef<HTMLInputElement>(null);
  const hidratado = useHidratado();

  // El enlace «Nuevo espacio» de la barra lateral llega con #nuevo-espacio: el cursor va directo al campo.
  useEffect(() => {
    const enfocar = () => {
      if (window.location.hash === '#nuevo-espacio') campo.current?.focus();
    };
    enfocar();
    window.addEventListener('hashchange', enfocar);
    return () => window.removeEventListener('hashchange', enfocar);
  }, []);

  return (
    <form
      id="nuevo-espacio"
      method="post"
      className="formulario-linea"
      aria-busy={enviando}
      onSubmit={async (evento) => {
        // onSubmit (no `action`): React 19 reinicia los campos tras una acción aunque falle; así lo escrito se conserva.
        evento.preventDefault();
        const f = new FormData(evento.currentTarget);
        setError(null);
        setEnviando(true);
        try {
          const espacio = await apiCliente<{ id: string }>('/espacios', { metodo: 'POST', cuerpo: { titulo: String(f.get('titulo') ?? '') } });
          router.push(`/espacios/${espacio.id}`);
          router.refresh();
        } catch (e) {
          setError(mensajeDeError(e));
        } finally {
          setEnviando(false);
        }
      }}
    >
      <div className="campo">
        <label htmlFor="titulo">Nuevo tema</label>
        <div className="formulario-linea-fila">
          <input ref={campo} id="titulo" name="titulo" required maxLength={200} placeholder="Ej.: Biología, unidad 3" aria-describedby={error ? 'error-espacio' : undefined} />
          <button type="submit" className={`boton ${secundario ? 'boton-secundario' : 'boton-primario'}`} disabled={enviando || !hidratado}>
            <Icono nombre="mas" />
            {enviando ? 'Creando…' : 'Crear tema'}
          </button>
        </div>
      </div>
      {error && (
        <p id="error-espacio" role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
    </form>
  );
}

/**
 * Carga de una fuente TXT o MD (≤ 200 KB). La Idempotency-Key se fija al elegir el contenido: un reenvío por corte de red
 * no crea otra fuente ni cobra almacenamiento dos veces.
 */
export function FormularioFuente({ espacioId }: { espacioId: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [estado, setEstado] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const clave = useRef(nuevaClave());
  const contenidoRef = useRef<HTMLTextAreaElement>(null);
  const tituloRef = useRef<HTMLInputElement>(null);
  const formatoRef = useRef<HTMLSelectElement>(null);
  const hidratado = useHidratado();

  async function leerArchivo(archivo: File | undefined) {
    if (!archivo) return;
    setError(null);
    setEstado(null);
    if (/.pdf$/i.test(archivo.name) || archivo.type === 'application/pdf') {
      try {
        const r = await extraerTextoPdf(archivo);
        if (!r.texto) throw new Error('El PDF no tiene texto que se pueda leer (¿es un escaneo?). Sin OCR no se puede indexar.');
        if (new TextEncoder().encode(r.texto).byteLength > LIMITE_BYTES) throw new Error('El texto del PDF supera 200 KB: divide el documento en partes.');
        if (contenidoRef.current) contenidoRef.current.value = r.texto;
        if (tituloRef.current && !tituloRef.current.value) tituloRef.current.value = archivo.name.replace(/.pdf$/i, '');
        if (formatoRef.current) formatoRef.current.value = 'PDF';
        setEstado(`Texto extraído de ${r.paginas} página${r.paginas === 1 ? '' : 's'} en tu navegador; el archivo no se sube.${r.sinTexto.length ? ` Sin texto (no se indexan): ${r.sinTexto.join(', ')}.` : ''}`);
        clave.current = nuevaClave();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo leer el PDF.');
      }
      return;
    }
    if (archivo.size > LIMITE_BYTES) {
      setError('El archivo supera 200 KB.');
      return;
    }
    const texto = await archivo.text();
    if (contenidoRef.current) contenidoRef.current.value = texto;
    if (tituloRef.current && !tituloRef.current.value) tituloRef.current.value = archivo.name.replace(/\.(txt|md)$/i, '');
    if (formatoRef.current) formatoRef.current.value = /\.md$/i.test(archivo.name) ? 'MD' : 'TXT';
    clave.current = nuevaClave();
  }

  return (
    <form
      className="formulario"
      method="post"
      aria-busy={enviando}
      onSubmit={async (evento) => {
        // onSubmit (no `action`): React 19 reinicia los campos tras una acción aunque falle; así lo escrito se conserva.
        evento.preventDefault();
        const f = new FormData(evento.currentTarget);
        setError(null);
        setEstado(null);
        setEnviando(true);
        try {
          const contenido = String(f.get('contenido') ?? '');
          if (new TextEncoder().encode(contenido).byteLength > LIMITE_BYTES) throw new Error('El contenido supera 200 KB.');
          await apiCliente(`/espacios/${espacioId}/fuentes`, {
            metodo: 'POST',
            clave: clave.current,
            cuerpo: { titulo: String(f.get('titulo') ?? ''), formato: String(f.get('formato') ?? 'TXT'), contenido },
          });
          clave.current = nuevaClave();
          setEstado('Fuente registrada. La lectura para el Tutor termina en unos segundos.');
          (document.getElementById('form-fuente') as HTMLFormElement | null)?.reset();
          router.refresh();
        } catch (e) {
          setError(e instanceof Error && e.name !== 'ErrorApi' ? e.message : mensajeDeError(e));
        } finally {
          setEnviando(false);
        }
      }}
      id="form-fuente"
    >
      <div className="campo">
        <label htmlFor="archivo">Archivo .txt, .md o .pdf (opcional)</label>
        <input id="archivo" type="file" accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf" onChange={(e) => void leerArchivo(e.target.files?.[0])} aria-describedby="ayuda-archivo" />
        <p id="ayuda-archivo" className="campo-ayuda">
          Hasta 200 KB de texto (un PDF de hasta 20 MB: se lee en tu navegador y solo se guarda su texto). Puedes revisarlo antes de guardar.
        </p>
      </div>
      <div className="campo">
        <label htmlFor="titulo-fuente">Título</label>
        <input id="titulo-fuente" name="titulo" ref={tituloRef} required maxLength={300} />
      </div>
      <div className="campo">
        <label htmlFor="formato">Formato</label>
        <select id="formato" name="formato" ref={formatoRef} defaultValue="TXT" onChange={() => (clave.current = nuevaClave())}>
          <option value="TXT">Texto (TXT)</option>
          <option value="MD">Markdown (MD)</option>
          <option value="PDF">PDF (texto extraído)</option>
        </select>
      </div>
      <div className="campo">
        <label htmlFor="contenido">Contenido</label>
        <textarea id="contenido" name="contenido" ref={contenidoRef} required onChange={() => (clave.current = nuevaClave())} />
      </div>
      {error && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
      {estado && (
        <p role="status" className="mensaje mensaje-exito">
          <Icono nombre="listo" />
          <span>{estado}</span>
        </p>
      )}
      <button type="submit" className="boton boton-primario" disabled={enviando || !hidratado}>
        {enviando && <span className="girador keep-motion" aria-hidden="true" />}
        {enviando ? 'Guardando…' : 'Guardar fuente'}
      </button>
    </form>
  );
}

export function SelectorFuente({ espacioId, contentId, seleccionada }: { espacioId: string; contentId: string; seleccionada: boolean }) {
  const router = useRouter();
  const [valor, setValor] = useState(seleccionada);
  const [enviando, setEnviando] = useState(false);
  return (
    <label className="interruptor">
      <input
        type="checkbox"
        checked={valor}
        disabled={enviando}
        onChange={async (e) => {
          const nuevo = e.target.checked;
          setEnviando(true);
          try {
            await apiCliente(`/espacios/${espacioId}/fuentes/${contentId}`, { metodo: 'PATCH', cuerpo: { seleccionada: nuevo } });
            setValor(nuevo);
            router.refresh();
          } finally {
            setEnviando(false);
          }
        }}
      />
      <span>Usar en el Tutor</span>
    </label>
  );
}
