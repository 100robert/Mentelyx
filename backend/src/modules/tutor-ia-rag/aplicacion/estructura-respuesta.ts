import { Accion, aplicarAcciones, crearEstado } from '@mentelyx/contratos/educacion/bloque-acciones';
import { ClaveModelo, type ColorToken } from '@mentelyx/contratos/educacion/bloque-esquema';
import { validarBloque } from '@mentelyx/contratos/educacion/bloque-validacion';

/**
 * Bloques y acciones propuestos por el Tutor (diseño de API, 12.4; motor visual, secciones 6 y 7).
 *
 * El modelo escribe, al final de su respuesta y de forma opcional, una sección ```mentelyx con una notación compacta
 * (sin identificadores ni campos técnicos). El servidor:
 *  1. la separa del Markdown (nunca se muestra como texto ni se ejecuta);
 *  2. la expande de forma determinista a `mentelyx.bloque/v1` (identificadores, orden, origen `tutor`, colores por token);
 *  3. valida cada bloque con el mismo `validarBloque` del cliente y cada acción con el mismo reductor (`aplicarAcciones`);
 *  4. descarta lo inválido y lo informa con un aviso. Los números derivados (raíces, pendientes) los calcula el cliente.
 */
export const MAX_BLOQUES_TUTOR = 12;
export const MAX_ACCIONES_TUTOR = 40;
const MAX_SECCION = 64 * 1024;
const SECCION = /```mentelyx[^\n]*\n([\s\S]*?)```/g;
const SERIES: ColorToken[] = ['serie1', 'serie2', 'serie3', 'serie4', 'serie5', 'serie6'];

export type Estructura = { markdown: string; bloques: unknown[]; acciones: unknown[]; descartados: number };
export const AVISO_ESTRUCTURA = 'El Tutor propuso una representación que no superó la validación; se muestra solo lo que es válido.';

type Obj = Record<string, unknown>;
const esObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const txt = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : undefined);
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined);
const lista = (v: unknown, max: number): unknown[] => (Array.isArray(v) ? v.slice(0, max) : []);
const sinVacios = <T extends Obj>(o: T): T => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as T;

const NOMBRE: Record<string, string> = {
  formula: 'Fórmula',
  pasos: 'Procedimiento',
  grafico: 'Gráfico',
  vectores: 'Diagrama de vectores',
  tabla: 'Tabla',
  'linea-tiempo': 'Línea de tiempo',
  codigo: 'Código',
  comparacion: 'Comparación',
  ejercicio: 'Actividad',
  'modelo-3d': 'Modelo 3D',
};

function vista(v: unknown, respaldo: { xMin: number; xMax: number; yMin: number; yMax: number }) {
  if (!esObj(v)) return respaldo;
  const r = { xMin: num(v.xMin), xMax: num(v.xMax), yMin: num(v.yMin), yMax: num(v.yMax) };
  return r.xMin !== undefined && r.xMax !== undefined && r.yMin !== undefined && r.yMax !== undefined ? (r as typeof respaldo) : respaldo;
}

/** Contenido del bloque según su tipo, a partir de la notación compacta. `null`: tipo no admitido en propuestas. */
function contenido(tipo: string, p: Obj): Obj | null {
  switch (tipo) {
    case 'formula':
      return sinVacios({ latex: txt(p.latex, 2000), lectura: txt(p.lectura, 600), quimica: p.quimica === true ? true : undefined });
    case 'pasos':
      return { pasos: lista(p.pasos, 20).map((s, k) => (esObj(s) ? sinVacios({ id: `p${k + 1}`, titulo: txt(s.titulo, 80), texto: txt(s.texto, 600) ?? '', latex: txt(s.latex, 1500) }) : s)) };
    case 'grafico':
      return sinVacios({
        vista: vista(p.vista, { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }),
        ejes: esObj(p.ejes) ? { x: txt(p.ejes.x, 30) ?? 'x', y: txt(p.ejes.y, 30) ?? 'y' } : undefined,
        funciones: lista(p.funciones, 6).map((f, k) =>
          typeof f === 'string' ? { id: `f${k + 1}`, expresion: f.slice(0, 200), color: SERIES[k]! } : esObj(f) ? sinVacios({ id: `f${k + 1}`, expresion: txt(f.expresion, 200), color: SERIES[k]!, etiqueta: txt(f.etiqueta, 60) }) : f,
        ),
      });
    case 'vectores':
      return {
        vista: vista(p.vista, { xMin: -10, xMax: 10, yMin: -10, yMax: 10 }),
        vectores: lista(p.vectores, 12).map((v, k) => (esObj(v) ? { id: `v${k + 1}`, origen: v.origen ?? [0, 0], componentes: v.componentes, color: SERIES[k % SERIES.length]!, etiqueta: txt(v.etiqueta, 40) ?? `v${k + 1}` } : v)),
      };
    case 'tabla':
      return sinVacios({
        columnas: lista(p.columnas, 8).map((c) => (typeof c === 'string' ? c.slice(0, 60) : c)),
        filas: lista(p.filas, 60).map((f, k) => ({ id: `r${k + 1}`, celdas: lista(f, 8).map((c) => (typeof c === 'number' ? String(c) : typeof c === 'string' ? c.slice(0, 200) : c)) })),
        leyenda: txt(p.leyenda, 200),
      });
    case 'linea-tiempo':
      return { eventos: lista(p.eventos, 40).map((e, k) => (esObj(e) ? { id: `e${k + 1}`, fecha: txt(e.fecha, 40), orden: num(e.orden) ?? k + 1, titulo: txt(e.titulo, 120), texto: txt(e.texto, 500) ?? '' } : e)) };
    case 'codigo':
      return { lenguaje: p.lenguaje, codigo: txt(p.codigo, 8000) };
    case 'comparacion':
      return { columnas: lista(p.columnas, 4).map((c, k) => (esObj(c) ? { id: `c${k + 1}`, titulo: txt(c.titulo, 80), puntos: lista(c.puntos, 12).map((x) => (typeof x === 'string' ? x.slice(0, 240) : x)) } : c)) };
    case 'ejercicio': {
      const comun = { enunciado: txt(p.enunciado, 1200), pista: txt(p.pista, 600), explicacion: txt(p.explicacion, 1200) };
      if (Array.isArray(p.opciones)) {
        const opciones = lista(p.opciones, 6).map((o, k) => ({ id: `o${k + 1}`, texto: typeof o === 'string' ? o.slice(0, 300) : esObj(o) ? txt(o.texto, 300) : o }));
        const indice = num(p.correcta);
        return sinVacios({ modo: 'opcion', ...comun, opciones, correcta: indice !== undefined ? `o${Math.trunc(indice)}` : p.correcta });
      }
      return sinVacios({ modo: 'numero', ...comun, respuesta: num(p.respuesta), tolerancia: num(p.tolerancia) });
    }
    case 'modelo-3d': {
      const clave = ClaveModelo.safeParse(p.clave);
      return clave.success ? { modelo: { tipo: 'catalogo', clave: clave.data } } : { modelo: { tipo: 'catalogo', clave: p.clave } };
    }
    default:
      // texto (ya es el Markdown), obra y pdf (recursos del catálogo que el modelo no elige) y desconocido.
      return null;
  }
}

