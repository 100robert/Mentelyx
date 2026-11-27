# Evidencias del Sprint 2: implementación y validación de la arquitectura

Manual de ejecución y de las evidencias reales generadas el 27/11/2026 en el equipo local:
- Windows 11, Docker Desktop, Node.js 24.15 y Grafana k6 2.4.0;
- PostgreSQL 17 + pgvector y MongoDB 8 en Docker Compose;
- API Hono y web OpenNext en `wrangler dev` (workerd).

**No hay mediciones de producción ni de la CDN de Cloudflare:** el Worker no está publicado. Los datos son ficticios (`@ejemplo.test`).

| Entregable | Archivo o comando | Estado |
|---|---|---|
| Código organizado por arquitectura | `backend/src/modules/<M1–M7>/{dominio,aplicacion,infraestructura,presentacion}`; correspondencia en el [SDD, sección 26.1](../../06-SDD/documento-de-diseño-de-software.md) | Verificado por ARQ-01 |
| OpenAPI exportable | [openapi/openapi.json](openapi/openapi.json): 43 rutas, 56 operaciones, agrupadas por módulo | Generado desde los esquemas reales; la prueba de contrato lo compara con las rutas |
| Swagger UI | http://localhost:8787/api/v1/docs (API) o http://localhost:8788/api/v1/docs (a través del frontend) | Verificado (200) en la API de carga, http://127.0.0.1:8792/api/v1/docs |
| Jest y cobertura | `corepack pnpm test:jest:cobertura` → [jest/cobertura/index.html](jest/cobertura/index.html), `coverage-summary.json` y el resumen en la terminal | 7 suites, 63/63 pruebas; cobertura: sentencias 61,61 %, ramas 50,56 %, funciones 59,23 %, líneas 70 % |
| Pruebas Vitest existentes | `pnpm test` (unitarias), `pnpm test:integracion` (PostgreSQL y MongoDB reales) y `pnpm test:workers` | Se conservan |
| Thunder Client | [tests/api/thunder-client](../../../tests/api/thunder-client/README.md): colección de 57 solicitudes, entorno y guía; contrato verificado en [thunder-client/verificacion-contrato.json](thunder-client/verificacion-contrato.json) | 57/57 correctas contra la API local; la ejecución gráfica en VS Code la realiza el propietario |
| k6 | `scripts/carga/` (script, datos, monitor, ejecutor y gráficas) → [k6/](k6/) | Máximo alcanzado: 869 VU (estrés); estable sin errores hasta 100 VU; saturación entre 100 y 250 VU. Ver la matriz de validación |
| PostgreSQL (DBeaver) | [sql/consultas-dbeaver.sql](sql/consultas-dbeaver.sql) y [sql/explain-postgres.json](sql/explain-postgres.json) | Planes reales sobre la base de carga |
| MongoDB (Compass) | [mongodb/procedimientos-compass.md](mongodb/procedimientos-compass.md) y [mongodb/explain-mongodb.json](mongodb/explain-mongodb.json) | Planes reales |
| Caché | [cache/medicion-cache-local.json](cache/medicion-cache-local.json) y el análisis en infraestructura, sección 9.7 | Solo local |
| CI | `.github/workflows/ci.yml`: calidad, **Jest con cobertura**, integración y E2E (Thunder, flujos V1, k6 de humo, OpenAPI) | Configurado; **pendiente de ejecución remota** (requiere push autorizado) |

## Reproducción paso a paso

```bash
# 1. Pila local (Docker Desktop abierto)
bash scripts/levantar-local.sh
# 2. Calidad y pruebas
corepack pnpm typecheck && corepack pnpm lint
corepack pnpm test && corepack pnpm test:integracion && corepack pnpm test:workers
corepack pnpm test:jest:cobertura
# 3. Contrato HTTP (las mismas solicitudes de Thunder Client)
node scripts/thunder/verificar-coleccion.mjs http://localhost:8787
# 4. Base de carga aislada y API de carga (puerto 8792; proveedor de IA SIMULADO)
docker exec mentelyx-postgres-1 psql -U mentelyx -d postgres -c "create database mentelyx_carga"
(cd backend && DATABASE_URL=postgres://mentelyx:mentelyx_local@127.0.0.1:55432/mentelyx_carga node node_modules/drizzle-kit/bin.cjs migrate)
MONGODB_DB=mentelyx_carga node backend/scripts/preparar-mongo.mjs
(cd backend && npx wrangler dev --port 8792 --ip 127.0.0.1 --var DATABASE_URL:postgres://mentelyx:mentelyx_local@127.0.0.1:55432/mentelyx_carga --var MONGODB_DB:mentelyx_carga --var AUTH_URL:http://127.0.0.1:8792 --var IA_PROVEEDOR:simulado)
node scripts/carga/preparar-datos-carga.mjs http://127.0.0.1:8792 20
# 5. k6 (Windows) y gráficas
bash scripts/carga/ejecutar-carga.sh "eq01 eq03 eq15 estres"
node scripts/carga/graficar.mjs eq01 eq03 eq15 estres
# 6. Planes de ejecución y caché
node scripts/analisis/explicar-bases.mjs mentelyx_carga mentelyx_carga
node scripts/analisis/medir-cache.mjs http://127.0.0.1:8793   # paquete OpenNext compilado; no usar `next dev`, que no aplica la caché
```

**Distinciones:**
- Un **usuario virtual** de k6 repite iteraciones con 1 s de pausa; no equivale a un estudiante humano.
- Las **solicitudes por segundo** dependen de la mezcla de operaciones.
- Los resultados de `wrangler dev` describen este equipo, no la capacidad de Cloudflare.
