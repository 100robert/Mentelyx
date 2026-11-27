/**
 * Jest (Sprint 2, actividad 7): pruebas de funcionalidades y reglas de negocio en `tests/jest/`. Convive con Vitest, que
 * sigue a cargo de las suites unitarias, de arquitectura, de integración con PostgreSQL y MongoDB reales y de Workers.
 *
 * Alcance de la cobertura (sin exclusiones a medida): las capas de DOMINIO y APLICACIÓN de los siete módulos, los
 * contratos educativos compartidos, las utilidades transversales de seguridad y HTTP, y los adaptadores de IA. Los
 * repositorios SQL/Mongo y los controladores se validan contra bases reales en Vitest (`pnpm test:integracion`), no aquí.
 */
/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests/jest'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest', { jsc: { parser: { syntax: 'typescript' }, target: 'es2022' }, module: { type: 'commonjs' } }],
  },
  moduleNameMapper: {
    '^@mentelyx/contratos$': '<rootDir>/packages/contratos/src/index.ts',
    '^@mentelyx/contratos/educacion/(.*)$': '<rootDir>/packages/contratos/src/educacion/$1.ts',
  },
  collectCoverageFrom: [
    'backend/src/modules/*/dominio/**/*.ts',
    'backend/src/modules/*/aplicacion/**/*.ts',
    'backend/src/modules/tutor-ia-rag/infraestructura/nvidia.adapter.ts',
    'backend/src/modules/tutor-ia-rag/infraestructura/workers-ai.adapter.ts',
    'backend/src/shared/csrf.ts',
    'backend/src/shared/http.ts',
    'backend/src/shared/sesion.ts',
    'packages/contratos/src/educacion/**/*.ts',
  ],
  coverageDirectory: '<rootDir>/docs/05-evaluacion-arquitectonica/evidencias/jest/cobertura',
  coverageReporters: ['text', 'text-summary', 'html', 'json-summary', 'json'],
  testTimeout: 20000,
};
