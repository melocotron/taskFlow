import { Injectable, computed, inject, signal } from '@angular/core';
import { ApiClient, ApiError } from '@shared/api';
import type { Usuario } from '../model/auth.model';

/**
 * Sesión real contra la API.
 *
 * La fuente de verdad es la cookie `HttpOnly`: JavaScript no puede leerla ni
 * robarla. Al arrancar se pregunta `GET /me`; si no hay sesión, la API responde
 * `401` y la aplicación muestra el acceso. Las operaciones de login y registro
 * crean la cookie en la respuesta y actualizan el usuario en memoria.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);

  private readonly usuarioInterno = signal<Usuario | null>(null);
  private readonly cargandoInterno = signal(true);
  private readonly falloInterno = signal<string | null>(null);

  readonly usuario = this.usuarioInterno.asReadonly();
  readonly cargando = this.cargandoInterno.asReadonly();
  readonly error = this.falloInterno.asReadonly();
  readonly haySesion = computed(() => this.usuarioInterno() !== null);

  /** Se resuelve cuando termina la comprobación inicial de sesión. */
  readonly listo: Promise<void>;

  constructor() {
    this.listo = this.recuperarSesion();
  }

  async entrar(email: string, password: string): Promise<Usuario> {
    return this.guardarSesion(
      this.api.post<Usuario>('auth/login', { email: email.trim(), password }),
    );
  }

  async registrar(nombre: string, email: string, password: string): Promise<Usuario> {
    return this.guardarSesion(
      this.api.post<Usuario>('auth/register', {
        nombre: nombre.trim(),
        email: email.trim(),
        password,
      }),
    );
  }

  async salir(): Promise<void> {
    try {
      await this.api.post<void>('auth/logout', {});
    } catch {
      /*
       * Si el servidor no responde, la sesión local se cierra igual: la cookie puede
       * quedar en el navegador, pero la interfaz no se queda mostrando datos privados.
       * El próximo arranque volverá a preguntar a `/me`.
       */
    } finally {
      this.usuarioInterno.set(null);
      this.falloInterno.set(null);
    }
  }

  limpiarError(): void {
    this.falloInterno.set(null);
  }

  private async recuperarSesion(): Promise<void> {
    this.cargandoInterno.set(true);

    try {
      this.usuarioInterno.set(await this.api.get<Usuario>('me'));
    } catch (fallo) {
      if (!(fallo instanceof ApiError) || fallo.estado !== 401) {
        this.falloInterno.set(
          fallo instanceof Error ? fallo.message : 'No se pudo comprobar la sesión',
        );
      }
    } finally {
      this.cargandoInterno.set(false);
    }
  }

  private async guardarSesion(peticion: Promise<Usuario>): Promise<Usuario> {
    this.falloInterno.set(null);

    try {
      const usuario = await peticion;
      this.usuarioInterno.set(usuario);
      return usuario;
    } catch (fallo) {
      this.falloInterno.set(
        fallo instanceof Error ? fallo.message : 'No se pudo completar el acceso',
      );
      throw fallo;
    }
  }
}
