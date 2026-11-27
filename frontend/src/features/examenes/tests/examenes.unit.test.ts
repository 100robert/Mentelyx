import { describe, expect, it } from 'vitest';
import { CALCULO, EJEMPLOS, MULTIDISCIPLINAR } from '../ejemplo/datos';
import { corregir, equivalentes, leerNumero, respondida } from '../preguntas/corregir';
import { CATALOGO_TIPOS, validarBanco, validarPregunta, type Pregunta } from '../preguntas/esquema';
import { interpretarFrase } from '../preparaciones/interpretar';
import {
  asignaturaDeCodigo,
  codigoArea,
  desdePlanUnico,
  estadoPreparacion,
  siguienteActividad,
  solicitudObjetivo,
  validarBorrador,
  validarFecha,
  type Borrador,
  type PreparacionUnicaApi,
} from '../preparaciones/modelo';
import { actividad, recomendaciones, rendimientoObservado } from '../progreso/progreso';
import { elegirPreguntas, iniciarSimulacro, msRestantes, pendientes, reducirSimulacro, resultados } from '../simulacro/simulacro';
import { calificar, iniciarRonda, resumenRonda, revelar } from '../tarjetas/tarjetas';
import { agregarTema, editarTema, moverTema, quitarTema, sugerenciasDeTexto } from '../temario/temario';

const HOY = '2026-11-26';
const borrador = (b: Partial<Borrador> = {}): Borrador => ({
  nombre: '',
  asignatura: 'Cálculo diferencial',
  temas: [{ codigo: 'a', titulo: 'Límites', origen: 'persona' }],
  fechaExamen: '',
  minutosSemanales: null,
  previos: null,
  objetivo: null,
  fuentes: [],
  carpetaId: null,
  ...b,
});
const banco = (b: { banco: unknown[] }) => validarBanco(b.banco).preguntas;

