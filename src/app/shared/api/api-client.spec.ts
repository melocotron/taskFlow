import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ApiClient, ApiError } from './api-client';

describe('ApiClient', () => {
  let cliente: ApiClient;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    cliente = TestBed.inject(ApiClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('antepone /api/v1 y adjunta la cookie de sesión', async () => {
    const respuesta = cliente.get<readonly string[]>('boards');

    const peticion = http.expectOne('/api/v1/boards');
    expect(peticion.request.method).toBe('GET');
    expect(peticion.request.withCredentials).toBe(true);

    peticion.flush(['uno']);

    await expect(respuesta).resolves.toEqual(['uno']);
  });

  it('serializa solo los parámetros con valor', async () => {
    const respuesta = cliente.get<readonly string[]>('boards', {
      archivados: false,
      vacio: null,
      ausente: undefined,
    });

    const peticion = http.expectOne('/api/v1/boards?archivados=false');
    peticion.flush([]);

    await respuesta;
  });

  it('envía el cuerpo en POST y PATCH', async () => {
    const alta = cliente.post('auth/register', { email: 'marta@example.com' });
    const altaHttp = http.expectOne('/api/v1/auth/register');
    expect(altaHttp.request.body).toEqual({ email: 'marta@example.com' });
    altaHttp.flush({ id: '1' });
    await alta;

    const cambio = cliente.patch('tasks/1', { titulo: 'Nuevo' });
    const cambioHttp = http.expectOne('/api/v1/tasks/1');
    expect(cambioHttp.request.method).toBe('PATCH');
    expect(cambioHttp.request.body).toEqual({ titulo: 'Nuevo' });
    cambioHttp.flush({ id: '1' });
    await cambio;
  });

  it('resuelve DELETE sin cuerpo', async () => {
    const borrado = cliente.delete('tasks/1');

    const peticion = http.expectOne('/api/v1/tasks/1');
    expect(peticion.request.method).toBe('DELETE');
    peticion.flush(null, { status: 204, statusText: 'No Content' });

    await expect(borrado).resolves.toBeUndefined();
  });

  it('convierte el sobre de error de la API en ApiError', async () => {
    const respuesta = cliente.post('auth/login', { email: 'marta@example.com' });

    http.expectOne('/api/v1/auth/login').flush(
      {
        error: {
          codigo: 'credenciales_invalidas',
          mensaje: 'El email o la contraseña no son correctos.',
        },
      },
      { status: 401, statusText: 'Unauthorized' },
    );

    await expect(respuesta).rejects.toBeInstanceOf(ApiError);
    await expect(respuesta).rejects.toMatchObject({
      codigo: 'credenciales_invalidas',
      mensaje: 'El email o la contraseña no son correctos.',
      estado: 401,
    });
  });

  it('explica cuándo no hay conexión con el servidor', async () => {
    const respuesta = cliente.get('boards');

    http.expectOne('/api/v1/boards').error(new ProgressEvent('error'));

    await expect(respuesta).rejects.toMatchObject({
      codigo: 'sin_conexion',
      estado: 0,
    });
  });
});
