import type { AlmacenObjetosPort } from '../dominio/espacios';

/** Adaptador R2 (binding `ARCHIVOS`). En `wrangler dev` y en las pruebas de workerd lo emula Miniflare localmente. */
export class R2AlmacenObjetos implements AlmacenObjetosPort {
  constructor(private readonly bucket: R2Bucket) {}

  async guardar(clave: string, contenido: string, tipo: string) {
    await this.bucket.put(clave, contenido, { httpMetadata: { contentType: tipo } });
  }

  async leer(clave: string) {
    const objeto = await this.bucket.get(clave);
    return objeto ? await objeto.text() : undefined;
  }

  async eliminar(clave: string) {
    await this.bucket.delete(clave);
  }
}

/** Adaptador en memoria para pruebas de integración en Node.js (sin R2). No se usa en el Worker. */
export class MemoriaAlmacenObjetos implements AlmacenObjetosPort {
  readonly objetos = new Map<string, string>();

  async guardar(clave: string, contenido: string) {
    this.objetos.set(clave, contenido);
  }

  async leer(clave: string) {
    return this.objetos.get(clave);
  }

  async eliminar(clave: string) {
    this.objetos.delete(clave);
  }
}
