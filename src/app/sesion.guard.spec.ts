import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from '@entities/auth';
import { invitadoGuard, sesionGuard } from './sesion.guard';

describe('guards de sesión', () => {
  let conSesion = false;

  function configurar() {
    const auth = {
      listo: Promise.resolve(),
      haySesion: () => conSesion,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
    });
  }

  async function ejecutar(
    guard: typeof sesionGuard,
  ): Promise<boolean | import('@angular/router').UrlTree> {
    return TestBed.runInInjectionContext(
      () => guard({} as never, {} as never) as ReturnType<typeof guard>,
    ) as Promise<boolean | import('@angular/router').UrlTree>;
  }

  beforeEach(() => {
    conSesion = false;
  });

  it('sin sesión redirige a /entrar', async () => {
    configurar();

    const resultado = await ejecutar(sesionGuard);
    const router = TestBed.inject(Router);

    expect(resultado).not.toBe(true);
    expect((resultado as import('@angular/router').UrlTree).toString()).toBe(
      router.createUrlTree(['/entrar']).toString(),
    );
  });

  it('con sesión deja pasar', async () => {
    configurar();
    conSesion = true;

    await expect(ejecutar(sesionGuard)).resolves.toBe(true);
  });

  it('el guard de invitado saca de /entrar si ya hay sesión', async () => {
    configurar();
    conSesion = true;

    const resultado = await ejecutar(invitadoGuard);
    const router = TestBed.inject(Router);

    expect((resultado as import('@angular/router').UrlTree).toString()).toBe(
      router.createUrlTree(['/']).toString(),
    );
  });

  it('el guard de invitado deja entrar sin sesión', async () => {
    configurar();

    await expect(ejecutar(invitadoGuard)).resolves.toBe(true);
  });
});
