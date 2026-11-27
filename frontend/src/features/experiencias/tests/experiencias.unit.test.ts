import { describe, expect, it } from 'vitest';
import { aplicarAccion, aplicarAcciones, crearEstado } from '../../bloques/acciones';
import { validarBloque } from '../../bloques/validacion';
import { pendiente } from '../../matematicas';
import { EXPERIENCIAS, experiencia } from '../catalogo';

describe('experiencias de aprendizaje', () => {
  it('tienen claves únicas y se encuentran por clave', () => {
    expect(new Set(EXPERIENCIAS.map((e) => e.clave)).size).toBe(EXPERIENCIAS.length);
    expect(experiencia('derivadas')?.titulo).toContain('derivada');
    expect(experiencia('studio')).toBeNull();
  });

  for (const e of EXPERIENCIAS) {
    it(`«${e.clave}»: todos sus bloques validan y están rotulados como ejemplo`, () => {
      for (const b of e.bloques) {
        const r = validarBloque(b);
        expect(r.ok, `${b.id}: ${r.ok ? '' : r.errores.map((x) => `${x.ruta} ${x.mensaje}`).join('; ')}`).toBe(true);
        expect(b.origen).toBe('ejemplo');
      }
    });
    if (e.recorrido)
      it(`«${e.clave}»: cada paso del recorrido se aplica sin errores con el mismo reductor`, () => {
        const base = crearEstado(e.bloques);
        e.recorrido!.forEach((_, k) => {
          const r = aplicarAcciones(base, e.recorrido!.slice(0, k + 1).flatMap((p) => p.acciones));
          expect(r.error, `paso ${k + 1}: ${r.error?.mensaje}`).toBeNull();
        });
      });
  }

  it('la pizarra de derivadas mantiene el procedimiento y la actividad de acuerdo con los deslizadores', () => {
    const d = experiencia('derivadas')!;
    let estado = crearEstado(d.bloques);
    for (const [parametro, valor] of [['a', 2], ['b', 1], ['p', 3]] as const) {
      const r = aplicarAccion(estado, { accion: 'modificar-parametro', bloqueId: 'pizarra', parametro, valor });
      expect(r.error).toBeNull();
      const v = aplicarAcciones(r.estado, d.vinculos!(estado, r.estado));
      expect(v.error).toBeNull();
      estado = v.estado;
    }
    const practica = estado.bloques.find((b) => b.id === 'practica');
    const esperado = pendiente({ a: 2, b: 1, c: 3 }, 3);
    expect(esperado).toBe(13);
    expect(practica?.tipo === 'ejercicio' && practica.contenido.modo === 'numero' ? practica.contenido.respuesta : null).toBe(esperado);
    const pasos = estado.bloques.find((b) => b.id === 'procedimiento');
    expect(pasos?.tipo === 'pasos' ? pasos.contenido.pasos[3]!.latex : '').toBe("f'(x) = 4x + 1");
    // Sin cambios en los parámetros, los vínculos no proponen acciones.
    expect(d.vinculos!(estado, estado)).toEqual([]);
  });

  it('el recorrido del documento abre las páginas por referencia', () => {
    const d = experiencia('documento')!;
    const r = aplicarAcciones(crearEstado(d.bloques), d.recorrido!.slice(0, 3).flatMap((p) => p.acciones));
    expect(r.estado.activo).toBe('apuntes');
    expect(r.estado.interaccion.apuntes!.vista).toEqual({ tipo: 'pagina', pagina: 3 });
  });
});
