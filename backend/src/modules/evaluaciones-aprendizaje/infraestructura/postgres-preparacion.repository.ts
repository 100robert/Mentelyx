import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { ErrorAplicacion } from '../../../shared/errores';
import type { ActividadPreparacion, PlanPreparacionEntrada, PreparacionActual, PreparacionRepositorio, PreparacionResumen, TemaPreparacion } from '../dominio/preparacion';
import { learningGoals, studyPlanItems, studyPlans } from './schema';

const VERSION_REGLA = 'plan-determinista-v1';
type Tx = Parameters<Parameters<BdDrizzle['transaction']>[0]>[0];
type Ejecutor = Pick<BdDrizzle, 'select'> | Tx;

function mapearActividad(row: typeof studyPlanItems.$inferSelect): ActividadPreparacion {
  return {
    id: row.id,
    orden: row.itemOrder,
    areaCodigo: row.areaCode,
    temaCodigo: row.topicCode,
    titulo: row.title,
    tipo: row.activityType,
    fechaLimite: row.dueDate,
    minutosEstimados: row.estimatedMinutes,
    estado: row.status,
    completadaEn: row.completedAt?.toISOString() ?? null,
  };
}

const hoyIso = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Plan determinista (regla `plan-determinista-v1`, la de 0006): por tema, una lección y una práctica repartidas hasta la
 * fecha del examen. Se reutiliza al crear y al rehacer el temario.
 */
function actividadesPlan(temas: readonly TemaPreparacion[], minutosSemanales: number, fechaObjetivo: string | null, ahora: Date) {
  const horizonteDias = fechaObjetivo ? Math.max(1, Math.round((Date.parse(`${fechaObjetivo}T00:00:00.000Z`) - Date.parse(`${hoyIso(ahora)}T00:00:00.000Z`)) / 86_400_000)) : null;
  const total = temas.length * 2;
  const semanas = horizonteDias ? Math.max(1, Math.ceil(horizonteDias / 7)) : 1;
  const minutos = Math.max(1, Math.floor((minutosSemanales * semanas) / total));
  const fecha = (i: number) => {
    if (!horizonteDias) return null;
    const d = new Date(`${hoyIso(ahora)}T00:00:00.000Z`);
    d.setUTCDate(d.getUTCDate() + Math.max(1, Math.ceil(((i + 1) * horizonteDias) / total)));
    return hoyIso(d);
  };
  const filas = temas.flatMap((tema, k) => [
    { tema, tipo: 'LECCION' as const, orden: k * 2 + 1 },
    { tema, tipo: 'PRACTICA' as const, orden: k * 2 + 2 },
  ]);
  return {
    horizonteDias,
    filas: filas.map((a, i) => ({
      itemOrder: a.orden,
      areaCode: a.tema.areaCodigo,
      topicCode: a.tema.temaCodigo,
      title: `${a.tipo === 'LECCION' ? 'Estudiar' : 'Practicar'}: ${a.tema.titulo}`,
      activityType: a.tipo,
      dueDate: fecha(i),
      estimatedMinutes: minutos,
    })),
  };
}

export class PostgresPreparacionRepositorio implements PreparacionRepositorio {
  constructor(private readonly db: BdDrizzle) {}

