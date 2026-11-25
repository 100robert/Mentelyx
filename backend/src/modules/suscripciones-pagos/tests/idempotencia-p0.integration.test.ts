import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearConexionBd, type BdDrizzle, type ConexionBd } from '../../../shared/bd/conexion';
import { procesarUnaVez } from '../../../shared/bd/mensajeria';
import { saldoDesdeLibro, type TipoMovimiento } from '../dominio/recurso-plan';
import { codigoPg, PostgresLibroRecursos } from '../infraestructura/postgres-resource-ledger.adapter';
import { inboxEvents, outboxEvents, resourceBalances as rb, resourceLedgerEntries as rle } from '../infraestructura/schema';
import { crearModuloSuscripcionesPagos } from '../suscripciones-pagos.module';

// P0 (21/11/2026): idempotencia, concurrencia y atomicidad de M5 contra PostgreSQL 17 real (Docker Compose, wsproxy de Neon).
// Datos sintéticos: usuarios aleatorios por ejecución. Cada prueba deja una línea de evidencia (operaciones, efectos, verificaciones).
const HOY = '2026-11-21';
const PERIODO = { inicio: '2026-11-01', fin: '2026-12-01' };
const VERSION = 'piloto-2026-11-20';
const N = 25; // llamadas concurrentes por escenario

let conexion: ConexionBd;
let m5: ReturnType<typeof crearModuloSuscripcionesPagos>;
const actor = crypto.randomUUID();
const clave = (s: string) => `p0:${actor.slice(0, 8)}:${s}`;
const evidencia: Array<{ escenario: string; operaciones: number; efectos: string; verificaciones: string }> = [];

type Estado = { saldos: Array<{ recurso: string; reservado: number; consumido: number }>; movimientos: number; outbox: number };

async function estado(usuario = actor): Promise<Estado> {
  const saldos = await conexion.db.select().from(rb).where(eq(rb.userId, usuario)).orderBy(rb.resourceCode, rb.periodStart);
  const [m] = await conexion.db.select({ n: sql<number>`count(*)::int` }).from(rle).where(eq(rle.userId, usuario));
  const [o] = await conexion.db.select({ n: sql<number>`count(*)::int` }).from(outboxEvents).where(sql`${outboxEvents.payload}->>'actorId' = ${usuario}`);
  return {
    saldos: saldos.map((s) => ({ recurso: s.resourceCode, reservado: Number(s.reserved), consumido: Number(s.consumed) })),
    movimientos: m?.n ?? 0,
    outbox: o?.n ?? 0,
  };
}

async function saldo(recurso: string) {
  const [f] = await conexion.db.select().from(rb).where(and(eq(rb.userId, actor), eq(rb.resourceCode, recurso)));
  return { reservado: Number(f!.reserved), consumido: Number(f!.consumed) };
}

async function movimientos(operationKey: string): Promise<Record<string, number>> {
  const filas = await conexion.db.select({ tipo: rle.entryType, cantidad: rle.quantity }).from(rle).where(eq(rle.operationKey, operationKey));
  return Object.fromEntries(filas.map((f) => [f.tipo, Number(f.cantidad)]));
}

/** Conciliación: cada saldo del usuario coincide con el reconstruido desde su libro. Devuelve cuántos saldos verificó. */
async function conciliar(usuario = actor): Promise<number> {
  const saldos = await conexion.db.select().from(rb).where(eq(rb.userId, usuario));
  const libro = await conexion.db.select().from(rle).where(eq(rle.userId, usuario));
  for (const s of saldos) {
    const propios = libro
      .filter((m) => m.resourceCode === s.resourceCode && m.periodStart === s.periodStart)
      .map((m) => ({ tipo: m.entryType as TipoMovimiento, cantidad: Number(m.quantity), operationKey: m.operationKey }));
    const r = saldoDesdeLibro(Number(s.limitQuantity), Number(s.grantedExtra), propios);
    expect({ recurso: s.resourceCode, reservado: r.reservado, consumido: r.consumido }).toEqual({
      recurso: s.resourceCode,
      reservado: Number(s.reserved),
      consumido: Number(s.consumed),
    });
  }
  return saldos.length;
}

