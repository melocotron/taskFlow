import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Menu } from './menu';
import { MenuItem } from './menu-item';

@Component({
  imports: [CdkMenuTrigger, Menu, MenuItem],
  template: `
    <button type="button" [cdkMenuTriggerFor]="acciones">Acciones</button>

    <ng-template #acciones>
      <app-menu>
        <button appMenuItem (click)="elegir('Renombrar tablero')">Renombrar tablero</button>
        <button appMenuItem (click)="elegir('Archivar tablero')">Archivar tablero</button>
      </app-menu>
    </ng-template>
  `,
})
class Host {
  readonly elegidas = signal<readonly string[]>([]);

  elegir(accion: string): void {
    this.elegidas.update((elegidas) => [...elegidas, accion]);
  }
}

describe('Menu', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    return fixture;
  }

  function abrir(fixture: ReturnType<typeof montar>) {
    const disparador = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    disparador.click();
    fixture.detectChanges();

    return document.querySelector('[role="menu"]') as HTMLElement | null;
  }

  it('se anuncia como menú al abrirse', () => {
    expect(abrir(montar())).not.toBeNull();
  });

  it('cada acción es un botón con rol menuitem, navegable con teclado', () => {
    const menu = abrir(montar());
    const items = menu!.querySelectorAll('[role="menuitem"]');

    expect(items.length).toBe(2);
    expect((items[0] as HTMLElement).tagName).toBe('BUTTON');
  });

  it('proyecta el texto de cada acción', () => {
    expect(abrir(montar())!.textContent).toContain('Renombrar tablero');
  });

  /*
   * El menú se cierra al pulsar, y eso destruye la vista del overlay. Si la escucha del
   * clic vive por encima del botón, se va con la vista y la acción no se ejecuta nunca:
   * esta prueba es la que vigila que eso no vuelva a pasar.
   */
  it('ejecuta la acción de la opción pulsada', () => {
    const fixture = montar();
    abrir(fixture);

    const opcion = document.querySelector('[role="menuitem"]') as HTMLButtonElement;
    opcion.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.elegidas()).toEqual(['Renombrar tablero']);
  });
});
