import type { Interaccion } from '@/features/bloques/acciones';
import type { Bloque } from '@/features/bloques/esquema';
import type { TextoTrabajo } from './modelo';

/**
 * Modos pedagógicos y acciones rápidas del Tutor sobre la pizarra. Todo termina en una consulta real a
 * `POST /tutor-ia/consultas`: el modo `PISTA` del contrato (el Tutor guía sin dar la solución) o `AUTO`, y una instrucción
 * explícita al inicio de la pregunta. La pregunta guardada empieza por el rótulo del modo («Pista: …»), así que al volver a
 * abrir la sesión cada respuesta conserva su papel (pista, revisión, resolución completa…) sin guardar nada en el navegador.
 * Lo que se envía del trabajo es solo texto: Mentelyx no interpreta la escritura a mano.
 */
export type ModoPedagogico = 'aprender' | 'resolver' | 'pista' | 'siguiente' | 'revisar' | 'completa';
export type AccionRapida = 'pista' | 'empezar' | 'siguiente' | 'revisar' | 'otra-manera' | 'ejemplo' | 'desde-cero';
export type Actividad = 'resolucion' | 'explicacion';
/** En un examen, «sin solución» quita la resolución completa: el Tutor solo guía (modo PISTA). */
export type Asistencia = 'completa' | 'sin-solucion';
export type ModoApi = 'AUTO' | 'PISTA';

export const MODOS: Record<ModoPedagogico, { nombre: string; descripcion: string; api: ModoApi; rotulo: string | null; instruccion: string | null }> = {
  aprender: { nombre: 'Aprender un tema', descripcion: 'Explicaciones claras, de lo esencial a lo complejo.', api: 'AUTO', rotulo: null, instruccion: null },
  resolver: {
    nombre: 'Resolver juntos',
    descripcion: 'Te guía con preguntas; tú haces cada paso.',
    api: 'PISTA',
    rotulo: 'Resolvamos juntos',
    instruccion: 'Guíame paso a paso con preguntas. No lo resuelvas por mí: espera a que yo haga cada paso.',
  },
  pista: { nombre: 'Pista', descripcion: 'Una sola pista para avanzar, sin la solución.', api: 'PISTA', rotulo: 'Pista', instruccion: 'Dame una sola pista para avanzar. No me des la solución.' },
  siguiente: {
    nombre: 'Siguiente paso',
    descripcion: 'Solo el paso que sigue a lo que ya hiciste.',
    api: 'PISTA',
    rotulo: 'Siguiente paso',
    instruccion: 'Dime solo el siguiente paso a partir de lo que ya hice, sin resolver el resto.',
  },
  revisar: {
    nombre: 'Revisar mi intento',
    descripcion: 'Señala qué líneas de tu trabajo tienen errores y por qué.',
    api: 'PISTA',
    rotulo: 'Revisión de mi intento',
    instruccion: 'Revisa mi intento línea por línea. Indica por su identificador (L1, L2…) qué líneas tienen errores y por qué, y cuáles están bien. No me des la solución completa.',
  },
  completa: {
    nombre: 'Explicación completa',
    descripcion: 'La resolución entera, explicada paso a paso.',
    api: 'AUTO',
    rotulo: 'Resolución completa',
    instruccion: 'Muéstrame la resolución completa, explicada paso a paso, y señala dónde suelen equivocarse los estudiantes.',
  },
};

