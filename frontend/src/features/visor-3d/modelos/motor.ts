import {
  BoxGeometry,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
  type Material,
  type Object3D,
} from 'three';

/**
 * Motor monocilíndrico de cuatro tiempos, modelado con geometría propia de Mentelyx (sin recursos externos).
 * Unidades en centímetros. Cinemática biela-manivela exacta: y_pistón(θ) = r·cos θ + √(l² − r²·sin² θ), con r = 4 y l = 13.
 * Válvulas verticales y tiempos de distribución simplificados (sin cruce de válvulas); proporciones ilustrativas.
 * El cilindro y la culata están en corte por el plano z = 0 para ver el interior; pistón, biela y cigüeñal son piezas completas.
 */
export const R = 4;
export const L = 13;
const DECK = 21;
const CORONA = 3.6; // distancia del bulón a la corona del pistón
const ALZADA = 0.8;

export type ParteMotor = 'culata' | 'bujia' | 'admision' | 'escape' | 'piston' | 'biela' | 'ciguenal' | 'cilindro';
export type EstadoMotor = { explosion: number; angulo: number; ciclo: boolean; resaltar: ParteMotor | null };
export type Ancla = { parte: ParteMotor; x: number; y: number; visible: boolean };

export function alturaPiston(grados: number) {
  const t = (grados * Math.PI) / 180;
  return R * Math.cos(t) + Math.sqrt(L * L - R * R * Math.sin(t) ** 2);
}
export function alzadaValvulas(grados: number) {
  const a = ((grados % 720) + 720) % 720;
  return {
    admision: a <= 180 ? ALZADA * Math.sin((Math.PI * a) / 180) : 0,
    escape: a >= 540 ? ALZADA * Math.sin((Math.PI * (a - 540)) / 180) : 0,
  };
}


export const PARTES_MOTOR: readonly ParteMotor[] = ['culata', 'bujia', 'admision', 'escape', 'piston', 'biela', 'ciguenal', 'cilindro'];

/**
 * Construye las piezas del motor en un grupo raíz (sin renderer ni cámara) para reutilizarlas en la landing (vinculada al
 * desplazamiento) y en el visor libre de Aprendizaje. `aplicar` coloca las piezas según el estado: es determinista.
 */
