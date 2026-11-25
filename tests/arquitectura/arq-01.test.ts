import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ESLint } from 'eslint';
import { afterAll, describe, expect, it } from 'vitest';

// ARQ-01: demuestra que las reglas de dependencia DETECTAN infracciones (no solo que el código actual las cumple).
const raiz = join(import.meta.dirname, '..', '..');
const eslint = new ESLint({ cwd: raiz });
const modulos = join(raiz, 'backend', 'src', 'modules');

async function reglasInfringidas(rutaRelativa: string, codigo: string): Promise<string[]> {
  const [resultado] = await eslint.lintText(codigo, { filePath: join(raiz, rutaRelativa) });
  return (resultado?.messages ?? []).map((m) => m.ruleId ?? m.message);
}

describe('ARQ-01 · reglas de dependencia entre módulos y capas', () => {
  it('rechaza importar el interior de otro módulo', async () => {
    const reglas = await reglasInfringidas(
      'backend/src/modules/suscripciones-pagos/aplicacion/prueba-arq.ts',
      "import { users } from '../../usuarios-admin/infraestructura/schema';\nexport const x = users;\n",
    );
    expect(reglas).toContain('import-x/no-restricted-paths');
  });

  it('permite importar la API pública (index.ts) de otro módulo', async () => {
    const reglas = await reglasInfringidas(
      'backend/src/modules/tutor-ia-rag/tutor-ia-rag.module.ts',
      "import { crearModuloSuscripcionesPagos } from '../suscripciones-pagos';\nexport const x = crearModuloSuscripcionesPagos;\n",
    );
    expect(reglas).not.toContain('import-x/no-restricted-paths');
  });

  it('rechaza que el dominio importe frameworks, ORM o drivers', async () => {
    const reglas = await reglasInfringidas(
      'backend/src/modules/suscripciones-pagos/dominio/prueba-arq.ts',
      "import { sql } from 'drizzle-orm';\nimport { Hono } from 'hono';\nexport const x = [sql, Hono];\n",
    );
    expect(reglas.filter((r) => r === 'no-restricted-imports')).toHaveLength(2);
  });

  it('rechaza que la aplicación dependa de adaptadores de infraestructura', async () => {
    const reglas = await reglasInfringidas(
      'backend/src/modules/suscripciones-pagos/aplicacion/prueba-arq.ts',
      "import { PostgresLibroRecursos } from '../infraestructura/postgres-resource-ledger.adapter';\nexport const x = PostgresLibroRecursos;\n",
    );
    expect(reglas).toContain('import-x/no-restricted-paths');
  });

  it('rechaza que shared/ dependa de un módulo', async () => {
    const reglas = await reglasInfringidas(
      'backend/src/shared/prueba-arq.ts',
      "import { crearModuloSuscripcionesPagos } from '../modules/suscripciones-pagos';\nexport const x = crearModuloSuscripcionesPagos;\n",
    );
    expect(reglas).toContain('import-x/no-restricted-paths');
  });

  describe('ciclos de importación', () => {
    const tmp = join(modulos, 'docentes-clases', 'aplicacion', '__arq01_tmp__');
    afterAll(() => rmSync(tmp, { recursive: true, force: true }));

    it('detecta un ciclo A → B → A', async () => {
      mkdirSync(tmp, { recursive: true });
      writeFileSync(join(tmp, 'a.ts'), "import { b } from './b';\nexport const a = () => b;\n");
      writeFileSync(join(tmp, 'b.ts'), "import { a } from './a';\nexport const b = () => a;\n");
      const [resultado] = await eslint.lintFiles([join(tmp, 'a.ts')]);
      expect((resultado?.messages ?? []).map((m) => m.ruleId)).toContain('import-x/no-cycle');
    });
  });
});
