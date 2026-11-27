# Muestreo de recursos durante las pruebas k6 (cada 5 s) hasta que exista el archivo de parada.
# Uso: powershell -File scripts/carga/monitor-recursos.ps1 -Salida <csv> -Parada <archivo>
param([string]$Salida, [string]$Parada)
"marca,cpu_equipo_pct,ram_libre_mb,workerd_cpu_s,workerd_ram_mb,postgres_cpu_pct,postgres_ram,mongo_cpu_pct,mongo_ram,conexiones_pg" | Out-File -Encoding utf8 $Salida
while (-not (Test-Path $Parada)) {
  # CIM en lugar de Get-Counter: los nombres de contadores están localizados (Windows en español).
  $cpu = [math]::Round((Get-CimInstance Win32_Processor | Measure-Object LoadPercentage -Average).Average, 1)
  $ram = [math]::Round((Get-CimInstance Win32_OperatingSystem).FreePhysicalMemory / 1KB, 0)
  $w = Get-Process workerd -ErrorAction SilentlyContinue
  $wcpu = [math]::Round(($w | Measure-Object CPU -Sum).Sum, 1)
  $wram = [math]::Round(($w | Measure-Object WorkingSet64 -Sum).Sum / 1MB, 0)
  $d = docker stats --no-stream --format "{{.Name}};{{.CPUPerc}};{{.MemUsage}}" mentelyx-postgres-1 mentelyx-mongo-1 2>$null
  $pg = ($d | Where-Object { $_ -like 'mentelyx-postgres*' }) -split ';'
  $mg = ($d | Where-Object { $_ -like 'mentelyx-mongo*' }) -split ';'
  $con = docker exec mentelyx-postgres-1 psql -U mentelyx -d postgres -Atc "select count(*) from pg_stat_activity where datname='mentelyx_carga'" 2>$null
  "$(Get-Date -Format o),$cpu,$ram,$wcpu,$wram,$($pg[1].Trim('%')),$($pg[2].Split('/')[0].Trim()),$($mg[1].Trim('%')),$($mg[2].Split('/')[0].Trim()),$con" | Out-File -Append -Encoding utf8 $Salida
  Start-Sleep -Seconds 5
}
