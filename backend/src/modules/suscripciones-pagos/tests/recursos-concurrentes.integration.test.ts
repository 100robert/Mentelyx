import { and, eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { crearConexionBd, type ConexionBd } from '../../../shared/bd/conexion';
import { procesarUnaVez, registrarEnOutbox } from '../../../shared/bd/mensajeria';
import { ErrorAplicacion } from '../../../shared/errores';
import { saldoDesdeLibro, type TipoMovimiento } from '../dominio/recurso-plan';
import { crearKyselyM5 } from '../infraestructura/kysely';
import { inboxEvents, outboxEvents, resourceBalances as rb, resourceLedgerEntries as rle } from '../infraestructura/schema';
import { crearModuloSuscripcionesPagos } from '../suscripciones-pagos.module';

// CON-02, API-04 y MIG-04 contra PostgreSQL 17 real (Docker Compose) mediante el driver serverless de Neon (wsproxy).
// Datos sintéticos: identificadores aleatorios por ejecución; no hay datos de estudiantes reales.
const HOY = '2026-11-21';
const reloj = { hoy: () => HOY };
let conexion: ConexionBd;
let m5: ReturnType<typeof crearModuloSuscripcionesPagos>;
const actor = crypto.randomUUID();
const clave = (s: string) => `prueba:${actor.slice(0, 8)}:${s}`;

async function saldo(recurso: string) {
  const [f] = await conexion.db.select().from(rb).where(and(eq(rb.userId, actor), eq(rb.resourceCode, recurso)));
  return f!;
}

beforeAll(async () => {
  conexion = crearConexionBd({ DATABASE_URL: process.env.DATABASE_URL!, NEON_WS_PROXY: process.env.NEON_WS_PROXY });
  m5 = crearModuloSuscripcionesPagos({ db: conexion.db, pool: conexion.pool, resolverActor: async () => null, reloj });
  const r = await m5.iniciarRecursosDelPeriodo({ actorId: actor, producto: 'EST_GRATUITO', policyVersion: 'piloto-2026-11-20', inicio: '2026-11-01', fin: '2026-12-01' });
  expect(r.creados).toBe(6);
});

afterAll(async () => {
  await conexion.cerrar();
});

describe('M5 · libro de recursos de plan contra PostgreSQL', () => {
  it('inicia el periodo con los límites de la versión de piloto (IM, sección 14) y lo consulta con Kysely', async () => {
    const derechos = await m5.recursosDePlan('M6').consultarDerechosPlan(actor);
    expect(derechos?.producto).toBe('EST_GRATUITO');
    expect(derechos?.periodo).toEqual({ inicio: '2026-11-01', fin: '2026-12-01' });
    const limites = Object.fromEntries(derechos!.recursos.map((r) => [r.recurso, r.limite]));
    expect(limites).toEqual({
      ALMACENAMIENTO_BYTES: 500_000_000,
      CONSULTA_GENERAL: 60,
      CONSULTA_TECNICA: 15,
      EVALUACION_EQUIVALENTE: 3,
      ILUSTRACION_ESTANDAR: 4,
      RAZONAMIENTO_PROFUNDO: 2,
    });
  });

  it('CON-02 / API-04: 50 reservas concurrentes con 15 consultas técnicas → exactamente 15 RESERVADO', async () => {
    const api = m5.recursosDePlan('M6');
    const resultados = await Promise.all(
      Array.from({ length: 50 }, (_, i) => api.reservarRecursoPlan({ actorId: actor, recurso: 'CONSULTA_TECNICA', cantidad: 1, operationKey: clave(`con02-${i}`) })),
    );
    expect(resultados.filter((r) => r.estado === 'RESERVADO')).toHaveLength(15);
    expect(resultados.filter((r) => r.estado === 'SIN_CUOTA')).toHaveLength(35);
    const s = await saldo('CONSULTA_TECNICA');
    expect(Number(s.reserved)).toBe(15);
    const [n] = await conexion.db.select({ n: sql<number>`count(*)::int` }).from(rle).where(and(eq(rle.userId, actor), eq(rle.resourceCode, 'CONSULTA_TECNICA'), eq(rle.entryType, 'RESERVA')));
    expect(n?.n).toBe(15);
  });

  it('idempotencia: la misma clave 10 veces reserva una sola vez; con otros datos se rechaza', async () => {
    const api = m5.recursosDePlan('M6');
    const cmd = { actorId: actor, recurso: 'CONSULTA_GENERAL', cantidad: 1, operationKey: clave('idem') };
    const antes = Number((await saldo('CONSULTA_GENERAL')).reserved);
    const res = await Promise.all(Array.from({ length: 10 }, () => api.reservarRecursoPlan(cmd)));
    expect(res.every((r) => r.estado === 'RESERVADO')).toBe(true);
    expect(Number((await saldo('CONSULTA_GENERAL')).reserved)).toBe(antes + 1);
    await expect(api.reservarRecursoPlan({ ...cmd, cantidad: 2 })).rejects.toMatchObject({ code: 'CLAVE_IDEMPOTENCIA_REUTILIZADA' });
  });

  it('confirmación parcial, liberación y reintegro único con auditoría en el outbox', async () => {
    const api = m5.recursosDePlan('M2');
    const k = clave('ciclo');
    expect((await api.reservarRecursoPlan({ actorId: actor, recurso: 'CONSULTA_GENERAL', cantidad: 3, operationKey: k })).estado).toBe('RESERVADO');
    const antes = await saldo('CONSULTA_GENERAL');
    expect(await api.confirmarRecursoPlan({ operationKey: k, cantidadReal: 2 })).toEqual({ estado: 'APLICADO' });
    expect(await api.confirmarRecursoPlan({ operationKey: k, cantidadReal: 2 })).toEqual({ estado: 'YA_APLICADO' });
    const tras = await saldo('CONSULTA_GENERAL');
    expect(Number(tras.reserved)).toBe(Number(antes.reserved) - 3);
    expect(Number(tras.consumed)).toBe(Number(antes.consumed) + 2);
    await expect(api.liberarRecursoPlan({ operationKey: k, motivo: 'CANCELADA' })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });

    const reintegros = await Promise.all(Array.from({ length: 8 }, () => api.reintegrarRecursoPlan({ operationKey: k, motivo: 'FALLA_IMPUTABLE_SERVICIO' })));
    expect(reintegros.filter((r) => r.estado === 'APLICADO')).toHaveLength(1);
    expect(Number((await saldo('CONSULTA_GENERAL')).consumed)).toBe(Number(antes.consumed));
    const [reintegro] = await conexion.db.select().from(rle).where(and(eq(rle.entryType, 'REINTEGRO'), eq(rle.operationKey, `refund:${k}`)));
    expect(reintegro?.originalEntryId).toBeTruthy();
    const eventos = await conexion.db.select().from(outboxEvents).where(eq(outboxEvents.aggregateId, reintegro!.id));
    expect(eventos).toHaveLength(1);
    expect(eventos[0]).toMatchObject({ eventType: 'AuditoriaRegistrada', status: 'PENDING' });
  });

  it('liberar es idempotente y una reserva liberada no se puede confirmar', async () => {
    const api = m5.recursosDePlan('M3');
    const k = clave('liberar');
    await api.reservarRecursoPlan({ actorId: actor, recurso: 'EVALUACION_EQUIVALENTE', cantidad: 1, operationKey: k });
    expect(await api.liberarRecursoPlan({ operationKey: k, motivo: 'SIN_EJECUCION' })).toEqual({ estado: 'APLICADO' });
    expect(await api.liberarRecursoPlan({ operationKey: k, motivo: 'SIN_EJECUCION' })).toEqual({ estado: 'YA_APLICADO' });
    await expect(api.confirmarRecursoPlan({ operationKey: k })).rejects.toBeInstanceOf(ErrorAplicacion);
    expect(Number((await saldo('EVALUACION_EQUIVALENTE')).reserved)).toBe(0);
  });

  it('rechaza entradas fuera de contrato (Zod estricto)', async () => {
    const api = m5.recursosDePlan('M6');
    await expect(api.reservarRecursoPlan({ actorId: actor, recurso: 'UTI', cantidad: 1, operationKey: clave('x') })).rejects.toThrow();
    await expect(api.reservarRecursoPlan({ actorId: actor, recurso: 'CONSULTA_GENERAL', cantidad: -1, operationKey: clave('y') })).rejects.toThrow();
  });

  it('conciliación: el saldo de cada recurso coincide con el reconstruido desde el libro', async () => {
    const saldos = await conexion.db.select().from(rb).where(eq(rb.userId, actor));
    const movimientos = await conexion.db.select().from(rle).where(eq(rle.userId, actor));
    for (const s of saldos) {
      const propios = movimientos
        .filter((m) => m.resourceCode === s.resourceCode)
        .map((m) => ({ tipo: m.entryType as TipoMovimiento, cantidad: Number(m.quantity), operationKey: m.operationKey }));
      const reconstruido = saldoDesdeLibro(Number(s.limitQuantity), Number(s.grantedExtra), propios);
      expect({ r: reconstruido.reservado, c: reconstruido.consumido }).toEqual({ r: Number(s.reserved), c: Number(s.consumed) });
    }
  });

  it('el libro es de solo inserción y la base rechaza saldos por encima de la capacidad', async () => {
    await expect(conexion.db.update(rle).set({ quantity: '99' }).where(eq(rle.userId, actor))).rejects.toThrow();
    await expect(conexion.db.delete(rle).where(eq(rle.userId, actor))).rejects.toThrow();
    await expect(
      conexion.db.update(rb).set({ reserved: '1000' }).where(and(eq(rb.userId, actor), eq(rb.resourceCode, 'RAZONAMIENTO_PROFUNDO'))),
    ).rejects.toThrow();
  });

  it('MIG-04: Kysely compila con los tipos derivados del esquema Drizzle', () => {
    const k = crearKyselyM5(conexion.pool);
    const compilada = k.selectFrom('resource_balances').select(['resource_code', 'limit_quantity']).where('user_id', '=', actor).compile();
    expect(compilada.sql).toBe('select "resource_code", "limit_quantity" from "m5_billing"."resource_balances" where "user_id" = $1');
  });
});

