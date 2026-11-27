import { tramo } from '../hooks/use-recorrido';
import type { EstadoMotor, ParteMotor } from '@/features/visor-3d/escena';

export type { EstadoMotor, ParteMotor };

/**
 * Estado del motor para cada paso del recorrido (0 conjunto, 1 despiece, 2 admisión, 3 compresión, 4 combustión, 5 escape).
 * Con movimiento reducido no hay interpolación: cada paso muestra un estado representativo (mitad de cada tiempo).
 */
export function estadoDelPaso(activo: number, p: number, reducido: boolean): EstadoMotor {
  if (reducido) {
    const fijos: EstadoMotor[] = [
      { explosion: 0, angulo: 40, ciclo: false, resaltar: null },
      { explosion: 1, angulo: 0, ciclo: false, resaltar: 'biela' },
      { explosion: 0, angulo: 90, ciclo: true, resaltar: 'admision' },
      { explosion: 0, angulo: 270, ciclo: true, resaltar: 'piston' },
      { explosion: 0, angulo: 372, ciclo: true, resaltar: 'bujia' },
      { explosion: 0, angulo: 630, ciclo: true, resaltar: 'escape' },
    ];
    return fijos[activo] ?? fijos[0]!;
  }
  switch (activo) {
    case 1: {
      const e = tramo(p, 0.05, 0.6);
      return { explosion: e, angulo: 40 * (1 - e), ciclo: false, resaltar: p > 0.6 ? 'biela' : null };
    }
    case 2:
      return { explosion: 1 - tramo(p, 0, 0.22), angulo: 180 * tramo(p, 0.22, 1), ciclo: true, resaltar: 'admision' };
    case 3:
      return { explosion: 0, angulo: 180 + 180 * p, ciclo: true, resaltar: 'piston' };
    case 4:
      return { explosion: 0, angulo: 360 + 180 * p, ciclo: true, resaltar: 'bujia' };
    case 5:
      return { explosion: 0, angulo: 540 + 179.9 * p, ciclo: true, resaltar: 'escape' };
    default:
      return { explosion: 0, angulo: 40, ciclo: false, resaltar: null };
  }
}

/** Rótulos visibles en cada paso. */
export function rotulosDelPaso(activo: number, estado: EstadoMotor): ParteMotor[] {
  if (activo === 1) return estado.explosion > 0.75 ? ['culata', 'bujia', 'admision', 'escape', 'piston', 'biela', 'ciguenal', 'cilindro'] : [];
  if (activo === 0) return ['cilindro'];
  return estado.resaltar && estado.explosion < 0.05 ? [estado.resaltar] : [];
}
