/**
 * Adaptador entre el Tutor IA (contrato `RespuestaTutor` y mensajes de conversación) y los bloques. Es independiente del
 * transporte: recibe el objeto ya decodificado, venga de la respuesta JSON actual o de los eventos SSE de I-2.
 * Los segmentos en Markdown se convierten en un bloque `texto` con sus citas; si la respuesta trae `bloques` o `acciones`
 * (contrato propuesto en el diseño de API, sección 12.4), se entregan sin confiar en ellos: el reductor los valida.
 */
export type CitaTutor = { id: string; titulo: string; fragmento: string; recursoId?: string; version?: number };
export type RespuestaTutorVista = {
  mensajeId: string;
  segmentos: Array<{ id?: string; markdown: string }>;
  citas: CitaTutor[];
  bloques?: unknown;
  acciones?: unknown;
};
export type MensajeTutor = { id: string; rol: 'user' | 'assistant'; texto: string; citas?: CitaTutor[]; bloques?: unknown[]; ruta?: { etiqueta: string; proveedor: string } };

const MAX_EXTRA = 12;

/** Identificador de bloque estable para un mensaje del Tutor (mismo mensaje → mismo bloque al volver a la sesión). */
export function idDeMensaje(mensajeId: string) {
  const limpio = mensajeId.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 28);
  return `r${limpio || '0'}`;
}

const recorte = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);

/** Bloque `texto` (sin validar todavía) a partir de una respuesta del Tutor. */
export function bloqueDeRespuesta(datos: { mensajeId: string; markdown: string; citas: CitaTutor[]; pregunta?: string; orden: number }) {
  const usados = new Set<number>();
  const referencias = datos.citas.slice(0, 30).map((c, k) => {
    let numero = Number(c.id);
    if (!Number.isInteger(numero) || numero < 1 || numero > 99 || usados.has(numero)) numero = k + 1;
    usados.add(numero);
    return {
      id: `c${numero}`,
      tipo: 'cita' as const,
      numero,
      titulo: recorte(c.titulo.trim() || 'Fuente', 200),
      fragmento: recorte(c.fragmento, 4000),
      ...(c.recursoId ? { recursoId: c.recursoId.slice(0, 64) } : {}),
      ...(c.version && Number.isInteger(c.version) && c.version > 0 ? { version: c.version } : {}),
    };
  });
  const pregunta = datos.pregunta?.trim();
  return {
    id: idDeMensaje(datos.mensajeId),
    version: 1,
    tipo: 'texto',
    orden: datos.orden,
    origen: 'tutor',
    titulo: pregunta ? recorte(pregunta, 160) : 'Respuesta del Tutor',
    referencias,
    accesibilidad: { descripcion: recorte(pregunta ? `Respuesta del Tutor a: ${pregunta}` : 'Respuesta del Tutor.', 1500) },
    contenido: { markdown: recorte(datos.markdown.trim() || 'El Tutor no devolvió texto.', 20_000), ...(pregunta ? { pregunta: recorte(pregunta, 4000) } : {}) },
  };
}

/** Bloques y acciones propuestos por una respuesta. Lo que no sea un arreglo se ignora; el resto lo valida el reductor. */
export function deRespuesta(r: RespuestaTutorVista, orden: number, pregunta?: string): { bloques: unknown[]; acciones: unknown[] } {
  const texto = bloqueDeRespuesta({
    mensajeId: r.mensajeId,
    markdown: r.segmentos.map((s) => s.markdown).join('\n\n'),
    citas: r.citas,
    orden,
    ...(pregunta ? { pregunta } : {}),
  });
  const extra = Array.isArray(r.bloques) ? r.bloques.slice(0, MAX_EXTRA) : [];
  const acciones = Array.isArray(r.acciones) ? r.acciones.slice(0, 40) : [];
  return {
    bloques: [
      texto,
      // Los bloques adicionales se ordenan detrás del texto y se marcan como del Tutor, sin importar lo que declaren.
      ...extra.map((b, k) => (typeof b === 'object' && b !== null ? { ...b, orden: orden + k + 1, origen: 'tutor' } : b)),
    ],
    acciones,
  };
}

/**
 * Reconstruye los bloques de una sesión desde sus mensajes reales (la continuidad no depende de nada guardado en el
 * navegador): cada respuesta del asistente se vuelve un bloque `texto` titulado con la pregunta que la originó.
 */
export function bloquesDeMensajes(mensajes: readonly MensajeTutor[], ordenInicial = 0): unknown[] {
  const bloques: unknown[] = [];
  let pregunta: string | undefined;
  for (const m of mensajes) {
    if (m.rol === 'user') {
      pregunta = m.texto;
      continue;
    }
    bloques.push(bloqueDeRespuesta({ mensajeId: m.id, markdown: m.texto, citas: m.citas ?? [], orden: ordenInicial + bloques.length, ...(pregunta ? { pregunta } : {}) }));
    // Bloques que el servidor validó y guardó con la respuesta (API 12.4): vuelven igual al reabrir la sesión.
    for (const b of Array.isArray(m.bloques) ? m.bloques.slice(0, MAX_EXTRA) : []) if (typeof b === 'object' && b !== null) bloques.push({ ...b, orden: ordenInicial + bloques.length, origen: 'tutor' });
    pregunta = undefined;
  }
  return bloques;
}
