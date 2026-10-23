import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import type { Usuario } from './auth.model';

const USUARIO: Usuario = {
  id: '0198f3f4-0000-7000-8000-000000000001',
  nombre: 'Marta Ruiz',
  email: 'marta@example.com',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('AuthService', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  /** Crea el servicio y resuelve la comprobación inicial con la respuesta indicada. */
  async function crear(estadoInicial: 'sin-sesion' | 'con-sesion' = 'sin-sesion') {
    const servicio = TestBed.inject(AuthService);
    const inicial = http.expectOne('/api/v1/me');

    if (estadoInicial === 'con-sesion') {
      inicial.flush(USUARIO);
    } else {
      inicial.flush(
        { error: { codigo: 'no_autenticado', mensaje: 'Inicia sesión para continuar.' } },
        { status: 401, statusText: 'Unauthorized' },
      );
    }

    await servicio.listo;

    return servicio;
  }

  it('recupera la cuenta desde /me cuando la cookie sigue viva', async () => {
    const servicio = await crear('con-sesion');

    expect(servicio.haySesion()).toBe(true);
    expect(servicio.usuario()).toEqual(USUARIO);
    expect(servicio.cargando()).toBe(false);
    expect(servicio.error()).toBeNull();
  });

  it('un 401 inicial significa “sin sesión”, no un error visible', async () => {
    const servicio = await crear();

    expect(servicio.haySesion()).toBe(false);
    expect(servicio.usuario()).toBeNull();
    expect(servicio.error()).toBeNull();
    expect(servicio.cargando()).toBe(false);
  });

  it('entra con email y contraseña y guarda la cuenta', async () => {
    const servicio = await crear();

    const acceso = servicio.entrar(' marta@example.com ', 'secreto-largo');
    const peticion = http.expectOne('/api/v1/auth/login');

    expect(peticion.request.method).toBe('POST');
    expect(peticion.request.body).toEqual({
      email: 'marta@example.com',
      password: 'secreto-largo',
    });
    peticion.flush(USUARIO);

    await expect(acceso).resolves.toEqual(USUARIO);
    expect(servicio.usuario()).toEqual(USUARIO);
  });

  it('registra una cuenta nueva y la deja autenticada', async () => {
    const servicio = await crear();

    const registro = servicio.registrar(' Marta Ruiz ', 'marta@example.com', 'secreto-largo');
    const peticion = http.expectOne('/api/v1/auth/register');

    expect(peticion.request.body).toEqual({
      nombre: 'Marta Ruiz',
      email: 'marta@example.com',
      password: 'secreto-largo',
    });
    peticion.flush(USUARIO);

    await expect(registro).resolves.toEqual(USUARIO);
    expect(servicio.usuario()).toEqual(USUARIO);
  });

  it('expone el mensaje de la API si las credenciales fallan', async () => {
    const servicio = await crear();

    const acceso = servicio.entrar('marta@example.com', 'incorrecta');
    const peticion = http.expectOne('/api/v1/auth/login');

    peticion.flush(
      {
        error: {
          codigo: 'credenciales_invalidas',
          mensaje: 'El email o la contraseña no son correctos.',
        },
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(acceso).rejects.toThrow('El email o la contraseña no son correctos.');
    expect(servicio.error()).toBe('El email o la contraseña no son correctos.');
    expect(servicio.haySesion()).toBe(false);
  });

  it('cierra la sesión local aunque el servidor no responda', async () => {
    const servicio = await crear('con-sesion');

    const salida = servicio.salir();
    const peticion = http.expectOne('/api/v1/auth/logout');

    expect(peticion.request.method).toBe('POST');
    peticion.flush(null, { status: 500, statusText: 'Server Error' });

    await expect(salida).resolves.toBeUndefined();
    expect(servicio.usuario()).toBeNull();
  });
});
