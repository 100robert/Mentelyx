import { costoUsd, estimarTokens, FalloProveedorIa, type EmbeddingsPort, type ProveedorIaPort, type RecursoConsulta, type SolicitudIa } from '../dominio/tutor';
import { construirMensajes, estimarEntradaMensajes } from './prompts/tutor-sistema';
import { EMBEDDINGS_BGE_M3, RUTA_GENERAL, RUTA_TECNICA, RUTA_TECNICA_RESPALDO, TIMEOUT_TOTAL_MS } from './rutas-ia';

/** Subconjunto del binding `AI` de Workers que usa M6 (estructural: se prueba con un doble sin cuenta). */
export type BindingIa = { run(modelo: string, entradas: Record<string, unknown>): Promise<unknown> };

type SalidaChat = {
  choices?: Array<{ message?: { content?: string | null }; finish_reason?: string }>;
  response?: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number };
};

/** Códigos de error explícitos de Workers AI (`3xxx`, `5xxx`): rechazo con evidencia de no ejecución. */
const RECHAZO_EXPLICITO = /\b[345]\d{3}\b/;

const conTimeout = <T>(p: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new FalloProveedorIa('TIMEOUT', true, `Sin respuesta del modelo en ${ms} ms`)), ms);
    p.then(
      (v) => (clearTimeout(t), resolve(v)),
      (e: unknown) => (clearTimeout(t), reject(e)),
    );
  });

/**
 * Rutas `explicacion.*` en Workers AI (orquestación, secciones 5.3, 5.11 y 16). Gemma 4 sin «pensamiento» (los
 * tokens de razonamiento se facturan como salida); DeepSeek V4.1 Flash con esfuerzo `low` solo si se activa
 * (requiere Workers Paid o créditos). El costo se calcula con el `usage` que devuelve el modelo y la tarifa de la ruta.
 */
export class WorkersAiProveedor implements ProveedorIaPort {
  readonly proveedor = 'workers-ai';

  constructor(
    private readonly ai: BindingIa,
    private readonly opciones: { rutaTecnica: 'deepseek' | 'respaldo-general'; timeoutMs?: number },
  ) {}

  rutaPara(recurso: RecursoConsulta) {
    if (recurso === 'CONSULTA_GENERAL') return { ruta: RUTA_GENERAL, estandar: RUTA_GENERAL };
    return { ruta: this.opciones.rutaTecnica === 'deepseek' ? RUTA_TECNICA : RUTA_TECNICA_RESPALDO, estandar: RUTA_GENERAL };
  }

  estimarEntrada(s: SolicitudIa) {
    return estimarEntradaMensajes(construirMensajes(s));
  }

  async responder(s: SolicitudIa) {
    const mensajes = construirMensajes(s);
    const entradas: Record<string, unknown> = { messages: mensajes, max_tokens: s.maxTokensSalida, temperature: 0.3 };
    if (s.ruta.modelo.includes('gemma')) entradas.chat_template_kwargs = { enable_thinking: false };
    if (s.ruta.modelo.includes('deepseek')) entradas.reasoning_effort = 'low';
    const inicio = Date.now();
    let salida: SalidaChat;
    try {
      salida = (await conTimeout(this.ai.run(s.ruta.modelo, entradas), this.opciones.timeoutMs ?? TIMEOUT_TOTAL_MS)) as SalidaChat;
    } catch (e) {
      if (e instanceof FalloProveedorIa) throw e;
      const mensaje = e instanceof Error ? e.message : String(e);
      // Solo un código explícito prueba la no ejecución (CO-10); cualquier otro fallo queda INCIERTO.
      throw new FalloProveedorIa('RECHAZO', !RECHAZO_EXPLICITO.test(mensaje), mensaje.slice(0, 200));
    }
    const eleccion = salida?.choices?.[0];
    const bruto = eleccion?.message?.content ?? salida?.response;
    if (typeof bruto !== 'string' || !bruto.trim()) throw new FalloProveedorIa('RESPUESTA_INVALIDA', true, 'El modelo no devolvió texto.');
    const markdown = bruto.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    const tokensEntrada = salida.usage?.prompt_tokens ?? estimarEntradaMensajes(mensajes);
    const tokensSalida = salida.usage?.completion_tokens ?? estimarTokens(bruto);
    return {
      markdown,
      tokensEntrada,
      tokensSalida,
      costoUsd: costoUsd(s.ruta.precio, tokensEntrada, tokensSalida),
      latenciaMs: Date.now() - inicio,
      finalizacion: eleccion?.finish_reason === 'length' ? ('length' as const) : eleccion?.finish_reason === 'stop' || !eleccion ? ('stop' as const) : ('otro' as const),
    };
  }
}

const normalizarL2 = (v: number[]) => {
  const n = Math.sqrt(v.reduce((t, x) => t + x * x, 0)) || 1;
  return v.map((x) => x / n);
};

/**
 * BGE-M3 en Workers AI (RAG, sección 8): lotes de hasta 100 textos, dimensión comprobada (1024; si no, se rechaza
 * el lote) y vectores normalizados para la distancia coseno. Sin prefijos de tarea.
 */
export class WorkersAiEmbeddings implements EmbeddingsPort {
  readonly modelo = 'bge-m3' as const;
  readonly precioUsdPorM = EMBEDDINGS_BGE_M3.precioUsdPorM;

  constructor(private readonly ai: BindingIa) {}

  async embeber(textos: string[]) {
    const vectores: number[][] = [];
    for (let i = 0; i < textos.length; i += 100) {
      const lote = textos.slice(i, i + 100);
      let r: { data?: unknown; shape?: unknown };
      try {
        r = (await conTimeout(this.ai.run(EMBEDDINGS_BGE_M3.modelo, { text: lote }), 20_000)) as { data?: unknown };
      } catch (e) {
        if (e instanceof FalloProveedorIa) throw e;
        throw new FalloProveedorIa('RECHAZO', false, (e instanceof Error ? e.message : String(e)).slice(0, 200));
      }
      const data = r?.data;
      const valido =
        Array.isArray(data) &&
        data.length === lote.length &&
        data.every((v) => Array.isArray(v) && v.length === EMBEDDINGS_BGE_M3.dimension && v.every((x) => typeof x === 'number' && Number.isFinite(x)));
      if (!valido) throw new FalloProveedorIa('RESPUESTA_INVALIDA', false, `Lote rechazado: se esperaban ${lote.length} vectores de ${EMBEDDINGS_BGE_M3.dimension} dimensiones (ADR-076).`);
      vectores.push(...(data as number[][]).map(normalizarL2));
    }
    return { vectores, tokens: textos.reduce((t, x) => t + estimarTokens(x), 0) };
  }
}