describe('Mensajería transaccional (outbox e inbox)', () => {
  const tablas = { outboxEvents, inboxEvents };

  it('outbox: si la transacción falla, el evento no queda registrado', async () => {
    const agregado = crypto.randomUUID();
    await expect(
      conexion.db.transaction(async (tx) => {
        await registrarEnOutbox(tx, tablas, { tipo: 'AuditoriaRegistrada', agregadoId: agregado, versionAgregado: 1, payload: { prueba: true } });
        throw new Error('fallo simulado después del outbox');
      }),
    ).rejects.toThrow('fallo simulado');
    expect(await conexion.db.select().from(outboxEvents).where(eq(outboxEvents.aggregateId, agregado))).toHaveLength(0);
  });

  it('inbox: el efecto se aplica una sola vez; otro contenido con el mismo id se rechaza; un efecto fallido no marca el evento', async () => {
    const evento = { source: 'M7', eventId: crypto.randomUUID(), payload: { recurso: 'CONSULTA_GENERAL', cantidad: 1 } };
    let efectos = 0;
    const procesar = (payload: unknown, falla = false) =>
      conexion.db.transaction((tx) =>
        procesarUnaVez(tx, tablas, { ...evento, payload }, async () => {
          if (falla) throw new Error('efecto fallido');
          efectos++;
        }),
      );
    await expect(procesar(evento.payload, true)).rejects.toThrow('efecto fallido');
    expect(await conexion.db.select().from(inboxEvents).where(eq(inboxEvents.eventId, evento.eventId))).toHaveLength(0);
    expect(await procesar(evento.payload)).toBe('PROCESADO');
    expect(await procesar(evento.payload)).toBe('DUPLICADO');
    expect(efectos).toBe(1);
    await expect(procesar({ ...evento.payload, cantidad: 2 })).rejects.toMatchObject({ code: 'CLAVE_IDEMPOTENCIA_REUTILIZADA' });
  });
});
