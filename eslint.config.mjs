// ARQ-01 (estrategia de pruebas, sección 3; ADR-073): 0 ciclos y 0 imports prohibidos. Bloquea el merge en CI.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import importX from 'eslint-plugin-import-x';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import globals from 'globals';

const MODULOS = [
  'usuarios-admin',
  'cursos-contenidos',
  'evaluaciones-aprendizaje',
  'docentes-clases',
  'suscripciones-pagos',
  'tutor-ia-rag',
  'publicidad-patrocinios',
];
const M = './backend/src/modules';

// Un módulo solo importa el index.ts de otro módulo (diseño interno, secciones 2 y 10.1).
const zonasEntreModulos = MODULOS.flatMap((destino) =>
  MODULOS.filter((origen) => origen !== destino).map((origen) => ({
    target: `${M}/${destino}`,
    from: `${M}/${origen}`,
    except: ['./index.ts'],
    message: `Solo se permite importar la API pública (index.ts) de ${origen}.`,
  })),
);

// Dirección de dependencias de Clean Architecture dentro de cada módulo.
const zonasPorCapa = MODULOS.flatMap((m) => [
  { target: `${M}/${m}/dominio`, from: [`${M}/${m}/aplicacion`, `${M}/${m}/infraestructura`, `${M}/${m}/presentacion`], message: 'El dominio no depende de otras capas.' },
  { target: `${M}/${m}/aplicacion`, from: [`${M}/${m}/infraestructura`, `${M}/${m}/presentacion`], message: 'La aplicación depende de puertos, no de adaptadores.' },
]);

const zonasGlobales = [
  { target: './backend/src/shared', from: './backend/src/modules', message: 'shared/ no depende de ningún módulo.' },
  { target: './frontend', from: './backend', message: 'El frontend usa la API HTTP, no el código del backend.' },
  { target: './packages', from: ['./backend', './frontend'], message: 'Los paquetes compartidos no dependen de las aplicaciones.' },
];

const FRAMEWORKS = ['hono', 'hono/*', '@hono/*', 'drizzle-orm', 'drizzle-orm/*', '@neondatabase/*', 'kysely', 'better-auth', 'better-auth/*', 'pg', 'mongodb', '@upstash/*', 'next', 'next/*', 'react', 'react-dom'];

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '.claude/**', '**/.next/**', '**/.open-next/**', '**/.wrangler/**', '**/dist/**', '**/coverage/**', 'backend/drizzle/**', 'frontend/public/pdfjs/**', '**/worker-configuration.d.ts', '**/cloudflare-env.d.ts', '**/next-env.d.ts', 'docs/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mjs,js}'],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    plugins: { 'import-x': importX },
    settings: {
      // Sin este analizador, import-x no puede recorrer dependencias .ts y no-cycle no detectaría ciclos.
      'import-x/parsers': { '@typescript-eslint/parser': ['.ts', '.tsx', '.mts', '.cts'] },
      'import-x/extensions': ['.ts', '.tsx', '.mts', '.cts', '.js', '.mjs'],
      'import-x/resolver-next': [
        createTypeScriptImportResolver({ project: ['backend/tsconfig.json', 'frontend/tsconfig.json', 'packages/*/tsconfig.json'], noWarnOnMultipleProjects: true }),
      ],
    },
    rules: {
      'import-x/no-cycle': ['error', { ignoreExternal: true }],
      'import-x/no-restricted-paths': ['error', { zones: [...zonasEntreModulos, ...zonasPorCapa, ...zonasGlobales] }],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // El dominio no importa frameworks, ORM, drivers ni SDK (Clean Architecture; AGENTS.md).
    files: ['backend/src/modules/*/dominio/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [{ group: FRAMEWORKS, message: 'El dominio no importa frameworks ni infraestructura.' }] }],
    },
  },
  {
    files: ['backend/src/modules/*/aplicacion/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: FRAMEWORKS.filter((f) => !f.startsWith('hono') && !f.startsWith('@hono')).concat(['hono', 'hono/*', '@hono/*']), message: 'La aplicación usa puertos, no frameworks ni drivers.' }] },
      ],
    },
  },
  {
    // Configuración CommonJS de Jest (Sprint 2).
    files: ['jest.config.cjs'],
    languageOptions: { sourceType: 'commonjs', globals: { ...globals.node } },
  },
  {
    // Scripts de Grafana k6: se ejecutan en el runtime de k6, con sus globales.
    files: ['scripts/carga/*-k6.js'],
    languageOptions: { globals: { __ENV: 'readonly', __VU: 'readonly', __ITER: 'readonly', open: 'readonly' } },
  },
);
