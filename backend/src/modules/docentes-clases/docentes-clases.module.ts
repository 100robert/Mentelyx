import { OpenAPIHono } from '@hono/zod-openapi';
import { ganchoValidacion, type VariablesBase } from '../../shared/http';

/** Raíz de composición de M4 — Docentes y Clases. En I-0 solo existe la estructura; las capacidades llegan en I-7. */
export function crearModuloDocentesClases() {
  return {
    nombre: 'M4 — Docentes y Clases',
    rutas: new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion }),
  };
}