export const ACCIONES: Record<AccionRapida, { texto: string; modo: ModoPedagogico; rotulo: string; instruccion: string }> = {
  pista: { texto: 'Dame una pista', modo: 'pista', rotulo: 'Pista', instruccion: MODOS.pista.instruccion! },
  empezar: { texto: 'Ayúdame a empezar', modo: 'resolver', rotulo: 'Cómo empezar', instruccion: '¿Por dónde empiezo? Dime solo el primer paso y por qué, sin resolver el resto.' },
  siguiente: { texto: 'Siguiente paso', modo: 'siguiente', rotulo: 'Siguiente paso', instruccion: MODOS.siguiente.instruccion! },
  revisar: { texto: 'Revisa mi intento', modo: 'revisar', rotulo: 'Revisión de mi intento', instruccion: MODOS.revisar.instruccion! },
  'otra-manera': { texto: 'Explícamelo de otra manera', modo: 'aprender', rotulo: 'Otra explicación', instruccion: 'Explícamelo de otra manera, con palabras más simples y una comparación cotidiana.' },
  ejemplo: { texto: 'Un ejemplo', modo: 'aprender', rotulo: 'Ejemplo', instruccion: 'Dame un ejemplo resuelto parecido, distinto del que estoy trabajando.' },
  'desde-cero': { texto: 'Desde cero', modo: 'aprender', rotulo: 'Desde cero', instruccion: 'Explícamelo desde cero, sin suponer que sé lo previo.' },
};

const PARA_RESOLVER: ReadonlySet<Bloque['tipo']> = new Set(['ejercicio', 'pasos', 'formula', 'grafico', 'vectores', 'codigo']);

/** Resolución (hay un ejercicio, un procedimiento o una expresión) o explicación (historia, lectura, conceptos). */
export function tipoActividad(enFoco: readonly Bloque[], hayExpresiones: boolean): Actividad {
  const ejercicioPropio = (b: Bloque) => b.origen === 'persona' && b.tipo === 'texto' && b.titulo === 'Tu ejercicio';
  return hayExpresiones || enFoco.some((b) => PARA_RESOLVER.has(b.tipo) || ejercicioPropio(b)) ? 'resolucion' : 'explicacion';
}

/** Acciones rápidas que tienen sentido en la actividad: «Siguiente paso» o «Dame una pista» no aparecen en una lectura de historia. */
export function accionesPara(actividad: Actividad, asistencia: Asistencia = 'completa'): AccionRapida[] {
  const lista: AccionRapida[] = actividad === 'resolucion' ? ['pista', 'empezar', 'siguiente', 'revisar', 'otra-manera', 'ejemplo'] : ['otra-manera', 'ejemplo', 'desde-cero', 'revisar'];
  return asistencia === 'sin-solucion' ? lista.filter((a) => a !== 'ejemplo') : lista;
}
export function modosPara(actividad: Actividad, asistencia: Asistencia = 'completa'): ModoPedagogico[] {
  const todos: ModoPedagogico[] = ['aprender', 'resolver', 'pista', 'siguiente', 'revisar', 'completa'];
  return todos.filter((m) => !(actividad === 'explicacion' && m === 'siguiente') && !(asistencia === 'sin-solucion' && (m === 'completa' || m === 'aprender')));
}
export const modoInicial = (actividad: Actividad, asistencia: Asistencia = 'completa'): ModoPedagogico => (asistencia === 'sin-solucion' || actividad === 'resolucion' ? 'resolver' : 'aprender');

/* ----------------------------------------------------- contexto */

