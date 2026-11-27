import { Accion } from './educacion/bloque-acciones';
import { Bloque } from './educacion/bloque-esquema';
import { CodigoRecursoPlan } from './recursos';
import { z } from './zod';

/** Bloques y acciones propuestos por el Tutor, ya validados en el servidor con los esquemas del cliente (API, 12.4). */
const BloquesTutor = z.array(Bloque).max(12);
const AccionesTutor = z.array(Accion).max(40);
const RutaIaPublica = z.strictObject({ etiqueta: z.string(), proveedor: z.string(), modelo: z.string().optional() });

// API, secciones 2 (M6) y 4.3. Sprint 03: respuesta JSON (sin SSE), Workers AI (o proveedor simulado en local/CI) y
// recuperación híbrida BGE-M3 + texto (ADR-076; solo léxica como degradación), sobre fuentes privadas del usuario.
export const RETENCION_CONVERSACION_DIAS = 90; // ADR-079

export const CrearConversacionRequest = z.strictObject({
  contexto: z.strictObject({
    superficie: z.enum(['TUTOR', 'LECCION', 'EJERCICIO']),
    espacioId: z.uuid().optional(),
    /** API 12.9: sesión de estudio de un tema de examen (M3 confirma que la preparación es del actor). */
    preparacionId: z.uuid().optional(),
    temaId: z.string().regex(/^[A-Z0-9][A-Z0-9_-]{0,59}$/).optional(),
  }),
  usarApuntes: z.boolean().optional(),
});

/**
 * Estado guardado de una sesión (API 12.5): interacción con los bloques, anotaciones y bloques propios. Se guarda el
 * último estado completo (≤ 64 KB) con control de versión (`If-Match`); la retención es la de la conversación.
 */
const IdBloque = z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/);
export const InteraccionBloque = z.strictObject({
  revelados: z.number().int().min(0).max(20),
  resaltado: IdBloque.nullable(),
  seleccion: IdBloque.nullable(),
  parametros: z.record(z.string().regex(/^[a-z][a-z0-9_]{0,15}$/), z.number().finite()),
  vista: z.record(z.string(), z.unknown()).nullable(),
  referencia: IdBloque.nullable(),
});
export const Anotacion = z.strictObject({
  id: IdBloque,
  bloqueId: IdBloque,
  tipo: z.enum(['RESALTADO', 'NOTA']),
  pagina: z.number().int().min(1).max(5000).optional(),
  rects: z.array(z.strictObject({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), w: z.number().min(0).max(1), h: z.number().min(0).max(1) })).max(40).optional(),
  region: IdBloque.optional(),
  texto: z.string().max(500),
  creadaEn: z.iso.datetime({ offset: true }),
});
export const GuardarEstadoSesionRequest = z.strictObject({
  interaccion: z.record(IdBloque, InteraccionBloque),
  anotaciones: z.array(Anotacion).max(200),
  bloquesPropios: z.array(Bloque).max(20).optional(),
});
export const EstadoSesion = GuardarEstadoSesionRequest.extend({ version: z.number().int().nonnegative(), actualizadoEn: z.iso.datetime({ offset: true }).nullable() });
export type EstadoSesion = z.infer<typeof EstadoSesion>;
export const LIMITE_ESTADO_SESION_BYTES = 64 * 1024;

export const ConsultaTutorRequest = z.strictObject({
  conversacionId: z.uuid(),
  pregunta: z.string().trim().min(1).max(4000),
  fuentes: z
    .strictObject({
      espacioId: z.uuid().optional(),
      contentIds: z.array(z.uuid()).max(20).optional(),
      exclusivas: z.boolean().optional(),
    })
    .optional(),
  modo: z.enum(['AUTO', 'PISTA']).optional(),
});
export type ConsultaTutorRequest = z.infer<typeof ConsultaTutorRequest>;

export const Cita = z.strictObject({
  id: z.string(),
  chunkId: z.uuid(),
  recursoId: z.uuid(),
  version: z.number().int().positive(),
  titulo: z.string(),
  enlace: z.string(),
  fragmento: z.string(),
  tipoFuente: z.enum(['CATALOGO', 'LICENCIA', 'PRIVADO', 'COMPARTIDO', 'PUBLICO']),
});
export type Cita = z.infer<typeof Cita>;

export const RespuestaTutor = z.strictObject({
  operationKey: z.string(),
  conversacionId: z.uuid(),
  mensajeId: z.string(),
  estado: z.enum(['RESPONDIDA', 'SIN_CONTEXTO', 'PARCIAL']),
  intencion: z.string(),
  modoFuentes: z.enum(['FUNDAMENTADA', 'MIXTA', 'GENERAL']),
  segmentos: z.array(z.strictObject({ id: z.string(), markdown: z.string() })),
  citas: z.array(Cita),
  sugerencias: z.array(z.strictObject({ tipo: z.enum(['TUTORIA_HUMANA', 'EJERCICIO', 'LECCION']), titulo: z.string(), enlace: z.string() })),
  uso: z.strictObject({
    recurso: CodigoRecursoPlan,
    consumido: z.number(),
    restantesPeriodo: z.number(),
    facturacion: z.enum(['MENTELYX', 'BYOK']),
    ruta: RutaIaPublica,
  }),
  avisos: z.array(z.string()),
  bloques: BloquesTutor.optional(),
  acciones: AccionesTutor.optional(),
});
export type RespuestaTutor = z.infer<typeof RespuestaTutor>;

export const MensajeConversacion = z.strictObject({
  id: z.string(),
  rol: z.enum(['user', 'assistant']),
  texto: z.string(),
  operationKey: z.string(),
  citas: z.array(Cita).optional(),
  /** Proveedor con que se generó la respuesta: el cliente rotula también las sesiones reconstruidas. */
  ruta: RutaIaPublica.optional(),
  avisos: z.array(z.string()).optional(),
  bloques: BloquesTutor.optional(),
  acciones: AccionesTutor.optional(),
  creadoEn: z.iso.datetime({ offset: true }),
});

export const ConversacionResumen = z.strictObject({
  id: z.uuid(),
  titulo: z.string(),
  espacioId: z.uuid().nullable(),
  preparacionId: z.uuid().nullable().optional(),
  temaId: z.string().nullable().optional(),
  mensajes: z.number().int().nonnegative(),
  actualizadaEn: z.iso.datetime({ offset: true }),
  expiraEn: z.iso.datetime({ offset: true }),
});
export type ConversacionResumen = z.infer<typeof ConversacionResumen>;

export const ConversacionDetalle = ConversacionResumen.extend({ listaMensajes: z.array(MensajeConversacion) });
export type ConversacionDetalle = z.infer<typeof ConversacionDetalle>;
