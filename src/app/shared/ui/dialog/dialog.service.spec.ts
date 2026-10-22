import { Component, TemplateRef, ViewChild, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DialogService } from './dialog.service';

@Component({
  template: `
    <button type="button" (click)="abrir()">Renombrar tablero</button>
    <ng-template #plantilla>
      <p>El nombre lo decide el equipo.</p>
      <input aria-label="Nombre del tablero" />
    </ng-template>
  `,
})
class Host {
  private readonly dialogos = inject(DialogService);

  @ViewChild('plantilla', { static: true })
  plantilla!: TemplateRef<unknown>;

  abrir(): void {
    this.dialogos.abrir('Renombrar tablero', this.plantilla);
  }
}

describe('DialogService', () => {
  function montar() {
    TestBed.configureTestingModule({ imports: [Host] });
    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();

    return { fixture, boton: fixture.nativeElement.querySelector('button') as HTMLButtonElement };
  }

  it('abre un diálogo con nombre accesible y el contenido proyectado', () => {
    const { fixture } = montar();

    fixture.componentInstance.abrir();
    fixture.detectChanges();

    const dialogo = document.querySelector('[role="dialog"]') as HTMLElement;

    expect(dialogo).not.toBeNull();
    expect(dialogo.getAttribute('aria-label')).toBe('Renombrar tablero');
    expect(dialogo.textContent).toContain('El nombre lo decide el equipo.');
  });

  it('se cierra y devuelve el foco a quien lo abrió', () => {
    const { fixture, boton } = montar();

    boton.focus();
    expect(document.activeElement).toBe(boton);

    fixture.componentInstance.abrir();
    fixture.detectChanges();

    const dialogo = document.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialogo).not.toBeNull();

    // Cerrar con el botón de la cabecera, como haría cualquiera.
    const cerrar = document.querySelector(
      'button[aria-label="Cerrar el diálogo"]',
    ) as HTMLButtonElement;
    cerrar.click();
    fixture.detectChanges();

    expect(document.querySelector('[role="dialog"]')).toBeNull();
    expect(document.activeElement).toBe(boton);
  });
});
