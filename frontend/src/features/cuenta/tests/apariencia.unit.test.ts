import { describe, expect, it } from 'vitest';
import { atributos, leerApariencia, POR_DEFECTO, SCRIPT_APARIENCIA } from '../apariencia';

describe('apariencia por dispositivo', () => {
  it('lee valores válidos y descarta el resto', () => {
    expect(leerApariencia('{"tema":"oscuro","movimiento":"reducido"}')).toEqual({ tema: 'oscuro', movimiento: 'reducido' });
    expect(leerApariencia('{"tema":"rosa","movimiento":"rapido"}')).toEqual(POR_DEFECTO);
    expect(leerApariencia('no es json')).toEqual(POR_DEFECTO);
    expect(leerApariencia(null)).toEqual(POR_DEFECTO);
  });
  it('sin preferencia propia, no fija atributos (manda el sistema)', () => {
    expect(atributos(POR_DEFECTO)).toEqual({ 'data-tema': null, 'data-movimiento': null });
    expect(atributos({ tema: 'claro', movimiento: 'reducido' })).toEqual({ 'data-tema': 'claro', 'data-movimiento': 'reducido' });
  });
  it('el script en línea no rompe la página si el almacenamiento falla', () => {
    expect(SCRIPT_APARIENCIA.startsWith('try{')).toBe(true);
    expect(SCRIPT_APARIENCIA).toContain('catch(e){}');
  });
});
