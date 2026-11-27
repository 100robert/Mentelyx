/** Control compartido antes del trabajo de contraseñas; no revela si la cuenta existe. */
export interface LimiteAutenticacionPort {
  consumir(correo: string, direccionIpConfiable: string | undefined): Promise<void>;
}
