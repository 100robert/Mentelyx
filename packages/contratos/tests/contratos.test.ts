import { describe, expect, it } from 'vitest';
import { CodigoError, Fallo, ReservarRecursoCmd, RECUPERABLE, ESTADO_HTTP, exito, z } from '../src';

describe('contratos compartidos (Zod jitless)', () => {
  it('Zod funciona sin JIT, requisito de Workers', () => {
    expect(z.config().jitless).toBe(true);
  });

  it('rechaza propiedades desconocidas en los comandos internos (API, sección 1, punto 7)', () => {
    const base = { actorId: '7f1c2a8e-4a3b-4c55-9a77-0d2f8b1e6c10', recurso: 'CONSULTA_TECNICA', cantidad: 1, operationKey: 'tutor:op-0001' };
    expect(ReservarRecursoCmd.safeParse(base).success).toBe(true);
    expect(ReservarRecursoCmd.safeParse({ ...base, plan: 'EST_PREMIUM' }).success).toBe(false);
    expect(ReservarRecursoCmd.safeParse({ ...base, cantidad: 0 }).success).toBe(false);
    expect(ReservarRecursoCmd.safeParse({ ...base, recurso: 'UTI' }).success).toBe(false);
  });

  it('el envoltorio de éxito y el de fallo siguen la API, sección 4.1', () => {
    const meta = { requestId: 'req_01', timestamp: '2026-11-21T10:00:00Z' };
    expect(exito(z.object({ n: z.number() })).safeParse({ ok: true, data: { n: 1 }, meta }).success).toBe(true);
    const fallo = { ok: false, error: { code: 'CUOTA_AGOTADA', message: 'x', recuperable: false }, meta };
    expect(Fallo.safeParse(fallo).success).toBe(true);
    expect(Fallo.safeParse({ ...fallo, error: { ...fallo.error, code: 'INVENTADO' } }).success).toBe(false);
  });

  it('cada código de error tiene estado HTTP y bandera de recuperación', () => {
    for (const codigo of CodigoError.options) {
      expect(ESTADO_HTTP[codigo]).toBeGreaterThanOrEqual(400);
      expect(typeof RECUPERABLE[codigo]).toBe('boolean');
    }
    expect(ESTADO_HTTP.CUOTA_AGOTADA).toBe(429);
  });
});
