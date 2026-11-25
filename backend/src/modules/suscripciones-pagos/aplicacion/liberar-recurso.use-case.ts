import { MotivoLiberacion, OperationKey, z } from '@mentelyx/contratos';
import type { LibroRecursosPort, ResultadoMovimiento } from '../dominio/libro-recursos.port';
import type { ModuloOrigen } from '../dominio/recurso-plan';

const Cmd = z.strictObject({ operationKey: OperationKey, motivo: MotivoLiberacion });

/** `liberarRecursoPlan`: rechazo, cancelación o ausencia de ejecución. Idempotente. */
export const crearLiberarRecurso =
  (libro: LibroRecursosPort) =>
  async (origen: ModuloOrigen, entrada: unknown): Promise<ResultadoMovimiento> => {
    const { operationKey } = Cmd.parse(entrada);
    return libro.liberar({ operationKey, origen });
  };
