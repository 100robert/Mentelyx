import { describe, expect, it } from 'vitest';
import { crearApp, EntornoApp } from '../app';

// Contrato OpenAPI (Guías 05–07: «mantener los contratos OpenAPI actualizados»): toda ruta real de la API está
// documentada en /api/v1/openapi.json y viceversa; las operaciones con efectos documentan Idempotency-Key.
// No abre conexiones: construir la app no toca PostgreSQL, MongoDB ni R2.
const entorno = EntornoApp.parse({ ENTORNO: 'ci', DATABASE_URL: 'postgres://nadie@127.0.0.1:1/ninguna', AUTH_SECRET: 'x'.repeat(40), AUTH_URL: 'http://localhost' });
const { app } = crearApp(entorno, { db: {} as never, pool: {} as never }, { almacen: {} as never, mongo: () => Promise.reject(new Error('sin MongoDB')), segundoPlano: () => {} });

type Operacion = { parameters?: Array<{ in: string; name: string; required?: boolean }>; responses: Record<string, unknown> };
type Documento = { openapi: string; paths: Record<string, Record<string, Operacion>> };

async function documento(): Promise<Documento> {
  const r = await app.fetch(new Request('http://localhost/api/v1/openapi.json'));
  expect(r.status).toBe(200);
  return (await r.json()) as Documento;
}

const METODOS = new Set(['get', 'post', 'put', 'patch', 'delete']);

describe('Contrato OpenAPI 3.1 de la API', () => {
  it('cada ruta implementada está documentada y cada ruta documentada existe', async () => {
    const doc = await documento();
    expect(doc.openapi).toBe('3.1.0');
    const implementadas = new Set(
      app.routes
        .filter((r) => METODOS.has(r.method.toLowerCase()) && r.path.startsWith('/api/v1/') && r.path !== '/api/v1/openapi.json')
        .map((r) => `${r.method.toLowerCase()} ${r.path.slice('/api/v1'.length).replace(/:(\w+)/g, '{$1}')}`),
    );
    const documentadas = new Set(Object.entries(doc.paths).flatMap(([ruta, ops]) => Object.keys(ops).filter((m) => METODOS.has(m)).map((m) => `${m} ${ruta}`)));
    expect([...implementadas].filter((x) => !documentadas.has(x)), 'rutas sin documentar').toEqual([]);
    expect([...documentadas].filter((x) => !implementadas.has(x)), 'rutas documentadas inexistentes').toEqual([]);
    expect(implementadas.size).toBeGreaterThanOrEqual(15);
  });

  it('las operaciones con efectos que exigen Idempotency-Key la documentan como cabecera obligatoria', async () => {
    const doc = await documento();
    for (const [ruta, metodo] of [
      ['/tutor-ia/consultas', 'post'],
      ['/espacios/{id}/fuentes', 'post'],
    ] as const) {
      const cabecera = doc.paths[ruta]?.[metodo]?.parameters?.find((p) => p.in === 'header' && p.name === 'idempotency-key');
      expect(cabecera, `${metodo} ${ruta}`).toMatchObject({ required: true });
    }
  });

  it('el Tutor documenta 429 (cuota, presupuesto, tasa) y 503 (proveedor)', async () => {
    const respuestas = (await documento()).paths['/tutor-ia/consultas']?.post?.responses ?? {};
    expect(Object.keys(respuestas)).toEqual(expect.arrayContaining(['200', '400', '401', '404', '409', '422', '429', '503']));
  });

  it('sin Idempotency-Key válida → 400 CLAVE_IDEMPOTENCIA_REQUERIDA (no un 400 genérico)', async () => {
    const r = await app.fetch(
      new Request('http://localhost/api/v1/tutor-ia/consultas', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'idempotency-key': 'corta' },
        body: JSON.stringify({ conversacionId: crypto.randomUUID(), pregunta: 'hola' }),
      }),
    );
    expect(r.status).toBe(400);
    expect(((await r.json()) as { error: { code: string } }).error.code).toBe('CLAVE_IDEMPOTENCIA_REQUERIDA');
  });
});
