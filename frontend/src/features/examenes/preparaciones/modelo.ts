/**
 * Modelo de una preparación de examen en la interfaz y su correspondencia con la API.
 *
 * - Contrato propuesto (diseño de API, sección 12.2): varias preparaciones por cuenta (`/preparaciones`).
 * - Backend actual (M3, `evaluaciones-aprendizaje`): UNA preparación vigente por cuenta (`/preparacion/*`). Crear otra
 *   abandona la anterior. No guarda nombre ni asignatura: la asignatura viaja como `areaCodigo` (código sin tildes)
 *   y el nombre del examen no se conserva. La interfaz lo dice; no se simula lo que el servidor no guarda.
 */
export type Fuente = 'PERSONAL' | 'FUENTES';
export type ActividadApi = {
  id: string;
  orden: number;
  areaCodigo: string;
  temaCodigo: string;
  titulo: string;
  tipo: 'LECCION' | 'PRACTICA' | 'SIMULACRO' | 'REPASO';
  fechaLimite: string | null;
  minutosEstimados: number;
  estado: 'PENDIENTE' | 'COMPLETADA' | 'OMITIDA';
  completadaEn: string | null;
};
export type PreparacionUnicaApi = {
  objetivo: { id: string; fuente: Fuente; fechaObjetivo: string | null; minutosSemanales: number };
  plan: { id: string; version: number; reglaVersion: string; actividades: ActividadApi[] };
};
export type PreparacionMultipleApi = {
  id: string;
  nombre: string;
  asignatura: string;
  fechaExamen: string | null;
  carpetaId: string | null;
  estado: 'ACTIVA' | 'ARCHIVADA';
  avance: { completadas: number; total: number };
};

export type OrigenTema = 'persona' | 'fuentes' | 'tutor';
export type TemaVista = { codigo: string; titulo: string; origen: OrigenTema };
export type ModoBackend = 'multiple' | 'unica' | 'ejemplo';
export type PreparacionVista = {
  id: string;
  modo: ModoBackend;
  nombre: string | null;
  asignatura: string | null;
  fechaExamen: string | null;
  minutosSemanales: number | null;
  fuente: Fuente;
  temas: TemaVista[];
  actividades: ActividadApi[];
  avance: { completadas: number; total: number };
  archivada: boolean;
  reglaPlan: string | null;
};

export const MAX_TEMAS_UNICA = 10;
export const MAX_TEMAS_MULTIPLE = 30;
export const MINUTOS_REFERENCIA = 180;
const PREFIJOS = /^(Estudiar|Practicar|Simulacro|Repasar):\s*/;

/** Código de área a partir de la asignatura: mayúsculas sin tildes, guiones y hasta 60 caracteres. */
export function codigoArea(asignatura: string): string {
  const c = asignatura
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return /^[A-Z0-9]/.test(c) ? c : 'GENERAL';
}

