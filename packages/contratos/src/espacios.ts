import { z } from './zod';

// API, sección 2 (M2, endpoints añadidos el 20/11/2026): espacios privados y fuentes (RF-101, RF-102).
// MVP del Sprint 03: las fuentes TXT y MD llegan en el cuerpo (≤ 200 KB). La URL prefirmada de R2, PDF, DOCX, PPTX,
// imágenes y OCR siguen el contrato completo en I-1.
export const LIMITE_FUENTE_TEXTO_BYTES = 200_000;

export const EstadoEspacio = z.enum(['ACTIVO', 'ARCHIVADO']);
/**
 * PDF (V1, 27/11/2026; API 12.6): el navegador extrae el texto con PDF.js, página por página, y lo envía con marcadores
 * «[Página N]». El servidor lo indexa igual que un TXT (mismo RAG y mismos permisos); el original no se sube y las
 * páginas sin texto (escaneadas) quedan sin indexar porque no hay OCR.
 */
export const FormatoFuenteTexto = z.enum(['TXT', 'MD', 'PDF']);
export const EstadoLectura = z.enum(['PENDIENTE', 'INDEXANDO', 'LISTA', 'FALLIDA']);

export const CrearEspacioRequest = z.strictObject({ titulo: z.string().trim().min(1).max(200) });

export const Espacio = z.strictObject({
  id: z.uuid(),
  titulo: z.string(),
  estado: EstadoEspacio,
  fuentes: z.number().int().nonnegative(),
  almacenamientoBytes: z.number().int().nonnegative(),
  creadoEn: z.iso.datetime({ offset: true }),
});
export type Espacio = z.infer<typeof Espacio>;

export const RegistrarFuenteTextoRequest = z.strictObject({
  titulo: z.string().trim().min(1).max(300),
  formato: FormatoFuenteTexto,
  contenido: z.string().min(1).max(LIMITE_FUENTE_TEXTO_BYTES),
});
export type RegistrarFuenteTextoRequest = z.infer<typeof RegistrarFuenteTextoRequest>;

export const Fuente = z.strictObject({
  contentId: z.uuid(),
  version: z.number().int().positive(),
  titulo: z.string(),
  formato: FormatoFuenteTexto,
  bytes: z.number().int().positive(),
  seleccionada: z.boolean(),
  estadoLectura: EstadoLectura,
  agregadaEn: z.iso.datetime({ offset: true }),
});
export type Fuente = z.infer<typeof Fuente>;

export const EspacioDetalle = Espacio.extend({ listaFuentes: z.array(Fuente) });
export type EspacioDetalle = z.infer<typeof EspacioDetalle>;

export const SeleccionarFuenteRequest = z.strictObject({ seleccionada: z.boolean() });

/** Evento de M2 (outbox) que consume M6 para indexar una fuente privada. Solo identificadores y metadatos. */
export const FuenteRegistrada = z.strictObject({
  contentId: z.uuid(),
  version: z.number().int().positive(),
  propietarioId: z.uuid(),
  espacioId: z.uuid(),
  titulo: z.string(),
  formato: FormatoFuenteTexto,
});
export type FuenteRegistrada = z.infer<typeof FuenteRegistrada>;
