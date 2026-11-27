import { z } from '../zod';
import { MODELOS, parametrosModelo } from './bloque-catalogo';
import { CAPACIDADES, Id, IdParametro, Vista2D, type Bloque, type Capacidad, type Parametro } from './bloque-esquema';
import { validarBloque, type ErrorValidacion } from './bloque-validacion';

/**
 * Acciones educativas validadas. El Tutor, el recorrido guiado y la persona cambian el espacio solo con estas acciones:
 * nunca con HTML, JavaScript ni instrucciones arbitrarias. `aplicarAccion` es un reductor puro y determinista: si la acción
 * no es válida, el estado no cambia (no se destruye nada) y se devuelve un error que la interfaz muestra.
 */
export const MAX_BLOQUES = 60;

const VistaCamara = z.enum(['inicial', 'frontal', 'lateral', 'superior']);
export const Accion = z.discriminatedUnion('accion', [
  z.strictObject({ accion: z.literal('crear-bloque'), bloque: z.unknown(), enfocar: z.boolean().optional() }),
  z.strictObject({ accion: z.literal('actualizar-bloque'), bloqueId: Id, contenido: z.record(z.string(), z.unknown()), titulo: z.string().max(160).optional() }),
  z.strictObject({ accion: z.literal('enfocar-bloque'), bloqueId: Id }),
  z.strictObject({ accion: z.literal('resaltar'), bloqueId: Id, objetivo: Id.nullable() }),
  z.strictObject({ accion: z.literal('revelar-paso'), bloqueId: Id, paso: z.union([Id, z.enum(['@siguiente', '@anterior', '@todos'])]) }),
  z.strictObject({ accion: z.literal('seleccionar-estructura'), bloqueId: Id, parte: Id.nullable() }),
  z.strictObject({ accion: z.literal('modificar-parametro'), bloqueId: Id, parametro: IdParametro, valor: z.number().finite() }),
  z.strictObject({ accion: z.literal('mostrar-referencia'), bloqueId: Id, referenciaId: Id.nullable() }),
  z.strictObject({
    accion: z.literal('cambiar-vista'),
    bloqueId: Id,
    vista: z.discriminatedUnion('tipo', [
      Vista2D.extend({ tipo: z.literal('plano') }).strict(),
      z.strictObject({ tipo: z.literal('camara'), preset: VistaCamara }),
      z.strictObject({ tipo: z.literal('pagina'), pagina: z.number().int().min(1).max(5000) }),
      z.strictObject({ tipo: z.literal('zoom'), nivel: z.number().min(1).max(8) }),
    ]),
  }),
]);
export type Accion = z.infer<typeof Accion>;
export type NombreAccion = Accion['accion'];
export type VistaBloque = Extract<Accion, { accion: 'cambiar-vista' }>['vista'];

/** Estado de interacción de un bloque: lo que cambia sin reescribir su contenido. */
export type Interaccion = {
  revelados: number;
  resaltado: string | null;
  seleccion: string | null;
  parametros: Record<string, number>;
  vista: VistaBloque | null;
  referencia: string | null;
};
export type EstadoEspacio = { bloques: Bloque[]; activo: string | null; interaccion: Record<string, Interaccion>; revision: number };
export type ErrorAccion = { codigo: string; mensaje: string; errores?: ErrorValidacion[] };
export type Resultado = { estado: EstadoEspacio; error: ErrorAccion | null; anuncio: string | null };

/** Parámetros declarados por el bloque (gráfico) o por su modelo del catálogo (3D). */
export function parametrosDe(b: Bloque): Parametro[] {
  if (b.tipo === 'grafico') return b.contenido.parametros ?? [];
  if (b.tipo === 'modelo-3d') return b.contenido.modelo.tipo === 'catalogo' ? parametrosModelo(b.contenido.modelo.clave) : [];
  return [];
}

