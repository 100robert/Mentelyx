import { z } from 'zod';
import { ErrorAplicacion } from '../../../shared/errores';
import { admiteElemento, PROFUNDIDAD_MAXIMA, type CarpetasRepositorio, type Elemento, type ElementosPort, type ModuloCarpeta, type TipoElemento } from '../dominio/carpetas';

const Nombre = z.string().trim().min(1).max(80);
export const Modulo = z.enum(['APRENDIZAJE', 'EXAMENES']);
export const CrearCarpetaRequest = z.strictObject({ modulo: Modulo, nombre: Nombre, padreId: z.uuid().nullable().optional() });
export const CambiarCarpetaRequest = z
  .strictObject({ nombre: Nombre.optional(), padreId: z.uuid().nullable().optional(), estado: z.enum(['ACTIVA', 'ARCHIVADA']).optional() })
  .refine((c) => c.nombre !== undefined || c.padreId !== undefined || c.estado !== undefined, { message: 'Indica al menos un cambio.' });
export const MoverElementoRequest = z.strictObject({ tipo: z.enum(['TEMA', 'SESION', 'PREPARACION']) });

const noEncontrada = () => new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Carpeta no encontrada.');

/** Casos de uso de carpetas (M2, API 12.1). El actor sale siempre de la sesión; nunca del cuerpo. */
export function crearCasosCarpetas(deps: { repo: CarpetasRepositorio; elementos: ElementosPort; ahora: () => Date }) {
  const { repo } = deps;
  const exigir = async (actorId: string, id: string) => (await repo.obtener(actorId, id)) ?? Promise.reject(noEncontrada());

  /** Comprueba que el recurso existe y es de la persona (404 si no): la propiedad la decide el módulo dueño. */
  const recursoPropio = async (actorId: string, tipo: TipoElemento, id: string) => {
    const [r] = await deps.elementos[tipo](actorId, [id]);
    if (!r) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Elemento no encontrado.');
    return r;
  };

  return {
    listar: (actorId: string, modulo: ModuloCarpeta, estado: 'ACTIVA' | 'ARCHIVADA') => repo.listar(actorId, modulo, estado),

    async crear(actorId: string, operationKey: string, entrada: unknown) {
      const e = CrearCarpetaRequest.parse(entrada);
      if (e.padreId) {
        const padre = await exigir(actorId, e.padreId);
        if (padre.modulo !== e.modulo) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La carpeta superior es de otro módulo.');
        if (padre.profundidad + 1 > PROFUNDIDAD_MAXIMA) throw new ErrorAplicacion('ENTRADA_INVALIDA', `Las carpetas admiten hasta ${PROFUNDIDAD_MAXIMA} niveles.`);
      }
      return repo.crear(actorId, { modulo: e.modulo, nombre: e.nombre, padreId: e.padreId ?? null }, operationKey, deps.ahora());
    },

    async cambiar(actorId: string, id: string, entrada: unknown) {
      const e = CambiarCarpetaRequest.parse(entrada);
      const actual = await exigir(actorId, id);
      if (e.padreId) {
        const destino = await exigir(actorId, e.padreId);
        if (destino.modulo !== actual.modulo) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'No se mezclan carpetas de Aprendizaje y Exámenes.');
        if ((await repo.ancestros(actorId, e.padreId)).includes(id)) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'Una carpeta no puede moverse dentro de sí misma.');
        if (destino.profundidad + actual.alturaSubarbol > PROFUNDIDAD_MAXIMA) throw new ErrorAplicacion('ENTRADA_INVALIDA', `Las carpetas admiten hasta ${PROFUNDIDAD_MAXIMA} niveles.`);
      }
      return repo.actualizar(actorId, id, e, deps.ahora());
    },

    async eliminar(actorId: string, id: string) {
      if (!(await repo.eliminar(actorId, id))) throw noEncontrada();
      return {};
    },

    async elementos(actorId: string, id: string): Promise<Elemento[]> {
      await exigir(actorId, id);
      const refs = await repo.elementos(actorId, id);
      const porTipo = new Map<TipoElemento, string[]>();
      for (const r of refs) porTipo.set(r.tipo, [...(porTipo.get(r.tipo) ?? []), r.id]);
      const listas = await Promise.all(
        [...porTipo].map(async ([tipo, ids]) => (await deps.elementos[tipo](actorId, ids)).map((x) => ({ id: x.id, tipo, titulo: x.titulo, carpetaId: id, actualizadoEn: x.actualizadoEn }))),
      );
      // Un recurso eliminado o vencido (p. ej. una sesión tras su retención) simplemente deja de aparecer.
      return listas.flat().sort((a, b) => a.titulo.localeCompare(b.titulo, 'es'));
    },

    async moverElemento(actorId: string, carpetaId: string, elementoId: string, entrada: unknown): Promise<Elemento> {
      const e = MoverElementoRequest.parse(entrada);
      const carpeta = await exigir(actorId, carpetaId);
      if (!admiteElemento(carpeta.modulo, e.tipo)) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'Ese elemento no pertenece al módulo de la carpeta.');
      const r = await recursoPropio(actorId, e.tipo, elementoId);
      await repo.ubicar(actorId, carpetaId, e.tipo, elementoId, deps.ahora());
      return { id: r.id, tipo: e.tipo, titulo: r.titulo, carpetaId, actualizadoEn: r.actualizadoEn };
    },

    /** API pública para M3 (preparaciones en carpetas de Exámenes). */
    puerto: {
      validar: async (actorId: string, carpetaId: string, modulo: ModuloCarpeta) => {
        const c = await exigir(actorId, carpetaId);
        if (c.modulo !== modulo) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La carpeta es de otro módulo.');
      },
      asignar: (actorId: string, carpetaId: string, tipo: TipoElemento, id: string) => repo.ubicar(actorId, carpetaId, tipo, id, deps.ahora()),
      ubicacion: (actorId: string, tipo: TipoElemento, ids: string[]) => repo.ubicacion(actorId, tipo, ids),
    },
  };
}
