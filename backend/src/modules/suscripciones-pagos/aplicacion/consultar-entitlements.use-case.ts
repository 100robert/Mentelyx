import type { DerechosDelPeriodo } from '@mentelyx/contratos';
import type { Reloj } from '../../../shared/fechas';
import type { ConsultaRecursosPort, LibroRecursosPort } from '../dominio/libro-recursos.port';
import { disponibles, periodoMensual, VERSION_COMERCIAL_VIGENTE } from '../dominio/recurso-plan';

/**
 * Recursos del periodo vigente del propio actor. La autorización es por recurso: el actor solo ve sus saldos,
 * y el identificador proviene de la sesión del servidor, nunca del cliente.
 */
export const crearConsultarDerechos =
  (consulta: ConsultaRecursosPort, libro: Pick<LibroRecursosPort, 'asegurarPlanGratuito'>, reloj: Reloj) =>
  async (actorId: string): Promise<DerechosDelPeriodo | null> => {
    const hoy = reloj.hoy();
    let recursos = await consulta.recursosVigentes(actorId, hoy);
    if (recursos.length === 0) {
      await libro.asegurarPlanGratuito({ actorId, hoy, ...periodoMensual(hoy), policyVersion: VERSION_COMERCIAL_VIGENTE });
      recursos = await consulta.recursosVigentes(actorId, hoy);
    }
    const [primero] = recursos;
    if (!primero) return null;
    return {
      producto: primero.producto,
      policyVersion: primero.policyVersion,
      periodo: { inicio: primero.inicio, fin: primero.fin },
      recursos: recursos.map((r) => ({
        recurso: r.recurso,
        limite: r.limite,
        extra: r.extra,
        reservado: r.reservado,
        consumido: r.consumido,
        disponibles: disponibles(r),
      })),
    };
  };
