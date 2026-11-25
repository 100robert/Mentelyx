#!/usr/bin/env bash
# Levanta Mentelyx en local (Docker Desktop encendido): bases de datos, API (8787) y web (8788).
# Uso, desde la raíz del repositorio en Git Bash:  bash scripts/levantar-local.sh
# Usa la última compilación que hay dentro del contenedor mentelyx-build; no compila ni toca la nube.
set -u
export MSYS_NO_PATHCONV=1

echo "1/3 Encendiendo contenedores…"
docker start mentelyx-postgres-1 mentelyx-mongo-1 mentelyx-redis-1 mentelyx-redis-http-1 mentelyx-neon-wsproxy-1 mentelyx-build >/dev/null || {
  echo "No se pudieron encender los contenedores. ¿Está abierto Docker Desktop?"; exit 1; }
for _ in $(seq 1 30); do
  [ "$(docker ps --filter name=mentelyx-postgres-1 --format '{{.Status}}' | grep -c healthy)" = "1" ] && break
  sleep 2
done

responde() { [ "$(curl -s -o /dev/null -w '%{http_code}' "$1" 2>/dev/null)" = "200" ]; }

echo "2/3 API en http://localhost:8787…"
if ! responde http://127.0.0.1:8787/api/v1/salud; then
  docker exec -d mentelyx-build sh -c 'cd /app/backend && corepack pnpm exec wrangler dev --port 8787 --ip 0.0.0.0 --var DATABASE_URL:postgres://mentelyx:mentelyx_local@postgres:5432/mentelyx --var NEON_WS_PROXY:neon-wsproxy:80 --var MONGODB_URL:mongodb://mongo:27017 --var AUTH_URL:http://localhost:8788 --var UPSTASH_REDIS_REST_URL:http://redis-http:80 --var UPSTASH_REDIS_REST_TOKEN:token_local_mentelyx > /tmp/api.log 2>&1'
  for _ in $(seq 1 60); do responde http://127.0.0.1:8787/api/v1/salud && break; sleep 3; done
fi

echo "3/3 Web en http://localhost:8788…"
if ! responde http://127.0.0.1:8788/; then
  docker exec -d mentelyx-build sh -c 'cd /app/frontend && corepack pnpm exec opennextjs-cloudflare populateCache local > /tmp/cache.log 2>&1; corepack pnpm exec wrangler dev --port 8788 --ip 0.0.0.0 > /tmp/web.log 2>&1'
  for _ in $(seq 1 60); do responde http://127.0.0.1:8788/ && break; sleep 3; done
fi

if responde http://127.0.0.1:8788/ && responde http://127.0.0.1:8787/api/v1/salud; then
  cat <<'RUTAS'

Mentelyx está listo:
  Inicio (landing) ........ http://localhost:8788/
  Crear cuenta ............ http://localhost:8788/auth/registro    (alias /registro)
  Ingresar ................ http://localhost:8788/auth/ingresar    (alias /login)
  Dashboard ............... http://localhost:8788/espacios         (alias /dashboard; requiere sesión)
  Conversaciones .......... http://localhost:8788/tutor
  Planes .................. http://localhost:8788/planes
  Biblioteca pública ...... http://localhost:8788/biblioteca
RUTAS
else
  echo "Algo no respondió. Revisa los registros: docker exec mentelyx-build sh -c 'tail -20 /tmp/api.log /tmp/web.log'"
  exit 1
fi
