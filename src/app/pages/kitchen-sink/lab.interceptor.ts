import { HttpResponse, type HttpInterceptorFn } from '@angular/common/http';
import { delay, of } from 'rxjs';

/** Respuesta simulada del laboratorio; no existe ningún backend real. */
export interface DatosLaboratorio {
  readonly titulo: string;
  readonly tarjetas: number;
}

/**
 * Interceptor exclusivo de /kitchen-sink.
 *
 * El laboratorio demuestra `httpResource` sin abrir una API: la petición se
 * resuelve en memoria y el retardo hace visible el estado de carga.
 */
export const labInterceptor: HttpInterceptorFn = (peticion, siguiente) => {
  if (peticion.url !== '/api/laboratorio') {
    return siguiente(peticion);
  }

  return of(
    new HttpResponse({
      status: 200,
      body: { titulo: 'Producto', tarjetas: 3 } satisfies DatosLaboratorio,
    }),
  ).pipe(delay(250));
};
