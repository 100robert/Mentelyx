/**
 * M6 · Tutor IA y RAG. Reglas puras y puertos (sin SQL, SDK ni frameworks).
 * Sprint 03: rutas de Workers AI (Gemma 4 para `explicacion.general`, ADR-077) detrás de `ProveedorIaPort`,
 * recuperación híbrida BGE-M3 + texto con RRF (ADR-076) y modo solo léxico como degradación.
 */
export type RecursoConsulta = 'CONSULTA_GENERAL' | 'CONSULTA_TECNICA';

/** Cotas presupuestarias de diseño por operación (IM, sección 18.1), en USD. No son mediciones reales. */
export const PRESUPUESTO_OPERACION_USD: Record<RecursoConsulta, number> = { CONSULTA_GENERAL: 0.001, CONSULTA_TECNICA: 0.006 };

const TECNICO =
  /(\d\s*[-+*/^=]\s*\d)|\b(ecuaci|derivad|integral|l[ií]mite|velocidad|aceleraci|fuerza|energ[ií]a|f[oó]rmula|calcul|resuelv|demuestr|[aá]lgebra|trigonom|logaritm|matriz|vector|f[ií]sica|qu[ií]mica|estequiometr|probabilidad|programa|algoritmo|c[oó]digo)/i;

/**
 * Clasificador provisional del MVP (ClasificadorConsultaPort, diseño interno, sección 8.5). La categoría la decide el
 * servidor, nunca el cliente. El clasificador definitivo de I-2 se valida con el conjunto de evaluación del Tutor.
 */
export const clasificarConsulta = (pregunta: string): RecursoConsulta => (TECNICO.test(pregunta) ? 'CONSULTA_TECNICA' : 'CONSULTA_GENERAL');

/** Señal heurística de inyección de instrucciones en una fuente (RAG-SEC): el fragmento marcado no se recupera. */
const INYECCION = /(ignora|olvida|omite)\s+(todas\s+)?(las\s+)?(instrucciones|indicaciones|reglas)|ignore\s+(all\s+)?(previous\s+)?instructions|system\s*prompt/i;
export const tieneSenalInyeccion = (texto: string): boolean => INYECCION.test(texto);

export const CHUNKER_VERSION = 'parrafos-v1';
const MAX_CARACTERES = 1200;

/**
 * Fragmenta por párrafos y agrupa hasta ~1200 caracteres; un párrafo largo se corta por oraciones. Un párrafo con
 * señal de inyección nunca se mezcla con otros: queda en su propio fragmento, que es el único que se excluye.
 */
export function fragmentar(texto: string, aislar: (parrafo: string) => boolean = tieneSenalInyeccion): string[] {
  const parrafos = texto
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  const piezas: Array<{ texto: string; aislada: boolean }> = [];
  for (const p of parrafos) {
    const aislada = aislar(p);
    if (p.length <= MAX_CARACTERES) piezas.push({ texto: p, aislada });
    else {
      let actual = '';
      for (const oracion of p.split(/(?<=[.!?])\s+/)) {
        if ((actual + ' ' + oracion).trim().length > MAX_CARACTERES && actual) {
          piezas.push({ texto: actual.trim(), aislada });
          actual = '';
        }
        actual += ' ' + oracion;
      }
      if (actual.trim()) piezas.push({ texto: actual.trim().slice(0, MAX_CARACTERES * 2), aislada });
    }
  }
  const fragmentos: string[] = [];
  let acumulado = '';
  const cerrar = () => {
    if (acumulado) fragmentos.push(acumulado);
    acumulado = '';
  };
  for (const pieza of piezas) {
    if (pieza.aislada) {
      cerrar();
      fragmentos.push(pieza.texto);
      continue;
    }
    if (acumulado && acumulado.length + pieza.texto.length + 2 > MAX_CARACTERES) cerrar();
    acumulado = acumulado ? `${acumulado}\n\n${pieza.texto}` : pieza.texto;
  }
  cerrar();
  return fragmentos;
}

