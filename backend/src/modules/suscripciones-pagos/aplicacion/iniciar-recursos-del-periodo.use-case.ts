import { CodigoProducto, z } from '@mentelyx/contratos';
import type { LibroRecursosPort } from '../dominio/libro-recursos.port';

const Cmd = z.strictObject({
  actorId: z.uuid(),
  producto: CodigoProducto,
  policyVersion: z.string().min(1).max(80),
  inicio: z.iso.date(),
  fin: z.iso.date(),
});

/**
 * `iniciarRecursosDelPeriodo` (diseño interno, sección 7.5): copia los límites de la versión comercial al saldo del periodo.
 * En producción lo invoca la confirmación de pago (I-6); en I-0 se usa con datos sintéticos.
 */
export const crearIniciarRecursosDelPeriodo =
  (libro: LibroRecursosPort) =>
  async (entrada: unknown): Promise<{ creados: number }> =>
    libro.iniciarPeriodo(Cmd.parse(entrada));
