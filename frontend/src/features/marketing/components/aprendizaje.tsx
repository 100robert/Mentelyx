import { Formula } from './formula';
import { IslaMotor, IslaPizarra } from './islas';

const MODALIDADES = [
  {
    href: '#pizarra',
    titulo: 'Una pizarra que se adapta al tema',
    texto: 'Construye el razonamiento paso a paso, con notación matemática, gráficos y diagramas que cambian con sus variables.',
  },
  { href: '#modelos', titulo: 'Modelos que se exploran por dentro', texto: 'Gíralos, sepáralos en piezas y míralos funcionar cuando el tema lo necesita.' },
  { href: '#tutor', titulo: 'Un tutor a tu lado', texto: 'Responde sobre lo que estás mirando y señala el paso o la pieza exacta de la que habla.' },
];

/** Aprendizaje visual e inmersivo: la pizarra, los modelos 3D y el Tutor, demostrados con contenidos reales. */
export function Aprendizaje() {
  return (
    <section id="aprendizaje" className="aprendizaje" aria-labelledby="titulo-aprendizaje">
      <div className="marco reticula aprendizaje-intro">
        <h2 id="titulo-aprendizaje">Explicaciones que puedes ver, tocar y recorrer</h2>
        <p className="texto-destacado aprendizaje-lead">
          Mentelyx no responde con un bloque de texto: elige la forma que mejor explica cada idea y te deja explorarla a tu ritmo.
        </p>
        <ul className="modalidades">
          {MODALIDADES.map((m) => (
            <li key={m.href}>
              <a href={m.href}>
                <span className="modalidad-titulo">{m.titulo}</span>
                <span className="modalidad-texto">{m.texto}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div id="pizarra" className="bloque-pizarra">
        <IslaPizarra
          encabezado={
            <header className="bloque-cabecera-demo">
              <h3>Una pizarra que construye el razonamiento</h3>
              <p>Cada paso queda a la vista para volver a él. Así se descubre la derivada de f(x) = x².</p>
            </header>
          }
          pasos={[
            {
              titulo: 'Dos puntos de la curva',
              texto: 'Para medir cuánto cambia f(x) = x² en un punto a, tomamos otro un poco más adelante: a + h.',
              formula: <Formula tex="\begin{aligned} P &= (a,\ a^{2}) \\ Q &= (a + h,\ (a + h)^{2}) \end{aligned}" />,
            },
            {
              titulo: 'La pendiente entre ellos',
              texto: 'La recta que los une, la secante, sube f(a + h) − f(a) a lo largo de una distancia h.',
              formula: <Formula tex="m = \dfrac{f(a + h) - f(a)}{h}" />,
            },
            {
              titulo: 'Simplificar sin perder el sentido',
              texto: 'Al desarrollar el cuadrado y dividir entre h, la pendiente queda en 2a + h.',
              formula: <Formula tex="\begin{aligned} m &= \dfrac{(a + h)^{2} - a^{2}}{h} \\ &= \dfrac{2ah + h^{2}}{h} = 2a + h \end{aligned}" />,
            },
            {
              titulo: 'Acercar los puntos',
              texto: 'Cuando h tiende a cero, Q se acerca a P y la secante se convierte en la tangente. Su pendiente es la derivada.',
              formula: <Formula tex="f'(a) = \lim_{h \to 0}\,(2a + h) = 2a" />,
            },
            {
              titulo: 'Comprobarlo por tu cuenta',
              texto: 'Mueve el punto a y observa la tangente: su pendiente siempre vale el doble de a.',
              formula: <Formula tex="f'(x) = 2x" />,
            },
          ]}
        />
      </div>

      <div id="modelos" className="bloque-motor">
        <IslaMotor
          encabezado={
            <header className="bloque-cabecera-demo">
              <h3>Modelos que se exploran por dentro</h3>
              <p>Gira el motor para verlo desde otro ángulo. Al avanzar, sus piezas se separan y el ciclo se pone en marcha.</p>
            </header>
          }
          pasos={[
            { titulo: 'Un motor de cuatro tiempos', texto: 'Es el tipo de motor de muchos automóviles y motocicletas. Lo vemos en corte para observar su interior.' },
            {
              titulo: 'Sus piezas',
              texto: 'Al separarlo aparecen la culata con sus válvulas y la bujía, el cilindro, el pistón, la biela y el cigüeñal.',
              tutor: 'La biela convierte la subida y bajada del pistón en el giro del cigüeñal.',
            },
            { titulo: 'Admisión', texto: 'El pistón baja y la válvula de admisión se abre: entra la mezcla de aire y combustible.' },
            { titulo: 'Compresión', texto: 'Con las dos válvulas cerradas, el pistón sube y comprime la mezcla en un espacio mucho menor.' },
            {
              titulo: 'Combustión',
              texto: 'La bujía hace saltar una chispa, la mezcla arde y los gases empujan el pistón hacia abajo. Es el único tiempo que produce trabajo.',
            },
            {
              titulo: 'Escape',
              texto: 'La válvula de escape se abre y el pistón, al subir, expulsa los gases. Un ciclo completo necesita dos vueltas del cigüeñal.',
            },
          ]}
        />
      </div>
    </section>
  );
}