/** Heurística para español (RAG, sección 7.1; orquestación, sección 10.4): `ceil(caracteres / 3,5)`. Calibrar. */
export const estimarTokens = (texto: string): number => Math.ceil(texto.length / 3.5);

// Rutas, costos y presupuesto por operación (orquestación, secciones 5.11, 10.4 y 16)

export type IdRuta = 'explicacion.general' | 'explicacion.tecnica';
export type PrecioRuta = { entradaUsdPorM: number; salidaUsdPorM: number; verificado: string };
export type RutaIa = {
  id: IdRuta;
  version: string;
  proveedor: string;
  modelo: string;
  etiqueta: string;
  maxTokensSalida: number;
  precio: PrecioRuta;
  /** Aviso visible cuando la ruta es un *fallback* (p. ej. técnica atendida por el modelo general). */
  aviso?: string;
};

/** Política técnica de M6 por categoría (orquestación, sección 10.2, bloque `tecnico`). */
export type PoliticaTecnica = { presupuestoOperacionUsd: number; maxTokensEntrada: number; maxTokensSalida: number };

/**
 * Costo con la tarifa de la ruta. `tokens × USD por millón` son micro-dólares; se redondea HACIA ARRIBA al
 * micro-dólar (numeric(18,6)) para no subestimar nunca. Ej.: 6000 × 0,10 + 4000 × 0,30 = 1800 µUSD = 0,0018.
 */
export const costoUsd = (precio: Pick<PrecioRuta, 'entradaUsdPorM' | 'salidaUsdPorM'>, tokensEntrada: number, tokensSalida: number): number =>
  Math.ceil(tokensEntrada * precio.entradaUsdPorM + tokensSalida * precio.salidaUsdPorM - 1e-9) / 1e6 || 0;

export type MensajeHistorial = { role: 'user' | 'assistant'; text: string };
/** `pregunta` e `historial` llegan YA redactados (sección 4.3). `pista`: modo PISTA (guía sin resolver). */
export type SolicitudIa = { ruta: RutaIa; pregunta: string; historial: MensajeHistorial[]; fragmentos: Fragmento[]; maxTokensSalida: number; pista?: boolean };

/**
 * Estimación previa y ajuste al presupuesto por operación (orquestación, sección 10.4):
 *   costoEst = tokensEntradaEst × precioEntrada + tokensSalidaMax × precioSalida
 *   si excede: 1) contexto RAG a la mitad (mínimo 2 fragmentos); 2) ruta estándar equivalente; 3) no admitir.
 * `tokensSalidaMax = min(política, ruta)`. Devuelve `undefined` si ninguna variante cabe (→ 429).
 */
export function ajustarAlPresupuesto(
  s: Omit<SolicitudIa, 'maxTokensSalida'>,
  politica: PoliticaTecnica,
  estimarEntrada: (s: SolicitudIa) => number,
  rutaEstandar?: RutaIa,
): { solicitud: SolicitudIa; estimadoUsd: number; tokensEntradaEst: number } | undefined {
  const evaluar = (ruta: RutaIa, fragmentos: Fragmento[]) => {
    const solicitud: SolicitudIa = { ...s, ruta, fragmentos, maxTokensSalida: Math.min(politica.maxTokensSalida, ruta.maxTokensSalida) };
    const tokensEntradaEst = estimarEntrada(solicitud);
    const estimadoUsd = costoUsd(ruta.precio, tokensEntradaEst, solicitud.maxTokensSalida);
    const cabe = tokensEntradaEst <= politica.maxTokensEntrada && estimadoUsd <= politica.presupuestoOperacionUsd;
    return cabe ? { solicitud, estimadoUsd, tokensEntradaEst } : undefined;
  };
  const mitad = s.fragmentos.slice(0, Math.max(2, Math.ceil(s.fragmentos.length / 2)));
  return (
    evaluar(s.ruta, s.fragmentos) ??
    (mitad.length < s.fragmentos.length ? evaluar(s.ruta, mitad) : undefined) ??
    (rutaEstandar && rutaEstandar.id !== s.ruta.id ? evaluar(rutaEstandar, mitad) : undefined)
  );
}

