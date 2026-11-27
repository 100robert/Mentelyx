import { describe, expect, it } from 'vitest';
import { primeraPregunta } from '../primera-pregunta';

describe('primera pregunta de un tema', () => {
  it('combina el tema con la profundidad, lo que ya sabe y el objetivo', () => {
    expect(primeraPregunta('Derivadas', { profundidad: 'inicial', previos: 'nada', objetivo: 'entender' })).toBe(
      'Quiero entenderlo bien: Derivadas. Explícamelo desde cero; no sé nada del tema. Explícamelo paso a paso, con un ejemplo.',
    );
    expect(primeraPregunta('Átomos', { profundidad: 'avanzado', previos: 'bastante', objetivo: 'practicar' })).toContain('propón ejercicios graduados');
  });
  it('cabe en el límite que se pasa por la URL', () => {
    expect(primeraPregunta('x'.repeat(200), { profundidad: 'intermedio', previos: 'algo', objetivo: 'duda' }).length).toBeLessThan(600);
  });
});
