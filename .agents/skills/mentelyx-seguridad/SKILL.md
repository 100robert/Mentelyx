---
name: mentelyx-seguridad
description: "Diseña autenticación, sesiones, autorización, amenazas, dependencias y resiliencia de Mentelyx."
---

# mentelyx-seguridad

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Leer M1/M4/M5, requisitos y ADR de seguridad, y diseño API pertinente. Distinguir autenticación, autorización, verificación documental y acreditación.
2. Verificar documentación y avisos oficiales de biblioteca/versiones realmente candidatas; no asumir que una vulnerabilidad afecta el proyecto ni inventar versiones. Evaluar Better Auth y alternativas compatibles con Hono/Workers. Rust solo ante necesidad demostrada.
3. Definir cookies Secure/HttpOnly/SameSite según topología, expiración/revocación, CSRF/CORS, MFA administrativo, rate limiting, recuperación, autorización por propietario, auditoría, secretos y webhooks. Evitar criptografía casera. Sesión revocada no se valida desde caché obsoleta.
4. Elaborar riesgos STRIDE y pruebas de aislamiento, revocación, concurrencia, escalamiento de permisos, fallos de Redis/DB y restauración; proteger datos de menores, evitar logs con secretos o PII. No realizar ataques a producción ni contratar herramientas.
5. Registrar decisión, alternativa, precondiciones y criterios de aceptación. Documentar brechas legales como pendientes, no certificar cumplimiento.
