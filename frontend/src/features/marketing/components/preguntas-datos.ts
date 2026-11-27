/** Preguntas de la narrativa «Todo empieza con una pregunta»: compartidas por la portada (índice) y el recorrido. */
export type ClaveEscena = 'ala' | 'corazon' | 'agujero' | 'dinero' | 'ecuacion' | 'obra';

export type Pregunta = {
  id: string;
  area: string;
  pregunta: string;
  respuesta: string;
  /** Pie de la figura, visible. */
  figura: string;
  /** Descripción de la figura para lectores de pantalla (la figura en sí es decorativa). */
  descripcion: string;
  escena: ClaveEscena;
};

export const PREGUNTAS: Pregunta[] = [
  {
    id: 'pregunta-aviones',
    area: 'Física',
    pregunta: '¿Por qué vuelan los aviones?',
    respuesta:
      'El ala desvía el aire hacia abajo y el aire la empuja hacia arriba: la presión es menor sobre ella que debajo. Cuanto más se inclina frente al viento, más sustentación genera, hasta un límite.',
    figura: 'Perfil alar NACA 2412. La sustentación crece con el ángulo de ataque mientras el ala no entra en pérdida.',
    descripcion:
      'Perfil de un ala que se inclina de 0 a 10 grados; la flecha de sustentación se alarga y las líneas de aire se desvían hacia abajo detrás del ala.',
    escena: 'ala',
  },
  {
    id: 'pregunta-corazon',
    area: 'Biología',
    pregunta: '¿Cómo funciona nuestro corazón?',
    respuesta:
      'Son dos bombas que laten a la vez. El lado derecho envía la sangre a los pulmones para que recoja oxígeno; el izquierdo la impulsa hacia todo el cuerpo.',
    figura: 'Circulación doble en esquema. Vista anterior: el lado derecho del corazón aparece a la izquierda.',
    descripcion:
      'Recorrido de la sangre desde el cuerpo por las venas cavas a la aurícula y el ventrículo derechos, por la arteria pulmonar a los pulmones, por las venas pulmonares a la aurícula y el ventrículo izquierdos y por la aorta de vuelta al cuerpo.',
    escena: 'corazon',
  },
  {
    id: 'pregunta-agujero-negro',
    area: 'Astronomía',
    pregunta: '¿Qué ocurre dentro de un agujero negro?',
    respuesta:
      'Nadie lo sabe todavía. Lo que sí comprendemos es su frontera: el horizonte de sucesos, el límite a partir del cual ni siquiera la luz puede escapar.',
    figura: 'Agujero negro sin rotación. Radios en unidades del radio de Schwarzschild; esquema, no a escala.',
    descripcion:
      'Un agujero negro con su disco de acreción. El horizonte de sucesos mide un radio de Schwarzschild, la esfera de fotones 1,5 y la órbita estable más interna 3, donde empieza el disco.',
    escena: 'agujero',
  },
  {
    id: 'pregunta-dinero',
    area: 'Economía',
    pregunta: '¿Por qué cambia el valor del dinero?',
    respuesta:
      'Cuando los precios suben, cada sol compra un poco menos. Con una inflación del 5 % anual, 100 soles dentro de diez años comprarán lo mismo que unos 61 hoy.',
    figura: 'Poder de compra de S/ 100 con inflación anual constante. Ejemplo calculado, no una proyección.',
    descripcion:
      'Curva del poder de compra de 100 soles durante diez años. Sin inflación se mantiene en 100; con 5 % anual baja hasta 61,39.',
    escena: 'dinero',
  },
  {
    id: 'pregunta-ecuacion',
    area: 'Matemáticas',
    pregunta: '¿Cómo se construye una ecuación?',
    respuesta:
      'Una ecuación traduce una situación a símbolos. Después, cada paso conserva el equilibrio: lo que haces de un lado del igual, lo haces también del otro.',
    figura: 'De un enunciado a una ecuación y su solución, paso a paso.',
    descripcion:
      'Dos cuadernos más 3 soles de envío cuestan 11 soles. La ecuación 2x + 3 = 11 se resuelve restando 3 a ambos lados, 2x = 8, y dividiendo entre 2: x = 4.',
    escena: 'ecuacion',
  },
  {
    id: 'pregunta-arte',
    area: 'Arte',
    pregunta: '¿Qué hace que una obra de arte sea significativa?',
    respuesta:
      'Su composición, su técnica y el momento en que nació. En La gran ola, Hokusai deja el monte Fuji pequeño e inmóvil bajo una ola a punto de romper.',
    figura:
      'Katsushika Hokusai, Bajo la ola en alta mar frente a Kanagawa (La gran ola), c. 1830–1832. The Metropolitan Museum of Art, dominio público.',
    descripcion:
      'Grabado en madera de Hokusai. Una ola enorme se curva sobre tres barcas con remeros y, al fondo, pequeño, aparece el monte Fuji. Se señalan el arco de la ola, el Fuji en el centro y las barcas.',
    escena: 'obra',
  },
];