describe('preparaciones', () => {
  it('interpreta frases en lenguaje natural sin IA', () => {
    const a = interpretarFrase('Tengo un examen de arquitectura de software dentro de tres días', HOY);
    expect(a.asignatura).toBe('Arquitectura de software');
    expect(a.fechaExamen).toBe('2026-11-29');
    const b = interpretarFrase('Necesito preparar mi parcial de cálculo diferencial', HOY);
    expect(b.asignatura).toBe('Cálculo diferencial');
    expect(b.nombre).toBe('Examen parcial de cálculo diferencial');
    expect(b.fechaExamen).toBeUndefined();
    expect(interpretarFrase('Quiero estudiar anatomía para una evaluación', HOY).asignatura).toBe('Anatomía');
    const d = interpretarFrase('Tengo un examen de literatura y no sé por dónde comenzar', HOY);
    expect(d.asignatura).toBe('Literatura');
    expect(d.previos).toBe('nada');
    expect(interpretarFrase('El final de física es el 3 de diciembre', HOY).fechaExamen).toBe('2026-12-03');
    expect(interpretarFrase('examen de química el 2 de enero', HOY).fechaExamen).toBe('2027-01-02');
    expect(interpretarFrase('hola', HOY).reconocido).toEqual([]);
  });

  it('valida la fecha opcional del examen', () => {
    expect(validarFecha('', HOY)).toBeNull();
    expect(validarFecha(null, HOY)).toBeNull();
    expect(validarFecha('2026-11-27', HOY)).toBeNull();
    expect(validarFecha(HOY, HOY)).toContain('posterior');
    expect(validarFecha('2026-02-30', HOY)).toContain('no existe');
    expect(validarFecha('27/11/2026', HOY)).toContain('AAAA');
  });

  it('exige solo asignatura y un tema; respeta el límite del servidor actual', () => {
    expect(validarBorrador(borrador(), HOY, 'unica')).toEqual({});
    expect(validarBorrador(borrador({ asignatura: ' ', temas: [] }), HOY, 'unica')).toMatchObject({ asignatura: expect.any(String), temas: expect.any(String) });
    const once = Array.from({ length: 11 }, (_, k) => ({ codigo: `t${k}`, titulo: `Tema ${k}`, origen: 'persona' as const }));
    expect(validarBorrador(borrador({ temas: once }), HOY, 'unica').temas).toContain('10');
    expect(validarBorrador(borrador({ temas: once }), HOY, 'multiple').temas).toBeUndefined();
    expect(validarBorrador(borrador({ minutosSemanales: 5 }), HOY, 'unica').minutosSemanales).toBeDefined();
  });

  it('arma la solicitud del backend actual sin fuentes (preparación sin documentos)', () => {
    const s = solicitudObjetivo(borrador({ temas: [{ codigo: 'a', titulo: 'Límites', origen: 'persona' }, { codigo: 'b', titulo: ' ', origen: 'persona' }, { codigo: 'c', titulo: 'Derivadas', origen: 'tutor' }] }));
    expect(s).toEqual({ fuente: 'PERSONAL', minutosSemanales: 180, temas: [{ areaCodigo: 'CALCULO-DIFERENCIAL', temaCodigo: 'T01', titulo: 'Límites' }, { areaCodigo: 'CALCULO-DIFERENCIAL', temaCodigo: 'T02', titulo: 'Derivadas' }], fuentes: [] });
    expect(solicitudObjetivo(borrador({ fuentes: ['x'], fechaExamen: '2026-12-01' }))).toMatchObject({ fuente: 'FUENTES', fechaObjetivo: '2026-12-01' });
    expect(codigoArea('¿Álgebra lineal?')).toBe('ALGEBRA-LINEAL');
    expect(codigoArea('—')).toBe('GENERAL');
    expect(asignaturaDeCodigo('ALGEBRA-LINEAL')).toBe('Algebra lineal');
  });

  it('convierte el plan real (una preparación por cuenta) en la vista', () => {
    const api: PreparacionUnicaApi = {
      objetivo: { id: 'o1', fuente: 'PERSONAL', fechaObjetivo: '2026-12-05', minutosSemanales: 180 },
      plan: {
        id: 'p1',
        version: 1,
        reglaVersion: 'plan-determinista-v1',
        actividades: [
          { id: 'b', orden: 2, areaCodigo: 'FISICA', temaCodigo: 'T01', titulo: 'Practicar: Cinemática', tipo: 'PRACTICA', fechaLimite: '2026-12-01', minutosEstimados: 45, estado: 'PENDIENTE', completadaEn: null },
          { id: 'a', orden: 1, areaCodigo: 'FISICA', temaCodigo: 'T01', titulo: 'Estudiar: Cinemática', tipo: 'LECCION', fechaLimite: '2026-11-28', minutosEstimados: 45, estado: 'COMPLETADA', completadaEn: '2026-11-26T10:00:00Z' },
        ],
      },
    };
    const v = desdePlanUnico(api);
    expect(v).toMatchObject({ id: 'o1', modo: 'unica', nombre: null, asignatura: 'Fisica', avance: { completadas: 1, total: 2 } });
    expect(v.temas).toEqual([{ codigo: 'T01', titulo: 'Cinemática', origen: 'persona' }]);
    expect(siguienteActividad(v)?.id).toBe('b');
    expect(estadoPreparacion(v, HOY)).toBe('proxima');
    expect(estadoPreparacion({ ...v, fechaExamen: null }, HOY)).toBe('activa');
    expect(estadoPreparacion({ ...v, avance: { completadas: 2, total: 2 } }, HOY)).toBe('completada');
  });
});

describe('temario', () => {
  it('agrega, edita, quita y reordena sin duplicados', () => {
    let t = agregarTema([], ' Límites ');
    t = agregarTema(t, 'límites');
    t = agregarTema(t, 'Derivadas', 'tutor');
    expect(t.map((x) => [x.titulo, x.origen])).toEqual([['Límites', 'persona'], ['Derivadas', 'tutor']]);
    t = moverTema(t, t[1]!.codigo, -1);
    expect(t[0]!.titulo).toBe('Derivadas');
    expect(moverTema(t, t[0]!.codigo, -1)).toEqual(t);
    t = editarTema(t, t[0]!.codigo, 'Derivada por definición');
    t = quitarTema(t, t[1]!.codigo);
    expect(t.map((x) => x.titulo)).toEqual(['Derivada por definición']);
  });
  it('lee las sugerencias del Tutor de una lista en Markdown', () => {
    expect(sugerenciasDeTexto('Te propongo:\n1. **Límites**: idea intuitiva\n2. Derivada — definición\n- Reglas de derivación [1]\n- Límites\nTexto final.')).toEqual(['Límites', 'Derivada', 'Reglas de derivación']);
    expect(sugerenciasDeTexto('No encontré pasajes de tus fuentes.')).toEqual([]);
  });
});

