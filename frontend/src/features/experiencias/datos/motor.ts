import type { Experiencia } from '../tipos';

const acc = (descripcion: string) => ({ descripcion });
const CREDITO = {
  id: 'credito',
  tipo: 'credito' as const,
  titulo: 'Motor monocilíndrico de cuatro tiempos',
  autor: 'Mentelyx (modelo de elaboración propia)',
  licencia: 'Cinemática biela-manivela exacta; tiempos de válvulas simplificados y proporciones ilustrativas',
};

/**
 * El motor de cuatro tiempos en el visor libre: el mismo modelo de la landing, ahora sin desplazamiento, con selección,
 * aislar, ocultar, despiece y el giro del cigüeñal como parámetro. Los tiempos de distribución son los simplificados del
 * modelo (sin cruce de válvulas), y así se dice.
 */
export const motor: Experiencia = {
  clave: 'motor',
  titulo: 'El motor de combustión de cuatro tiempos',
  disciplina: 'Ingeniería mecánica',
  descripcion: 'Gira el cigüeñal, separa las piezas y sigue el ciclo: admisión, compresión, combustión y escape.',
  contexto: 'Estoy estudiando un motor monocilíndrico de cuatro tiempos con un modelo 3D en corte (pistón, biela, cigüeñal, válvulas y bujía).',
  bloques: [
    {
      id: 'modelo',
      version: 1,
      tipo: 'modelo-3d',
      orden: 0,
      origen: 'ejemplo',
      titulo: 'Motor en corte',
      referencias: [CREDITO],
      accesibilidad: acc('Modelo 3D de un motor monocilíndrico en corte: culata con bujía y dos válvulas, cilindro, pistón, biela y cigüeñal. Se puede girar el cigüeñal y separar las piezas.'),
      contenido: {
        modelo: { tipo: 'catalogo', clave: 'motor-4t' },
        partes: [
          { id: 'piston', nombre: 'Pistón', texto: 'Sube y baja dentro del cilindro. Recibe el empuje de los gases en la combustión y comprime la mezcla en la compresión.' },
          { id: 'biela', nombre: 'Biela', texto: 'Une el pistón con el cigüeñal: convierte el movimiento de vaivén del pistón en giro.' },
          { id: 'ciguenal', nombre: 'Cigüeñal', texto: 'Gira dos vueltas completas (720°) por cada ciclo de cuatro tiempos.' },
          { id: 'admision', nombre: 'Válvula de admisión', texto: 'Se abre en la admisión para que entre la mezcla de aire y combustible.' },
          { id: 'escape', nombre: 'Válvula de escape', texto: 'Se abre en el escape para que salgan los gases quemados.' },
          { id: 'bujia', nombre: 'Bujía', texto: 'Produce la chispa que enciende la mezcla comprimida, cerca del punto muerto superior.' },
          { id: 'culata', nombre: 'Culata', texto: 'Cierra el cilindro por arriba; aloja las válvulas y la bujía.' },
          { id: 'cilindro', nombre: 'Cilindro (en corte)', texto: 'Guía el movimiento del pistón. Aquí se muestra cortado para ver el interior.' },
        ],
      },
    },
    {
      id: 'tiempos',
      version: 1,
      tipo: 'tabla',
      orden: 1,
      origen: 'ejemplo',
      titulo: 'Los cuatro tiempos',
      accesibilidad: acc('Tabla de los cuatro tiempos con el giro del cigüeñal, el estado de las válvulas y el movimiento del pistón.'),
      contenido: {
        columnas: ['Tiempo', 'Giro del cigüeñal', 'Válvulas', 'Pistón'],
        filas: [
          { id: 'admision', celdas: ['Admisión', '0° a 180°', 'Admisión abierta', 'Baja y aspira la mezcla'] },
          { id: 'compresion', celdas: ['Compresión', '180° a 360°', 'Ambas cerradas', 'Sube y comprime la mezcla'] },
          { id: 'combustion', celdas: ['Combustión (expansión)', '360° a 540°', 'Ambas cerradas', 'La chispa enciende la mezcla y los gases lo empujan hacia abajo'] },
          { id: 'escape', celdas: ['Escape', '540° a 720°', 'Escape abierta', 'Sube y expulsa los gases'] },
        ],
        leyenda: 'Distribución simplificada del modelo: en un motor real las válvulas se adelantan y se retrasan, y hay cruce de válvulas.',
      },
    },
    {
      id: 'cinematica',
      version: 1,
      tipo: 'formula',
      orden: 2,
      origen: 'ejemplo',
      titulo: 'Posición del pistón',
      accesibilidad: acc('Altura del bulón del pistón según el ángulo del cigüeñal.'),
      contenido: {
        latex: 'y(\\theta) = r\\cos\\theta + \\sqrt{l^2 - r^2\\sin^2\\theta}',
        lectura: 'y de theta es igual a r por coseno de theta más la raíz cuadrada de l al cuadrado menos r al cuadrado por seno al cuadrado de theta, donde r es el radio de la manivela y l, el largo de la biela.',
      },
    },
    {
      id: 'comprueba',
      version: 1,
      tipo: 'ejercicio',
      orden: 3,
      origen: 'ejemplo',
      titulo: 'Comprueba lo que viste',
      accesibilidad: acc('Pregunta de opción múltiple sobre el tiempo en que los gases empujan el pistón.'),
      contenido: {
        modo: 'opcion',
        enunciado: '¿En qué tiempo están cerradas las dos válvulas y el pistón baja empujado por los gases?',
        opciones: [
          { id: 'a', texto: 'Admisión' },
          { id: 'b', texto: 'Compresión' },
          { id: 'c', texto: 'Combustión (expansión)' },
          { id: 'd', texto: 'Escape' },
        ],
        correcta: 'c',
        pista: 'En la compresión el pistón también tiene las válvulas cerradas, pero sube.',
        explicacion: 'En la combustión la chispa enciende la mezcla comprimida y la presión de los gases empuja el pistón hacia abajo: es el único tiempo que entrega trabajo.',
      },
    },
  ],
  recorrido: [
    { titulo: 'Las piezas', texto: 'El pistón sube y baja; la biela lo une al cigüeñal, que gira. Arriba, la culata con la bujía y dos válvulas.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'modelo' }, { accion: 'seleccionar-estructura', bloqueId: 'modelo', parte: 'piston' }, { accion: 'modificar-parametro', bloqueId: 'modelo', parametro: 'giro', valor: 40 }] },
    { titulo: 'Admisión', texto: 'Con la válvula de admisión abierta, el pistón baja y entra la mezcla.', acciones: [{ accion: 'modificar-parametro', bloqueId: 'modelo', parametro: 'giro', valor: 90 }, { accion: 'seleccionar-estructura', bloqueId: 'modelo', parte: 'admision' }] },
    { titulo: 'Compresión', texto: 'Las dos válvulas se cierran y el pistón sube: la mezcla se comprime.', acciones: [{ accion: 'modificar-parametro', bloqueId: 'modelo', parametro: 'giro', valor: 300 }, { accion: 'seleccionar-estructura', bloqueId: 'modelo', parte: 'piston' }] },
    { titulo: 'Combustión', texto: 'Cerca del punto muerto superior salta la chispa: los gases empujan el pistón hacia abajo.', acciones: [{ accion: 'modificar-parametro', bloqueId: 'modelo', parametro: 'giro', valor: 365 }, { accion: 'seleccionar-estructura', bloqueId: 'modelo', parte: 'bujia' }] },
    { titulo: 'Escape', texto: 'Se abre la válvula de escape y el pistón, al subir, expulsa los gases. El cigüeñal completó 720°.', acciones: [{ accion: 'modificar-parametro', bloqueId: 'modelo', parametro: 'giro', valor: 630 }, { accion: 'seleccionar-estructura', bloqueId: 'modelo', parte: 'escape' }] },
    { titulo: 'Despiece', texto: 'Separadas, se ve cómo la biela une el pistón con la muñequilla del cigüeñal.', acciones: [{ accion: 'modificar-parametro', bloqueId: 'modelo', parametro: 'despiece', valor: 1 }, { accion: 'seleccionar-estructura', bloqueId: 'modelo', parte: 'biela' }] },
    { titulo: 'Resumen', texto: 'Los cuatro tiempos, con el giro y las válvulas de cada uno.', acciones: [{ accion: 'enfocar-bloque', bloqueId: 'tiempos' }, { accion: 'resaltar', bloqueId: 'tiempos', objetivo: 'combustion' }] },
  ],
};
