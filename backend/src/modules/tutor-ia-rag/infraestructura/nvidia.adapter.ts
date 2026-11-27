import { costoUsd, estimarTokens, FalloProveedorIa, type ProveedorIaPort, type RecursoConsulta, type RutaIa, type SolicitudIa } from '../dominio/tutor';
import { construirMensajes, estimarEntradaMensajes, type MensajeChat } from './prompts/tutor-sistema';
import { VERSION_RUTAS } from './rutas-ia';

/**
 * Adaptador de NVIDIA API Catalog (OpenAI-compatible, `POST {base}/chat/completions`) detrás de `ProveedorIaPort`
 * (patrón Adapter; ADR-094). Ni el dominio ni los casos de uso de M6 cambian: la orquestación, los presupuestos, la
 * validación de bloques y la persistencia son las mismas que con Workers AI.
 *
 * - Modelo configurable (`NVIDIA_MODELO`): solo identificadores que la cuenta lista en `GET /models` y que responden.
 *   El 26/11/2026, `google/gemma-3-12b-it` y `google/gemma-3-4b-it` figuraban en el catálogo pero respondían 404 para la
 *   cuenta; `moonshotai/kimi-k3.1-pro` respondió con el razonamiento desactivado.
 * - Errores: 401/403 (credencial), 400/404/422 (solicitud o modelo) y 429 (límite del proveedor) son rechazos con
 *   evidencia de no ejecución; un timeout, un error de red o un 5xx quedan INCIERTOS (CO-10). Nunca se recurre al
 *   proveedor simulado.
 * - La clave solo viaja en la cabecera `Authorization`; los mensajes de error nunca incluyen la clave ni el cuerpo.
 */
export type ConfigNvidia = { apiKey: string; baseUrl: string; modelo: string; timeoutMs: number; fetch?: typeof fetch };

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1';
export const NVIDIA_MODELO_POR_OMISION = 'moonshotai/kimi-k3.1-pro';

type Salida = {
  choices?: Array<{ message?: { content?: string | null }; finish_reason?: string | null }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

const nombreLegible = (modelo: string) => {
  if (/kimi/i.test(modelo)) return 'Kimi K3.1 Pro';
  if (/gemma-3-12b/i.test(modelo)) return 'Gemma 3 12B';
  if (/gemma-3-4b/i.test(modelo)) return 'Gemma 3 4B';
  return modelo.split('/').pop() ?? modelo;
};

/** Parámetros por familia: los modelos con razonamiento lo desactivan (los tokens de razonamiento no se muestran). */
export function parametrosModelo(modelo: string): Record<string, unknown> {
  if (/kimi|deepseek|qwen3|glm|nemotron/i.test(modelo)) return { chat_template_kwargs: { thinking: false } };
  return {};
}

/** Gemma no admite el rol `system` en algunas plantillas: se antepone al primer mensaje del usuario. */
export function adaptarMensajes(modelo: string, mensajes: MensajeChat[]): MensajeChat[] {
  if (!/gemma/i.test(modelo)) return mensajes;
  const sistema = mensajes.filter((m) => m.role === 'system').map((m) => m.content).join('\n\n');
  const resto = mensajes.filter((m) => m.role !== 'system');
  const k = resto.findIndex((m) => m.role === 'user');
  if (!sistema || k < 0) return resto;
  return resto.map((m, i) => (i === k ? { ...m, content: `${sistema}\n\n${m.content}` } : m));
}

export class NvidiaProveedor implements ProveedorIaPort {
  readonly proveedor = 'nvidia';
  private readonly ruta: RutaIa;

  constructor(private readonly config: ConfigNvidia) {
    this.ruta = {
      id: 'explicacion.general',
      version: VERSION_RUTAS,
      proveedor: 'nvidia',
      modelo: config.modelo,
      etiqueta: `${nombreLegible(config.modelo)} · NVIDIA API Catalog`,
      maxTokensSalida: 1500,
      // NVIDIA no publica una tarifa por token para los créditos de API Catalog: el costo se registra en 0 y el consumo
      // real se controla con las cuotas de M5, el límite de tasa de M6 y los créditos de la cuenta.
      precio: { entradaUsdPorM: 0, salidaUsdPorM: 0, verificado: 'sin tarifa publicada (créditos de la cuenta NVIDIA)' },
    };
  }

  rutaPara(recurso: RecursoConsulta) {
    const ruta = recurso === 'CONSULTA_TECNICA' ? { ...this.ruta, id: 'explicacion.tecnica' as const } : this.ruta;
    return { ruta, estandar: this.ruta };
  }

  estimarEntrada(s: SolicitudIa) {
    return estimarEntradaMensajes(construirMensajes(s));
  }

  async responder(s: SolicitudIa) {
    const mensajes = adaptarMensajes(this.config.modelo, construirMensajes(s));
    const inicio = Date.now();
    let r: Response;
    try {
      r = await (this.config.fetch ?? fetch)(`${this.config.baseUrl.replace(/\/$/, '')}/chat/completions`, {
        method: 'POST',
        headers: { authorization: `Bearer ${this.config.apiKey}`, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ model: this.config.modelo, messages: mensajes, max_tokens: s.maxTokensSalida, temperature: 0.3, stream: false, ...parametrosModelo(this.config.modelo) }),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (e) {
      const nombre = e instanceof Error ? e.name : '';
      if (nombre === 'TimeoutError' || nombre === 'AbortError') throw new FalloProveedorIa('TIMEOUT', true, `NVIDIA no respondió en ${this.config.timeoutMs} ms`);
      throw new FalloProveedorIa('RECHAZO', true, 'Error de red al llamar a NVIDIA');
    }
    if (!r.ok) {
      const codigo = r.status;
      // Solo se conserva un resumen del error: el cuerpo puede incluir identificadores de la cuenta.
      if (codigo === 401 || codigo === 403) throw new FalloProveedorIa('RECHAZO', false, `NVIDIA rechazó la credencial (${codigo})`);
      if (codigo === 429) throw new FalloProveedorIa('RECHAZO', false, `NVIDIA limitó las solicitudes (429${r.headers.get('retry-after') ? `, reintentar en ${r.headers.get('retry-after')} s` : ''})`);
      if (codigo >= 500) throw new FalloProveedorIa('RECHAZO', true, `NVIDIA devolvió ${codigo}`);
      throw new FalloProveedorIa('RECHAZO', false, `NVIDIA rechazó la solicitud o el modelo (${codigo})`);
    }
    const salida = (await r.json().catch(() => null)) as Salida | null;
    const eleccion = salida?.choices?.[0];
    const bruto = eleccion?.message?.content;
    if (typeof bruto !== 'string' || !bruto.trim()) throw new FalloProveedorIa('RESPUESTA_INVALIDA', true, 'NVIDIA no devolvió texto.');
    const markdown = bruto.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const tokensEntrada = salida?.usage?.prompt_tokens ?? estimarEntradaMensajes(mensajes);
    const tokensSalida = salida?.usage?.completion_tokens ?? estimarTokens(bruto);
    return {
      markdown,
      tokensEntrada,
      tokensSalida,
      costoUsd: costoUsd(s.ruta.precio, tokensEntrada, tokensSalida),
      latenciaMs: Date.now() - inicio,
      finalizacion: eleccion?.finish_reason === 'length' ? ('length' as const) : eleccion?.finish_reason === 'stop' ? ('stop' as const) : ('otro' as const),
    };
  }
}
