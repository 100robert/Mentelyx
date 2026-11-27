import { and, desc, eq, sql } from 'drizzle-orm';
import type { Respuesta } from '@mentelyx/contratos/educacion/pregunta-corregir';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import { ErrorAplicacion } from '../../../shared/errores';
import { repasar, VERSION_REPASO, type Calificacion, type Calificacion4, type Proyeccion } from '../dominio/evaluacion';
import type { IntentoGuardado, IntentosRepositorio, RespuestaGuardada, Tarjeta, TarjetasRepositorio } from '../dominio/preparacion';
import { attemptAnswers, cardReviews, evaluationAttempts, learningGoals, studyCards } from './schema';

const aIntento = (r: typeof evaluationAttempts.$inferSelect): IntentoGuardado => ({
  id: r.id,
  preparacionId: r.goalId,
  modo: r.mode,
  versionBanco: r.bankVersion,
  preguntaIds: r.questionIds as string[],
  proyeccion: r.projection as Proyeccion,
  estado: r.status,
  iniciadoEn: r.startedAt,
  venceEn: r.deadlineAt,
  entregadoEn: r.submittedAt,
  fueraDeTiempo: r.lateSubmission,
  puntaje: r.score === null ? null : Number(r.score),
  maximo: r.maxScore === null ? null : Number(r.maxScore),
  pendientes: r.pendingCount,
  resultados: (r.results as Calificacion | null) ?? null,
  operationKey: r.operationKey,
  requestHash: r.requestHash,
  claveEntrega: r.submitKey,
});

/** Intentos y respuestas de M3 en PostgreSQL (persistencia 7.3). La propiedad se comprueba en cada consulta. */
export class PostgresIntentosRepositorio implements IntentosRepositorio {
  constructor(private readonly db: BdDrizzle) {}

  async crear(i: Parameters<IntentosRepositorio['crear']>[0]) {
    return this.db.transaction(async (tx) => {
      const [goal] = await tx
        .select({ id: learningGoals.id })
        .from(learningGoals)
        .where(and(eq(learningGoals.id, i.preparacionId), eq(learningGoals.studentId, i.estudianteId)))
        .limit(1);
      if (!goal) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Preparación no encontrada.');
      const insertado = await tx
        .insert(evaluationAttempts)
        .values({
          ...(i.id ? { id: i.id } : {}),
          studentId: i.estudianteId,
          goalId: i.preparacionId,
          mode: i.modo,
          bankVersion: i.versionBanco,
          questionIds: i.preguntaIds,
          projection: i.proyeccion,
          operationKey: i.operationKey,
          requestHash: i.requestHash,
          startedAt: i.iniciadoEn,
          deadlineAt: i.venceEn,
        })
        .onConflictDoNothing({ target: [evaluationAttempts.studentId, evaluationAttempts.operationKey] })
        .returning();
      if (insertado[0]) return { intento: aIntento(insertado[0]), repetido: false };
      const [previo] = await tx
        .select()
        .from(evaluationAttempts)
        .where(and(eq(evaluationAttempts.studentId, i.estudianteId), eq(evaluationAttempts.operationKey, i.operationKey)))
        .limit(1);
      if (!previo) throw new Error('Conflicto de idempotencia sin fila previa.');
      if (previo.requestHash !== i.requestHash) throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La clave ya se usó para otro intento.');
      return { intento: aIntento(previo), repetido: true };
    });
  }

  async obtener(estudianteId: string, intentoId: string) {
    const [r] = await this.db.select().from(evaluationAttempts).where(and(eq(evaluationAttempts.id, intentoId), eq(evaluationAttempts.studentId, estudianteId))).limit(1);
    return r ? aIntento(r) : null;
  }

  async listar(estudianteId: string, preparacionId: string) {
    const filas = await this.db
      .select()
      .from(evaluationAttempts)
      .where(and(eq(evaluationAttempts.studentId, estudianteId), eq(evaluationAttempts.goalId, preparacionId)))
      .orderBy(desc(evaluationAttempts.startedAt))
      .limit(100);
    return filas.map(aIntento);
  }

  async respuestas(intentoId: string): Promise<RespuestaGuardada[]> {
    const filas = await this.db.select().from(attemptAnswers).where(eq(attemptAnswers.attemptId, intentoId));
    return filas.map((f) => ({ preguntaId: f.questionId, respuesta: f.answer as Respuesta, revision: f.revision, comprobada: f.checked }));
  }

  async guardarRespuesta(intentoId: string, preguntaId: string, respuesta: Respuesta, comprobada: boolean, ahora: Date) {
    // La condición «intento EN_CURSO» va en la misma sentencia: una entrega concurrente no deja respuestas posteriores.
    const filas = await this.db.execute<{ question_id: string; revision: number; checked: boolean }>(sql`
      insert into ${attemptAnswers} as aa (attempt_id, question_id, answer, revision, checked, saved_at)
      select ${intentoId}::uuid, ${preguntaId}, ${JSON.stringify(respuesta)}::jsonb, 1, ${comprobada}, ${ahora.toISOString()}::timestamptz
      where exists (select 1 from ${evaluationAttempts} ea where ea.id = ${intentoId}::uuid and ea.status = 'EN_CURSO')
      on conflict (attempt_id, question_id) do update
        set answer = excluded.answer, revision = aa.revision + 1, checked = aa.checked or excluded.checked, saved_at = excluded.saved_at
        where not aa.checked and exists (select 1 from ${evaluationAttempts} ea where ea.id = ${intentoId}::uuid and ea.status = 'EN_CURSO')
      returning question_id, revision, checked`);
    const f = filas.rows[0];
    if (!f) return 'CERRADO' as const;
    return { preguntaId: f.question_id, respuesta, revision: f.revision, comprobada: f.checked };
  }

