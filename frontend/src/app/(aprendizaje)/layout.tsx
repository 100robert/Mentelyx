import { MarcoApp, type EspacioMenu } from '@/components/marco-app';
import { apiServidor } from '@/lib/api-servidor';

/**
 * Marco de la aplicación autenticada. Lee los espacios del estudiante para la barra lateral con su cookie (SSR sin caché
 * compartida). Sin sesión la API responde 401 y la barra queda vacía; la página hace la redirección.
 */
export default async function AprendizajeLayout({ children }: { children: React.ReactNode }) {
  const r = await apiServidor<EspacioMenu[]>('/espacios');
  const espacios = (r.datos ?? []).map((e) => ({ id: e.id, titulo: e.titulo }));
  return <MarcoApp espacios={espacios}>{children}</MarcoApp>;
}
