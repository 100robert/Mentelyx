import type { Accion, EstadoEspacio } from '@/features/bloques';
import { pasosDerivada, pendiente, polinomioLatex, valor, type Cuadratica } from '@/features/matematicas';
import type { Experiencia } from '../tipos';

const INICIAL: Cuadratica = { a: 1, b: -4, c: 3 };
const P0 = 1;
const acc = (descripcion: string) => ({ descripcion });
const cifra = (n: number) => String(Number(n.toFixed(4))).replace('.', ',').replace('-', '−');

function pasosBloque(q: Cuadratica, p: number) {
  return pasosDerivada(q, p).map((x) => ({ id: x.id, titulo: x.titulo, latex: x.latex, texto: x.explicacion }));
}
function enunciado(q: Cuadratica, p: number) {
  return `Con la función que tienes en el gráfico, f(x) = ${polinomioLatex([[q.a, 'x²'], [q.b, 'x'], [q.c, '']]).replace(/\{,\}/g, ',').replace(/-/g, '−')}, ¿cuánto vale la pendiente de la tangente en x = ${cifra(p)}?`;
}
function explicacion(q: Cuadratica, p: number) {
  return `f′(x) = 2·(${cifra(q.a)})·x + (${cifra(q.b)}). En x = ${cifra(p)}: f′(${cifra(p)}) = ${cifra(pendiente(q, p))}. Es la pendiente de la recta tangente en (${cifra(p)}; ${cifra(valor(q, p))}).`;
}

/**
 * Pizarra de la derivada de una cuadrática: gráfico con a, b, c y el punto de tangencia, procedimiento por la definición,
 * fórmula, tabla de pendientes y actividad. Los vínculos mantienen el procedimiento y la actividad de acuerdo con los
 * deslizadores mediante acciones validadas.
 */
