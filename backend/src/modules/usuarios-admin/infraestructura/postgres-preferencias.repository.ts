import { eq } from 'drizzle-orm';
import type { BdDrizzle } from '../../../shared/bd/conexion';
import type { Preferencias, PreferenciasRepositorio } from '../dominio/autenticacion.port';
import { learningPreferences } from './schema';

/** Valores por omisión: elegir la profundidad cada vez y todas las herramientas visuales disponibles. */
export const PREFERENCIAS_POR_OMISION: Preferencias = { profundidad: null, herramientasVisuales: [], idioma: 'es', actualizadasEn: null };

export class PostgresPreferencias implements PreferenciasRepositorio {
  constructor(private readonly db: BdDrizzle) {}

  async obtener(usuarioId: string): Promise<Preferencias> {
    const [f] = await this.db.select().from(learningPreferences).where(eq(learningPreferences.userId, usuarioId)).limit(1);
    if (!f) return PREFERENCIAS_POR_OMISION;
    return { profundidad: f.depth as Preferencias['profundidad'], herramientasVisuales: f.visualTools as string[], idioma: 'es', actualizadasEn: f.updatedAt.toISOString() };
  }

  async guardar(usuarioId: string, p: Omit<Preferencias, 'actualizadasEn'>, ahora: Date) {
    const valores = { depth: p.profundidad, visualTools: p.herramientasVisuales, language: p.idioma, updatedAt: ahora };
    await this.db
      .insert(learningPreferences)
      .values({ userId: usuarioId, ...valores })
      .onConflictDoUpdate({ target: learningPreferences.userId, set: valores });
    return { ...p, actualizadasEn: ahora.toISOString() };
  }
}
