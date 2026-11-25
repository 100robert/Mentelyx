import { OperationKey, z } from '@mentelyx/contratos';
import type { LibroRecursosPort, ResultadoMovimiento } from '../dominio/libro-recursos.port';
import type { ModuloOrigen } from '../dominio/recurso-plan';

const Cmd = z.strictObject({ operationKey: OperationKey, cantidadReal: z.number().positive().finite().optional() });

/** `confirmarRecursoPlan`: registra el consumo real; el remanente reservado se libera en la misma transacción. */
export const crearConfirmarRecurso =
  (libro: LibroRecursosPort) =>
  async (origen: ModuloOrigen, entrada: unknown): Promise<ResultadoMovimiento> =>
    libro.confirmar({ ...Cmd.parse(entrada), origen });