describe('preguntas', () => {
  it('los bancos de ejemplo validan por completo y cubren los tipos', () => {
    for (const e of EJEMPLOS) {
      const r = validarBanco(e.banco);
      expect(r.rechazadas, JSON.stringify(r.rechazadas)).toEqual([]);
    }
    const tipos = new Set([...banco(CALCULO), ...banco(MULTIDISCIPLINAR)].map((p) => p.tipo));
    expect([...tipos].sort()).toEqual(['abierta', 'caso', 'expresion', 'identificar', 'numerica', 'opcion-multiple', 'opcion-unica', 'ordenamiento', 'relacion', 'verdadero-falso']);
    expect(CATALOGO_TIPOS).toHaveLength(12);
  });
  it('rechaza preguntas inválidas o inseguras', () => {
    const p = banco(CALCULO)[0]!;
    expect(validarPregunta({ ...p, correcta: 'z' }).ok).toBe(false);
    expect(validarPregunta({ ...p, onclick: 'alert(1)' }).ok).toBe(false);
    expect(validarPregunta({ ...p, apoyo: { tipo: 'iframe', src: 'https://x' } }).ok).toBe(false);
    expect(validarPregunta({ ...p, version: 2 }).ok).toBe(false);
    expect(validarPregunta({ id: 'x', version: 1, tipo: 'identificar', tema: 't', dificultad: 'basica', origen: 'tutor', enunciado: 'e', objeto: { tipo: 'texto' }, correcta: 'a' }).ok).toBe(false);
  });
});

describe('corrección', () => {
  const B = [...banco(CALCULO), ...banco(MULTIDISCIPLINAR)];
  const P = (id: string) => B.find((p) => p.id === id)! as Pregunta;
  it('opciones, verdadero o falso e identificación son deterministas', () => {
    expect(corregir(P('lim-factor'), { tipo: 'opcion', id: 'c' }).estado).toBe('correcta');
    expect(corregir(P('lim-factor'), { tipo: 'opcion', id: 'a' }).estado).toBe('incorrecta');
    expect(corregir(P('lim-factor'), { tipo: 'opcion', id: null }).estado).toBe('sin-responder');
    expect(corregir(P('lim-definida'), { tipo: 'booleano', valor: false }).estado).toBe('correcta');
    expect(corregir(P('ing-bujia'), { tipo: 'opcion', id: 'bujia' }).estado).toBe('correcta');
    expect(corregir(P('art-eco'), { tipo: 'opcion', id: 'fuji' }).estado).toBe('incorrecta');
  });
  it('selección múltiple con crédito parcial y penalización por errores', () => {
    expect(corregir(P('reg-multiple'), { tipo: 'opciones', ids: ['a', 'c', 'd'] }).estado).toBe('correcta');
    const parcial = corregir(P('reg-multiple'), { tipo: 'opciones', ids: ['a', 'c'] });
    expect(parcial.estado).toBe('parcial');
    expect(parcial.puntaje).toBeCloseTo(2 / 3);
    expect(corregir(P('reg-multiple'), { tipo: 'opciones', ids: ['a', 'b'] }).puntaje).toBe(0);
  });
  it('numéricas con tolerancia explícita, fracciones y coma decimal', () => {
    expect(corregir(P('def-numero'), { tipo: 'texto', valor: '-2' }).estado).toBe('correcta');
    expect(corregir(P('def-numero'), { tipo: 'texto', valor: '-4/2' }).estado).toBe('correcta');
    expect(corregir(P('def-numero'), { tipo: 'texto', valor: '−2,0000001' }).estado).toBe('correcta');
    expect(corregir(P('def-numero'), { tipo: 'texto', valor: '-2,1' }).estado).toBe('incorrecta');
    expect(corregir(P('apl-velocidad'), { tipo: 'texto', valor: '30,2' }).estado).toBe('correcta');
    expect(corregir(P('apl-velocidad'), { tipo: 'texto', valor: '31' }).estado).toBe('incorrecta');
    expect(corregir(P('def-numero'), { tipo: 'texto', valor: 'fetch(1)' }).estado).toBe('invalida');
    expect(leerNumero('1/0')).toBeNull();
  });
  it('equivalencia matemática por evaluación, no por texto', () => {
    expect(corregir(P('reg-polinomio'), { tipo: 'texto', valor: '2 + 6x' }).estado).toBe('correcta');
    expect(corregir(P('reg-polinomio'), { tipo: 'texto', valor: '2(3x + 1)' }).estado).toBe('correcta');
    expect(corregir(P('reg-polinomio'), { tipo: 'texto', valor: '6x' }).estado).toBe('incorrecta');
    expect(corregir(P('reg-producto'), { tipo: 'texto', valor: 'x cos(x) + sen(x)' }).estado).toBe('correcta');
    expect(corregir(P('apl-tangente'), { tipo: 'texto', valor: '6(x - 3) + 9' }).estado).toBe('correcta');
    expect(corregir(P('reg-polinomio'), { tipo: 'texto', valor: 'y + 1' }).estado).toBe('invalida');
    expect(corregir(P('reg-polinomio'), { tipo: 'texto', valor: '6x + 2' }).criterio).toContain('no simbólica');
    expect(equivalentes('sqrt(x^2)', 'abs(x)', ['x'], { min: -3, max: 3 }).ok).toBe(true);
    expect(equivalentes('sqrt(x^2)', 'x', ['x'], { min: -3, max: 3 }).ok).toBe(false);
  });
  it('orden y relación con crédito parcial', () => {
    expect(corregir(P('def-orden'), { tipo: 'orden', ids: ['cociente', 'desarrollar', 'simplificar', 'limite'] }).estado).toBe('correcta');
    expect(corregir(P('def-orden'), { tipo: 'orden', ids: ['cociente', 'simplificar', 'desarrollar', 'limite'] }).puntaje).toBe(0.5);
    expect(corregir(P('bio-relacion'), { tipo: 'pares', asignacion: { cloroplasto: 'cloroplasto', mitocondria: 'nucleo' } }).puntaje).toBe(0.25);
  });
  it('las abiertas quedan pendientes de evaluación y los casos combinan subpreguntas', () => {
    const a = corregir(P('apl-explica'), { tipo: 'texto', valor: 'Porque la secante se vuelve tangente.' });
    expect(a.estado).toBe('pendiente');
    expect(a.puntaje).toBeNull();
    const c = corregir(P('apl-caso'), { tipo: 'caso', respuestas: { minimo: { tipo: 'texto', valor: '5' }, costo: { tipo: 'texto', valor: '15' }, justifica: { tipo: 'texto', valor: 'C′′ > 0' } } });
    expect(c.estado).toBe('pendiente');
    expect(c.puntaje).toBe(1);
    expect(corregir(P('ing-caso'), { tipo: 'caso', respuestas: { ciclos: { tipo: 'texto', valor: '3000' } } }).puntaje).toBe(0);
    expect(respondida({ tipo: 'caso', respuestas: {} })).toBe(false);
  });
});

