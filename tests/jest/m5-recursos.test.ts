import {
  aplicarConfirmacion,
  aplicarLiberacion,
  aplicarReintegro,
  aplicarReserva,
  cumpleInvariante,
  disponibles,
  periodoMensual,
  ReglaRecursoInfringida,
  saldoDesdeLibro,
  situacionReserva,
} from '../../backend/src/modules/suscripciones-pagos/dominio/recurso-plan';
import { crearReservarRecurso } from '../../backend/src/modules/suscripciones-pagos/aplicacion/reservar-recurso.use-case';
import type { LibroRecursosPort } from '../../backend/src/modules/suscripciones-pagos/dominio/libro-recursos.port';

/** M5 · créditos y derechos del plan (ADR-080): reserva, confirmación, liberación, reintegro y conciliación con el libro. */
const saldo = { limite: 60, extra: 0, reservado: 0, consumido: 0 };

describe('M5 · reglas de recursos del plan', () => {
  it('reserva solo con cuota disponible y conserva la invariante', () => {
    const s = aplicarReserva(saldo, 2);
    expect(disponibles(s)).toBe(58);
    expect(cumpleInvariante(s)).toBe(true);
    expect(() => aplicarReserva({ ...saldo, consumido: 60 }, 1)).toThrow(ReglaRecursoInfringida);
    expect(() => aplicarReserva(saldo, 0)).toThrow(/SIN_CUOTA/);
  });

  it('la confirmación consume lo real y libera el remanente; nunca más de lo reservado', () => {
    const s = aplicarConfirmacion(aplicarReserva(saldo, 3), 3, 2);
    expect(s).toMatchObject({ reservado: 0, consumido: 2 });
    expect(() => aplicarConfirmacion(aplicarReserva(saldo, 1), 1, 2)).toThrow(/CANTIDAD_REAL_FUERA_DE_RANGO/);
    expect(() => aplicarConfirmacion(saldo, 1, 1)).toThrow(/RESERVA_INEXISTENTE/);
  });

  it('liberación y reintegro devuelven la cuota y rechazan montos inexistentes', () => {
    expect(aplicarLiberacion(aplicarReserva(saldo, 1), 1).reservado).toBe(0);
    expect(() => aplicarLiberacion(saldo, 1)).toThrow(/RESERVA_INEXISTENTE/);
    expect(aplicarReintegro({ ...saldo, consumido: 2 }, 2).consumido).toBe(0);
    expect(() => aplicarReintegro(saldo, 1)).toThrow(/CONSUMO_INSUFICIENTE/);
  });

  it('el saldo se reconstruye desde el libro inmutable (conciliación ledger = saldo)', () => {
    const libro = [
      { tipo: 'RESERVA' as const, cantidad: 2, operationKey: 'a' },
      { tipo: 'CONFIRMACION' as const, cantidad: 1, operationKey: 'a' },
      { tipo: 'LIBERACION' as const, cantidad: 1, operationKey: 'a' },
      { tipo: 'RESERVA' as const, cantidad: 1, operationKey: 'b' },
      { tipo: 'REINTEGRO' as const, cantidad: 1, operationKey: 'refund:a' },
    ];
    expect(saldoDesdeLibro(60, 0, libro)).toEqual({ limite: 60, extra: 0, reservado: 1, consumido: 0 });
    expect(situacionReserva(new Set(['RESERVA', 'CONFIRMACION', 'LIBERACION']))).toBe('CONFIRMADA');
    expect(situacionReserva(new Set(['RESERVA', 'LIBERACION']))).toBe('LIBERADA');
    expect(situacionReserva(new Set(['RESERVA']))).toBe('PENDIENTE');
  });

  it('el periodo mensual es el mes civil, incluido el cambio de año', () => {
    expect(periodoMensual('2026-11-27')).toEqual({ inicio: '2026-11-01', fin: '2026-12-01' });
    expect(periodoMensual('2026-12-31')).toEqual({ inicio: '2026-12-01', fin: '2027-01-01' });
  });
});

describe('M5 · caso de uso reservarRecursoPlan', () => {
  const cmd = { actorId: '00000000-0000-4000-8000-000000000001', recurso: 'CONSULTA_GENERAL', cantidad: 1, operationKey: 'tutor:op-1' };
  function libro(respuestas: Array<{ estado: string }>, creados: number) {
    const llamadas = { reservar: 0, plan: 0 };
    const l = {
      reservar: async () => (llamadas.reservar++, respuestas.shift()),
      asegurarPlanGratuito: async () => (llamadas.plan++, { creados }),
    } as unknown as LibroRecursosPort;
    return { l, llamadas };
  }

  it('sin saldo vigente asigna el plan Gratuito del mes y reintenta UNA vez', async () => {
    const { l, llamadas } = libro([{ estado: 'SIN_CUOTA' }, { estado: 'RESERVADO' }], 6);
    const r = await crearReservarRecurso(l, { hoy: () => '2026-11-27' } as never)('M6', cmd);
    expect(r).toEqual({ estado: 'RESERVADO' });
    expect(llamadas).toEqual({ reservar: 2, plan: 1 });
  });

  it('si el plan ya existía (nada creado), no reintenta: la cuota está realmente agotada', async () => {
    const { l, llamadas } = libro([{ estado: 'SIN_CUOTA' }], 0);
    expect(await crearReservarRecurso(l, { hoy: () => '2026-11-27' } as never)('M6', cmd)).toEqual({ estado: 'SIN_CUOTA' });
    expect(llamadas.reservar).toBe(1);
  });

  it('rechaza una orden mal formada antes de tocar el libro', async () => {
    const { l, llamadas } = libro([], 0);
    await expect(crearReservarRecurso(l, { hoy: () => '2026-11-27' } as never)('M6', { ...cmd, cantidad: -1 })).rejects.toThrow();
    expect(llamadas.reservar).toBe(0);
  });
});
