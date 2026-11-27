import { inArray } from 'drizzle-orm';
import { OpenAPIHono } from '@hono/zod-openapi';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ganchoValidacion, manejarErrores, type VariablesBase } from '../../../shared/http';
import { crearConexionBd, type ConexionBd } from '../../../shared/bd/conexion';
import type { ResolverActor } from '../../../shared/sesion';
import { crearModuloEvaluacionesAprendizaje } from '../evaluaciones-aprendizaje.module';
import { learningGoals, studyPlanItems, studyPlans } from '../infraestructura/schema';

type Envoltura<T> = { ok: boolean; data: T; error?: { code: string } };

const actorA = crypto.randomUUID();
const actorB = crypto.randomUUID();
const fuentePropia = crypto.randomUUID();
const sesiones = new Map([
  ['sesion-prueba-a', actorA],
  ['sesion-prueba-b', actorB],
]);
const fuentesDeActor = new Map([[actorA, new Set([fuentePropia])]]);
const ahora = () => new Date('2026-11-25T12:00:00.000Z');
let conexion: ConexionBd;
let api: OpenAPIHono<{ Variables: VariablesBase }>;

const resolverActor: ResolverActor = async (cabeceras) => {
  const token = cabeceras.get('authorization')?.replace(/^Bearer /, '');
  const actorId = token ? sesiones.get(token) : undefined;
  return actorId ? { actorId } : null;
};

async function pedir<T>(sesion: string | undefined, metodo: string, ruta: string, cuerpo?: unknown, clave?: string) {
  const headers = new Headers();
  if (sesion) headers.set('authorization', `Bearer ${sesion}`);
  if (cuerpo !== undefined) headers.set('content-type', 'application/json');
  if (clave) headers.set('idempotency-key', clave);
  const response = await api.request(`/api/v1${ruta}`, {
    method: metodo,
    headers,
    ...(cuerpo === undefined ? {} : { body: JSON.stringify(cuerpo) }),
  });
  return { status: response.status, body: (await response.json()) as Envoltura<T> };
}

beforeAll(() => {
  conexion = crearConexionBd({ DATABASE_URL: process.env.DATABASE_URL!, NEON_WS_PROXY: process.env.NEON_WS_PROXY });
  const modulo = crearModuloEvaluacionesAprendizaje({
    db: conexion.db,
    // Esta suite no usa el banco (Mongo) ni carpetas (M2): dobles que fallan si se invocan.
    mongo: () => Promise.reject(new Error('sin MongoDB en esta suite')),
    carpetas: { validar: async () => {}, asignar: async () => {}, ubicacion: async () => new Map() },
    resolverActor,
    ahora,
    fuentesAutorizadas: async (actorId, filtro) =>
      filtro.contentIds
        .filter((contentId) => fuentesDeActor.get(actorId)?.has(contentId))
        .map((contentId) => ({ contentId, version: 1, titulo: 'Fuente educativa de prueba' })),
  });
  api = new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion });
  api.onError(manejarErrores);
  api.route('/api/v1', modulo.rutas);
});

afterAll(async () => {
  const objetivos = await conexion.db.select({ id: learningGoals.id }).from(learningGoals).where(inArray(learningGoals.studentId, [actorA, actorB]));
  const objetivoIds = objetivos.map((goal) => goal.id);
  if (objetivoIds.length) {
    const planes = await conexion.db.select({ id: studyPlans.id }).from(studyPlans).where(inArray(studyPlans.goalId, objetivoIds));
    const planIds = planes.map((plan) => plan.id);
    if (planIds.length) await conexion.db.delete(studyPlanItems).where(inArray(studyPlanItems.planId, planIds));
    await conexion.db.delete(studyPlans).where(inArray(studyPlans.goalId, objetivoIds));
    await conexion.db.delete(learningGoals).where(inArray(learningGoals.id, objetivoIds));
  }
  await conexion.cerrar();
});

