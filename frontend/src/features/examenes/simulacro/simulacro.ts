import { corregir, respondida, type Correccion, type Respuesta } from '../preguntas/corregir';
import type { Pregunta, TipoPregunta } from '../preguntas/esquema';

/**
 * Simulacro como máquina de estados pura: configuración, preguntas en curso (navegación, marcas para revisar), resumen
 * antes de entregar y entrega. Durante el simulacro no se corrige ni se revelan respuestas. El tiempo límite es local
 * del navegador (sin garantía del servidor) y así se informa.
 */
export type ConfigSimulacro = {
  nombre: string;
  temas: string[];
  cantidad: number;
  dificultades: Array<Pregunta['dificultad']>;
  tipos: TipoPregunta[];
  minutos: number | null;
  semilla: number;
};
export type Fase = 'en-curso' | 'resumen' | 'entregado';
export type EstadoSimulacro = {
  config: ConfigSimulacro;
  preguntas: string[];
  actual: number;
  respuestas: Record<string, Respuesta>;
  marcadas: string[];
  fase: Fase;
  inicio: number;
  fin: number | null;
  porTiempo: boolean;
};
export type AccionSimulacro =
  | { tipo: 'responder'; id: string; respuesta: Respuesta }
  | { tipo: 'ir'; indice: number }
  | { tipo: 'siguiente' }
  | { tipo: 'anterior' }
  | { tipo: 'marcar'; id: string }
  | { tipo: 'revisar' }
  | { tipo: 'volver'; indice?: number }
  | { tipo: 'entregar'; ahora: number }
  | { tipo: 'tiempo-agotado'; ahora: number };

/** Generador determinista (mulberry32): la misma semilla elige y ordena las mismas preguntas. */
export function aleatorio(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function elegirPreguntas(banco: readonly Pregunta[], c: Pick<ConfigSimulacro, 'temas' | 'cantidad' | 'dificultades' | 'tipos' | 'semilla'>): string[] {
  const candidatas = banco.filter(
    (p) => (c.temas.length === 0 || c.temas.includes(p.tema)) && (c.dificultades.length === 0 || c.dificultades.includes(p.dificultad)) && (c.tipos.length === 0 || c.tipos.includes(p.tipo)),
  );
  const azar = aleatorio(c.semilla);
  const mezcladas = candidatas.map((p) => ({ p, k: azar() })).sort((x, y) => x.k - y.k);
  return mezcladas.slice(0, Math.max(0, c.cantidad)).map((x) => x.p.id);
}

export function iniciarSimulacro(banco: readonly Pregunta[], config: ConfigSimulacro, ahora: number): EstadoSimulacro | null {
  const preguntas = elegirPreguntas(banco, config);
  if (preguntas.length === 0) return null;
  return { config, preguntas, actual: 0, respuestas: {}, marcadas: [], fase: 'en-curso', inicio: ahora, fin: null, porTiempo: false };
}

export function reducirSimulacro(e: EstadoSimulacro, a: AccionSimulacro): EstadoSimulacro {
  if (e.fase === 'entregado') return e;
  const total = e.preguntas.length;
  switch (a.tipo) {
    case 'responder':
      if (e.fase !== 'en-curso' || !e.preguntas.includes(a.id)) return e;
      return { ...e, respuestas: { ...e.respuestas, [a.id]: a.respuesta } };
    case 'ir':
      return a.indice >= 0 && a.indice < total ? { ...e, actual: a.indice, fase: 'en-curso' } : e;
    case 'siguiente':
      return e.actual < total - 1 ? { ...e, actual: e.actual + 1 } : { ...e, fase: 'resumen' };
    case 'anterior':
      return e.actual > 0 ? { ...e, actual: e.actual - 1 } : e;
    case 'marcar':
      if (!e.preguntas.includes(a.id)) return e;
      return { ...e, marcadas: e.marcadas.includes(a.id) ? e.marcadas.filter((x) => x !== a.id) : [...e.marcadas, a.id] };
    case 'revisar':
      return { ...e, fase: 'resumen' };
    case 'volver':
      return { ...e, fase: 'en-curso', actual: a.indice !== undefined && a.indice >= 0 && a.indice < total ? a.indice : e.actual };
    case 'entregar':
      return { ...e, fase: 'entregado', fin: a.ahora };
    case 'tiempo-agotado':
      return { ...e, fase: 'entregado', fin: a.ahora, porTiempo: true };
  }
}

export const pendientes = (e: EstadoSimulacro) => e.preguntas.filter((id) => !respondida(e.respuestas[id]));
export const msRestantes = (e: EstadoSimulacro, ahora: number) => (e.config.minutos ? Math.max(0, e.inicio + e.config.minutos * 60_000 - ahora) : null);

export type ResultadoPregunta = { id: string; tema: string; correccion: Correccion };
export type Resultados = {
  total: number;
  respondidas: number;
  correctas: number;
  incorrectas: number;
  parciales: number;
  pendientes: number;
  sinResponder: number;
  /** Proporción sobre las preguntas con corrección automática (null si no hay ninguna). */
  puntaje: number | null;
  conCorreccionAutomatica: number;
  tiempoMs: number | null;
  porTema: Array<{ tema: string; total: number; correctas: number; incorrectas: number; pendientes: number; puntaje: number | null }>;
  detalle: ResultadoPregunta[];
};

export function resultados(banco: readonly Pregunta[], ids: readonly string[], respuestas: Readonly<Record<string, Respuesta>>, tiempoMs: number | null = null): Resultados {
  const detalle: ResultadoPregunta[] = [];
  for (const id of ids) {
    const p = banco.find((x) => x.id === id);
    if (p) detalle.push({ id, tema: p.tema, correccion: corregir(p, respuestas[id]) });
  }
  const cuenta = (s: string) => detalle.filter((d) => d.correccion.estado === s).length;
  const conPuntaje = detalle.filter((d) => d.correccion.puntaje !== null && d.correccion.estado !== 'pendiente');
  const suma = conPuntaje.reduce((a, d) => a + (d.correccion.puntaje ?? 0), 0);
  const temas = [...new Set(detalle.map((d) => d.tema))];
  return {
    total: detalle.length,
    respondidas: detalle.filter((d) => d.correccion.estado !== 'sin-responder').length,
    correctas: cuenta('correcta'),
    incorrectas: cuenta('incorrecta') + cuenta('invalida'),
    parciales: cuenta('parcial'),
    pendientes: cuenta('pendiente'),
    sinResponder: cuenta('sin-responder'),
    puntaje: conPuntaje.length ? suma / conPuntaje.length : null,
    conCorreccionAutomatica: conPuntaje.length,
    tiempoMs,
    porTema: temas.map((tema) => {
      const d = detalle.filter((x) => x.tema === tema);
      const auto = d.filter((x) => x.correccion.puntaje !== null && x.correccion.estado !== 'pendiente');
      return {
        tema,
        total: d.length,
        correctas: d.filter((x) => x.correccion.estado === 'correcta').length,
        incorrectas: d.filter((x) => ['incorrecta', 'invalida'].includes(x.correccion.estado)).length,
        pendientes: d.filter((x) => x.correccion.estado === 'pendiente').length,
        puntaje: auto.length ? auto.reduce((a, x) => a + (x.correccion.puntaje ?? 0), 0) / auto.length : null,
      };
    }),
    detalle,
  };
}
