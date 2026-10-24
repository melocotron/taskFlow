import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { vi } from 'vitest';
import { BoardRepository, BoardStore } from '@entities/board';
import type { Board } from '@entities/board';
import { MemberStore } from '@entities/member';
import type { MemberId } from '@entities/member';
import { ToastService } from '@shared/ui';
import { ALBA, BoardRepositoryFalso, IVAN, MARTA, tablero } from '@testing/repositorios';
import { BoardMembers } from './board-members';

describe('BoardMembers', () => {
  async function montar(sesion: MemberId = MARTA.memberId, board: Board = tablero()) {
    const repositorio = new BoardRepositoryFalso([board]);

    TestBed.configureTestingModule({
      imports: [BoardMembers],
      providers: [{ provide: BoardRepository, useValue: repositorio }],
    });

    const tableros = TestBed.inject(BoardStore);
    await tableros.listo;
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
    elemento.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function avisos(): string[] {
    return TestBed.inject(ToastService)
      .avisos()
      .map((aviso) => aviso.mensaje);
  }

  it('muestra a las personas con su rol y marca quién eres tú', async () => {
    const { elemento } = await montar();

    expect(elemento.textContent).toContain('Marta Ruiz');
    expect(elemento.textContent).toContain('Administración');
    expect(elemento.textContent).toContain('tú');
    expect(elemento.textContent).toContain('marta@example.com');
  });

  it('el selector de cada fila muestra el rol real, no el de la primera opción', async () => {
    const { elemento } = await montar();

    const ivan = elemento.querySelector(
      'select[aria-label="Rol de Iván Soto"]',
    ) as HTMLSelectElement;
    const alba = elemento.querySelector(
      'select[aria-label="Rol de Alba Sanz"]',
    ) as HTMLSelectElement;

    expect(ivan.value).toBe('editor');
    expect(alba.value).toBe('viewer');
  });

  it('quien administra ve el formulario de invitación por email', async () => {
    const { elemento } = await montar();

    expect(elemento.querySelector('form')).not.toBeNull();
    expect(elemento.textContent).toContain('Invitar a una cuenta');
    expect(elemento.textContent).toContain('registrado antes');
  });

  it('quien solo observa ve la lista pero no puede invitar ni cambiar roles', async () => {
    const sesion = ALBA.memberId;
    const board = tablero({ miembros: [MARTA, { ...ALBA, rol: 'viewer' }] });
    const { elemento } = await montar(sesion, board);

    expect(elemento.textContent).toContain('Marta Ruiz');
    expect(elemento.textContent).toContain('Alba Sanz');
    expect(elemento.querySelector('form')).toBeNull();
    expect(elemento.querySelector('select[aria-label^="Rol de "]')).toBeNull();
    expect(elemento.textContent).toContain('Solo quien administra');
  });

  it('invita por email y actualiza la lista sin cerrar el diálogo', async () => {
    const { fixture, elemento, tableros, board } = await montar(
      MARTA.memberId,
      tablero({ miembros: [MARTA] }),
    );

    escribir(fixture, campo(elemento, 'Email'), ALBA.email);
    escribir(fixture, campo(elemento, 'Rol'), 'viewer');
    await enviar(fixture, elemento);

    expect(tableros.buscar(board.id)?.miembros).toContainEqual(ALBA);
    expect(elemento.textContent).toContain('Alba Sanz');
    expect(elemento.textContent).toContain('Solo lectura');
    await vi.waitFor(() => expect(avisos()).toContain('«Alba Sanz» · Solo lectura'));
  });

  it('no invita sin email y lo explica bajo el campo', async () => {
    const { fixture, elemento, tableros, board } = await montar();

    await enviar(fixture, elemento);

    expect(tableros.buscar(board.id)?.miembros.length).toBe(3);
    expect(elemento.textContent).toContain('Escribe el email de la persona');
  });

  it('cambia el rol de una persona ya invitada', async () => {
    const { fixture, elemento, tableros, board } = await montar();

    const selector = elemento.querySelector(
      'select[aria-label="Rol de Iván Soto"]',
    ) as HTMLSelectElement;

    selector.value = 'admin';
    selector.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(tableros.buscar(board.id)?.miembros).toContainEqual({ ...IVAN, rol: 'admin' });
    await vi.waitFor(() => expect(avisos()).toContain('«Iván Soto» · Administración'));
  });
});
