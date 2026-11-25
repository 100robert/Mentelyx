// API pública de M5. Otros módulos solo importan desde aquí (ARQ-01); no se exportan repositorios concretos.
export { crearModuloSuscripcionesPagos, type ModuloSuscripcionesPagos, type RecursosDePlanApi } from './suscripciones-pagos.module';
export type { ModuloOrigen } from './dominio/recurso-plan';