/** Elementos de un bloque que se pueden resaltar o seleccionar por su identificador. */
export function objetivosDe(b: Bloque): string[] {
  switch (b.tipo) {
    case 'pasos':
      return b.contenido.pasos.map((p) => p.id);
    case 'grafico':
      return [...b.contenido.funciones.map((f) => f.id), ...(b.contenido.puntos ?? []).map((p) => p.id), ...(b.contenido.tangentes ?? []).map((t) => t.id)];
    case 'vectores':
      return [...b.contenido.vectores.map((v) => v.id), ...(b.contenido.resultante ? [b.contenido.resultante.id] : [])];
    case 'tabla':
      return b.contenido.filas.map((f) => f.id);
    case 'linea-tiempo':
      return b.contenido.eventos.map((e) => e.id);
    case 'comparacion':
      return b.contenido.columnas.map((c) => c.id);
    case 'obra':
      return [...b.contenido.regiones.map((r) => r.id), ...(b.contenido.lineas ?? []).map((l) => l.id)];
    case 'modelo-3d': {
      const m = b.contenido.modelo;
      const delCatalogo = m.tipo === 'catalogo' ? MODELOS[m.clave].partes.map((p) => p.id) : [];
      return [...new Set([...delCatalogo, ...(b.contenido.partes ?? []).map((p) => p.id)])];
    }
    case 'texto':
      return (b.referencias ?? []).map((r) => r.id);
    default:
      return [];
  }
}
export function interaccionInicial(b: Bloque): Interaccion {
  const parametros: Record<string, number> = {};
  for (const p of parametrosDe(b)) parametros[p.id] = p.valor;
  return {
    revelados: b.tipo === 'pasos' ? (b.contenido.revelados ?? 1) : 0,
    resaltado: null,
    seleccion: null,
    parametros,
    vista: b.tipo === 'pdf' && b.contenido.pagina ? { tipo: 'pagina', pagina: b.contenido.pagina } : null,
    referencia: null,
  };
}

const ordenar = (bloques: Bloque[]) => [...bloques].sort((a, b) => a.orden - b.orden || a.id.localeCompare(b.id));

/** Estado inicial a partir de bloques sin validar: cada uno se valida y los inválidos quedan como alternativa segura. */
export function crearEstado(entradas: readonly unknown[], activo?: string): EstadoEspacio {
  const bloques: Bloque[] = [];
  const vistos = new Set<string>();
  entradas.slice(0, MAX_BLOQUES).forEach((e, k) => {
    const r = validarBloque(e, `bloque-${k + 1}`, k);
    let b = r.bloque;
    if (vistos.has(b.id)) b = { ...b, id: `${b.id.slice(0, 24)}-${k + 1}` };
    vistos.add(b.id);
    bloques.push(b);
  });
  const ordenados = ordenar(bloques);
  const interaccion: Record<string, Interaccion> = {};
  for (const b of ordenados) interaccion[b.id] = interaccionInicial(b);
  const elegido = activo && interaccion[activo] ? activo : (ordenados[0]?.id ?? null);
  return { bloques: ordenados, activo: elegido, interaccion, revision: 0 };
}

const fallo = (estado: EstadoEspacio, codigo: string, mensaje: string, errores?: ErrorValidacion[]): Resultado => ({
  estado,
  error: { codigo, mensaje, ...(errores ? { errores } : {}) },
  anuncio: null,
});

