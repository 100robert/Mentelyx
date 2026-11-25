/** Puerto de autenticación de M1: aísla la biblioteca concreta (diseño interno, sección 3.1: `session.port.ts`). */
export type SesionVigente = { usuarioId: string; expiraEn: string };

export class CredencialesInvalidas extends Error {
  constructor() {
    super('Credenciales inválidas.');
    this.name = 'CredencialesInvalidas';
  }
}

export class RegistroRechazado extends Error {
  constructor() {
    super('No se pudo completar el registro.');
    this.name = 'RegistroRechazado';
  }
}

export interface AutenticacionPort {
  /** Devuelve las cabeceras Set-Cookie de la sesión creada; nunca devuelve la contraseña ni el token en el cuerpo. */
  registrar(datos: { nombre: string; correo: string; contrasena: string }, entrada: Headers): Promise<{ usuarioId: string; cabeceras: Headers }>;
  iniciarSesion(datos: { correo: string; contrasena: string }, entrada: Headers): Promise<{ usuarioId: string; cabeceras: Headers }>;
  cerrarSesion(entrada: Headers): Promise<{ cabeceras: Headers }>;
  /** Consulta autoritativa en SQL en cada petición (seguridad, sección 3: sin cookieCache ni secondaryStorage). */
  obtenerSesion(entrada: Headers): Promise<SesionVigente | null>;
}
