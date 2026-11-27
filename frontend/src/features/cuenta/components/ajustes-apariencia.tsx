'use client';

import { useEffect, useId, useState } from 'react';
import { atributos, CLAVE_APARIENCIA, leerApariencia, POR_DEFECTO, type Apariencia } from '../apariencia';

const TEMAS: Array<[Apariencia['tema'], string]> = [
  ['sistema', 'Como mi dispositivo'],
  ['claro', 'Claro'],
  ['oscuro', 'Oscuro'],
];

/** Tema y movimiento de este dispositivo. Se aplica al instante y se recuerda en este navegador. */
export function AjustesApariencia() {
  const id = useId();
  const [a, setA] = useState<Apariencia>(POR_DEFECTO);
  const [guardado, setGuardado] = useState(true);
  useEffect(() => {
    try {
      setA(leerApariencia(localStorage.getItem(CLAVE_APARIENCIA)));
    } catch {
      setGuardado(false);
    }
  }, []);
  function cambiar(nueva: Apariencia) {
    setA(nueva);
    document.documentElement.dataset.apariencia = 'guardada';
    for (const [k, v] of Object.entries(atributos(nueva))) {
      if (v === null) document.documentElement.removeAttribute(k);
      else document.documentElement.setAttribute(k, v);
    }
    try {
      localStorage.setItem(CLAVE_APARIENCIA, JSON.stringify(nueva));
      setGuardado(true);
    } catch {
      setGuardado(false);
    }
  }
  return (
    <div className="ajustes-apariencia">
      <fieldset className="campo">
        <legend>Tema</legend>
        <div className="opciones-pastilla">
          {TEMAS.map(([t, n]) => (
            <label key={t} className="pastilla">
              <input type="radio" name={`${id}-tema`} checked={a.tema === t} onChange={() => cambiar({ ...a, tema: t })} />
              {n}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="campo">
        <legend>Movimiento</legend>
        <label className="empezar-opcion">
          <input type="checkbox" checked={a.movimiento === 'reducido'} onChange={(e) => cambiar({ ...a, movimiento: e.target.checked ? 'reducido' : 'sistema' })} />
          Reducir animaciones y transiciones en Mentelyx
        </label>
        <p className="suave campo-ayuda">Si tu dispositivo ya pide reducir el movimiento, se respeta siempre, marques o no esta opción.</p>
      </fieldset>
      <p className="suave" role="status">
        {guardado ? 'Se aplica al instante y se recuerda en este navegador (no en tu cuenta).' : 'Este navegador no permite recordar la preferencia: se aplica hasta que recargues.'}
      </p>
    </div>
  );
}
