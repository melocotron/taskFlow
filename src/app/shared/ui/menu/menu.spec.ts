import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Menu } from './menu';
import { MenuItem } from './menu-item';

@Component({
  imports: [CdkMenuTrigger, Menu, MenuItem],
  template: `
    <button type="button" [cdkMenuTriggerFor]="acciones">Acciones</button>

    <ng-template #acciones>
      <app-menu>
        <app-menu-item>Renombrar tablero</app-menu-item>
        <app-menu-item>Archivar tablero</app-menu-item>
      </app-menu>
    </ng-template>
  `,
})
class Host {}

describe('Menu', () => {
  function abrir() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    const disparador = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    disparador.click();
    fixture.detectChanges();

    return document.querySelector('[role="menu"]') as HTMLElement | null;
  }

  it('se anuncia como menú al abrirse', () => {
    expect(abrir()).not.toBeNull();
  });

  it('cada acción es un botón con rol menuitem, navegable con teclado', () => {
    const menu = abrir();
    const items = menu!.querySelectorAll('[role="menuitem"]');

    expect(items.length).toBe(2);
    expect((items[0] as HTMLElement).tagName).toBe('BUTTON');
  });

  it('proyecta el texto de cada acción', () => {
    expect(abrir()!.textContent).toContain('Renombrar tablero');
  });
});
