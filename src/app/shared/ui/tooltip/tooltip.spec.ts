import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Tooltip } from './tooltip';

@Component({
  imports: [Tooltip],
  template: `<button type="button" [appTooltip]="'Eliminar la tarea'">🗑</button>`,
})
class Host {}

describe('Tooltip', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    return { fixture, boton };
  }

  it('relaciona el botón con el texto mediante aria-describedby', () => {
    const { boton } = montar();
    const id = boton.getAttribute('aria-describedby');

    expect(id).toBeTruthy();
    expect(boton.querySelector(`#${id}`)).not.toBeNull();
  });

  it('aparece al enfocar con el teclado, no solo con el ratón', () => {
    const { boton } = montar();

    boton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));

    const burbuja = boton.querySelector('.app-tooltip') as HTMLElement;

    expect(burbuja.getAttribute('data-visible')).toBe('true');
    expect(burbuja.textContent).toBe('Eliminar la tarea');
  });

  it('se oculta al salir y con Escape', () => {
    const { boton } = montar();
    const burbuja = boton.querySelector('.app-tooltip') as HTMLElement;

    boton.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    boton.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(burbuja.getAttribute('data-visible')).toBe('false');

    boton.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(burbuja.getAttribute('data-visible')).toBe('false');
  });
});