describe('simulacro', () => {
  const B = banco(CALCULO);
  const config = { nombre: 'Simulacro 1', temas: [], cantidad: 5, dificultades: [], tipos: [], minutos: 20, semilla: 7 };
  it('elige preguntas de forma determinista según la configuración', () => {
    expect(elegirPreguntas(B, config)).toEqual(elegirPreguntas(B, config));
    expect(elegirPreguntas(B, { ...config, temas: ['Límites'], cantidad: 10 }).every((id) => B.find((p) => p.id === id)!.tema === 'Límites')).toBe(true);
    expect(iniciarSimulacro(B, { ...config, temas: ['Inexistente'] }, 0)).toBeNull();
  });
  it('navega, marca, resume y entrega sin corregir durante el intento', () => {
    // Solo preguntas de respuesta escrita, para responder todas con texto.
    let e = iniciarSimulacro(B, { ...config, tipos: ['numerica', 'expresion'] }, 1000)!;
    const [p1, p2] = e.preguntas;
    e = reducirSimulacro(e, { tipo: 'responder', id: p1!, respuesta: { tipo: 'texto', valor: '1' } });
    e = reducirSimulacro(e, { tipo: 'marcar', id: p2! });
    e = reducirSimulacro(e, { tipo: 'siguiente' });
    expect(e.actual).toBe(1);
    expect(e.marcadas).toEqual([p2]);
    expect(pendientes(e)).toHaveLength(4);
    for (let k = 0; k < 10; k++) e = reducirSimulacro(e, { tipo: 'siguiente' });
    expect(e.fase).toBe('resumen');
    e = reducirSimulacro(e, { tipo: 'volver', indice: 0 });
    expect(e.fase).toBe('en-curso');
    expect(msRestantes(e, 1000 + 60_000)).toBe(19 * 60_000);
    e = reducirSimulacro(e, { tipo: 'entregar', ahora: 61_000 });
    expect(e.fase).toBe('entregado');
    expect(reducirSimulacro(e, { tipo: 'responder', id: p2!, respuesta: { tipo: 'texto', valor: '2' } })).toBe(e);
    const r = resultados(B, e.preguntas, e.respuestas, e.fin! - e.inicio);
    expect(r.total).toBe(5);
    expect(r.respondidas).toBe(1);
    expect(r.sinResponder).toBe(4);
    expect(r.tiempoMs).toBe(60_000);
  });
  it('el tiempo agotado entrega y lo indica', () => {
    const e = reducirSimulacro(iniciarSimulacro(B, config, 0)!, { tipo: 'tiempo-agotado', ahora: 1_200_000 });
    expect(e.porTiempo).toBe(true);
    expect(e.fase).toBe('entregado');
  });
  it('los resultados separan correctas, incorrectas y pendientes por tema', () => {
    const ids = ['lim-factor', 'def-numero', 'apl-explica'];
    const r = resultados(B, ids, { 'lim-factor': { tipo: 'opcion', id: 'c' }, 'def-numero': { tipo: 'texto', valor: '5' }, 'apl-explica': { tipo: 'texto', valor: 'algo' } });
    expect([r.correctas, r.incorrectas, r.pendientes]).toEqual([1, 1, 1]);
    expect(r.puntaje).toBe(0.5);
    expect(r.porTema.find((t) => t.tema === 'Aplicaciones de la derivada')).toMatchObject({ pendientes: 1, puntaje: null });
  });
});

