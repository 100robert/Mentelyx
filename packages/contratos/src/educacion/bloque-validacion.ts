import { analizar } from './expresion';
import { MODELOS } from './bloque-catalogo';
import { Bloque, ESQUEMA_BLOQUE, RE_ID, TIPOS, type BloqueDe, type TipoBloque } from './bloque-esquema';

/**
 * Validación en tres etapas (como la de escenas del motor visual, sección 7): tamaño, esquema y semántica (identificadores
 * únicos, referencias existentes, rangos, expresiones analizables con las variables declaradas y recursos del catálogo).
 * Un bloque de tipo o versión desconocidos, o inválido, nunca se descarta en silencio ni se renderiza a medias: se
 * convierte en un bloque `desconocido` que la interfaz muestra como alternativa segura, sin su contenido.
 */
export type ErrorValidacion = { codigo: string; ruta: string; mensaje: string };
export type ResultadoBloque = { ok: true; bloque: Bloque } | { ok: false; bloque: BloqueDe<'desconocido'>; errores: ErrorValidacion[] };

export const TAMANO_MAXIMO = 256 * 1024;
const TIPOS_CONOCIDOS = new Set<string>(TIPOS.filter((t) => t !== 'desconocido'));

function respaldo(entrada: unknown, id: string, orden: number, motivo: 'tipo' | 'version' | 'invalido', errores: ErrorValidacion[]): ResultadoBloque {
  const e = (typeof entrada === 'object' && entrada !== null ? entrada : {}) as Record<string, unknown>;
  const idValido = typeof e.id === 'string' && RE_ID.test(e.id) ? e.id : id;
  const tipoOriginal = typeof e.tipo === 'string' ? e.tipo.slice(0, 40) : 'sin tipo';
  return {
    ok: false,
    errores,
    bloque: {
      id: idValido,
      version: 1,
      orden: typeof e.orden === 'number' && Number.isInteger(e.orden) && e.orden >= 0 && e.orden <= 9999 ? e.orden : orden,
      tipo: 'desconocido',
      origen: e.origen === 'tutor' || e.origen === 'recorrido' || e.origen === 'persona' ? e.origen : 'ejemplo',
      accesibilidad: { descripcion: 'Contenido que esta versión de Mentelyx no puede mostrar.' },
      contenido: { tipoOriginal, motivo, errores: errores.slice(0, 10).map((x) => `${x.ruta}: ${x.mensaje}`.slice(0, 200)) },
    },
  };
}

const unicos = (ids: string[], ruta: string, errores: ErrorValidacion[]) => {
  const vistos = new Set<string>();
  ids.forEach((id, k) => {
    if (vistos.has(id)) errores.push({ codigo: 'ID_DUPLICADO', ruta: `${ruta}/${k}`, mensaje: `El identificador «${id}» está repetido.` });
    vistos.add(id);
  });
};

