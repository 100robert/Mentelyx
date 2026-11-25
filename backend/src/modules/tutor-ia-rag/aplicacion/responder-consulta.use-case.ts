import { ConsultaTutorRequest, RETENCION_CONVERSACION_DIAS, type Cita, type RespuestaTutor } from '@mentelyx/contratos';
import { hashContenido } from '../../../shared/bd/mensajeria';
import { ErrorAplicacion } from '../../../shared/errores';
import type { Reloj } from '../../../shared/fechas';
import {
  ajustarAlPresupuesto,
  clasificarConsulta,
  costoUsd,
  empaquetarContexto,
  FalloProveedorIa,
  normalizarCitas,
  redactarDatosPersonales,
  sumarDias,
  type ConversacionesPort,
  type EmbeddingsPort,
  type EstadoRespuesta,
  type Fragmento,
  type FuentesAutorizadasPort,
  type IdRuta,
  type IndiceRagPort,
  type LimiteTasaPort,
  type MensajeGuardado,
  type PoliticaTecnica,
  type ProveedorIaPort,
  type RecursoConsulta,
  type RecursosPlanPort,
  type UsoIaPort,
} from '../dominio/tutor';

type Deps = {
  conversaciones: ConversacionesPort;
  fuentesAutorizadas: FuentesAutorizadasPort;
  indice: IndiceRagPort;
  uso: UsoIaPort;
  recursos: RecursosPlanPort;
  proveedor: ProveedorIaPort;
  /** `null`: sin modelo de embeddings (local/CI) → recuperación solo léxica. */
  embeddings: EmbeddingsPort | null;
  limiteTasa: LimiteTasaPort;
  politica: Record<RecursoConsulta, PoliticaTecnica>;
  reloj: Reloj;
  ahora: () => Date;
};

const CANDIDATOS = 8;
const HISTORIAL_MENSAJES = 4;
const HISTORIAL_CARACTERES = 1200;

const AVISO = {
  simulado: 'Entorno de demostración: la respuesta la genera un proveedor simulado, sin un modelo de IA real.',
  general: 'Explicación general: no proviene de tus fuentes seleccionadas.',
  mixta: 'La respuesta no cita tus fuentes: puede incluir explicación general.',
  lexico: 'Búsqueda solo por texto: el modelo de embeddings no estuvo disponible.',
  parcial: 'La respuesta se cortó al alcanzar el límite de extensión.',
};
const TEXTO_SIN_CONTEXTO =
  '**No encontré información sobre esta pregunta en tus fuentes seleccionadas.**\n\nPediste usar solo tus fuentes, así que no generé una explicación general. Prueba con otras palabras o agrega una fuente sobre el tema.';

function citasDe(fragmentos: Fragmento[], citados: number[]): Cita[] {
  return citados.map((n) => {
    const f = fragmentos[n - 1]!;
    return {
      id: String(n),
      chunkId: f.chunkId,
      recursoId: f.documentId,
      version: f.version,
      titulo: f.titulo,
      enlace: `/espacios/fuente/${f.documentId}`,
      fragmento: f.texto.slice(0, 280),
      tipoFuente: 'PRIVADO',
    };
  });
}

/**
 * ResponderConsultaUseCase (orquestación, secciones 7, 10 y 13). Pasos con efecto y su compensación:
 *  1. Idempotencia: misma Idempotency-Key + mismo cuerpo → mismo resultado sin otra inferencia; otro cuerpo → 422.
 *  2. Límite de tasa (6/min) y autorización por recurso: conversación propia (Mongo) y fuentes propias (M2).
 *  3. M5 reserva la categoría que decide el servidor (sin cuota → 429 CUOTA_AGOTADA, sin invocar al proveedor).
 *  4. Recuperación híbrida (BGE-M3 + texto, RRF) sobre las fuentes autorizadas; sin embeddings, solo léxica.
 *  5. Ajuste al presupuesto por operación (sección 10.4) y admisión técnica atómica en M6 (EN_CURSO), antes de invocar.
 *  6. Modelo (pregunta e historial redactados, sección 4.3), citas `[[cN]]` → `[N]`, mensajes en Mongo una vez por
 *     operationKey, M5 confirma y M6 cierra el uso con el costo real.
 *  Si algo falla antes de guardar la respuesta: M5 libera (SIN_EJECUCION) y el uso queda FALLIDA, o INCIERTA si no hay
 *  evidencia de que el proveedor no ejecutó (CO-10: el costo estimado queda retenido hasta conciliarse).
 */
