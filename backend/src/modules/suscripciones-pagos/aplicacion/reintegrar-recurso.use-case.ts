import { MotivoReintegro, OperationKey, z } from '@mentelyx/contratos';
import type { LibroRecursosPort, ResultadoMovimiento } from '../dominio/libro-recursos.port';
import type { ModuloOrigen } from '../dominio/recurso-plan';

const Cmd = z.strictObject({ operationKey: OperationKey, motivo: MotivoReintegro });

/** `reintegrarRecursoPlan`: REINTEGRO único con `refund:{operationKey}`; nunca sin una confirmación previa. */
export const crearReintegrarRecurso =
  (libro: LibroRecursosPort) =>
  async (origen: ModuloOrigen, entrada: unknown): Promise<ResultadoMovimiento> => {
    const { operationKey } = Cmd.parse(entrada);
    return libro.reintegrar({ operationKey, origen });
  };
