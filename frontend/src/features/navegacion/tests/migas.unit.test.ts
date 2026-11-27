import { describe, expect, it } from 'vitest';
import { migasDeRuta } from '../migas';

describe('migas de la barra superior', () => {
  it('nombra el módulo de cada pantalla sin duplicar las migas propias', () => {
    expect(migasDeRuta('/inicio')).toEqual([{ texto: 'Inicio' }]);
    expect(migasDeRuta('/examenes')).toEqual([{ texto: 'Exámenes' }]);
    expect(migasDeRuta('/examenes/abc')).toEqual([{ texto: 'Exámenes', href: '/examenes' }]);
    expect(migasDeRuta('/examenes/abc/estudiar/T01')).toEqual([{ texto: 'Exámenes', href: '/examenes' }]);
    expect(migasDeRuta('/aprendizaje/experiencias/derivadas')).toEqual([{ texto: 'Aprendizaje', href: '/aprendizaje' }]);
    expect(migasDeRuta('/espacios/x')).toEqual([{ texto: 'Aprendizaje', href: '/aprendizaje' }]);
    expect(migasDeRuta('/tutor/x')).toEqual([{ texto: 'Aprendizaje', href: '/aprendizaje' }]);
    expect(migasDeRuta('/espacios')).toEqual([{ texto: 'Aprendizaje', href: '/aprendizaje' }, { texto: 'Temas' }]);
    expect(migasDeRuta('/tutor')).toEqual([{ texto: 'Aprendizaje', href: '/aprendizaje' }, { texto: 'Sesiones' }]);
  });
  it('una ruta desconocida no se presenta como «Inicio»', () => {
    expect(migasDeRuta('/otra')).toEqual([]);
  });
});
