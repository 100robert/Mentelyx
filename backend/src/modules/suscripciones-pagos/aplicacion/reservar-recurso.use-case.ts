import { ReservarRecursoCmd, type ResultadoReserva } from '@mentelyx/contratos';
import type { Reloj } from '../../../shared/fechas';
import type { LibroRecursosPort } from '../dominio/libro-recursos.port';
import { periodoMensual, VERSION_COMERCIAL_VIGENTE, type ModuloOrigen } from '../dominio/recurso-plan';

/**
 * `reservarRecursoPlan` (API, sección 2.8): idempotente; nunca confía en el plan declarado por el cliente.
 * Sin saldo vigente, el usuario recibe el plan Gratuito del mes civil y la reserva se reintenta una sola vez.
 */
export const crearReservarRecurso =
  (libro: LibroRecursosPort, reloj: Reloj) =>
  async (origen: ModuloOrigen, entrada: unknown): Promise<ResultadoReserva> => {
    const cmd = ReservarRecursoCmd.parse(entrada);
    const hoy = reloj.hoy();
    const r = await libro.reservar({ ...cmd, origen, hoy });
    if (r.estado !== 'SIN_CUOTA') return r;
    const { creados } = await libro.asegurarPlanGratuito({ actorId: cmd.actorId, hoy, ...periodoMensual(hoy), policyVersion: VERSION_COMERCIAL_VIGENTE });
    return creados > 0 ? libro.reservar({ ...cmd, origen, hoy }) : r;
  };
