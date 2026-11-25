import { estimarTokens, type IdRuta, type ProveedorIaPort, type RecursoConsulta, type RutaIa, type SolicitudIa } from '../dominio/tutor';
import { construirMensajes, estimarEntradaMensajes } from './prompts/tutor-sistema';
import { VERSION_RUTAS } from './rutas-ia';

const ruta = (id: IdRuta): RutaIa => ({
  id,
  version: VERSION_RUTAS,
  proveedor: 'simulado',
  modelo: 'simulado-v1',
  etiqueta: 'Demostración (sin IA real)',
  maxTokensSalida: 1500,
  precio: { entradaUsdPorM: 0, salidaUsdPorM: 0, verificado: 'no aplica' },
});

/**
 * Proveedor SIMULADO para desarrollo local y CI (SDD, sección 22: «Workers AI simulado en CI»), sin cuenta ni costo.
 * Construye los mismos mensajes que el adaptador real (estimación idéntica) y compone una respuesta determinista
 * con los fragmentos, citados con `[[cN]]` como pide el prompt. El despliegue usa `WorkersAiProveedor`.
 */
export class ProveedorSimulado implements ProveedorIaPort {
  readonly proveedor = 'simulado';

  rutaPara(recurso: RecursoConsulta) {
    return { ruta: ruta(recurso === 'CONSULTA_TECNICA' ? 'explicacion.tecnica' : 'explicacion.general'), estandar: ruta('explicacion.general') };
  }

  estimarEntrada(s: SolicitudIa) {
    return estimarEntradaMensajes(construirMensajes(s));
  }

  async responder(s: SolicitudIa) {
    const lineas: string[] = [];
    if (s.fragmentos.length > 0) {
      lineas.push('**Respuesta de demostración basada en tus fuentes.**', '');
      s.fragmentos.slice(0, 3).forEach((f, i) => lineas.push(`- Según «${f.titulo}» [[c${i + 1}]]: ${oracionesRelevantes(f.texto, s.pregunta)}`));
      lineas.push('', 'Revisa los pasajes citados para profundizar.');
    } else {
      lineas.push('**No encontré pasajes de tus fuentes sobre esta pregunta.**', '', 'En el entorno de demostración no hay un modelo que genere una explicación general.');
    }
    const markdown = lineas.join('\n');
    return { markdown, tokensEntrada: this.estimarEntrada(s), tokensSalida: estimarTokens(markdown), costoUsd: 0, latenciaMs: 0, finalizacion: 'stop' as const };
  }
}

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
const raices = (s: string) => new Set((normalizar(s).match(/\p{L}{4,}/gu) ?? []).map((w) => w.slice(0, 5)));

/** Las dos oraciones del fragmento que comparten más raíces (5 letras) con la pregunta, en su orden original. */
function oracionesRelevantes(texto: string, pregunta: string): string {
  const terminos = raices(pregunta);
  const oraciones = texto
    .split(/\n+/)
    .filter((l) => !/^\s*#/.test(l))
    .flatMap((l) => l.split(/(?<=[.!?])\s+/))
    .map((o) => o.trim())
    .filter(Boolean);
  const puntuadas = oraciones.map((o, i) => ({ o, i, p: [...raices(o)].filter((r) => terminos.has(r)).length }));
  const elegidas = [...puntuadas].sort((x, y) => y.p - x.p || x.i - y.i).slice(0, 2).sort((x, y) => x.i - y.i);
  const texto2 = elegidas.map((e) => e.o).join(' ') || texto;
  return texto2.length > 500 ? `${texto2.slice(0, 497)}…` : texto2;
}
