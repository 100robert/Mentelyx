import { z } from '../zod';

/**
 * Bloques educativos versionados (`mentelyx.bloque/v1`). Cada bloque es un dato validado: nunca HTML, JavaScript ni
 * instrucciones ejecutables. Los identificadores siguen `mentelyx.escena/v1` (motor visual, sección 6) para que el Tutor,
 * el recorrido guiado y la persona señalen la misma parte de un bloque (un paso, una función, una región o una pieza).
 */
export const ESQUEMA_BLOQUE = 'mentelyx.bloque/v1';
export const RE_ID = /^[a-z][a-z0-9_-]{0,31}$/;
export const Id = z.string().regex(RE_ID, 'Identificador no válido');
export const IdParametro = z.string().regex(/^[a-z][a-z0-9_]{0,15}$/, 'Parámetro no válido');
const Texto = (max: number) => z.string().trim().min(1).max(max);
const Numero = z.number().finite().min(-1e6).max(1e6);
/** Colores por token (nunca hexadecimales libres): la interfaz los traduce a la paleta y al modo de contraste. */
export const ColorToken = z.enum(['primario', 'secundario', 'acento', 'exito', 'alerta', 'peligro', 'neutro', 'serie1', 'serie2', 'serie3', 'serie4', 'serie5', 'serie6']);
export type ColorToken = z.infer<typeof ColorToken>;

/** Rutas del mismo origen para recursos propios o con licencia verificada; nunca URL arbitrarias. */
const RutaObra = z.string().regex(/^\/recursos\/obras\/[a-z0-9-]+\.(webp|jpg|png)$/, 'Imagen fuera del catálogo');
const RutaModelo = z.string().regex(/^\/modelos\/[a-z0-9-]+\.(glb|gltf)$/, 'Modelo fuera del catálogo');
const RutaDocumento = z.string().regex(/^\/documentos\/[a-z0-9-]+\.pdf$/, 'Documento fuera del catálogo');
const EnlaceExterno = z.url({ protocol: /^https$/ }).max(400);

export const Referencia = z.discriminatedUnion('tipo', [
  z.strictObject({
    id: Id,
    tipo: z.literal('cita'),
    numero: z.number().int().min(1).max(99),
    titulo: Texto(200),
    fragmento: z.string().max(4000),
    recursoId: z.string().max(64).optional(),
    version: z.number().int().positive().optional(),
  }),
  z.strictObject({ id: Id, tipo: z.literal('pagina'), documento: Id, pagina: z.number().int().min(1).max(5000), texto: z.string().max(300).optional() }),
  z.strictObject({
    id: Id,
    tipo: z.literal('credito'),
    titulo: Texto(200),
    autor: Texto(120),
    fecha: z.string().max(60).optional(),
    institucion: z.string().max(160).optional(),
    licencia: Texto(120),
    enlace: EnlaceExterno.optional(),
  }),
]);
export type Referencia = z.infer<typeof Referencia>;

export const Vista2D = z.strictObject({ xMin: Numero, xMax: Numero, yMin: Numero, yMax: Numero });
export const Parametro = z.strictObject({ id: IdParametro, etiqueta: z.string().max(40).optional(), min: Numero, max: Numero, paso: z.number().positive().max(1e4), valor: Numero });
export type Parametro = z.infer<typeof Parametro>;

const base = {
  id: Id,
  version: z.literal(1),
  orden: z.number().int().min(0).max(9999),
  titulo: z.string().trim().max(160).optional(),
  referencias: z.array(Referencia).max(30).optional(),
  estado: z.enum(['listo', 'cargando', 'error']).optional(),
  capacidades: z.array(z.string().max(40)).max(12).optional(),
  accesibilidad: z.strictObject({ descripcion: Texto(1500) }),
  origen: z.enum(['tutor', 'recorrido', 'persona', 'ejemplo']),
};

