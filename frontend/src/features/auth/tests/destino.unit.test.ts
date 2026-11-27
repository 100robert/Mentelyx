import { describe, expect, it } from 'vitest';
import { consultaDeIntencion, destinoTrasAcceso, leerObjetivo, validarSiguiente } from '../destino';

const params = (q: string) => new URLSearchParams(q);

describe('intención y destino tras el acceso', () => {
  it('solo admite los objetivos de la landing', () => {
    expect(leerObjetivo('aprendizaje')).toBe('aprendizaje');
    expect(leerObjetivo('examen')).toBe('examen');
    expect(leerObjetivo('studio')).toBeNull();
    expect(leerObjetivo(null)).toBeNull();
  });

  it('acepta rutas internas permitidas y conserva su consulta', () => {
    expect(validarSiguiente('/espacios')).toBe('/espacios');
    expect(validarSiguiente('/tutor/abc?x=1')).toBe('/tutor/abc?x=1');
    expect(validarSiguiente('/examenes')).toBe('/examenes');
  });

  it('rechaza redirecciones abiertas y rutas no previstas', () => {
    for (const malo of ['//malo.com', '/\\malo.com', 'https://malo.com', 'javascript:alert(1)', '/admin', '/espaciosx', '', '/tutor\n', '/inicio/../../admin']) {
      expect(validarSiguiente(malo)).toBeNull();
    }
  });

  it('elige el destino: siguiente, después el objetivo y, si no hay, el inicio', () => {
    expect(destinoTrasAcceso(params('siguiente=/tutor/1&objetivo=examen'))).toBe('/tutor/1');
    expect(destinoTrasAcceso(params('objetivo=examen'))).toBe('/examenes?nueva=1');
    expect(destinoTrasAcceso(params('objetivo=aprendizaje'))).toBe('/aprendizaje?empezar=1');
    expect(destinoTrasAcceso(params('siguiente=//malo.com'))).toBe('/inicio');
    expect(destinoTrasAcceso(params(''))).toBe('/inicio');
  });

  it('propaga solo valores válidos entre ingreso y registro', () => {
    expect(consultaDeIntencion(params('objetivo=examen&siguiente=/examenes'))).toBe('?objetivo=examen&siguiente=%2Fexamenes');
    expect(consultaDeIntencion(params('objetivo=otro&siguiente=//malo'))).toBe('');
  });
});
