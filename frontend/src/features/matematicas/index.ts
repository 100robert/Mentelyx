/**
 * Matemáticas deterministas (motor visual): analizador seguro de expresiones, derivación simbólica, cuadrática y
 * muestreo de curvas. Solo código puro, sin React: lo usan los bloques, las actividades y sus pruebas. API pública.
 */
export { aLatex, analizar, derivadaNumerica, derivar, evaluar, FUNCIONES, funcionDe, LIMITES, numeroLatex, simplificar } from './expresion';
export type { Analisis, CodigoExpresion, ErrorExpresion, Nodo } from './expresion';
export { cuadraticaLatex, derivadaLatex, pasosDerivada, pendiente, polinomioLatex, raices, tangente, valor, verificarNumero, vertice } from './cuadratica';
export type { Cuadratica, PasoDerivada, Verificacion } from './cuadratica';
export { acercar, decimal, desplazar, marcas, muestrear, PRESUPUESTO_PUNTOS } from './muestreo';
export type { Vista } from './muestreo';