/** Aplica una acción (sin validar todavía). Nunca lanza ni muta el estado recibido. */
export function aplicarAccion(estado: EstadoEspacio, entrada: unknown): Resultado {
  const r = Accion.safeParse(entrada);
  if (!r.success) return fallo(estado, 'ACCION_INVALIDA', 'La acción no tiene un formato válido y no se aplicó.');
  const accion = r.data;

  if (accion.accion === 'crear-bloque') {
    if (estado.bloques.length >= MAX_BLOQUES) return fallo(estado, 'LIMITE_BLOQUES', `Una sesión admite hasta ${MAX_BLOQUES} bloques.`);
    const v = validarBloque(accion.bloque, `bloque-${estado.bloques.length + 1}`, estado.bloques.length);
    if (estado.bloques.some((b) => b.id === v.bloque.id)) return fallo(estado, 'ID_DUPLICADO', `Ya existe un bloque «${v.bloque.id}».`);
    // Un bloque inválido también se agrega, como alternativa segura: la persona ve que algo no se pudo mostrar.
    const bloques = ordenar([...estado.bloques, v.bloque]);
    return {
      estado: {
        ...estado,
        bloques,
        activo: accion.enfocar === false && estado.activo ? estado.activo : v.bloque.id,
        interaccion: { ...estado.interaccion, [v.bloque.id]: interaccionInicial(v.bloque) },
        revision: estado.revision + 1,
      },
      error: v.ok ? null : { codigo: 'BLOQUE_INVALIDO', mensaje: 'Una parte de la explicación no se pudo mostrar.', errores: v.errores },
      anuncio: v.ok ? `Nuevo bloque: ${v.bloque.titulo ?? 'sin título'}.` : null,
    };
  }

  const bloque = estado.bloques.find((b) => b.id === accion.bloqueId);
  if (!bloque) return fallo(estado, 'BLOQUE_INEXISTENTE', `No existe el bloque «${accion.bloqueId}».`);
  const actual = estado.interaccion[bloque.id] ?? interaccionInicial(bloque);
  const capacidades = CAPACIDADES[bloque.tipo] as readonly Capacidad[];
  const admite = (c: Capacidad) => capacidades.includes(c) && (!bloque.capacidades || bloque.capacidades.includes(c));
  const conInteraccion = (cambios: Partial<Interaccion>, anuncio: string | null = null, activo = estado.activo): Resultado => ({
    estado: { ...estado, activo, interaccion: { ...estado.interaccion, [bloque.id]: { ...actual, ...cambios } }, revision: estado.revision + 1 },
    error: null,
    anuncio,
  });
  const objetivos = () => new Set(objetivosDe(bloque));

  switch (accion.accion) {
    case 'actualizar-bloque': {
      if (bloque.tipo === 'desconocido') return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no se puede actualizar.');
      const candidato = { ...bloque, contenido: { ...bloque.contenido, ...accion.contenido }, ...(accion.titulo ? { titulo: accion.titulo } : {}) };
      const v = validarBloque(candidato, bloque.id, bloque.orden);
      if (!v.ok) return fallo(estado, 'BLOQUE_INVALIDO', 'La actualización no es válida y se conservó la versión anterior.', v.errores);
      // Se conserva la interacción que siga siendo válida (pasos revelados, parámetros existentes).
      const nueva = interaccionInicial(v.bloque);
      const parametros = { ...nueva.parametros };
      for (const p of parametrosDe(v.bloque)) if (actual.parametros[p.id] !== undefined) parametros[p.id] = Math.min(p.max, Math.max(p.min, actual.parametros[p.id]!));
      const validos = new Set(objetivosDe(v.bloque));
      const revelados = v.bloque.tipo === 'pasos' ? Math.min(v.bloque.contenido.pasos.length, Math.max(actual.revelados, 1)) : 0;
      return {
        estado: {
          ...estado,
          bloques: estado.bloques.map((b) => (b.id === bloque.id ? v.bloque : b)),
          interaccion: {
            ...estado.interaccion,
            [bloque.id]: {
              ...actual,
              parametros,
              revelados,
              resaltado: actual.resaltado && validos.has(actual.resaltado) ? actual.resaltado : null,
              seleccion: actual.seleccion && validos.has(actual.seleccion) ? actual.seleccion : null,
            },
          },
          revision: estado.revision + 1,
        },
        error: null,
        anuncio: null,
      };
    }
    case 'enfocar-bloque':
      return { estado: { ...estado, activo: bloque.id, revision: estado.revision + 1 }, error: null, anuncio: `${bloque.titulo ?? 'Bloque'} en primer plano.` };
    case 'resaltar': {
      if (!admite('resaltar')) return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no admite resaltar partes.');
      if (accion.objetivo && !objetivos().has(accion.objetivo)) return fallo(estado, 'OBJETIVO_INEXISTENTE', `El bloque no tiene «${accion.objetivo}».`);
      // Resaltar un paso todavía oculto lo revela: señalar algo invisible no tendría sentido.
      let revelados = actual.revelados;
      if (bloque.tipo === 'pasos' && accion.objetivo) revelados = Math.max(revelados, bloque.contenido.pasos.findIndex((p) => p.id === accion.objetivo) + 1);
      return conInteraccion({ resaltado: accion.objetivo, revelados }, null, bloque.id);
    }
    case 'revelar-paso': {
      if (!admite('revelar-paso') || bloque.tipo !== 'pasos') return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no tiene pasos.');
      const total = bloque.contenido.pasos.length;
      let revelados: number;
      if (accion.paso === '@siguiente') revelados = Math.min(total, actual.revelados + 1);
      else if (accion.paso === '@anterior') revelados = Math.max(1, actual.revelados - 1);
      else if (accion.paso === '@todos') revelados = total;
      else {
        const k = bloque.contenido.pasos.findIndex((p) => p.id === accion.paso);
        if (k < 0) return fallo(estado, 'OBJETIVO_INEXISTENTE', `No existe el paso «${accion.paso}».`);
        revelados = k + 1;
      }
      const paso = bloque.contenido.pasos[revelados - 1];
      return conInteraccion({ revelados, resaltado: paso?.id ?? null }, paso ? `Paso ${revelados} de ${total}: ${paso.titulo}.` : null, bloque.id);
    }
    case 'seleccionar-estructura': {
      if (!admite('seleccionar-estructura')) return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no tiene partes seleccionables.');
      if (accion.parte && !objetivos().has(accion.parte)) return fallo(estado, 'OBJETIVO_INEXISTENTE', `El bloque no tiene la parte «${accion.parte}».`);
      return conInteraccion({ seleccion: accion.parte }, null, bloque.id);
    }
    case 'modificar-parametro': {
      if (!admite('modificar-parametro')) return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no tiene parámetros.');
      const p = parametrosDe(bloque).find((x) => x.id === accion.parametro);
      if (!p) return fallo(estado, 'OBJETIVO_INEXISTENTE', `El bloque no tiene el parámetro «${accion.parametro}».`);
      if (accion.valor < p.min || accion.valor > p.max) return fallo(estado, 'PARAMETRO_FUERA_DE_RANGO', `${p.etiqueta ?? p.id} debe estar entre ${p.min} y ${p.max}.`);
      return conInteraccion({ parametros: { ...actual.parametros, [p.id]: accion.valor } });
    }
    case 'mostrar-referencia': {
      if (!admite('mostrar-referencia')) return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no tiene referencias.');
      if (accion.referenciaId && !(bloque.referencias ?? []).some((x) => x.id === accion.referenciaId)) return fallo(estado, 'OBJETIVO_INEXISTENTE', `No existe la referencia «${accion.referenciaId}».`);
      const ref = (bloque.referencias ?? []).find((x) => x.id === accion.referenciaId);
      // Una referencia a una página de un documento abre ese documento en esa página.
      if (ref?.tipo === 'pagina') {
        const doc = estado.bloques.find((b) => b.id === ref.documento && b.tipo === 'pdf');
        if (!doc) return fallo(estado, 'REFERENCIA_INEXISTENTE', 'El documento de esa referencia no está en esta sesión.');
        const di = estado.interaccion[doc.id] ?? interaccionInicial(doc);
        return {
          estado: {
            ...estado,
            activo: doc.id,
            interaccion: { ...estado.interaccion, [bloque.id]: { ...actual, referencia: ref.id }, [doc.id]: { ...di, vista: { tipo: 'pagina', pagina: ref.pagina } } },
            revision: estado.revision + 1,
          },
          error: null,
          anuncio: `Documento abierto en la página ${ref.pagina}.`,
        };
      }
      return conInteraccion({ referencia: accion.referenciaId });
    }
    case 'cambiar-vista': {
      if (!admite('cambiar-vista')) return fallo(estado, 'ACCION_NO_ADMITIDA', 'Este bloque no admite cambiar la vista.');
      const v = accion.vista;
      const compatible =
        (v.tipo === 'plano' && bloque.tipo === 'grafico') ||
        (v.tipo === 'camara' && bloque.tipo === 'modelo-3d') ||
        (v.tipo === 'pagina' && bloque.tipo === 'pdf') ||
        (v.tipo === 'zoom' && bloque.tipo === 'obra');
      if (!compatible) return fallo(estado, 'VISTA_INCOMPATIBLE', 'Esa vista no corresponde a este tipo de bloque.');
      if (v.tipo === 'plano' && !(v.xMin < v.xMax && v.yMin < v.yMax)) return fallo(estado, 'RANGO_INVALIDO', 'La vista del gráfico no es válida.');
      return conInteraccion({ vista: v });
    }
  }
}

/** Aplica una secuencia; se detiene en la primera acción inválida y conserva el estado alcanzado hasta ahí. */
export function aplicarAcciones(estado: EstadoEspacio, acciones: readonly unknown[]): Resultado {
  let actual: Resultado = { estado, error: null, anuncio: null };
  for (const a of acciones) {
    const r = aplicarAccion(actual.estado, a);
    if (r.error && r.estado === actual.estado) return { ...r, anuncio: actual.anuncio };
    actual = { ...r, anuncio: r.anuncio ?? actual.anuncio };
  }
  return actual;
}
