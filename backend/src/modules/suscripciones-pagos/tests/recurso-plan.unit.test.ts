import { describe, expect, it } from 'vitest';
import {
  aplicarConfirmacion,
  aplicarLiberacion,
  aplicarReintegro,
  aplicarReserva,
  claveReintegro,
  cumpleInvariante,
  disponibles,
  ReglaRecursoInfringida,
  saldoDesdeLibro,
  situacionReserva,
  type Movimiento,
  type SaldoRecurso,
} from '../dominio/recurso-plan';

const base: SaldoRecurso = { limite: 15, extra: 0, reservado: 0, consumido: 0 };

describe('M5 · reglas puras de recursos de plan', () => {
  it('disponibles = límite + extra − reservado − consumido', () => {
    expect(disponibles({ limite: 10, extra: 2, reservado: 3, consumido: 4 })).toBe(5);
  });

  it('no reserva más de lo disponible ni cantidades no positivas', () => {
    expect(() => aplicarReserva(base, 16)).toThrow(ReglaRecursoInfringida);
    expect(() => aplicarReserva(base, 0)).toThrow(ReglaRecursoInfringida);
    expect(aplicarReserva(base, 15).reservado).toBe(15);
  });

  it('confirmar consume lo real y libera el remanente; no confirma más de lo reservado', () => {
    const s = aplicarReserva(base, 3);
    expect(aplicarConfirmacion(s, 3, 2)).toEqual({ limite: 15, extra: 0, reservado: 0, consumido: 2 });
    expect(() => aplicarConfirmacion(s, 3, 4)).toThrow(ReglaRecursoInfringida);
  });

  it('liberar y reintegrar no dejan saldos negativos', () => {
    expect(() => aplicarLiberacion(base, 1)).toThrow(ReglaRecursoInfringida);
    expect(() => aplicarReintegro(base, 1)).toThrow(ReglaRecursoInfringida);
  });

  it('la clave de reintegro es refund:{operationKey} (API y persistencia, sección 7.9)', () => {
    expect(claveReintegro('tutor:op-1')).toBe('refund:tutor:op-1');
  });

  it('situación de una reserva repetida: la confirmación parcial (CONFIRMACION + LIBERACION) cuenta como CONFIRMADA', () => {
    expect(situacionReserva(new Set(['RESERVA']))).toBe('PENDIENTE');
    expect(situacionReserva(new Set(['RESERVA', 'LIBERACION']))).toBe('LIBERADA');
    expect(situacionReserva(new Set(['RESERVA', 'CONFIRMACION']))).toBe('CONFIRMADA');
    expect(situacionReserva(new Set(['RESERVA', 'CONFIRMACION', 'LIBERACION']))).toBe('CONFIRMADA');
  });

  it('en secuencias aleatorias el saldo incremental coincide con el reconstruido desde el libro y cumple el invariante', () => {
    let semilla = 20261121;
    const azar = () => ((semilla = (semilla * 1103515245 + 12345) % 2 ** 31) / 2 ** 31);
    for (let ronda = 0; ronda < 200; ronda++) {
      let saldo: SaldoRecurso = { limite: 20, extra: Math.floor(azar() * 5), reservado: 0, consumido: 0 };
      const libro: Movimiento[] = [];
      const abiertas = new Map<string, number>();
      const confirmadas = new Map<string, number>();
      for (let paso = 0; paso < 60; paso++) {
        const r = azar();
        const clave = `op-${ronda}-${paso}`;
        if (r < 0.45) {
          const q = 1 + Math.floor(azar() * 4);
          try {
            saldo = aplicarReserva(saldo, q);
            libro.push({ tipo: 'RESERVA', cantidad: q, operationKey: clave });
            abiertas.set(clave, q);
          } catch {
            expect(disponibles(saldo)).toBeLessThan(q);
          }
        } else if (r < 0.7 && abiertas.size) {
          const [k, q] = [...abiertas][0]!;
          const real = 1 + Math.floor(azar() * q);
          saldo = aplicarConfirmacion(saldo, q, real);
          libro.push({ tipo: 'CONFIRMACION', cantidad: real, operationKey: k });
          if (real < q) libro.push({ tipo: 'LIBERACION', cantidad: q - real, operationKey: k });
          abiertas.delete(k);
          confirmadas.set(k, real);
        } else if (r < 0.85 && abiertas.size) {
          const [k, q] = [...abiertas][0]!;
          saldo = aplicarLiberacion(saldo, q);
          libro.push({ tipo: 'LIBERACION', cantidad: q, operationKey: k });
          abiertas.delete(k);
        } else if (confirmadas.size) {
          const [k, q] = [...confirmadas][0]!;
          saldo = aplicarReintegro(saldo, q);
          libro.push({ tipo: 'REINTEGRO', cantidad: q, operationKey: claveReintegro(k) });
          confirmadas.delete(k);
        }
        expect(cumpleInvariante(saldo)).toBe(true);
      }
      expect(saldoDesdeLibro(saldo.limite, saldo.extra, libro)).toEqual(saldo);
    }
  });
});