  async crearObjetivo(entrada: PlanPreparacionEntrada, hash: string) {
    return this.db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${entrada.actorId}, 0))`);
      const previa = await tx
        .select()
        .from(learningGoals)
        .where(and(eq(learningGoals.studentId, entrada.actorId), eq(learningGoals.operationKey, entrada.operationKey)))
        .limit(1);
      if (previa[0]) {
        if (previa[0].requestHash !== hash) {
          throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La clave ya se usó con otros datos.');
        }
        const resultado = await this.planParaObjetivo(tx, entrada.actorId, previa[0].id);
        if (!resultado) throw new Error('El objetivo idempotente no tiene un plan persistido.');
        return { resultado, repetida: true };
      }

      // V1 (ADR-093): una preparación nueva convive con las demás; ninguna se abandona al crear otra.
      const [goal] = await tx
        .insert(learningGoals)
        .values({
          studentId: entrada.actorId,
          goalSource: entrada.fuente,
          sourceRefs: { fuentes: entrada.fuentes },
          targetDate: entrada.fechaObjetivo ?? null,
          weeklyMinutes: entrada.minutosSemanales,
          operationKey: entrada.operationKey,
          requestHash: hash,
          status: 'ACTIVO',
          name: entrada.nombre ?? null,
          subject: entrada.asignatura ?? null,
        })
        .returning();
      if (!goal) throw new Error('No se pudo persistir el objetivo de estudio.');
      await this.insertarPlan(tx, goal.id, 1, entrada.temas, entrada.fuentes, entrada.minutosSemanales, entrada.fechaObjetivo ?? null, hash, entrada.ahora);
      const resultado = await this.planParaObjetivo(tx, entrada.actorId, goal.id);
      if (!resultado) throw new Error('El plan recién creado no pudo recuperarse.');
      return { resultado, repetida: false };
    });
  }

  private async insertarPlan(
    tx: Tx,
    goalId: string,
    version: number,
    temas: readonly TemaPreparacion[],
    fuentes: unknown,
    minutosSemanales: number,
    fechaObjetivo: string | null,
    hash: string,
    ahora: Date,
    conservar: ReadonlyMap<string, { status: 'PENDIENTE' | 'COMPLETADA' | 'OMITIDA'; completedAt: Date | null }> = new Map(),
  ) {
    const planId = crypto.randomUUID();
    const { horizonteDias, filas } = actividadesPlan(temas, minutosSemanales, fechaObjetivo, ahora);
    const [plan] = await tx
      .insert(studyPlans)
      .values({
        id: planId,
        goalId,
        version,
        ruleVersion: VERSION_REGLA,
        inputsHash: hash,
        generatedFrom: { objetivoId: goalId, temas, fuentes, minutosSemanales, horizonteDias },
        status: 'VIGENTE',
      })
      .returning();
    if (!plan) throw new Error('No se pudo persistir el plan de estudio.');
    await tx.insert(studyPlanItems).values(
      filas.map((f) => {
        const previo = conservar.get(`${f.topicCode}:${f.activityType}`);
        return { planId, ...f, status: previo?.status ?? ('PENDIENTE' as const), completedAt: previo?.completedAt ?? null };
      }),
    );
  }

  async obtenerPlanVigente(actorId: string): Promise<PreparacionActual | null> {
    const [goal] = await this.db
      .select({ id: learningGoals.id })
      .from(learningGoals)
      .where(and(eq(learningGoals.studentId, actorId), eq(learningGoals.status, 'ACTIVO')))
      .orderBy(desc(learningGoals.createdAt))
      .limit(1);
    return goal ? this.planParaObjetivo(this.db, actorId, goal.id) : null;
  }

  async completarActividad(actorId: string, actividadId: string, completadaEn: Date): Promise<ActividadPreparacion> {
    const [item] = await this.db
      .select({ item: studyPlanItems })
      .from(studyPlanItems)
      .innerJoin(studyPlans, eq(studyPlanItems.planId, studyPlans.id))
      .innerJoin(learningGoals, eq(studyPlans.goalId, learningGoals.id))
      .where(and(eq(studyPlanItems.id, actividadId), eq(learningGoals.studentId, actorId), eq(learningGoals.status, 'ACTIVO'), eq(studyPlans.status, 'VIGENTE')))
      .limit(1);
    if (!item) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'La actividad no está disponible para esta cuenta.');
    if (item.item.status !== 'COMPLETADA') {
      const [actualizada] = await this.db
        .update(studyPlanItems)
        .set({ status: 'COMPLETADA', completedAt: completadaEn })
        .where(and(eq(studyPlanItems.id, actividadId), eq(studyPlanItems.status, 'PENDIENTE')))
        .returning();
      if (actualizada) return mapearActividad(actualizada);
    }
    const [actual] = await this.db.select().from(studyPlanItems).where(eq(studyPlanItems.id, actividadId)).limit(1);
    if (!actual) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'La actividad no está disponible para esta cuenta.');
    return mapearActividad(actual);
  }

  async listar(actorId: string): Promise<PreparacionResumen[]> {
    const goals = await this.db.select().from(learningGoals).where(eq(learningGoals.studentId, actorId)).orderBy(desc(learningGoals.createdAt)).limit(200);
    return this.resumir(goals);
  }

  async resumen(actorId: string, preparacionId: string): Promise<PreparacionResumen | null> {
    const goals = await this.db.select().from(learningGoals).where(and(eq(learningGoals.id, preparacionId), eq(learningGoals.studentId, actorId))).limit(1);
    return (await this.resumir(goals))[0] ?? null;
  }

  private async resumir(goals: Array<typeof learningGoals.$inferSelect>): Promise<PreparacionResumen[]> {
    if (!goals.length) return [];
    const avance = await this.db
      .select({
        goalId: studyPlans.goalId,
        total: sql<number>`count(${studyPlanItems.id})::int`,
        completadas: sql<number>`(count(${studyPlanItems.id}) filter (where ${studyPlanItems.status} = 'COMPLETADA'))::int`,
      })
      .from(studyPlans)
      .innerJoin(studyPlanItems, eq(studyPlanItems.planId, studyPlans.id))
      .where(and(inArray(studyPlans.goalId, goals.map((g) => g.id)), eq(studyPlans.status, 'VIGENTE')))
      .groupBy(studyPlans.goalId);
    const porGoal = new Map(avance.map((a) => [a.goalId, a]));
    const temaInicial = async (goalId: string) => {
      const [p] = await this.db.select({ g: studyPlans.generatedFrom }).from(studyPlans).where(eq(studyPlans.goalId, goalId)).orderBy(desc(studyPlans.version)).limit(1);
      const temas = (p?.g as { temas?: TemaPreparacion[] } | undefined)?.temas ?? [];
      return temas[0]?.areaCodigo ?? null;
    };
    return Promise.all(
      goals.map(async (g) => {
        // Preparaciones anteriores a 0007 (alias de una sola): la asignatura se deriva del código de área, sin tildes.
        const area = g.subject ? null : await temaInicial(g.id);
        const asignatura = g.subject ?? (area && area !== 'GENERAL' ? area.charAt(0) + area.slice(1).toLowerCase().replace(/[-_]+/g, ' ') : 'Sin asignatura');
        const a = porGoal.get(g.id);
        return {
          id: g.id,
          nombre: g.name ?? `Examen de ${asignatura.toLowerCase()}`,
          asignatura,
          fechaExamen: g.targetDate,
          estado: g.status === 'ACTIVO' ? ('ACTIVA' as const) : ('ARCHIVADA' as const),
          minutosSemanales: g.weeklyMinutes,
          fuente: g.goalSource,
          avance: { completadas: a?.completadas ?? 0, total: a?.total ?? 0 },
          creadaEn: g.createdAt.toISOString(),
        };
      }),
    );
  }

  async plan(actorId: string, preparacionId: string) {
    return this.planParaObjetivo(this.db, actorId, preparacionId);
  }

  async reemplazarTemario(actorId: string, preparacionId: string, temas: TemaPreparacion[], ahora: Date): Promise<PreparacionActual> {
    return this.db.transaction(async (tx) => {
      // Bloqueo de la fila: dos ediciones simultáneas del temario no crean dos planes vigentes.
      const [goal] = await tx
        .select()
        .from(learningGoals)
        .where(and(eq(learningGoals.id, preparacionId), eq(learningGoals.studentId, actorId)))
        .for('update')
        .limit(1);
      if (!goal) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Preparación no encontrada.');
      const [vigente] = await tx.select().from(studyPlans).where(and(eq(studyPlans.goalId, goal.id), eq(studyPlans.status, 'VIGENTE'))).limit(1);
      const items = vigente ? await tx.select().from(studyPlanItems).where(eq(studyPlanItems.planId, vigente.id)) : [];
      const conservar = new Map(items.map((i) => [`${i.topicCode}:${i.activityType}`, { status: i.status, completedAt: i.completedAt }]));
      if (vigente) await tx.update(studyPlans).set({ status: 'REEMPLAZADO' }).where(eq(studyPlans.id, vigente.id));
      const fuentes = (goal.sourceRefs as { fuentes?: unknown }).fuentes ?? [];
      const hash = `temario:${crypto.randomUUID()}`;
      await this.insertarPlan(tx, goal.id, (vigente?.version ?? 0) + 1, temas, fuentes, goal.weeklyMinutes, goal.targetDate, hash, ahora, conservar);
      await tx.update(learningGoals).set({ updatedAt: ahora }).where(eq(learningGoals.id, goal.id));
      const r = await this.planParaObjetivo(tx, actorId, goal.id);
      if (!r) throw new Error('El plan nuevo no pudo recuperarse.');
      return r;
    });
  }

  async archivar(actorId: string, preparacionId: string, archivada: boolean, ahora: Date) {
    const [g] = await this.db
      .update(learningGoals)
      .set({ status: archivada ? 'ABANDONADO' : 'ACTIVO', updatedAt: ahora })
      .where(and(eq(learningGoals.id, preparacionId), eq(learningGoals.studentId, actorId)))
      .returning({ id: learningGoals.id });
    if (!g) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Preparación no encontrada.');
    return (await this.resumen(actorId, preparacionId))!;
  }

  private async planParaObjetivo(executor: Ejecutor, actorId: string, goalId: string): Promise<PreparacionActual | null> {
    const [goal] = await executor
      .select()
      .from(learningGoals)
      .where(and(eq(learningGoals.id, goalId), eq(learningGoals.studentId, actorId)))
      .limit(1);
    if (!goal) return null;
    const [plan] = await executor.select().from(studyPlans).where(eq(studyPlans.goalId, goalId)).orderBy(desc(studyPlans.version)).limit(1);
    if (!plan) return null;
    const actividades = await executor.select().from(studyPlanItems).where(eq(studyPlanItems.planId, plan.id)).orderBy(studyPlanItems.itemOrder);
    return {
      objetivo: { id: goal.id, fuente: goal.goalSource, fechaObjetivo: goal.targetDate, minutosSemanales: goal.weeklyMinutes },
      plan: { id: plan.id, version: plan.version, reglaVersion: plan.ruleVersion, actividades: actividades.map(mapearActividad) },
    };
  }
}