/**
 * Empaquetado del contexto (RAG, sección 10.4, punto 3): fragmentos en orden de relevancia hasta
 * `presupuestoContexto = min(0,5 × maxTokensEntrada, 6000)` tokens.
 */
export function empaquetarContexto(fragmentos: Fragmento[], maxTokensEntrada: number): Fragmento[] {
  const presupuesto = Math.min(0.5 * maxTokensEntrada, 6000);
  const elegidos: Fragmento[] = [];
  let usados = 0;
  for (const f of fragmentos) {
    const t = estimarTokens(f.texto);
    if (usados + t > presupuesto) break;
    elegidos.push(f);
    usados += t;
  }
  return elegidos;
}

/**
 * Citas (RAG, sección 12; orquestación, sección 12.2): el modelo cita con `[[cN]]`. Cada marcador válido
 * (1 ≤ N ≤ total) se sustituye por `[N]`; los inválidos se eliminan. Devuelve también los índices citados.
 */
export function normalizarCitas(markdown: string, total: number): { markdown: string; citados: number[] } {
  const citados = new Set<number>();
  const limpio = markdown.replace(/\[\[\s*c(\d{1,3})\s*\]\]/gi, (_m, n: string) => {
    const i = Number(n);
    if (i >= 1 && i <= total) {
      citados.add(i);
      return `[${i}]`;
    }
    return '';
  });
  return { markdown: limpio.replace(/[ \t]+([.,;:])/g, '$1'), citados: [...citados].sort((a, b) => a - b) };
}

const literalRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Redacción determinista de datos personales antes de toda llamada a un proveedor (orquestación, sección 4.3).
 * El texto original solo se guarda en la conversación del propio usuario.
 */
