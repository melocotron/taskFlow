import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Button } from './button';

@Component({
  imports: [Button],
  template: `
    <button appButton variant="primary" [loading]="cargando()" (click)="pulsado = true">
      Guardar tarea
    </button>
  `,
})
class Host {
  readonly cargando = signal(false);
  pulsado = false;
}

describe('Button', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return { fixture, boton: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  it('expone su texto como nombre accesible', () => {
    const { boton } = montar();

    expect(boton.textContent?.trim()).toBe('Guardar tarea');
    expect(boton.getAttribute('aria-label')).toBeNull(); // el texto ya nombra el botón
  });

  it('aplica la clase de la variante pedida', () => {
    const { boton } = montar();

    expect(boton.classList).toContain('app-button--primary');
    expect(boton.classList).not.toContain('app-button--danger');
  });

  it('se deshabilita mientras carga para evitar el doble envío', () => {
    const { fixture, boton } = montar();

    fixture.componentInstance.cargando.set(true);
    fixture.detectChanges();

    expect(boton.disabled).toBe(true);
    expect(boton.getAttribute('aria-busy')).toBe('true');
  });

  it('no propaga el clic cuando está cargando', () => {
    const { fixture, boton } = montar();

    fixture.componentInstance.cargando.set(true);
    fixture.detectChanges();
    boton.click();

    expect(fixture.componentInstance.pulsado).toBe(false);
  });

  it('propaga el clic cuando está disponible', () => {
    const { fixture, boton } = montar();

    boton.click();

    expect(fixture.componentInstance.pulsado).toBe(true);
  });
});
