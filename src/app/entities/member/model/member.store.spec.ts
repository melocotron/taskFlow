import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MemberStore } from './member.store';
import { comoMemberId, puede } from '../model/member.model';

describe('permisos por rol', () => {
  it('quien administra puede con todo', () => {
    expect(puede('admin', 'ver')).toBe(true);
    expect(puede('admin', 'editar')).toBe(true);
    expect(puede('admin', 'administrar')).toBe(true);
  });

  it('quien edita puede ver y editar, pero no administrar', () => {
    expect(puede('editor', 'ver')).toBe(true);
    expect(puede('editor', 'editar')).toBe(true);
    expect(puede('editor', 'administrar')).toBe(false);
  });

  it('quien solo observa no puede editar nada', () => {
    expect(puede('viewer', 'ver')).toBe(true);
    expect(puede('viewer', 'editar')).toBe(false);
    expect(puede('viewer', 'administrar')).toBe(false);
  });
});

describe('MemberStore', () => {
  function montar() {
    TestBed.configureTestingModule({});
    return TestBed.inject(MemberStore);
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('trae las tres personas de ejemplo del spec', () => {
    const store = montar();

    expect(store.miembros().length).toBe(3);
    expect(store.miembros().map((m) => m.nombre)).toEqual(['Marta Ruiz', 'Iván Soto', 'Alba Sanz']);
  });

  it('arranca con la primera persona si no hay sesión guardada', () => {
    const store = montar();

    expect(store.sesion().nombre).toBe('Marta Ruiz');
    expect(store.puedeEditar()).toBe(true);
    expect(store.puedeAdministrar()).toBe(true);
  });

  it('al cambiar a una persona observadora se apagan los permisos de escritura', () => {
    const store = montar();

    store.cambiarSesion(comoMemberId('alba'));

    expect(store.rol()).toBe('viewer');
    expect(store.puedeEditar()).toBe(false);
    expect(store.puedeAdministrar()).toBe(false);
  });

  it('al cambiar a una persona editora se permite editar pero no administrar', () => {
    const store = montar();

    store.cambiarSesion(comoMemberId('ivan'));

    expect(store.puedeEditar()).toBe(true);
    expect(store.puedeAdministrar()).toBe(false);
  });

  it('recuerda la sesión entre recargas', () => {
    const store = montar();
    store.cambiarSesion(comoMemberId('alba'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const recargado = TestBed.inject(MemberStore);

    expect(recargado.sesion().nombre).toBe('Alba Sanz');
  });

  it('si la sesión guardada no existe, cae a la primera persona', () => {
    localStorage.setItem('taskflow.sesion', 'fantasma');

    const store = montar();

    expect(store.sesion().nombre).toBe('Marta Ruiz');
  });

  it('ignora un cambio a una persona inexistente', () => {
    const store = montar();

    store.cambiarSesion(comoMemberId('nadie'));

    expect(store.sesion().nombre).toBe('Marta Ruiz');
  });
});

describe('MemberStore en un componente', () => {
  it('los permisos se leen igual desde la plantilla que desde el store', () => {
    @Component({
      selector: 'app-prueba-permisos',
      template: `
        @if (miembros.puedeEditar()) {
          <button type="button">Editar</button>
        } @else {
          <p>Sin permiso de edición</p>
        }
      `,
    })
    class PruebaPermisos {
      readonly miembros = TestBed.inject(MemberStore);
    }

    TestBed.configureTestingModule({ imports: [PruebaPermisos] });
    const fixture = TestBed.createComponent(PruebaPermisos);
    fixture.detectChanges();

    const store = TestBed.inject(MemberStore);

    expect(fixture.nativeElement.textContent).toContain('Editar');

    store.cambiarSesion(comoMemberId('alba'));
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Sin permiso de edición');
  });
});
