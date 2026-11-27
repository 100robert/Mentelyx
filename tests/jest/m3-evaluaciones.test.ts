import type { Pregunta } from '@mentelyx/contratos/educacion/pregunta-esquema';
import { barajar, calificar, exigirAbierto, proyectar, repasar, traducir } from '../../backend/src/modules/evaluaciones-aprendizaje/dominio/evaluacion';
import { crearCasosPreparacionesV1 } from '../../backend/src/modules/evaluaciones-aprendizaje/aplicacion/preparaciones-v1.use-cases';
import type {
  BancoPreguntasPort,
  IntentoGuardado,
  IntentosRepositorio,
  PreparacionRepositorio,
  RespuestaGuardada,
  TarjetasRepositorio,
  VersionBanco,
} from '../../backend/src/modules/evaluaciones-aprendizaje/dominio/preparacion';

/** M3 · preparación de exámenes: proyección sin soluciones, calificación oficial, plazo del servidor, idempotencia y propiedad. */
const P: Pregunta[] = [
  { id: 'p1', version: 1, tipo: 'opcion-unica', tema: 'Derivadas', dificultad: 'basica', enunciado: '¿d/dx x²?', origen: 'persona', opciones: [{ id: 'a', texto: '2x' }, { id: 'b', texto: 'x' }], correcta: 'a', explicacion: 'Regla de la potencia' },
  { id: 'p2', version: 1, tipo: 'numerica', tema: 'Límites', dificultad: 'media', enunciado: 'lím x→2 de x²', origen: 'persona', respuesta: 4, tolerancia: { tipo: 'absoluta', valor: 0.01 } },
  { id: 'p3', version: 1, tipo: 'relacion', tema: 'Límites', dificultad: 'media', enunciado: 'Relaciona', origen: 'persona', pares: [{ id: 'r1', izquierda: 'sen', derecha: 'cos' }, { id: 'r2', izquierda: 'ln x', derecha: '1/x' }, { id: 'r3', izquierda: 'eˣ', derecha: 'e elevado a x' }] },
  { id: 'p4', version: 1, tipo: 'ordenamiento', tema: 'Límites', dificultad: 'basica', enunciado: 'Ordena', origen: 'persona', elementos: [{ id: 'e1', texto: 'uno' }, { id: 'e2', texto: 'dos' }, { id: 'e3', texto: 'tres' }], orden: ['e1', 'e2', 'e3'] },
  { id: 'p5', version: 1, tipo: 'abierta', tema: 'Derivadas', dificultad: 'avanzada', enunciado: 'Explica la regla de la cadena', origen: 'persona', criterios: ['Composición'] },
] as Pregunta[];

