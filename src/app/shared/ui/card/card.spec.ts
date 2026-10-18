import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Card } from './card';

@Component({
  imports: [Card],
  template: `
    <app-card turno="verde" persona="Marta">Revisar el copy</app-card>
    <app-card>Documentar estados vacíos</app-card>
  `,
})
class Host {}

describe('Card', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const tarjetas: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('app-card') as NodeListOf<HTMLElement>,
    );

    return { fixture, tarjetas };
  }

  it('muestra la lengüeta con el color de la persona', () => {
    const { tarjetas } = montar();
    const lengueta = tarjetas[0]!.querySelector('.lengueta') as HTMLElement;

    expect(lengueta).not.toBeNull();
    expect(lengueta.style.backgroundColor).toContain('--turno-verde');
    expect(lengueta.getAttribute('aria-hidden')).toBe('true');
  });

  it('acompaña el color con el nombre, para no depender solo del color', () => {
    const { tarjetas } = montar();
    const texto = tarjetas[0]!.querySelector('.visualmente-oculto');

    expect(texto?.textContent).toContain('Marta');
  });

  it('sin turno no hay lengüeta: la ausencia es información', () => {
    const { tarjetas } = montar();

    expect(tarjetas[1]!.querySelector('.lengueta')).toBeNull();
    expect(tarjetas[1]!.classList).not.toContain('app-card--con-turno');
  });

  it('proyecta el contenido de la tarjeta', () => {
    const { tarjetas } = montar();

    expect(tarjetas[0]!.textContent).toContain('Revisar el copy');
  });
});
