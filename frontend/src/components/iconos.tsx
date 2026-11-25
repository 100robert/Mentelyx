import type { SVGProps } from 'react';

/**
 * Íconos propios de Mentelyx: trazo de 1,75 px sobre una cuadrícula de 20 px, color heredado (currentColor).
 * Decorativos por defecto (aria-hidden); el control que los contiene lleva el nombre accesible.
 */
const TRAZOS = {
  espacios: 'M3.5 3.5h5v5h-5zM11.5 3.5h5v5h-5zM3.5 11.5h5v5h-5zM11.5 11.5h5v5h-5z',
  conversaciones: 'M4 4.5h12a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H9l-3.5 3v-3H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z',
  biblioteca: 'M4 3.5v13M8 3.5v13M11.5 4.2l3.6 12.1M3 16.5h14',
  planes: 'M3.5 6.5h13v9h-13zM3.5 9.5h13M6.5 13h3',
  mas: 'M10 4v12M4 10h12',
  menu: 'M3.5 6h13M3.5 10h13M3.5 14h13',
  cerrar: 'M5 5l10 10M15 5L5 15',
  contraer: 'M3.5 3.5h13v13h-13zM8 3.5v13M12.5 8l-2 2 2 2',
  expandir: 'M3.5 3.5h13v13h-13zM8 3.5v13M10.5 8l2 2-2 2',
  enviar: 'M3.5 10L16.5 4l-4.5 12.5-2.5-5.2z',
  fuente: 'M5 2.5h6.5L15 6v11.5H5zM11.5 2.5V6H15M7.5 10h5M7.5 13h5',
  cita: 'M4 6.5h4v4H5.5L4 13.5zM11.5 6.5h4v4H13l-1.5 3z',
  salir: 'M8 4H4.5v12H8M12.5 6.5L16 10l-3.5 3.5M16 10H8',
  candado: 'M5.5 9h9v7.5h-9zM7.5 9V6.5a2.5 2.5 0 0 1 5 0V9',
  atras: 'M12 4.5L6.5 10l5.5 5.5',
  aviso: 'M10 3.5l7 12.5H3zM10 8.5v3.5M10 14.2v.3',
  info: 'M10 3.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM10 9v4.5M10 6.6v.3',
  listo: 'M4.5 10.5l3.5 3.5 7.5-8',
  subir: 'M10 13.5V4M6 8l4-4 4 4M4 16h12',
  historial: 'M4 10a6 6 0 1 0 1.8-4.3M4 4v3h3M10 7v3.5l2.5 1.5',
  reintentar: 'M15.5 10a5.5 5.5 0 1 1-1.6-3.9M15.5 4v3h-3',
  buscar: 'M9 3.5a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM13 13l3.5 3.5',
  cursor: 'M5 3.5l10 6-4.5 1.2L8.5 15z',
  resaltar: 'M12.5 3.5l4 4-7 7H5.5v-4zM4 17h6',
  region: 'M4 4h3M9.5 4h3M15 4h1v1M16 7.5v3M16 13v3h-1M12.5 16h-3M7 16H4v-3M4 10.5v-3',
  lazo: 'M10 4c4 0 6.5 1.8 6.5 4.2S13.5 12.5 10 12.5 3.5 10.6 3.5 8.2 6 4 10 4zM6 12c-1 1.5-.5 3 1 3.5',
  nota: 'M4.5 4.5h11v7l-4 4h-7zM11.5 15.5v-4h4',
  copiar: 'M7.5 7.5h8v9h-8zM4.5 12.5v-9h8',
  fijar: 'M10 12.5v4.5M6.5 12.5h7l-1.5-3V5h1V3.5h-6V5h1v4.5z',
  borrar: 'M4.5 6h11M8 6V4h4v2M6 6l.8 10h6.4L14 6',
} as const;

export type NombreIcono = keyof typeof TRAZOS;

export function Icono({ nombre, tamano = 20, ...resto }: { nombre: NombreIcono; tamano?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={tamano}
      height={tamano}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="icono"
      {...resto}
    >
      <path d={TRAZOS[nombre]} />
    </svg>
  );
}
