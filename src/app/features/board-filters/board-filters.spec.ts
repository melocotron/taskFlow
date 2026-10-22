import { TestBed } from '@angular/core/testing';
import { BoardFilters } from './board-filters';
import type { FiltroTablero } from './filtro';

describe('BoardFilters', () => {
  function montar(filtro: FiltroTablero = { texto: '', persona: '' }) {
    TestBed.configureTestingModule({ imports: [BoardFilters] });

    const fixture = TestBed.createComponent(BoardFilters);
    fixture.componentRef.setInput('filtro', filtro);
    fixture.detectChanges();

    const cambios: FiltroTablero[] = [];
    fixture.componentInstance.cambios.subscribe((nuevo) => cambios.push(nuevo));

    return { fixture, elemento: fixture.nativeElement as HTMLElement, cambios };
  }

  function campoTexto(elemento: HTMLElement): HTMLInputElement {
    return elemento.querySelector('input[type="search"]') as HTMLInputElement;
  }

  function selectorPersona(elemento: HTMLElement): HTMLSelectElement {
    return elemento.querySelector('select') as HTMLSelectElement;
  }

  function botonLimpiar(elemento: HTMLElement): HTMLButtonElement | null {
    const botones = Array.from(elemento.querySelectorAll('button'));

    return botones.find((boton) => boton.textContent?.trim() === 'Quitar filtro') ?? null;
  }

  it('pinta el filtro que recibe, también la persona', () => {
    const { elemento } = montar({ texto: 'copy', persona: 'ivan' });

    expect(campoTexto(elemento).value).toBe('copy');
    expect(selectorPersona(elemento).value).toBe('ivan');
  });

  it('emite el texto al escribir', () => {
    const { fixture, elemento, cambios } = montar();

    const campo = campoTexto(elemento);
    campo.value = 'copy';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(cambios.at(-1)).toEqual({ texto: 'copy', persona: '' });
  });

  it('emite la persona al elegirla', () => {
    const { fixture, elemento, cambios } = montar();

    const selector = selectorPersona(elemento);
    selector.value = 'alba';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cambios.at(-1)).toEqual({ texto: '', persona: 'alba' });
  });

  it('cambiar un lado no borra el otro', () => {
    const { fixture, elemento, cambios } = montar({ texto: 'copy', persona: 'ivan' });

    const selector = selectorPersona(elemento);
    selector.value = 'marta';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cambios.at(-1)).toEqual({ texto: 'copy', persona: 'marta' });
  });

  it('sin filtro no ofrece quitarlo', () => {
    const { elemento } = montar();

    expect(botonLimpiar(elemento)).toBeNull();
  });

  it('con filtro ofrece quitarlo y emite el filtro vacío', () => {
    const { elemento, cambios } = montar({ texto: 'copy', persona: 'ivan' });

    botonLimpiar(elemento)!.click();

    expect(cambios.at(-1)).toEqual({ texto: '', persona: '' });
  });
});
