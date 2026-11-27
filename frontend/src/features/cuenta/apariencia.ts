/**
 * Apariencia por dispositivo: tema (sistema, claro u oscuro) y movimiento (sistema o reducido). Es una preferencia de
 * presentación de este navegador, no un dato personal de la cuenta: se guarda en `localStorage` con esa etiqueta y se
 * aplica antes del primer pintado con un script en línea del layout raíz. Las preferencias educativas de la cuenta
 * necesitan un contrato del backend (diseño de API, sección 12.10).
 */
export type Tema = 'sistema' | 'claro' | 'oscuro';
export type Movimiento = 'sistema' | 'reducido';
export type Apariencia = { tema: Tema; movimiento: Movimiento };
export const CLAVE_APARIENCIA = 'mentelyx.apariencia';
export const POR_DEFECTO: Apariencia = { tema: 'sistema', movimiento: 'sistema' };

export function leerApariencia(texto: string | null): Apariencia {
  try {
    const v = JSON.parse(texto ?? 'null') as Partial<Apariencia> | null;
    return {
      tema: v?.tema === 'claro' || v?.tema === 'oscuro' ? v.tema : 'sistema',
      movimiento: v?.movimiento === 'reducido' ? 'reducido' : 'sistema',
    };
  } catch {
    return POR_DEFECTO;
  }
}

/** Atributos del elemento raíz: sin atributo, manda la preferencia del sistema operativo. */
export function atributos(a: Apariencia): Record<'data-tema' | 'data-movimiento', string | null> {
  return { 'data-tema': a.tema === 'sistema' ? null : a.tema, 'data-movimiento': a.movimiento === 'reducido' ? 'reducido' : null };
}

/**
 * Script en línea (sin dependencias) que aplica la apariencia guardada antes de pintar. `data-apariencia="guardada"` marca
 * que la persona eligió algo: sin esa marca, el entorno educativo usa el modo claro (claro por defecto para quien llega).
 */
export const SCRIPT_APARIENCIA = `try{var a=JSON.parse(localStorage.getItem('${CLAVE_APARIENCIA}')||'null');if(a)document.documentElement.dataset.apariencia='guardada';if(a&&(a.tema==='claro'||a.tema==='oscuro'))document.documentElement.dataset.tema=a.tema;if(a&&a.movimiento==='reducido')document.documentElement.dataset.movimiento='reducido'}catch(e){}`;