/** Expande una propuesta compacta a un bloque completo (sin validar). */
export function expandirBloque(p: unknown, id: string, orden: number): unknown {
  if (!esObj(p) || typeof p.tipo !== 'string') return null;
  const c = contenido(p.tipo, p);
  if (!c) return null;
  const titulo = txt(p.titulo, 160);
  const descripcion = txt(p.descripcion, 1500) || `${NOMBRE[p.tipo] ?? 'Bloque'} propuesto por el Tutor${titulo ? `: ${titulo}` : ''}.`;
  return sinVacios({ id, version: 1, tipo: p.tipo, orden, origen: 'tutor', titulo, accesibilidad: { descripcion }, contenido: c });
}

/** Traduce `bloque: N` (posición 1..n en la propuesta) al identificador asignado; descarta referencias imposibles. */
function expandirAccion(a: unknown, ids: readonly string[]): unknown {
  if (!esObj(a)) return a;
  const { bloque, ...resto } = a;
  const n = num(bloque);
  return n !== undefined && Number.isInteger(n) && n >= 1 && n <= ids.length ? { ...resto, bloqueId: ids[n - 1] } : resto;
}

/**
 * Separa la sección estructurada del Markdown y devuelve solo bloques y acciones válidos. `prefijo` forma identificadores
 * estables (`^[a-z][a-z0-9_-]{0,31}$`) para que el estado guardado de la sesión los vuelva a encontrar.
 */
export function extraerEstructura(markdown: string, prefijo: string, ordenInicial = 1): Estructura {
  const secciones = [...markdown.matchAll(SECCION)];
  const limpio = markdown.replace(SECCION, '').replace(/\n{3,}/g, '\n\n').trim();
  const ultima = secciones.at(-1)?.[1];
  if (ultima === undefined) return { markdown: limpio, bloques: [], acciones: [], descartados: 0 };
  let propuesta: unknown;
  try {
    propuesta = ultima.length > MAX_SECCION ? null : JSON.parse(ultima);
  } catch {
    propuesta = null;
  }
  if (!esObj(propuesta)) return { markdown: limpio, bloques: [], acciones: [], descartados: 1 };

  const bloques: unknown[] = [];
  const ids: string[] = [];
  let descartados = 0;
  lista(propuesta.bloques, MAX_BLOQUES_TUTOR).forEach((p, k) => {
    const id = `${prefijo}-b${k + 1}`;
    const r = validarBloque(expandirBloque(p, id, ordenInicial + k));
    if (r.ok && r.bloque.tipo !== 'desconocido' && r.bloque.tipo !== 'texto') {
      bloques.push(r.bloque);
      ids.push(id);
    } else {
      descartados += 1;
      ids.push(''); // la posición se conserva para que `bloque: N` no apunte a otro bloque
    }
  });

  // Cada acción se valida con el esquema y se aplica sobre los bloques válidos; si cambia algo inválido, se descarta.
  const acciones: unknown[] = [];
  let estado = crearEstado(bloques);
  for (const a of lista(propuesta.acciones, MAX_ACCIONES_TUTOR)) {
    const candidata = expandirAccion(a, ids);
    const esquema = Accion.safeParse(candidata);
    if (!esquema.success || esquema.data.accion === 'crear-bloque' || esquema.data.accion === 'actualizar-bloque') {
      descartados += 1;
      continue;
    }
    const r = aplicarAcciones(estado, [esquema.data]);
    if (r.error) {
      descartados += 1;
      continue;
    }
    estado = r.estado;
    acciones.push(esquema.data);
  }
  return { markdown: limpio || 'El Tutor no devolvió texto.', bloques, acciones, descartados };
}

/** Prefijo de identificadores para los bloques de un mensaje: corto, aleatorio y válido para `mentelyx.bloque/v1`. */
export const prefijoBloques = () => `t${crypto.randomUUID().replaceAll('-', '').slice(0, 10)}`;
