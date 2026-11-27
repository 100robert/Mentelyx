'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { FormulaSegura } from '@/features/bloques';
import { mensajeDeError } from '@/lib/api-cliente';
import { cargarTarjetas, crearTarjeta, revisarTarjeta, type TarjetaApi } from '../servicios/evaluaciones';
import { actual, calificar, iniciarRonda, resumenRonda, revelar, type Calificacion, type EstadoRonda, type Tarjeta } from '../tarjetas/tarjetas';

const AL_SERVIDOR: Record<Calificacion, 'OTRA_VEZ' | 'DIFICIL' | 'BIEN' | 'FACIL'> = { 'otra-vez': 'OTRA_VEZ', dificil: 'DIFICIL', bien: 'BIEN', facil: 'FACIL' };
const desdeApi = (t: TarjetaApi): Tarjeta => ({ id: t.id, tema: t.tema ?? 'Sin tema', frente: t.anverso, reverso: t.reverso });
const fechaCorta = (iso: string) => new Date(iso).toLocaleDateString('es-PE', { day: 'numeric', month: 'short' });

const CALIFICACIONES: Array<[Calificacion, string]> = [
  ['otra-vez', 'Otra vez'],
  ['dificil', 'Difícil'],
  ['bien', 'Bien'],
  ['facil', 'Fácil'],
];

/**
 * Tarjetas: intenta recordar, revela cuando quieras y califica. «Otra vez» la repite en esta ronda. Las tarjetas que
 * escribas y tus calificaciones no se guardan: no hay repetición espaciada entre días todavía.
 */
