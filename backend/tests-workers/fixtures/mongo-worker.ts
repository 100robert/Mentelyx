// PR-INF-01: Worker mínimo para probar el driver oficial de MongoDB con el empaquetador real de Wrangler (no Vitest).
import { MongoClient } from 'mongodb';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url).searchParams.get('url') ?? 'mongodb://127.0.0.1:57017';
    const inicio = Date.now();
    const cliente = new MongoClient(url, { serverSelectionTimeoutMS: 5000, maxPoolSize: 1 });
    try {
      await cliente.connect();
      const col = cliente.db('mentelyx_prinf01').collection<{ _id: string; n: number }>('prueba');
      const id = crypto.randomUUID();
      await col.insertOne({ _id: id, n: 1 });
      const leido = await col.findOne({ _id: id });
      return Response.json({ ok: leido?.n === 1, ms: Date.now() - inicio });
    } catch (e) {
      return Response.json({ ok: false, error: String((e as Error)?.stack ?? e).slice(0, 1500) }, { status: 500 });
    } finally {
      await cliente.close().catch(() => {});
    }
  },
};
