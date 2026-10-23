import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AuthService } from '@entities/auth';
import type { Usuario } from '@entities/auth';
import EntrarPage from './entrar';

const USUARIO: Usuario = {
  id: '0198f3f4-0000-7000-8000-000000000001',
  nombre: 'Marta Ruiz',
  email: 'marta@example.com',
  creadoEn: '2026-01-01T00:00:00Z',
};

describe('EntrarPage', () => {
  function montar(opciones: { fallo?: Error } = {}) {
    const llamadas: unknown[] = [];
    const navegaciones: string[] = [];

    const auth = {
      entrar: async (email: string, password: string) => {
        llamadas.push({ tipo: 'entrar', email, password });

        if (opciones.fallo) {
          throw opciones.fallo;
        }

        return USUARIO;
      },
      registrar: async (nombre: string, email: string, password: string) => {
        llamadas.push({ tipo: 'registrar', nombre, email, password });

        if (opciones.fallo) {
          throw opciones.fallo;
        }

        return USUARIO;
      },
      limpiarError: () => undefined,
    };

    TestBed.configureTestingModule({
      imports: [EntrarPage],
      providers: [
        { provide: AuthService, useValue: auth },
        {
          provide: Router,
          useValue: {
            navigateByUrl: async (url: string) => {
              navegaciones.push(url);
              return true;
            },
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(EntrarPage);
    fixture.detectChanges();

    return {
      fixture,
      llamadas,
      navegaciones,
      elemento: fixture.nativeElement as HTMLElement,
    };
  }

  function escribir(campo: HTMLInputElement, texto: string): void {
    campo.value = texto;
    campo.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function enviar(elemento: HTMLElement): void {
    elemento.querySelector('form')?.dispatchEvent(new Event('submit', { cancelable: true }));
  }

  it('abre en modo login y pide email y contraseña', () => {
    const { elemento } = montar();

    expect(elemento.querySelector('h1')?.textContent).toContain('Entra en TaskFlow');
    expect(elemento.querySelector('input[type="email"]')).toBeTruthy();
    expect(elemento.querySelector('input[type="password"]')).toBeTruthy();
    expect(elemento.textContent).not.toContain('Nombre');
  });

  it('envía las credenciales y navega al producto', async () => {
    const { fixture, elemento, llamadas, navegaciones } = montar();

    escribir(
      elemento.querySelector('input[type="email"]') as HTMLInputElement,
      'marta@example.com',
    );
    escribir(elemento.querySelector('input[type="password"]') as HTMLInputElement, 'secreto-largo');
    fixture.detectChanges();
    enviar(elemento);

    await fixture.whenStable();

    expect(llamadas).toEqual([
      { tipo: 'entrar', email: 'marta@example.com', password: 'secreto-largo' },
    ]);
    expect(navegaciones).toEqual(['/']);
  });

  it('cambia a registro y crea la cuenta con nombre, email y contraseña', async () => {
    const { fixture, elemento, llamadas } = montar();

    const crear = Array.from(elemento.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Crear cuenta'),
    );
    crear?.click();
    fixture.detectChanges();

    escribir(
      elemento.querySelector('input[autocomplete="name"]') as HTMLInputElement,
      'Marta Ruiz',
    );
    escribir(
      elemento.querySelector('input[type="email"]') as HTMLInputElement,
      'marta@example.com',
    );
    escribir(elemento.querySelector('input[type="password"]') as HTMLInputElement, 'secreto-largo');
    fixture.detectChanges();
    enviar(elemento);

    await fixture.whenStable();

    expect(llamadas).toEqual([
      {
        tipo: 'registrar',
        nombre: 'Marta Ruiz',
        email: 'marta@example.com',
        password: 'secreto-largo',
      },
    ]);
  });

  it('no registra sin nombre y lo explica en el campo', async () => {
    const { fixture, elemento, llamadas } = montar();

    const crear = Array.from(elemento.querySelectorAll('button')).find((boton) =>
      boton.textContent?.includes('Crear cuenta'),
    );
    crear?.click();
    fixture.detectChanges();

    escribir(
      elemento.querySelector('input[type="email"]') as HTMLInputElement,
      'marta@example.com',
    );
    escribir(elemento.querySelector('input[type="password"]') as HTMLInputElement, 'secreto-largo');
    fixture.detectChanges();
    enviar(elemento);

    await fixture.whenStable();

    expect(llamadas).toEqual([]);
    expect(elemento.textContent).toContain('Escribe tu nombre');
  });

  it('muestra el error de la API sin salir de la pantalla', async () => {
    const { fixture, elemento, navegaciones } = montar({
      fallo: new Error('El email o la contraseña no son correctos.'),
    });

    escribir(
      elemento.querySelector('input[type="email"]') as HTMLInputElement,
      'marta@example.com',
    );
    escribir(elemento.querySelector('input[type="password"]') as HTMLInputElement, 'secreto-largo');
    fixture.detectChanges();
    enviar(elemento);

    await fixture.whenStable();

    expect(elemento.querySelector('[role="alert"]')?.textContent).toContain(
      'El email o la contraseña no son correctos.',
    );
    expect(navegaciones).toEqual([]);
  });
});
