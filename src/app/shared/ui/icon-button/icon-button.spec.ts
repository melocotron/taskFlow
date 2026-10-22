import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { IconButton } from './icon-button';

@Component({
  imports: [IconButton],
  template: `<button appIconButton label="Cerrar el tablero">✕</button>`,
})
class Host {}

describe('IconButton', () => {
  it('toma su nombre accesible de label, no del icono', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const boton = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(boton.getAttribute('aria-label')).toBe('Cerrar el tablero');
    expect(boton.textContent?.trim()).toBe('✕');
  });
});