const resultados = async <T>(promesas: Array<Promise<T>>) => {
  const r = await Promise.allSettled(promesas);
  return {
    ok: r.flatMap((x) => (x.status === 'fulfilled' ? [x.value] : [])),
    errores: r.flatMap((x) => (x.status === 'rejected' ? [x.reason as { code?: string; details?: { motivo?: string } }] : [])),
  };
};

/** Doble de prueba: el mismo Drizzle real, pero `tx.insert(tabla)` falla DESPUÉS de que la transacción ya modificó el saldo. */
function conFalloAlInsertar(db: BdDrizzle, tabla: unknown): BdDrizzle {
  const envolver = <T extends object>(obj: T, sustituir: (prop: PropertyKey, original: T) => unknown): T =>
    new Proxy(obj, {
      get(objetivo, prop) {
        const propio = sustituir(prop, objetivo);
        if (propio !== undefined) return propio;
        const valor = Reflect.get(objetivo, prop, objetivo);
        return typeof valor === 'function' ? valor.bind(objetivo) : valor;
      },
    });
  return envolver(db, (prop, original) =>
    prop === 'transaction'
      ? (fn: (tx: unknown) => Promise<unknown>) =>
          original.transaction((tx) =>
            fn(
              envolver(tx, (p, t) =>
                p === 'insert'
                  ? (destino: unknown) => {
                      if (destino === tabla) throw new Error('FALLO_INYECTADO');
                      return t.insert(destino as never);
                    }
                  : undefined,
              ),
            ),
          )
      : undefined,
  );
}

beforeAll(async () => {
  conexion = crearConexionBd({ DATABASE_URL: process.env.DATABASE_URL!, NEON_WS_PROXY: process.env.NEON_WS_PROXY });
  m5 = crearModuloSuscripcionesPagos({ db: conexion.db, pool: conexion.pool, resolverActor: async () => null, reloj: { hoy: () => HOY } });
  expect((await m5.iniciarRecursosDelPeriodo({ actorId: actor, producto: 'EST_PREMIUM', policyVersion: VERSION, ...PERIODO })).creados).toBe(6);
});

afterAll(async () => {
  console.info('\nEvidencia P0 · M5 (idempotencia, concurrencia y atomicidad)');
  console.table(evidencia);
  await conexion.cerrar();
});