  async calificar(intentoId: string, claveEntrega: string, c: Parameters<IntentosRepositorio['calificar']>[2]) {
    const r = await this.db
      .update(evaluationAttempts)
      .set({
        status: 'CALIFICADO',
        submittedAt: c.entregadoEn,
        lateSubmission: c.fueraDeTiempo,
        score: String(c.calificacion.puntaje),
        maxScore: String(c.calificacion.maximo),
        pendingCount: c.calificacion.pendientes,
        results: c.calificacion,
        scoringVersion: c.version,
        submitKey: claveEntrega,
      })
      .where(and(eq(evaluationAttempts.id, intentoId), eq(evaluationAttempts.status, 'EN_CURSO')))
      .returning({ id: evaluationAttempts.id });
    return r.length ? ('OK' as const) : ('YA_CALIFICADO' as const);
  }
}

const aTarjeta = (r: typeof studyCards.$inferSelect): Tarjeta => ({
  id: r.id,
  preparacionId: r.goalId,
  tema: r.topic,
  anverso: r.front,
  reverso: r.back,
  origen: r.origin,
  proximaEn: r.dueAt,
  intervaloDias: r.intervalDays,
  facilidad: Number(r.ease),
  repeticiones: r.repetitions,
});

/** Tarjetas y revisiones (M3). La próxima revisión la calcula el servidor; una revisión repetida no se aplica dos veces. */
export class PostgresTarjetasRepositorio implements TarjetasRepositorio {
  constructor(private readonly db: BdDrizzle) {}

  async crear(estudianteId: string, preparacionId: string, operationKey: string, t: Pick<Tarjeta, 'tema' | 'anverso' | 'reverso' | 'origen'>, ahora: Date) {
    const [goal] = await this.db.select({ id: learningGoals.id }).from(learningGoals).where(and(eq(learningGoals.id, preparacionId), eq(learningGoals.studentId, estudianteId))).limit(1);
    if (!goal) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Preparación no encontrada.');
    const [nueva] = await this.db
      .insert(studyCards)
      .values({ studentId: estudianteId, goalId: preparacionId, topic: t.tema, front: t.anverso, back: t.reverso, origin: t.origen, operationKey, dueAt: ahora })
      .onConflictDoNothing({ target: [studyCards.studentId, studyCards.operationKey] })
      .returning();
    if (nueva) return { tarjeta: aTarjeta(nueva), repetida: false };
    const [previa] = await this.db.select().from(studyCards).where(and(eq(studyCards.studentId, estudianteId), eq(studyCards.operationKey, operationKey))).limit(1);
    if (!previa || previa.goalId !== preparacionId || previa.front !== t.anverso) throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La clave ya se usó para otra tarjeta.');
    return { tarjeta: aTarjeta(previa), repetida: true };
  }

  async listar(estudianteId: string, preparacionId: string) {
    const filas = await this.db.select().from(studyCards).where(and(eq(studyCards.studentId, estudianteId), eq(studyCards.goalId, preparacionId))).orderBy(studyCards.dueAt).limit(500);
    return filas.map(aTarjeta);
  }

  async revisar(estudianteId: string, tarjetaId: string, operationKey: string, calificacion: Calificacion4, ahora: Date) {
    return this.db.transaction(async (tx) => {
      const [t] = await tx.select().from(studyCards).where(and(eq(studyCards.id, tarjetaId), eq(studyCards.studentId, estudianteId))).for('update').limit(1);
      if (!t) return null;
      const [previa] = await tx.select().from(cardReviews).where(and(eq(cardReviews.cardId, t.id), eq(cardReviews.operationKey, operationKey))).limit(1);
      if (previa) return { tarjeta: aTarjeta(t), repetida: true };
      const n = repasar({ intervaloDias: t.intervalDays, facilidad: Number(t.ease), repeticiones: t.repetitions }, calificacion, ahora);
      await tx.insert(cardReviews).values({ cardId: t.id, rating: calificacion, operationKey, reviewedAt: ahora, nextDueAt: n.proxima, ruleVersion: VERSION_REPASO });
      const [act] = await tx
        .update(studyCards)
        .set({ dueAt: n.proxima, intervalDays: n.intervaloDias, ease: n.facilidad.toFixed(2), repetitions: n.repeticiones, updatedAt: ahora })
        .where(eq(studyCards.id, t.id))
        .returning();
      return { tarjeta: aTarjeta(act!), repetida: false };
    });
  }
}