const MAX_PREGUNTA = 4000;
const corte = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
const plano = (md: string) =>
  md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\[\[c\d+\]\]|\[\d{1,2}\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/**
 * Texto de un bloque para el contexto de la pregunta: lo que la persona ve, nunca la solución guardada de una actividad
 * (respuesta, opción correcta, pista o explicación) ni los pasos que aún no reveló.
 */
export function resumenBloque(b: Bloque, interaccion?: Pick<Interaccion, 'revelados' | 'parametros'>): string {
  const t = b.titulo ? `«${b.titulo}»` : '';
  switch (b.tipo) {
    case 'texto':
      return `Explicación ${t}: ${corte(plano(b.contenido.markdown), 700)}`;
    case 'formula':
      return `Fórmula ${t}: ${b.contenido.latex}${b.contenido.lectura ? ` (se lee: ${b.contenido.lectura})` : ''}`;
    case 'pasos': {
      const vistos = b.contenido.pasos.slice(0, Math.max(1, interaccion?.revelados ?? b.contenido.revelados ?? b.contenido.pasos.length));
      return `Procedimiento ${t}: ${vistos.map((p, k) => `${k + 1}) ${p.titulo}${p.latex ? ` [${p.latex}]` : ''}${p.texto ? `: ${p.texto}` : ''}`).join(' ')}`;
    }
    case 'grafico': {
      const params = Object.entries(interaccion?.parametros ?? {}).map(([k, v]) => `${k} = ${v}`);
      return `Gráfico ${t}: ${b.contenido.funciones.map((f) => `y = ${f.expresion}`).join('; ')}${params.length ? ` con ${params.join(', ')}` : ''}`;
    }
    case 'vectores':
      return `Vectores ${t}: ${b.contenido.vectores.map((v) => `${v.etiqueta} = (${v.componentes.join(', ')}) desde (${v.origen.join(', ')})`).join('; ')}`;
    case 'tabla':
      return `Tabla ${t}: ${b.contenido.columnas.join(' | ')} — ${b.contenido.filas.slice(0, 12).map((f) => f.celdas.join(' | ')).join(' / ')}`;
    case 'linea-tiempo':
      return `Línea de tiempo ${t}: ${b.contenido.eventos.slice(0, 20).map((e) => `${e.fecha}: ${e.titulo}`).join('; ')}`;
    case 'codigo':
      return `Código ${t} (${b.contenido.lenguaje}): ${corte(b.contenido.codigo, 700)}`;
    case 'comparacion':
      return `Comparación ${t}: ${b.contenido.columnas.map((c) => `${c.titulo}: ${c.puntos.join('; ')}`).join(' — ')}`;
    case 'ejercicio':
      return `Actividad ${t}: ${b.contenido.enunciado}${b.contenido.modo === 'opcion' ? ` Opciones: ${b.contenido.opciones.map((o, k) => `${String.fromCharCode(97 + k)}) ${o.texto}`).join('; ')}` : ''}`;
    case 'obra':
      return `Obra ${t}: ${b.accesibilidad.descripcion}`;
    case 'modelo-3d':
      return `Modelo 3D ${t}: ${b.accesibilidad.descripcion}`;
    case 'pdf':
      return `Documento ${t}${b.contenido.pagina ? `, página ${b.contenido.pagina}` : ''}`;
    case 'desconocido':
      return '';
  }
}

export type ContextoConsulta = {
  /** Bloques elegidos, en el orden de la pizarra, con su identificador visible (B1, B2…). */
  bloques: Array<{ ref: string; resumen: string }>;
  /** Líneas de trabajo escritas con el teclado (L1, L2…). */
  lineas: Array<Pick<TextoTrabajo, 'etiqueta' | 'texto' | 'expresion'>>;
  /** Trazos a mano o formas en lo elegido: se mencionan, pero no se interpretan. */
  sinTexto: number;
};
export const contextoVacio = (): ContextoConsulta => ({ bloques: [], lineas: [], sinTexto: 0 });
export const hayContexto = (c: ContextoConsulta) => c.bloques.length > 0 || c.lineas.length > 0 || c.sinTexto > 0;

export type Consulta = { pregunta: string; visible: string; modo: ModoApi; rol: string | null };

/**
 * Compone la pregunta que se envía (≤ 4000 caracteres): rótulo del modo, lo escrito, la instrucción pedagógica, el
 * contexto elegido en la pizarra y el contexto de la pantalla. Si no cabe todo, se recorta primero el contexto.
 */
