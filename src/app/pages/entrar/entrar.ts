import { Component, computed, inject, signal } from '@angular/core';
import {
  FormField as EnlaceDeCampo,
  FormRoot,
  email,
  form,
  maxLength,
  minLength,
  required,
  validate,
} from '@angular/forms/signals';
import type { ReadonlyFieldState } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '@entities/auth';
import { Button, Card, FormField, TextInput } from '@shared/ui';

type Modo = 'entrar' | 'registrar';

interface ModeloAcceso {
  nombre: string;
  email: string;
  password: string;
}

const MAX_NOMBRE = 120;
const MIN_PASSWORD = 8;
const MAX_PASSWORD = 200;

/**
 * Acceso real: login y registro en la misma pantalla.
 *
 * La cookie de sesión la crea Go; aquí solo se envían las credenciales y se muestra
 * el error que devuelve la API. Al terminar, el guard deja pasar al producto.
 */
@Component({
  selector: 'app-entrar',
  imports: [Button, Card, EnlaceDeCampo, FormField, FormRoot, TextInput],
  templateUrl: './entrar.html',
  styleUrl: './entrar.css',
})
export default class EntrarPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly modo = signal<Modo>('entrar');
  protected readonly procesando = signal(false);
  protected readonly errorGeneral = signal('');
  private readonly errorNombre = signal('');

  private readonly modelo = signal<ModeloAcceso>({
    nombre: '',
    email: '',
    password: '',
  });

  protected readonly formulario = form(
    this.modelo,
    (acceso) => {
      validate(acceso.nombre, ({ value }) => {
        if (this.modo() !== 'registrar') {
          return null;
        }

        return value().trim().length === 0
          ? { kind: 'nombreRequerido', message: 'Escribe tu nombre' }
          : null;
      });

      maxLength(acceso.nombre, MAX_NOMBRE, {
        message: `El nombre no puede pasar de ${MAX_NOMBRE} caracteres`,
      });

      required(acceso.email, { message: 'Escribe tu email' });
      email(acceso.email, { message: 'El email no tiene un formato válido' });
      maxLength(acceso.email, 254, { message: 'El email es demasiado largo' });

      required(acceso.password, { message: 'Escribe tu contraseña' });
      minLength(acceso.password, MIN_PASSWORD, {
        message: `La contraseña debe tener al menos ${MIN_PASSWORD} caracteres`,
      });
      maxLength(acceso.password, MAX_PASSWORD, {
        message: 'La contraseña es demasiado larga',
      });
    },
    {
      submission: {
        action: async () => {
          await this.enviar();
        },
      },
    },
  );

  protected readonly titulo = computed(() =>
    this.modo() === 'entrar' ? 'Entra en TaskFlow' : 'Crea tu cuenta',
  );

  protected readonly entrando = computed(() => this.modo() === 'entrar');

  protected readonly etiquetaBoton = computed(() =>
    this.modo() === 'entrar' ? 'Entrar' : 'Crear cuenta',
  );

  protected readonly ayudaPassword = computed(() =>
    this.modo() === 'entrar'
      ? 'La contraseña de tu cuenta.'
      : `Al menos ${MIN_PASSWORD} caracteres.`,
  );

  protected readonly errorEmail = computed(() => this.mensaje(this.formulario.email()));
  protected readonly errorPassword = computed(() => this.mensaje(this.formulario.password()));
  protected readonly errorDelNombre = computed(
    () => this.mensaje(this.formulario.nombre()) || this.errorNombre(),
  );

  protected cambiarModo(modo: Modo): void {
    if (this.modo() === modo) {
      return;
    }

    this.modo.set(modo);
    this.errorGeneral.set('');
    this.errorNombre.set('');
    this.auth.limpiarError();
  }

  protected limpiarErrorNombre(): void {
    this.errorNombre.set('');
  }

  private async enviar(): Promise<void> {
    this.errorGeneral.set('');
    this.errorNombre.set('');
    this.auth.limpiarError();

    const datos = this.modelo();

    if (this.modo() === 'registrar' && datos.nombre.trim().length === 0) {
      this.errorNombre.set('Escribe tu nombre');
      return;
    }

    this.procesando.set(true);

    try {
      if (this.modo() === 'entrar') {
        await this.auth.entrar(datos.email, datos.password);
      } else {
        await this.auth.registrar(datos.nombre, datos.email, datos.password);
      }

      await this.router.navigateByUrl('/');
    } catch (fallo) {
      this.errorGeneral.set(
        fallo instanceof Error ? fallo.message : 'No se pudo completar el acceso',
      );
    } finally {
      this.procesando.set(false);
    }
  }

  private mensaje(campo: ReadonlyFieldState<string>): string {
    if (!campo.touched()) {
      return '';
    }

    return campo.errors()[0]?.message ?? '';
  }
}
