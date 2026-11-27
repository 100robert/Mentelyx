'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { Dialogo } from '@/features/carpetas';
import { Icono } from '@/components/ui/iconos';
import { useHidratado } from '@/hooks/hidratado';
import { mensajeDeError, nuevaClave } from '@/lib/api-cliente';
import { interpretarFrase } from '../preparaciones/interpretar';
import { hoyIso, MAX_TEMAS_UNICA, MINUTOS_REFERENCIA, tituloPreparacion, validarBorrador, type Borrador, type ErroresBorrador, type PreparacionVista } from '../preparaciones/modelo';
import { cargarFuentes, cargarPreparaciones, crearPreparacion, type ModoServicio } from '../servicios/api';
import { TemarioEditor } from './temario-editor';

const HORAS: Array<[number | null, string]> = [
  [null, 'No lo sé'],
  [60, '1 h'],
  [120, '2 h'],
  [180, '3 h'],
  [300, '5 h'],
  [480, '8 h'],
  [720, '12 h'],
];

/**
 * Nueva preparación: una frase en lenguaje natural propone los campos (interpretación local, no IA) y la persona los
 * revisa. Obligatorios: asignatura y al menos un tema. Lo demás es opcional y se puede completar después.
 */
export function NuevaPreparacion() {
  const router = useRouter();
  const hidratado = useHidratado();
  const id = useId();
  const hoy = hoyIso();
  const [frase, setFrase] = useState('');
  const [reconocido, setReconocido] = useState<string[] | null>(null);
  const [b, setB] = useState<Borrador>({ nombre: '', asignatura: '', temas: [], fechaExamen: '', minutosSemanales: null, previos: null, objetivo: null, fuentes: [], carpetaId: null });
  const [errores, setErrores] = useState<ErroresBorrador>({});
  const [modo, setModo] = useState<ModoServicio | null>(null);
  const [vigente, setVigente] = useState<PreparacionVista | null>(null);
  const [fuentes, setFuentes] = useState<Array<{ contentId: string; titulo: string; tema: string; lista: boolean }> | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clave] = useState(nuevaClave);

  useEffect(() => {
    cargarPreparaciones().then(
      (r) => {
        setModo(r.modo);
        setVigente(r.modo === 'unica' ? (r.lista[0] ?? null) : null);
      },
      () => setModo('no-disponible'),
    );
    cargarFuentes().then(setFuentes, () => setFuentes([]));
  }, []);

  const cambiar = (c: Partial<Borrador>) => setB((x) => ({ ...x, ...c }));
  const noSeGuarda = modo === 'unica' ? <span className="campo-nota"> · por ahora no se guarda</span> : null;

  function interpretar() {
    const r = interpretarFrase(frase, hoy);
    setB((x) => ({
      ...x,
      ...(r.asignatura && !x.asignatura ? { asignatura: r.asignatura } : {}),
      ...(r.nombre && !x.nombre ? { nombre: r.nombre } : {}),
      ...(r.fechaExamen && !x.fechaExamen ? { fechaExamen: r.fechaExamen } : {}),
      ...(r.previos && !x.previos ? { previos: r.previos } : {}),
    }));
    setReconocido(r.reconocido);
  }

  async function guardar() {
    setConfirmar(false);
    setEnviando(true);
    setError(null);
    try {
      const p = await crearPreparacion(b, modo === 'multiple' ? 'multiple' : 'unica', clave);
      const params = new URLSearchParams({ creada: '1', ...(b.previos ? { previos: b.previos } : {}), ...(b.objetivo ? { objetivo: b.objetivo } : {}) });
      router.push(`/examenes/${encodeURIComponent(p.id)}?${params}`);
      router.refresh();
    } catch (e) {
      setError(mensajeDeError(e));
      setEnviando(false);
    }
  }

  function enviar() {
    const e = validarBorrador(b, hoy, modo === 'multiple' ? 'multiple' : 'unica');
    setErrores(e);
    if (Object.keys(e).length) {
      requestAnimationFrame(() => document.querySelector<HTMLElement>('[aria-invalid="true"], .temario-editor input')?.focus());
      return;
    }
    if (modo === 'unica' && vigente) setConfirmar(true);
    else void guardar();
  }

  if (modo === 'no-disponible')
    return (
      <p className="mensaje mensaje-info">
        <Icono nombre="info" />
        <span>La preparación de exámenes no está disponible en este momento. Vuelve a intentarlo más tarde.</span>
      </p>
    );

  return (
    <form
      className="nueva-prep"
      method="post"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        enviar();
      }}
    >
      <section className="nueva-prep-frase" aria-labelledby={`${id}-frase-titulo`}>
        <h2 id={`${id}-frase-titulo`}>¿Qué examen necesitas preparar?</h2>
        <div className="empezar-fila">
          <label htmlFor={`${id}-frase`} className="visually-hidden">
            Describe tu examen
          </label>
          <input id={`${id}-frase`} className="empezar-campo" value={frase} maxLength={300} onChange={(e) => setFrase(e.target.value)} placeholder="Por ejemplo: tengo un examen de arquitectura de software dentro de tres días" />
          <button type="button" className="boton boton-secundario" disabled={!frase.trim()} onClick={interpretar}>
            Completar campos
          </button>
        </div>
        <p className="suave" aria-live="polite">
          {reconocido === null
            ? 'Mentelyx propone los campos a partir de tu frase (sin IA) y tú los revisas.'
            : reconocido.length
              ? `Reconocí: ${reconocido.join(', ')}. Revisa y corrige lo que haga falta.`
              : 'No reconocí datos en la frase: completa los campos de abajo.'}
        </p>
      </section>

      <fieldset className="nueva-prep-grupo">
        <legend>Lo necesario</legend>
        <div className="campo">
          <label htmlFor={`${id}-asignatura`}>Asignatura o tema general (obligatorio)</label>
          <input id={`${id}-asignatura`} value={b.asignatura} maxLength={80} onChange={(e) => cambiar({ asignatura: e.target.value })} aria-invalid={!!errores.asignatura || undefined} aria-describedby={errores.asignatura ? `${id}-e-asignatura` : undefined} />
          {errores.asignatura && <p id={`${id}-e-asignatura`} className="campo-error">{errores.asignatura}</p>}
        </div>
        <div className="campo">
          <span className="campo-etiqueta" id={`${id}-temario`}>
            Temario (al menos un tema){modo === 'unica' ? ` · hasta ${MAX_TEMAS_UNICA} por ahora` : ''}
          </span>
          <TemarioEditor temas={b.temas} alCambiar={(temas) => cambiar({ temas })} asignatura={b.asignatura} {...(modo === 'unica' ? { maximo: MAX_TEMAS_UNICA } : {})} />
          {errores.temas && <p className="campo-error" role="alert">{errores.temas}</p>}
        </div>
      </fieldset>

      <fieldset className="nueva-prep-grupo">
        <legend>Si lo sabes (opcional)</legend>
        <div className="nueva-prep-columnas">
          <div className="campo">
            <label htmlFor={`${id}-nombre`}>
              Nombre del examen{noSeGuarda}
            </label>
            <input id={`${id}-nombre`} value={b.nombre} maxLength={120} onChange={(e) => cambiar({ nombre: e.target.value })} placeholder="Examen parcial" />
          </div>
          <div className="campo">
            <label htmlFor={`${id}-fecha`}>Fecha del examen</label>
            <input id={`${id}-fecha`} type="date" min={hoy} value={b.fechaExamen} onChange={(e) => cambiar({ fechaExamen: e.target.value })} aria-invalid={!!errores.fechaExamen || undefined} aria-describedby={`${id}-fecha-ayuda`} />
            <p id={`${id}-fecha-ayuda`} className={errores.fechaExamen ? 'campo-error' : 'suave campo-ayuda'}>
              {errores.fechaExamen ?? 'Sin fecha, el plan no tiene plazos y no hay cuenta regresiva.'}
            </p>
          </div>
        </div>
        <div className="campo">
          <span className="campo-etiqueta" id={`${id}-horas`}>
            Tiempo disponible por semana
          </span>
          <div className="opciones-pastilla" role="radiogroup" aria-labelledby={`${id}-horas`}>
            {HORAS.map(([m, t]) => (
              <label key={t} className="pastilla">
                <input type="radio" name={`${id}-horas`} checked={b.minutosSemanales === m} onChange={() => cambiar({ minutosSemanales: m })} />
                {t}
              </label>
            ))}
          </div>
          {b.minutosSemanales === null && <p className="suave campo-ayuda">Si no lo sabes, el plan usa {MINUTOS_REFERENCIA / 60} h por semana como referencia.</p>}
          {errores.minutosSemanales && <p className="campo-error">{errores.minutosSemanales}</p>}
        </div>
        <div className="nueva-prep-columnas">
          <fieldset className="campo">
            <legend>Lo que ya sabes{noSeGuarda}</legend>
            {(
              [
                ['nada', 'Empiezo de cero'],
                ['algo', 'Sé algo'],
                ['bastante', 'Domino lo básico'],
              ] as const
            ).map(([v, t]) => (
              <label key={v} className="empezar-opcion">
                <input type="radio" name={`${id}-previos`} checked={b.previos === v} onChange={() => cambiar({ previos: v })} />
                {t}
              </label>
            ))}
          </fieldset>
          <fieldset className="campo">
            <legend>Tu objetivo{noSeGuarda}</legend>
            {(
              [
                ['comprender', 'Comprender a fondo'],
                ['aprobar', 'Aprobar con seguridad'],
                ['repasar', 'Repasar lo visto'],
              ] as const
            ).map(([v, t]) => (
              <label key={v} className="empezar-opcion">
                <input type="radio" name={`${id}-objetivo`} checked={b.objetivo === v} onChange={() => cambiar({ objetivo: v })} />
                {t}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="campo">
          <label htmlFor={`${id}-carpeta`}>Carpeta de Exámenes</label>
          <select id={`${id}-carpeta`} disabled aria-describedby={`${id}-carpeta-ayuda`}>
            <option>Sin carpeta</option>
          </select>
          <p id={`${id}-carpeta-ayuda`} className="suave campo-ayuda">
            Las carpetas de Exámenes no están disponibles todavía; podrás moverla a una carpeta después.
          </p>
        </div>
        <fieldset className="campo">
          <legend>Tus fuentes</legend>
          {fuentes === null ? (
            <p className="suave">Cargando tus fuentes…</p>
          ) : fuentes.length === 0 ? (
            <p className="suave">No tienes fuentes. Puedes empezar sin documentos: el Tutor explicará en general.</p>
          ) : (
            <ul className="nueva-prep-fuentes">
              {fuentes.map((f) => (
                <li key={f.contentId}>
                  <label className="empezar-opcion">
                    <input
                      type="checkbox"
                      disabled={!f.lista}
                      checked={b.fuentes.includes(f.contentId)}
                      onChange={(e) => cambiar({ fuentes: e.target.checked ? [...b.fuentes, f.contentId] : b.fuentes.filter((x) => x !== f.contentId) })}
                    />
                    {f.titulo} <span className="suave">· {f.tema}{f.lista ? '' : ' · aún se está leyendo'}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {errores.fuentes && <p className="campo-error">{errores.fuentes}</p>}
        </fieldset>
      </fieldset>

      {error && (
        <p role="alert" className="mensaje mensaje-error">
          <Icono nombre="aviso" />
          <span>{error}</span>
        </p>
      )}
      <div className="acciones">
        <button type="submit" className="boton boton-primario" disabled={!hidratado || enviando || modo === null}>
          {enviando ? 'Creando la preparación…' : 'Crear la preparación'}
        </button>
        <Link href="/examenes" className="boton boton-terciario">
          Cancelar
        </Link>
      </div>

      <Dialogo abierto={confirmar} titulo="¿Reemplazar tu preparación vigente?" descripcion={vigente ? `Por ahora Mentelyx guarda una preparación a la vez. Si creas esta, «${tituloPreparacion(vigente)}» y su avance (${vigente.avance.completadas} de ${vigente.avance.total} actividades) dejarán de mostrarse.` : undefined} alCerrar={() => setConfirmar(false)}>
        <div className="acciones">
          <button type="button" className="boton boton-primario" onClick={() => void guardar()}>
            Reemplazar y crear
          </button>
          <button type="button" className="boton boton-secundario" onClick={() => setConfirmar(false)}>
            Conservar la vigente
          </button>
        </div>
      </Dialogo>
    </form>
  );
}
