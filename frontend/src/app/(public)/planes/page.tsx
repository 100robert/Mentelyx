import type { Metadata } from 'next';
import { Icono } from '@/components/ui/iconos';
import { NOTA_AUN_NO_DISPONIBLE, PLANES, RECURSOS_AUN_NO_DISPONIBLES, type Plan } from '@/features/planes';

const pendiente = (nombre: string) => RECURSOS_AUN_NO_DISPONIBLES.nombres.includes(nombre);
const Marca = () => <span className="etiqueta etiqueta-pendiente">Aún no disponible</span>;

export const metadata: Metadata = {
  title: 'Planes',
  description: 'Empieza gratis con Mentelyx y amplía tu capacidad de aprendizaje cuando lo necesites.',
};
/** SSG: precios y recursos de la versión comercial vigente (IM, secciones 14 y 15). */
export const dynamic = 'force-static';

/** Tabla comparativa: los planes son columnas; la primera columna (el recurso) queda fija al desplazar en móvil. */
function TablaPlanes({ id, titulo, planes }: { id: string; titulo: string; planes: Plan[] }) {
  const recursos = planes[0]?.recursos.map(([nombre]) => nombre) ?? [];
  return (
    <section aria-labelledby={id} className="bloque-planes">
      <h2 id={id}>{titulo}</h2>
      <div className="tabla-contenedor" data-desplazable tabIndex={0} role="region" aria-labelledby={id}>
        <table className="tabla tabla-planes">
          <caption className="visually-hidden">{titulo}: precio mensual y recursos por mes</caption>
          <thead>
            <tr>
              <th scope="col">Recurso al mes</th>
              {planes.map((p) => (
                <th key={p.codigo} scope="col" className="plan-cabeza">
                  <span className="plan-nombre">{p.nombre}</span>
                  <span className="plan-precio precio">{p.precio}</span>
                  <span className="suave plan-periodo">al mes</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recursos.map((r) => (
              <tr key={r} data-pendiente={pendiente(r) || undefined}>
                <th scope="row">
                  {r} {pendiente(r) && <Marca />}
                </th>
                {planes.map((p) => (
                  <td key={p.codigo} className="num">
                    {p.recursos.find(([n]) => n === r)?.[1]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* En pantallas estrechas, cada plan se lee como un bloque con sus recursos (la tabla se oculta por CSS). */}
      <ul className="planes-apilados">
        {planes.map((p) => (
          <li key={p.codigo} className="plan-bloque">
            <div className="plan-bloque-cabeza">
              <h3>{p.nombre}</h3>
              <p>
                <span className="plan-precio precio">{p.precio}</span> <span className="suave plan-periodo">al mes</span>
              </p>
            </div>
            <dl>
              {p.recursos.map(([nombre, valor]) => (
                <div key={nombre} data-pendiente={pendiente(nombre) || undefined}>
                  <dt>
                    {nombre} {pendiente(nombre) && <Marca />}
                  </dt>
                  <dd>{valor}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      {planes
        .filter((p) => p.nota)
        .map((p) => (
          <p key={p.codigo} className="suave nota-plan">
            {p.nombre}: {p.nota}
          </p>
        ))}
    </section>
  );
}

export default function Planes() {
  return (
    <div className="contenedor pagina-publica">
      <header className="pagina-cabecera">
        <h1>Planes</h1>
        <p className="suave">Recursos mensuales por categoría. Los planes superiores amplían la capacidad sin quitar funciones al Gratuito.</p>
      </header>
      {/* Mentelyx V1 (ADR-093) solo ofrece los planes de aprendizaje; los planes docentes siguen en features/planes, pospuestos. */}
      <TablaPlanes id="planes-ESTUDIANTE" titulo="Planes de aprendizaje" planes={PLANES.filter((p) => p.publico === 'ESTUDIANTE')} />
      <p className="mensaje mensaje-info">
        <Icono nombre="info" />
        <span>Toda cuenta nueva empieza con el plan Gratuito. {NOTA_AUN_NO_DISPONIBLE}</span>
      </p>
    </div>
  );
}
