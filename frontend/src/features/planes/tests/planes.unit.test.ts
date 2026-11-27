import { describe, expect, it } from 'vitest';
import { PLANES, RECURSOS_AUN_NO_DISPONIBLES } from '../planes';

describe('planes: presentación comercial', () => {
  it('conserva precios y límites aprobados de los planes de aprendizaje', () => {
    const resumen = PLANES.filter((p) => p.publico === 'ESTUDIANTE').map((p) => [p.codigo, p.precio, Object.fromEntries(p.recursos)]);
    expect(resumen).toEqual([
      ['EST_GRATUITO', 'S/ 0', { 'Consultas generales': '60', 'Consultas técnicas': '15', 'Razonamiento profundo': '2', 'Evaluaciones de 15 preguntas': '3', Ilustraciones: '4', Almacenamiento: '500 MB' }],
      ['EST_ESTANDAR', 'S/ 39,90', { 'Consultas generales': '250', 'Consultas técnicas': '100', 'Razonamiento profundo': '20', 'Evaluaciones de 15 preguntas': '10', Ilustraciones: '10', Almacenamiento: '2 GB' }],
      ['EST_PLUS', 'S/ 59,90', { 'Consultas generales': '450', 'Consultas técnicas': '200', 'Razonamiento profundo': '50', 'Evaluaciones de 15 preguntas': '20', Ilustraciones: '25', Almacenamiento: '5 GB' }],
      ['EST_PREMIUM', 'S/ 89,90', { 'Consultas generales': '750', 'Consultas técnicas': '350', 'Razonamiento profundo': '100', 'Evaluaciones de 15 preguntas': '40', Ilustraciones: '50', Almacenamiento: '10 GB' }],
    ]);
  });
  it('marca como aún no disponibles solo recursos que existen en los planes, sin quitarlos', () => {
    const nombres = new Set(PLANES.filter((p) => p.publico === 'ESTUDIANTE').flatMap((p) => p.recursos.map(([n]) => n)));
    for (const n of RECURSOS_AUN_NO_DISPONIBLES.nombres) expect(nombres.has(n)).toBe(true);
    expect(RECURSOS_AUN_NO_DISPONIBLES.nombres).not.toContain('Consultas generales');
    expect(RECURSOS_AUN_NO_DISPONIBLES.codigos).toEqual(['RAZONAMIENTO_PROFUNDO', 'EVALUACION_EQUIVALENTE', 'ILUSTRACION_ESTANDAR']);
  });
});
