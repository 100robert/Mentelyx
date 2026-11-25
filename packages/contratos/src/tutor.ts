import { CodigoRecursoPlan } from './recursos';
import { z } from './zod';

// API, secciones 2 (M6) y 4.3. Sprint 03: respuesta JSON (sin SSE), Workers AI (o proveedor simulado en local/CI) y
// recuperación híbrida BGE-M3 + texto (ADR-076; solo léxica como degradación), sobre fuentes privadas del usuario.
export const RETENCION_CONVERSACION_DIAS = 90; // ADR-079

export const CrearConversacionRequest = z.strictObject({
  contexto: z.strictObject({ superficie: z.enum(['TUTOR', 'LECCION', 'EJERCICIO']), espacioId: z.uuid().optional() }),
  usarApuntes: z.boolean().optional(),
});

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
    ruta: z.strictObject({ etiqueta: z.string(), proveedor: z.string(), modelo: z.string().optional() }),
  }),
  avisos: z.array(z.string()),
});
export type RespuestaTutor = z.infer<typeof RespuestaTutor>;

export const MensajeConversacion = z.strictObject({
  id: z.string(),
  rol: z.enum(['user', 'assistant']),
  texto: z.string(),
  operationKey: z.string(),
  citas: z.array(Cita).optional(),
  creadoEn: z.iso.datetime({ offset: true }),
});

export const ConversacionResumen = z.strictObject({
  id: z.uuid(),
  titulo: z.string(),
  espacioId: z.uuid().nullable(),
  mensajes: z.number().int().nonnegative(),
  actualizadaEn: z.iso.datetime({ offset: true }),
  expiraEn: z.iso.datetime({ offset: true }),
});
export type ConversacionResumen = z.infer<typeof ConversacionResumen>;

export const ConversacionDetalle = ConversacionResumen.extend({ listaMensajes: z.array(MensajeConversacion) });
export type ConversacionDetalle = z.infer<typeof ConversacionDetalle>;
