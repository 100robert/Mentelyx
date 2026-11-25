/**
 * Registro estructurado sin datos personales (ADR-073, observabilidad; seguridad: «evitar logs con secretos o PII»).
 * Solo admite campos técnicos de una lista cerrada: nunca correos, nombres, tokens, cuerpos ni direcciones IP.
 */
const CAMPOS_PERMITIDOS = new Set(['requestId', 'metodo', 'ruta', 'estado', 'ms', 'tipo', 'modulo', 'operacion', 'resultado', 'codigo']);

export type Nivel = 'info' | 'warn' | 'error';

export function registrar(nivel: Nivel, evento: string, campos: Record<string, unknown> = {}): void {
  const limpio: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(campos)) {
    if (CAMPOS_PERMITIDOS.has(k)) limpio[k] = v;
  }
  const linea = JSON.stringify({ nivel, evento, ...limpio, ts: new Date().toISOString() });
  if (nivel === 'error') console.error(linea);
  else if (nivel === 'warn') console.warn(linea);
  else console.log(linea);
}
