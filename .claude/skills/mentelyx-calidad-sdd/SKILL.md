---
name: mentelyx-calidad-sdd
description: "Evalúa atributos de calidad, prepara ATAM adaptado, trazabilidad, SDD, pruebas y criterios de aceptación."
---

# mentelyx-calidad-sdd

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Leer AC/EQ, drivers, ADR, diseños actuales y materiales docentes disponibles. No inventar páginas. Evaluación inspirada en ATAM: objetivos, escenarios priorizados, riesgos, sensibilidad, compromisos y mitigación; no afirmar ATAM formal sin interesados.
2. Mapear requisitos → driver → ADR → escenario EQ → prueba → evidencia. Conservar IDs y umbrales vigentes. Diseñar pruebas unitarias/integ/contrato/E2E/k6, seguridad, recuperación, caché y calidad IA. Diferenciar prueba pendiente, simulada, pasada o fallida; no inventar resultados.
3. k6: usar cargas EQ vigentes (por ejemplo EQ-01 100 VU/10 min, p95 <=2 s, 5xx <1% si se confirma en versión local); medir también 200 VU según escenario. No equiparar VU a usuarios reales. Separar IA/audiovisual pagados.
4. Definir fallos de Postgres/Mongo/Redis/IA, sesiones revocadas, duplicación y actualización/migración; backups y restauración, objetivos RTO/RPO explícitos. No probar estrés contra producción.
5. Consolidar el SDD en `docs/06-SDD/documento-de-diseño-de-software.md` por referencias a archivos vigentes, no repetirlos. La evaluación inspirada en ATAM, riesgos, estrategia de pruebas y trazabilidad viven en `docs/05-evaluacion-arquitectonica/` (01 a 04). Revisar 16 criterios docentes: problema, análisis/diseño, HLD/LLD, SDD, unitarias/integración, E2E, UI/UX, escalabilidad frontend/backend, DB, DNS/CDN, caché, CI/CD, k6, GitHub, informe, sustentación. No asignar puntajes desconocidos.
6. Entregar bloqueos, pruebas pendientes, backlog incremental y definición de terminado. No iniciar implementación sin instrucción explícita.