describe('tarjetas y seguimiento', () => {
  it('repite en la ronda las tarjetas difíciles, como máximo tres veces', () => {
    let e = iniciarRonda(['a', 'b']);
    expect(calificar(e, 'bien')).toBe(e);
    e = calificar(revelar(e), 'otra-vez');
    expect(e.cola).toEqual(['b', 'a']);
    e = calificar(revelar(e), 'facil');
    for (let k = 0; k < 4; k++) e = calificar(revelar(e), 'otra-vez');
    expect(e.cola).toEqual([]);
    expect(resumenRonda(e)).toMatchObject({ vistas: 2, terminadas: 2, costaron: ['a'] });
  });
  it('distingue actividad, rendimiento observado y no estima dominio sin evidencia', () => {
    const p = CALCULO.preparacion;
    const r = resultados(banco(CALCULO), ['lim-factor', 'lim-infinito'], { 'lim-factor': { tipo: 'opcion', id: 'a' }, 'lim-infinito': { tipo: 'opcion', id: 'c' } });
    const intentos = [{ modo: 'practica' as const, nombre: 'Práctica', resultados: r, terminadoEn: 0 }];
    expect(actividad(p, intentos)).toEqual({ planCompletadas: 0, planTotal: 8, preguntasPracticadas: 2, intentos: 1 });
    expect(rendimientoObservado(intentos)).toEqual([{ tema: 'Límites', correctas: 1, evaluadas: 2, incorrectas: 1 }]);
    const rec = recomendaciones(p, intentos);
    expect(rec[0]).toMatchObject({ motivo: 'errores', tema: 'Límites' });
    expect(rec.filter((x) => x.motivo === 'sin-estudiar')).toHaveLength(4);
    expect(recomendaciones(p, [])).not.toContainEqual(expect.objectContaining({ motivo: 'errores' }));
  });
});

describe('límites documentados de la equivalencia aproximada', () => {
  it('no detecta restricciones de dominio: (√x)² y x «coinciden» si el intervalo es positivo', () => {
    // Límite conocido y documentado: solo se compara donde ambas existen; no es una equivalencia simbólica.
    expect(equivalentes('sqrt(x)^2', 'x', ['x'], { min: 0.5, max: 3 }).ok).toBe(true);
    // Con menos de 12 puntos válidos no se declara equivalencia (conservador).
    const mitad = equivalentes('sqrt(x)^2', 'x', ['x'], { min: -3, max: 3 });
    expect(mitad.ok).toBe(false);
    expect(mitad.motivo).toContain('suficientes puntos');
    expect(equivalentes('sqrt(x)^2', 'x', ['x'], { min: -3, max: -1 }).ok).toBe(false);
  });
  it('no confunde expresiones que difieren dentro del intervalo', () => {
    expect(equivalentes('x^2', 'abs(x)^2 + 0.001', ['x'], { min: -2, max: 2 }).ok).toBe(false);
  });
});
