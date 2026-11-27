import { z } from 'zod';
import { corregir, type Respuesta } from '@mentelyx/contratos/educacion/pregunta-corregir';
import { validarPregunta, type ErrorPregunta, type Pregunta } from '@mentelyx/contratos/educacion/pregunta-esquema';
import { hashContenido } from '../../../shared/bd/mensajeria';
import { ErrorAplicacion } from '../../../shared/errores';
import { barajar, calificar, exigirAbierto, MAX_PREGUNTAS_INTENTO, proyectar, traducir, VERSION_CALIFICACION, VERSION_REPASO, type Proyeccion } from '../dominio/evaluacion';
import {
  exigirFuentesSolicitadas,
  type BancoPreguntasPort,
  type FuentesAutorizadasPort,
  type IntentoGuardado,
  type IntentosRepositorio,
  type PreparacionRepositorio,
  type Tarjeta,
  type TarjetasRepositorio,
  type TemaPreparacion,
} from '../dominio/preparacion';

/** Puerto hacia M2 (organización): la preparación puede vivir en una carpeta de Exámenes (API 12.1 y 12.2). */
export type CarpetasPort = {
  validar(actorId: string, carpetaId: string, modulo: 'EXAMENES'): Promise<void>;
  asignar(actorId: string, carpetaId: string, tipo: 'PREPARACION', id: string): Promise<void>;
  ubicacion(actorId: string, tipo: 'PREPARACION', ids: string[]): Promise<Map<string, string>>;
};

type Deps = {
  repo: PreparacionRepositorio;
  bancos: BancoPreguntasPort;
  intentos: IntentosRepositorio;
  tarjetas: TarjetasRepositorio;
  fuentesAutorizadas: FuentesAutorizadasPort;
  carpetas: CarpetasPort;
  ahora: () => Date;
};

const Codigo = z.string().regex(/^[A-Z0-9][A-Z0-9_-]{0,59}$/);
const Fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const MAX_TEMAS = 30;
const MAX_BANCO = 500;
const GRACIA_ENTREGA_MS = 30_000;

export const CrearPreparacionRequest = z
  .strictObject({
    nombre: z.string().trim().min(1).max(120),
    asignatura: z.string().trim().min(1).max(120),
    fechaExamen: Fecha.optional(),
    fechaObjetivo: Fecha.optional(),
    carpetaId: z.uuid().optional(),
    fuente: z.enum(['PERSONAL', 'FUENTES']),
    minutosSemanales: z.number().int().min(15).max(1680),
    temas: z.array(z.strictObject({ areaCodigo: Codigo, temaCodigo: Codigo, titulo: z.string().trim().min(1).max(160) })).min(1).max(MAX_TEMAS),
    fuentes: z.array(z.uuid()).max(10).default([]),
  })
  .superRefine((e, ctx) => {
    if (e.fuente === 'FUENTES' && e.fuentes.length === 0) ctx.addIssue({ code: 'custom', path: ['fuentes'], message: 'Selecciona al menos una fuente.' });
    if (new Set(e.temas.map((t) => t.temaCodigo)).size !== e.temas.length) ctx.addIssue({ code: 'custom', path: ['temas'], message: 'Los códigos de tema deben ser únicos.' });
    if (e.fechaExamen && e.fechaObjetivo && e.fechaExamen !== e.fechaObjetivo) ctx.addIssue({ code: 'custom', path: ['fechaExamen'], message: 'Las fechas no coinciden.' });
  });

