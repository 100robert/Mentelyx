import { CrearConversacionRequest, RETENCION_CONVERSACION_DIAS, type ConversacionDetalle, type ConversacionResumen } from '@mentelyx/contratos';
import { ErrorAplicacion } from '../../../shared/errores';
import { sumarDias, type ConversacionesPort, type ConversacionGuardada, type FuentesAutorizadasPort } from '../dominio/tutor';

const resumen = (c: Omit<ConversacionGuardada, 'messages'> & { mensajes: number }): ConversacionResumen => ({
  id: c.conversationId,
  titulo: c.titulo,
  espacioId: c.espacioId,
  mensajes: c.mensajes,
  actualizadaEn: c.updatedAt.toISOString(),
  expiraEn: c.expiraEn.toISOString(),
});

/** CrearConversacionUseCase. Si se asocia a un espacio, M2 confirma antes que el espacio es del actor. */
export const crearCrearConversacion =
  (deps: { conversaciones: ConversacionesPort; fuentesAutorizadas: FuentesAutorizadasPort; ahora: () => Date }) =>
  async (actorId: string, entrada: unknown): Promise<ConversacionResumen> => {
    const cmd = CrearConversacionRequest.parse(entrada);
    const espacioId = cmd.contexto.espacioId ?? null;
    if (espacioId) await deps.fuentesAutorizadas(actorId, { espacioId });
    const ahora = deps.ahora();
    const c = await deps.conversaciones.crear({
      conversationId: crypto.randomUUID(),
      ownerUserId: actorId,
      titulo: 'Nueva conversación',
      espacioId,
      ahora,
      expiraEn: sumarDias(ahora, RETENCION_CONVERSACION_DIAS),
    });
    return resumen({ ...c, mensajes: 0 });
  };

/** ListarConversacionesUseCase: solo las vigentes (90 días desde la última actividad, ADR-079). */
export const crearListarConversaciones =
  (deps: { conversaciones: ConversacionesPort; ahora: () => Date }) =>
  async (actorId: string): Promise<ConversacionResumen[]> =>
    (await deps.conversaciones.listar(actorId, deps.ahora())).map(resumen);

export const crearObtenerConversacion =
  (deps: { conversaciones: ConversacionesPort; ahora: () => Date }) =>
  async (actorId: string, conversacionId: string): Promise<ConversacionDetalle> => {
    const c = await deps.conversaciones.obtener(actorId, conversacionId, deps.ahora());
    if (!c) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Conversación no encontrada.');
    return {
      ...resumen({ ...c, mensajes: c.messages.length }),
      listaMensajes: c.messages.map((m) => ({
        id: m.id,
        rol: m.role,
        texto: m.text,
        operationKey: m.operationKey,
        ...(m.citations ? { citas: m.citations as never } : {}),
        creadoEn: m.createdAt.toISOString(),
      })),
    };
  };

/** EliminarConversacionUseCase: borrado inmediato de los mensajes. */
export const crearEliminarConversacion =
  (deps: { conversaciones: ConversacionesPort }) =>
  async (actorId: string, conversacionId: string) => {
    if (!(await deps.conversaciones.eliminar(actorId, conversacionId))) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Conversación no encontrada.');
    return { eliminada: true };
  };