export function redactarDatosPersonales(texto: string, perfil: { nombre?: string | undefined; correo?: string | undefined } = {}): string {
  let r = texto;
  if (perfil.correo) r = r.replace(new RegExp(literalRegex(perfil.correo), 'gi'), '[CORREO]');
  const nombre = perfil.nombre?.trim();
  if (nombre && nombre.length >= 3) r = r.replace(new RegExp(`(?<![\\p{L}])${literalRegex(nombre)}(?![\\p{L}])`, 'giu'), '[NOMBRE]');
  return r
    .replace(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.\p{L}{2,}/gu, '[CORREO]')
    .replace(/(?<!\d)(?:\+?51[\s-]?)?9\d{2}[\s-]?\d{3}[\s-]?\d{3}(?!\d)/g, '[TELEFONO]')
    .replace(/\b(DNI|documento(?:\s+de\s+identidad)?|carn[eé]\s+de\s+extranjer[ií]a)(\s*(?:n[°º.]?|número|es|:)?\s*)\d{8,9}(?!\d)/gi, '$1$2[DOCUMENTO]')
    .replace(/\bhttps?:\/\/[^\s?#]+\?[^\s#]+/gi, (url) => `${url.split('?')[0]}?[PARAMETROS]`);
}

export const sumarDias = (instante: Date, dias: number): Date => new Date(instante.getTime() + dias * 86_400_000);

// Puertos

/** `similitud`: coseno con la pregunta (rama vectorial); `null` si el fragmento solo apareció en la rama léxica. */
export type Fragmento = { chunkId: string; documentId: string; version: number; titulo: string; texto: string; rango: number; similitud?: number | null };

export type EstadoRespuesta = 'RESPONDIDA' | 'SIN_CONTEXTO' | 'PARCIAL';

export type MensajeGuardado = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  operationKey: string;
  citations?: unknown[];
  /** Solo en respuestas: ruta y avisos con los que se generó (un reintento se reconstruye sin otra inferencia). */
  meta?: { recurso: RecursoConsulta; ruta: IdRuta; proveedor: string; modelo: string; etiqueta: string; avisos: string[]; estado: EstadoRespuesta };
  /** Bloques `mentelyx.bloque/v1` y acciones ya validados en el servidor (API, 12.4); se guardan con el mensaje. */
  blocks?: unknown[];
  actions?: unknown[];
  createdAt: Date;
};

export type ConversacionGuardada = {
  conversationId: string;
  ownerUserId: string;
  titulo: string;
  espacioId: string | null;
  /** API 12.9: sesión de estudio de un tema de una preparación de examen (M3). */
  preparacionId?: string | null;
  temaId?: string | null;
  messages: MensajeGuardado[];
  createdAt: Date;
  updatedAt: Date;
  expiraEn: Date;
  revision: number;
};

/** Estado guardado de la sesión (API 12.5): mismo documento y misma retención que la conversación. */
export type EstadoSesionGuardado = { version: number; interaccion: Record<string, unknown>; anotaciones: unknown[]; bloquesPropios?: unknown[]; actualizadoEn: Date };

export interface ConversacionesPort {
  crear(c: { conversationId: string; ownerUserId: string; titulo: string; espacioId: string | null; preparacionId?: string | null; temaId?: string | null; ahora: Date; expiraEn: Date }): Promise<ConversacionGuardada>;
  listar(ownerUserId: string, ahora: Date, filtro?: { preparacionId?: string }): Promise<Array<Omit<ConversacionGuardada, 'messages'> & { mensajes: number }>>;
  resumenes(ownerUserId: string, ids: string[], ahora: Date): Promise<Array<{ id: string; titulo: string; actualizadoEn: Date }>>;
  obtenerEstado(ownerUserId: string, conversationId: string, ahora: Date): Promise<EstadoSesionGuardado | null | undefined>;
  /** CAS por versión: `CONFLICTO` si otra pestaña guardó antes; `NO_ENCONTRADA` si no es del actor o venció. */
  guardarEstado(ownerUserId: string, conversationId: string, versionEsperada: number, estado: Omit<EstadoSesionGuardado, 'version' | 'actualizadoEn'>, ahora: Date): Promise<EstadoSesionGuardado | 'CONFLICTO' | 'NO_ENCONTRADA'>;
  obtener(ownerUserId: string, conversationId: string, ahora: Date): Promise<ConversacionGuardada | undefined>;
  /** Añade pregunta y respuesta una sola vez por operationKey (condición en el filtro); renueva la retención. */
  agregarIntercambio(ownerUserId: string, conversationId: string, mensajes: MensajeGuardado[], ahora: Date, expiraEn: Date): Promise<'AGREGADO' | 'YA_EXISTIA' | 'NO_ENCONTRADA'>;
  eliminar(ownerUserId: string, conversationId: string): Promise<boolean>;
}

export type OperacionIa = {
  operationKey: string;
  requestHash: string;
  status: 'EN_CURSO' | 'RESPONDIDA' | 'FALLIDA' | 'CANCELADA' | 'INCIERTA' | 'RECHAZADA_CUOTA';
  resultRef: string | null;
};

export interface UsoIaPort {
  buscar(operationKey: string): Promise<OperacionIa | undefined>;
  /** Admisión técnica atómica (presupuesto global y del proveedor) + registro EN_CURSO, en un COMMIT, antes de invocar. */
  admitir(op: {
    operationKey: string;
    requestHash: string;
    userId: string;
    hoy: string;
    recurso: RecursoConsulta;
    ruta: Pick<RutaIa, 'id' | 'version' | 'proveedor' | 'modelo'>;
    estimadoUsd: number;
  }): Promise<void>;
  /**
   * RESPONDIDA/FALLIDA liberan lo reservado y suman el costo real. INCIERTA (CO-10: sin evidencia de no ejecución)
   * deja retenido el estimado y marca `pending_reconciliation` hasta conciliarse.
   */
  finalizar(
    operationKey: string,
    r: { status: 'RESPONDIDA' | 'FALLIDA' | 'INCIERTA'; costoUsd: number; tokensEntrada: number; tokensSalida: number; latenciaMs: number; resultRef: string | null },
  ): Promise<void>;
}

export interface IndiceRagPort {
  /**
   * Solo fragmentos PRIVADOS del propietario, de documentos autorizados por M2, vigentes y sin señal de inyección.
   * Con `vector`: búsqueda híbrida (KNN coseno + texto, fusión RRF, RAG sección 10.2). Sin él: solo léxica (10.3).
   */
  buscar(ownerId: string, documentIds: string[], consulta: { texto: string; vector: number[] | null }, limite: number): Promise<Fragmento[]>;
  estados(documentIds: string[]): Promise<Map<string, 'INDEXANDO' | 'LISTA' | 'FALLIDA'>>;
}

export type RespuestaProveedor = {
  markdown: string;
  tokensEntrada: number;
  tokensSalida: number;
  costoUsd: number;
  latenciaMs: number;
  /** `length`: la salida llegó al tope de tokens (respuesta PARCIAL). */
  finalizacion: 'stop' | 'length' | 'otro';
};

/** Fallo del proveedor. `incierto`: no hay evidencia de que NO se ejecutó (p. ej. timeout), CO-10 → INCIERTA. */
export class FalloProveedorIa extends Error {
  constructor(
    readonly motivo: 'TIMEOUT' | 'RECHAZO' | 'RESPUESTA_INVALIDA',
    readonly incierto: boolean,
    mensaje: string,
  ) {
    super(mensaje);
    this.name = 'FalloProveedorIa';
  }
}

export interface ProveedorIaPort {
  readonly proveedor: string;
  /** Ruta de la categoría y ruta estándar equivalente para el ajuste presupuestario (sección 10.4). */
  rutaPara(recurso: RecursoConsulta): { ruta: RutaIa; estandar: RutaIa };
  /** Tokens de entrada estimados de la solicitud completa: sistema + historial + contexto + pregunta. */
  estimarEntrada(s: SolicitudIa): number;
  responder(s: SolicitudIa): Promise<RespuestaProveedor>;
}

/** Embeddings BGE-M3 (ADR-076). El adaptador comprueba la dimensión real y rechaza el lote si no es 1024. */
export interface EmbeddingsPort {
  readonly modelo: 'bge-m3';
  readonly precioUsdPorM: number;
  embeber(textos: string[]): Promise<{ vectores: number[][]; tokens: number }>;
}

/** Límite de tasa por usuario (orquestación, sección 10.5): 6 consultas por minuto. */
export interface LimiteTasaPort {
  consumir(actorId: string, ahora: Date): Promise<{ permitido: true } | { permitido: false; reintentarEnSeg: number }>;
}

/** API pública de M2 que usa M6 (conectada por app.ts). */
export type FuentesAutorizadasPort = (
  actorId: string,
  filtro: { espacioId?: string | undefined; contentIds?: string[] | undefined },
) => Promise<Array<{ contentId: string; version: number; titulo: string; espacioId: string }>>;

export interface RecursosPlanPort {
  reservarRecursoPlan(cmd: unknown): Promise<{ estado: 'RESERVADO'; disponibles: number; situacion: string; repetida: boolean } | { estado: 'SIN_CUOTA'; disponibles: number }>;
  confirmarRecursoPlan(cmd: unknown): Promise<unknown>;
  liberarRecursoPlan(cmd: unknown): Promise<unknown>;
  consultarDerechosPlan(actorId: string): Promise<{ recursos: Array<{ recurso: string; disponibles: number }> } | null>;
}

export type FragmentoNuevo = { indice: number; texto: string; tokens: number; hash: string; senalInyeccion: boolean; embedding: number[] | null };

export interface IndexadorPort {
  /** Idempotent Receiver: registra el evento en el inbox de M6 y crea índice y fragmentos en la MISMA transacción. */
  indexarUnaVez(e: {
    source: string;
    eventId: string;
    payload: unknown;
    documentId: string;
    version: number;
    ownerId: string;
    titulo: string;
    /** `bge-m3` si todos los fragmentos traen vector; `lexico` si el modelo de embeddings no estuvo disponible. */
    embeddingModel: 'bge-m3' | 'lexico';
    costoUsd: number;
    fragmentos: FragmentoNuevo[];
  }): Promise<'PROCESADO' | 'DUPLICADO'>;
}

/** API pública de M2 para leer el original de una fuente propia (la conecta app.ts). */
export type LeerContenidoPort = (propietarioId: string, contentId: string) => Promise<{ texto: string } | undefined>;
