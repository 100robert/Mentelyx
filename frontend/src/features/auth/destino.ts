/**
 * Intención de entrada y destino tras autenticarse. La landing ofrece dos caminos (aprender o preparar un examen) y el
 * acceso los conserva con `?objetivo=`. `?siguiente=` vuelve a la ruta protegida que pidió el middleware.
 * No se guarda como atributo del usuario: solo orienta la navegación.
 *
 * Seguridad: `siguiente` solo admite rutas internas de una lista cerrada. Así no hay redirecciones abiertas
 * (`//otro.sitio`, `/\otro.sitio`, `https:`, `javascript:`) ni saltos a rutas no previstas.
 */
export type Objetivo = 'aprendizaje' | 'examen';

const PREFIJOS_PERMITIDOS = ['/inicio', '/aprendizaje', '/examenes', '/espacios', '/tutor', '/fuentes', '/configuracion'] as const;

export function leerObjetivo(valor: string | null | undefined): Objetivo | null {
  return valor === 'aprendizaje' || valor === 'examen' ? valor : null;
}

/** Devuelve la ruta interna normalizada (ruta + consulta) o null si no es segura o no está permitida. */
export function validarSiguiente(valor: string | null | undefined): string | null {
  if (!valor || valor.length > 512) return null;
  // Rechaza caracteres de control y barras invertidas (algunos navegadores las tratan como «/»).
  const conControl = [...valor].some((c) => c.charCodeAt(0) < 0x20 || c === '\\');
  if (!valor.startsWith('/') || valor.startsWith('//') || conControl) return null;
  let url: URL;
  try {
    url = new URL(valor, 'https://mentelyx.invalid');
  } catch {
    return null;
  }
  if (url.origin !== 'https://mentelyx.invalid') return null;
  const permitida = PREFIJOS_PERMITIDOS.some((p) => url.pathname === p || url.pathname.startsWith(`${p}/`));
  return permitida ? `${url.pathname}${url.search}` : null;
}

/** Destino tras iniciar sesión o crear la cuenta: la ruta pedida, el flujo de la intención o el inicio. */
export function destinoTrasAcceso(parametros: { get(nombre: string): string | null }): string {
  const siguiente = validarSiguiente(parametros.get('siguiente'));
  if (siguiente) return siguiente;
  const objetivo = leerObjetivo(parametros.get('objetivo'));
  if (objetivo === 'examen') return '/examenes?nueva=1';
  if (objetivo === 'aprendizaje') return '/aprendizaje?empezar=1';
  return '/inicio';
}

/** Consulta que se conserva al pasar entre «Iniciar sesión» y «Crear cuenta» (solo valores válidos). */
export function consultaDeIntencion(parametros: { get(nombre: string): string | null }): string {
  const q = new URLSearchParams();
  const objetivo = leerObjetivo(parametros.get('objetivo'));
  const siguiente = validarSiguiente(parametros.get('siguiente'));
  if (objetivo) q.set('objetivo', objetivo);
  if (siguiente) q.set('siguiente', siguiente);
  const texto = q.toString();
  return texto ? `?${texto}` : '';
}