function semantica(b: Bloque): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  const rango = (min: number, max: number, ruta: string) => {
    if (!(min < max)) errores.push({ codigo: 'RANGO_INVALIDO', ruta, mensaje: 'El mínimo debe ser menor que el máximo.' });
  };
  unicos((b.referencias ?? []).map((r) => r.id), '/referencias', errores);
  switch (b.tipo) {
    case 'pasos':
      unicos(b.contenido.pasos.map((p) => p.id), '/contenido/pasos', errores);
      if ((b.contenido.revelados ?? 1) > b.contenido.pasos.length) errores.push({ codigo: 'RANGO_INVALIDO', ruta: '/contenido/revelados', mensaje: 'Hay menos pasos que los revelados.' });
      break;
    case 'grafico': {
      const c = b.contenido;
      rango(c.vista.xMin, c.vista.xMax, '/contenido/vista');
      rango(c.vista.yMin, c.vista.yMax, '/contenido/vista');
      const parametros = c.parametros ?? [];
      unicos(parametros.map((p) => p.id), '/contenido/parametros', errores);
      parametros.forEach((p, k) => {
        rango(p.min, p.max, `/contenido/parametros/${k}`);
        if (p.id === 'x') errores.push({ codigo: 'ID_RESERVADO', ruta: `/contenido/parametros/${k}`, mensaje: '«x» es la variable independiente.' });
        if (p.valor < p.min || p.valor > p.max) errores.push({ codigo: 'RANGO_INVALIDO', ruta: `/contenido/parametros/${k}/valor`, mensaje: 'El valor está fuera del rango.' });
      });
      const nombres = parametros.map((p) => p.id);
      const funciones = new Set(c.funciones.map((f) => f.id));
      unicos([...c.funciones.map((f) => f.id), ...(c.puntos ?? []).map((p) => p.id), ...(c.tangentes ?? []).map((t) => t.id)], '/contenido', errores);
      c.funciones.forEach((f, k) => {
        const r = analizar(f.expresion, ['x', ...nombres]);
        if (!r.ok) errores.push({ codigo: r.error.codigo, ruta: `/contenido/funciones/${k}/expresion`, mensaje: r.error.mensaje });
      });
      const abscisa = (x: number | string, ruta: string) => {
        if (typeof x === 'number') return;
        const r = analizar(x, nombres);
        if (!r.ok) errores.push({ codigo: r.error.codigo, ruta, mensaje: r.error.mensaje });
      };
      (c.puntos ?? []).forEach((p, k) => {
        if (!funciones.has(p.en)) errores.push({ codigo: 'REFERENCIA_INEXISTENTE', ruta: `/contenido/puntos/${k}/en`, mensaje: `No existe la función «${p.en}».` });
        abscisa(p.x, `/contenido/puntos/${k}/x`);
      });
      (c.tangentes ?? []).forEach((t, k) => {
        if (!funciones.has(t.funcion)) errores.push({ codigo: 'REFERENCIA_INEXISTENTE', ruta: `/contenido/tangentes/${k}/funcion`, mensaje: `No existe la función «${t.funcion}».` });
        abscisa(t.x, `/contenido/tangentes/${k}/x`);
      });
      break;
    }
    case 'vectores': {
      const c = b.contenido;
      rango(c.vista.xMin, c.vista.xMax, '/contenido/vista');
      rango(c.vista.yMin, c.vista.yMax, '/contenido/vista');
      unicos([...c.vectores.map((v) => v.id), ...(c.resultante ? [c.resultante.id] : [])], '/contenido/vectores', errores);
      const ids = new Set(c.vectores.map((v) => v.id));
      c.resultante?.de.forEach((id, k) => {
        if (!ids.has(id)) errores.push({ codigo: 'REFERENCIA_INEXISTENTE', ruta: `/contenido/resultante/de/${k}`, mensaje: `No existe el vector «${id}».` });
      });
      break;
    }
    case 'tabla':
      unicos(b.contenido.filas.map((f) => f.id), '/contenido/filas', errores);
      b.contenido.filas.forEach((f, k) => {
        if (f.celdas.length !== b.contenido.columnas.length) errores.push({ codigo: 'TABLA_IRREGULAR', ruta: `/contenido/filas/${k}`, mensaje: 'La fila no tiene tantas celdas como columnas.' });
      });
      break;
    case 'linea-tiempo':
      unicos(b.contenido.eventos.map((e) => e.id), '/contenido/eventos', errores);
      break;
    case 'comparacion':
      unicos(b.contenido.columnas.map((c) => c.id), '/contenido/columnas', errores);
      break;
    case 'ejercicio':
      if (b.contenido.modo === 'opcion') {
        const c = b.contenido;
        unicos(c.opciones.map((o) => o.id), '/contenido/opciones', errores);
        if (!c.opciones.some((o) => o.id === c.correcta)) errores.push({ codigo: 'REFERENCIA_INEXISTENTE', ruta: '/contenido/correcta', mensaje: 'La opción correcta no está entre las opciones.' });
      }
      break;
    case 'obra': {
      const { imagen, regiones, lineas } = b.contenido;
      unicos([...regiones.map((r) => r.id), ...(lineas ?? []).map((l) => l.id)], '/contenido', errores);
      const dentro = ([x, y]: readonly [number, number]) => x <= imagen.ancho && y <= imagen.alto;
      regiones.forEach((r, k) => {
        const puntos = r.forma.tipo === 'circulo' ? [r.forma.centro] : [r.forma.desde, r.forma.hasta];
        if (!puntos.every(dentro)) errores.push({ codigo: 'FUERA_DE_LA_IMAGEN', ruta: `/contenido/regiones/${k}`, mensaje: 'La región sale de la imagen.' });
      });
      (lineas ?? []).forEach((l, k) => {
        if (!l.puntos.every(dentro)) errores.push({ codigo: 'FUERA_DE_LA_IMAGEN', ruta: `/contenido/lineas/${k}`, mensaje: 'La línea sale de la imagen.' });
      });
      if (!(b.referencias ?? []).some((r) => r.tipo === 'credito')) errores.push({ codigo: 'CREDITO_OBLIGATORIO', ruta: '/referencias', mensaje: 'Una obra necesita su crédito y su licencia.' });
      break;
    }
    case 'modelo-3d': {
      const { modelo, partes } = b.contenido;
      unicos((partes ?? []).map((p) => p.id), '/contenido/partes', errores);
      if (modelo.tipo === 'catalogo') {
        const conocidas = new Set(MODELOS[modelo.clave].partes.map((p) => p.id));
        (partes ?? []).forEach((p, k) => {
          if (!conocidas.has(p.id)) errores.push({ codigo: 'REFERENCIA_INEXISTENTE', ruta: `/contenido/partes/${k}`, mensaje: `El modelo no tiene la pieza «${p.id}».` });
        });
      }
      break;
    }
    case 'texto': {
      const numeros = (b.referencias ?? []).flatMap((r) => (r.tipo === 'cita' ? [r.numero] : []));
      unicos(numeros.map(String).map((n) => `c${n}`), '/referencias', errores);
      break;
    }
    default:
      break;
  }
  return errores;
}

