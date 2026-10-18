import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <app-empty-state titulo="Aún no hay tareas" descripcion="Crea la primera y empezad.">
      <button type="button">Añadir tarea</button>
    </app-empty-state>
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

  it('explica qué no hay con un encabezado real', () => {
    const elemento = montar();

    expect(elemento.querySelector('h3')?.textContent?.trim()).toBe('Aún no hay tareas');
  });

  it('ofrece una salida: proyecta la acción', () => {
    const elemento = montar();

    expect(elemento.querySelector('.acciones button')).not.toBeNull();
  });
});
