import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state titulo="Aún no hay tareas" descripcion="Crea la primera y empezad.">
      <button type="button">Añadir tarea</button>
    </app-empty-state>
    <app-empty-state [nivel]="1" titulo="No tienes acceso" />
  `,
})
class Host {}

describe('EmptyState', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('explica qué no hay con un encabezado de sección', () => {
    const elemento = montar();

    expect(elemento.querySelector('h2')?.textContent?.trim()).toBe('Aún no hay tareas');
  });

  it('puede ser el encabezado principal de la página', () => {
    const elemento = montar();

    expect(elemento.querySelector('h1')?.textContent?.trim()).toBe('No tienes acceso');
  });

  it('ofrece una salida: proyecta la acción', () => {
    const elemento = montar();

    expect(elemento.querySelector('.acciones button')).not.toBeNull();
  });
});