describe('M3 · dominio de evaluación', () => {
  it('la proyección pública no contiene soluciones ni el orden correcto', () => {
    const texto = JSON.stringify(P.map((p) => proyectar(p, 'semilla').publica));
    for (const campo of ['"correcta"', '"respuesta"', '"tolerancia"', '"orden"', '"explicacion"']) expect(texto).not.toContain(campo);
  });

  it('en relación, las «derechas» se permutan y la respuesta se traduce a los pares reales al calificar', () => {
    const { publica, proyeccion } = proyectar(P[2]!, 'intento-1');
    const pares = publica.pares as Array<{ id: string; derecha: string }>;
    const verdadera = Object.fromEntries((P[2] as Extract<Pregunta, { tipo: 'relacion' }>).pares.map((x) => [x.id, x.derecha]));
    const asignacion = Object.fromEntries(pares.map((izq) => [izq.id, pares.find((d) => d.derecha === verdadera[izq.id])!.id]));
    const r = traducir(P[2]!, { tipo: 'pares', asignacion }, proyeccion!);
    expect(r).toEqual({ tipo: 'pares', asignacion: { r1: 'r1', r2: 'r2', r3: 'r3' } });
  });

  it('calificación oficial: 1 punto por pregunta automática, crédito parcial, abiertas PENDIENTE fuera del máximo', () => {
    const c = calificar(P, { p1: { tipo: 'opcion', id: 'a' }, p2: { tipo: 'texto', valor: '4,001' }, p4: { tipo: 'orden', ids: ['e1', 'e3', 'e2'] }, p5: { tipo: 'texto', valor: 'algo' } }, {});
    expect(c.maximo).toBe(4);
    expect(c.pendientes).toBe(1);
    expect(c.puntaje).toBeCloseTo(2 + 1 / 3, 3); // p1 + p2 + 1/3 de p4; p3 sin responder
    expect(c.porTema.find((t) => t.tema === 'Derivadas')).toMatchObject({ maximo: 1, pendientes: 1 });
  });

  it('el plazo lo controla el servidor y un intento calificado no admite cambios', () => {
    const vence = new Date('2026-11-27T10:00:00Z');
    expect(() => exigirAbierto({ estado: 'EN_CURSO', venceEn: vence }, new Date('2026-11-27T09:59:00Z'))).not.toThrow();
    expect(() => exigirAbierto({ estado: 'EN_CURSO', venceEn: vence }, new Date('2026-11-27T10:00:01Z'))).toThrow(/tiempo/);
    expect(() => exigirAbierto({ estado: 'CALIFICADO', venceEn: null }, vence)).toThrow(/entregó/);
  });

  it('el barajado es determinista por semilla y la repetición espaciada sigue SM-2', () => {
    expect(barajar([1, 2, 3, 4, 5], 'x')).toEqual(barajar([1, 2, 3, 4, 5], 'x'));
    const ahora = new Date('2026-11-27T00:00:00Z');
    const r1 = repasar({ intervaloDias: 0, facilidad: 2.5, repeticiones: 0 }, 'BIEN', ahora);
    const r2 = repasar({ intervaloDias: r1.intervaloDias, facilidad: r1.facilidad, repeticiones: r1.repeticiones }, 'BIEN', ahora);
    expect([r1.intervaloDias, r2.intervaloDias]).toEqual([1, 6]);
    expect(repasar(r2 as never, 'OTRA_VEZ', ahora)).toMatchObject({ intervaloDias: 0, repeticiones: 0 });
    expect(repasar({ intervaloDias: 0, facilidad: 1.3, repeticiones: 0 }, 'OTRA_VEZ', ahora).facilidad).toBeGreaterThanOrEqual(1.3);
  });
});

