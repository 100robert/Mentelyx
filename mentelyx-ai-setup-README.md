# Kit Mentelyx — uso local

Este paquete contiene 8 skills duplicadas en las rutas de proyecto de Codex y Claude Code, dos perfiles de subagente Codex opcionales y reglas comunes. No instala servidores ni plugins externos ni modifica documentación. Los subagentes consumen cuota: no usarlos de manera automática.

Instalar desde PowerShell abierto en E:\Mentelyx: ejecutar el archivo instalar-mentelyx.ps1 o copiar sus contenidos en la terminal. El instalador omite archivos existentes; comparar antes de fusionar. Reiniciar las sesiones de ambos asistentes y abrir la raíz del proyecto.

Codex: `$mentelyx-persistencia` y una tarea acotada. Claude Code: `/mentelyx-ia-rag` y una tarea acotada. Si no se detecta la skill, pedir que lea directamente SKILL.md. No usar paralelo sobre mismos archivos.

Orden: auditoría → caracterización/persistencia → seguridad e infraestructura → IA/RAG → motor visual → contratos/UI → calidad/SDD. Codex: persistencia, seguridad, infraestructura. Claude Code: IA, motor visual, contratos. Si Codex no tiene cuota, usar Claude para una tarea de persistencia o IA, registrar el traspaso y luego revisión cruzada. Estos archivos no aumentan la cuota.

Fuentes oficiales: https://developers.openai.com/codex/skills ; https://developers.openai.com/codex/subagents ; https://developers.openai.com/codex/guides/agents-md ; https://code.claude.com/docs/en/skills ; https://developers.openai.com/codex/mcp
