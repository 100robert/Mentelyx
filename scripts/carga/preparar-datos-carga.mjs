#!/usr/bin/env node
// Datos de PRUEBA DE CARGA (Sprint 2, actividad 8) creados por la API real contra la base AISLADA `mentelyx_carga`
// (nunca la funcional ni Neon/Atlas). Cuentas ficticias carga-NN@ejemplo.test; cada una con una preparación, un banco de
// 8 preguntas, una carpeta, un tema y una conversación. Respeta los límites de autenticación (no los desactiva).
//   node scripts/carga/preparar-datos-carga.mjs [http://127.0.0.1:8792] [20]
import { writeFileSync } from 'node:fs';

const BASE = (process.argv[2] ?? 'http://127.0.0.1:8792').replace(/\/$/, '');
const N = Number(process.argv[3] ?? 20);
const CONTRASENA = process.env.CARGA_CONTRASENA ?? 'Carga-Ficticia-2026';
const ORIGEN = new URL(BASE).origin;

function cliente() {
  let cookie = '';
  const guardar = (r) => {
    const m = new Map(cookie.split('; ').filter(Boolean).map((c) => [c.split('=')[0], c]));
    for (const c of r.headers.getSetCookie().map((x) => x.split(';')[0])) m.set(c.split('=')[0], c);
    cookie = [...m.values()].join('; ');
  };
  return async (ruta, { metodo = 'GET', cuerpo, clave } = {}) => {
    const h = { origin: ORIGEN, 'content-type': 'application/json', cookie };
    if (metodo !== 'GET') {
      const c = await fetch(`${BASE}/api/v1/auth/csrf`, { headers: h });
      guardar(c);
      h.cookie = cookie;
      h['x-csrf-token'] = (await c.json()).data.token;
    }
    if (clave) h['idempotency-key'] = clave;
    const r = await fetch(`${BASE}/api/v1${ruta}`, { method: metodo, headers: h, ...(cuerpo ? { body: JSON.stringify(cuerpo) } : {}) });
    guardar(r);
    const j = await r.json().catch(() => null);
    if (r.status >= 300) throw new Error(`${metodo} ${ruta}: ${r.status} ${j?.error?.code}`);
    return j.data;
  };
}

const q = (id, tema, enunciado, opciones, correcta) => ({ id, version: 1, tipo: 'opcion-unica', tema, dificultad: 'media', enunciado, origen: 'persona', opciones: opciones.map((texto, k) => ({ id: `o${k + 1}`, texto })), correcta });
const PREGUNTAS = [
  q('c1', 'Derivadas', '¿Derivada de x²?', ['2x', 'x', 'x²'], 'o1'),
  q('c2', 'Derivadas', '¿Derivada de una constante?', ['0', '1', 'x'], 'o1'),
  q('c3', 'Derivadas', '¿Derivada de x³?', ['3x²', 'x²', '3x'], 'o1'),
  q('c4', 'Derivadas', '¿Derivada de 5x?', ['5', 'x', '5x'], 'o1'),
  { id: 'c5', version: 1, tipo: 'numerica', tema: 'Límites', dificultad: 'basica', enunciado: 'lím x→3 de 2x', origen: 'persona', respuesta: 6, tolerancia: { tipo: 'absoluta', valor: 0.01 } },
  { id: 'c6', version: 1, tipo: 'verdadero-falso', tema: 'Límites', dificultad: 'basica', enunciado: 'lím x→∞ de 1/x es 0', origen: 'persona', correcta: true },
  q('c7', 'Límites', 'lím x→0 de sen(x)/x', ['1', '0', '∞'], 'o1'),
  q('c8', 'Límites', 'lím x→2 de x²', ['4', '2', '8'], 'o1'),
];

const datos = [];
for (let i = 1; i <= N; i++) {
  const api = cliente();
  const correo = `carga-${String(i).padStart(2, '0')}@ejemplo.test`;
  try {
    await api('/auth/registro', { metodo: 'POST', cuerpo: { nombre: `Carga ${i}`, correo, contrasena: CONTRASENA } });
  } catch {
    await api('/auth/login', { metodo: 'POST', cuerpo: { correo, contrasena: CONTRASENA } });
  }
  const preps = await api('/preparaciones');
  const prep =
    preps[0] ??
    (await api('/preparaciones', {
      metodo: 'POST',
      clave: `carga-prep-${i}-aaaa`,
      cuerpo: { nombre: `Parcial ${i}`, asignatura: 'Cálculo', fuente: 'PERSONAL', minutosSemanales: 180, temas: [{ areaCodigo: 'CALCULO', temaCodigo: 'T01', titulo: 'Derivadas' }, { areaCodigo: 'CALCULO', temaCodigo: 'T02', titulo: 'Límites' }] },
    }));
  const banco = await api(`/preparaciones/${prep.id}/preguntas`);
  if (banco.total === 0) await api(`/preparaciones/${prep.id}/preguntas`, { metodo: 'POST', clave: `carga-banco-${i}-aaaa`, cuerpo: { preguntas: PREGUNTAS } });
  const carpetas = await api('/carpetas?modulo=EXAMENES&estado=ACTIVA');
  if (!carpetas.length) await api('/carpetas', { metodo: 'POST', clave: `carga-carpeta-${i}-aaaa`, cuerpo: { modulo: 'EXAMENES', nombre: 'Ciclo' } });
  const convs = await api('/tutor-ia/conversaciones');
  if (!convs.length) await api('/tutor-ia/conversaciones', { metodo: 'POST', cuerpo: { contexto: { superficie: 'TUTOR' } } });
  datos.push({ correo, preparacionId: prep.id });
  process.stdout.write(`${i} `);
}
writeFileSync(new URL('./datos-carga.json', import.meta.url), JSON.stringify({ base: BASE, cuentas: datos }, null, 2));
console.log(`\n${datos.length} cuentas de carga listas (scripts/carga/datos-carga.json; sin contraseñas ni cookies)`);
