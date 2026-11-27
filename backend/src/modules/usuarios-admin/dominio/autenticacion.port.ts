/** Puerto de autenticación de M1: aísla la biblioteca concreta (diseño interno, sección 3.1: `session.port.ts`). */
export type SesionVigente = { usuarioId: string; expiraEn: string; nombre: string; correo: string; correoVerificado: boolean };

/** Datos de la cuenta que ve su titular (API 12.3 y 12.10). V1 (ADR-093): solo cuentas de Estudiante. */
export type Cuenta = { usuarioId: string; nombre: string; correo: string; correoVerificado: boolean; tipoCuenta: 'ESTUDIANTE'; creadaEn: string };
export type SesionActiva = { id: string; creadaEn: string; expiraEn: string; actual: boolean; dispositivo: string | null };

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
  cuenta(entrada: Headers): Promise<Cuenta | null>;
  cambiarNombre(entrada: Headers, nombre: string): Promise<void>;
  /** Exige la contraseña actual y revoca las demás sesiones (API 12.10). Lanza CredencialesInvalidas si no coincide. */
  cambiarContrasena(entrada: Headers, actual: string, nueva: string): Promise<{ cabeceras: Headers }>;
  sesiones(entrada: Headers): Promise<SesionActiva[]>;
  /** Revoca una sesión propia por su id (nunca expone ni recibe tokens). `false` si no es de la cuenta. */
  revocarSesion(entrada: Headers, sesionId: string): Promise<boolean>;
}

/** Preferencias de aprendizaje (API 12.10): valores por omisión, nunca un nivel fijo. */
export type Preferencias = { profundidad: 'inicial' | 'intermedio' | 'avanzado' | null; herramientasVisuales: string[]; idioma: 'es'; actualizadasEn: string | null };
export interface PreferenciasRepositorio {
  obtener(usuarioId: string): Promise<Preferencias>;
  guardar(usuarioId: string, p: Omit<Preferencias, 'actualizadasEn'>, ahora: Date): Promise<Preferencias>;
}
