import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { BoardStore } from '@entities/board';
import { MemberStore, comoMemberId } from '@entities/member';
import type { MemberId } from '@entities/member';
import { ToastService } from '@shared/ui';
import { BoardMembers } from './board-members';

const MARTA = comoMemberId('marta');
const IVAN = comoMemberId('ivan');
const ALBA = comoMemberId('alba');

describe('BoardMembers', () => {
  async function montar(
    sesion: MemberId = MARTA,
    invitados: readonly { id: MemberId; rol: 'admin' | 'editor' | 'viewer' }[] = [],
  ) {
    TestBed.configureTestingModule({ imports: [BoardMembers] });

    const tableros = TestBed.inject(BoardStore);
    await tableros.listo;

    const board = tableros.crear('Producto', MARTA);

    for (const invitado of invitados) {
      tableros.invitar(board.id, MARTA, invitado.id, invitado.rol);
    }

    TestBed.inject(MemberStore).cambiarSesion(sesion);

    const fixture = TestBed.createComponent(BoardMembers);
    fixture.componentRef.setInput('board', tableros.buscar(board.id)!);
    fixture.detectChanges();

    return { fixture, tableros, board, elemento: fixture.nativeElement as HTMLElement };
  }

  function campo(elemento: HTMLElement, etiqueta: string): HTMLElement {
    const label = Array.from(elemento.querySelectorAll('label')).find((nodo) =>
      nodo.textContent?.includes(etiqueta),
    ) as HTMLLabelElement;

    return elemento.querySelector(`#${CSS.escape(label.htmlFor)}`) as HTMLElement;
  }

  function escribir(fixture: ComponentFixture<BoardMembers>, control: HTMLElement, valor: string) {
    if (control instanceof HTMLSelectElement) {
      control.value = valor;
      control.dispatchEvent(new Event('input'));
      control.dispatchEvent(new Event('change'));
    } else {
      (control as HTMLInputElement).value = valor;
      control.dispatchEvent(new Event('input'));
    }

    fixture.detectChanges();
  }

  async function enviar(fixture: ComponentFixture<BoardMembers>, elemento: HTMLElement) {
    elemento.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function avisos(): string[] {
    return TestBed.inject(ToastService)
      .avisos()
      .map((aviso) => aviso.mensaje);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('muestra a las personas con su rol y marca quién eres tú', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('Marta Ruiz');
    expect(elemento.textContent).toContain('Administración');
    expect(elemento.textContent).toContain('tú');
  });

  it('el selector de cada fila muestra el rol real, no el de la primera opción', async () => {
    const { elemento } = await montar(MARTA, [
      { id: IVAN, rol: 'editor' },
      { id: ALBA, rol: 'viewer' },
    ]);

    const ivan = elemento.querySelector(
      'select[aria-label="Rol de Iván Soto"]',
    ) as HTMLSelectElement;
    const alba = elemento.querySelector(
      'select[aria-label="Rol de Alba Sanz"]',
    ) as HTMLSelectElement;

    expect(ivan.value).toBe('editor');
    expect(alba.value).toBe('viewer');
  });

  it('quien administra ve el formulario de invitación', async () => {
    const { elemento } = await montar();

    expect(elemento.querySelector('form')).not.toBeNull();
    expect(elemento.textContent).toContain('Invitar a alguien');
  });

  it('quien solo observa ve la lista pero no puede invitar ni cambiar roles', async () => {
    const { elemento } = await montar(ALBA, [{ id: ALBA, rol: 'viewer' }]);

    expect(elemento.textContent).toContain('Marta Ruiz');
    expect(elemento.textContent).toContain('Alba Sanz');
    expect(elemento.querySelector('form')).toBeNull();
    expect(elemento.querySelector('select[aria-label^="Rol de "]')).toBeNull();
    expect(elemento.textContent).toContain('Solo quien administra');
  });

  it('invita a una persona con el rol elegido y actualiza la lista', async () => {
    const { fixture, elemento, tableros, board } = await montar();

    escribir(fixture, campo(elemento, 'Persona'), 'alba');
    escribir(fixture, campo(elemento, 'Rol'), 'viewer');
    await enviar(fixture, elemento);

    expect(tableros.buscar(board.id)?.miembros).toContainEqual({
      memberId: ALBA,
      rol: 'viewer',
    });
    expect(elemento.textContent).toContain('Alba Sanz');
    expect(elemento.textContent).toContain('Solo lectura');
    expect(avisos()).toContain('«Alba Sanz» · Solo lectura');
  });

  it('no invita sin elegir persona y lo explica bajo el campo', async () => {
    const { fixture, elemento, tableros, board } = await montar();

    await enviar(fixture, elemento);

    expect(tableros.buscar(board.id)?.miembros.length).toBe(1);
    expect(elemento.textContent).toContain('Elige a quién invitar');
  });

  it('cambia el rol de una persona ya invitada', async () => {
    const { fixture, elemento, tableros, board } = await montar(MARTA, [
      { id: IVAN, rol: 'editor' },
    ]);

    const selector = elemento.querySelector(
      'select[aria-label="Rol de Iván Soto"]',
    ) as HTMLSelectElement;

    selector.value = 'admin';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(tableros.buscar(board.id)?.miembros).toContainEqual({
      memberId: IVAN,
      rol: 'admin',
    });
    expect(avisos()).toContain('«Iván Soto» · Administración');
  });

  it('no deja el tablero sin administración y devuelve el control a su valor', async () => {
    const { fixture, elemento, tableros, board } = await montar();

    const selector = elemento.querySelector(
      'select[aria-label="Rol de Marta Ruiz"]',
    ) as HTMLSelectElement;

    selector.value = 'viewer';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(tableros.buscar(board.id)?.miembros).toEqual([{ memberId: MARTA, rol: 'admin' }]);
    expect(selector.value).toBe('admin');
    expect(avisos()).toContain('El tablero necesita al menos una persona que lo administre');
  });
});