/** Dobles en memoria de los puertos de M3 (sin base de datos). */
function entorno() {
  const preps = new Map([['prep-a', { duenio: 'ana' }]]);
  const bancos: VersionBanco[] = [];
  const intentos = new Map<string, IntentoGuardado & { estudianteId: string }>();
  const respuestas = new Map<string, RespuestaGuardada[]>();
  let ahora = new Date('2026-11-27T12:00:00Z');
  const resumen = (id: string) => ({ id, nombre: 'Parcial', asignatura: 'Cálculo', fechaExamen: null, estado: 'ACTIVA' as const, minutosSemanales: 180, fuente: 'PERSONAL' as const, avance: { completadas: 0, total: 0 }, creadaEn: ahora.toISOString() });
  const repo = {
    resumen: async (actor: string, id: string) => (preps.get(id)?.duenio === actor ? resumen(id) : null),
    listar: async (actor: string) => [...preps].filter(([, v]) => v.duenio === actor).map(([id]) => resumen(id)),
  } as unknown as PreparacionRepositorio;
  const banco: BancoPreguntasPort = {
    ultima: async (_o, id) => bancos.filter((b) => (b as never as { prep: string }).prep === id).at(-1) ?? null,
    version: async (_o, id, v) => bancos.find((b) => (b as never as { prep: string }).prep === id && b.version === v) ?? null,
    porClave: async (_o, id, k) => bancos.find((b) => (b as never as { prep: string }).prep === id && b.operationKey === k) ?? null,
    publicar: async (_o, id, base, preguntas, operationKey) => {
      if (bancos.some((b) => (b as never as { prep: string }).prep === id && b.version === base + 1)) return 'CONFLICTO';
      bancos.push({ version: base + 1, preguntas, creadaEn: ahora, operationKey, prep: id } as VersionBanco);
      return 'OK';
    },
  };
  const repoIntentos: IntentosRepositorio = {
    crear: async (i) => {
      const previo = [...intentos.values()].find((x) => x.estudianteId === i.estudianteId && x.operationKey === i.operationKey);
      if (previo) return { intento: previo, repetido: true };
      const n = { ...i, id: i.id ?? `int-${intentos.size + 1}`, estado: 'EN_CURSO' as const, entregadoEn: null, fueraDeTiempo: null, puntaje: null, maximo: null, pendientes: null, resultados: null, claveEntrega: null };
      intentos.set(n.id, n);
      return { intento: n, repetido: false };
    },
    obtener: async (e, id) => (intentos.get(id)?.estudianteId === e ? intentos.get(id)! : null),
    listar: async (e, prep) => [...intentos.values()].filter((x) => x.estudianteId === e && x.preparacionId === prep),
    respuestas: async (id) => respuestas.get(id) ?? [],
    guardarRespuesta: async (id, preguntaId, respuesta, comprobada) => {
      if (intentos.get(id)?.estado !== 'EN_CURSO') return 'CERRADO';
      const lista = (respuestas.get(id) ?? []).filter((r) => r.preguntaId !== preguntaId);
      const r = { preguntaId, respuesta, revision: 1, comprobada };
      respuestas.set(id, [...lista, r]);
      return r;
    },
    calificar: async (id, clave, c) => {
      const i = intentos.get(id)!;
      if (i.estado !== 'EN_CURSO') return 'YA_CALIFICADO';
      intentos.set(id, { ...i, estado: 'CALIFICADO', claveEntrega: clave, entregadoEn: c.entregadoEn, fueraDeTiempo: c.fueraDeTiempo, puntaje: c.calificacion.puntaje, maximo: c.calificacion.maximo, pendientes: c.calificacion.pendientes, resultados: c.calificacion });
      return 'OK';
    },
  };
  const casos = crearCasosPreparacionesV1({
    repo,
    bancos: banco,
    intentos: repoIntentos,
    tarjetas: {} as TarjetasRepositorio,
    fuentesAutorizadas: async () => [],
    carpetas: { validar: async () => {}, asignar: async () => {}, ubicacion: async () => new Map() },
    ahora: () => ahora,
  });
  return { casos, avanzar: (ms: number) => (ahora = new Date(ahora.getTime() + ms)) };
}

