import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Skeleton } from './skeleton';

@Component({
  imports: [Skeleton],
  template: `<app-skeleton [lineas]="3" anchoUltima="60%" />`,
})
class Host {}

describe('Skeleton', () => {
  it('dibuja una línea por cada línea pedida', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.bloque').length).toBe(3);
  });

  it('se oculta a los lectores de pantalla: la carga la anuncia el contenedor', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const esqueleto = fixture.nativeElement.querySelector('app-skeleton') as HTMLElement;

    expect(esqueleto.getAttribute('aria-hidden')).toBe('true');
  });

  it('acorta la última línea para que parezca texto y no una caja', () => {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const bloques: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.bloque') as NodeListOf<HTMLElement>,
    );

    expect(bloques[0]!.style.width).toBe('100%');
    expect(bloques[2]!.style.width).toBe('60%');
  });
});