export const BloqueTexto = z.strictObject({ ...base, tipo: z.literal('texto'), contenido: z.strictObject({ markdown: Texto(20_000), pregunta: z.string().max(4000).optional() }) });
export const BloqueFormula = z.strictObject({
  ...base,
  tipo: z.literal('formula'),
  contenido: z.strictObject({ latex: Texto(2000), quimica: z.boolean().optional(), lectura: z.string().max(600).optional() }),
});
export const BloquePasos = z.strictObject({
  ...base,
  tipo: z.literal('pasos'),
  contenido: z.strictObject({
    pasos: z.array(z.strictObject({ id: Id, titulo: Texto(80), latex: z.string().max(1500).optional(), texto: z.string().max(600) })).min(1).max(20),
    revelados: z.number().int().min(1).max(20).optional(),
  }),
});
export const BloqueGrafico = z.strictObject({
  ...base,
  tipo: z.literal('grafico'),
  contenido: z.strictObject({
    vista: Vista2D,
    ejes: z.strictObject({ x: z.string().max(30), y: z.string().max(30) }).optional(),
    parametros: z.array(Parametro).max(4).optional(),
    funciones: z.array(z.strictObject({ id: Id, expresion: Texto(200), color: ColorToken, etiqueta: z.string().max(60).optional() })).min(1).max(6),
    puntos: z.array(z.strictObject({ id: Id, x: z.union([Numero, Texto(200)]), en: Id, etiqueta: z.string().max(60).optional(), color: ColorToken.optional() })).max(20).optional(),
    tangentes: z.array(z.strictObject({ id: Id, funcion: Id, x: z.union([Numero, Texto(200)]), color: ColorToken })).max(4).optional(),
  }),
});
export const BloqueVectores = z.strictObject({
  ...base,
  tipo: z.literal('vectores'),
  contenido: z.strictObject({
    vista: Vista2D,
    unidad: z.string().max(12).optional(),
    vectores: z
      .array(z.strictObject({ id: Id, origen: z.tuple([Numero, Numero]), componentes: z.tuple([Numero, Numero]), color: ColorToken, etiqueta: z.string().max(40) }))
      .min(1)
      .max(12),
    resultante: z.strictObject({ id: Id, de: z.array(Id).min(2).max(12), etiqueta: z.string().max(40) }).optional(),
  }),
});
export const BloqueTabla = z.strictObject({
  ...base,
  tipo: z.literal('tabla'),
  contenido: z.strictObject({
    columnas: z.array(z.string().max(60)).min(1).max(8),
    filas: z.array(z.strictObject({ id: Id, celdas: z.array(z.string().max(200)).min(1).max(8) })).min(1).max(60),
    leyenda: z.string().max(200).optional(),
  }),
});
export const BloqueLineaTiempo = z.strictObject({
  ...base,
  tipo: z.literal('linea-tiempo'),
  contenido: z.strictObject({
    eventos: z.array(z.strictObject({ id: Id, fecha: Texto(40), orden: Numero, titulo: Texto(120), texto: z.string().max(500) })).min(1).max(40),
  }),
});
export const BloqueCodigo = z.strictObject({
  ...base,
  tipo: z.literal('codigo'),
  contenido: z.strictObject({ lenguaje: z.enum(['python', 'javascript', 'typescript', 'java', 'c', 'cpp', 'sql', 'html', 'css', 'texto']), codigo: Texto(8000) }),
});
export const BloqueComparacion = z.strictObject({
  ...base,
  tipo: z.literal('comparacion'),
  contenido: z.strictObject({ columnas: z.array(z.strictObject({ id: Id, titulo: Texto(80), puntos: z.array(Texto(240)).min(1).max(12) })).min(2).max(4) }),
});
export const BloqueEjercicio = z.strictObject({
  ...base,
  tipo: z.literal('ejercicio'),
  contenido: z.discriminatedUnion('modo', [
    z.strictObject({ modo: z.literal('numero'), enunciado: Texto(1200), respuesta: Numero, tolerancia: z.number().min(0).max(1).optional(), pista: z.string().max(600).optional(), explicacion: z.string().max(1200).optional() }),
    z.strictObject({
      modo: z.literal('opcion'),
      enunciado: Texto(1200),
      opciones: z.array(z.strictObject({ id: Id, texto: Texto(300) })).min(2).max(6),
      correcta: Id,
      pista: z.string().max(600).optional(),
      explicacion: z.string().max(1200).optional(),
    }),
  ]),
});
const Punto = z.tuple([z.number().min(0).max(20_000), z.number().min(0).max(20_000)]);
export const BloqueObra = z.strictObject({
  ...base,
  tipo: z.literal('obra'),
  contenido: z.strictObject({
    imagen: z.strictObject({ src: RutaObra, srcChica: RutaObra.optional(), ancho: z.number().int().min(1).max(20_000), alto: z.number().int().min(1).max(20_000) }),
    regiones: z
      .array(
        z.strictObject({
          id: Id,
          etiqueta: Texto(80),
          texto: z.string().max(800),
          forma: z.discriminatedUnion('tipo', [
            z.strictObject({ tipo: z.literal('circulo'), centro: Punto, radio: z.number().positive().max(20_000) }),
            z.strictObject({ tipo: z.literal('rect'), desde: Punto, hasta: Punto }),
          ]),
        }),
      )
      .max(12),
    lineas: z.array(z.strictObject({ id: Id, etiqueta: Texto(80), puntos: z.array(Punto).min(2).max(40), texto: z.string().max(600) })).max(8).optional(),
  }),
});
export const ClaveModelo = z.enum(['motor-4t', 'metano']);
export type ClaveModelo = z.infer<typeof ClaveModelo>;
export const BloqueModelo = z.strictObject({
  ...base,
  tipo: z.literal('modelo-3d'),
  contenido: z.strictObject({
    modelo: z.discriminatedUnion('tipo', [z.strictObject({ tipo: z.literal('catalogo'), clave: ClaveModelo }), z.strictObject({ tipo: z.literal('gltf'), src: RutaModelo })]),
    partes: z.array(z.strictObject({ id: Id, nombre: Texto(60), texto: z.string().max(600) })).max(30).optional(),
  }),
});
export const BloquePdf = z.strictObject({
  ...base,
  tipo: z.literal('pdf'),
  contenido: z.strictObject({
    documento: z.discriminatedUnion('tipo', [z.strictObject({ tipo: z.literal('catalogo'), src: RutaDocumento }), z.strictObject({ tipo: z.literal('local') })]),
    pagina: z.number().int().min(1).max(5000).optional(),
  }),
});
export const BloqueDesconocido = z.strictObject({
  ...base,
  tipo: z.literal('desconocido'),
  contenido: z.strictObject({ tipoOriginal: z.string().max(40), motivo: z.enum(['tipo', 'version', 'invalido']), errores: z.array(z.string().max(200)).max(10) }),
});

