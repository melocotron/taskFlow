/** Cuenta autenticada que devuelve la API. */
export interface Usuario {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
  /** ISO 8601. */
  readonly creadoEn: string;
}