describe('P0 · M5 · una operación repetida no produce un segundo efecto', () => {
  const kReserva = clave('reserva-dup');
  const kConfirma = clave('confirma-dup');
  const kLibera = clave('libera-dup');

  it('reserva duplicada con la misma clave (concurrente): un solo RESERVA y un solo incremento', async () => {
    const api = m5.recursosDePlan('M6');
    const cmd = { actorId: actor, recurso: 'CONSULTA_GENERAL', cantidad: 2, operationKey: kReserva };
    const antes = await saldo('CONSULTA_GENERAL');
    const { ok, errores } = await resultados(Array.from({ length: N }, () => api.reservarRecursoPlan(cmd)));
    expect(errores).toHaveLength(0);
    expect(ok.every((r) => r.estado === 'RESERVADO' && r.situacion === 'PENDIENTE')).toBe(true);
    expect(ok.filter((r) => r.estado === 'RESERVADO' && !r.repetida)).toHaveLength(1);
    expect(await movimientos(kReserva)).toEqual({ RESERVA: 2 });
    expect(await saldo('CONSULTA_GENERAL')).toEqual({ reservado: antes.reservado + 2, consumido: antes.consumido });
    // La misma clave con otros datos u otro módulo es otra operación: se rechaza sin efecto.
    await expect(api.reservarRecursoPlan({ ...cmd, cantidad: 3 })).rejects.toMatchObject({ code: 'CLAVE_IDEMPOTENCIA_REUTILIZADA' });
    await expect(m5.recursosDePlan('M3').reservarRecursoPlan(cmd)).rejects.toMatchObject({ code: 'CLAVE_IDEMPOTENCIA_REUTILIZADA' });
    expect(await movimientos(kReserva)).toEqual({ RESERVA: 2 });
    evidencia.push({ escenario: 'Reserva duplicada', operaciones: N + 2, efectos: '1 RESERVA; reservado +2', verificaciones: `${N - 1} repetidas; 2 rechazos; saldo y libro` });
  });

  it('confirmación duplicada (concurrente): una CONFIRMACION, un consumo; otra cantidad u otro módulo se rechazan', async () => {
    const api = m5.recursosDePlan('M6');
    await api.reservarRecursoPlan({ actorId: actor, recurso: 'CONSULTA_TECNICA', cantidad: 3, operationKey: kConfirma });
    const antes = await saldo('CONSULTA_TECNICA');
    const { ok, errores } = await resultados(Array.from({ length: N }, () => api.confirmarRecursoPlan({ operationKey: kConfirma, cantidadReal: 2 })));
    expect(errores).toHaveLength(0);
    expect(ok.filter((r) => r.estado === 'APLICADO')).toHaveLength(1);
    expect(ok.filter((r) => r.estado === 'YA_APLICADO')).toHaveLength(N - 1);
    expect(await movimientos(kConfirma)).toEqual({ RESERVA: 3, CONFIRMACION: 2, LIBERACION: 1 });
    expect(await saldo('CONSULTA_TECNICA')).toEqual({ reservado: antes.reservado - 3, consumido: antes.consumido + 2 });
    await expect(api.confirmarRecursoPlan({ operationKey: kConfirma, cantidadReal: 3 })).rejects.toMatchObject({ code: 'CLAVE_IDEMPOTENCIA_REUTILIZADA' });
    await expect(api.confirmarRecursoPlan({ operationKey: kConfirma })).rejects.toMatchObject({ code: 'CLAVE_IDEMPOTENCIA_REUTILIZADA' });
    await expect(m5.recursosDePlan('M2').confirmarRecursoPlan({ operationKey: kConfirma, cantidadReal: 2 })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    await expect(api.liberarRecursoPlan({ operationKey: kConfirma, motivo: 'CANCELADA' })).rejects.toMatchObject({ details: { motivo: 'RESERVA_CONFIRMADA' } });
    expect(await saldo('CONSULTA_TECNICA')).toEqual({ reservado: antes.reservado - 3, consumido: antes.consumido + 2 });
    evidencia.push({ escenario: 'Confirmación duplicada', operaciones: N + 4, efectos: '1 CONFIRMACION(2) + 1 LIBERACION(1)', verificaciones: `${N - 1} YA_APLICADO; 4 rechazos; saldo y libro` });
  });

  it('liberación duplicada (concurrente): una LIBERACION y la reserva vuelve una sola vez', async () => {
    const api = m5.recursosDePlan('M3');
    await api.reservarRecursoPlan({ actorId: actor, recurso: 'EVALUACION_EQUIVALENTE', cantidad: 2, operationKey: kLibera });
    const antes = await saldo('EVALUACION_EQUIVALENTE');
    const { ok, errores } = await resultados(Array.from({ length: N }, () => api.liberarRecursoPlan({ operationKey: kLibera, motivo: 'SIN_EJECUCION' })));
    expect(errores).toHaveLength(0);
    expect(ok.filter((r) => r.estado === 'APLICADO')).toHaveLength(1);
    expect(await movimientos(kLibera)).toEqual({ RESERVA: 2, LIBERACION: 2 });
    expect(await saldo('EVALUACION_EQUIVALENTE')).toEqual({ reservado: antes.reservado - 2, consumido: antes.consumido });
    await expect(m5.recursosDePlan('M6').liberarRecursoPlan({ operationKey: kLibera, motivo: 'SIN_EJECUCION' })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    await expect(api.confirmarRecursoPlan({ operationKey: kLibera })).rejects.toMatchObject({ details: { motivo: 'RESERVA_LIBERADA' } });
    evidencia.push({ escenario: 'Liberación duplicada', operaciones: N + 2, efectos: '1 LIBERACION(2)', verificaciones: `${N - 1} YA_APLICADO; 2 rechazos; saldo y libro` });
  });

  it('reserva reintentada después de confirmarse: RESERVADO con situación CONFIRMADA y sin efectos nuevos', async () => {
    const api = m5.recursosDePlan('M6');
    const antes = await estado();
    const { ok } = await resultados(
      Array.from({ length: N }, () => api.reservarRecursoPlan({ actorId: actor, recurso: 'CONSULTA_TECNICA', cantidad: 3, operationKey: kConfirma })),
    );
    expect(ok).toHaveLength(N);
    expect(ok.every((r) => r.estado === 'RESERVADO' && r.situacion === 'CONFIRMADA' && r.repetida)).toBe(true);
    expect(await estado()).toEqual(antes);
    evidencia.push({ escenario: 'Reserva tras confirmarse', operaciones: N, efectos: '0', verificaciones: 'situación CONFIRMADA; saldos, libro y outbox sin cambios' });
  });

  it('reserva reintentada después de liberarse: RESERVADO con situación LIBERADA y sin efectos nuevos', async () => {
    const api = m5.recursosDePlan('M3');
    const antes = await estado();
    const { ok } = await resultados(
      Array.from({ length: N }, () => api.reservarRecursoPlan({ actorId: actor, recurso: 'EVALUACION_EQUIVALENTE', cantidad: 2, operationKey: kLibera })),
    );
    expect(ok.every((r) => r.estado === 'RESERVADO' && r.situacion === 'LIBERADA' && r.repetida)).toBe(true);
    expect(await estado()).toEqual(antes);
    evidencia.push({ escenario: 'Reserva tras liberarse', operaciones: N, efectos: '0', verificaciones: 'situación LIBERADA; saldos, libro y outbox sin cambios' });
  });

  it('reintegro duplicado (concurrente): un REINTEGRO y un evento de auditoría', async () => {
    const api = m5.recursosDePlan('M6');
    const antes = await saldo('CONSULTA_TECNICA');
    const { ok } = await resultados(Array.from({ length: N }, () => api.reintegrarRecursoPlan({ operationKey: kConfirma, motivo: 'FALLA_IMPUTABLE_SERVICIO' })));
    expect(ok.filter((r) => r.estado === 'APLICADO')).toHaveLength(1);
    expect(await movimientos(`refund:${kConfirma}`)).toEqual({ REINTEGRO: 2 });
    expect(await saldo('CONSULTA_TECNICA')).toEqual({ reservado: antes.reservado, consumido: antes.consumido - 2 });
    expect((await estado()).outbox).toBe(1);
    await expect(m5.recursosDePlan('M2').reintegrarRecursoPlan({ operationKey: kConfirma, motivo: 'FALLA_IMPUTABLE_SERVICIO' })).rejects.toMatchObject({ code: 'NO_AUTORIZADO' });
    evidencia.push({ escenario: 'Reintegro duplicado', operaciones: N + 1, efectos: '1 REINTEGRO(2) + 1 outbox', verificaciones: `${N - 1} YA_APLICADO; 1 rechazo; saldo, libro y outbox` });
  });

  it('conciliación: tras todos los escenarios, saldo = libro en cada recurso', async () => {
    const verificados = await conciliar();
    expect(verificados).toBe(6);
    evidencia.push({ escenario: 'Conciliación saldo = libro', operaciones: 0, efectos: '—', verificaciones: `${verificados} saldos reconstruidos desde el libro` });
  });
});

describe('P0 · M5 · periodos de recursos sin superposición (restricción EXCLUDE)', () => {
  it('creación concurrente de periodos superpuestos: persiste exactamente un periodo; el resto se rechaza', async () => {
    const usuario = crypto.randomUUID();
    const ventanas = Array.from({ length: 12 }, (_, i) => {
      const inicio = `2026-11-${String(1 + i).padStart(2, '0')}`;
      const fin = `2026-12-${String(1 + i).padStart(2, '0')}`;
      return { inicio, fin };
    });
    // 12 ventanas distintas que se cruzan entre sí, y 8 repeticiones exactas de la primera.
    const pedidos = [...ventanas, ...Array.from({ length: 8 }, () => ventanas[0]!)];
    const r = await Promise.allSettled(
      pedidos.map((v) => m5.iniciarRecursosDelPeriodo({ actorId: usuario, producto: 'EST_GRATUITO', policyVersion: VERSION, ...v })),
    );
    const filas = await conexion.db.select().from(rb).where(eq(rb.userId, usuario));
    const ganadoras = new Set(filas.map((f) => `${f.periodStart}/${f.periodEnd}`));
    expect(ganadoras.size).toBe(1);
    expect(filas).toHaveLength(6);
    const [ganadora] = [...ganadoras];
    let creados = 0;
    r.forEach((x, i) => {
      const mismo = `${pedidos[i]!.inicio}/${pedidos[i]!.fin}` === ganadora;
      if (mismo) {
        expect(x.status).toBe('fulfilled');
        creados += x.status === 'fulfilled' ? x.value.creados : 0;
      } else {
        expect(x.status).toBe('rejected');
        expect(x.status === 'rejected' && (x.reason as { details?: { motivo?: string } }).details?.motivo).toBe('PERIODO_SUPERPUESTO');
      }
    });
    expect(creados).toBe(6);
    const [solapes] = await conexion.db.execute<{ n: number }>(sql`
      select count(*)::int as n from m5_billing.resource_balances a join m5_billing.resource_balances b
        on a.user_id = b.user_id and a.resource_code = b.resource_code and a.period_start < b.period_start
       and daterange(a.period_start, a.period_end) && daterange(b.period_start, b.period_end)
      where a.user_id = ${usuario}`).then((q) => q.rows);
    expect(solapes?.n).toBe(0);
    const rechazados = r.filter((x) => x.status === 'rejected').length;
    evidencia.push({
      escenario: 'Periodos superpuestos concurrentes',
      operaciones: pedidos.length,
      efectos: `1 periodo (${ganadora}); 6 saldos`,
      verificaciones: `${rechazados} rechazos PERIODO_SUPERPUESTO; 0 pares solapados`,
    });
  });

  it('la base rechaza un periodo superpuesto aunque se inserte sin pasar por la aplicación; el periodo contiguo se admite', async () => {
    const usuario = crypto.randomUUID();
    await m5.iniciarRecursosDelPeriodo({ actorId: usuario, producto: 'EST_GRATUITO', policyVersion: VERSION, ...PERIODO });
    const directo = conexion.db.execute(sql`
      insert into m5_billing.resource_balances (user_id, period_start, period_end, resource_code, product_code, policy_version, limit_quantity)
      values (${usuario}, '2026-11-20', '2026-12-20', 'CONSULTA_GENERAL', 'EST_GRATUITO', ${VERSION}, 60)`);
    const error = await directo.then(() => null, (e: unknown) => e);
    expect(codigoPg(error)).toBe('23P01'); // exclusion_violation
    expect(
      (await m5.iniciarRecursosDelPeriodo({ actorId: usuario, producto: 'EST_GRATUITO', policyVersion: VERSION, inicio: '2026-12-01', fin: '2027-01-01' })).creados,
    ).toBe(6);
    evidencia.push({ escenario: 'Solape por SQL directo', operaciones: 3, efectos: '2 periodos contiguos', verificaciones: 'SQLSTATE 23P01 en el solape' });
  });
});

describe('P0 · M5 · atomicidad saldo + libro + outbox', () => {
  it('una transacción que falla tras modificar el saldo no deja cambios parciales (reservar, confirmar, liberar, reintegrar)', async () => {
    const real = new PostgresLibroRecursos(conexion.db);
    const fallaLibro = new PostgresLibroRecursos(conFalloAlInsertar(conexion.db, rle));
    const fallaOutbox = new PostgresLibroRecursos(conFalloAlInsertar(conexion.db, outboxEvents));
    const base = { actorId: actor, recurso: 'ILUSTRACION_ESTANDAR' as const, origen: 'M2' as const, hoy: HOY };
    const kPend = clave('atom-pendiente');
    const kConf = clave('atom-confirmada');
    await real.reservar({ ...base, cantidad: 1, operationKey: kPend });
    await real.reservar({ ...base, cantidad: 2, operationKey: kConf });
    await real.confirmar({ operationKey: kConf, origen: 'M2' });
    const antes = await estado();

    const intentos = [
      () => fallaLibro.reservar({ ...base, cantidad: 1, operationKey: clave('atom-nueva') }),
      () => fallaLibro.confirmar({ operationKey: kPend, origen: 'M2' }),
      () => fallaLibro.liberar({ operationKey: kPend, origen: 'M2' }),
      () => fallaLibro.reintegrar({ operationKey: kConf, origen: 'M2' }),
      () => fallaOutbox.reintegrar({ operationKey: kConf, origen: 'M2' }), // falla después de saldo y REINTEGRO
    ];
    for (const intento of intentos) await expect(intento()).rejects.toThrow('FALLO_INYECTADO');
    expect(await estado()).toEqual(antes);
    expect(await movimientos(`refund:${kConf}`)).toEqual({});

    // Nada quedó a medias: las mismas operaciones, sin fallo, se aplican una vez.
    expect(await real.confirmar({ operationKey: kPend, origen: 'M2' })).toEqual({ estado: 'APLICADO' });
    expect(await real.reintegrar({ operationKey: kConf, origen: 'M2' })).toEqual({ estado: 'APLICADO' });
    expect(await conciliar()).toBe(6);
    evidencia.push({ escenario: 'Transacción fallida', operaciones: intentos.length + 2, efectos: '0 parciales; luego 1 CONFIRMACION + 1 REINTEGRO', verificaciones: 'saldos, libro y outbox idénticos tras cada fallo; conciliación' });
  });

  it('la base rechaza al COMMIT un saldo que cambia sin movimiento y un movimiento sin cambio de saldo', async () => {
    const k = clave('atom-directo');
    const antes = await estado();
    const sinMovimiento = conexion.db.transaction(async (tx) => {
      await tx.update(rb).set({ reserved: sql`${rb.reserved} + 1` }).where(and(eq(rb.userId, actor), eq(rb.resourceCode, 'CONSULTA_GENERAL')));
    });
    expect(codigoPg(await sinMovimiento.then(() => null, (e: unknown) => e))).toBe('23000');
    const [s] = await conexion.db.select().from(rb).where(and(eq(rb.userId, actor), eq(rb.resourceCode, 'CONSULTA_GENERAL')));
    const sinSaldo = conexion.db.insert(rle).values({
      userId: actor,
      periodStart: s!.periodStart,
      resourceCode: 'CONSULTA_GENERAL',
      entryType: 'RESERVA',
      quantity: '1',
      operationKey: k,
      sourceModule: 'M6',
    });
    expect(codigoPg(await sinSaldo.then(() => null, (e: unknown) => e))).toBe('23000');
    expect(await estado()).toEqual(antes);
    evidencia.push({ escenario: 'Saldo ≠ libro por SQL directo', operaciones: 2, efectos: '0', verificaciones: 'SQLSTATE 23000 al COMMIT (restricción diferida)' });
  });
});

describe('P0 · Mensajería · entrega duplicada de un evento del outbox', () => {
  it('el mismo evento entregado 12 veces (10 concurrentes) produce un solo efecto persistido', async () => {
    const [evento] = await conexion.db
      .select()
      .from(outboxEvents)
      .where(and(eq(outboxEvents.eventType, 'AuditoriaRegistrada'), sql`${outboxEvents.payload}->>'actorId' = ${actor}`))
      .limit(1);
    expect(evento).toBeTruthy();
    const tablas = { outboxEvents, inboxEvents };
    // Un relay «al menos una vez» entrega el evento varias veces; el consumidor registra un efecto NO idempotente por sí mismo.
    const entregar = () =>
      conexion.db.transaction((tx) =>
        procesarUnaVez(tx, tablas, { source: 'M5', eventId: evento!.id, payload: evento!.payload }, async () => {
          await tx.insert(outboxEvents).values({
            eventType: 'PruebaEfectoConsumidor',
            aggregateId: crypto.randomUUID(),
            aggregateVersion: 1,
            payload: { eventoOrigen: evento!.id },
          });
        }),
      );
    const concurrentes = await Promise.all(Array.from({ length: 10 }, entregar));
    const tardias = [await entregar(), await entregar()];
    const todas = [...concurrentes, ...tardias];
    expect(todas.filter((x) => x === 'PROCESADO')).toHaveLength(1);
    expect(todas.filter((x) => x === 'DUPLICADO')).toHaveLength(11);
    const [efectos] = await conexion.db
      .select({ n: sql<number>`count(*)::int` })
      .from(outboxEvents)
      .where(and(eq(outboxEvents.eventType, 'PruebaEfectoConsumidor'), sql`${outboxEvents.payload}->>'eventoOrigen' = ${evento!.id}`));
    expect(efectos?.n).toBe(1);
    const [recibidos] = await conexion.db.select({ n: sql<number>`count(*)::int` }).from(inboxEvents).where(eq(inboxEvents.eventId, evento!.id));
    expect(recibidos?.n).toBe(1);
    evidencia.push({ escenario: 'Entrega duplicada outbox → inbox', operaciones: 12, efectos: '1 efecto; 1 fila de inbox', verificaciones: '1 PROCESADO; 11 DUPLICADO' });
  });
});