/**
 * Valida un bloque recibido (del Tutor, del recorrido guiado o de un ejemplo). Nunca lanza.
 * `id` y `orden` de respaldo se usan si la entrada ni siquiera trae unos válidos.
 */
export function validarBloque(entrada: unknown, respaldoId = 'bloque', respaldoOrden = 0): ResultadoBloque {
  let tamano: number;
  try {
    tamano = JSON.stringify(entrada)?.length ?? 0;
  } catch {
    return respaldo(entrada, respaldoId, respaldoOrden, 'invalido', [{ codigo: 'JSON_INVALIDO', ruta: '', mensaje: 'El bloque no es un dato serializable.' }]);
  }
  if (tamano > TAMANO_MAXIMO) return respaldo(entrada, respaldoId, respaldoOrden, 'invalido', [{ codigo: 'BLOQUE_DEMASIADO_GRANDE', ruta: '', mensaje: 'El bloque supera 256 KB.' }]);
  const e = (typeof entrada === 'object' && entrada !== null ? entrada : {}) as Record<string, unknown>;
  if (typeof e.tipo !== 'string' || !TIPOS_CONOCIDOS.has(e.tipo)) return respaldo(entrada, respaldoId, respaldoOrden, 'tipo', [{ codigo: 'TIPO_DESCONOCIDO', ruta: '/tipo', mensaje: 'Tipo de bloque desconocido.' }]);
  if (e.version !== 1) return respaldo(entrada, respaldoId, respaldoOrden, 'version', [{ codigo: 'VERSION_NO_ADMITIDA', ruta: '/version', mensaje: `Esta aplicación muestra ${ESQUEMA_BLOQUE}.` }]);
  const r = Bloque.safeParse(entrada);
  if (!r.success) {
    const errores = r.error.issues.slice(0, 10).map((i) => ({ codigo: 'ESQUEMA_INVALIDO', ruta: `/${i.path.map(String).join('/')}`, mensaje: i.message }));
    return respaldo(entrada, respaldoId, respaldoOrden, 'invalido', errores);
  }
  const errores = semantica(r.data);
  if (errores.length > 0) return respaldo(entrada, respaldoId, respaldoOrden, 'invalido', errores);
  return { ok: true, bloque: r.data };
}

/** Los bloques ya validados que el código de Mentelyx define como ejemplos: si alguno no valida, es un error de programación. */
export function bloqueDeEjemplo<T extends TipoBloque>(b: Extract<Bloque, { tipo: T }>): Extract<Bloque, { tipo: T }> {
  const r = validarBloque(b, b.id, b.orden);
  if (!r.ok) throw new Error(`Bloque de ejemplo inválido «${b.id}»: ${r.errores.map((x) => `${x.ruta} ${x.mensaje}`).join('; ')}`);
  return b;
}
