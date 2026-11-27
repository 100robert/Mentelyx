import type { ActividadApi, PreparacionVista } from '../preparaciones/modelo';
import type { Tarjeta } from '../tarjetas/tarjetas';

/**
 * Preparaciones de ejemplo (rotuladas «Ejemplo ilustrativo»): no son de la cuenta, no se guardan y no aparecen en la
 * lista de preparaciones. Sirven para practicar con el banco de preguntas, las tarjetas y el simulacro mientras el
 * backend no ofrece bancos propios (diseño de API, sección 12.9). El plan sigue la misma regla que el servidor.
 */
export type Ejemplo = { clave: string; preparacion: PreparacionVista; descripcion: string; banco: unknown[]; tarjetas: Tarjeta[]; estudio: Record<string, string> };

function plan(temas: Array<{ codigo: string; titulo: string }>, area: string): ActividadApi[] {
  return temas.flatMap((t, i) =>
    (['LECCION', 'PRACTICA'] as const).map((tipo, j) => ({
      id: `${t.codigo}-${tipo.toLowerCase()}`,
      orden: i * 2 + j + 1,
      areaCodigo: area,
      temaCodigo: t.codigo,
      titulo: `${tipo === 'LECCION' ? 'Estudiar' : 'Practicar'}: ${t.titulo}`,
      tipo,
      fechaLimite: null,
      minutosEstimados: 40,
      estado: 'PENDIENTE' as const,
      completadaEn: null,
    })),
  );
}

const acc = (descripcion: string) => ({ descripcion });
const TEMAS_CALCULO = [
  { codigo: 'T01', titulo: 'Límites', origen: 'persona' as const },
  { codigo: 'T02', titulo: 'Derivada por definición', origen: 'persona' as const },
  { codigo: 'T03', titulo: 'Reglas de derivación', origen: 'persona' as const },
  { codigo: 'T04', titulo: 'Aplicaciones de la derivada', origen: 'persona' as const },
];
const actividadesCalculo = plan(TEMAS_CALCULO, 'CALCULO-DIFERENCIAL');

const GRAFICO_PARABOLA = {
  id: 'parabola',
  version: 1,
  tipo: 'grafico',
  orden: 0,
  origen: 'ejemplo',
  titulo: 'f(x) = x² − 4x + 3',
  accesibilidad: acc('Gráfico de la parábola f(x) = x² − 4x + 3 entre x = −1 y x = 5.'),
  contenido: { vista: { xMin: -1, xMax: 5, yMin: -2, yMax: 6 }, ejes: { x: 'x', y: 'y' }, funciones: [{ id: 'f', expresion: 'x^2 - 4x + 3', color: 'serie1', etiqueta: 'f(x) = x² − 4x + 3' }] },
};

