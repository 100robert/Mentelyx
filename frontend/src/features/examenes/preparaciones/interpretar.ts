import type { Borrador } from './modelo';

/**
 * Interpretación LOCAL y determinista de una frase como «Tengo un examen de arquitectura de software dentro de tres días».
 * No es IA: reconoce patrones de fecha y de asignatura en español y propone campos que la persona revisa y corrige.
 */
const NUMEROS: Record<string, number> = { un: 1, una: 1, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, quince: 15, veinte: 20 };
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const TIPOS = ['parcial', 'final', 'examen', 'evaluacion', 'prueba', 'control', 'practica calificada', 'admision', 'certificacion'];

const sinTildes = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '');
const sumarDias = (hoy: string, n: number) => {
  const d = new Date(`${hoy}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
const cantidad = (t: string) => (/^\d+$/.test(t) ? Number(t) : (NUMEROS[t] ?? null));

export type Interpretacion = Partial<Pick<Borrador, 'nombre' | 'asignatura' | 'fechaExamen' | 'previos'>> & { reconocido: string[] };

export function interpretarFrase(frase: string, hoy: string): Interpretacion {
  const original = frase.trim().replace(/\s+/g, ' ').slice(0, 300);
  const t = sinTildes(original.toLowerCase());
  const r: Interpretacion = { reconocido: [] };

  // Fecha relativa o absoluta.
  let m: RegExpExecArray | null;
  if (/\bpasado manana\b/.test(t)) r.fechaExamen = sumarDias(hoy, 2);
  else if (/\bmanana\b/.test(t)) r.fechaExamen = sumarDias(hoy, 1);
  else if ((m = /\b(?:dentro de|en)\s+(\d+|un|una|uno|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte)\s+(dias?|semanas?)\b/.exec(t))) {
    const n = cantidad(m[1]!);
    if (n) r.fechaExamen = sumarDias(hoy, m[2]!.startsWith('semana') ? n * 7 : n);
  } else if ((m = /\b(?:el\s+)?(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\b/.exec(t))) {
    const mes = m[2] === 'setiembre' ? 8 : MESES.indexOf(m[2]!);
    const dia = Number(m[1]);
    const anio = Number(hoy.slice(0, 4));
    const fecha = (y: number) => `${y}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    // Sin año: la próxima vez que llegue esa fecha.
    const iso = fecha(anio) > hoy ? fecha(anio) : fecha(anio + 1);
    const d = new Date(`${iso}T00:00:00Z`);
    if (!Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso) r.fechaExamen = iso;
  }
  if (r.fechaExamen) r.reconocido.push('fecha');

  // Tipo de evaluación y asignatura: «examen de X», «parcial de X», «estudiar X para…».
  const tipo = TIPOS.find((x) => new RegExp(`\\b${x}\\b`).test(t));
  const corte = /\s+(?:dentro de|en \d|en (?:un|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b|para\b|manana|pasado|el \d|y no\b|y quiero\b|que\b|,|\.)/;
  const extraer = (desde: number) => {
    const resto = original.slice(desde);
    const fin = sinTildes(resto.toLowerCase()).search(corte);
    return (fin >= 0 ? resto.slice(0, fin) : resto).replace(/^(?:mi|el|la|los|las)\s+/i, '').trim();
  };
  let asignatura = '';
  if ((m = /\b(?:examen|parcial|final|evaluacion|prueba|control|practica calificada)\s+(?:final\s+|parcial\s+)?de\s+/.exec(t))) asignatura = extraer(m.index + m[0].length);
  else if ((m = /\b(?:estudiar|preparar|repasar)\s+(?:mi\s+|el\s+|la\s+)?(?:(?:examen|parcial|final|evaluacion)\s+de\s+)?/.exec(t))) asignatura = extraer(m.index + m[0].length);
  asignatura = asignatura.replace(/^(?:examen|parcial|final)\s+de\s+/i, '').trim();
  if (asignatura && asignatura.length <= 80) {
    r.asignatura = asignatura.charAt(0).toUpperCase() + asignatura.slice(1);
    r.reconocido.push('asignatura');
  }
  if (tipo && r.asignatura) {
    const nombreTipo = { parcial: 'Examen parcial', final: 'Examen final', evaluacion: 'Evaluación', prueba: 'Prueba', control: 'Control' }[tipo as 'parcial'] ?? 'Examen';
    r.nombre = `${nombreTipo} de ${r.asignatura.charAt(0).toLowerCase()}${r.asignatura.slice(1)}`;
    r.reconocido.push('nombre');
  }
  if (/\bno se (?:por donde|nada)|desde cero|no entiendo nada\b/.test(t)) {
    r.previos = 'nada';
    r.reconocido.push('conocimientos previos');
  }
  return r;
}
