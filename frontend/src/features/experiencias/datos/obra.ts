import type { Experiencia } from '../tipos';

const acc = (descripcion: string) => ({ descripcion });
/** Datos verificados en la API de colección de The Met (objeto 45434, JP1847): dominio público, Open Access CC0. */
const CREDITO = {
  id: 'credito',
  tipo: 'credito' as const,
  titulo: 'Bajo la ola en alta mar frente a Kanagawa (Kanagawa oki nami ura), conocida como La gran ola, de la serie Treinta y seis vistas del monte Fuji',
  autor: 'Katsushika Hokusai',
  fecha: 'c. 1830–1832',
  institucion: 'The Metropolitan Museum of Art, Nueva York (JP1847). H. O. Havemeyer Collection, legado de Mrs. H. O. Havemeyer, 1929',
  licencia: 'Dominio público (Open Access, CC0)',
  enlace: 'https://www.metmuseum.org/art/collection/search/45434',
};

/** Coordenadas en el sistema de la imagen de 1400 × 941 píxeles. */
export const obra: Experiencia = {
  clave: 'obra',
  titulo: 'Leer una obra: La gran ola de Hokusai',
  disciplina: 'Arte',
  descripcion: 'Amplía la estampa, recorre sus regiones y descubre cómo la composición hace pequeño al monte Fuji.',
  contexto: 'Estoy analizando la estampa «Bajo la ola en alta mar frente a Kanagawa» (La gran ola) de Katsushika Hokusai, c. 1830–1832.',
  bloques: [
    {
      id: 'estampa',
      version: 1,
      tipo: 'obra',
      orden: 0,
      origen: 'ejemplo',
      titulo: 'La gran ola',
      referencias: [CREDITO],
      accesibilidad: acc(
        'Xilografía de Hokusai. Una ola enorme se curva sobre tres barcas con remeros; su cresta se deshace en espuma. Al fondo, pequeño y nevado, el monte Fuji. Arriba a la izquierda, la cartela con el título y la firma.',
      ),
      contenido: {
        imagen: { src: '/recursos/obras/hokusai-gran-ola-1400.webp', srcChica: '/recursos/obras/hokusai-gran-ola-760.webp', ancho: 1400, alto: 941 },
        regiones: [
          { id: 'ola', etiqueta: 'La gran ola', texto: 'La cresta se curva y se deshace en «garras» de espuma. Su arco ocupa casi toda la mitad izquierda y encierra la escena.', forma: { tipo: 'rect', desde: [240, 83], hasta: [829, 608] } },
          { id: 'fuji', etiqueta: 'El monte Fuji', texto: 'Nevado, pequeño y quieto en el fondo, enmarcado por el hueco de la ola. Es el tema de toda la serie, aunque aquí parezca un detalle.', forma: { tipo: 'circulo', centro: [893, 640], radio: 90 } },
          { id: 'ola-pequena', etiqueta: 'La ola del primer plano', texto: 'Tiene forma de montaña con la cumbre blanca: repite en pequeño la silueta del Fuji.', forma: { tipo: 'circulo', centro: [488, 530], radio: 110 } },
          { id: 'barca-delantera', etiqueta: 'Barca del primer plano', texto: 'Una de las tres barcas rápidas de transporte (oshiokuri-bune). Los remeros, agachados, dan la escala: muestran el tamaño y la fuerza de la ola.', forma: { tipo: 'rect', desde: [562, 718], hasta: [1041, 903] } },
          { id: 'barca-izquierda', etiqueta: 'Barca bajo la cresta', texto: 'La segunda barca queda justo debajo de la ola que está por romper.', forma: { tipo: 'rect', desde: [46, 433], hasta: [341, 691] } },
          { id: 'barca-fondo', etiqueta: 'Barca del fondo', texto: 'La tercera barca sube por otra ola, a la derecha, cerca del Fuji.', forma: { tipo: 'rect', desde: [764, 488], hasta: [1280, 718] } },
          { id: 'cartela', etiqueta: 'Cartela y firma', texto: 'La cartela lleva el título de la serie y el de la estampa; a su lado está la firma: «Hokusai aratame Iitsu hitsu» (pintado por Iitsu, antes Hokusai).', forma: { tipo: 'rect', desde: [15, 55], hasta: [138, 304] } },
        ],
        lineas: [
          {
            id: 'arco',
            etiqueta: 'El arco de la ola',
            texto: 'La línea dominante: sube desde abajo a la izquierda hasta la cresta y cae hacia el centro, como una garra sobre las barcas.',
            puntos: [[28, 553], [80, 420], [160, 300], [260, 200], [380, 130], [553, 96], [680, 110], [760, 190], [810, 290], [820, 387]],
          },
          { id: 'horizonte', etiqueta: 'Un horizonte muy bajo', texto: 'El horizonte queda casi a la altura de las barcas: por eso la ola parece más alta que la montaña.', puntos: [[760, 672], [1070, 672]] },
        ],
      },
    },
    {
      id: 'contexto',
      version: 1,
      tipo: 'texto',
      orden: 1,
      origen: 'ejemplo',
      titulo: 'La estampa y su serie',
      accesibilidad: acc('Explicación breve sobre la técnica y la serie de la estampa.'),
      contenido: {
        markdown:
          'Es una **xilografía**: una estampa impresa con planchas de madera grabadas, tinta y color sobre papel, de la que se hacían muchas copias.\n\nPertenece a la serie **Treinta y seis vistas del monte Fuji** (Fugaku sanjūrokkei), en la que el Fuji aparece en cada estampa desde un lugar distinto. En esta, el protagonista visible es el mar y la montaña queda al fondo.\n\nPara leer una obra conviene ir de lo general a lo particular: primero la composición (las líneas que ordenan la escena), después las figuras y, al final, los detalles como la cartela y la firma.',
      },
    },
    {
      id: 'mirada',
      version: 1,
      tipo: 'ejercicio',
      orden: 2,
      origen: 'ejemplo',
      titulo: 'Mira con atención',
      accesibilidad: acc('Pregunta de opción múltiple sobre la composición de la obra.'),
      contenido: {
        modo: 'opcion',
        enunciado: '¿Qué elemento de la estampa repite en pequeño la forma del monte Fuji?',
        opciones: [
          { id: 'a', texto: 'La cartela del título' },
          { id: 'b', texto: 'La ola del primer plano' },
          { id: 'c', texto: 'La barca del fondo' },
        ],
        correcta: 'b',
        pista: 'Busca una forma de montaña con la cumbre blanca cerca del centro.',
        explicacion: 'La pequeña ola del primer plano tiene la silueta de una montaña nevada: un eco del Fuji que aparece al fondo.',
      },
    },
  ],
  recorrido: [
    { titulo: 'Mirar el conjunto', texto: 'Antes de los detalles, sigue la línea más fuerte: el arco de la ola.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'estampa' }, { accion: 'resaltar', bloqueId: 'estampa', objetivo: 'arco' }] },
    { titulo: 'El Fuji, pequeño', texto: 'En el hueco que deja la ola aparece el monte Fuji, inmóvil y lejano.', acciones: [{ accion: 'seleccionar-estructura', bloqueId: 'estampa', parte: 'fuji' }, { accion: 'cambiar-vista', bloqueId: 'estampa', vista: { tipo: 'zoom', nivel: 1.5 } }] },
    { titulo: 'Un eco de la montaña', texto: 'La ola del primer plano repite la forma del Fuji.', acciones: [{ accion: 'seleccionar-estructura', bloqueId: 'estampa', parte: 'ola-pequena' }, { accion: 'cambiar-vista', bloqueId: 'estampa', vista: { tipo: 'zoom', nivel: 1 } }] },
    { titulo: 'La escala humana', texto: 'Las barcas con sus remeros muestran el tamaño de la ola.', acciones: [{ accion: 'seleccionar-estructura', bloqueId: 'estampa', parte: 'barca-delantera' }] },
    { titulo: 'El horizonte', texto: 'Un horizonte tan bajo hace que la ola domine la escena.', acciones: [{ accion: 'resaltar', bloqueId: 'estampa', objetivo: 'horizonte' }, { accion: 'seleccionar-estructura', bloqueId: 'estampa', parte: null }] },
    { titulo: 'La firma', texto: 'Arriba a la izquierda, la cartela con el título y la firma del artista.', acciones: [{ accion: 'seleccionar-estructura', bloqueId: 'estampa', parte: 'cartela' }, { accion: 'resaltar', bloqueId: 'estampa', objetivo: null }] },
  ],
};
