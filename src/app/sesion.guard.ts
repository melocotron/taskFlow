import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MemberStore } from '@entities/member';

/**
 * Protege las rutas de producto.
 *
 * Sin sesión elegida, redirige a `/entrar`. Ojo: esto **no** es autorización. Un guard
 * decide si se puede *llegar* a una pantalla; que se pueda *hacer* algo lo decide el
 * dominio (`puede(rol, accion)`), y se comprueba en el store aunque la interfaz oculte
 * el botón.
 */
export const sesionGuard: CanActivateFn = () => {
  const miembros = inject(MemberStore);

  if (miembros.haySesion()) {
    return true;
  }

  return inject(Router).createUrlTree(['/entrar']);
};
