import type { EstadoMotor } from './motor-estado';

/**
 * Alternativa estática del modelo 3D (sin WebGL, contexto perdido o error de carga): el mismo motor en corte 2D, con la misma
 * cinemática biela-manivela y los mismos tiempos de válvulas. Escala de 9 px por centímetro; el cigüeñal está en (220, 440).
 */
const S = 9, OX = 220, OY = 440, R = 4, L = 13, DECK = 21;
const px = (x: number) => OX + x * S;
const py = (y: number) => OY - y * S;

function alturaPiston(g: number) {
  const t = (g * Math.PI) / 180;
  return R * Math.cos(t) + Math.sqrt(L * L - R * R * Math.sin(t) ** 2);
}
function alzada(g: number) {
  const a = ((g % 720) + 720) % 720;
  return { adm: a <= 180 ? 0.8 * Math.sin((Math.PI * a) / 180) : 0, esc: a >= 540 ? 0.8 * Math.sin((Math.PI * (a - 540)) / 180) : 0, a };
}

export function MotorEsquema({ estado }: { estado: EstadoMotor }) {
  const e = estado.explosion;
  const t = (estado.angulo * Math.PI) / 180;
  const yp = alturaPiston(estado.angulo);
  const { adm, esc, a } = alzada(estado.angulo);
  const cig = -4 * e;
  const pinX = R * Math.sin(t), pinY = R * Math.cos(t) + cig;
  const bielaY = pinY + 3.5 * e;
  const pistonY = yp + 6.5 * e;
  const corona = pistonY + 3.6;
  const valvulaY = DECK + 0.15 + 7.2 * e;
  const culata = 12.6 * e;
  const cil = 10 * e;
  const ang = Math.atan2(R * Math.sin(t), yp - R * Math.cos(t));
  // Pie de la biela: el vector (0, L) girado ψ; sin despiece coincide con el bulón del pistón (0, y_pistón).
  const finBiela = { x: pinX - L * Math.sin(ang), y: bielaY + L * Math.cos(ang) };
  let gas = 'none';
  if (estado.ciclo && e < 0.05) gas = a < 360 ? 'mezcla' : a < 540 ? 'combustion' : 'escape';
  const resaltar = (p: string) => (estado.resaltar === p ? 'motor2d-resaltado' : undefined);

  return (
    <svg viewBox="0 0 520 520" className="motor-esquema" aria-hidden="true">
      <g transform={`translate(${cil * S} 0)`} className="motor2d-hierro">
        <rect x={px(-5.3)} y={py(DECK)} width={1.25 * S} height={14 * S} />
        <rect x={px(4.05)} y={py(DECK)} width={1.25 * S} height={14 * S} />
      </g>
      {gas !== 'none' && <rect x={px(-4.05)} y={py(DECK)} width={8.1 * S} height={Math.max(0, (DECK - corona) * S)} className={`motor2d-gas motor2d-gas-${gas}`} />}
      <g transform={`translate(0 ${-culata * S})`}>
        <rect x={px(-6.2)} y={py(DECK + 4.4)} width={12.4 * S} height={4.4 * S} className="motor2d-hierro" />
        <g transform={`translate(0 ${-2 * e * S})`} className={resaltar('bujia')}>
          <rect x={px(-0.42)} y={py(DECK + 4.4)} width={0.84 * S} height={4.4 * S} className="motor2d-acero" />
          <rect x={px(-0.55)} y={py(DECK + 7.6)} width={1.1 * S} height={3.2 * S} className="motor2d-ceramica" />
        </g>
      </g>
      {[
        { x: -2 - 1.4 * e, lift: adm, parte: 'admision' },
        { x: 2 + 1.4 * e, lift: esc, parte: 'escape' },
      ].map((v) => (
        <g key={v.parte} transform={`translate(${px(v.x)} ${py(valvulaY - v.lift)})`} className={resaltar(v.parte)}>
          <path d={`M${-1.25 * S} 0h${2.5 * S}l${-0.95 * S} ${-0.6 * S}V${-6.2 * S}h${-0.6 * S}V${-0.6 * S}z`} className="motor2d-acero" />
        </g>
      ))}
      {estado.ciclo && a >= 352 && a < 392 && <circle cx={px(0)} cy={py(DECK - 0.1)} r={0.7 * S} className="motor2d-chispa" />}
      <g transform={`translate(${px(0)} ${py(pistonY)})`} className={resaltar('piston')}>
        <rect x={-3.95 * S} y={-3.6 * S} width={7.9 * S} height={6.4 * S} rx="2" className="motor2d-aluminio" />
        {[0.5, 1, 1.5].map((d) => (
          <path key={d} d={`M${-3.95 * S} ${(-3.6 + d) * S}h${7.9 * S}`} className="motor2d-anillo" />
        ))}
      </g>
      <g className={resaltar('biela')}>
        <path d={`M${px(pinX)} ${py(bielaY)}L${px(finBiela.x)} ${py(finBiela.y)}`} className="motor2d-biela" />
        <circle cx={px(pinX)} cy={py(bielaY)} r={1.9 * S} className="motor2d-acero" />
        <circle cx={px(finBiela.x)} cy={py(finBiela.y)} r={1.25 * S} className="motor2d-acero" />
      </g>
      <g className={resaltar('ciguenal')}>
        <circle cx={px(0)} cy={py(cig)} r={4.4 * S} className="motor2d-contrapeso" />
        <circle cx={px(0)} cy={py(cig)} r={1.4 * S} className="motor2d-acero" />
        <circle cx={px(pinX)} cy={py(pinY)} r={1.2 * S} className="motor2d-acero" />
      </g>
    </svg>
  );
}
