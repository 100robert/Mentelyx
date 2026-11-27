/**
 * M2 · Espacios privados y fuentes (RF-101, RF-102; persistencia, sección 7.9). Reglas puras y puertos, sin SQL ni
 * frameworks. Autorización por recurso: un espacio y sus fuentes solo existen para su propietario; a cualquier otro
 * actor se le responde «no encontrado» para no revelar su existencia.
 */
export type EstadoLectura = 'PENDIENTE' | 'INDEXANDO' | 'LISTA' | 'FALLIDA';
/** PDF = texto extraído en el navegador con marcadores de página (API 12.6); se guarda como texto, no el original. */
export type FormatoTexto = 'TXT' | 'MD' | 'PDF';

export type EspacioRegistro = {
  id: string;
  propietarioId: string;
  titulo: string;
  estado: 'ACTIVO' | 'ARCHIVADO';
  almacenamientoBytes: number;
  fuentes: number;
  creadoEn: string;
};

export type FuenteRegistro = {
  contentId: string;
  version: number;
  titulo: string;
  formato: FormatoTexto;
  bytes: number;
  seleccionada: boolean;
  agregadaEn: string;
  claveObjeto: string;
};

export class RecursoNoEncontrado extends Error {
  constructor(readonly recurso: 'ESPACIO' | 'FUENTE') {
    super(`${recurso === 'ESPACIO' ? 'Espacio' : 'Fuente'} no encontrado.`);
    this.name = 'RecursoNoEncontrado';
  }
}

/** Autorización por recurso: el actor debe ser el propietario. */
export function exigirPropietario<T extends { propietarioId: string }>(recurso: T | undefined, actorId: string, tipo: 'ESPACIO' | 'FUENTE'): T {
  if (!recurso || recurso.propietarioId !== actorId) throw new RecursoNoEncontrado(tipo);
  return recurso;
}

export const bytesUtf8 = (texto: string): number => new TextEncoder().encode(texto).byteLength;

/** Clave del objeto original en R2: aislada por espacio y fuente; nunca contiene datos personales. */
export const claveObjetoFuente = (espacioId: string, contentId: string, version: number, formato: FormatoTexto) =>
  `espacios/${espacioId}/fuentes/${contentId}/v${version}.${formato === 'MD' ? 'md' : formato === 'PDF' ? 'pdf.txt' : 'txt'}`;

// Puertos (diseño interno, sección 2: la aplicación depende de interfaces, no de adaptadores).

export interface EspaciosRepositorio {
  crear(e: { propietarioId: string; titulo: string }): Promise<EspacioRegistro>;
  listar(propietarioId: string): Promise<EspacioRegistro[]>;
  obtener(espacioId: string): Promise<(EspacioRegistro & { listaFuentes: FuenteRegistro[] }) | undefined>;
  buscarFuentePorClave(operationKey: string): Promise<{ contentId: string; espacioId: string } | undefined>;
  /** Una transacción: contenido, versión, vínculo con el espacio, almacenamiento del espacio y evento en el outbox. */
  registrarFuente(f: {
    espacioId: string;
    propietarioId: string;
    contentId: string;
    titulo: string;
    formato: FormatoTexto;
    bytes: number;
    hash: string;
    claveObjeto: string;
    operationKey: string;
  }): Promise<void>;
  seleccionarFuente(espacioId: string, contentId: string, seleccionada: boolean): Promise<boolean>;
  fuentesDelPropietario(propietarioId: string, filtro: { espacioId?: string | undefined; contentIds?: string[] | undefined }): Promise<Array<FuenteRegistro & { espacioId: string }>>;
}

export interface AlmacenObjetosPort {
  guardar(clave: string, contenido: string, tipo: string): Promise<void>;
  leer(clave: string): Promise<string | undefined>;
  eliminar(clave: string): Promise<void>;
}

/** Contratos de M5 que usa M2 (API, sección 2.8); los conecta la composición. */
export interface RecursosPlanPort {
  reservarRecursoPlan(cmd: unknown): Promise<{ estado: 'RESERVADO'; disponibles: number; situacion: string; repetida: boolean } | { estado: 'SIN_CUOTA'; disponibles: number }>;
  confirmarRecursoPlan(cmd: unknown): Promise<unknown>;
  liberarRecursoPlan(cmd: unknown): Promise<unknown>;
}

/** Estado de indexación que publica M6 (solo identificadores). */
export type EstadoLecturaPort = (contentIds: string[]) => Promise<Map<string, EstadoLectura>>;
