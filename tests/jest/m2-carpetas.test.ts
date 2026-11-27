import { crearCasosCarpetas } from '../../backend/src/modules/cursos-contenidos/aplicacion/carpetas.use-cases';
import type { Carpeta, CarpetasRepositorio, ElementosPort, TipoElemento } from '../../backend/src/modules/cursos-contenidos/dominio/carpetas';

/** M2 · carpetas independientes por módulo (API 12.1): jerarquía ≤ 3, sin ciclos, sin mezclar módulos y propiedad. */
function repoEnMemoria(): CarpetasRepositorio {
  const carpetas = new Map<string, Carpeta & { owner: string }>();
  const items = new Map<string, { owner: string; carpeta: string }>();
  const profundidad = (id: string): number => {
    const c = carpetas.get(id)!;
    return c.padreId ? 1 + profundidad(c.padreId) : 1;
  };
  const altura = (id: string): number => 1 + Math.max(0, ...[...carpetas.values()].filter((c) => c.padreId === id).map((c) => altura(c.id)));
  return {
    listar: async (o, m, e) => [...carpetas.values()].filter((c) => c.owner === o && c.modulo === m && c.estado === e),
    obtener: async (o, id) => {
      const c = carpetas.get(id);
      return c && c.owner === o ? { ...c, profundidad: profundidad(id), alturaSubarbol: altura(id) } : null;
    },
    ancestros: async (_o, id) => {
      const r: string[] = [];
      for (let c = carpetas.get(id); c; c = c.padreId ? carpetas.get(c.padreId) : undefined) r.push(c.id);
      return r;
    },
    crear: async (o, c) => {
      const id = crypto.randomUUID();
      const nueva = { id, owner: o, modulo: c.modulo, nombre: c.nombre, padreId: c.padreId, estado: 'ACTIVA' as const, elementos: 0, actualizadaEn: '' };
      carpetas.set(id, nueva);
      return { carpeta: nueva, repetida: false };
    },
    actualizar: async (o, id, cambios) => {
      const c = carpetas.get(id)!;
      const act = { ...c, ...(cambios.nombre ? { nombre: cambios.nombre } : {}), ...(cambios.padreId !== undefined ? { padreId: cambios.padreId } : {}), ...(cambios.estado ? { estado: cambios.estado } : {}) };
      carpetas.set(id, act);
      return act;
    },
    eliminar: async (o, id) => carpetas.get(id)?.owner === o && carpetas.delete(id),
    elementos: async (o, id) => [...items].filter(([, v]) => v.owner === o && v.carpeta === id).map(([k]) => ({ tipo: k.split(':')[0] as TipoElemento, id: k.split(':')[1]! })),
    ubicar: async (o, carpeta, tipo, id) => void items.set(`${tipo}:${id}`, { owner: o, carpeta }),
    ubicacion: async () => new Map(),
  };
}
const elementos: ElementosPort = {
  TEMA: async (actor, ids) => ids.filter((id) => id === `tema-de-${actor}`).map((id) => ({ id, titulo: 'Derivadas', actualizadoEn: '' })),
  SESION: async () => [],
  PREPARACION: async (actor, ids) => ids.filter((id) => id === `prep-de-${actor}`).map((id) => ({ id, titulo: 'Parcial', actualizadoEn: '' })),
};
const casos = () => crearCasosCarpetas({ repo: repoEnMemoria(), elementos, ahora: () => new Date() });

describe('M2 · carpetas por módulo', () => {
  it('admite hasta 3 niveles y rechaza el cuarto', async () => {
    const c = casos();
    const a = (await c.crear('ana', 'k1', { modulo: 'APRENDIZAJE', nombre: 'Física' })).carpeta;
    const b = (await c.crear('ana', 'k2', { modulo: 'APRENDIZAJE', nombre: 'Mecánica', padreId: a.id })).carpeta;
    const d = (await c.crear('ana', 'k3', { modulo: 'APRENDIZAJE', nombre: 'Cinemática', padreId: b.id })).carpeta;
    await expect(c.crear('ana', 'k4', { modulo: 'APRENDIZAJE', nombre: 'Nivel 4', padreId: d.id })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
  });

  it('no permite ciclos, mezclar módulos ni exceder la profundidad al mover', async () => {
    const c = casos();
    const a = (await c.crear('ana', 'k1', { modulo: 'APRENDIZAJE', nombre: 'A' })).carpeta;
    const b = (await c.crear('ana', 'k2', { modulo: 'APRENDIZAJE', nombre: 'B', padreId: a.id })).carpeta;
    const x = (await c.crear('ana', 'k3', { modulo: 'EXAMENES', nombre: 'X' })).carpeta;
    await expect(c.cambiar('ana', a.id, { padreId: b.id })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await expect(c.cambiar('ana', a.id, { padreId: x.id })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    const n3 = (await c.crear('ana', 'k4', { modulo: 'APRENDIZAJE', nombre: 'N3', padreId: b.id })).carpeta;
    const otra = (await c.crear('ana', 'k5', { modulo: 'APRENDIZAJE', nombre: 'Otra' })).carpeta;
    await c.crear('ana', 'k6', { modulo: 'APRENDIZAJE', nombre: 'Hija', padreId: otra.id });
    await expect(c.cambiar('ana', otra.id, { padreId: n3.id })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await expect(c.cambiar('ana', a.id, {})).rejects.toThrow();
  });

  it('una carpeta de otra cuenta responde 404 y no se puede usar como destino', async () => {
    const c = casos();
    const a = (await c.crear('ana', 'k1', { modulo: 'APRENDIZAJE', nombre: 'Privada' })).carpeta;
    await expect(c.elementos('beto', a.id)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    await expect(c.cambiar('beto', a.id, { nombre: 'Robada' })).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    await expect(c.crear('beto', 'k9', { modulo: 'APRENDIZAJE', nombre: 'Hija', padreId: a.id })).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    await expect(c.eliminar('beto', a.id)).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
  });

  it('cada módulo admite solo sus elementos y solo recursos propios', async () => {
    const c = casos();
    const ap = (await c.crear('ana', 'k1', { modulo: 'APRENDIZAJE', nombre: 'Temas' })).carpeta;
    const ex = (await c.crear('ana', 'k2', { modulo: 'EXAMENES', nombre: 'Ciclo' })).carpeta;
    expect(await c.moverElemento('ana', ap.id, 'tema-de-ana', { tipo: 'TEMA' })).toMatchObject({ tipo: 'TEMA', carpetaId: ap.id });
    await expect(c.moverElemento('ana', ex.id, 'tema-de-ana', { tipo: 'TEMA' })).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await expect(c.moverElemento('ana', ap.id, 'tema-de-beto', { tipo: 'TEMA' })).rejects.toMatchObject({ code: 'RECURSO_NO_ENCONTRADO' });
    expect((await c.elementos('ana', ap.id)).map((e) => e.titulo)).toEqual(['Derivadas']);
    await expect(c.puerto.validar('ana', ap.id, 'EXAMENES')).rejects.toMatchObject({ code: 'ENTRADA_INVALIDA' });
    await expect(c.puerto.validar('ana', ex.id, 'EXAMENES')).resolves.toBeUndefined();
  });

  it('valida el nombre (1–80) antes de persistir', async () => {
    await expect(casos().crear('ana', 'k1', { modulo: 'APRENDIZAJE', nombre: '' })).rejects.toThrow();
    await expect(casos().crear('ana', 'k1', { modulo: 'OTRO', nombre: 'x' })).rejects.toThrow();
  });
});
