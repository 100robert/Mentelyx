/** Se vuelve a montar en cada navegación: transición de entrada (solo opacidad, para no alterar los paneles fijos). */
export default function AprendizajeTemplate({ children }: { children: React.ReactNode }) {
  return <div className="transicion-app">{children}</div>;
}
