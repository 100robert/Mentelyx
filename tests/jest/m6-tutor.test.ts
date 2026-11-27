import { extraerEstructura } from '../../backend/src/modules/tutor-ia-rag/aplicacion/estructura-respuesta';
import { clasificarConsulta, normalizarCitas, redactarDatosPersonales, FalloProveedorIa, type SolicitudIa } from '../../backend/src/modules/tutor-ia-rag/dominio/tutor';
import { NvidiaProveedor } from '../../backend/src/modules/tutor-ia-rag/infraestructura/nvidia.adapter';
import { WorkersAiProveedor } from '../../backend/src/modules/tutor-ia-rag/infraestructura/workers-ai.adapter';

/** M6 · Tutor IA: salida estructurada validada, adaptadores de proveedores (patrón Adapter, ADR-094) y protección de datos. */
describe('M6 · reglas del Tutor', () => {
  it('redacta datos personales antes de enviarlos al modelo', () => {
    const t = redactarDatosPersonales('Escríbeme a ana@correo.pe o al 987654321, DNI 12345678, https://x.test/a?token=abc123');
    expect(t).not.toMatch(/ana@correo|987654321|12345678|abc123/);
    expect(t).toContain('https://x.test/a?[PARAMETROS]'); // la URL se conserva sin sus parámetros
  });

  it('las citas solo pueden apuntar a fragmentos entregados', () => {
    const r = normalizarCitas('Según [[c1]] y [[c7]].', 2);
    expect(r.citados).toEqual([1]);
    expect(r.markdown).not.toContain('[[c7]]');
  });

  it('la categoría de consumo la decide el servidor', () => {
    expect(clasificarConsulta('¿Qué es la fotosíntesis?')).toBe('CONSULTA_GENERAL');
  });

  it('la sección estructurada se separa del texto y solo pasan bloques y acciones válidos', () => {
    const md = 'Texto.\n\n```mentelyx\n' + JSON.stringify({ bloques: [{ tipo: 'formula', latex: 'x^2' }, { tipo: 'html', x: '<script>' }], acciones: [{ accion: 'enfocar-bloque', bloque: 1 }, { accion: 'crear-bloque', bloque: {} }] }) + '\n```';
    const e = extraerEstructura(md, 'tq');
    expect(e.markdown).toBe('Texto.');
    expect(e.bloques).toHaveLength(1);
    expect(e.acciones).toEqual([{ accion: 'enfocar-bloque', bloqueId: 'tq-b1' }]);
    expect(e.descartados).toBe(2);
  });
});

const solicitud = (p: { rutaPara: NvidiaProveedor['rutaPara'] }): SolicitudIa => ({ ruta: p.rutaPara('CONSULTA_GENERAL').ruta, pregunta: '¿Qué es una derivada?', historial: [], fragmentos: [], maxTokensSalida: 200 });

describe('M6 · adaptadores de proveedores (mismo ProveedorIaPort)', () => {
  it('NVIDIA: respuesta válida con uso de tokens y rótulo del modelo', async () => {
    const p = new NvidiaProveedor({ apiKey: 'nvapi-prueba-no-real-000000000000000', baseUrl: 'https://integrate.api.nvidia.com/v1', modelo: 'moonshotai/kimi-k3.1-pro', timeoutMs: 1000, fetch: async () => new Response(JSON.stringify({ choices: [{ message: { content: 'Ok' }, finish_reason: 'stop' }], usage: { prompt_tokens: 5, completion_tokens: 1 } }), { status: 200 }) });
    expect(await p.responder(solicitud(p))).toMatchObject({ markdown: 'Ok', tokensEntrada: 5, tokensSalida: 1 });
  });

  it('NVIDIA: 429 es rechazo sin ejecución y 502 queda incierto (no se cobra dos veces ni se inventa respuesta)', async () => {
    for (const [estado, incierto] of [[429, false], [502, true]] as const) {
      const p = new NvidiaProveedor({ apiKey: 'nvapi-prueba-no-real-000000000000000', baseUrl: 'https://x.test/v1', modelo: 'moonshotai/kimi-k3.1-pro', timeoutMs: 1000, fetch: async () => new Response('{}', { status: estado }) });
      const e = (await p.responder(solicitud(p)).catch((x: unknown) => x)) as FalloProveedorIa;
      expect(e).toBeInstanceOf(FalloProveedorIa);
      expect(e.incierto).toBe(incierto);
    }
  });

  it('Workers AI: desactiva el razonamiento de Gemma y trata un código explícito como rechazo', async () => {
    let entradas: Record<string, unknown> = {};
    const ok = new WorkersAiProveedor({ run: async (_m, e) => ((entradas = e), { response: 'Hola', usage: { prompt_tokens: 3, completion_tokens: 1 } }) }, { rutaTecnica: 'respaldo-general' });
    expect((await ok.responder(solicitud(ok))).markdown).toBe('Hola');
    expect(entradas.chat_template_kwargs).toEqual({ enable_thinking: false });
    const mal = new WorkersAiProveedor({ run: async () => Promise.reject(new Error('3040: capacidad')) }, { rutaTecnica: 'respaldo-general' });
    expect(((await mal.responder(solicitud(mal)).catch((x: unknown) => x)) as FalloProveedorIa).incierto).toBe(false);
  });
});
