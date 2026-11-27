---
name: mentelyx-infraestructura
description: "Define despliegue, DNS/CDN, caché, balanceo, escalabilidad, CI/CD y recuperación sin contratar servicios."
---

# mentelyx-infraestructura

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Leer arquitectura inicial, ADR de Cloudflare y escenarios de disponibilidad. Validar compatibilidad real de Next.js/Hono/Workers, Neon, Atlas, Redis y adaptadores; si falta acceso, registrar limitación.
2. Distinguir distribución administrada de Workers y balanceador de orígenes dedicado. No adoptar Kubernetes/Kafka por moda. Diseñar sesiones compartidas, frontend CDN, pooling, índices y caché selectiva; replicación/particiones solo con umbrales.
3. Definir local, pruebas, staging, producción, DNS, TLS, dominio/subdominios, CORS y cookies; secretos fuera de Git. CI/CD con checks, migraciones compatibles, pruebas y promoción controlada.
4. Diseñar fallos, métricas, alarmas, timeouts, retry/DLQ, límites presupuestarios y recuperación. No declarar SLA ni HA de extremo a extremo sin evidencia. No ejecutar despliegues ni configurar cuentas externas sin aprobación.
