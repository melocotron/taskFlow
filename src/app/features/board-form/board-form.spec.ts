import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoardForm } from './board-form';
import type { DatosTablero } from './board-form';

describe('BoardForm', () => {
  function montar(tituloInicial = '', modo: 'crear' | 'renombrar' = 'crear') {
    TestBed.configureTestingModule({ imports: [BoardForm] });

    const fixture = TestBed.createComponent(BoardForm);
    fixture.componentRef.setInput('modo', modo);
    fixture.componentRef.setInput('tituloInicial', tituloInicial);
    fixture.detectChanges();

    const guardados: DatosTablero[] = [];
    let cancelados = 0;

    fixture.componentInstance.guardado.subscribe((datos) => guardados.push(datos));
    fixture.componentInstance.cancelado.subscribe(() => cancelados++);

    return {
      fixture,
      elemento: fixture.nativeElement as HTMLElement,
      guardados,
      cancelados: () => cancelados,
    };
  }

  function campo(elemento: HTMLElement): HTMLInputElement {
    return elemento.querySelector('input') as HTMLInputElement;
  }

  function escribir(fixture: ComponentFixture<BoardForm>, valor: string): void {
    const input = campo(fixture.nativeElement as HTMLElement);
    input.value = valor;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  async function enviar(fixture: ComponentFixture<BoardForm>, elemento: HTMLElement) {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function errores(elemento: HTMLElement): string[] {
    return Array.from(elemento.querySelectorAll('[role="alert"]')).map(
      (nodo) => nodo.textContent?.trim() ?? '',
    );
  }

  it('no guarda sin nombre y lo explica bajo el campo', async () => {
    const { fixture, elemento, guardados } = montar();

    await enviar(fixture, elemento);

    expect(guardados).toEqual([]);
    expect(errores(elemento)).toContain('Ponle un nombre al tablero');
  });

  it('rechaza un nombre hecho solo de espacios', async () => {
    const { fixture, elemento, guardados } = montar();

    escribir(fixture, '    ');
    await enviar(fixture, elemento);

    expect(guardados).toEqual([]);
    expect(errores(elemento)).toContain('El nombre no puede quedarse en blanco');
  });

  it('entrega el nombre recortado', async () => {
    const { fixture, elemento, guardados } = montar();

    escribir(fixture, '  Producto  ');
    await enviar(fixture, elemento);

    expect(guardados).toEqual([{ titulo: 'Producto' }]);
  });

  it('al renombrar arranca con el nombre actual', () => {
    const { elemento } = montar('Producto', 'renombrar');

    expect(campo(elemento).value).toBe('Producto');
  });

  it('al renombrar avisa de que las tarjetas no se mueven', () => {
    const { elemento } = montar('Producto', 'renombrar');

    expect(elemento.textContent).toContain('Las tarjetas se quedan donde están');
    expect(elemento.textContent).toContain('Guardar nombre');
  });

  it('al crear habla de crear, no de renombrar', () => {
    const { elemento } = montar();

    expect(elemento.textContent).toContain('Crear tablero');
    expect(elemento.textContent).toContain('Con este nombre lo verá todo el equipo');
  });

  it('cancelar avisa y no guarda nada', () => {
    const { elemento, guardados, cancelados } = montar();

    const cancelar = Array.from(elemento.querySelectorAll('button')).find(
      (boton) => boton.textContent?.trim() === 'Cancelar',
    );
    cancelar!.click();

    expect(cancelados()).toBe(1);
    expect(guardados).toEqual([]);
  });
});
