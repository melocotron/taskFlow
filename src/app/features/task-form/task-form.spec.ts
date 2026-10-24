import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ALBA, IVAN, MARTA } from '@testing/repositorios';
import { TaskForm } from './task-form';
import type { DatosTarjeta } from './task-form';

describe('TaskForm', () => {
  function montar(inicial: DatosTarjeta | null = null, modo: 'crear' | 'editar' = 'crear') {
    TestBed.configureTestingModule({ imports: [TaskForm] });

    const fixture = TestBed.createComponent(TaskForm);
    fixture.componentRef.setInput('modo', modo);
    fixture.componentRef.setInput('inicial', inicial);
    fixture.componentRef.setInput('miembros', [MARTA, IVAN, ALBA]);
    fixture.detectChanges();

    const guardados: DatosTarjeta[] = [];
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

  function campo(elemento: HTMLElement, etiqueta: string): HTMLElement {
    const label = Array.from(elemento.querySelectorAll('label')).find((nodo) =>
      nodo.textContent?.includes(etiqueta),
    ) as HTMLLabelElement;

    return elemento.querySelector(`#${CSS.escape(label.htmlFor)}`) as HTMLElement;
  }

  function escribir(fixture: ComponentFixture<TaskForm>, control: HTMLElement, valor: string) {
    control.setAttribute('value', valor);

    if (control instanceof HTMLSelectElement) {
      control.value = valor;
      // Un `<select>` real emite `input` al elegir; el formulario escucha ese evento.
      control.dispatchEvent(new Event('input'));
      control.dispatchEvent(new Event('change'));
    } else {
      (control as HTMLInputElement).value = valor;
      control.dispatchEvent(new Event('input'));
    }

    fixture.detectChanges();
  }

  async function enviar(fixture: ComponentFixture<TaskForm>, elemento: HTMLElement) {
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

  it('ata la etiqueta al control y describe el campo con su ayuda', () => {
    const { elemento } = montar();

    const titulo = campo(elemento, 'Título');
    const etiqueta = elemento.querySelector('label[for]') as HTMLLabelElement;

    expect(etiqueta.htmlFor).toBe(titulo.id);
    expect(titulo.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('no deja guardar sin título y lo explica bajo el campo', async () => {
    const { fixture, elemento, guardados } = montar();

    expect(errores(elemento)).toEqual([]);

    await enviar(fixture, elemento);

    expect(guardados).toEqual([]);
    expect(errores(elemento)).toContain('Escribe qué hay que hacer');
  });

  it('rechaza un título hecho solo de espacios', async () => {
    const { fixture, elemento, guardados } = montar();

    escribir(fixture, campo(elemento, 'Título'), '    ');
    await enviar(fixture, elemento);

    expect(guardados).toEqual([]);
    expect(errores(elemento)).toContain('El título no puede quedarse en blanco');
  });

  it('entrega el título recortado y sin responsable', async () => {
    const { fixture, elemento, guardados } = montar();

    escribir(fixture, campo(elemento, 'Título'), '  Revisar el copy  ');
    escribir(fixture, campo(elemento, 'Descripción'), '  Ajustar los tres primeros pasos  ');
    await enviar(fixture, elemento);

    expect(guardados).toEqual([
      {
        titulo: 'Revisar el copy',
        descripcion: 'Ajustar los tres primeros pasos',
        responsableId: null,
      },
    ]);
  });

  it('entrega el identificador de la persona elegida como responsable', async () => {
    const { fixture, elemento, guardados } = montar();

    escribir(fixture, campo(elemento, 'Título'), 'Migrar el buscador');
    escribir(fixture, campo(elemento, 'Responsable'), IVAN.memberId);
    await enviar(fixture, elemento);

    expect(guardados[0]?.responsableId).toBe(IVAN.memberId);
  });

  it('al editar arranca con los valores de la tarjeta', async () => {
    const { fixture, elemento } = montar(
      {
        titulo: 'Cerrar el sprint',
        descripcion: 'Revisar los pendientes',
        responsableId: MARTA.memberId,
      },
      'editar',
    );

    // Las opciones del desplegable se pintan después del control: se espera un turno.
    await fixture.whenStable();

    expect((campo(elemento, 'Título') as HTMLInputElement).value).toBe('Cerrar el sprint');
    expect((campo(elemento, 'Descripción') as HTMLTextAreaElement).value).toBe(
      'Revisar los pendientes',
    );
    expect((campo(elemento, 'Responsable') as HTMLSelectElement).value).toBe(MARTA.memberId);
    expect(fixture.componentInstance.modo()).toBe('editar');
  });

  it('al editar entrega solo lo que cambió', async () => {
    const { fixture, elemento, guardados } = montar(
      { titulo: 'Cerrar el sprint', descripcion: '', responsableId: null },
      'editar',
    );

    escribir(fixture, campo(elemento, 'Título'), 'Cerrar el sprint 3');
    await enviar(fixture, elemento);

    expect(guardados).toEqual([
      { titulo: 'Cerrar el sprint 3', descripcion: '', responsableId: null },
    ]);
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

  it('en creación el botón invita a crear', () => {
    const { elemento } = montar();

    expect(elemento.textContent).toContain('Crear tarjeta');
  });

  it('en edición el botón habla de guardar cambios', () => {
    const { elemento } = montar(null, 'editar');

    expect(elemento.textContent).toContain('Guardar cambios');
  });
});