export const derivadas: Experiencia = {
  clave: 'derivadas',
  titulo: 'La derivada de una función cuadrática',
  disciplina: 'Matemáticas',
  descripcion: 'Mueve los coeficientes y el punto de tangencia: la pendiente de la tangente es la derivada en ese punto.',
  contexto: 'Estoy estudiando la derivada de una función cuadrática f(x) = ax² + bx + c con una pizarra que muestra la recta tangente en un punto.',
  bloques: [
    {
      id: 'pizarra',
      version: 1,
      tipo: 'grafico',
      orden: 0,
      origen: 'ejemplo',
      titulo: 'Parábola y recta tangente',
      accesibilidad: acc('Gráfico de una parábola con su recta tangente en un punto móvil. Debajo se lee el punto, el valor de la función y la pendiente de la tangente.'),
      contenido: {
        vista: { xMin: -2, xMax: 6, yMin: -4, yMax: 10 },
        ejes: { x: 'x', y: 'y' },
        parametros: [
          { id: 'a', etiqueta: 'Coeficiente a', min: -3, max: 3, paso: 0.5, valor: INICIAL.a },
          { id: 'b', etiqueta: 'Coeficiente b', min: -6, max: 6, paso: 0.5, valor: INICIAL.b },
          { id: 'c', etiqueta: 'Coeficiente c', min: -5, max: 5, paso: 0.5, valor: INICIAL.c },
          { id: 'p', etiqueta: 'Punto de tangencia x₀', min: -2, max: 6, paso: 0.25, valor: P0 },
        ],
        funciones: [{ id: 'f', expresion: 'a*x^2 + b*x + c', color: 'serie1', etiqueta: 'f(x) = ax² + bx + c' }],
        puntos: [{ id: 'punto', x: 'p', en: 'f', etiqueta: 'P', color: 'peligro' }],
        tangentes: [{ id: 'tangente', funcion: 'f', x: 'p', color: 'acento' }],
      },
    },
    {
      id: 'procedimiento',
      version: 1,
      tipo: 'pasos',
      orden: 1,
      origen: 'ejemplo',
      titulo: 'De la definición a la derivada',
      accesibilidad: acc('Procedimiento en seis pasos: la función, la definición de derivada, el desarrollo, el límite, la pendiente en el punto y la recta tangente.'),
      contenido: { pasos: pasosBloque(INICIAL, P0), revelados: 1 },
    },
    {
      id: 'relacion',
      version: 1,
      tipo: 'formula',
      orden: 2,
      origen: 'ejemplo',
      titulo: 'Derivada y pendiente',
      accesibilidad: acc('La pendiente de la recta tangente en x sub cero es igual a la derivada de f en x sub cero.'),
      contenido: { latex: "m_{\\text{tangente}} = f'(x_0) = \\lim_{h \\to 0} \\frac{f(x_0+h) - f(x_0)}{h}", lectura: 'm tangente es igual a f prima de x sub cero, el límite cuando h tiende a cero del cociente f de x sub cero más h menos f de x sub cero, sobre h.' },
    },
    {
      id: 'pendientes',
      version: 1,
      tipo: 'tabla',
      orden: 3,
      origen: 'ejemplo',
      titulo: 'Pendientes de f(x) = x² − 4x + 3',
      accesibilidad: acc('Tabla con valores de x, de f(x) y de la pendiente f prima de x para la función x al cuadrado menos 4x más 3.'),
      contenido: {
        columnas: ['x', 'f(x)', 'f′(x) = 2x − 4', 'La parábola…'],
        filas: [0, 1, 2, 3, 4].map((x) => {
          const m = pendiente(INICIAL, x);
          return { id: `x${x}`, celdas: [String(x), cifra(valor(INICIAL, x)), cifra(m), m < 0 ? 'baja' : m === 0 ? 'tiene su vértice (tangente horizontal)' : 'sube'] };
        }),
        leyenda: 'Calculado con la derivada f′(x) = 2x − 4.',
      },
    },
    {
      id: 'practica',
      version: 1,
      tipo: 'ejercicio',
      orden: 4,
      origen: 'ejemplo',
      titulo: 'Practica: la pendiente en el punto',
      accesibilidad: acc('Actividad: calcular la pendiente de la tangente en el punto elegido.'),
      contenido: {
        modo: 'numero',
        enunciado: enunciado(INICIAL, P0),
        respuesta: pendiente(INICIAL, P0),
        pista: 'Deriva primero: f′(x) = 2ax + b. Después reemplaza x por x₀.',
        explicacion: explicacion(INICIAL, P0),
      },
    },
  ],
  recorrido: [
    { titulo: 'La parábola', texto: 'Esta es f(x) = x² − 4x + 3. El punto P está en x₀ = 1 y la recta discontinua es la tangente en P.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'pizarra' }, { accion: 'resaltar', bloqueId: 'pizarra', objetivo: 'f' }] },
    { titulo: 'La definición', texto: 'La derivada es el límite de la pendiente de la secante cuando h tiende a cero.', acciones: [{ accion: 'revelar-paso', bloqueId: 'procedimiento', paso: 'p2' }] },
    { titulo: 'Desarrollar y simplificar', texto: 'Al restar f(x + h) − f(x), los términos sin h se cancelan; como h ≠ 0, se puede dividir entre h.', acciones: [{ accion: 'revelar-paso', bloqueId: 'procedimiento', paso: 'p3' }] },
    { titulo: 'La derivada', texto: 'Al tomar el límite queda f′(x) = 2x − 4.', acciones: [{ accion: 'revelar-paso', bloqueId: 'procedimiento', paso: 'p4' }] },
    {
      titulo: 'La pendiente en P',
      texto: 'En x₀ = 1, f′(1) = −2: la tangente baja dos unidades por cada unidad hacia la derecha.',
      acciones: [{ accion: 'revelar-paso', bloqueId: 'procedimiento', paso: 'p6' }, { accion: 'enfocar-bloque', bloqueId: 'pizarra' }, { accion: 'resaltar', bloqueId: 'pizarra', objetivo: 'tangente' }],
    },
    { titulo: 'Tangente horizontal', texto: 'Movemos P a x₀ = 2: ahí f′(2) = 0 y la tangente queda horizontal. Es el vértice de la parábola.', acciones: [{ accion: 'modificar-parametro', bloqueId: 'pizarra', parametro: 'p', valor: 2 }, { accion: 'resaltar', bloqueId: 'pizarra', objetivo: 'punto' }] },
    { titulo: 'Practica', texto: 'Ahora tú: calcula la pendiente en el punto elegido. Puedes mover los deslizadores y la actividad se actualiza.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'practica' }] },
  ],
  vinculos(anterior: EstadoEspacio, nuevo: EstadoEspacio): Accion[] {
    const antes = anterior.interaccion.pizarra?.parametros;
    const ahora = nuevo.interaccion.pizarra?.parametros;
    if (!ahora || !antes || ['a', 'b', 'c', 'p'].every((k) => antes[k] === ahora[k])) return [];
    const q = { a: ahora.a ?? INICIAL.a, b: ahora.b ?? INICIAL.b, c: ahora.c ?? INICIAL.c };
    const p = ahora.p ?? P0;
    return [
      { accion: 'actualizar-bloque', bloqueId: 'procedimiento', contenido: { pasos: pasosBloque(q, p) } },
      { accion: 'actualizar-bloque', bloqueId: 'practica', contenido: { enunciado: enunciado(q, p), respuesta: pendiente(q, p), explicacion: explicacion(q, p) } },
    ];
  },
};