export const TemarioRequest = z.strictObject({
  temas: z
    .array(z.strictObject({ id: Codigo.optional(), titulo: z.string().trim().min(1).max(160), origen: z.enum(['PERSONA', 'FUENTES', 'TUTOR']).optional() }))
    .min(1)
    .max(MAX_TEMAS),
});
export const ArchivarRequest = z.strictObject({ estado: z.enum(['ACTIVA', 'ARCHIVADA']) });
export const AgregarPreguntasRequest = z.strictObject({ preguntas: z.array(z.unknown()).min(1).max(100) });
export const CrearIntentoRequest = z.strictObject({
  modo: z.enum(['PRACTICA', 'SIMULACRO', 'DIAGNOSTICO']),
  preguntaIds: z.array(z.string().regex(/^[a-z][a-z0-9_-]{0,31}$/)).min(1).max(MAX_PREGUNTAS_INTENTO).optional(),
  temas: z.array(z.string().trim().min(1).max(120)).max(MAX_TEMAS).optional(),
  cantidad: z.number().int().min(1).max(MAX_PREGUNTAS_INTENTO).optional(),
  minutos: z.number().int().min(1).max(240).nullable().optional(),
});
// Formato de respuesta del cliente (pregunta-corregir.ts). Sin recursión: las subpreguntas de un caso son simples.
const simples = [
  z.strictObject({ tipo: z.literal('opcion'), id: z.string().max(32).nullable() }),
  z.strictObject({ tipo: z.literal('opciones'), ids: z.array(z.string().max(32)).max(8) }),
  z.strictObject({ tipo: z.literal('booleano'), valor: z.boolean().nullable() }),
  z.strictObject({ tipo: z.literal('texto'), valor: z.string().max(4000) }),
  z.strictObject({ tipo: z.literal('orden'), ids: z.array(z.string().max(32)).max(8) }),
  z.strictObject({ tipo: z.literal('pares'), asignacion: z.record(z.string().max(32), z.string().max(32)) }),
] as const;
const RespuestaSimple = z.discriminatedUnion('tipo', [...simples]);
const RespuestaEsquema = z.discriminatedUnion('tipo', [...simples, z.strictObject({ tipo: z.literal('caso'), respuestas: z.record(z.string().max(32), RespuestaSimple) })]) as unknown as z.ZodType<Respuesta>;
export const GuardarRespuestaRequest = z.strictObject({ respuesta: RespuestaEsquema, comprobar: z.boolean().optional() });
export const CrearTarjetaRequest = z.strictObject({ tema: z.string().trim().min(1).max(120).optional(), anverso: z.string().trim().min(1).max(500), reverso: z.string().trim().min(1).max(1500) });
export const RevisarTarjetaRequest = z.strictObject({ calificacion: z.enum(['OTRA_VEZ', 'DIFICIL', 'BIEN', 'FACIL']) });

const hoy = (d: Date) => d.toISOString().slice(0, 10);
const noEncontrada = () => new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Preparación no encontrada.');

function validarFechaFutura(fecha: string | undefined, ahora: Date) {
  if (!fecha) return;
  const d = new Date(`${fecha}T00:00:00.000Z`);
  const dias = Math.round((d.getTime() - Date.parse(`${hoy(ahora)}T00:00:00.000Z`)) / 86_400_000);
  if (Number.isNaN(d.getTime()) || hoy(d) !== fecha || dias < 1) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'La fecha del examen debe ser posterior a hoy.');
}

/** Vista pública de un intento (sin proyección ni claves). */
export const vistaIntento = (i: IntentoGuardado) => ({
  id: i.id,
  preparacionId: i.preparacionId,
  modo: i.modo,
  estado: i.estado,
  versionBanco: i.versionBanco,
  preguntas: i.preguntaIds.length,
  iniciadoEn: i.iniciadoEn.toISOString(),
  venceEn: i.venceEn?.toISOString() ?? null,
  entregadoEn: i.entregadoEn?.toISOString() ?? null,
  fueraDeTiempo: i.fueraDeTiempo,
  puntaje: i.puntaje,
  maximo: i.maximo,
  pendientes: i.pendientes,
  porcentaje: i.puntaje !== null && i.maximo ? Math.round((i.puntaje / i.maximo) * 100) : null,
});

const vistaTarjeta = (t: Tarjeta) => ({ id: t.id, preparacionId: t.preparacionId, tema: t.tema, anverso: t.anverso, reverso: t.reverso, origen: t.origen, proximaEn: t.proximaEn.toISOString(), intervaloDias: t.intervaloDias, repeticiones: t.repeticiones });