export function TarjetasVista({ base, temas, preparacionId }: { base: Tarjeta[]; temas: string[]; preparacionId?: string }) {
  const id = useId();
  const [propias, setPropias] = useState<Tarjeta[]>([]);
  const [tema, setTema] = useState<string>('');
  const [ronda, setRonda] = useState<EstadoRonda | null>(null);
  const [frente, setFrente] = useState('');
  const [reverso, setReverso] = useState('');
  const [temaNueva, setTemaNueva] = useState(temas[0] ?? '');
  const caja = useRef<HTMLDivElement>(null);
  // Preparación real (API 12.9): las tarjetas y cada revisión se guardan; la próxima fecha la calcula el servidor (SM-2).
  const [servidor, setServidor] = useState<{ tarjetas: TarjetaApi[]; pendientes: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recargar = useCallback(async () => {
    if (!preparacionId) return;
    try {
      const r = await cargarTarjetas(preparacionId);
      setServidor({ tarjetas: r.tarjetas, pendientes: r.pendientes });
    } catch (e) {
      setError(mensajeDeError(e));
    }
  }, [preparacionId]);
  useEffect(() => void recargar(), [recargar]);
  const todas = preparacionId ? (servidor?.tarjetas ?? []).map(desdeApi) : [...base, ...propias];
  const mazo = todas.filter((t) => !tema || t.tema === tema);
  const idActual = ronda ? actual(ronda) : null;
  const tarjeta = todas.find((t) => t.id === idActual);
  useEffect(() => caja.current?.focus(), [idActual, ronda?.revelada]);

  return (
    <div className="tarjetas">
      {!ronda || !tarjeta ? (
        <>
          {ronda && !tarjeta && (
            <p className="mensaje mensaje-exito" role="status">
              Terminaste la ronda: {resumenRonda(ronda).terminadas} tarjetas.{' '}
              {resumenRonda(ronda).costaron.length > 0 ? `Te costaron ${resumenRonda(ronda).costaron.length}: conviene repasarlas.` : 'Ninguna te costó.'}
            </p>
          )}
          <div className="campo campo-corto">
            <label htmlFor={`${id}-tema`}>Tema</label>
            <select id={`${id}-tema`} value={tema} onChange={(e) => setTema(e.target.value)}>
              <option value="">Todos ({todas.length})</option>
              {[...new Set(todas.map((t) => t.tema))].map((t) => (
                <option key={t} value={t}>
                  {t} ({todas.filter((x) => x.tema === t).length})
                </option>
              ))}
            </select>
          </div>
          {preparacionId && servidor && (
            <p className="estudio-guardado" data-estado="guardado">
              <span className="estudio-guardado-punto" aria-hidden="true" />
              {servidor.pendientes} para repasar hoy · {servidor.tarjetas.length} guardadas
              {servidor.tarjetas[0] ? ` · próxima: ${fechaCorta(servidor.tarjetas[0].proximaEn)}` : ''}
            </p>
          )}
          {error && <p className="campo-error" role="alert">{error}</p>}
          {mazo.length === 0 ? (
            <p className="suave">No hay tarjetas para este tema. Escribe la primera abajo.</p>
          ) : (
            <button type="button" className="boton boton-primario" onClick={() => setRonda(iniciarRonda(mazo.map((t) => t.id)))}>
              Empezar una ronda de {mazo.length} {mazo.length === 1 ? 'tarjeta' : 'tarjetas'}
            </button>
          )}
          <form
            className="tarjeta-nueva"
            onSubmit={(e) => {
              e.preventDefault();
              if (!frente.trim() || !reverso.trim()) return;
              if (preparacionId) {
                void crearTarjeta(preparacionId, { tema: temaNueva || 'Sin tema', anverso: frente.trim().slice(0, 300), reverso: reverso.trim().slice(0, 800) }).then(recargar, (er: unknown) => setError(mensajeDeError(er)));
              } else setPropias((p) => [...p, { id: `propia-${Date.now()}`, tema: temaNueva || 'Sin tema', frente: frente.trim().slice(0, 300), reverso: reverso.trim().slice(0, 800) }]);
              setFrente('');
              setReverso('');
            }}
          >
            <h4>Escribe tus propias tarjetas</h4>
            <p className="suave">{preparacionId ? 'Se guardan en tu cuenta, en esta preparación.' : 'Solo en esta pantalla: en el ejemplo las tarjetas no se guardan.'}</p>
            <div className="nueva-prep-columnas">
              <div className="campo">
                <label htmlFor={`${id}-frente`}>Pregunta o concepto</label>
                <input id={`${id}-frente`} value={frente} maxLength={300} onChange={(e) => setFrente(e.target.value)} />
              </div>
              <div className="campo">
                <label htmlFor={`${id}-tema-nueva`}>Tema</label>
                <select id={`${id}-tema-nueva`} value={temaNueva} onChange={(e) => setTemaNueva(e.target.value)}>
                  {temas.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="campo">
              <label htmlFor={`${id}-reverso`}>Respuesta</label>
              <textarea id={`${id}-reverso`} rows={2} maxLength={800} value={reverso} onChange={(e) => setReverso(e.target.value)} />
            </div>
            <button type="submit" className="boton boton-secundario boton-chico" disabled={!frente.trim() || !reverso.trim()}>
              Agregar tarjeta
            </button>
          </form>
        </>
      ) : (
        <section className="tarjeta-ronda" aria-label="Ronda de tarjetas">
          <p className="suave num">
            Quedan {ronda.cola.length} · {tarjeta.tema}
          </p>
          <div ref={caja} tabIndex={-1} className="tarjeta" data-revelada={ronda.revelada || undefined}>
            <p className="tarjeta-frente">{tarjeta.frente}</p>
            {ronda.revelada ? (
              <div className="tarjeta-reverso" aria-live="polite">
                <p>{tarjeta.reverso}</p>
                {tarjeta.latex && <FormulaSegura latex={tarjeta.latex} bloque />}
                {tarjeta.fragmento && <blockquote className="estudio">{tarjeta.fragmento}</blockquote>}
              </div>
            ) : (
              <p className="suave">Intenta recordarlo antes de mirar.</p>
            )}
          </div>
          {!ronda.revelada ? (
            <button type="button" className="boton boton-primario" onClick={() => setRonda(revelar(ronda))}>
              Mostrar la respuesta
            </button>
          ) : (
            <div className="acciones" role="group" aria-label="¿Qué tal la recordaste?">
              {CALIFICACIONES.map(([c, t]) => (
                <button key={c} type="button" className={c === 'otra-vez' ? 'boton boton-secundario' : 'boton boton-terciario'} onClick={() => {
                    setRonda(calificar(ronda, c));
                    if (preparacionId) void revisarTarjeta(tarjeta.id, AL_SERVIDOR[c]).then(recargar, (er: unknown) => setError(mensajeDeError(er)));
                  }}>
                  {t}
                </button>
              ))}
            </div>
          )}
          <p className="suave">
            {preparacionId
              ? '«Otra vez» la repite en esta ronda. Cada calificación se guarda y el servidor programa el próximo repaso (repetición espaciada sm2-mentelyx-v1).'
              : '«Otra vez» la repite en esta ronda (hasta 3 veces). En el ejemplo las calificaciones no se guardan.'}
          </p>
          <button type="button" className="boton boton-terciario boton-chico" onClick={() => setRonda(null)}>
            Terminar la ronda
          </button>
        </section>
      )}
    </div>
  );
}
