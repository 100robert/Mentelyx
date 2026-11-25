import { OpenAPIHono } from '@hono/zod-openapi';
import { ganchoValidacion, type VariablesBase } from '../../shared/http';

/** Raíz de composición de M3 — Evaluaciones y Aprendizaje. En I-0 solo existe la estructura; las capacidades llegan en I-5. */
export function crearModuloEvaluacionesAprendizaje() {
  return {
    nombre: 'M3 — Evaluaciones y Aprendizaje',
    rutas: new OpenAPIHono<{ Variables: VariablesBase }>({ defaultHook: ganchoValidacion }),
  };
}