export function crearCasosPreparacionesV1(d: Deps) {
  const exigirPreparacion = async (actorId: string, id: string) => {
    const r = await d.repo.resumen(actorId, id);
    if (!r) throw noEncontrada();
    return r;
  };
  const conCarpeta = async <T extends { id: string }>(actorId: string, lista: T[]) => {
    const ubicacion = lista.length ? await d.carpetas.ubicacion(actorId, 'PREPARACION', lista.map((p) => p.id)) : new Map<string, string>();
    return lista.map((p) => ({ ...p, carpetaId: ubicacion.get(p.id) ?? null }));
  };
  const bancoVigente = async (actorId: string, preparacionId: string) => (await d.bancos.ultima(actorId, preparacionId)) ?? { version: 0, preguntas: [] as Pregunta[], creadaEn: d.ahora(), operationKey: null };

  /** Preguntas del intento en su orden, de la versión fijada del banco (inmutable). */
  const preguntasDe = async (actorId: string, i: IntentoGuardado) => {
    const banco = await d.bancos.version(actorId, i.preparacionId, i.versionBanco);
    if (!banco) throw new ErrorAplicacion('SERVICIO_NO_DISPONIBLE', 'No se pudo recuperar el banco de preguntas del intento.');
    const porId = new Map(banco.preguntas.map((p) => [p.id, p]));
    return i.preguntaIds.map((id) => porId.get(id)).filter((p): p is Pregunta => !!p);
  };
  const proyectadas = (i: IntentoGuardado, preguntas: Pregunta[]) => preguntas.map((p) => proyectar(p, i.id).publica);

  async function resultados(actorId: string, i: IntentoGuardado) {
    const preguntas = await preguntasDe(actorId, i);
    const respuestas = Object.fromEntries((await d.intentos.respuestas(i.id)).map((r) => [r.preguntaId, r.respuesta]));
    const c = i.resultados!;
    // Tras la entrega se revelan las soluciones; las respuestas de relación se devuelven sobre la proyección mostrada.
    return {
      ...c,
      preguntas: c.preguntas.map((r) => ({ ...r, pregunta: preguntas.find((p) => p.id === r.preguntaId) ?? null, respuesta: respuestas[r.preguntaId] ?? null })),
      proyeccion: preguntas.map((p) => proyectar(p, i.id).publica),
    };
  }

  return {
    async crear(actorId: string, operationKey: string, entrada: unknown) {
      const e = CrearPreparacionRequest.parse(entrada);
      const ahora = d.ahora();
      const fecha = e.fechaExamen ?? e.fechaObjetivo;
      validarFechaFutura(fecha, ahora);
      if (e.carpetaId) await d.carpetas.validar(actorId, e.carpetaId, 'EXAMENES');
      const fuentes = e.fuentes.length ? exigirFuentesSolicitadas(e.fuentes, await d.fuentesAutorizadas(actorId, { contentIds: e.fuentes })) : [];
      const hash = await hashContenido(JSON.stringify({ ...e, fuentes }));
      const r = await d.repo.crearObjetivo(
        { actorId, operationKey, fuente: e.fuente, ...(fecha ? { fechaObjetivo: fecha } : {}), minutosSemanales: e.minutosSemanales, temas: e.temas, fuentes, ahora, nombre: e.nombre, asignatura: e.asignatura },
        hash,
      );
      // Organización (M2) después de crear: si falla, la preparación existe en la raíz y la carpeta se puede reintentar.
      if (e.carpetaId && !r.repetida) await d.carpetas.asignar(actorId, e.carpetaId, 'PREPARACION', r.resultado.objetivo.id);
      const [resumen] = await conCarpeta(actorId, [(await d.repo.resumen(actorId, r.resultado.objetivo.id))!]);
      return { preparacion: resumen!, repetida: r.repetida };
    },

    listar: async (actorId: string) => conCarpeta(actorId, await d.repo.listar(actorId)),

    async obtener(actorId: string, id: string) {
      const [r] = await conCarpeta(actorId, [await exigirPreparacion(actorId, id)]);
      return r!;
    },

    async plan(actorId: string, id: string) {
      const p = await d.repo.plan(actorId, id);
      if (!p) throw noEncontrada();
      return { ...p.plan, objetivo: p.objetivo };
    },

    async completarActividad(actorId: string, id: string, actividadId: string) {
      const p = await d.repo.plan(actorId, id);
      if (!p || !p.plan.actividades.some((a) => a.id === actividadId)) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'La actividad no está disponible para esta cuenta.');
      return d.repo.completarActividad(actorId, actividadId, d.ahora());
    },

    async temario(actorId: string, id: string, entrada: unknown) {
      const e = TemarioRequest.parse(entrada);
      const actual = await d.repo.plan(actorId, id);
      if (!actual) throw noEncontrada();
      const area = actual.plan.actividades[0]?.areaCodigo ?? 'GENERAL';
      const usados = new Set(actual.plan.actividades.map((a) => a.temaCodigo));
      let n = usados.size;
      const temas: TemaPreparacion[] = e.temas.map((t) => {
        if (t.id && usados.has(t.id)) return { areaCodigo: area, temaCodigo: t.id, titulo: t.titulo };
        let codigo: string;
        do codigo = `T${String(++n).padStart(2, '0')}`;
        while (usados.has(codigo));
        usados.add(codigo);
        return { areaCodigo: area, temaCodigo: codigo, titulo: t.titulo };
      });
      if (new Set(temas.map((t) => t.temaCodigo)).size !== temas.length) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'Hay temas repetidos.');
      const r = await d.repo.reemplazarTemario(actorId, id, temas, d.ahora());
      return { ...r.plan, objetivo: r.objetivo };
    },

    async archivar(actorId: string, id: string, entrada: unknown) {
      const e = ArchivarRequest.parse(entrada);
      const [r] = await conCarpeta(actorId, [await d.repo.archivar(actorId, id, e.estado === 'ARCHIVADA', d.ahora())]);
      return r!;
    },

    async seguimiento(actorId: string, id: string) {
      const p = await d.repo.plan(actorId, id);
      if (!p) throw noEncontrada();
      const actividades = p.plan.actividades;
      const areas = new Map<string, { total: number; completadas: number }>();
      for (const a of actividades) {
        const x = areas.get(a.areaCodigo) ?? { total: 0, completadas: 0 };
        x.total++;
        if (a.estado === 'COMPLETADA') x.completadas++;
        areas.set(a.areaCodigo, x);
      }
      const total = actividades.length;
      const completadas = actividades.filter((a) => a.estado === 'COMPLETADA').length;
      const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));
      return {
        objetivo: p.objetivo,
        total,
        completadas,
        porcentaje: pct(completadas, total),
        areas: [...areas].map(([areaCodigo, v]) => ({ areaCodigo, ...v, porcentaje: pct(v.completadas, v.total) })),
        rendimiento: await this.rendimiento(actorId, id),
      };
    },

    /** Rendimiento observado en intentos calificados (no es un «dominio estimado»: API 12.9). */
    async rendimiento(actorId: string, id: string) {
      await exigirPreparacion(actorId, id);
      const calificados = (await d.intentos.listar(actorId, id)).filter((i) => i.estado === 'CALIFICADO' && i.resultados);
      const temas = new Map<string, { puntaje: number; maximo: number; pendientes: number; intentos: number }>();
      for (const i of calificados)
        for (const t of i.resultados!.porTema) {
          const x = temas.get(t.tema) ?? { puntaje: 0, maximo: 0, pendientes: 0, intentos: 0 };
          x.puntaje += t.puntaje;
          x.maximo += t.maximo;
          x.pendientes += t.pendientes;
          x.intentos++;
          temas.set(t.tema, x);
        }
      return {
        criterio: 'Rendimiento observado en intentos entregados; no es una predicción ni un dominio estimado.',
        intentos: calificados.length,
        porTema: [...temas].map(([tema, v]) => ({ tema, ...v, puntaje: Math.round(v.puntaje * 100) / 100, porcentaje: v.maximo ? Math.round((v.puntaje / v.maximo) * 100) : null })),
        ultimos: calificados.slice(0, 10).map(vistaIntento),
      };
    },

    // ── Banco de preguntas (Mongo, versionado) ──────────────────────────────────────────────────────────────────
    async banco(actorId: string, id: string) {
      await exigirPreparacion(actorId, id);
      const b = await bancoVigente(actorId, id);
      const temas = new Map<string, number>();
      for (const p of b.preguntas) temas.set(p.tema, (temas.get(p.tema) ?? 0) + 1);
      return {
        version: b.version,
        total: b.preguntas.length,
        temas: [...temas].map(([tema, total]) => ({ tema, total })),
        // Proyección pública: el banco nunca devuelve soluciones (persistencia 4.2).
        preguntas: b.preguntas.map((p) => proyectar(p, `banco:${id}`).publica),
      };
    },

    async agregarPreguntas(actorId: string, id: string, operationKey: string, entrada: unknown) {
      const e = AgregarPreguntasRequest.parse(entrada);
      await exigirPreparacion(actorId, id);
      const previa = await d.bancos.porClave(actorId, id, operationKey);
      if (previa) return { version: previa.version, agregadas: 0, actualizadas: 0, rechazadas: [] as ErrorPregunta[], repetida: true };
      const validas: Pregunta[] = [];
      const rechazadas: ErrorPregunta[] = [];
      for (const bruta of e.preguntas) {
        // El origen lo decide el servidor: lo que llega por la API lo escribió la persona; la procedencia no es verificable.
        // Se elimina la clave (no se deja en undefined): MongoDB guardaría null y la proyección la expondría.
        const resto: Record<string, unknown> = typeof bruta === 'object' && bruta !== null ? { ...(bruta as Record<string, unknown>) } : {};
        delete resto.procedencia;
        const r = validarPregunta(typeof bruta === 'object' && bruta !== null ? { ...resto, origen: 'persona' } : bruta);
        if (r.ok) validas.push(r.pregunta);
        else rechazadas.push(...r.errores);
      }
      if (!validas.length) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'Ninguna pregunta cumple mentelyx.pregunta/v1.', { rechazadas });
      for (let intento = 0; intento < 3; intento++) {
        const base = await bancoVigente(actorId, id);
        const porId = new Map(base.preguntas.map((p) => [p.id, p]));
        let actualizadas = 0;
        for (const p of validas) {
          if (porId.has(p.id)) actualizadas++;
          porId.set(p.id, p);
        }
        if (porId.size > MAX_BANCO) throw new ErrorAplicacion('ENTRADA_INVALIDA', `Un banco admite hasta ${MAX_BANCO} preguntas.`);
        const r = await d.bancos.publicar(actorId, id, base.version, [...porId.values()], operationKey);
        if (r === 'OK') return { version: base.version + 1, agregadas: validas.length - actualizadas, actualizadas, rechazadas, repetida: false };
        const otra = await d.bancos.porClave(actorId, id, operationKey);
        if (otra) return { version: otra.version, agregadas: 0, actualizadas: 0, rechazadas, repetida: true };
      }
      throw new ErrorAplicacion('OPERACION_EN_CURSO', 'El banco cambió mientras se guardaba; vuelve a intentarlo.');
    },

    // ── Intentos ────────────────────────────────────────────────────────────────────────────────────────────────
    async crearIntento(actorId: string, id: string, operationKey: string, entrada: unknown) {
      const e = CrearIntentoRequest.parse(entrada);
      await exigirPreparacion(actorId, id);
      const requestHash = await hashContenido(JSON.stringify(e));
      const b = await bancoVigente(actorId, id);
      if (!b.preguntas.length) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'Esta preparación todavía no tiene un banco de preguntas.');
      let elegidas: Pregunta[];
      if (e.preguntaIds) {
        const porId = new Map(b.preguntas.map((p) => [p.id, p]));
        elegidas = e.preguntaIds.map((x) => porId.get(x)).filter((p): p is Pregunta => !!p);
        if (elegidas.length !== e.preguntaIds.length) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Alguna pregunta no está en el banco.');
      } else {
        const filtro = e.temas?.length ? b.preguntas.filter((p) => e.temas!.includes(p.tema)) : b.preguntas;
        const barajadas = barajar(filtro, `${actorId}:${operationKey}`);
        if (e.modo === 'DIAGNOSTICO') {
          // Diagnóstico: cobertura de temas antes que cantidad (una por tema, luego el resto).
          const porTema = new Map<string, Pregunta>();
          for (const p of barajadas) if (!porTema.has(p.tema)) porTema.set(p.tema, p);
          elegidas = [...porTema.values(), ...barajadas.filter((p) => porTema.get(p.tema) !== p)].slice(0, e.cantidad ?? Math.max(porTema.size, 5));
        } else elegidas = barajadas.slice(0, e.cantidad ?? 10);
      }
      if (!elegidas.length) throw new ErrorAplicacion('ENTRADA_INVALIDA', 'No hay preguntas para esos temas.');
      const ahora = d.ahora();
      const minutos = e.modo === 'SIMULACRO' ? (e.minutos ?? null) : null;
      const intentoId = crypto.randomUUID();
      const proyeccion: Proyeccion = {};
      for (const p of elegidas) {
        const x = proyectar(p, intentoId).proyeccion;
        if (x) proyeccion[p.id] = x;
      }
      const { intento, repetido } = await d.intentos.crear({
        estudianteId: actorId,
        preparacionId: id,
        modo: e.modo,
        versionBanco: b.version,
        preguntaIds: elegidas.map((p) => p.id),
        proyeccion,
        operationKey,
        requestHash,
        iniciadoEn: ahora,
        venceEn: minutos ? new Date(ahora.getTime() + minutos * 60_000) : null,
        id: intentoId,
      });
      return { ...(await this.intento(actorId, intento.id)), repetido };
    },

    async intentos(actorId: string, id: string) {
      await exigirPreparacion(actorId, id);
      return (await d.intentos.listar(actorId, id)).map(vistaIntento);
    },

    async intento(actorId: string, intentoId: string) {
      const i = await d.intentos.obtener(actorId, intentoId);
      if (!i) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Intento no encontrado.');
      if (i.estado === 'CALIFICADO') return { intento: vistaIntento(i), preguntas: [] as unknown[], respuestas: {}, comprobadas: {}, resultados: await resultados(actorId, i), ahora: d.ahora().toISOString() };
      const preguntas = await preguntasDe(actorId, i);
      const guardadas = await d.intentos.respuestas(i.id);
      // En práctica, las ya comprobadas devuelven su corrección y su solución (momento permitido); el resto, no.
      const comprobadas = Object.fromEntries(
        guardadas
          .filter((r) => r.comprobada && i.modo === 'PRACTICA')
          .map((r) => {
            const p = preguntas.find((x) => x.id === r.preguntaId)!;
            return [r.preguntaId, { correccion: corregir(p, traducir(p, r.respuesta, i.proyeccion[p.id])), pregunta: p }];
          }),
      );
      return {
        intento: vistaIntento(i),
        preguntas: proyectadas(i, preguntas),
        respuestas: Object.fromEntries(guardadas.map((r) => [r.preguntaId, r.respuesta])),
        comprobadas,
        resultados: null,
        ahora: d.ahora().toISOString(),
      };
    },

    async guardarRespuesta(actorId: string, intentoId: string, preguntaId: string, entrada: unknown) {
      const e = GuardarRespuestaRequest.parse(entrada);
      const i = await d.intentos.obtener(actorId, intentoId);
      if (!i || !i.preguntaIds.includes(preguntaId)) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Pregunta no encontrada en este intento.');
      const ahora = d.ahora();
      exigirAbierto({ estado: i.estado, venceEn: i.venceEn }, ahora);
      const comprobar = e.comprobar === true && i.modo === 'PRACTICA';
      const previas = await d.intentos.respuestas(i.id);
      if (previas.some((r) => r.preguntaId === preguntaId && r.comprobada)) {
        throw new ErrorAplicacion('INTENTO_CERRADO', 'Ya comprobaste esta pregunta: su respuesta no se puede cambiar.');
      }
      const g = await d.intentos.guardarRespuesta(i.id, preguntaId, e.respuesta, comprobar, ahora);
      if (g === 'CERRADO') throw new ErrorAplicacion('INTENTO_CERRADO', 'Este intento ya se entregó.');
      if (!comprobar) return { guardada: { preguntaId, revision: g.revision }, correccion: null, pregunta: null };
      const [p] = await preguntasDe(actorId, { ...i, preguntaIds: [preguntaId] });
      return { guardada: { preguntaId, revision: g.revision }, correccion: corregir(p!, traducir(p!, e.respuesta, i.proyeccion[preguntaId])), pregunta: p! };
    },

    /** Entrega idempotente: un solo resultado por intento aunque lleguen entregas concurrentes o repetidas. */
    async entregar(actorId: string, intentoId: string, claveEntrega: string) {
      const i = await d.intentos.obtener(actorId, intentoId);
      if (!i) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Intento no encontrado.');
      if (i.estado === 'EN_CURSO') {
        const ahora = d.ahora();
        const preguntas = await preguntasDe(actorId, i);
        const respuestas = Object.fromEntries((await d.intentos.respuestas(i.id)).map((r) => [r.preguntaId, r.respuesta]));
        const calificacion = calificar(preguntas, respuestas, i.proyeccion);
        const fueraDeTiempo = !!i.venceEn && ahora.getTime() > i.venceEn.getTime() + GRACIA_ENTREGA_MS;
        await d.intentos.calificar(i.id, claveEntrega, { entregadoEn: ahora, fueraDeTiempo, calificacion, version: VERSION_CALIFICACION });
      }
      const final = (await d.intentos.obtener(actorId, intentoId))!;
      return { intento: vistaIntento(final), resultados: await resultados(actorId, final), versionCalificacion: VERSION_CALIFICACION };
    },

    // ── Tarjetas ────────────────────────────────────────────────────────────────────────────────────────────────
    async tarjetas(actorId: string, id: string) {
      await exigirPreparacion(actorId, id);
      const lista = await d.tarjetas.listar(actorId, id);
      const ahora = d.ahora().getTime();
      return { regla: VERSION_REPASO, pendientes: lista.filter((t) => t.proximaEn.getTime() <= ahora).length, tarjetas: lista.map(vistaTarjeta) };
    },
    async crearTarjeta(actorId: string, id: string, operationKey: string, entrada: unknown) {
      const e = CrearTarjetaRequest.parse(entrada);
      const r = await d.tarjetas.crear(actorId, id, operationKey, { tema: e.tema ?? null, anverso: e.anverso, reverso: e.reverso, origen: 'persona' }, d.ahora());
      return { tarjeta: vistaTarjeta(r.tarjeta), repetida: r.repetida };
    },
    async revisarTarjeta(actorId: string, tarjetaId: string, operationKey: string, entrada: unknown) {
      const e = RevisarTarjetaRequest.parse(entrada);
      const r = await d.tarjetas.revisar(actorId, tarjetaId, operationKey, e.calificacion, d.ahora());
      if (!r) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Tarjeta no encontrada.');
      return { tarjeta: vistaTarjeta(r.tarjeta), repetida: r.repetida, regla: VERSION_REPASO };
    },

    /** API pública para M2: títulos de las preparaciones propias (elementos de carpetas). */
    async resumenes(actorId: string, ids: string[]) {
      const todas = await d.repo.listar(actorId);
      const pedidos = new Set(ids);
      return todas.filter((p) => pedidos.has(p.id)).map((p) => ({ id: p.id, titulo: p.nombre, actualizadoEn: p.creadaEn }));
    },
  };
}

export type CasosPreparacionesV1 = ReturnType<typeof crearCasosPreparacionesV1>;
