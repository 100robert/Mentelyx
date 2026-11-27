import type { Experiencia } from '../tipos';

const acc = (descripcion: string) => ({ descripcion });

/**
 * Historia: «¿Cómo nació la nación de Turquía?». Caso de aceptación multidisciplinario de la pizarra (explicación, contexto,
 * línea de tiempo, conceptos y una actividad, para anotar encima). Solo hechos y fechas ampliamente establecidos; sin
 * citas inventadas: el contenido es de Mentelyx y está rotulado como ejemplo. No es una respuesta del Tutor.
 */
export const turquia: Experiencia = {
  clave: 'turquia',
  titulo: '¿Cómo nació la nación de Turquía?',
  disciplina: 'Historia',
  descripcion: 'Del Imperio otomano a la República de Turquía (1918–1924): explicación, contexto, línea de tiempo y conceptos para anotar y preguntar.',
  contexto: 'Estudio historia: el paso del Imperio otomano a la República de Turquía entre 1918 y 1924.',
  bloques: [
    {
      id: 'explicacion',
      version: 1,
      tipo: 'texto',
      orden: 0,
      origen: 'ejemplo',
      titulo: 'La idea central',
      accesibilidad: acc('Explicación breve de cómo nació la República de Turquía tras la Primera Guerra Mundial.'),
      contenido: {
        markdown:
          'La República de Turquía nació en **1923**, de la derrota y el reparto del Imperio otomano al terminar la Primera Guerra Mundial.\n\n' +
          'Un movimiento nacional encabezado por **Mustafa Kemal** (más tarde llamado Atatürk) rechazó el reparto que imponían los vencedores, formó un gobierno propio en **Ankara** y ganó la Guerra de Independencia (1919–1922). El Tratado de **Lausana** (1923) reconoció sus fronteras.\n\n' +
          'Después, el nuevo Estado abolió el sultanato y el califato y se organizó como un **Estado nacional**: ya no un imperio de muchos pueblos gobernado por una dinastía, sino una república de ciudadanos turcos.\n\n' +
          'Las fechas siguen la cronología histórica generalmente aceptada; compáralas con tu libro de texto.',
      },
    },
    {
      id: 'contexto',
      version: 1,
      tipo: 'texto',
      orden: 1,
      origen: 'ejemplo',
      titulo: 'Contexto: un imperio en retroceso',
      accesibilidad: acc('Contexto histórico del Imperio otomano antes y durante la Primera Guerra Mundial.'),
      contenido: {
        markdown:
          'El Imperio otomano reunía durante siglos a pueblos y religiones muy distintos (turcos, árabes, griegos, armenios, kurdos, judíos y otros), con capital en Estambul. El sultán era también califa, una autoridad religiosa del islam suní.\n\n' +
          '- En el siglo XIX y en las guerras de los Balcanes (1912–1913) perdió la mayor parte de sus territorios en Europa.\n' +
          '- En 1914 entró en la Primera Guerra Mundial junto a Alemania y Austria-Hungría, y terminó entre los vencidos.\n' +
          '- Durante la guerra, el gobierno otomano deportó a la población armenia de Anatolia y cientos de miles de personas murieron; muchos historiadores y países lo reconocen como genocidio.\n' +
          '- Desde finales del siglo XIX crecía un nacionalismo turco que buscaba una identidad común distinta de la imperial.',
      },
    },
    {
      id: 'cronologia',
      version: 1,
      tipo: 'linea-tiempo',
      orden: 2,
      origen: 'ejemplo',
      titulo: 'Línea de tiempo, 1918–1924',
      accesibilidad: acc('Línea de tiempo desde el armisticio de 1918 hasta la abolición del califato en 1924.'),
      contenido: {
        eventos: [
          { id: 'mudros', fecha: '30 de octubre de 1918', orden: 1918.83, titulo: 'Armisticio de Mudros', texto: 'El Imperio otomano se rinde ante los Aliados; tropas extranjeras ocupan puntos clave del territorio.' },
          { id: 'esmirna', fecha: '15 de mayo de 1919', orden: 1919.37, titulo: 'Desembarco griego en Esmirna', texto: 'Tropas griegas ocupan Esmirna (İzmir); la ocupación impulsa la resistencia en Anatolia.' },
          { id: 'samsun', fecha: '19 de mayo de 1919', orden: 1919.38, titulo: 'Mustafa Kemal llega a Samsun', texto: 'Se suele tomar como el inicio del movimiento nacional y de la Guerra de Independencia.' },
          { id: 'asamblea', fecha: '23 de abril de 1920', orden: 1920.31, titulo: 'Se abre la Gran Asamblea Nacional en Ankara', texto: 'Un parlamento y un gobierno propios, distintos del gobierno del sultán en Estambul.' },
          { id: 'sevres', fecha: '10 de agosto de 1920', orden: 1920.61, titulo: 'Tratado de Sèvres', texto: 'El gobierno del sultán firma un reparto de Anatolia entre los vencedores; el movimiento de Ankara lo rechaza y nunca entra en vigor.' },
          { id: 'sakarya', fecha: 'agosto–septiembre de 1921', orden: 1921.65, titulo: 'Batalla del Sakarya', texto: 'El avance griego hacia Ankara se detiene.' },
          { id: 'ofensiva', fecha: 'agosto–septiembre de 1922', orden: 1922.68, titulo: 'Gran Ofensiva y entrada en Esmirna', texto: 'El ejército de Ankara vence y entra en Esmirna el 9 de septiembre: termina la guerra en Anatolia.' },
          { id: 'sultanato', fecha: '1 de noviembre de 1922', orden: 1922.83, titulo: 'Abolición del sultanato', texto: 'La Asamblea pone fin al gobierno de la dinastía otomana.' },
          { id: 'lausana', fecha: '24 de julio de 1923', orden: 1923.56, titulo: 'Tratado de Lausana', texto: 'Reconoce internacionalmente las fronteras de la nueva Turquía y reemplaza al de Sèvres. Ese año también se acuerda un intercambio obligatorio de población con Grecia.' },
          { id: 'republica', fecha: '29 de octubre de 1923', orden: 1923.82, titulo: 'Proclamación de la República', texto: 'Ankara ya era la capital desde el 13 de octubre; Mustafa Kemal es elegido presidente.' },
          { id: 'califato', fecha: '3 de marzo de 1924', orden: 1924.17, titulo: 'Abolición del califato', texto: 'Comienzan las reformas que separan el Estado de la autoridad religiosa.' },
        ],
      },
    },
    {
      id: 'conceptos',
      version: 1,
      tipo: 'comparacion',
      orden: 3,
      origen: 'ejemplo',
      titulo: 'Del imperio a la nación',
      accesibilidad: acc('Comparación entre el Imperio otomano y la República de Turquía: quién gobierna, quiénes la forman, capital y fuente del poder.'),
      contenido: {
        columnas: [
          { id: 'imperio', titulo: 'Imperio otomano', puntos: ['Gobierna un sultán de la dinastía otomana, que también es califa.', 'Súbditos de muchos pueblos y religiones.', 'Capital: Estambul.', 'El poder viene de la dinastía y de la religión.'] },
          { id: 'republica', titulo: 'República de Turquía', puntos: ['Gobiernan una asamblea elegida y un presidente.', 'Ciudadanos de una nación, con la identidad turca como base común.', 'Capital: Ankara.', 'El poder viene de la nación (soberanía nacional).'] },
        ],
      },
    },
    {
      id: 'glosario',
      version: 1,
      tipo: 'tabla',
      orden: 4,
      origen: 'ejemplo',
      titulo: 'Conceptos clave',
      accesibilidad: acc('Tabla con cuatro conceptos clave del tema y su significado en este caso.'),
      contenido: {
        columnas: ['Concepto', 'Qué significa aquí'],
        filas: [
          { id: 'nacion', celdas: ['Nación', 'Comunidad que se reconoce con una identidad, una historia y un destino comunes.'] },
          { id: 'estado-nacion', celdas: ['Estado nacional', 'Estado que se organiza en nombre de una nación; la República de Turquía reemplaza a un imperio de muchos pueblos.'] },
          { id: 'soberania', celdas: ['Soberanía nacional', 'La idea de que el poder político pertenece a la nación y no a una dinastía.'] },
          { id: 'tratado', celdas: ['Tratado de paz', 'Acuerdo entre Estados al terminar una guerra; aquí, Sèvres (rechazado) y Lausana (reconocido).'] },
        ],
      },
    },
    {
      id: 'comprueba',
      version: 1,
      tipo: 'ejercicio',
      orden: 5,
      origen: 'ejemplo',
      titulo: 'Comprueba lo que entendiste',
      accesibilidad: acc('Actividad de opción múltiple sobre el tratado que reconoció las fronteras de Turquía.'),
      contenido: {
        modo: 'opcion',
        enunciado: '¿Qué tratado reconoció internacionalmente las fronteras de la nueva Turquía?',
        opciones: [
          { id: 'sevres', texto: 'El Tratado de Sèvres (1920)' },
          { id: 'lausana', texto: 'El Tratado de Lausana (1923)' },
          { id: 'versalles', texto: 'El Tratado de Versalles (1919)' },
        ],
        correcta: 'lausana',
        pista: 'Busca en la línea de tiempo el tratado que reemplazó al que el movimiento de Ankara rechazó.',
        explicacion: 'Lausana (24 de julio de 1923) reemplazó a Sèvres, que nunca entró en vigor. Versalles fue el tratado con Alemania.',
      },
    },
  ],
  recorrido: [
    { titulo: 'La derrota', texto: 'En 1918 el Imperio otomano se rinde: los vencedores ocupan parte de su territorio.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'cronologia' }, { accion: 'resaltar', bloqueId: 'cronologia', objetivo: 'mudros' }] },
    { titulo: 'La resistencia', texto: 'En 1919 empieza en Anatolia un movimiento nacional, y en 1920 forma su propia Asamblea en Ankara.', acciones: [{ accion: 'resaltar', bloqueId: 'cronologia', objetivo: 'asamblea' }] },
    { titulo: 'Dos tratados', texto: 'Sèvres (1920) repartía Anatolia y fue rechazado; tras la victoria de 1922, Lausana (1923) reconoció las fronteras.', acciones: [{ accion: 'resaltar', bloqueId: 'cronologia', objetivo: 'lausana' }] },
    { titulo: 'La República', texto: 'En 1923 se proclama la República; en 1924 se abole el califato. Compara el antes y el después.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'conceptos' }, { accion: 'resaltar', bloqueId: 'conceptos', objetivo: 'republica' }] },
  ],
};
