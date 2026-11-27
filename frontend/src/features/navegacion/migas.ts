/**
 * Migas de la barra superior: dicen en qué módulo y lista se está. Las pantallas con migas propias (tema, sesión,
 * experiencia o preparación) solo muestran el módulo, para no duplicar la ruta. Una ruta desconocida no inventa «Inicio».
 */
export function migasDeRuta(ruta: string): Array<{ texto: string; href?: string }> {
  const aprendizaje = { texto: 'Aprendizaje', href: '/aprendizaje' };
  // Pantallas con migas propias (tema, sesión, experiencia o preparación): la barra solo dice en qué módulo se está.
  if (/^\/(espacios|tutor)\/[^/]+$/.test(ruta) || ruta.startsWith('/aprendizaje/experiencias')) return [aprendizaje];
  if (ruta.startsWith('/examenes/')) return [{ texto: 'Exámenes', href: '/examenes' }];
  if (ruta === '/espacios') return [aprendizaje, { texto: 'Temas' }];
  if (ruta.startsWith('/tutor')) return [aprendizaje, { texto: 'Sesiones' }];
  const fijas: Record<string, string> = { '/inicio': 'Inicio', '/aprendizaje': 'Aprendizaje', '/examenes': 'Exámenes', '/fuentes': 'Mis fuentes', '/configuracion': 'Configuración' };
  return fijas[ruta] ? [{ texto: fijas[ruta] }] : [];
}
