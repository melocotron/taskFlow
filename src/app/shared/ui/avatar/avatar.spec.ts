import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Avatar } from './avatar';

@Component({
  imports: [Avatar],
  template: `
    <app-avatar nombre="Marta Ruiz" turno="verde" />
    <app-avatar nombre="Iván" />
  `,
})
class Host {}

describe('Avatar', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const avatares: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('app-avatar') as NodeListOf<HTMLElement>,
    );

    return { avatares };
  }

  it('usa la primera y la última inicial de un nombre completo', () => {
    const { avatares } = montar();

    expect(avatares[0]!.querySelector('.disco')?.textContent?.trim()).toBe('MR');
  });

  it('con una sola palabra usa sus dos primeras letras', () => {
    const { avatares } = montar();

    expect(avatares[1]!.querySelector('.disco')?.textContent?.trim()).toBe('IV');
  });

  it('expone el nombre completo a lectores de pantalla', () => {
    const { avatares } = montar();

    expect(avatares[0]!.querySelector('.visualmente-oculto')?.textContent?.trim()).toBe(
      'Marta Ruiz',
    );
  });

  it('sin turno no finge un color de persona', () => {
    const { avatares } = montar();

    expect(avatares[1]!.classList).toContain('app-avatar--sin-turno');
  });
});