export const crearResponderConsulta = (deps: Deps) => async (actorId: string, idempotencyKey: string, entrada: unknown): Promise<RespuestaTutor> => {
  const cmd = ConsultaTutorRequest.parse(entrada);
  const operationKey = `tutor:${actorId}:${idempotencyKey}`;
  const requestHash = await hashContenido(cmd);

  const previa = await deps.uso.buscar(operationKey);
  if (previa) {
    if (previa.requestHash !== requestHash) throw new ErrorAplicacion('CLAVE_IDEMPOTENCIA_REUTILIZADA', 'La Idempotency-Key ya se usó con otra consulta.');
    if (previa.status === 'EN_CURSO') throw new ErrorAplicacion('OPERACION_EN_CURSO', 'La consulta sigue en proceso.');
    if (previa.status !== 'RESPONDIDA' || !previa.resultRef) {
      throw new ErrorAplicacion('OPERACION_EN_CURSO', 'La consulta anterior no terminó; vuelve a enviarla como una consulta nueva.', { estado: previa.status });
    }
    return reconstruir(deps, actorId, cmd.conversacionId, operationKey, previa.resultRef);
  }

  const ahora = deps.ahora();
  const conversacion = await deps.conversaciones.obtener(actorId, cmd.conversacionId, ahora);
  if (!conversacion) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Conversación no encontrada.');
  const tasa = await deps.limiteTasa.consumir(actorId, ahora);
  if (!tasa.permitido) throw new ErrorAplicacion('LIMITE_TASA', 'Hiciste muchas consultas en poco tiempo. Espera unos segundos.', { reintentarEnSeg: tasa.reintentarEnSeg });

  const espacioId = cmd.fuentes?.espacioId ?? conversacion.espacioId ?? undefined;
  let autorizadas: Awaited<ReturnType<FuentesAutorizadasPort>> = [];
  if (espacioId || cmd.fuentes?.contentIds?.length) {
    try {
      autorizadas = await deps.fuentesAutorizadas(actorId, { espacioId, contentIds: cmd.fuentes?.contentIds });
    } catch (e) {
      // Un espacio ajeno o inexistente es 404; una caída de M2 nunca se convierte en respuesta GENERAL (RAG 10.1).
      if (e instanceof ErrorAplicacion || (e instanceof Error && e.name === 'RecursoNoEncontrado')) throw e;
      throw new ErrorAplicacion('SERVICIO_NO_DISPONIBLE', 'No se pudieron verificar tus fuentes. Inténtalo de nuevo.');
    }
  }

  const recurso = clasificarConsulta(cmd.pregunta);
  const reserva = await deps.recursos.reservarRecursoPlan({ actorId, recurso, cantidad: 1, operationKey });
  if (reserva.estado === 'SIN_CUOTA') {
    throw new ErrorAplicacion('CUOTA_AGOTADA', 'Agotaste las consultas de esta categoría en tu plan.', { recurso, requeridas: 1, disponibles: reserva.disponibles });
  }
  if (reserva.repetida && reserva.situacion !== 'PENDIENTE') {
    throw new ErrorAplicacion('OPERACION_EN_CURSO', 'Esta consulta ya se procesó; vuelve a cargar la conversación.');
  }

  let admitida = false;
  let guardada = false;
  try {
    const pregunta = redactarDatosPersonales(cmd.pregunta);
    const { ruta, estandar } = deps.proveedor.rutaPara(recurso);
    const politica = deps.politica[recurso];

    // 4. Recuperación sobre el conjunto autorizado (el contexto entra en la estimación de costo).
    let vector: number[] | null = null;
    let costoEmbeddings = 0;
    let soloLexica = false;
    if (autorizadas.length && deps.embeddings) {
      try {
        const e = await deps.embeddings.embeber([pregunta]);
        vector = e.vectores[0] ?? null;
        costoEmbeddings = costoUsd({ entradaUsdPorM: deps.embeddings.precioUsdPorM, salidaUsdPorM: 0 }, e.tokens, 0);
      } catch {
        soloLexica = true; // degradación (RAG, sección 10.3)
      }
    }
    const candidatos = autorizadas.length
      ? await deps.indice.buscar(actorId, autorizadas.map((f) => f.contentId), { texto: cmd.pregunta, vector }, CANDIDATOS)
      : [];
    const fragmentos = empaquetarContexto(candidatos, politica.maxTokensEntrada);

    // Fuentes exclusivas sin fragmentos → SIN_CONTEXTO sin inferencia y con el recurso liberado (ADR-078, API-18 b).
    if (fragmentos.length === 0 && cmd.fuentes?.exclusivas) {
      await deps.uso.admitir({ operationKey, requestHash, userId: actorId, hoy: deps.reloj.hoy(), recurso, ruta, estimadoUsd: costoEmbeddings });
      admitida = true;
      const mensajeId = await guardar(deps, actorId, cmd.conversacionId, operationKey, cmd.pregunta, TEXTO_SIN_CONTEXTO, [], {
        recurso,
        ruta: ruta.id,
        proveedor: ruta.proveedor,
        modelo: 'ninguno',
        etiqueta: 'Sin inferencia',
        avisos: [],
        estado: 'SIN_CONTEXTO',
      });
      guardada = true;
      await deps.recursos.liberarRecursoPlan({ operationKey, motivo: 'SIN_EJECUCION' });
      await deps.uso.finalizar(operationKey, { status: 'RESPONDIDA', costoUsd: costoEmbeddings, tokensEntrada: 0, tokensSalida: 0, latenciaMs: 0, resultRef: `${cmd.conversacionId}:${mensajeId}` });
      return respuesta({
        operationKey,
        conversacionId: cmd.conversacionId,
        mensajeId,
        markdown: TEXTO_SIN_CONTEXTO,
        citas: [],
        recurso,
        intencion: ruta.id,
        estado: 'SIN_CONTEXTO',
        consumido: 0,
        restantes: reserva.disponibles + 1,
        ruta: { etiqueta: 'Sin inferencia', proveedor: ruta.proveedor },
        avisos: [],
      });
    }

    // 5. Presupuesto por operación (sección 10.4) y admisión técnica.
    const historial = conversacion.messages.slice(-HISTORIAL_MENSAJES).map((m) => ({ role: m.role, text: redactarDatosPersonales(m.text).slice(0, HISTORIAL_CARACTERES) }));
    const plan = ajustarAlPresupuesto({ ruta, pregunta, historial, fragmentos, pista: cmd.modo === 'PISTA' }, politica, (s) => deps.proveedor.estimarEntrada(s), estandar);
    if (!plan) {
      throw new ErrorAplicacion('PRESUPUESTO_OPERACION_EXCEDIDO', 'La consulta excede el presupuesto por operación: acórtala o selecciona menos fuentes.', { alcance: 'OPERACION' });
    }
    const usada = plan.solicitud.ruta;
    await deps.uso.admitir({ operationKey, requestHash, userId: actorId, hoy: deps.reloj.hoy(), recurso, ruta: usada, estimadoUsd: plan.estimadoUsd + costoEmbeddings });
    admitida = true;

    // 6. Inferencia, citas y persistencia.
    const r = await deps.proveedor.responder(plan.solicitud);
    const { markdown, citados } = normalizarCitas(r.markdown, plan.solicitud.fragmentos.length);
    const citas = citasDe(plan.solicitud.fragmentos, citados);
    const estado: EstadoRespuesta = r.finalizacion === 'length' ? 'PARCIAL' : 'RESPONDIDA';
    const avisos = [
      ...(usada.proveedor === 'simulado' ? [AVISO.simulado] : []),
      ...(usada.aviso ? [usada.aviso] : []),
      ...(soloLexica ? [AVISO.lexico] : []),
      ...(citas.length ? [] : [plan.solicitud.fragmentos.length ? AVISO.mixta : AVISO.general]),
      ...(estado === 'PARCIAL' ? [AVISO.parcial] : []),
    ];
    const mensajeId = await guardar(deps, actorId, cmd.conversacionId, operationKey, cmd.pregunta, markdown, citas, {
      recurso,
      ruta: usada.id,
      proveedor: usada.proveedor,
      modelo: usada.modelo,
      etiqueta: usada.etiqueta,
      avisos,
      estado,
    });
    guardada = true;
    await deps.recursos.confirmarRecursoPlan({ operationKey });
    await deps.uso.finalizar(operationKey, {
      status: 'RESPONDIDA',
      costoUsd: r.costoUsd + costoEmbeddings,
      tokensEntrada: r.tokensEntrada,
      tokensSalida: r.tokensSalida,
      latenciaMs: r.latenciaMs,
      resultRef: `${cmd.conversacionId}:${mensajeId}`,
    });
    return respuesta({
      operationKey,
      conversacionId: cmd.conversacionId,
      mensajeId,
      markdown,
      citas,
      recurso,
      intencion: usada.id,
      estado,
      consumido: 1,
      restantes: reserva.disponibles,
      ruta: { etiqueta: usada.etiqueta, proveedor: usada.proveedor, modelo: usada.modelo },
      avisos,
    });
  } catch (e) {
    if (!guardada) {
      await deps.recursos.liberarRecursoPlan({ operationKey, motivo: 'SIN_EJECUCION' }).catch(() => {});
      if (admitida) {
        const status = e instanceof FalloProveedorIa && e.incierto ? 'INCIERTA' : 'FALLIDA';
        await deps.uso.finalizar(operationKey, { status, costoUsd: 0, tokensEntrada: 0, tokensSalida: 0, latenciaMs: 0, resultRef: null }).catch(() => {});
      }
    }
    if (e instanceof FalloProveedorIa) {
      throw new ErrorAplicacion('PROVEEDOR_NO_DISPONIBLE', 'El Tutor no pudo responder en este momento. Inténtalo de nuevo en unos segundos.', { motivo: e.motivo });
    }
    throw e;
  }
};

