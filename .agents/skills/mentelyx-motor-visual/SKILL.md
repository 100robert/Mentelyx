---
name: mentelyx-motor-visual
description: "Diseña chat/pizarra, primitivas gráficas, matemáticas, escenas 3D y generación de PDF/PPTX auténticos."
---

# mentelyx-motor-visual

Aplicar AGENTS.md de la raíz. Trabajar solo la tarea pedida.

1. Mantener separación entre generación IA, validación estructural, cálculo determinista y renderizado. Preferir SVG/Canvas, KaTeX y Three.js según tarea; no ejecutar JavaScript/HTML/shaders arbitrarios generados.
2. Definir esquema versionado de pasos e instrucciones, registro de primitivas (texto, fórmula, puntos, líneas, ejes, funciones, vectores, figuras, tablas, resaltado, imágenes, circuitos y escenas 3D). Cada primitiva: tipos, unidades, límites, algoritmo, ejemplo y prueba. Incluir pausa/retroceso y alternativa accesible.
3. Definir coordenadas, muestreo y discontinuidades, verificación matemática. Distinguir simulación científica paramétrica de modelo 3D generativo; evaluar archivos GLB/glTF, tamaño/texturas y rendimiento móvil.
4. PDF/PPTX: contenido estructurado, plantilla, renderizador real, archivo editable cuando corresponda, referencias y almacenamiento R2. Trabajos async, idempotencia, cancelación, costo y fallos.
5. Completar ejemplos: cuadrática, movimiento, circuito y escena científica. Coordinar esquemas con persistencia y contratos; no inventar modelos ni afirmar exactitud científica de objetos generados.
