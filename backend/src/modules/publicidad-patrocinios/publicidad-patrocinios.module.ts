import { OpenAPIHono } from '@hono/zod-openapi';
import { ganchoValidacion, type VariablesBase } from '../../shared/http';

/** Raíz de composición de M7 — Publicidad y Patrocinios. En I-0 solo existe la estructura; las capacidades llegan en I-7. */
export function crearModuloPublicidadPatrocinios() {
  return {
    nombre: 'M7 — Publicidad y Patrocinios',
    rutas: new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion }),
  };
}
