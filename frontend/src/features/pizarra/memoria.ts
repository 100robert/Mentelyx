import type { Bloque } from '@/features/bloques/esquema';
import type { Elemento, Vista } from './modelo';
import type { ModoPedagogico } from './pedagogia';

/**
 * Memoria de la pantalla, solo en la pestaña (nunca en localStorage): conserva la capa de trabajo y lo que aún no llegó al
 * servidor si el espacio se vuelve a montar sin recargar (por ejemplo, al empezar la sesión o actualizar las fuentes).
 * Al recargar la página o cerrar sesión se pierde; la interfaz dice que los trazos todavía no se guardan.
 */
export type Recuerdo = {
  elementos: Elemento[];
  propios: Bloque[];
  vista?: Vista;
  comentadas: Array<[string, string]>;
  modo?: ModoPedagogico;
  ultima?: { modo: string; etiqueta: string; avisos: string[] } | null;
};
const MAX = 24;
const memoria = new Map<string, Recuerdo>();

export const recuperar = (clave: string) => memoria.get(clave);
export function recordar(clave: string, r: Recuerdo) {
  memoria.delete(clave);
  memoria.set(clave, r);
  while (memoria.size > MAX) memoria.delete(memoria.keys().next().value!);
}
export function trasladar(de: string, a: string) {
  const r = memoria.get(de);
  if (!r) return;
  memoria.delete(de);
  memoria.set(a, r);
}
/** Se llama al cerrar sesión: no queda nada del trabajo en la pestaña. */
export const olvidarTodo = () => memoria.clear();
