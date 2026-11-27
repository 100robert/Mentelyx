import {
  ACESFilmicToneMapping,
  Box3,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Raycaster,
  Scene,
  Sphere,
  Vector2,
  Vector3,
  WebGLRenderer,
  type Material,
  type Object3D,
} from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * Visor 3D reutilizable (sin desplazamiento vinculado): órbita y zoom, selección por toque o clic (raycast), resaltado,
 * ocultar y aislar piezas, vistas predefinidas, rótulos proyectados y parámetros del modelo (despiece, ciclo). Renderiza
 * bajo demanda. Ante la pérdida del contexto WebGL avisa para que la interfaz ofrezca recargar; `destruir` libera
 * geometrías, materiales, texturas, el entorno y el renderer.
 */
export type PiezaVisor = { id: string; objeto: Object3D; ancla?: () => Vector3 };
export type ModeloVisor = {
  raiz: Object3D;
  piezas: PiezaVisor[];
  parametros?: (valores: Record<string, number>) => void;
  /** Centro y radio de lo que debe quedar a la vista (puede cambiar con el despiece). */
  encuadre: () => { centro: Vector3; radio: number };
  destruir: () => void;
};
export type VistaCamara = 'inicial' | 'frontal' | 'lateral' | 'superior';
export type AnclaVisor = { id: string; x: number; y: number; visible: boolean };
export type OpcionesVisor = {
  calidad: number;
  entornoReducido: boolean;
  alRenderizar: (anclas: AnclaVisor[]) => void;
  alSeleccionar: (id: string | null) => void;
  alPerderContexto: () => void;
};

const DIRECCIONES: Record<VistaCamara, Vector3> = {
  inicial: new Vector3(0.62, 0.3, 1).normalize(),
  frontal: new Vector3(0, 0, 1),
  lateral: new Vector3(1, 0, 0),
  superior: new Vector3(0, 1, 0.0001).normalize(),
};
const VERDE = 0x84cc16;

