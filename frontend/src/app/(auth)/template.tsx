/** Se vuelve a montar en cada navegación: transición de entrada del acceso. */
export default function AccesoTemplate({ children }: { children: React.ReactNode }) {
  return <div className="transicion-pagina">{children}</div>;
}
