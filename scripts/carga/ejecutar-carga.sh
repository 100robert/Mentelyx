#!/usr/bin/env bash
# Ejecuta los escenarios k6 en secuencia contra la API de carga aislada (por defecto http://127.0.0.1:8792) y guarda,
# por escenario: resumen JSON/TXT (handleSummary), serie temporal CSV comprimida y muestreo de recursos.
# Uso (Git Bash, desde la raíz):  bash scripts/carga/ejecutar-carga.sh "eq01 eq03 eq15 estres"
set -u
K6="${K6:-/c/Program Files/k6/k6.exe}"
SAL="docs/05-evaluacion-arquitectonica/evidencias/k6"
mkdir -p "$SAL"
for ESC in ${1:-eq01 eq03 eq15 estres}; do
  PARADA="$SAL/.parar-$ESC"
  rm -f "$PARADA"
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts/carga/monitor-recursos.ps1 -Salida "$SAL/$ESC-recursos.csv" -Parada "$PARADA" &
  MON=$!
  echo "== $ESC · inicio $(date -Iseconds)"
  "$K6" run -q -e ESCENARIO="$ESC" -e BASE_URL="${BASE_URL:-http://127.0.0.1:8792}" --out "csv=$SAL/$ESC-serie.csv.gz" scripts/carga/mentelyx-k6.js > "$SAL/$ESC-consola.txt" 2>&1
  echo "== $ESC · fin $(date -Iseconds) · código $?"
  touch "$PARADA"
  wait $MON 2>/dev/null
  rm -f "$PARADA"
  sleep 20 # enfriamiento entre escenarios
done
