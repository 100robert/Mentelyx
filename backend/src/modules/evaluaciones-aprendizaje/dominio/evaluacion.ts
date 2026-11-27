import { corregir, type Correccion, type Respuesta } from '@mentelyx/contratos/educacion/pregunta-corregir';
import type { Pregunta } from '@mentelyx/contratos/educacion/pregunta-esquema';
import { ErrorAplicacion } from '../../../shared/errores';

/**
 * M3 · evaluación de preparaciones (API 12.9; persistencia 7.3 y 4.2). Reglas puras:
 *  - la proyección pública de una pregunta no contiene su solución (ni en práctica antes de comprobarla, ni en
 *    simulacro o diagnóstico antes de entregar);
 *  - la calificación oficial usa el MISMO `corregir` que el cliente (paquete compartido), por lo que ambos coinciden
 *    en los tipos cerrados; las abiertas quedan PENDIENTE y no suman ni restan;
 *  - la repetición espaciada de las tarjetas la calcula el servidor (regla `sm2-mentelyx-v1`).
 */
export const VERSION_CALIFICACION = 'calificacion-v1-2026-11-26';
export const VERSION_REPASO = 'sm2-mentelyx-v1';
export const MAX_PREGUNTAS_INTENTO = 40;

export type ModoIntento = 'PRACTICA' | 'SIMULACRO' | 'DIAGNOSTICO';
/** Permutación por pregunta de relación: posición mostrada → id real del par cuya «derecha» se muestra ahí. */
export type Proyeccion = Record<string, { derechas: Record<string, string> }>;

type Obj = Record<string, unknown>;
const sinCampos = (o: Obj, campos: readonly string[]) => Object.fromEntries(Object.entries(o).filter(([k]) => !campos.includes(k)));
const SOLUCION = ['correcta', 'correctas', 'respuesta', 'tolerancia', 'orden', 'explicacion', 'respuestaModelo'] as const;

/** Barajado determinista (semilla textual) para que un reintento del mismo intento muestre lo mismo. */
export function barajar<T>(lista: readonly T[], semilla: string): T[] {
  let h = 2166136261;
  for (const c of semilla) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  const r = [...lista];
  for (let i = r.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 15), 2246822519) >>> 0;
    const j = h % (i + 1);
    [r[i], r[j]] = [r[j]!, r[i]!];
  }
  return r;
}

/**
 * Proyección pública. Ordenamiento: elementos barajados y sin `orden`. Relación: las «derechas» se permutan entre los
 * pares (así el par no revela su pareja) y la permutación queda en el servidor para traducir la respuesta al calificar.
 */
export function proyectar(p: Pregunta, semilla: string): { publica: Obj; proyeccion: Proyeccion[string] | null } {
  const base = sinCampos(p as unknown as Obj, SOLUCION);
  if (p.tipo === 'ordenamiento') return { publica: { ...base, elementos: barajar(p.elementos, `${semilla}:${p.id}`) }, proyeccion: null };
  if (p.tipo === 'relacion') {
    const derechas = barajar(p.pares, `${semilla}:${p.id}`);
    const mapa: Record<string, string> = {};
    const pares = p.pares.map((par, k) => {
      mapa[par.id] = derechas[k]!.id;
      return { id: par.id, izquierda: par.izquierda, derecha: derechas[k]!.derecha };
    });
    return { publica: { ...base, pares: barajar(pares, `${semilla}:${p.id}:izq`) }, proyeccion: { derechas: mapa } };
  }
  if (p.tipo === 'caso') {
    return { publica: { ...base, preguntas: p.preguntas.map((s) => sinCampos(s as unknown as Obj, SOLUCION)) }, proyeccion: null };
  }
  return { publica: base, proyeccion: null };
}

/** Traduce una respuesta de relación dada sobre la proyección a los identificadores reales de los pares. */
export function traducir(p: Pregunta, r: Respuesta | undefined, proyeccion: Proyeccion[string] | undefined): Respuesta | undefined {
  if (p.tipo !== 'relacion' || r?.tipo !== 'pares' || !proyeccion) return r;
  const asignacion: Record<string, string> = {};
  for (const [izquierda, mostrado] of Object.entries(r.asignacion)) {
    const real = proyeccion.derechas[mostrado];
    if (real) asignacion[izquierda] = real;
  }
  return { tipo: 'pares', asignacion };
}

