import { ACESFilmicToneMapping, DirectionalLight, HemisphereLight, PerspectiveCamera, PMREMGenerator, Scene, Vector3, WebGLRenderer } from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { construirMotor, type Ancla, type EstadoMotor } from './modelos/motor';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Escena del motor vinculada al desplazamiento (landing). El encuadre sigue al despiece; sin zoom ni desplazamiento lateral,
 * y el arrastre solo con puntero fino para no capturar el desplazamiento táctil. Renderiza bajo demanda, nunca en bucle.
 */
export function crearMotor(lienzo: HTMLCanvasElement, opciones: { arrastre: boolean; calidad: number; entornoReducido: boolean; alRenderizar: (anclas: Ancla[]) => void }) {
  const renderer = new WebGLRenderer({ canvas: lienzo, antialias: true, alpha: true, powerPreference: 'default' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opciones.calidad));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;

  const escena = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  // Entorno de reflejos: en móviles y equipos modestos se genera a menor resolución (menos trabajo en el hilo principal).
  const entorno = pmrem.fromScene(new RoomEnvironment(), 0.04, 0.1, 100, { size: opciones.entornoReducido ? 64 : 256 }).texture;
  escena.environment = entorno;
  escena.add(new HemisphereLight(0xdfe6f2, 0x0a1f44, 0.6));
  const clave = new DirectionalLight(0xffffff, 1.6);
  clave.position.set(18, 40, 30);
  escena.add(clave);

  const motor = construirMotor();
  escena.add(motor.raiz);

  const camara = new PerspectiveCamera(30, 1, 1, 400);
  const direccion = new Vector3(0.62, 0.3, 1).normalize();
  const objetivo = new Vector3(0, 11, 0);
  let controles: OrbitControls | null = null;
  if (opciones.arrastre) {
    controles = new OrbitControls(camara, lienzo);
    controles.enableZoom = false;
    controles.enablePan = false;
    controles.enableDamping = false;
    controles.rotateSpeed = 0.55;
    controles.minPolarAngle = 0.55;
    controles.maxPolarAngle = 2.0;
  }
  camara.position.copy(objetivo).addScaledVector(direccion, 70);
  camara.lookAt(objetivo);
  if (controles) {
    controles.target.copy(objetivo);
    controles.update();
  }

  let estado: EstadoMotor = { explosion: 0, angulo: 40, ciclo: false, resaltar: null };
  let ancho = 1, alto = 1, pendiente = 0, vivo = true;

  const distanciaPara = (altoObjeto: number, anchoObjeto: number) => {
    const vf = (camara.fov * Math.PI) / 180;
    const hf = 2 * Math.atan(Math.tan(vf / 2) * camara.aspect);
    return Math.max(altoObjeto / 2 / Math.tan(vf / 2), anchoObjeto / 2 / Math.tan(hf / 2)) * 1.04;
  };

  function aplicar() {
    motor.aplicar(estado);
    const e = estado.explosion;
    // Encuadre: el despiece ocupa más altura; la cámara se aleja y sube su objetivo.
    const nuevoObjetivo = new Vector3(4.5 * e, lerp(12, 17.4, e), 0);
    const distancia = lerp(distanciaPara(33, 15), distanciaPara(53, 25), e);
    if (controles) direccion.copy(camara.position).sub(controles.target).normalize();
    objetivo.copy(nuevoObjetivo);
    camara.position.copy(objetivo).addScaledVector(direccion, distancia);
    camara.lookAt(objetivo);
    if (controles) controles.target.copy(objetivo);
  }

  function renderizar() {
    pendiente = 0;
    if (!vivo) return;
    aplicar();
    renderer.render(escena, camara);
    opciones.alRenderizar(
      motor.anclas().map(([parte, v]) => {
        const p = v.project(camara);
        return { parte, x: ((p.x + 1) / 2) * ancho, y: ((1 - p.y) / 2) * alto, visible: p.z < 1 };
      }),
    );
  }
  const pedir = () => {
    if (!pendiente) pendiente = requestAnimationFrame(renderizar);
  };
  controles?.addEventListener('change', pedir);

  return {
    actualizar(nuevo: EstadoMotor) {
      estado = nuevo;
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
    girar(grados: number) {
      const rel = camara.position.clone().sub(objetivo);
      rel.applyAxisAngle(new Vector3(0, 1, 0), (grados * Math.PI) / 180);
      direccion.copy(rel.normalize());
      camara.position.copy(objetivo).addScaledVector(direccion, camara.position.distanceTo(objetivo));
      if (controles) controles.update();
      pedir();
    },
    restablecer() {
      direccion.set(0.62, 0.3, 1).normalize();
      camara.position.copy(objetivo).addScaledVector(direccion, camara.position.distanceTo(objetivo));
      if (controles) controles.update();
      pedir();
    },
    destruir() {
      vivo = false;
      cancelAnimationFrame(pendiente);
      controles?.dispose();
      motor.destruir();
      entorno.dispose();
      pmrem.dispose();
      renderer.dispose();
    },
  };
}

export type Motor = ReturnType<typeof crearMotor>;