export function crearVisor(lienzo: HTMLCanvasElement, opciones: OpcionesVisor) {
  const renderer = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opciones.calidad));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  const escena = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: opciones.entornoReducido ? 64 : 256 }).texture;
  escena.environment = entorno;
  escena.add(new HemisphereLight(0xdfe6f2, 0x0a1f44, 0.6));
  const luz = new DirectionalLight(0xffffff, 1.6);
  luz.position.set(18, 40, 30);
  escena.add(luz);

  const camara = new PerspectiveCamera(30, 1, 0.01, 2000);
  const controles = new OrbitControls(camara, lienzo);
  controles.enablePan = false;
  controles.enableDamping = false;
  controles.rotateSpeed = 0.6;
  controles.zoomSpeed = 0.8;

  let modelo: ModeloVisor | null = null;
  let materiales = new Map<string, MeshStandardMaterial[]>();
  let ancho = 1, alto = 1, pendiente = 0, vivo = true;
  let seleccion: string | null = null;
  let resaltado: string | null = null;
  const ocultas = new Set<string>();
  let aislada: string | null = null;

  const pedir = () => {
    if (!pendiente && vivo) pendiente = requestAnimationFrame(renderizar);
  };
  controles.addEventListener('change', pedir);

  function encuadrar(direccion: Vector3, conservarDistancia = false) {
    if (!modelo) return;
    const { centro, radio } = modelo.encuadre();
    const vf = (camara.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camara.aspect);
    const distancia = conservarDistancia ? camara.position.distanceTo(controles.target) : (radio / Math.sin(Math.min(vf, hf) / 2)) * 1.02;
    controles.minDistance = radio * 0.9;
    controles.maxDistance = radio * 8;
    controles.target.copy(centro);
    camara.position.copy(centro).addScaledVector(direccion, distancia);
    camara.near = Math.max(0.01, radio / 100);
    camara.far = radio * 40;
    camara.updateProjectionMatrix();
    controles.update();
    pedir();
  }

  /** Materiales propios de cada pieza: los compartidos se clonan para resaltar una pieza sin teñir las demás. */
  function prepararMateriales(m: ModeloVisor) {
    const duenos = new Map<Material, string>();
    const porPieza = new Map<string, MeshStandardMaterial[]>();
    for (const p of m.piezas) {
      const lista: MeshStandardMaterial[] = [];
      p.objeto.traverse((o) => {
        if (!(o instanceof Mesh)) return;
        const mats = (Array.isArray(o.material) ? o.material : [o.material]) as Material[];
        const nuevos = mats.map((mat) => {
          if (!(mat instanceof MeshStandardMaterial) || mat.transparent) return mat;
          const dueno = duenos.get(mat);
          if (dueno && dueno !== p.id) {
            const copia = mat.clone();
            duenos.set(copia, p.id);
            lista.push(copia);
            return copia;
          }
          duenos.set(mat, p.id);
          if (!lista.includes(mat)) lista.push(mat);
          return mat;
        });
        o.material = Array.isArray(o.material) ? nuevos : nuevos[0]!;
      });
      porPieza.set(p.id, lista);
    }
    return porPieza;
  }

  function aplicarApariencia() {
    if (!modelo) return;
    for (const p of modelo.piezas) {
      p.objeto.visible = aislada ? p.id === aislada : !ocultas.has(p.id);
      const intensidad = p.id === seleccion ? 0.45 : p.id === resaltado ? 0.3 : 0;
      for (const m of materiales.get(p.id) ?? []) {
        m.emissive.setHex(VERDE);
        m.emissiveIntensity = intensidad;
      }
    }
  }

  function renderizar() {
    pendiente = 0;
    if (!vivo || !modelo) return;
    aplicarApariencia();
    renderer.render(escena, camara);
    const anclas: AnclaVisor[] = [];
    for (const p of modelo.piezas) {
      const mundo = p.ancla ? p.ancla() : new Box3().setFromObject(p.objeto).getCenter(new Vector3());
      const v = mundo.project(camara);
      anclas.push({ id: p.id, x: ((v.x + 1) / 2) * ancho, y: ((1 - v.y) / 2) * alto, visible: v.z < 1 && p.objeto.visible });
    }
    opciones.alRenderizar(anclas);
  }

  // Selección: un toque o clic sin arrastre elige la pieza visible más cercana bajo el puntero.
  const rayo = new Raycaster();
  let inicio: { x: number; y: number } | null = null;
  const alBajar = (e: PointerEvent) => {
    inicio = { x: e.clientX, y: e.clientY };
  };
  const alSubir = (e: PointerEvent) => {
    if (!inicio || !modelo) return;
    const movido = Math.hypot(e.clientX - inicio.x, e.clientY - inicio.y);
    inicio = null;
    if (movido > 6) return;
    const r = lienzo.getBoundingClientRect();
    rayo.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camara);
    const visibleDeVerdad = (o: Object3D | null): boolean => (o ? o.visible && visibleDeVerdad(o.parent) : true);
    const golpe = rayo.intersectObject(modelo.raiz, true).find((i) => visibleDeVerdad(i.object));
    let id: string | null = null;
    if (golpe) {
      for (let o: Object3D | null = golpe.object; o && !id; o = o.parent) id = modelo.piezas.find((p) => p.objeto === o)?.id ?? null;
    }
    opciones.alSeleccionar(id);
  };
  lienzo.addEventListener('pointerdown', alBajar);
  lienzo.addEventListener('pointerup', alSubir);
  const alPerder = (e: Event) => {
    e.preventDefault();
    opciones.alPerderContexto();
  };
  lienzo.addEventListener('webglcontextlost', alPerder);

  return {
    mostrar(nuevo: ModeloVisor, valores: Record<string, number>) {
      if (modelo) {
        escena.remove(modelo.raiz);
        modelo.destruir();
      }
      modelo = nuevo;
      materiales = prepararMateriales(nuevo);
      nuevo.parametros?.(valores);
      escena.add(nuevo.raiz);
      encuadrar(DIRECCIONES.inicial);
    },
    parametros(valores: Record<string, number>) {
      if (!modelo?.parametros) return;
      modelo.parametros(valores);
      // El objetivo sigue al modelo (el despiece lo desplaza) sin cambiar el zoom que eligió la persona.
      const antes = controles.target.clone();
      const { centro } = modelo.encuadre();
      camara.position.add(centro.clone().sub(antes));
      controles.target.copy(centro);
      controles.update();
      pedir();
    },
    seleccionar(id: string | null) {
      seleccion = id;
      pedir();
    },
    resaltar(id: string | null) {
      resaltado = id;
      pedir();
    },
    ocultar(id: string, oculta: boolean) {
      if (oculta) ocultas.add(id);
      else ocultas.delete(id);
      pedir();
    },
    aislar(id: string | null) {
      aislada = id;
      pedir();
    },
    vista(v: VistaCamara) {
      encuadrar(DIRECCIONES[v]);
    },
    acercar(factor: number) {
      const rel = camara.position.clone().sub(controles.target);
      const d = Math.min(controles.maxDistance, Math.max(controles.minDistance, rel.length() * factor));
      camara.position.copy(controles.target).addScaledVector(rel.normalize(), d);
      controles.update();
      pedir();
    },
    girar(grados: number) {
      const rel = camara.position.clone().sub(controles.target);
      rel.applyAxisAngle(new Vector3(0, 1, 0), (grados * Math.PI) / 180);
      camara.position.copy(controles.target).add(rel);
      controles.update();
      pedir();
    },
    redimensionar(w: number, h: number) {
      ancho = Math.max(1, w);
      alto = Math.max(1, h);
      renderer.setSize(ancho, alto, false);
      camara.aspect = ancho / alto;
      camara.updateProjectionMatrix();
      pedir();
    },
    destruir() {
      vivo = false;
      cancelAnimationFrame(pendiente);
      lienzo.removeEventListener('pointerdown', alBajar);
      lienzo.removeEventListener('pointerup', alSubir);
      lienzo.removeEventListener('webglcontextlost', alPerder);
      controles.dispose();
      if (modelo) {
        escena.remove(modelo.raiz);
        modelo.destruir();
      }
      for (const lista of materiales.values()) lista.forEach((m) => m.dispose());
      entorno.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}
export type Visor = ReturnType<typeof crearVisor>;

/** Libera todo lo que cuelga de un objeto: geometrías, materiales y sus texturas. */
export function liberar(raiz: Object3D) {
  raiz.traverse((o) => {
    if (!(o instanceof Mesh)) return;
    o.geometry.dispose();
    for (const m of (Array.isArray(o.material) ? o.material : [o.material]) as Material[]) {
      for (const valor of Object.values(m)) if (valor && typeof valor === 'object' && 'isTexture' in valor) (valor as { dispose: () => void }).dispose();
      m.dispose();
    }
  });
}

/** Esfera que envuelve un objeto (para encuadrar modelos cargados de un archivo). */
export function esferaDe(o: Object3D) {
  return new Box3().setFromObject(o).getBoundingSphere(new Sphere());
}
