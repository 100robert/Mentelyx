import type { Respuesta } from '@mentelyx/contratos/educacion/pregunta-corregir';
import type { Pregunta } from '@mentelyx/contratos/educacion/pregunta-esquema';
import { ErrorAplicacion } from '../../../shared/errores';
import type { Calificacion, Calificacion4, ModoIntento, Proyeccion } from './evaluacion';

export type TemaPreparacion = {
  areaCodigo: string;
  temaCodigo: string;
  titulo: string;
};

export type FuentePreparacion = {
  contentId: string;
  version: number;
  titulo: string;
};

export type PlanPreparacionEntrada = {
  actorId: string;
  operationKey: string;
  fuente: 'PERSONAL' | 'FUENTES';
  fechaObjetivo?: string | undefined;
  minutosSemanales: number;
  temas: TemaPreparacion[];
  fuentes: FuentePreparacion[];
  ahora: Date;
  /** V1 (API 12.2): nombre y asignatura; nulos en el alias `/preparacion/*`. */
  nombre?: string | undefined;
  asignatura?: string | undefined;
};

export type ActividadPreparacion = {
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

export type PreparacionActual = {
  objetivo: {
    id: string;
    fuente: 'PERSONAL' | 'FUENTES';
    fechaObjetivo: string | null;
    minutosSemanales: number;
  };
  plan: {
    id: string;
    version: number;
    reglaVersion: string;
    actividades: ActividadPreparacion[];
  };
};

/** Elemento de `GET /preparaciones` (API 12.2). `carpetaId` lo aporta M2 (organización). */
export type PreparacionResumen = {
  id: string;
  nombre: string;
  asignatura: string;
  fechaExamen: string | null;
  estado: 'ACTIVA' | 'ARCHIVADA';
  minutosSemanales: number;
  fuente: 'PERSONAL' | 'FUENTES';
  avance: { completadas: number; total: number };
  creadaEn: string;
};

export type FuentesAutorizadasPort = (
  actorId: string,
  filtro: { contentIds: string[] },
) => Promise<Array<{ contentId: string; version: number; titulo: string }>>;

export interface PreparacionRepositorio {
  crearObjetivo(entrada: PlanPreparacionEntrada, hash: string): Promise<{ resultado: PreparacionActual; repetida: boolean }>;
  /** Alias de transición: la preparación ACTIVO más reciente. */
  obtenerPlanVigente(actorId: string): Promise<PreparacionActual | null>;
  completarActividad(actorId: string, actividadId: string, completadaEn: Date): Promise<ActividadPreparacion>;
  listar(actorId: string): Promise<PreparacionResumen[]>;
  resumen(actorId: string, preparacionId: string): Promise<PreparacionResumen | null>;
  plan(actorId: string, preparacionId: string): Promise<PreparacionActual | null>;
  /** Rehace el plan (versión + 1) conservando el estado de las actividades de los temas que siguen. */
  reemplazarTemario(actorId: string, preparacionId: string, temas: TemaPreparacion[], ahora: Date): Promise<PreparacionActual>;
  archivar(actorId: string, preparacionId: string, archivada: boolean, ahora: Date): Promise<PreparacionResumen>;
}

/** Banco de preguntas versionado e inmutable por versión (MongoDB M3, persistencia 4.2 y 13). */
export type VersionBanco = { version: number; preguntas: Pregunta[]; creadaEn: Date; operationKey: string | null };
export interface BancoPreguntasPort {
  ultima(ownerUserId: string, preparacionId: string): Promise<VersionBanco | null>;
  version(ownerUserId: string, preparacionId: string, version: number): Promise<VersionBanco | null>;
  porClave(ownerUserId: string, preparacionId: string, operationKey: string): Promise<VersionBanco | null>;
  /** Inserta la versión `base + 1`; `CONFLICTO` si otra escritura la creó antes (índice único). */
  publicar(ownerUserId: string, preparacionId: string, base: number, preguntas: Pregunta[], operationKey: string): Promise<'OK' | 'CONFLICTO'>;
}

export type IntentoGuardado = {
  id: string;
  preparacionId: string;
  modo: ModoIntento;
  versionBanco: number;
  preguntaIds: string[];
  proyeccion: Proyeccion;
  estado: 'EN_CURSO' | 'CALIFICADO';
  iniciadoEn: Date;
  venceEn: Date | null;
  entregadoEn: Date | null;
  fueraDeTiempo: boolean | null;
  puntaje: number | null;
  maximo: number | null;
  pendientes: number | null;
  resultados: Calificacion | null;
  operationKey: string;
  requestHash: string;
  claveEntrega: string | null;
};
export type RespuestaGuardada = { preguntaId: string; respuesta: Respuesta; revision: number; comprobada: boolean };

export interface IntentosRepositorio {
  crear(i: Omit<IntentoGuardado, 'id' | 'estado' | 'entregadoEn' | 'fueraDeTiempo' | 'puntaje' | 'maximo' | 'pendientes' | 'resultados' | 'claveEntrega'> & { estudianteId: string; id?: string }): Promise<{ intento: IntentoGuardado; repetido: boolean }>;
  obtener(estudianteId: string, intentoId: string): Promise<IntentoGuardado | null>;
  listar(estudianteId: string, preparacionId: string): Promise<IntentoGuardado[]>;
  respuestas(intentoId: string): Promise<RespuestaGuardada[]>;
  /** Guarda la última respuesta (revisión + 1) solo si el intento sigue EN_CURSO. */
  guardarRespuesta(intentoId: string, preguntaId: string, respuesta: Respuesta, comprobada: boolean, ahora: Date): Promise<RespuestaGuardada | 'CERRADO'>;
  /** Calificación única: EN_CURSO → CALIFICADO en una sola sentencia condicional (sin resultados duplicados). */
  calificar(intentoId: string, claveEntrega: string, c: { entregadoEn: Date; fueraDeTiempo: boolean; calificacion: Calificacion; version: string }): Promise<'OK' | 'YA_CALIFICADO'>;
}

export type Tarjeta = {
  id: string;
  preparacionId: string;
  tema: string | null;
  anverso: string;
  reverso: string;
  origen: 'persona' | 'tutor' | 'material';
  proximaEn: Date;
  intervaloDias: number;
  facilidad: number;
  repeticiones: number;
};
export interface TarjetasRepositorio {
  crear(estudianteId: string, preparacionId: string, operationKey: string, t: Pick<Tarjeta, 'tema' | 'anverso' | 'reverso' | 'origen'>, ahora: Date): Promise<{ tarjeta: Tarjeta; repetida: boolean }>;
  listar(estudianteId: string, preparacionId: string): Promise<Tarjeta[]>;
  revisar(estudianteId: string, tarjetaId: string, operationKey: string, calificacion: Calificacion4, ahora: Date): Promise<{ tarjeta: Tarjeta; repetida: boolean } | null>;
}

export function exigirFuentesSolicitadas(
  solicitadas: readonly string[],
  autorizadas: readonly FuentePreparacion[],
): FuentePreparacion[] {
  const porId = new Map(autorizadas.map((fuente) => [fuente.contentId, fuente]));
  const resultado = solicitadas.map((id) => porId.get(id));
  if (resultado.some((fuente) => fuente === undefined)) {
    throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Una o más fuentes no están disponibles para esta cuenta.');
  }
  return resultado.filter((fuente): fuente is FuentePreparacion => fuente !== undefined);
}