async function guardar(
  deps: Deps,
  actorId: string,
  conversacionId: string,
  operationKey: string,
  pregunta: string,
  markdown: string,
  citas: Cita[],
  meta: NonNullable<MensajeGuardado['meta']>,
): Promise<string> {
  const mensajeId = `m_${crypto.randomUUID()}`;
  const momento = deps.ahora();
  const resultado = await deps.conversaciones.agregarIntercambio(
    actorId,
    conversacionId,
    [
      { id: `m_${crypto.randomUUID()}`, role: 'user', text: pregunta, operationKey, createdAt: momento },
      { id: mensajeId, role: 'assistant', text: markdown, operationKey, citations: citas, meta, createdAt: momento },
    ],
    momento,
    sumarDias(momento, RETENCION_CONVERSACION_DIAS),
  );
  if (resultado === 'NO_ENCONTRADA') throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'Conversación no encontrada.');
  return mensajeId;
}

function respuesta(p: {
  operationKey: string;
  conversacionId: string;
  mensajeId: string;
  markdown: string;
  citas: Cita[];
  recurso: RecursoConsulta;
  intencion: IdRuta;
  estado: EstadoRespuesta;
  consumido: number;
  restantes: number;
  ruta: { etiqueta: string; proveedor: string; modelo?: string };
  avisos: string[];
}): RespuestaTutor {
  return {
    operationKey: p.operationKey,
    conversacionId: p.conversacionId,
    mensajeId: p.mensajeId,
    estado: p.estado,
    intencion: p.intencion,
    modoFuentes: p.citas.length ? 'FUNDAMENTADA' : p.avisos.includes(AVISO.mixta) ? 'MIXTA' : 'GENERAL',
    segmentos: [{ id: 's1', markdown: p.markdown }],
    citas: p.citas,
    sugerencias: [],
    uso: { recurso: p.recurso, consumido: p.consumido, restantesPeriodo: p.restantes, facturacion: 'MENTELYX', ruta: p.ruta },
    avisos: p.avisos,
  };
}