export function construirMotor() {
  const escena = new Group();
  escena.name = 'motor-4t';
  // Materiales: hierro fundido (cilindro y culata), cara de corte, aluminio (pistón), acero (biela, cigüeñal, válvulas), cerámica.
  const hierro = new MeshStandardMaterial({ color: 0x5b6472, metalness: 0.6, roughness: 0.48, side: DoubleSide });
  const corte = new MeshStandardMaterial({ color: 0x97a0ac, metalness: 0.15, roughness: 0.9, side: DoubleSide });
  const aluminio = () => new MeshStandardMaterial({ color: 0xbfc6cf, metalness: 0.9, roughness: 0.26 });
  const acero = () => new MeshStandardMaterial({ color: 0x9aa1ab, metalness: 0.9, roughness: 0.32 });
  const ceramica = new MeshStandardMaterial({ color: 0xf2f3f5, metalness: 0, roughness: 0.35 });
  const anillo = new MeshStandardMaterial({ color: 0x3c4350, metalness: 0.8, roughness: 0.4 });

  const malla = (g: BufferGeometry, m: Material, nombre?: string) => {
    const x = new Mesh(g, m);
    if (nombre) x.name = nombre;
    return x;
  };
  // Media pieza de revolución (la mitad posterior, z ≤ 0) a partir de un perfil cerrado.
  const mitad = (perfil: Array<[number, number]>, m: Material) =>
    malla(new LatheGeometry(perfil.map(([x, y]) => new Vector2(x, y)), 64, Math.PI / 2, Math.PI), m);
  const caraCorte = (x0: number, x1: number, y0: number, y1: number) => {
    const g = new PlaneGeometry(x1 - x0, y1 - y0);
    const c = malla(g, corte);
    c.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0.001);
    return c;
  };

  // Cilindro (camisa) en corte.
  const cilindro = new Group();
  cilindro.add(mitad([[4.05, 7], [5.3, 7], [5.3, DECK], [4.05, DECK], [4.05, 7]], hierro));
  cilindro.add(caraCorte(4.05, 5.3, 7, DECK), caraCorte(-5.3, -4.05, 7, DECK));
  escena.add(cilindro);

  // Culata en corte, con bujía y válvulas.
  const culata = new Group();
  culata.add(mitad([[0.001, DECK], [6.2, DECK], [6.2, DECK + 4.4], [0.001, DECK + 4.4]], hierro));
  culata.add(caraCorte(-6.2, 6.2, DECK, DECK + 4.4));
  escena.add(culata);

  const bujia = new Group();
  const cuerpoBujia = malla(new CylinderGeometry(0.55, 0.55, 3.2, 32), ceramica);
  cuerpoBujia.position.y = DECK + 4.4 + 1.6;
  const roscaBujia = malla(new CylinderGeometry(0.42, 0.42, 4.4, 24), acero());
  roscaBujia.position.y = DECK + 2.2;
  const chispa = malla(new SphereGeometry(0.42, 24, 16), new MeshStandardMaterial({ color: 0xffd28a, emissive: 0xffb347, emissiveIntensity: 0, transparent: true, opacity: 0 }));
  chispa.position.y = DECK - 0.05;
  bujia.add(cuerpoBujia, roscaBujia, chispa);
  escena.add(bujia);

  const valvula = (x: number) => {
    const g = new Group();
    const material = acero();
    const perfil = [[0.001, 0], [1.25, 0], [1.25, 0.18], [0.3, 0.75], [0.25, 6.2], [0.001, 6.2]].map(([a, b]) => new Vector2(a!, b!));
    g.add(malla(new LatheGeometry(perfil, 40), material));
    g.position.set(x, DECK + 0.15, 0);
    return { g, material };
  };
  const admision = valvula(-2);
  const escape = valvula(2);
  escena.add(admision.g, escape.g);

  // Pistón con segmentos.
  const piston = new Group();
  const matPiston = aluminio();
  const cuerpo = malla(new CylinderGeometry(3.95, 3.95, 6.4, 64), matPiston);
  cuerpo.position.y = CORONA - 3.2;
  piston.add(cuerpo);
  [0.5, 1, 1.5].forEach((d) => {
    const s = malla(new TorusGeometry(3.95, 0.07, 8, 64), anillo);
    s.rotation.x = Math.PI / 2;
    s.position.y = CORONA - d;
    piston.add(s);
  });
  escena.add(piston);

  // Gases en la cámara (mitad posterior, como el corte).
  const matGas = new MeshStandardMaterial({ color: 0xb9c7da, transparent: true, opacity: 0, depthWrite: false, emissive: 0xffa53a, emissiveIntensity: 0, side: DoubleSide });
  const gas = malla(new CylinderGeometry(4.02, 4.02, 1, 48, 1, false, Math.PI / 2, Math.PI), matGas);
  escena.add(gas);

  // Biela: cabeza (ojo grande), pie (ojo pequeño) y caña. Origen en el centro de la cabeza.
  const biela = new Group();
  const matBiela = acero();
  const cabeza = malla(new CylinderGeometry(1.9, 1.9, 1.2, 40), matBiela);
  cabeza.rotation.x = Math.PI / 2;
  const pie = malla(new CylinderGeometry(1.25, 1.25, 1.1, 32), matBiela);
  pie.rotation.x = Math.PI / 2;
  pie.position.y = L;
  const cana = malla(new BoxGeometry(1.15, L - 2.6, 0.85), matBiela);
  cana.position.y = L / 2;
  biela.add(cabeza, pie, cana);
  escena.add(biela);

  // Cigüeñal: muñones de bancada, dos brazos con contrapeso y la muñequilla. Gira alrededor del eje z.
  const ciguenal = new Group();
  const matCig = acero();
  const bancada = malla(new CylinderGeometry(1.4, 1.4, 12, 40), matCig);
  bancada.rotation.x = Math.PI / 2;
  ciguenal.add(bancada);
  const perfilBrazo = new Shape();
  for (let k = 0; k <= 16; k++) {
    const a = Math.PI - (Math.PI * k) / 16;
    const px = 1.8 * Math.cos(a), py = R + 1.8 * Math.sin(a);
    if (k === 0) perfilBrazo.moveTo(px, py);
    else perfilBrazo.lineTo(px, py);
  }
  perfilBrazo.lineTo(2.1, 0.4);
  for (let k = 0; k <= 24; k++) {
    const a = -0.2 - ((Math.PI - 0.4) * k) / 24;
    perfilBrazo.lineTo(4.4 * Math.cos(a), 4.4 * Math.sin(a));
  }
  perfilBrazo.lineTo(-2.1, 0.4);
  perfilBrazo.closePath();
  const brazo = new ExtrudeGeometry(perfilBrazo, { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2 });
  [0.7, -1.4].forEach((z) => {
    const b = malla(brazo, matCig);
    b.position.z = z;
    ciguenal.add(b);
  });
  const munequilla = malla(new CylinderGeometry(1.2, 1.2, 1.5, 32), matCig);
  munequilla.rotation.x = Math.PI / 2;
  munequilla.position.y = R;
  ciguenal.add(munequilla);
  escena.add(ciguenal);

  let estado: EstadoMotor = { explosion: 0, angulo: 40, ciclo: false, resaltar: null };

  const resaltables: Record<ParteMotor, MeshStandardMaterial[]> = {
    culata: [], bujia: [], cilindro: [], piston: [matPiston], biela: [matBiela], ciguenal: [matCig], admision: [admision.material], escape: [escape.material],
  };

  // Puntos de anclaje de los rótulos, en coordenadas locales de cada pieza (se proyectan tras renderizar).
  const anclasLocales: Array<[ParteMotor, Object3D, Vector3]> = [
    ['culata', culata, new Vector3(-6.2, DECK + 2.2, 0)],
    ['bujia', bujia, new Vector3(0.55, DECK + 4.4 + 2.6, 0)],
    ['admision', admision.g, new Vector3(-0.3, 3.6, 0)],
    ['escape', escape.g, new Vector3(0.3, 3.6, 0)],
    ['piston', piston, new Vector3(-3.95, CORONA - 2.2, 0)],
    ['biela', biela, new Vector3(0.6, L * 0.42, 0)],
    ['cilindro', cilindro, new Vector3(5.3, 12, 0)],
  ];

  function aplicar() {
    const e = estado.explosion;
    const t = (estado.angulo * Math.PI) / 180;
    const yp = alturaPiston(estado.angulo);
    const { admision: la, escape: le } = alzadaValvulas(estado.angulo);

    // Despiece: cigüeñal abajo, biela separada de la muñequilla, pistón fuera del cilindro, válvulas y culata arriba
    // y el cilindro desplazado a un lado. El ángulo de la biela es siempre el de la cinemática (vertical en el PMS).
    ciguenal.position.y = -4 * e;
    ciguenal.rotation.z = -t;
    biela.position.set(R * Math.sin(t), R * Math.cos(t) - 4 * e + 3.5 * e, 0);
    biela.rotation.z = Math.atan2(R * Math.sin(t), yp - R * Math.cos(t));
    piston.position.y = yp + 6.5 * e;
    cilindro.position.x = 10 * e;
    admision.g.position.y = DECK + 0.15 - la + 7.2 * e;
    escape.g.position.y = DECK + 0.15 - le + 7.2 * e;
    admision.g.position.x = -2 - 1.4 * e;
    escape.g.position.x = 2 + 1.4 * e;
    culata.position.y = 12.6 * e;
    bujia.position.y = 12.6 * e + 2 * e;

    // Gases: solo durante el ciclo, con el color de cada tiempo.
    const corona = yp + CORONA;
    const altura = Math.max(DECK - corona, 0.05);
    gas.scale.y = altura;
    gas.position.y = corona + altura / 2;
    const a = ((estado.angulo % 720) + 720) % 720;
    let opacidad = 0, emisivo = 0, color = 0xb9c7da;
    if (estado.ciclo && e < 0.05) {
      if (a < 180) opacidad = 0.32;
      else if (a < 360) opacidad = 0.32 + 0.2 * ((a - 180) / 180);
      else if (a < 540) {
        const f = (a - 360) / 180;
        color = 0xffb05a;
        opacidad = 0.62 - 0.3 * f;
        emisivo = 1.4 * (1 - f) ** 2;
      } else {
        color = 0x8a919c;
        opacidad = 0.36 - 0.24 * ((a - 540) / 180);
      }
    }
    matGas.color.setHex(color);
    matGas.opacity = opacidad;
    matGas.emissiveIntensity = emisivo;
    gas.visible = opacidad > 0.01;
    const chispaMat = chispa.material as MeshStandardMaterial;
    const brillo = estado.ciclo && a >= 352 && a < 392 ? 1 - Math.abs(a - 362) / 30 : 0;
    chispaMat.opacity = Math.max(0, brillo);
    chispaMat.emissiveIntensity = 3 * Math.max(0, brillo);
    chispa.visible = brillo > 0;

    (Object.keys(resaltables) as ParteMotor[]).forEach((p) =>
      resaltables[p].forEach((m) => {
        m.emissive.setHex(0x84cc16);
        m.emissiveIntensity = estado.resaltar === p ? 0.42 : 0;
      }),
    );
  }

  const piezas: Record<ParteMotor, Object3D> = { culata, bujia, admision: admision.g, escape: escape.g, piston, biela, ciguenal, cilindro };
  for (const [id, objeto] of Object.entries(piezas)) objeto.name = id;

  return {
    raiz: escena,
    piezas,
    resaltables,
    /** Puntos de anclaje de los rótulos en coordenadas locales de cada pieza (el del cigüeñal se calcula en el mundo). */
    anclas(): Array<[ParteMotor, Vector3]> {
      const lista = anclasLocales.map(([parte, objeto, local]) => [parte, objeto.localToWorld(local.clone())] as [ParteMotor, Vector3]);
      lista.push(['ciguenal', new Vector3(-4.4, -1.2 + ciguenal.position.y, 0)]);
      return lista;
    },
    estado: () => estado,
    aplicar(nuevo: EstadoMotor) {
      estado = nuevo;
      aplicar();
    },
    destruir() {
      escena.traverse((o: Object3D) => {
        if (o instanceof Mesh) {
          o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m: Material) => m.dispose());
        }
      });
    },
  };
}

export type ModeloMotor = ReturnType<typeof construirMotor>;
