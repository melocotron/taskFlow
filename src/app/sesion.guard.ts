import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '@entities/auth';

/**
 * Protege las rutas de producto.
 *
 * Espera a que `AuthService` termine de preguntar por la cookie de sesión. Sin sesión
 * redirige a `/entrar`. Ojo: esto **no** es autorización. Un guard decide si se puede
 * *llegar* a una pantalla; que se pueda *hacer* algo lo decide el servidor (y, para la
 * interfaz, `puede(rol, accion)`), aunque se oculte el botón.
 */
export const sesionGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.listo;

  return auth.haySesion() ? true : router.createUrlTree(['/entrar']);
};

/**
 * Evita que una cuenta ya autenticada vuelva a la pantalla de acceso.
 *
 * Si la cookie sigue viva, entrar a `/entrar` no tiene sentido: se vuelve al inicio.
 */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  await auth.listo;

  return auth.haySesion() ? router.createUrlTree(['/']) : true;
};
