import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormField } from './form-field';
import { TextInput } from '../text-input/text-input';

@Component({
  imports: [FormField, TextInput],
  template: `
    <app-field label="Título de la tarea" hint="Máximo 80 caracteres." [error]="error()">
      <input appInput type="text" />
    </app-field>
  `,
})
class Host {
  readonly error = signal('');
}

describe('FormField + TextInput', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const elemento: HTMLElement = fixture.nativeElement;

    return {
      fixture,
      etiqueta: elemento.querySelector('label') as HTMLLabelElement,
      campo: elemento.querySelector('input') as HTMLInputElement,
      mensaje: elemento.querySelector('.mensaje') as HTMLElement | null,
    };
  }

  it('vincula la etiqueta con el control sin que el consumidor repita ids', () => {
    const { etiqueta, campo } = montar();

    expect(campo.id).toBeTruthy();
    expect(etiqueta.getAttribute('for')).toBe(campo.id);
  });

  it('anuncia el texto de ayuda como descripción del control', () => {
    const { campo, mensaje } = montar();

    expect(mensaje).not.toBeNull();
    expect(campo.getAttribute('aria-describedby')).toBe(mensaje?.id);
    expect(mensaje?.textContent).toContain('Máximo 80 caracteres.');
  });

  it('marca el control como inválido y describe el error cuando hay error', () => {
    const { fixture, campo, mensaje } = montar();

    fixture.componentInstance.error.set('Elige a alguien del equipo.');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('.mensaje--error') as HTMLElement;

    expect(campo.getAttribute('aria-invalid')).toBe('true');
    expect(campo.classList).toContain('app-input--invalid');
    expect(campo.getAttribute('aria-describedby')).toBe(error.id);
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.textContent).toContain('Elige a alguien del equipo.');
    expect(mensaje).not.toBeNull();
  });

  it('oculta la ayuda cuando hay error, para no dar dos mensajes contradictorios', () => {
    const { fixture } = montar();

    fixture.componentInstance.error.set('Campo obligatorio.');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.mensaje').length).toBe(1);
  });

  it('deja de marcar inválido cuando el error desaparece', () => {
    const { fixture, campo } = montar();

    fixture.componentInstance.error.set('Campo obligatorio.');
    fixture.detectChanges();
    fixture.componentInstance.error.set('');
    fixture.detectChanges();

    expect(campo.getAttribute('aria-invalid')).toBeNull();
  });
});
