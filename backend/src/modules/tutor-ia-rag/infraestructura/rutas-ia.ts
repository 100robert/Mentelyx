import type { PoliticaTecnica, RecursoConsulta, RutaIa } from '../dominio/tutor';

/**
 * Configuración versionada de rutas (orquestación, sección 16, versión `2026-11-20.1`). Todas en Workers AI; sin
 * proveedores externos (`ia.extensionesExternas = false`, ADR-077). Precios oficiales verificados el 17/11/2026.
 */
export const VERSION_RUTAS = '2026-11-20.1';

export const RUTA_GENERAL: RutaIa = {
  id: 'explicacion.general',
  version: VERSION_RUTAS,
  proveedor: 'workers-ai',
  modelo: '@cf/google/gemma-4-26b-a4b-it',
  etiqueta: 'Gemma 4 26B A4B · Workers AI',
  maxTokensSalida: 2500,
  precio: { entradaUsdPorM: 0.1, salidaUsdPorM: 0.3, verificado: '2026-11-17' },
};

/** DeepSeek V4.1 Flash requiere Workers Paid o créditos prepagados (orquestación, sección 5.2): se activa por configuración. */
export const RUTA_TECNICA: RutaIa = {
  id: 'explicacion.tecnica',
  version: VERSION_RUTAS,
  proveedor: 'workers-ai',
  modelo: '@cf/deepseek-ai/deepseek-v4.1-flash-1017',
  etiqueta: 'DeepSeek V4.1 Flash · Workers AI',
  maxTokensSalida: 3000,
  precio: { entradaUsdPorM: 0.3, salidaUsdPorM: 1.2, verificado: '2026-11-17' },
};

/** Fallback de la sección 5.11: `explicacion.tecnica` → `explicacion.general` «con aviso de menor profundidad». */
export const RUTA_TECNICA_RESPALDO: RutaIa = {
  ...RUTA_GENERAL,
  id: 'explicacion.tecnica',
  aviso: 'Pregunta técnica atendida por el modelo general (Gemma 4): la explicación puede tener menor profundidad.',
};

/** Embeddings (ADR-076): USD 0,012 por millón de tokens, tarifa por verificar (IM, sección 18.2). */
export const EMBEDDINGS_BGE_M3 = { modelo: '@cf/baai/bge-m3', dimension: 1024, precioUsdPorM: 0.012 } as const;

/**
 * Política técnica de M6 (bloque `tecnico` de la sección 10.2, cifras de configuración, no cuotas comerciales).
 * `presupuestoOperacionUsd` = IM 18.1. Con 0,001 USD para la consulta general, la salida de Gemma se acota a 1500
 * tokens (1500 × 0,30 = 450 µUSD) para dejar margen a la entrada. Valor del piloto POR CALIBRAR, no medido.
 */
export const POLITICA_TECNICA: Record<RecursoConsulta, PoliticaTecnica> & { version: string } = {
  version: 'mvp-2026-11-21',
  CONSULTA_GENERAL: { presupuestoOperacionUsd: 0.001, maxTokensEntrada: 6000, maxTokensSalida: 1500 },
  CONSULTA_TECNICA: { presupuestoOperacionUsd: 0.006, maxTokensEntrada: 12000, maxTokensSalida: 3000 },
};

/** Tiempos máximos de `explicacion.*` (sección 13.1). Sin *streaming* en el MVP: se aplica solo el total. */
export const TIMEOUT_TOTAL_MS = 60_000;