/** Reintento de una consulta terminada: se devuelve el mensaje ya guardado; nunca se repite la inferencia. */
async function reconstruir(deps: Deps, actorId: string, conversacionId: string, operationKey: string, resultRef: string): Promise<RespuestaTutor> {
  const conversacion = await deps.conversaciones.obtener(actorId, conversacionId, deps.ahora());
  const mensajeId = resultRef.split(':')[1];
  const mensaje = conversacion?.messages.find((m) => m.id === mensajeId && m.operationKey === operationKey);
  const pregunta = conversacion?.messages.find((m) => m.operationKey === operationKey && m.role === 'user');
  if (!mensaje || !pregunta) throw new ErrorAplicacion('RECURSO_NO_ENCONTRADO', 'La respuesta ya no está disponible (conversación eliminada o vencida).');
  const meta = mensaje.meta;
  const recurso = meta?.recurso ?? clasificarConsulta(pregunta.text);
  const derechos = await deps.recursos.consultarDerechosPlan(actorId);
  const restantes = derechos?.recursos.find((r) => r.recurso === recurso)?.disponibles ?? 0;
  const estado = meta?.estado ?? 'RESPONDIDA';
  return respuesta({
    operationKey,
    conversacionId,
    mensajeId: mensaje.id,
    markdown: mensaje.text,
    citas: (mensaje.citations ?? []) as Cita[],
    recurso,
    intencion: meta?.ruta ?? (recurso === 'CONSULTA_TECNICA' ? 'explicacion.tecnica' : 'explicacion.general'),
    estado,
    consumido: estado === 'SIN_CONTEXTO' ? 0 : 1,
    restantes,
    ruta: meta ? { etiqueta: meta.etiqueta, proveedor: meta.proveedor, modelo: meta.modelo } : { etiqueta: 'Desconocida', proveedor: 'desconocido' },
    avisos: meta?.avisos ?? [],
  });
}
