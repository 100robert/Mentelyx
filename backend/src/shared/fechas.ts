/** Fecha civil (AAAA-MM-DD) en la zona de Perú; los periodos de recursos se expresan en fechas, no en instantes. */
const FORMATO_LIMA = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit' });

export const fechaLima = (instante: Date = new Date()): string => FORMATO_LIMA.format(instante);

export type Reloj = { hoy(): string };
export const relojSistema: Reloj = { hoy: () => fechaLima() };
