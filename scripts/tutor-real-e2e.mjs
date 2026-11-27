#!/usr/bin/env node
// Verificación de INFERENCIA REAL del Tutor contra la API del perfil `externo` (Neon, Atlas y NVIDIA). Hace UNA consulta
// al modelo (consume créditos de la cuenta). Cuenta y contenido ficticios (@ejemplo.test). No imprime secretos.
//   node scripts/tutor-real-e2e.mjs [http://127.0.0.1:8790]
const BASE = (process.argv[2] ?? 'http://127.0.0.1:8790').replace(/\/$/, '');
const ORIGEN = new URL(BASE).origin;
let cookie = '';
const guardar = (r) => {
  const m = new Map(cookie.split('; ').filter(Boolean).map((c) => [c.split('=')[0], c]));
  for (const c of r.headers.getSetCookie().map((x) => x.split(';')[0])) m.set(c.split('=')[0], c);
  cookie = [...m.values()].join('; ');
};
async function api(ruta, { metodo = 'GET', cuerpo, clave } = {}) {
  const h = { origin: ORIGEN, 'content-type': 'application/json', cookie };
  if (metodo !== 'GET') {
    const c = await fetch(`${BASE}/api/v1/auth/csrf`, { headers: h });
    guardar(c);
    h.cookie = cookie;
    h['x-csrf-token'] = (await c.json()).data.token;
  }
  if (clave) h['idempotency-key'] = clave;
  const t = Date.now();
  const r = await fetch(`${BASE}/api/v1${ruta}`, { method: metodo, headers: h, ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}) });
  guardar(r);
  const j = await r.json().catch(() => null);
  return { estado: r.status, datos: j?.data, error: j?.error, ms: Date.now() - t };
}
const exigir = (r, que) => {
  if (r.estado >= 300) throw new Error(`${que}: ${r.estado} ${r.error?.code} ${r.error?.message ?? ''}`);
  return r.datos;
};

const correo = `tutor-real-${Date.now()}@ejemplo.test`;
exigir(await api('/auth/registro', { metodo: 'POST', cuerpo: { nombre: 'Prueba Tutor Real', correo, contrasena: 'clave-ficticia-real-1' } }), 'registro (Neon)');
const tema = exigir(await api('/espacios', { metodo: 'POST', cuerpo: { titulo: 'Derivadas (prueba real)' } }), 'tema');
exigir(
  await api(`/espacios/${tema.id}/fuentes`, {
    metodo: 'POST',
    clave: `fuente${Date.now()}`,
    cuerpo: { titulo: 'Apuntes', formato: 'MD', contenido: 'La derivada de una función mide su tasa de cambio instantánea. Regla de la potencia: la derivada de x elevado a n es n por x elevado a n menos 1. Por ejemplo, la derivada de x al cubo es 3 por x al cuadrado.' },
  }),
  'fuente',
);
for (let i = 0; i < 20; i++) {
  const d = exigir(await api(`/espacios/${tema.id}`), 'detalle');
  if (d.listaFuentes.every((f) => f.estadoLectura === 'LISTA')) break;
  await new Promise((r) => setTimeout(r, 1000));
}
const conv = exigir(await api('/tutor-ia/conversaciones', { metodo: 'POST', cuerpo: { contexto: { superficie: 'TUTOR', espacioId: tema.id } } }), 'conversación (Atlas)');
const r = await api('/tutor-ia/consultas', {
  metodo: 'POST',
  clave: `real${Date.now()}`,
  cuerpo: { conversacionId: conv.id, pregunta: 'Explícame paso a paso cómo derivar x al cubo con la regla de la potencia. Usa un procedimiento por pasos.', fuentes: { espacioId: tema.id } },
});
const d = exigir(r, 'consulta real');
const recargada = exigir(await api(`/tutor-ia/conversaciones/${conv.id}`), 'recuperación');
const respuesta = recargada.listaMensajes.find((m) => m.rol === 'assistant');
console.log(
  JSON.stringify(
    {
      ms: r.ms,
      estado: d.estado,
      modoFuentes: d.modoFuentes,
      ruta: d.uso.ruta,
      citas: d.citas.length,
      bloques: (d.bloques ?? []).map((b) => b.tipo),
      acciones: (d.acciones ?? []).map((a) => a.accion),
      avisos: d.avisos,
      inicio: d.segmentos[0].markdown.slice(0, 220),
      recuperado: { mensajes: recargada.listaMensajes.length, ruta: respuesta?.ruta, bloques: (respuesta?.bloques ?? []).length },
    },
    null,
    2,
  ),
);