export const CALCULO: Ejemplo = {
  clave: 'calculo-diferencial',
  descripcion: 'Un parcial de cálculo diferencial con temario, plan, tarjetas, banco de preguntas y simulacro.',
  preparacion: {
    id: 'ejemplo-calculo-diferencial',
    modo: 'ejemplo',
    nombre: 'Examen parcial de cálculo diferencial',
    asignatura: 'Cálculo diferencial',
    fechaExamen: null,
    minutosSemanales: 240,
    fuente: 'PERSONAL',
    temas: TEMAS_CALCULO,
    actividades: actividadesCalculo,
    avance: { completadas: 0, total: actividadesCalculo.length },
    archivada: false,
    reglaPlan: 'plan-determinista-v1 (aplicada en el navegador para este ejemplo)',
  },
  estudio: { T02: 'derivadas' },
  tarjetas: [
    { id: 'c1', tema: 'Derivada por definición', frente: '¿Cómo se define la derivada de f en x?', reverso: 'Como el límite del cociente incremental cuando h tiende a cero.', latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}" },
    { id: 'c2', tema: 'Aplicaciones de la derivada', frente: '¿Qué representa f′(a) en la gráfica de f?', reverso: 'La pendiente de la recta tangente a la gráfica en el punto (a, f(a)).' },
    { id: 'c3', tema: 'Reglas de derivación', frente: 'Derivada de xⁿ', reverso: 'n · xⁿ⁻¹ (regla de la potencia).', latex: '\\frac{d}{dx}\\,x^n = n\\,x^{n-1}' },
    { id: 'c4', tema: 'Reglas de derivación', frente: 'Regla del producto', reverso: 'La derivada de un producto es la primera derivada por la segunda más la primera por la derivada de la segunda.', latex: "(f\\,g)' = f'\\,g + f\\,g'" },
    { id: 'c5', tema: 'Reglas de derivación', frente: 'Regla de la cadena', reverso: 'Se deriva la función exterior evaluada en la interior y se multiplica por la derivada de la interior.', latex: "(f \\circ g)'(x) = f'(g(x))\\,g'(x)" },
    { id: 'c6', tema: 'Aplicaciones de la derivada', frente: '¿Cuándo es horizontal la recta tangente?', reverso: 'Cuando la derivada vale cero en ese punto: f′(a) = 0. Allí puede haber un máximo, un mínimo o un punto de inflexión.' },
    { id: 'c7', tema: 'Reglas de derivación', frente: 'Derivadas de sin x y cos x', reverso: '(sin x)′ = cos x y (cos x)′ = −sin x.' },
    { id: 'c8', tema: 'Aplicaciones de la derivada', frente: 'Si f′(x) > 0 en un intervalo, ¿qué le pasa a f?', reverso: 'f es creciente en ese intervalo.', fragmento: 'Apuntes de derivadas, página 1: «Si f ′(x) > 0, la función crece; si f ′(x) < 0, decrece».' },
  ],
  banco: [
    { id: 'lim-factor', version: 1, tipo: 'opcion-unica', tema: 'Límites', dificultad: 'basica', origen: 'ejemplo', enunciado: '¿Cuánto vale el límite de (x² − 4)/(x − 2) cuando x tiende a 2?', opciones: [{ id: 'a', texto: '0' }, { id: 'b', texto: '2' }, { id: 'c', texto: '4' }, { id: 'd', texto: 'No existe' }], correcta: 'c', explicacion: 'Para x ≠ 2, (x² − 4)/(x − 2) = (x − 2)(x + 2)/(x − 2) = x + 2. Al acercarse x a 2, el valor se acerca a 4, aunque la expresión no esté definida en x = 2.' },
    { id: 'lim-definida', version: 1, tipo: 'verdadero-falso', tema: 'Límites', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Si f(a) no está definida, el límite de f(x) cuando x tiende a a no puede existir.', correcta: false, explicacion: 'El límite depende de los valores de f cerca de a, no en a. En la pregunta anterior el límite existe (vale 4) aunque la expresión no está definida en x = 2.' },
    { id: 'lim-infinito', version: 1, tipo: 'opcion-unica', tema: 'Límites', dificultad: 'media', origen: 'ejemplo', enunciado: '¿Cuánto vale el límite de (3x² + 1)/(x² − 5) cuando x tiende a infinito?', opciones: [{ id: 'a', texto: '0' }, { id: 'b', texto: '1' }, { id: 'c', texto: '3' }, { id: 'd', texto: 'Infinito' }], correcta: 'c', explicacion: 'Al dividir numerador y denominador entre x², queda (3 + 1/x²)/(1 − 5/x²), que tiende a 3.' },
    { id: 'def-numero', version: 1, tipo: 'numerica', tema: 'Derivada por definición', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Para f(x) = x² − 4x + 3, calcula f′(1).', respuesta: -2, tolerancia: { tipo: 'absoluta', valor: 1e-6 }, explicacion: 'f′(x) = 2x − 4, así que f′(1) = 2 − 4 = −2.' },
    { id: 'def-orden', version: 1, tipo: 'ordenamiento', tema: 'Derivada por definición', dificultad: 'media', origen: 'ejemplo', enunciado: 'Ordena los pasos para derivar f(x) = x² por la definición.', elementos: [{ id: 'limite', texto: 'Tomar el límite cuando h tiende a 0: queda 2x' }, { id: 'cociente', texto: 'Escribir el cociente [f(x + h) − f(x)] / h' }, { id: 'simplificar', texto: 'Simplificar y dividir entre h (h ≠ 0): queda 2x + h' }, { id: 'desarrollar', texto: 'Desarrollar f(x + h) = x² + 2xh + h²' }], orden: ['cociente', 'desarrollar', 'simplificar', 'limite'], explicacion: 'Primero se plantea el cociente, luego se desarrolla y simplifica, y solo al final se toma el límite: antes de eso h no puede ser cero.' },
    { id: 'reg-polinomio', version: 1, tipo: 'expresion', tema: 'Reglas de derivación', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Deriva f(x) = 3x² + 2x − 5.', prefijo: "f'(x) =", respuesta: '6x + 2', variables: ['x'], dominio: { min: -5, max: 5 }, explicacion: 'Regla de la potencia en cada término: (3x²)′ = 6x, (2x)′ = 2 y la constante se anula.' },
    { id: 'reg-producto', version: 1, tipo: 'expresion', tema: 'Reglas de derivación', dificultad: 'media', origen: 'ejemplo', enunciado: 'Deriva f(x) = x · sin(x).', prefijo: "f'(x) =", respuesta: 'sin(x) + x*cos(x)', variables: ['x'], dominio: { min: -4, max: 4 }, explicacion: 'Regla del producto: (x)′ · sin x + x · (sin x)′ = sin x + x cos x.' },
    { id: 'reg-multiple', version: 1, tipo: 'opcion-multiple', tema: 'Reglas de derivación', dificultad: 'media', origen: 'ejemplo', enunciado: '¿Cuáles de estas derivadas son correctas?', opciones: [{ id: 'a', texto: '(x³)′ = 3x²' }, { id: 'b', texto: '(sin x)′ = −cos x' }, { id: 'c', texto: '(eˣ)′ = eˣ' }, { id: 'd', texto: '(ln x)′ = 1/x, para x > 0' }, { id: 'e', texto: '(√x)′ = 1/√x' }], correctas: ['a', 'c', 'd'], explicacion: '(sin x)′ = cos x y (√x)′ = 1/(2√x).' },
    { id: 'reg-relacion', version: 1, tipo: 'relacion', tema: 'Reglas de derivación', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Relaciona cada función con su derivada.', pares: [{ id: 'p1', izquierda: 'x²', derecha: '2x' }, { id: 'p2', izquierda: 'sin x', derecha: 'cos x' }, { id: 'p3', izquierda: 'eˣ', derecha: 'eˣ' }, { id: 'p4', izquierda: 'ln x', derecha: '1/x' }], explicacion: 'Son derivadas básicas que conviene reconocer de inmediato.' },
    { id: 'apl-grafico', version: 1, tipo: 'numerica', tema: 'Aplicaciones de la derivada', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Observa la gráfica. ¿En qué valor de x la recta tangente es horizontal?', apoyo: GRAFICO_PARABOLA, respuesta: 2, tolerancia: { tipo: 'absoluta', valor: 0.01 }, explicacion: 'La tangente es horizontal donde f′(x) = 2x − 4 = 0, es decir, en x = 2: el vértice de la parábola.' },
    { id: 'apl-velocidad', version: 1, tipo: 'numerica', tema: 'Aplicaciones de la derivada', dificultad: 'media', origen: 'ejemplo', enunciado: 'Un objeto se mueve según s(t) = 5t² (metros, t en segundos). ¿Cuál es su velocidad instantánea en t = 3 s?', respuesta: 30, unidad: 'm/s', tolerancia: { tipo: 'relativa', valor: 0.01 }, explicacion: 'La velocidad es la derivada de la posición: v(t) = 10t, así que v(3) = 30 m/s.' },
    { id: 'apl-tangente', version: 1, tipo: 'expresion', tema: 'Aplicaciones de la derivada', dificultad: 'avanzada', origen: 'ejemplo', enunciado: 'Escribe la recta tangente a f(x) = x² en x = 3.', prefijo: 'y =', respuesta: '6x - 9', variables: ['x'], dominio: { min: -10, max: 10 }, explicacion: 'f(3) = 9 y f′(3) = 6, así que y = 9 + 6(x − 3) = 6x − 9.' },
    {
      id: 'apl-explica',
      version: 1,
      tipo: 'abierta',
      tema: 'Aplicaciones de la derivada',
      dificultad: 'media',
      origen: 'ejemplo',
      enunciado: 'Explica con tus palabras por qué la derivada en un punto es la pendiente de la recta tangente.',
      criterios: ['Menciona la recta secante entre dos puntos de la curva.', 'Explica que el segundo punto se acerca al primero (h tiende a 0).', 'Relaciona el límite de las pendientes de las secantes con la pendiente de la tangente.'],
      respuestaModelo: 'La pendiente de la secante entre (x, f(x)) y (x + h, f(x + h)) es [f(x + h) − f(x)]/h. Al acercar el segundo punto al primero (h → 0), la secante se convierte en la tangente; por eso el límite de esas pendientes, que es la derivada, es la pendiente de la tangente.',
    },
    {
      id: 'apl-caso',
      version: 1,
      tipo: 'caso',
      tema: 'Aplicaciones de la derivada',
      dificultad: 'avanzada',
      origen: 'ejemplo',
      enunciado: 'Analiza el caso y responde.',
      caso: 'Una empresa estima su costo de producción como C(q) = q² − 10q + 40 (en miles de soles), donde q son cientos de unidades.',
      preguntas: [
        { id: 'minimo', tipo: 'numerica', enunciado: '¿Para qué valor de q el costo es mínimo?', respuesta: 5, tolerancia: { tipo: 'absoluta', valor: 0.01 } },
        { id: 'costo', tipo: 'numerica', enunciado: '¿Cuál es ese costo mínimo, en miles de soles?', respuesta: 15, tolerancia: { tipo: 'absoluta', valor: 0.01 } },
        { id: 'justifica', tipo: 'abierta', enunciado: '¿Cómo justificas que es un mínimo y no un máximo?', criterios: ['Usa el signo de la derivada antes y después de q = 5, la segunda derivada positiva o que la parábola abre hacia arriba.'], respuestaModelo: 'C′(q) = 2q − 10 es negativa antes de q = 5 y positiva después; además C″(q) = 2 > 0. Es un mínimo.' },
      ],
      explicacion: 'C′(q) = 2q − 10 = 0 en q = 5, y C(5) = 25 − 50 + 40 = 15.',
    },
  ],
};

const MODELO_MOTOR = {
  id: 'motor',
  version: 1,
  tipo: 'modelo-3d',
  orden: 0,
  origen: 'ejemplo',
  titulo: 'Motor de cuatro tiempos',
  accesibilidad: acc('Modelo 3D de un motor monocilíndrico en corte con sus piezas.'),
  contenido: {
    modelo: { tipo: 'catalogo', clave: 'motor-4t' },
    partes: ['culata', 'bujia', 'admision', 'escape', 'piston', 'biela', 'ciguenal', 'cilindro'].map((id) => ({ id, nombre: id, texto: '' })),
  },
};
const MODELO_METANO = {
  id: 'metano',
  version: 1,
  tipo: 'modelo-3d',
  orden: 0,
  origen: 'ejemplo',
  titulo: 'Molécula de metano',
  accesibilidad: acc('Modelo 3D de una molécula de metano.'),
  contenido: { modelo: { tipo: 'catalogo', clave: 'metano' }, partes: ['carbono', 'h1', 'h2', 'h3', 'h4', 'enlaces'].map((id) => ({ id, nombre: id, texto: '' })) },
};
const OBRA = {
  id: 'ola',
  version: 1,
  tipo: 'obra',
  orden: 0,
  origen: 'ejemplo',
  titulo: 'La gran ola',
  referencias: [{ id: 'credito', tipo: 'credito', titulo: 'Bajo la ola en alta mar frente a Kanagawa (La gran ola)', autor: 'Katsushika Hokusai', fecha: 'c. 1830–1832', institucion: 'The Metropolitan Museum of Art (JP1847)', licencia: 'Dominio público (Open Access, CC0)', enlace: 'https://www.metmuseum.org/art/collection/search/45434' }],
  accesibilidad: acc('Estampa de Hokusai con regiones marcadas para identificar.'),
  contenido: {
    imagen: { src: '/recursos/obras/hokusai-gran-ola-1400.webp', srcChica: '/recursos/obras/hokusai-gran-ola-760.webp', ancho: 1400, alto: 941 },
    regiones: [
      { id: 'ola', etiqueta: 'Región', texto: '', forma: { tipo: 'rect', desde: [240, 83], hasta: [829, 608] } },
      { id: 'fuji', etiqueta: 'Región', texto: '', forma: { tipo: 'circulo', centro: [893, 640], radio: 90 } },
      { id: 'ola-pequena', etiqueta: 'Región', texto: '', forma: { tipo: 'circulo', centro: [488, 530], radio: 110 } },
      { id: 'barca', etiqueta: 'Región', texto: '', forma: { tipo: 'rect', desde: [562, 718], hasta: [1041, 903] } },
      { id: 'cartela', etiqueta: 'Región', texto: '', forma: { tipo: 'rect', desde: [15, 55], hasta: [138, 304] } },
    ],
  },
};

const TEMAS_MULTI = ['Ingeniería mecánica', 'Química', 'Arte', 'Física', 'Economía', 'Astronomía', 'Literatura', 'Informática', 'Historia', 'Biología'].map((titulo, k) => ({ codigo: `M${String(k + 1).padStart(2, '0')}`, titulo, origen: 'persona' as const }));
const actividadesMulti = plan(TEMAS_MULTI, 'MUESTRA');

export const MULTIDISCIPLINAR: Ejemplo = {
  clave: 'multidisciplinar',
  descripcion: 'Una muestra de los tipos de pregunta entre disciplinas, con los mismos visores del núcleo educativo.',
  preparacion: {
    id: 'ejemplo-multidisciplinar',
    modo: 'ejemplo',
    nombre: 'Muestra de preguntas entre disciplinas',
    asignatura: 'Varias disciplinas',
    fechaExamen: null,
    minutosSemanales: null,
    fuente: 'PERSONAL',
    temas: TEMAS_MULTI,
    actividades: actividadesMulti,
    avance: { completadas: 0, total: actividadesMulti.length },
    archivada: false,
    reglaPlan: 'plan-determinista-v1 (aplicada en el navegador para este ejemplo)',
  },
  estudio: {},
  tarjetas: [
    { id: 'm1', tema: 'Física', frente: 'Módulo de la suma de dos vectores perpendiculares', reverso: 'Se obtiene con el teorema de Pitágoras.', latex: '|\\vec R| = \\sqrt{F_1^2 + F_2^2}' },
    { id: 'm2', tema: 'Química', frente: 'Combustión completa del metano', reverso: 'Metano y oxígeno producen dióxido de carbono y agua.', latex: '\\ce{CH4 + 2O2 -> CO2 + 2H2O}' },
    { id: 'm3', tema: 'Astronomía', frente: 'Tercera ley de Kepler', reverso: 'El cuadrado del período es proporcional al cubo de la distancia media al Sol (en años y UA, T² = a³).' },
  ],
  banco: [
    { id: 'ing-bujia', version: 1, tipo: 'identificar', tema: 'Ingeniería mecánica', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Señala la pieza que produce la chispa que enciende la mezcla.', objeto: MODELO_MOTOR, correcta: 'bujia', explicacion: 'La bujía produce la chispa cerca del punto muerto superior, al final de la compresión.' },
    { id: 'ing-caso', version: 1, tipo: 'caso', tema: 'Ingeniería mecánica', dificultad: 'avanzada', origen: 'ejemplo', enunciado: 'Analiza el caso.', caso: 'Un motor de cuatro tiempos gira a 3000 revoluciones por minuto.', preguntas: [{ id: 'ciclos', tipo: 'numerica', enunciado: '¿Cuántos ciclos completos de cuatro tiempos realiza por minuto?', respuesta: 1500, tolerancia: { tipo: 'absoluta', valor: 0 } }, { id: 'trabajo', tipo: 'abierta', enunciado: '¿Por qué solo uno de los cuatro tiempos entrega trabajo?', criterios: ['Identifica la combustión (expansión) como el tiempo en que los gases empujan el pistón.', 'Explica que admisión, compresión y escape consumen energía en lugar de entregarla.'] }], explicacion: 'Cada ciclo ocupa dos vueltas del cigüeñal (720°): 3000 / 2 = 1500 ciclos por minuto.' },
    { id: 'qui-carbono', version: 1, tipo: 'identificar', tema: 'Química', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Señala el átomo central de la molécula de metano.', objeto: MODELO_METANO, correcta: 'carbono', explicacion: 'El carbono ocupa el centro y forma cuatro enlaces con los hidrógenos, dirigidos a los vértices de un tetraedro.' },
    { id: 'qui-combustion', version: 1, tipo: 'verdadero-falso', tema: 'Química', dificultad: 'basica', origen: 'ejemplo', enunciado: 'En la combustión completa del metano se producen dióxido de carbono y agua.', correcta: true, explicacion: 'CH₄ + 2 O₂ → CO₂ + 2 H₂O.' },
    { id: 'art-eco', version: 1, tipo: 'identificar', tema: 'Arte', dificultad: 'media', origen: 'ejemplo', enunciado: '¿Qué región repite en pequeño la silueta del monte Fuji?', objeto: OBRA, correcta: 'ola-pequena', explicacion: 'La pequeña ola del primer plano tiene forma de montaña con la cumbre blanca: un eco del Fuji del fondo.' },
    { id: 'art-composicion', version: 1, tipo: 'abierta', tema: 'Arte', dificultad: 'media', origen: 'ejemplo', enunciado: 'Describe cómo la composición de La gran ola hace pequeño al monte Fuji.', criterios: ['Menciona el tamaño y la posición del Fuji al fondo.', 'Menciona el hueco o el arco de la ola que lo enmarca.', 'Menciona el horizonte bajo o la escala de las barcas.'] },
    {
      id: 'fis-resultante',
      version: 1,
      tipo: 'numerica',
      tema: 'Física',
      dificultad: 'basica',
      origen: 'ejemplo',
      enunciado: 'Dos fuerzas perpendiculares actúan sobre el mismo punto, como en el diagrama. ¿Cuál es el módulo de la fuerza resultante?',
      apoyo: { id: 'fuerzas', version: 1, tipo: 'vectores', orden: 0, origen: 'ejemplo', titulo: 'Fuerzas', accesibilidad: acc('Dos fuerzas: 3 N hacia la derecha y 4 N hacia arriba.'), contenido: { vista: { xMin: -1, xMax: 5, yMin: -1, yMax: 5 }, unidad: 'N', vectores: [{ id: 'f1', origen: [0, 0], componentes: [3, 0], color: 'serie1', etiqueta: 'F₁' }, { id: 'f2', origen: [0, 0], componentes: [0, 4], color: 'serie3', etiqueta: 'F₂' }] } },
      respuesta: 5,
      unidad: 'N',
      tolerancia: { tipo: 'relativa', valor: 0.01 },
      explicacion: '√(3² + 4²) = √25 = 5 N.',
    },
    {
      id: 'eco-equilibrio',
      version: 1,
      tipo: 'opcion-unica',
      tema: 'Economía',
      dificultad: 'media',
      origen: 'ejemplo',
      enunciado: 'Si la demanda aumenta (su curva se desplaza a la derecha) y la oferta no cambia, ¿qué ocurre con el precio de equilibrio?',
      apoyo: { id: 'mercado', version: 1, tipo: 'grafico', orden: 0, origen: 'ejemplo', titulo: 'Oferta y demanda', accesibilidad: acc('Curva de demanda decreciente y de oferta creciente; un deslizador desplaza la demanda.'), contenido: { vista: { xMin: 0, xMax: 10, yMin: 0, yMax: 14 }, ejes: { x: 'Cantidad (Q)', y: 'Precio (P)' }, parametros: [{ id: 'd', etiqueta: 'Aumento de la demanda', min: 0, max: 4, paso: 0.5, valor: 0 }], funciones: [{ id: 'demanda', expresion: '10 + d - x', color: 'serie3', etiqueta: 'Demanda' }, { id: 'oferta', expresion: '2 + x', color: 'serie1', etiqueta: 'Oferta' }] } },
      opciones: [{ id: 'a', texto: 'Sube' }, { id: 'b', texto: 'Baja' }, { id: 'c', texto: 'No cambia' }],
      correcta: 'a',
      explicacion: 'Con la oferta fija, una demanda mayor corta la oferta más arriba: suben el precio y la cantidad de equilibrio.',
    },
    {
      id: 'ast-kepler',
      version: 1,
      tipo: 'numerica',
      tema: 'Astronomía',
      dificultad: 'media',
      origen: 'ejemplo',
      enunciado: 'Según la tercera ley de Kepler (T² = a³, con T en años y a en UA), ¿cuál es el período de un planeta a 4 UA del Sol?',
      apoyo: { id: 'kepler', version: 1, tipo: 'grafico', orden: 0, origen: 'ejemplo', titulo: 'Tercera ley de Kepler', accesibilidad: acc('Curva del período en función de la distancia, con la Tierra y Marte.'), contenido: { vista: { xMin: 0, xMax: 6, yMin: 0, yMax: 14 }, ejes: { x: 'a (UA)', y: 'T (años)' }, funciones: [{ id: 'ley', expresion: 'x^(3/2)', color: 'serie1', etiqueta: 'T = a^(3/2)' }], puntos: [{ id: 'tierra', x: 1, en: 'ley', etiqueta: 'Tierra' }, { id: 'marte', x: 1.524, en: 'ley', etiqueta: 'Marte' }] } },
      respuesta: 8,
      unidad: 'años',
      tolerancia: { tipo: 'relativa', valor: 0.01 },
      explicacion: 'T = a^(3/2) = 4^(3/2) = 8 años.',
    },
    {
      id: 'lit-figura',
      version: 1,
      tipo: 'opcion-unica',
      tema: 'Literatura',
      dificultad: 'basica',
      origen: 'ejemplo',
      enunciado: '¿Qué figura retórica predomina en el fragmento?',
      apoyo: { id: 'fragmento', version: 1, tipo: 'texto', orden: 0, origen: 'ejemplo', titulo: 'Fragmento escrito por Mentelyx', accesibilidad: acc('Fragmento literario breve.'), contenido: { markdown: '«El viento, cansado, se recostaba en los tejados y suspiraba entre las chimeneas.»' } },
      opciones: [{ id: 'a', texto: 'Hipérbole' }, { id: 'b', texto: 'Personificación' }, { id: 'c', texto: 'Anáfora' }, { id: 'd', texto: 'Símil' }],
      correcta: 'b',
      explicacion: 'Se atribuyen al viento acciones humanas: cansarse, recostarse y suspirar.',
    },
    {
      id: 'inf-codigo',
      version: 1,
      tipo: 'opcion-unica',
      tema: 'Informática',
      dificultad: 'basica',
      origen: 'ejemplo',
      enunciado: '¿Qué imprime este programa? (Mentelyx no lo ejecuta: se lee).',
      apoyo: { id: 'programa', version: 1, tipo: 'codigo', orden: 0, origen: 'ejemplo', titulo: 'Programa en Python', accesibilidad: acc('Función que suma los enteros de 1 a n.'), contenido: { lenguaje: 'python', codigo: 'def f(n):\n    total = 0\n    for i in range(1, n + 1):\n        total += i\n    return total\n\n\nprint(f(4))' } },
      opciones: [{ id: 'a', texto: '4' }, { id: 'b', texto: '6' }, { id: 'c', texto: '10' }, { id: 'd', texto: '16' }],
      correcta: 'c',
      explicacion: 'range(1, 5) recorre 1, 2, 3 y 4; su suma es 10.',
    },
    { id: 'his-orden', version: 1, tipo: 'ordenamiento', tema: 'Historia', dificultad: 'media', origen: 'ejemplo', enunciado: 'Ordena cronológicamente estos hechos de la Revolución francesa.', elementos: [{ id: 'ejecucion', texto: 'Ejecución de Luis XVI' }, { id: 'bastilla', texto: 'Toma de la Bastilla' }, { id: 'brumario', texto: 'Golpe del 18 de brumario' }, { id: 'declaracion', texto: 'Declaración de los Derechos del Hombre y del Ciudadano' }, { id: 'republica', texto: 'Fin de la monarquía y Primera República' }], orden: ['bastilla', 'declaracion', 'republica', 'ejecucion', 'brumario'], explicacion: 'Julio de 1789, agosto de 1789, septiembre de 1792, enero de 1793 y noviembre de 1799.' },
    { id: 'bio-relacion', version: 1, tipo: 'relacion', tema: 'Biología', dificultad: 'basica', origen: 'ejemplo', enunciado: 'Relaciona cada estructura de la célula con su función.', pares: [{ id: 'cloroplasto', izquierda: 'Cloroplasto', derecha: 'Fotosíntesis' }, { id: 'mitocondria', izquierda: 'Mitocondria', derecha: 'Respiración celular' }, { id: 'pared', izquierda: 'Pared celular', derecha: 'Soporte y protección de la célula vegetal' }, { id: 'nucleo', izquierda: 'Núcleo', derecha: 'Contiene el material genético' }] },
  ],
};

export const EJEMPLOS: readonly Ejemplo[] = [CALCULO, MULTIDISCIPLINAR];
export const ejemplo = (clave: string) => EJEMPLOS.find((e) => e.clave === clave) ?? null;
export const ejemploPorId = (id: string) => EJEMPLOS.find((e) => e.preparacion.id === id) ?? null;
