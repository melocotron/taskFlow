import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { MemberStore, comoMemberId } from '@entities/member';
import { sesionGuard } from './sesion.guard';

describe('sesionGuard', () => {
  function configurar() {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    return TestBed.inject(MemberStore);
  }

  function ejecutar(): boolean | import('@angular/router').UrlTree {
    return TestBed.runInInjectionContext(
      () => sesionGuard({} as never, {} as never) as boolean | import('@angular/router').UrlTree,
    ) as boolean | import('@angular/router').UrlTree;
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('sin sesión elegida redirige a /entrar', () => {
    configurar();

    const resultado = ejecutar();
    const router = TestBed.inject(Router);

    expect(resultado).not.toBe(true);
    expect((resultado as import('@angular/router').UrlTree).toString()).toBe(
      router.createUrlTree(['/entrar']).toString(),
    );
  });

  it('con sesión elegida deja pasar', () => {
    const equipo = configurar();
    equipo.cambiarSesion(comoMemberId('ivan'));

    expect(ejecutar()).toBe(true);
  });

  it('después de salir vuelve a bloquear', () => {
    const equipo = configurar();
    equipo.cambiarSesion(comoMemberId('marta'));
    expect(ejecutar()).toBe(true);

    equipo.salir();

    expect(ejecutar()).not.toBe(true);
  });
});