describe('M3 · casos de uso de preparaciones V1', () => {
  it('el banco valida mentelyx.pregunta/v1 en el servidor, fija el origen y es idempotente por clave', async () => {
    const { casos } = entorno();
    const malo = { ...P[0], id: 'malo', correcta: 'z' };
    const r = await casos.agregarPreguntas('ana', 'prep-a', 'clave-banco-1', { preguntas: [...P.map((p) => ({ ...p, origen: 'material', procedencia: 'Libro' })), malo] });
    expect(r).toMatchObject({ version: 1, agregadas: 5, repetida: false });
    expect(r.rechazadas[0]!.id).toBe('malo');
    expect((await casos.agregarPreguntas('ana', 'prep-a', 'clave-banco-1', { preguntas: [P[0]] })).repetida).toBe(true);
    const b = await casos.banco('ana', 'prep-a');
    expect(b.preguntas.every((p) => p.origen === 'persona' && !('procedencia' in p) && !('correcta' in p))).toBe(true);
  });

  it('otra cuenta recibe 404 en el banco, el intento y sus respuestas', async () => {
    const { casos } = entorno();
    await casos.agregarPreguntas('ana', 'prep-a', 'clave-banco-1', { preguntas: P });
    await expect(casos.banco('beto', 'prep-a')).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    const i = await casos.crearIntento('ana', 'prep-a', 'clave-intento-1', { modo: 'SIMULACRO', preguntaIds: ['p1'] });
    await expect(casos.intento('beto', i.intento.id)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    await expect(casos.guardarRespuesta('beto', i.intento.id, 'p1', { respuesta: { tipo: 'opcion', id: 'a' } })).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
  });

  it('simulacro: sin soluciones antes de entregar, plazo del servidor y calificación única e idempotente', async () => {
    const { casos, avanzar } = entorno();
    await casos.agregarPreguntas('ana', 'prep-a', 'clave-banco-1', { preguntas: P });
    await expect(casos.crearIntento('ana', 'prep-a', 'clave-x', { modo: 'SIMULACRO', preguntaIds: ['zz'] })).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    const i = await casos.crearIntento('ana', 'prep-a', 'clave-intento-1', { modo: 'SIMULACRO', preguntaIds: ['p1', 'p2'], minutos: 10 });
    expect(JSON.stringify(i.preguntas)).not.toContain('"correcta"');
    expect((await casos.crearIntento('ana', 'prep-a', 'clave-intento-1', { modo: 'SIMULACRO', preguntaIds: ['p1', 'p2'], minutos: 10 })).repetido).toBe(true);
    const g = await casos.guardarRespuesta('ana', i.intento.id, 'p1', { respuesta: { tipo: 'opcion', id: 'a' }, comprobar: true });
    expect(g.correccion).toBeNull(); // en simulacro, «comprobar» no revela nada
    avanzar(11 * 60_000);
    await expect(casos.guardarRespuesta('ana', i.intento.id, 'p2', { respuesta: { tipo: 'texto', valor: '4' } })).rejects.toMatchObject({ code: 'INTENTO_CERRADO' });
    const [e1, e2] = await Promise.all([casos.entregar('ana', i.intento.id, 'entrega-1'), casos.entregar('ana', i.intento.id, 'entrega-2')]);
    expect(e1.intento).toMatchObject({ estado: 'CALIFICADO', puntaje: 1, maximo: 2, fueraDeTiempo: true });
    expect(e2.intento.puntaje).toBe(e1.intento.puntaje);
    expect(e1.resultados.preguntas[0]!.pregunta).toMatchObject({ correcta: 'a' }); // tras entregar sí se revela
  });

  it('práctica: comprobar revela la solución de esa pregunta y bloquea su respuesta', async () => {
    const { casos } = entorno();
    await casos.agregarPreguntas('ana', 'prep-a', 'clave-banco-1', { preguntas: P });
    const i = await casos.crearIntento('ana', 'prep-a', 'clave-intento-2', { modo: 'PRACTICA', preguntaIds: ['p2'] });
    const g = await casos.guardarRespuesta('ana', i.intento.id, 'p2', { respuesta: { tipo: 'texto', valor: '5' }, comprobar: true });
    expect(g.correccion?.estado).toBe('incorrecta');
    expect(g.pregunta).toMatchObject({ respuesta: 4 });
    await expect(casos.guardarRespuesta('ana', i.intento.id, 'p2', { respuesta: { tipo: 'texto', valor: '4' } })).rejects.toMatchObject({ code: 'INTENTO_CERRADO' });
  });

  it('un banco vacío no permite iniciar intentos y el diagnóstico cubre primero cada tema', async () => {
    const { casos } = entorno();
    await expect(casos.crearIntento('ana', 'prep-a', 'clave-3', { modo: 'PRACTICA' })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await casos.agregarPreguntas('ana', 'prep-a', 'clave-banco-1', { preguntas: P });
    const d = await casos.crearIntento('ana', 'prep-a', 'clave-4', { modo: 'DIAGNOSTICO', cantidad: 2 });
    const temas = new Set((d.preguntas as Array<{ tema: string }>).map((p) => p.tema));
    expect(temas).toEqual(new Set(['Derivadas', 'Límites']));
  });
});
