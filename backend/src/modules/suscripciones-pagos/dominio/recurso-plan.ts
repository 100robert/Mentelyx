/**
 * Recursos de plan (ADR-080; persistencia, sección 7.9). Reglas puras, sin SQL ni frameworks.
 * Invariante: reservado + consumido ≤ límite + extra, y todos los valores ≥ 0.
 */
export const TIPOS_MOVIMIENTO = ['RESERVA', 'CONFIRMACION', 'LIBERACION', 'CONCESION', 'REINTEGRO', 'AJUSTE'] as const;
export type TipoMovimiento = (typeof TIPOS_MOVIMIENTO)[number];

export const MODULOS_ORIGEN = ['M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7'] as const;
export type ModuloOrigen = (typeof MODULOS_ORIGEN)[number];

export type SaldoRecurso = { limite: number; extra: number; reservado: number; consumido: number };

export const disponibles = (s: SaldoRecurso): number => s.limite + s.extra - s.reservado - s.consumido;

export const cumpleInvariante = (s: SaldoRecurso): boolean =>
  s.limite >= 0 && s.extra >= 0 && s.reservado >= 0 && s.consumido >= 0 && s.reservado + s.consumido <= s.limite + s.extra;

export const puedeReservar = (s: SaldoRecurso, cantidad: number): boolean => cantidad > 0 && disponibles(s) >= cantidad;

export class ReglaRecursoInfringida extends Error {
  constructor(readonly regla: string) {
    super(`Regla de recursos infringida: ${regla}`);
    this.name = 'ReglaRecursoInfringida';
  }
}

export function aplicarReserva(s: SaldoRecurso, cantidad: number): SaldoRecurso {
  if (!puedeReservar(s, cantidad)) throw new ReglaRecursoInfringida('SIN_CUOTA');
  return { ...s, reservado: s.reservado + cantidad };
}

/** Confirma lo realmente usado; lo reservado que no se usó se libera en el mismo paso. */
export function aplicarConfirmacion(s: SaldoRecurso, reservado: number, real: number): SaldoRecurso {
  if (!(real > 0) || real > reservado) throw new ReglaRecursoInfringida('CANTIDAD_REAL_FUERA_DE_RANGO');
  if (s.reservado < reservado) throw new ReglaRecursoInfringida('RESERVA_INEXISTENTE_EN_SALDO');
  return { ...s, reservado: s.reservado - reservado, consumido: s.consumido + real };
}

export function aplicarLiberacion(s: SaldoRecurso, reservado: number): SaldoRecurso {
  if (s.reservado < reservado) throw new ReglaRecursoInfringida('RESERVA_INEXISTENTE_EN_SALDO');
  return { ...s, reservado: s.reservado - reservado };
}

export function aplicarReintegro(s: SaldoRecurso, confirmado: number): SaldoRecurso {
  if (s.consumido < confirmado) throw new ReglaRecursoInfringida('CONSUMO_INSUFICIENTE_PARA_REINTEGRO');
  return { ...s, consumido: s.consumido - confirmado };
}

export type Movimiento = { tipo: TipoMovimiento; cantidad: number; operationKey: string };

/**
 * Reconstruye reservado y consumido a partir del libro (conciliación ledger = saldo, runbook EQ-21).
 * Una CONFIRMACION consume su cantidad y, junto con la LIBERACION de su remanente, retira la reserva completa.
 */
export function saldoDesdeLibro(limite: number, extra: number, movimientos: readonly Movimiento[]): SaldoRecurso {
  let reservado = 0;
  let consumido = 0;
  for (const m of movimientos) {
    switch (m.tipo) {
      case 'RESERVA':
        reservado += m.cantidad;
        break;
      case 'CONFIRMACION':
        reservado -= m.cantidad;
        consumido += m.cantidad;
        break;
      case 'LIBERACION':
        reservado -= m.cantidad;
        break;
      case 'REINTEGRO':
        consumido -= m.cantidad;
        break;
      case 'CONCESION':
      case 'AJUSTE':
        break;
    }
  }
  return { limite, extra, reservado, consumido };
}

export const claveReintegro = (operationKey: string): string => `refund:${operationKey}`;

/**
 * Situación de una reserva según los movimientos que comparten su clave. Una confirmación parcial registra también
 * la LIBERACION del remanente, por eso la CONFIRMACION se evalúa primero.
 */
export function situacionReserva(tipos: ReadonlySet<TipoMovimiento>): 'PENDIENTE' | 'CONFIRMADA' | 'LIBERADA' {
  if (tipos.has('CONFIRMACION')) return 'CONFIRMADA';
  if (tipos.has('LIBERACION')) return 'LIBERADA';
  return 'PENDIENTE';
}

/** Periodo mensual civil [primer día del mes, primer día del mes siguiente) para una fecha AAAA-MM-DD. */
export function periodoMensual(hoy: string): { inicio: string; fin: string } {
  const [a, m] = hoy.split('-').map(Number) as [number, number];
  const dos = (n: number) => String(n).padStart(2, '0');
  return { inicio: `${a}-${dos(m)}-01`, fin: m === 12 ? `${a + 1}-01-01` : `${a}-${dos(m + 1)}-01` };
}

/** Versión comercial vigente del piloto (migración 0001; IM, secciones 14 y 15). */
export const VERSION_COMERCIAL_VIGENTE = 'piloto-2026-11-20';
