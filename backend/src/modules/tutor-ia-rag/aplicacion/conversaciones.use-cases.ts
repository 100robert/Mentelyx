import { CrearConversacionRequest, GuardarEstadoSesionRequest, LIMITE_ESTADO_SESION_BYTES, RETENCION_CONVERSACION_DIAS, type ConversacionDetalle, type ConversacionResumen } from '@mentelyx/contratos';
import { ErrorAplicacion } from '../../../shared/errores';
import { sumarDias, type ConversacionesPort, type ConversacionGuardada, type FuentesAutorizadasPort } from '../dominio/tutor';

const resumen = (c: Omit<ConversacionGuardada, 'messages'> & { mensajes: number }): ConversacionResumen => ({
  id: c.conversationId,
  titulo: c.titulo,
  espacioId: c.espacioId,
  ...(c.preparacionId ? { preparacionId: c.preparacionId, temaId: c.temaId ?? null } : {}),
  mensajes: c.mensajes,
  actualizadaEn: c.updatedAt.toISOString(),
  expiraEn: c.expiraEn.toISOString(),
});

/** Puerto hacia M3: confirma que la preparación es del actor (enlace tardío en app.ts). */
export type PreparacionPropiaPort = (actorId: string, preparacionId: string) => Promise<boolean>;

/**
 * CrearConversacionUseCase. Si se asocia a un espacio, M2 confirma antes que el espacio es del actor; si se asocia a
 * una preparación (API 12.9), M3 lo confirma. Un recurso ajeno responde 404.
 */
export const crearCrearConversacion =
  (deps: { conversaciones: ConversacionesPort; fuentesAutorizadas: FuentesAutorizadasPort; preparacionPropia: PreparacionPropiaPort; ahora: () => Date }) =>
  async (actorId: string, entrada: unknown): Promise<ConversacionResumen> => {
    const cmd = CrearConversacionRequest.parse(entrada);
    const espacioId = cmd.contexto.espacioId ?? null;
    if (espacioId) await deps.fuentesAutorizadas(actorId, { espacioId });
    const preparacionId = cmd.contexto.preparacionId ?? null;
    if (preparacionId && !(await deps.preparacionPropia(actorId, preparacionId))) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Preparación no encontrada.');
    const ahora = deps.ahora();
    const c = await deps.conversaciones.crear({
      conversationId: crypto.randomUUID(),
      ownerUserId: actorId,
      titulo: 'Nueva conversación',
      espacioId,
      ...(preparacionId ? { preparacionId, temaId: cmd.contexto.temaId ?? null } : {}),
      ahora,
      expiraEn: sumarDias(ahora, RETENCION_CONVERSACION_DIAS),
    });
    return resumen({ ...c, mensajes: 0 });
  };

/** ListarConversacionesUseCase: solo las vigentes (90 días desde la última actividad, ADR-079). */
export const crearListarConversaciones =
  (deps: { conversaciones: ConversacionesPort; ahora: () => Date }) =>
  async (actorId: string, filtro?: { preparacionId?: string }): Promise<ConversacionResumen[]> =>
    (await deps.conversaciones.listar(actorId, deps.ahora(), filtro)).map(resumen);

const ESTADO_VACIO = { version: 0, interaccion: {}, anotaciones: [], actualizadoEn: null };

/** Estado guardado de la sesión (API 12.5). Sin estado previo devuelve la versión 0 vacía. */
export const crearObtenerEstado =
  (deps: { conversaciones: ConversacionesPort; ahora: () => Date }) =>
  async (actorId: string, conversacionId: string) => {
    const e = await deps.conversaciones.obtenerEstado(actorId, conversacionId, deps.ahora());
    if (e === undefined) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Conversación no encontrada.');
    return e ? { ...e, actualizadoEn: e.actualizadoEn.toISOString() } : ESTADO_VACIO;
  };

/**
 * Guarda el último estado completo (≤ 64 KB) si `If-Match` coincide con la versión guardada; 412 CONFLICTO_VERSION si
 * otra pestaña guardó antes. Los bloques propios se validan con el mismo esquema del cliente y se marcan `persona`.
 */
export const crearGuardarEstado =
  (deps: { conversaciones: ConversacionesPort; ahora: () => Date }) =>
  async (actorId: string, conversacionId: string, ifMatch: string | undefined, entrada: unknown) => {
    const version = Number((ifMatch ?? '').replace(/^W\//, '').replace(/"/g, ''));
    if (!ifMatch || !Number.isInteger(version) || version < 0) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'Falta la cabecera If-Match con la versión leída.');
    if (new TextEncoder().encode(JSON.stringify(entrada)).length > LIMITE_ESTADO_SESION_BYTES) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'El estado de la sesión supera los 64 KB.');
    const e = GuardarEstadoSesionRequest.parse(entrada);
    const bloquesPropios = e.bloquesPropios?.map((b) => ({ ...b, origen: 'persona' as const }));
    const r = await deps.conversaciones.guardarEstado(
      actorId,
      conversacionId,
      version,
      { interaccion: e.interaccion, anotaciones: e.anotaciones, ...(bloquesPropios ? { bloquesPropios } : {}) },
      deps.ahora(),
    );
    if (r === 'NO_ENCONTRADA') throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Conversación no encontrada.');
    if (r === 'CONFLICTO') throw new ErrorAplicacion('CONFLICTO_VERSION', 'Otra pestaña guardó esta sesión antes. Vuelve a cargarla.');
    return { ...r, actualizadoEn: r.actualizadoEn.toISOString() };
  };

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
        // Rótulo del proveedor también en sesiones reconstruidas (API, 12.11, riesgos): nunca se oculta el simulado.
        ...(m.meta ? { ruta: { proveedor: m.meta.proveedor, etiqueta: m.meta.etiqueta, modelo: m.meta.modelo }, avisos: m.meta.avisos } : {}),
        ...(m.blocks?.length ? { bloques: m.blocks as never } : {}),
        ...(m.actions?.length ? { acciones: m.actions as never } : {}),
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
