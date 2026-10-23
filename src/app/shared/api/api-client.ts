import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

/** Valores admitidos como query string. `null` y `undefined` se omiten. */
export type ParametrosApi = Readonly<Record<string, string | number | boolean | null | undefined>>;

/** Error estable de la API, con el código que devuelve el servidor. */
export class ApiError extends Error {
  readonly mensaje: string;

  constructor(
    readonly codigo: string,
    mensaje: string,
    readonly estado: number,
  ) {
    super(mensaje);
    this.name = 'ApiError';
    this.mensaje = mensaje;
  }
}

/**
 * Cliente HTTP de la API compartida.
 *
 * Vive en `shared/api` porque no conoce el dominio: solo construye la URL, adjunta
 * la cookie de sesión y traduce el sobre de error del servidor a una excepción con
 * código. Los repositorios de cada entidad deciden qué endpoints usan y cómo
 * convierten la respuesta a su modelo.
 *
 * En desarrollo la ruta `/api/v1` la resuelve el proxy de Angular hacia Go. En
 * producción Angular y Go comparten origen, así que la cookie `HttpOnly` viaja sin
 * CORS y sin exponer el token a JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/v1/';

  get<T>(ruta: string, parametros?: ParametrosApi): Promise<T> {
    return this.peticion<T>('GET', ruta, undefined, parametros);
  }

  post<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.peticion<T>('POST', ruta, cuerpo);
  }

  patch<T>(ruta: string, cuerpo: unknown): Promise<T> {
    return this.peticion<T>('PATCH', ruta, cuerpo);
  }

  async delete(ruta: string): Promise<void> {
    await this.peticion<unknown>('DELETE', ruta);
  }

  private async peticion<T>(
    metodo: 'GET' | 'POST' | 'PATCH' | 'DELETE',
    ruta: string,
    cuerpo?: unknown,
    parametros?: ParametrosApi,
  ): Promise<T> {
    let params = new HttpParams();

    for (const [clave, valor] of Object.entries(parametros ?? {})) {
      if (valor !== null && valor !== undefined) {
        params = params.set(clave, String(valor));
      }
    }

    try {
      return await firstValueFrom(
        this.http.request<T>(metodo, `${this.base}${ruta.replace(/^\/+/, '')}`, {
          body: cuerpo,
          params,
          withCredentials: true,
        }),
      );
    } catch (fallo) {
      throw aApiError(fallo);
    }
  }
}

/** Traduce un fallo de `HttpClient` sin filtrar detalles internos a la interfaz. */
export function aApiError(fallo: unknown): ApiError {
  if (!(fallo instanceof HttpErrorResponse)) {
    return new ApiError('interno', 'No se pudo completar la petición.', 0);
  }

  if (fallo.status === 0) {
    return new ApiError(
      'sin_conexion',
      'No se pudo conectar con el servidor. Comprueba tu conexión.',
      0,
    );
  }

  const codigo = leerCodigo(fallo.error);
  const mensaje =
    leerMensaje(fallo.error) ??
    (fallo.status === 401 ? 'Inicia sesión para continuar.' : 'No se pudo completar la petición.');

  return new ApiError(codigo, mensaje, fallo.status);
}

function leerCodigo(cuerpo: unknown): string {
  return leerError(cuerpo)?.codigo ?? 'interno';
}

function leerMensaje(cuerpo: unknown): string | null {
  return leerError(cuerpo)?.mensaje ?? null;
}

function leerError(cuerpo: unknown): { codigo: string; mensaje: string } | null {
  if (typeof cuerpo !== 'object' || cuerpo === null) {
    return null;
  }

  const error = (cuerpo as Record<string, unknown>)['error'];

  if (typeof error !== 'object' || error === null) {
    return null;
  }

  const registro = error as Record<string, unknown>;
  const codigo = registro['codigo'];
  const mensaje = registro['mensaje'];

  if (typeof codigo !== 'string' || typeof mensaje !== 'string') {
    return null;
  }

  return { codigo, mensaje };
}
