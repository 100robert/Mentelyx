import { describe, expect, it } from 'vitest';
import { validarBloque } from '@mentelyx/contratos/educacion/bloque-validacion';
import { configIa } from '../../../app';
import { extraerEstructura, prefijoBloques } from '../aplicacion/estructura-respuesta';
import type { BindingIa } from '../infraestructura/workers-ai.adapter';

const seccion = (json: unknown) => `Explicación breve.\n\n\`\`\`mentelyx\n${typeof json === 'string' ? json : JSON.stringify(json)}\n\`\`\``;

describe('M6 · proveedor del Tutor por entorno (API 12.11, riesgos)', () => {
  const ai = { run: async () => ({}) } as unknown as BindingIa;
  const base = { IA_RUTA_TECNICA: 'respaldo-general' as const };

  it('desarrollo y CI usan el simulado solo si no se declara otro', () => {
    expect(configIa({ ...base, ENTORNO: 'desarrollo', IA_PROVEEDOR: undefined }, undefined)).toEqual({ proveedor: 'simulado' });
    expect(configIa({ ...base, ENTORNO: 'ci', IA_PROVEEDOR: 'simulado' }, undefined)).toEqual({ proveedor: 'simulado' });
    expect(configIa({ ...base, ENTORNO: 'desarrollo', IA_PROVEEDOR: 'workers-ai' }, ai).proveedor).toBe('workers-ai');
  });

  it('staging y producción exigen proveedor real o deshabilitación explícita; nunca el simulado', () => {
    for (const ENTORNO of ['staging', 'produccion'] as const) {
      expect(() => configIa({ ...base, ENTORNO, IA_PROVEEDOR: undefined }, ai)).toThrow(/obligatorio/);
      expect(() => configIa({ ...base, ENTORNO, IA_PROVEEDOR: 'simulado' }, ai)).toThrow(/no está permitido/);
      expect(() => configIa({ ...base, ENTORNO, IA_PROVEEDOR: 'workers-ai' }, undefined)).toThrow(/binding AI/);
      expect(configIa({ ...base, ENTORNO, IA_PROVEEDOR: 'deshabilitado' }, undefined)).toEqual({ proveedor: 'deshabilitado' });
      expect(configIa({ ...base, ENTORNO, IA_PROVEEDOR: 'workers-ai' }, ai).proveedor).toBe('workers-ai');
    }
  });
});

describe('M6 · bloques y acciones propuestos por el Tutor (API 12.4)', () => {
  it('expande la notación compacta, valida con el esquema del cliente y quita la sección del texto', () => {
    const r = extraerEstructura(
      seccion({
        bloques: [
          { tipo: 'formula', titulo: 'Cuadrática', latex: 'ax^2+bx+c=0' },
          { tipo: 'pasos', pasos: [{ titulo: 'Identifica', texto: 'a, b y c' }, { titulo: 'Sustituye', texto: 'en la fórmula', latex: 'x=\\frac{-b}{2a}' }] },
          { tipo: 'grafico', funciones: ['x^2-4'], vista: { xMin: -5, xMax: 5, yMin: -6, yMax: 10 } },
          { tipo: 'tabla', columnas: ['x', 'y'], filas: [[1, 2], ['3', '4']] },
        ],
        acciones: [{ accion: 'revelar-paso', bloque: 2, paso: '@todos' }],
      }),
      'tabc',
    );
    expect(r.markdown).toBe('Explicación breve.');
    expect(r.descartados).toBe(0);
    expect(r.bloques.map((b) => (b as { tipo: string }).tipo)).toEqual(['formula', 'pasos', 'grafico', 'tabla']);
    for (const b of r.bloques) expect(validarBloque(b).ok).toBe(true);
    expect(r.bloques.every((b) => (b as { origen: string }).origen === 'tutor')).toBe(true);
    expect(r.acciones).toEqual([{ accion: 'revelar-paso', bloqueId: 'tabc-b2', paso: '@todos' }]);
  });

  it('descarta bloques inválidos y acciones que no aplican, sin desplazar las referencias', () => {
    const r = extraerEstructura(
      seccion({
        bloques: [
          { tipo: 'grafico', funciones: ['alert(1)'] },
          { tipo: 'html', contenido: '<script>' },
          { tipo: 'pasos', pasos: [{ titulo: 'Uno', texto: 'a' }] },
        ],
        acciones: [
          { accion: 'revelar-paso', bloque: 1, paso: '@todos' },
          { accion: 'crear-bloque', bloque: { tipo: 'texto' } },
          { accion: 'revelar-paso', bloque: 3, paso: 'p1' },
          { accion: 'modificar-parametro', bloque: 3, parametro: 'a', valor: 2 },
        ],
      }),
      'tdef',
    );
    expect(r.bloques).toHaveLength(1);
    expect((r.bloques[0] as { id: string }).id).toBe('tdef-b3');
    expect(r.acciones).toEqual([{ accion: 'revelar-paso', bloqueId: 'tdef-b3', paso: 'p1' }]);
    expect(r.descartados).toBe(5);
  });

  it('una sección que no es JSON no rompe la respuesta ni se muestra como texto', () => {
    const r = extraerEstructura(seccion('{"bloques": [ esto no es json'), 'tghi');
    expect(r).toMatchObject({ markdown: 'Explicación breve.', bloques: [], acciones: [], descartados: 1 });
  });

  it('sin sección devuelve el texto intacto y los prefijos son identificadores válidos', () => {
    expect(extraerEstructura('Solo texto con $x^2$.', 'tjkl')).toEqual({ markdown: 'Solo texto con $x^2$.', bloques: [], acciones: [], descartados: 0 });
    for (let i = 0; i < 20; i++) expect(`${prefijoBloques()}-b12`).toMatch(/^[a-z][a-z0-9_-]{0,31}$/);
  });
});