export type ResultadoPregunta = { preguntaId: string; tema: string; tipo: Pregunta['tipo']; correccion: Correccion };
export type Calificacion = {
  puntaje: number;
  maximo: number;
  pendientes: number;
  porcentaje: number;
  porTema: Array<{ tema: string; puntaje: number; maximo: number; pendientes: number }>;
  preguntas: ResultadoPregunta[];
};

/** Calificación oficial: 1 punto por pregunta con corrección automática; las pendientes no entran en el máximo. */
export function calificar(preguntas: readonly Pregunta[], respuestas: Readonly<Record<string, Respuesta>>, proyeccion: Proyeccion): Calificacion {
  const resultados = preguntas.map((p) => ({ preguntaId: p.id, tema: p.tema, tipo: p.tipo, correccion: corregir(p, traducir(p, respuestas[p.id], proyeccion[p.id])) }));
  const temas = new Map<string, { puntaje: number; maximo: number; pendientes: number }>();
  let puntaje = 0;
  let maximo = 0;
  let pendientes = 0;
  for (const r of resultados) {
    const t = temas.get(r.tema) ?? { puntaje: 0, maximo: 0, pendientes: 0 };
    if (r.correccion.estado === 'pendiente' && r.correccion.puntaje === null) {
      pendientes++;
      t.pendientes++;
    } else {
      const valor = r.correccion.puntaje ?? 0;
      puntaje += valor;
      maximo += 1;
      t.puntaje += valor;
      t.maximo += 1;
    }
    temas.set(r.tema, t);
  }
  const redondear = (n: number) => Math.round(n * 10_000) / 10_000;
  return {
    puntaje: redondear(puntaje),
    maximo,
    pendientes,
    porcentaje: maximo === 0 ? 0 : Math.round((puntaje / maximo) * 100),
    porTema: [...temas].map(([tema, v]) => ({ tema, puntaje: redondear(v.puntaje), maximo: v.maximo, pendientes: v.pendientes })),
    preguntas: resultados,
  };
}

/** Plazo del servidor: un simulacro vencido no admite respuestas; la entrega tardía se califica y se marca. */
export function exigirAbierto(intento: { estado: string; venceEn: Date | null }, ahora: Date, permitirVencido = false) {
  if (intento.estado !== 'EN_CURSO') throw new ErrorAplicacion('INTENTO_CERRADO', 'Este intento ya se entregó.');
  if (!permitirVencido && intento.venceEn && ahora.getTime() > intento.venceEn.getTime()) {
    throw new ErrorAplicacion('INTENTO_CERRADO', 'El tiempo del simulacro terminó: entrégalo para ver tus resultados.');
  }
}

export type Calificacion4 = 'OTRA_VEZ' | 'DIFICIL' | 'BIEN' | 'FACIL';
const CALIDAD: Record<Calificacion4, number> = { OTRA_VEZ: 1, DIFICIL: 3, BIEN: 4, FACIL: 5 };

/** SM-2 simplificado (Wozniak, 1990) con calidad 1/3/4/5. Devuelve el nuevo estado y la próxima fecha. */
export function repasar(estado: { intervaloDias: number; facilidad: number; repeticiones: number }, calificacion: Calificacion4, ahora: Date) {
  const q = CALIDAD[calificacion];
  const facilidad = Math.min(3, Math.max(1.3, estado.facilidad + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))));
  let repeticiones = estado.repeticiones;
  let intervaloDias: number;
  if (q < 3) {
    repeticiones = 0;
    intervaloDias = 0; // se vuelve a mostrar en esta sesión (10 minutos)
  } else {
    repeticiones += 1;
    intervaloDias = repeticiones === 1 ? 1 : repeticiones === 2 ? 6 : Math.round(Math.max(1, estado.intervaloDias) * facilidad);
  }
  const proxima = new Date(ahora.getTime() + (intervaloDias === 0 ? 10 * 60_000 : intervaloDias * 86_400_000));
  return { intervaloDias, facilidad: Math.round(facilidad * 100) / 100, repeticiones, proxima };
}
