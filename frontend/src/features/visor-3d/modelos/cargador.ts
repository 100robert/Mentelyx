import { Vector3, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { esferaDe, liberar, type ModeloVisor } from '../visor';
import { construirMotor } from './motor';

/**
 * Cargador de modelos para el visor: los del catálogo propio (el motor, construido con geometría) y archivos glTF/GLB del
 * mismo origen (`/modelos/*.glb`). Nunca descarga de dominios externos. En un glTF, cada nodo hijo con nombre de la escena
 * es una pieza seleccionable; el despiece separa las piezas desde el centro del modelo.
 */
export type OrigenModelo = { tipo: 'catalogo'; clave: 'motor-4t' | 'metano' } | { tipo: 'gltf'; src: string };
const RUTA = /^\/modelos\/[a-z0-9-]+\.(glb|gltf)$/;
const ARCHIVOS: Record<'metano', string> = { metano: '/modelos/metano.glb' };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function modeloMotor(): ModeloVisor {
  const motor = construirMotor();
  const anclas = () => new Map(motor.anclas());
  return {
    raiz: motor.raiz,
    piezas: Object.entries(motor.piezas).map(([id, objeto]) => ({ id, objeto, ancla: () => anclas().get(id as keyof typeof motor.piezas) ?? new Vector3() })),
    parametros(v) {
      const explosion = v.despiece ?? 0;
      motor.aplicar({ explosion, angulo: v.giro ?? 40, ciclo: explosion < 0.05, resaltar: null });
    },
    encuadre() {
      const e = motor.estado().explosion;
      return { centro: new Vector3(4.5 * e, lerp(12, 17.4, e), 0), radio: lerp(17.5, 28, e) };
    },
    destruir: () => motor.destruir(),
  };
}

const idDeNodo = (nombre: string) =>
  nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^[^a-z]+/, '')
    .slice(0, 32);

export async function cargarGltf(src: string): Promise<ModeloVisor> {
  if (!RUTA.test(src)) throw new Error('El modelo no está en el catálogo de Mentelyx.');
  const gltf = await new GLTFLoader().loadAsync(src);
  const raiz = gltf.scene;
  const esfera = esferaDe(raiz);
  const centro = esfera.center.clone();
  const piezas: Array<{ id: string; objeto: Object3D; base: Vector3; direccion: Vector3 }> = [];
  for (const hijo of raiz.children) {
    const id = idDeNodo(hijo.name);
    if (!id || piezas.some((p) => p.id === id)) continue;
    const c = esferaDe(hijo).center;
    const d = c.clone().sub(centro);
    piezas.push({ id, objeto: hijo, base: hijo.position.clone(), direccion: d.lengthSq() > 1e-8 ? d.normalize() : new Vector3() });
  }
  let despiece = 0;
  return {
    raiz,
    piezas: piezas.map((p) => ({ id: p.id, objeto: p.objeto })),
    parametros(v) {
      despiece = v.despiece ?? 0;
      for (const p of piezas) p.objeto.position.copy(p.base).addScaledVector(p.direccion, despiece * esfera.radius * 0.9);
    },
    encuadre: () => ({ centro, radio: esfera.radius * (1 + despiece * 0.9) }),
    destruir: () => liberar(raiz),
  };
}

export async function cargarModelo(origen: OrigenModelo): Promise<ModeloVisor> {
  if (origen.tipo === 'catalogo') return origen.clave === 'motor-4t' ? modeloMotor() : cargarGltf(ARCHIVOS[origen.clave]);
  return cargarGltf(origen.src);
}