export const Bloque = z.discriminatedUnion('tipo', [
  BloqueTexto,
  BloqueFormula,
  BloquePasos,
  BloqueGrafico,
  BloqueVectores,
  BloqueTabla,
  BloqueLineaTiempo,
  BloqueCodigo,
  BloqueComparacion,
  BloqueEjercicio,
  BloqueObra,
  BloqueModelo,
  BloquePdf,
  BloqueDesconocido,
]);
export type Bloque = z.infer<typeof Bloque>;
export type TipoBloque = Bloque['tipo'];
export type BloqueDe<T extends TipoBloque> = Extract<Bloque, { tipo: T }>;
export const TIPOS: readonly TipoBloque[] = Bloque.options.map((o) => o.shape.tipo.value);

/** Lo que cada tipo admite. Una acción sobre un bloque que no la admite se rechaza (`ACCION_NO_ADMITIDA`). */
export const CAPACIDADES = {
  texto: ['resaltar', 'mostrar-referencia'],
  formula: [],
  pasos: ['revelar-paso', 'resaltar'],
  grafico: ['modificar-parametro', 'resaltar', 'cambiar-vista'],
  vectores: ['resaltar'],
  tabla: ['resaltar'],
  'linea-tiempo': ['resaltar', 'seleccionar-estructura'],
  codigo: [],
  comparacion: ['resaltar'],
  ejercicio: [],
  obra: ['resaltar', 'seleccionar-estructura', 'cambiar-vista', 'mostrar-referencia'],
  'modelo-3d': ['seleccionar-estructura', 'resaltar', 'cambiar-vista', 'modificar-parametro'],
  pdf: ['cambiar-vista', 'mostrar-referencia'],
  desconocido: [],
} as const satisfies Record<TipoBloque, readonly string[]>;
export type Capacidad = (typeof CAPACIDADES)[TipoBloque][number];

/** Nombre de cada tipo en la interfaz. */
export const NOMBRE_TIPO: Record<TipoBloque, string> = {
  texto: 'Explicación',
  formula: 'Fórmula',
  pasos: 'Procedimiento',
  grafico: 'Gráfico',
  vectores: 'Diagrama de vectores',
  tabla: 'Tabla',
  'linea-tiempo': 'Línea de tiempo',
  codigo: 'Código',
  comparacion: 'Comparación',
  ejercicio: 'Actividad',
  obra: 'Obra',
  'modelo-3d': 'Modelo 3D',
  pdf: 'Documento',
  desconocido: 'Contenido no disponible',
};
