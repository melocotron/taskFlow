import { TestBed } from '@angular/core/testing';
import KitchenSinkPage from './kitchen-sink';

describe('KitchenSinkPage', () => {
  it('muestra una ficha por cada color primitivo y de turno', async () => {
    await TestBed.configureTestingModule({ imports: [KitchenSinkPage] }).compileComponents();

    const fixture = TestBed.createComponent(KitchenSinkPage);
    fixture.detectChanges();

    const fichas: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ficha');

    // 12 primitivos + 5 colores de turno
    expect(fichas.length).toBe(17);
  });

  it('muestra la lengüeta de turno como elemento firma', async () => {
    await TestBed.configureTestingModule({ imports: [KitchenSinkPage] }).compileComponents();

    const fixture = TestBed.createComponent(KitchenSinkPage);
    fixture.detectChanges();

    const lengueta: HTMLElement | null = fixture.nativeElement.querySelector('.lengueta');

    expect(lengueta).toBeTruthy();
    expect(lengueta?.getAttribute('style')).toContain('var(--turno-verde)');
  });

  it('degrada a — cuando la custom property no está definida', async () => {
    await TestBed.configureTestingModule({ imports: [KitchenSinkPage] }).compileComponents();

    const fixture = TestBed.createComponent(KitchenSinkPage);
    fixture.detectChanges();

    // En el entorno de test no hay custom properties aplicadas al documento,
    // así que la página debe degradar a '—' y no a undefined.
    const valores: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.ficha-valor');

    expect(valores[0]?.textContent?.trim()).toBe('—');
  });
});
