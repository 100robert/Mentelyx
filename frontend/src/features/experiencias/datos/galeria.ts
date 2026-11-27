import type { Experiencia } from '../tipos';

const acc = (descripcion: string) => ({ descripcion });

/**
 * Galería de bloques entre disciplinas: los mismos renderizadores (vectores, fórmulas con química, modelo 3D glTF,
 * comparación, línea de tiempo, gráficos con parámetros, tabla y código) sirven a física, química, biología, historia,
 * economía, astronomía, literatura y programación. Contenido preparado por Mentelyx y rotulado como ejemplo.
 */
export const galeria: Experiencia = {
  clave: 'galeria',
  titulo: 'Un mismo lienzo para todas las materias',
  disciplina: 'Varias disciplinas',
  descripcion: 'Física, química, biología, historia, economía, astronomía, literatura y programación con los mismos bloques.',
  contexto: 'Estoy explorando ejemplos de distintas materias: fuerzas, la molécula de metano, la célula, la Revolución francesa, oferta y demanda, la tercera ley de Kepler, figuras retóricas y derivadas numéricas.',
  bloques: [
    {
      id: 'fuerzas',
      version: 1,
      tipo: 'vectores',
      orden: 0,
      origen: 'ejemplo',
      titulo: 'Física: suma de dos fuerzas',
      accesibilidad: acc('Dos fuerzas perpendiculares aplicadas en el mismo punto: 3 newtons hacia la derecha y 4 newtons hacia arriba. Su resultante mide 5 newtons.'),
      contenido: {
        vista: { xMin: -1, xMax: 6, yMin: -1, yMax: 5 },
        unidad: 'N',
        vectores: [
          { id: 'f1', origen: [0, 0], componentes: [3, 0], color: 'serie1', etiqueta: 'F₁' },
          { id: 'f2', origen: [0, 0], componentes: [0, 4], color: 'serie3', etiqueta: 'F₂' },
        ],
        resultante: { id: 'r', de: ['f1', 'f2'], etiqueta: 'R = F₁ + F₂' },
      },
    },
    {
      id: 'metano',
      version: 1,
      tipo: 'modelo-3d',
      orden: 1,
      origen: 'ejemplo',
      titulo: 'Química: la molécula de metano',
      accesibilidad: acc('Modelo 3D de la molécula de metano: un átomo de carbono en el centro y cuatro de hidrógeno en los vértices de un tetraedro.'),
      contenido: {
        modelo: { tipo: 'catalogo', clave: 'metano' },
        partes: [
          { id: 'carbono', nombre: 'Átomo de carbono', texto: 'Forma cuatro enlaces covalentes simples, uno con cada hidrógeno.' },
          { id: 'h1', nombre: 'Hidrógeno 1', texto: 'Cada hidrógeno comparte un par de electrones con el carbono.' },
          { id: 'h2', nombre: 'Hidrógeno 2', texto: 'Los cuatro hidrógenos son equivalentes.' },
          { id: 'h3', nombre: 'Hidrógeno 3', texto: 'Los cuatro hidrógenos son equivalentes.' },
          { id: 'h4', nombre: 'Hidrógeno 4', texto: 'Los cuatro hidrógenos son equivalentes.' },
          { id: 'enlaces', nombre: 'Enlaces C–H', texto: 'Apuntan a los vértices de un tetraedro: el ángulo entre dos enlaces es de unos 109,5°.' },
        ],
      },
    },
    {
      id: 'combustion',
      version: 1,
      tipo: 'formula',
      orden: 2,
      origen: 'ejemplo',
      titulo: 'Química: combustión del metano',
      accesibilidad: acc('Ecuación química ajustada de la combustión completa del metano.'),
      contenido: { latex: '\\ce{CH4 + 2O2 -> CO2 + 2H2O}', quimica: true, lectura: 'Metano más dos moléculas de oxígeno producen dióxido de carbono más dos moléculas de agua.' },
    },
    {
      id: 'celulas',
      version: 1,
      tipo: 'comparacion',
      orden: 3,
      origen: 'ejemplo',
      titulo: 'Biología: célula animal y célula vegetal',
      accesibilidad: acc('Comparación de rasgos de la célula animal y la célula vegetal.'),
      contenido: {
        columnas: [
          { id: 'animal', titulo: 'Célula animal', puntos: ['Sin pared celular: solo membrana plasmática.', 'Sin cloroplastos.', 'Vacuolas pequeñas o ausentes.', 'Núcleo y mitocondrias.'] },
          { id: 'vegetal', titulo: 'Célula vegetal', puntos: ['Pared celular de celulosa por fuera de la membrana.', 'Cloroplastos, donde ocurre la fotosíntesis.', 'Una vacuola central grande.', 'Núcleo y mitocondrias.'] },
        ],
      },
    },
    {
      id: 'revolucion',
      version: 1,
      tipo: 'linea-tiempo',
      orden: 4,
      origen: 'ejemplo',
      titulo: 'Historia: la Revolución francesa',
      accesibilidad: acc('Línea de tiempo de la Revolución francesa entre 1789 y 1799.'),
      contenido: {
        eventos: [
          { id: 'estados', fecha: '5 de mayo de 1789', orden: 1789.34, titulo: 'Se abren los Estados Generales', texto: 'El rey Luis XVI reúne en Versalles a los representantes del clero, la nobleza y el tercer estado.' },
          { id: 'bastilla', fecha: '14 de julio de 1789', orden: 1789.53, titulo: 'Toma de la Bastilla', texto: 'El pueblo de París asalta la fortaleza-prisión de la Bastilla, símbolo del poder real.' },
          { id: 'declaracion', fecha: '26 de agosto de 1789', orden: 1789.65, titulo: 'Declaración de los Derechos del Hombre y del Ciudadano', texto: 'La Asamblea Nacional proclama derechos como la libertad, la igualdad ante la ley y la soberanía de la nación.' },
          { id: 'republica', fecha: '21 y 22 de septiembre de 1792', orden: 1792.72, titulo: 'Fin de la monarquía', texto: 'La Convención Nacional abole la monarquía y comienza la Primera República.' },
          { id: 'ejecucion', fecha: '21 de enero de 1793', orden: 1793.05, titulo: 'Ejecución de Luis XVI', texto: 'El rey, juzgado por la Convención, es guillotinado en París.' },
          { id: 'brumario', fecha: '9 de noviembre de 1799', orden: 1799.86, titulo: 'Golpe del 18 de brumario', texto: 'Napoleón Bonaparte toma el poder con un golpe de Estado: suele tomarse como el fin de la Revolución.' },
        ],
      },
    },
    {
      id: 'mercado',
      version: 1,
      tipo: 'grafico',
      orden: 5,
      origen: 'ejemplo',
      titulo: 'Economía: oferta, demanda y equilibrio',
      accesibilidad: acc('Gráfico de una curva de demanda decreciente y una de oferta creciente. Se cortan en el punto de equilibrio; al aumentar la demanda, el equilibrio sube y se desplaza a la derecha.'),
      contenido: {
        vista: { xMin: 0, xMax: 10, yMin: 0, yMax: 14 },
        ejes: { x: 'Cantidad (Q)', y: 'Precio (P)' },
        parametros: [{ id: 'd', etiqueta: 'Aumento de la demanda', min: 0, max: 4, paso: 0.5, valor: 0 }],
        funciones: [
          { id: 'demanda', expresion: '10 + d - x', color: 'serie3', etiqueta: 'Demanda: P = 10 + d − Q' },
          { id: 'oferta', expresion: '2 + x', color: 'serie1', etiqueta: 'Oferta: P = 2 + Q' },
        ],
        puntos: [{ id: 'equilibrio', x: '(8 + d)/2', en: 'oferta', etiqueta: 'Equilibrio', color: 'acento' }],
      },
    },
    {
      id: 'kepler',
      version: 1,
      tipo: 'grafico',
      orden: 6,
      origen: 'ejemplo',
      titulo: 'Astronomía: tercera ley de Kepler',
      accesibilidad: acc('Curva del período orbital en años en función de la distancia media al Sol en unidades astronómicas, T igual a a elevado a tres medios, con la Tierra, Marte y Júpiter sobre ella.'),
      contenido: {
        vista: { xMin: 0, xMax: 6, yMin: 0, yMax: 14 },
        ejes: { x: 'Distancia media al Sol (UA)', y: 'Período (años)' },
        funciones: [{ id: 'ley', expresion: 'x^(3/2)', color: 'serie1', etiqueta: 'T = a^(3/2)  (T² = a³)' }],
        puntos: [
          { id: 'tierra', x: 1, en: 'ley', etiqueta: 'Tierra', color: 'serie2' },
          { id: 'marte', x: 1.524, en: 'ley', etiqueta: 'Marte', color: 'peligro' },
          { id: 'jupiter', x: 5.203, en: 'ley', etiqueta: 'Júpiter', color: 'alerta' },
        ],
      },
    },
    {
      id: 'figuras',
      version: 1,
      tipo: 'tabla',
      orden: 7,
      origen: 'ejemplo',
      titulo: 'Literatura: figuras retóricas',
      accesibilidad: acc('Tabla de figuras retóricas con su definición y un ejemplo.'),
      contenido: {
        columnas: ['Figura', 'Qué hace', 'Ejemplo'],
        filas: [
          { id: 'simil', celdas: ['Símil', 'Compara dos elementos con un nexo («como», «cual»).', '«Ligero como una pluma».'] },
          { id: 'metafora', celdas: ['Metáfora', 'Identifica un elemento con otro, sin nexo.', '«Sus ojos eran dos luceros».'] },
          { id: 'personificacion', celdas: ['Personificación', 'Da rasgos humanos a lo que no es humano.', '«El viento susurraba entre los árboles».'] },
          { id: 'hiperbole', celdas: ['Hipérbole', 'Exagera para intensificar.', '«Te lo he dicho mil veces».'] },
          { id: 'anafora', celdas: ['Anáfora', 'Repite palabras al comienzo de frases o versos.', '«Cada día, cada hora, cada instante».'] },
        ],
        leyenda: 'Ejemplos escritos por Mentelyx.',
      },
    },
    {
      id: 'programa',
      version: 1,
      tipo: 'codigo',
      orden: 8,
      origen: 'ejemplo',
      titulo: 'Programación: derivada numérica',
      accesibilidad: acc('Función en Python que aproxima la derivada con una diferencia centrada.'),
      contenido: {
        lenguaje: 'python',
        codigo: 'def derivada(f, x, h=1e-5):\n    """Aproximación centrada de f\'(x)."""\n    return (f(x + h) - f(x - h)) / (2 * h)\n\n\nprint(derivada(lambda x: x**2 - 4*x + 3, 1))  # ≈ -2.0',
      },
    },
  ],
};