/** Asignatura legible desde el código (sin las tildes que el servidor no conserva). */
export function asignaturaDeCodigo(codigo: string): string | null {
  if (!codigo || codigo === 'GENERAL') return null;
  const t = codigo.toLowerCase().replace(/[-_]+/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export const temaDeActividad = (titulo: string) => titulo.replace(PREFIJOS, '').trim();

/** Vista de la preparación vigente del backend actual (una por cuenta). */
export function desdePlanUnico(p: PreparacionUnicaApi): PreparacionVista {
  const actividades = [...p.plan.actividades].sort((a, b) => a.orden - b.orden);
  const temas: TemaVista[] = [];
  for (const a of actividades) if (!temas.some((t) => t.codigo === a.temaCodigo)) temas.push({ codigo: a.temaCodigo, titulo: temaDeActividad(a.titulo), origen: 'persona' });
  const area = actividades[0]?.areaCodigo ?? '';
  return {
    id: p.objetivo.id,
    modo: 'unica',
    nombre: null,
    asignatura: asignaturaDeCodigo(area),
    fechaExamen: p.objetivo.fechaObjetivo,
    minutosSemanales: p.objetivo.minutosSemanales,
    fuente: p.objetivo.fuente,
    temas,
    actividades,
    avance: { completadas: actividades.filter((a) => a.estado === 'COMPLETADA').length, total: actividades.length },
    archivada: false,
    reglaPlan: p.plan.reglaVersion,
  };
}

/** Vista de un elemento de la lista del contrato propuesto (sin temario ni plan hasta abrir su detalle). */
export function desdeListaMultiple(p: PreparacionMultipleApi): PreparacionVista {
  return {
    id: p.id,
    modo: 'multiple',
    nombre: p.nombre,
    asignatura: p.asignatura,
    fechaExamen: p.fechaExamen,
    minutosSemanales: null,
    fuente: 'PERSONAL',
    temas: [],
    actividades: [],
    avance: p.avance,
    archivada: p.estado === 'ARCHIVADA',
    reglaPlan: null,
  };
}

export const hoyIso = (ahora = new Date()) => {
  const d = new Date(ahora.getTime() - ahora.getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 10);
};

/** Días entre hoy y la fecha (positivo si es futura). */
export function diasRestantes(fecha: string, hoy: string): number {
  return Math.round((Date.parse(`${fecha}T00:00:00Z`) - Date.parse(`${hoy}T00:00:00Z`)) / 86_400_000);
}

export type EstadoPreparacion = 'activa' | 'proxima' | 'completada' | 'archivada';
/** Estado para filtrar: archivada, completada (todo el plan hecho), próxima (examen en 14 días o menos) o activa. */
export function estadoPreparacion(p: PreparacionVista, hoy: string): EstadoPreparacion {
  if (p.archivada) return 'archivada';
  if (p.avance.total > 0 && p.avance.completadas === p.avance.total) return 'completada';
  if (p.fechaExamen) {
    const d = diasRestantes(p.fechaExamen, hoy);
    if (d >= 0 && d <= 14) return 'proxima';
  }
  return 'activa';
}

export const siguienteActividad = (p: PreparacionVista) => p.actividades.find((a) => a.estado === 'PENDIENTE') ?? null;
export const tituloPreparacion = (p: Pick<PreparacionVista, 'nombre' | 'asignatura'>) => p.nombre ?? (p.asignatura ? `Examen de ${p.asignatura.toLowerCase()}` : 'Preparación de examen');

/** Fecha opcional del examen: vacía es válida; si existe, debe ser una fecha real posterior a hoy. */
export function validarFecha(fecha: string | null | undefined, hoy: string): string | null {
  if (!fecha) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return 'Escribe la fecha como AAAA-MM-DD.';
  const d = new Date(`${fecha}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== fecha) return 'Esa fecha no existe.';
  if (diasRestantes(fecha, hoy) < 1) return 'La fecha del examen debe ser posterior a hoy.';
  return null;
}

export type Borrador = {
  nombre: string;
  asignatura: string;
  temas: TemaVista[];
  fechaExamen: string;
  minutosSemanales: number | null;
  previos: 'nada' | 'algo' | 'bastante' | null;
  objetivo: 'aprobar' | 'comprender' | 'repasar' | null;
  fuentes: string[];
  carpetaId: string | null;
};
export type ErroresBorrador = Partial<Record<'asignatura' | 'temas' | 'fechaExamen' | 'minutosSemanales' | 'fuentes', string>>;

/** Validación del borrador: solo la asignatura y un tema son obligatorios; lo demás es opcional. */
export function validarBorrador(b: Borrador, hoy: string, modo: ModoBackend): ErroresBorrador {
  const e: ErroresBorrador = {};
  if (!b.asignatura.trim()) e.asignatura = 'Escribe la asignatura o el tema general del examen.';
  const temas = b.temas.filter((t) => t.titulo.trim());
  if (temas.length === 0) e.temas = 'Agrega al menos un tema que entre en el examen.';
  else if (modo === 'unica' && temas.length > MAX_TEMAS_UNICA) e.temas = `Por ahora el servidor acepta hasta ${MAX_TEMAS_UNICA} temas por preparación.`;
  else if (temas.some((t) => t.titulo.trim().length > 160)) e.temas = 'Cada tema puede tener hasta 160 caracteres.';
  const f = validarFecha(b.fechaExamen, hoy);
  if (f) e.fechaExamen = f;
  if (b.minutosSemanales !== null && (b.minutosSemanales < 15 || b.minutosSemanales > 1680)) e.minutosSemanales = 'Indica entre 15 minutos y 28 horas por semana.';
  if (b.fuentes.length > 10) e.fuentes = 'Elige hasta 10 fuentes.';
  return e;
}

/** Cuerpo para el backend actual (`POST /preparacion/objetivos`). */
export function solicitudObjetivo(b: Borrador, maximo = MAX_TEMAS_UNICA) {
  const area = codigoArea(b.asignatura);
  return {
    fuente: b.fuentes.length > 0 ? ('FUENTES' as const) : ('PERSONAL' as const),
    ...(b.fechaExamen ? { fechaObjetivo: b.fechaExamen } : {}),
    minutosSemanales: b.minutosSemanales ?? MINUTOS_REFERENCIA,
    temas: b.temas
      .filter((t) => t.titulo.trim())
      .slice(0, maximo)
      .map((t, k) => ({ areaCodigo: area, temaCodigo: `T${String(k + 1).padStart(2, '0')}`, titulo: t.titulo.trim().slice(0, 160) })),
    fuentes: b.fuentes,
  };
}

/** Cuerpo para el contrato propuesto (`POST /preparaciones`, sección 12.2). */
export function solicitudPreparacion(b: Borrador) {
  return {
    nombre: b.nombre.trim() || `Examen de ${b.asignatura.trim()}`,
    asignatura: b.asignatura.trim(),
    ...(b.fechaExamen ? { fechaExamen: b.fechaExamen } : {}),
    ...(b.carpetaId ? { carpetaId: b.carpetaId } : {}),
    // Varias preparaciones (12.2): el servidor admite hasta 30 temas por preparación.
    ...solicitudObjetivo(b, MAX_TEMAS_MULTIPLE),
  };
}