describe('M3 · preparación de examen, plan y progreso', () => {
  it('valida una fuente privada, crea un plan idempotente y refleja actividades completadas', async () => {
    const entrada = {
      fuente: 'FUENTES',
      fechaObjetivo: '2026-12-25',
      minutosSemanales: 180,
      temas: [
        { areaCodigo: 'BIOLOGIA', temaCodigo: 'CELULA', titulo: 'La célula' },
        { areaCodigo: 'BIOLOGIA', temaCodigo: 'GENETICA', titulo: 'Genética básica' },
      ],
      fuentes: [fuentePropia],
    };
    const creado = await pedir<{ preparacion: { objetivo: { id: string }; plan: { id: string; actividades: Array<{ id: string; estado: string }> } }; repetida: boolean }>(
      'sesion-prueba-a',
      'POST',
      '/preparacion/objetivos',
      entrada,
      'objetivo-prueba-01',
    );
    expect(creado.status).toBe(201);
    expect(creado.body.data.repetida).toBe(false);
    expect(creado.body.data.preparacion.plan.actividades).toHaveLength(4);
    expect(creado.body.data.preparacion.plan.actividades.every((actividad) => actividad.estado === 'PENDIENTE')).toBe(true);

    const repetido = await pedir<{ preparacion: { objetivo: { id: string } }; repetida: boolean }>(
      'sesion-prueba-a',
      'POST',
      '/preparacion/objetivos',
      entrada,
      'objetivo-prueba-01',
    );
    expect(repetido.status).toBe(200);
    expect(repetido.body.data.repetida).toBe(true);
    expect(repetido.body.data.preparacion.objetivo.id).toBe(creado.body.data.preparacion.objetivo.id);

    const mismaClaveOtroContenido = await pedir(
      'sesion-prueba-a',
      'POST',
      '/preparacion/objetivos',
      { ...entrada, minutosSemanales: 240 },
      'objetivo-prueba-01',
    );
    expect(mismaClaveOtroContenido.status).toBe(422);
    expect(mismaClaveOtroContenido.body.error?.code).toBe('CLAVE_IDEMPOTENCIA_REUTILIZADA');

    const actividadId = creado.body.data.preparacion.plan.actividades[0]!.id;
    const completada = await pedir<{ estado: string }>('sesion-prueba-a', 'POST', `/preparacion/plan/actividades/${actividadId}/completar`);
    expect(completada.status).toBe(200);
    expect(completada.body.data.estado).toBe('COMPLETADA');

    const progreso = await pedir<{ total: number; completadas: number; porcentaje: number; areas: Array<{ areaCodigo: string; porcentaje: number }> }>(
      'sesion-prueba-a',
      'GET',
      '/preparacion/seguimiento',
    );
    expect(progreso.body.data).toMatchObject({ total: 4, completadas: 1, porcentaje: 25 });
    expect(progreso.body.data.areas).toEqual([{ areaCodigo: 'BIOLOGIA', total: 4, completadas: 1, porcentaje: 25 }]);

    const ajena = await pedir('sesion-prueba-b', 'POST', `/preparacion/plan/actividades/${actividadId}/completar`);
    expect(ajena.status).toBe(404);
    expect(ajena.body.error?.code).toBe('RECURSO_NO_ENCONTRADO');

    const reemplazo = await pedir<{ preparacion: { objetivo: { id: string }; plan: { actividades: Array<{ fechaLimite: string | null }> } }; repetida: boolean }>(
      'sesion-prueba-a',
      'POST',
      '/preparacion/objetivos',
      {
        fuente: 'PERSONAL',
        minutosSemanales: 30,
        temas: [{ areaCodigo: 'BIOLOGIA', temaCodigo: 'ECOLOGIA', titulo: 'Ecología' }],
      },
      'objetivo-prueba-02',
    );
    expect(reemplazo.status).toBe(201);
    expect(reemplazo.body.data.preparacion.objetivo.id).not.toBe(creado.body.data.preparacion.objetivo.id);
    expect(reemplazo.body.data.preparacion.plan.actividades.every((actividad) => actividad.fechaLimite === null)).toBe(true);
  });

  it('rechaza una fuente ajena y llamadas sin sesión antes de persistir objetivos', async () => {
    const entrada = {
      fuente: 'FUENTES',
      minutosSemanales: 60,
      temas: [{ areaCodigo: 'MATEMATICA', temaCodigo: 'FRACCIONES', titulo: 'Fracciones' }],
      fuentes: [fuentePropia],
    };
    const ajena = await pedir('sesion-prueba-b', 'POST', '/preparacion/objetivos', entrada, 'objetivo-ajeno-01');
    expect(ajena.status).toBe(404);
    expect(ajena.body.error?.code).toBe('RECURSO_NO_ENCONTRADO');

    const sinSesion = await pedir(undefined, 'GET', '/preparacion/plan');
    expect(sinSesion.status).toBe(401);
    expect(sinSesion.body.error?.code).toBe('NO_AUTENTICADO');

    const planVacio = await pedir<{ objetivo: null; total: number }>('sesion-prueba-b', 'GET', '/preparacion/seguimiento');
    expect(planVacio.body.data).toMatchObject({ objetivo: null, total: 0 });
  });
});