export function componerConsulta(o: {
  texto: string;
  modo: ModoPedagogico;
  accion?: AccionRapida | undefined;
  contexto: ContextoConsulta;
  foco: string;
  pantalla?: string | undefined;
  asistencia?: Asistencia | undefined;
}): Consulta {
  const sinSolucion = (o.asistencia ?? 'completa') === 'sin-solucion';
  const accion = o.accion ? ACCIONES[o.accion] : null;
  const modo = MODOS[accion?.modo ?? o.modo];
  const rotulo = accion?.rotulo ?? modo.rotulo;
  const escrito = o.texto.trim();
  const tema = escrito || o.foco;
  const visible = corte(rotulo ? `${rotulo}: ${tema}` : tema, 300);
  const instrucciones = [accion?.instruccion ?? modo.instruccion, sinSolucion ? 'Estoy preparando un examen: no me des la respuesta final, solo guíame.' : null].filter(Boolean).join(' ');

  const pie = o.pantalla ? `\n\n(Contexto: ${corte(o.pantalla, 400)})` : '';
  const cabeza = `${visible}${instrucciones ? `\n${instrucciones}` : ''}`;
  let disponible = MAX_PREGUNTA - cabeza.length - pie.length - 4;
  const partes: string[] = [];
  const lineas = o.contexto.lineas.map((l) => `${l.etiqueta}: ${l.texto.replace(/\s+/g, ' ').trim()}`);
  if (lineas.length) {
    const titulo = '\n\nMi trabajo (escrito como texto; cada línea con su identificador):';
    const cuerpo: string[] = [];
    for (const l of lineas) {
      if (disponible - titulo.length - l.length - 1 < 0) break;
      cuerpo.push(l);
      disponible -= l.length + 1;
    }
    if (cuerpo.length) {
      partes.push(`${titulo}\n${cuerpo.join('\n')}`);
      disponible -= titulo.length;
    }
  }
  if (o.contexto.sinTexto > 0) {
    const nota = `\n(Además hay ${o.contexto.sinTexto} ${o.contexto.sinTexto === 1 ? 'trazo o forma a mano' : 'trazos o formas a mano'} que Mentelyx no interpreta.)`;
    if (nota.length < disponible) {
      partes.push(nota);
      disponible -= nota.length;
    }
  }
  if (o.contexto.bloques.length) {
    const titulo = '\n\nContenido que elegí en la pizarra:';
    const cuerpo: string[] = [];
    for (const b of o.contexto.bloques) {
      const linea = `[${b.ref}] ${b.resumen}`;
      const cabe = disponible - titulo.length - 2;
      if (cabe < 40) break;
      const recortada = corte(linea, Math.min(cabe, 900));
      cuerpo.push(recortada);
      disponible -= recortada.length + 1;
    }
    if (cuerpo.length) partes.push(`${titulo}\n${cuerpo.join('\n')}`);
  }
  const pregunta = `${cabeza}${partes.join('')}${pie}`.slice(0, MAX_PREGUNTA);
  return { pregunta, visible, modo: sinSolucion ? 'PISTA' : modo.api, rol: rotulo };
}

const ROTULOS = [...new Set([...Object.values(MODOS).map((m) => m.rotulo), ...Object.values(ACCIONES).map((a) => a.rotulo)].filter((r): r is string => !!r))];
/** Papel de una respuesta según el rótulo con que empieza su pregunta («Pista: …»). */
export function rolDeTitulo(titulo: string | undefined): string | null {
  if (!titulo) return null;
  return ROTULOS.find((r) => titulo.startsWith(`${r}:`)) ?? null;
}

/** Líneas del trabajo que una respuesta nombra por su identificador (L1, L2…). Solo las que existen. */
export function lineasMencionadas(markdown: string, etiquetas: readonly string[]): string[] {
  const existentes = new Set(etiquetas);
  const vistas = new Set<string>();
  for (const m of markdown.matchAll(/\bL(\d{1,3})\b/g)) if (existentes.has(`L${m[1]}`)) vistas.add(`L${m[1]}`);
  return [...vistas];
}
