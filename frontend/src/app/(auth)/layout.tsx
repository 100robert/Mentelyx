import { MarcoAcceso } from '@/features/auth';

/** Marco del acceso: formulario y zona visual (ver features/auth/components/marco-acceso.tsx). */
export default function AccesoLayout({ children }: { children: React.ReactNode }) {
  return <MarcoAcceso>{children}</MarcoAcceso>;
}
