import { apiCliente, nuevaClave } from '@/lib/api-cliente';
import type { Correccion, Respuesta } from '../preguntas/corregir';
import type { Pregunta } from '../preguntas/esquema';
import type { ActividadApi } from '../preparaciones/modelo';

/**
 * Banco, intentos, calificación oficial y tarjetas de una preparación (diseño de API, 12.9). El servidor fija la hora,
 * califica con el mismo `corregir` del cliente y no devuelve soluciones antes del momento permitido: las preguntas de
 * un intento en curso son una proyección (sin respuesta correcta), que la interfaz muestra con los mismos controles.
 */
export type ModoIntento = 'PRACTICA' | 'SIMULACRO' | 'DIAGNOSTICO';
export type IntentoApi = {
  id: string;
  preparacionId: string;
  modo: ModoIntento;
  estado: 'EN_CURSO' | 'CALIFICADO';
  preguntas: number;
  iniciadoEn: string;
  venceEn: string | null;
  entregadoEn: string | null;
  fueraDeTiempo: boolean | null;
  puntaje: number | null;
  maximo: number | null;
  pendientes: number | null;
  porcentaje: number | null;
};
export type ResultadoPreguntaApi = { preguntaId: string; tema: string; tipo: string; correccion: Correccion; pregunta: Pregunta | null; respuesta: Respuesta | null };
export type ResultadosApi = {
  puntaje: number;
  maximo: number;
  pendientes: number;
  porcentaje: number;
  porTema: Array<{ tema: string; puntaje: number; maximo: number; pendientes: number }>;
  preguntas: ResultadoPreguntaApi[];
};
export type DetalleIntento = {
  intento: IntentoApi;
  /** Proyección pública: tipada como Pregunta para reutilizar los controles, sin sus campos de solución. */
  preguntas: Pregunta[];
  respuestas: Record<string, Respuesta>;
  comprobadas: Record<string, { correccion: Correccion; pregunta: Pregunta }>;
  resultados: ResultadosApi | null;
  ahora: string;
};
export type BancoApi = { version: number; total: number; temas: Array<{ tema: string; total: number }>; preguntas: Pregunta[] };
export type RendimientoApi = {
  criterio: string;
  intentos: number;
  porTema: Array<{ tema: string; puntaje: number; maximo: number; pendientes: number; intentos: number; porcentaje: number | null }>;
  ultimos: IntentoApi[];
};
export type TarjetaApi = { id: string; tema: string | null; anverso: string; reverso: string; origen: string; proximaEn: string; intervaloDias: number; repeticiones: number };

const prep = (id: string) => `/preparaciones/${encodeURIComponent(id)}`;

export const cargarBanco = (preparacionId: string) => apiCliente<BancoApi>(`${prep(preparacionId)}/preguntas`);
export const agregarPreguntas = (preparacionId: string, preguntas: unknown[]) =>
  apiCliente<{ version: number; agregadas: number; actualizadas: number; rechazadas: Array<{ id: string; mensaje: string }> }>(`${prep(preparacionId)}/preguntas`, { metodo: 'POST', clave: nuevaClave(), cuerpo: { preguntas } });

export const iniciarIntento = (preparacionId: string, datos: { modo: ModoIntento; cantidad?: number; temas?: string[]; minutos?: number | null }, clave = nuevaClave()) =>
  apiCliente<DetalleIntento & { repetido: boolean }>(`${prep(preparacionId)}/intentos`, { metodo: 'POST', clave, cuerpo: datos });
export const cargarIntentos = (preparacionId: string) => apiCliente<IntentoApi[]>(`${prep(preparacionId)}/intentos`);
export const cargarIntento = (intentoId: string) => apiCliente<DetalleIntento>(`/intentos/${encodeURIComponent(intentoId)}`);
export const guardarRespuesta = (intentoId: string, preguntaId: string, respuesta: Respuesta, comprobar = false) =>
  apiCliente<{ guardada: { preguntaId: string; revision: number }; correccion: Correccion | null; pregunta: Pregunta | null }>(`/intentos/${encodeURIComponent(intentoId)}/respuestas/${encodeURIComponent(preguntaId)}`, {
    metodo: 'PUT',
    cuerpo: { respuesta, comprobar },
  });
export const entregarIntento = (intentoId: string, clave = nuevaClave()) =>
  apiCliente<{ intento: IntentoApi; resultados: ResultadosApi }>(`/intentos/${encodeURIComponent(intentoId)}/entrega`, { metodo: 'POST', clave });
export const cargarRendimiento = (preparacionId: string) => apiCliente<RendimientoApi>(`${prep(preparacionId)}/resultados`);

export const actualizarTemario = (preparacionId: string, temas: Array<{ id?: string; titulo: string }>) =>
  apiCliente<{ id: string; version: number; reglaVersion: string; actividades: ActividadApi[] }>(`${prep(preparacionId)}/temario`, { metodo: 'PUT', cuerpo: { temas } });

export const cargarTarjetas = (preparacionId: string) => apiCliente<{ regla: string; pendientes: number; tarjetas: TarjetaApi[] }>(`${prep(preparacionId)}/tarjetas`);
export const crearTarjeta = (preparacionId: string, datos: { tema?: string; anverso: string; reverso: string }) =>
  apiCliente<{ tarjeta: TarjetaApi }>(`${prep(preparacionId)}/tarjetas`, { metodo: 'POST', clave: nuevaClave(), cuerpo: datos });
export const revisarTarjeta = (tarjetaId: string, calificacion: 'OTRA_VEZ' | 'DIFICIL' | 'BIEN' | 'FACIL', clave = nuevaClave()) =>
  apiCliente<{ tarjeta: TarjetaApi }>(`/tarjetas/${encodeURIComponent(tarjetaId)}/revisiones`, { metodo: 'POST', clave, cuerpo: { calificacion } });
