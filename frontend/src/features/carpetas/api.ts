import { apiCliente, ErrorApi, nuevaClave } from '@/lib/api-cliente';
import type { CambiarCarpeta, Carpeta, CrearCarpeta, Elemento, EstadoCarpeta, Modulo } from './tipos';

/**
 * La API todavía no expone las carpetas. Un 404 `RECURSO_NO_ENCONTRADO` en la colección (que no puede «no existir» para un
 * usuario autenticado) indica que el servicio no está disponible: la interfaz lo dice así, sin datos simulados.
 */
export class ServicioNoDisponible extends Error {
  constructor() {
    super('El servicio de carpetas no está disponible.');
    this.name = 'ServicioNoDisponible';
  }
}

export const esNoDisponible = (e: unknown) => e instanceof ErrorApi && e.estado === 404 && e.code === 'RECURSO_NO_ENCONTRADO';

export async function listarCarpetas(modulo: Modulo, estado: EstadoCarpeta): Promise<Carpeta[]> {
  try {
    return await apiCliente<Carpeta[]>(`/carpetas?modulo=${modulo}&estado=${estado}`);
  } catch (e) {
    if (esNoDisponible(e)) throw new ServicioNoDisponible();
    throw e;
  }
}

export const listarElementos = (carpetaId: string) => apiCliente<Elemento[]>(`/carpetas/${encodeURIComponent(carpetaId)}/elementos`);

export const crearCarpeta = (datos: CrearCarpeta) => apiCliente<Carpeta>('/carpetas', { metodo: 'POST', cuerpo: datos, clave: nuevaClave() });

export const cambiarCarpeta = (id: string, cambios: CambiarCarpeta) =>
  apiCliente<Carpeta>(`/carpetas/${encodeURIComponent(id)}`, { metodo: 'PATCH', cuerpo: cambios });

export const eliminarCarpeta = (id: string) => apiCliente<Record<string, never>>(`/carpetas/${encodeURIComponent(id)}`, { metodo: 'DELETE' });

export const moverElemento = (carpetaId: string, elemento: Pick<Elemento, 'id' | 'tipo'>) =>
  apiCliente<Elemento>(`/carpetas/${encodeURIComponent(carpetaId)}/elementos/${encodeURIComponent(elemento.id)}`, { metodo: 'PUT', cuerpo: { tipo: elemento.tipo } });
