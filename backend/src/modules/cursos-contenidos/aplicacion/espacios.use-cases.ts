import { CrearEspacioRequest, RegistrarFuenteTextoRequest, SeleccionarFuenteRequest, type EspacioDetalle, type Fuente } from '@mentelyx/contratos';
import { ErrorAplicacion } from '../../../shared/errores';
import { hashContenido } from '../../../shared/bd/mensajeria';
import {
  bytesUtf8,
  claveObjetoFuente,
  exigirPropietario,
  type AlmacenObjetosPort,
  type EspacioRegistro,
  type EspaciosRepositorio,
  type EstadoLecturaPort,
  type FuenteRegistro,
  type RecursosPlanPort,
} from '../dominio/espacios';

type Deps = { repo: EspaciosRepositorio; almacen: AlmacenObjetosPort; recursos: RecursosPlanPort; estadoLectura: EstadoLecturaPort };

const aEspacio = (e: EspacioRegistro) => ({
  id: e.id,
  titulo: e.titulo,
  estado: e.estado,
  fuentes: e.fuentes,
  almacenamientoBytes: e.almacenamientoBytes,
  creadoEn: e.creadoEn,
});

/** CrearEspacioUseCase (API, sección 2, M2). */
export const crearCrearEspacio = ({ repo }: Pick<Deps, 'repo'>) => async (actorId: string, entrada: unknown) => {
  const { titulo } = CrearEspacioRequest.parse(entrada);
  return aEspacio(await repo.crear({ propietarioId: actorId, titulo }));
};

/** ListarEspaciosUseCase: solo los del actor. */
export const crearListarEspacios = ({ repo }: Pick<Deps, 'repo'>) => async (actorId: string) => (await repo.listar(actorId)).map(aEspacio);

/** Detalle con fuentes y su estado de lectura (indexación en M6). Autorización por recurso. */
export const crearObtenerEspacio =
  ({ repo, estadoLectura }: Pick<Deps, 'repo' | 'estadoLectura'>) =>
  async (actorId: string, espacioId: string): Promise<EspacioDetalle> => {
    const espacio = exigirPropietario(await repo.obtener(espacioId), actorId, 'ESPACIO');
    const estados = await estadoLectura(espacio.listaFuentes.map((f) => f.contentId));
    const listaFuentes: Fuente[] = espacio.listaFuentes.map((f) => ({
      contentId: f.contentId,
      version: f.version,
      titulo: f.titulo,
      formato: f.formato,
      bytes: f.bytes,
      seleccionada: f.seleccionada,
      estadoLectura: estados.get(f.contentId) ?? 'PENDIENTE',
      agregadaEn: f.agregadaEn,
    }));
    return { ...aEspacio(espacio), listaFuentes };
  };

/**
 * RegistrarFuenteUseCase (MVP: TXT/MD en el cuerpo). Orden de efectos y compensación:
 *  1. M5 reserva ALMACENAMIENTO_BYTES con la clave de la operación (idempotente);
 *  2. el original se guarda en R2;
 *  3. una transacción de M2 registra contenido, versión, vínculo, bytes del espacio y el evento FuenteRegistrada;
 *  4. M5 confirma. Si 2 o 3 fallan: se borra el objeto y M5 libera la reserva; nada queda a medias.
 * Un reintento con la misma Idempotency-Key devuelve la fuente ya creada sin un segundo efecto.
 */
export const crearRegistrarFuente =
  (deps: Deps) =>
  async (actorId: string, espacioId: string, idempotencyKey: string, entrada: unknown) => {
    const cmd = RegistrarFuenteTextoRequest.parse(entrada);
    const espacio = exigirPropietario(await deps.repo.obtener(espacioId), actorId, 'ESPACIO');
    const operationKey = `fuente:${actorId}:${idempotencyKey}`;
    const previa = await deps.repo.buscarFuentePorClave(operationKey);
    if (previa) {
      if (previa.espacioId !== espacioId) throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La clave ya se usó en otro espacio.');
      return { contentId: previa.contentId, repetida: true };
    }
    const bytes = bytesUtf8(cmd.contenido);
    const reserva = await deps.recursos.reservarRecursoPlan({ actorId, recurso: 'ALMACENAMIENTO_BYTES', cantidad: bytes, operationKey });
    if (reserva.estado === 'SIN_CUOTA') {
      throw new ErrorAplicacion('CUOTA_AGOTADA', 'No queda almacenamiento disponible en tu plan.', { recurso: 'ALMACENAMIENTO_BYTES', requeridas: bytes, disponibles: reserva.disponibles });
    }
    const contentId = crypto.randomUUID();
    const claveObjeto = claveObjetoFuente(espacio.id, contentId, 1, cmd.formato);
    try {
      await deps.almacen.guardar(claveObjeto, cmd.contenido, cmd.formato === 'MD' ? 'text/markdown; charset=utf-8' : 'text/plain; charset=utf-8');
      await deps.repo.registrarFuente({
        espacioId: espacio.id,
        propietarioId: actorId,
        contentId,
        titulo: cmd.titulo,
        formato: cmd.formato,
        bytes,
        hash: await hashContenido(cmd.contenido),
        claveObjeto,
        operationKey,
      });
    } catch (e) {
      await deps.almacen.eliminar(claveObjeto).catch(() => {});
      await deps.recursos.liberarRecursoPlan({ operationKey, motivo: 'SIN_EJECUCION' }).catch(() => {});
      throw e;
    }
    await deps.recursos.confirmarRecursoPlan({ operationKey });
    return { contentId, repetida: false };
  };

/** SeleccionarFuenteUseCase: incluye o excluye la fuente del contexto del Tutor. */
export const crearSeleccionarFuente =
  ({ repo }: Pick<Deps, 'repo'>) =>
  async (actorId: string, espacioId: string, contentId: string, entrada: unknown) => {
    const { seleccionada } = SeleccionarFuenteRequest.parse(entrada);
    exigirPropietario(await repo.obtener(espacioId), actorId, 'ESPACIO');
    if (!(await repo.seleccionarFuente(espacioId, contentId, seleccionada))) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Fuente no encontrada.');
    return { contentId, seleccionada };
  };

/**
 * API pública para M6 (API, sección 2.8: `obtenerRecursoAutorizado`): solo fuentes del propio actor y seleccionadas.
 * Si se pide un espacio ajeno o inexistente responde «no encontrado» (nunca filtra por lo que diga el cliente).
 */
export const crearFuentesAutorizadas =
  ({ repo }: Pick<Deps, 'repo'>) =>
  async (actorId: string, filtro: { espacioId?: string | undefined; contentIds?: string[] | undefined }) => {
    if (filtro.espacioId) exigirPropietario(await repo.obtener(filtro.espacioId), actorId, 'ESPACIO');
    const fuentes = await repo.fuentesDelPropietario(actorId, filtro);
    return fuentes.filter((f) => f.seleccionada).map((f) => ({ contentId: f.contentId, version: f.version, titulo: f.titulo, espacioId: f.espacioId }));
  };

/** API pública para el indexador de M6: lee el original de una fuente propia. */
export const crearLeerContenidoFuente =
  ({ repo, almacen }: Pick<Deps, 'repo' | 'almacen'>) =>
  async (propietarioId: string, contentId: string): Promise<{ texto: string; fuente: FuenteRegistro } | undefined> => {
    const [fuente] = await repo.fuentesDelPropietario(propietarioId, { contentIds: [contentId] });
    if (!fuente) return undefined;
    const texto = await almacen.leer(fuente.claveObjeto);
    return texto === undefined ? undefined : { texto, fuente };
  };
