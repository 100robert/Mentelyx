import type { Experiencia } from '../tipos';

const acc = (descripcion: string) => ({ descripcion });

/**
 * Documento: «Apuntes de derivadas», un PDF de elaboración propia de tres páginas (la tercera es una imagen escaneada,
 * sin texto), con referencias de página desde una explicación y una actividad basada en el documento.
 */
export const documento: Experiencia = {
  clave: 'documento',
  titulo: 'Estudiar con un documento',
  disciplina: 'Matemáticas',
  descripcion: 'Navega un PDF por páginas, busca, selecciona y resalta; las referencias te llevan a la página exacta.',
  contexto: 'Estoy leyendo unos apuntes de derivadas en PDF (definición, derivada de una cuadrática y ejercicios resueltos).',
  bloques: [
    {
      id: 'apuntes',
      version: 1,
      tipo: 'pdf',
      orden: 0,
      origen: 'ejemplo',
      titulo: 'Apuntes de derivadas',
      accesibilidad: acc('Documento PDF de tres páginas: la pendiente de una curva y la definición de derivada, la derivada de una cuadrática con un ejemplo, y una hoja escaneada con ejercicios resueltos.'),
      contenido: { documento: { tipo: 'catalogo', src: '/documentos/apuntes-derivadas.pdf' }, pagina: 1 },
    },
    {
      id: 'guia',
      version: 1,
      tipo: 'texto',
      orden: 1,
      origen: 'ejemplo',
      titulo: 'Guía de lectura',
      referencias: [
        { id: 'pag1', tipo: 'pagina', documento: 'apuntes', pagina: 1, texto: 'la definición' },
        { id: 'pag2', tipo: 'pagina', documento: 'apuntes', pagina: 2, texto: 'el ejemplo' },
        { id: 'pag3', tipo: 'pagina', documento: 'apuntes', pagina: 3, texto: 'los ejercicios' },
      ],
      accesibilidad: acc('Guía para leer los apuntes en orden, con enlaces a cada página.'),
      contenido: {
        markdown:
          'Lee primero la **definición** (página 1): la derivada es el límite de la pendiente de la secante.\n\nDespués, el **ejemplo** (página 2) con f(x) = x² − 4x + 3: busca dónde la tangente es horizontal.\n\nAl final, los **ejercicios resueltos** (página 3). Esa hoja es una imagen escaneada: se puede leer, pero no buscar ni seleccionar su texto.',
      },
    },
    {
      id: 'ejercicio-pdf',
      version: 1,
      tipo: 'ejercicio',
      orden: 2,
      origen: 'ejemplo',
      titulo: 'Comprueba con los apuntes',
      accesibilidad: acc('Actividad numérica basada en la página 2 del documento.'),
      contenido: {
        modo: 'numero',
        enunciado: 'Según la página 2, ¿en qué valor de x la tangente a f(x) = x² − 4x + 3 es horizontal?',
        respuesta: 2,
        pista: 'La tangente es horizontal donde la derivada vale cero: 2x − 4 = 0.',
        explicacion: 'f′(x) = 2x − 4 = 0 cuando x = 2: es el vértice de la parábola, (2, −1).',
      },
    },
    {
      id: 'tu-pdf',
      version: 1,
      tipo: 'pdf',
      orden: 3,
      origen: 'ejemplo',
      titulo: 'Abre tu propio PDF',
      accesibilidad: acc('Visor para abrir un PDF del equipo de la persona; el archivo no se sube.'),
      contenido: { documento: { tipo: 'local' } },
    },
  ],
  recorrido: [
    { titulo: 'La definición', texto: 'La página 1 explica la pendiente de la secante y la definición de derivada.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'apuntes' }, { accion: 'cambiar-vista', bloqueId: 'apuntes', vista: { tipo: 'pagina', pagina: 1 } }] },
    { titulo: 'El ejemplo', texto: 'En la página 2, la derivada de x² − 4x + 3 y su tangente horizontal en x = 2.', acciones: [{ accion: 'mostrar-referencia', bloqueId: 'guia', referenciaId: 'pag2' }] },
    { titulo: 'Una página escaneada', texto: 'La página 3 es una imagen: el visor avisa que no tiene texto seleccionable. Mentelyx no hace OCR.', acciones: [{ accion: 'mostrar-referencia', bloqueId: 'guia', referenciaId: 'pag3' }] },
    { titulo: 'Comprueba', texto: 'Responde con lo que leíste en la página 2.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'ejercicio-pdf' }] },
  ],
};
