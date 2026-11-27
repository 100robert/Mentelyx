import { describe, expect, it } from 'vitest';
import { configIa } from '../../../app';
import { FalloProveedorIa, type SolicitudIa } from '../dominio/tutor';
import { adaptarMensajes, NvidiaProveedor, parametrosModelo } from '../infraestructura/nvidia.adapter';

// Dobles de `fetch`: estas pruebas fijan el contrato del adaptador; la inferencia real se verifica aparte (sección 24).
const respuesta = (estado: number, cuerpo: unknown, cabeceras: Record<string, string> = {}) => new Response(JSON.stringify(cuerpo), { status: estado, headers: { 'content-type': 'application/json', ...cabeceras } });
function proveedor(f: typeof fetch, modelo = 'moonshotai/kimi-k3.1-pro', timeoutMs = 5_000) {
  return new NvidiaProveedor({ apiKey: 'nvapi-clave-de-prueba-no-real-0000000000', baseUrl: 'https://integrate.api.nvidia.com/v1', modelo, timeoutMs, fetch: f });
}
const solicitud = (p: NvidiaProveedor): SolicitudIa => ({ ruta: p.rutaPara('CONSULTA_GENERAL').ruta, pregunta: '¿Qué es una derivada?', historial: [], fragmentos: [], maxTokensSalida: 300 });

describe('M6 · adaptador NVIDIA API Catalog (ADR-094)', () => {
  it('envía el modelo, la clave solo en Authorization, el límite de salida y desactiva el razonamiento', async () => {
    let peticion: { url: string; init: RequestInit } | undefined;
    const p = proveedor(async (url, init) => {
      peticion = { url: String(url), init: init! };
      return respuesta(200, { choices: [{ message: { content: 'Una derivada mide el cambio.' }, finish_reason: 'stop' }], usage: { prompt_tokens: 120, completion_tokens: 9 } });
    });
    const r = await p.responder(solicitud(p));
    expect(peticion!.url).toBe('https://integrate.api.nvidia.com/v1/chat/completions');
    const cuerpo = JSON.parse(String(peticion!.init.body));
    expect(cuerpo).toMatchObject({ model: 'moonshotai/kimi-k3.1-pro', max_tokens: 300, stream: false, chat_template_kwargs: { thinking: false } });
    expect(JSON.stringify(cuerpo)).not.toContain('nvapi-');
    expect((peticion!.init.headers as Record<string, string>).authorization).toMatch(/^Bearer nvapi-/);
    expect(r).toMatchObject({ markdown: 'Una derivada mide el cambio.', tokensEntrada: 120, tokensSalida: 9, finalizacion: 'stop', costoUsd: 0 });
    expect(p.rutaPara('CONSULTA_GENERAL').ruta).toMatchObject({ proveedor: 'nvidia', etiqueta: 'Kimi K3.1 Pro · NVIDIA API Catalog' });
  });

  it('401/403/404/429 son rechazos sin ejecución; 5xx, red y timeout quedan inciertos; nunca filtra la clave', async () => {
    const casos: Array<[number, boolean]> = [[401, false], [403, false], [404, false], [429, false], [500, true], [503, true]];
    for (const [estado, incierto] of casos) {
      const p = proveedor(async () => respuesta(estado, { detail: 'cuenta abc123 nvapi-x' }, estado === 429 ? { 'retry-after': '30' } : {}));
      const e = await p.responder(solicitud(p)).catch((x: unknown) => x);
      expect(e, String(estado)).toBeInstanceOf(FalloProveedorIa);
      expect((e as FalloProveedorIa).incierto, String(estado)).toBe(incierto);
      expect((e as Error).message).not.toMatch(/abc123|nvapi/);
    }
    const red = proveedor(async () => Promise.reject(new TypeError('fetch failed')));
    expect(await red.responder(solicitud(red)).catch((e: FalloProveedorIa) => e.incierto)).toBe(true);
    const lento = proveedor((_u, init) => new Promise((_r, rechazar) => init?.signal?.addEventListener('abort', () => rechazar(Object.assign(new Error('t'), { name: 'TimeoutError' })))), undefined, 5_000);
    const t = await new NvidiaProveedor({ apiKey: 'nvapi-clave-de-prueba-no-real-0000000000', baseUrl: 'https://x.test/v1', modelo: 'moonshotai/kimi-k3.1-pro', timeoutMs: 50, fetch: (_u, i) => new Promise((_r, rej) => i?.signal?.addEventListener('abort', () => rej(Object.assign(new Error('t'), { name: 'TimeoutError' })))) })
      .responder(solicitud(lento))
      .catch((e: FalloProveedorIa) => e);
    expect(t).toMatchObject({ motivo: 'TIMEOUT', incierto: true });
  });

  it('una respuesta sin texto es inválida y se separa el bloque <think> si llega', async () => {
    const vacio = proveedor(async () => respuesta(200, { choices: [{ message: { content: '' } }] }));
    expect(await vacio.responder(solicitud(vacio)).catch((e: FalloProveedorIa) => e.motivo)).toBe('RESPUESTA_INVALIDA');
    const piensa = proveedor(async () => respuesta(200, { choices: [{ message: { content: '<think>borrador</think>Respuesta final.' }, finish_reason: 'length' }] }));
    expect(await piensa.responder(solicitud(piensa))).toMatchObject({ markdown: 'Respuesta final.', finalizacion: 'length' });
  });

  it('Gemma recibe las instrucciones del sistema dentro del primer mensaje del usuario', () => {
    const m = adaptarMensajes('google/gemma-3-12b-it', [
      { role: 'system', content: 'Reglas' },
      { role: 'user', content: 'Pregunta' },
    ]);
    expect(m).toEqual([{ role: 'user', content: 'Reglas\n\nPregunta' }]);
    expect(parametrosModelo('google/gemma-3-12b-it')).toEqual({});
  });

  it('configuración: nvidia exige la clave en cualquier entorno y conserva los embeddings de Workers AI si hay binding', () => {
    const base = { IA_RUTA_TECNICA: 'respaldo-general' as const, IA_PROVEEDOR: 'nvidia' as const };
    expect(() => configIa({ ...base, ENTORNO: 'staging' }, undefined)).toThrow(/NVIDIA_API_KEY/);
    const ai = { run: async () => ({}) };
    expect(configIa({ ...base, ENTORNO: 'produccion', NVIDIA_API_KEY: 'nvapi-clave-de-prueba-no-real-0000000000' }, ai)).toMatchObject({ proveedor: 'nvidia', embeddingsAi: ai, nvidia: { modelo: 'moonshotai/kimi-k3.1-pro' } });
  });
});
