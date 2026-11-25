import { Revelador } from '@/components/ui/movimiento';

/** Se vuelve a montar en cada navegación: transición de entrada de la página y apariciones al desplazar. */
export default function PublicoTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="transicion-pagina">
      {children}
      <Revelador />
    </div>
  );
}
