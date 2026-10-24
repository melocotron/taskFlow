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

  it('trae las tres personas de ejemplo del spec', () => {
    const store = montar();

    expect(store.miembros().length).toBe(3);
    expect(store.miembros().map((m) => m.nombre)).toEqual(['Marta Ruiz', 'Iván Soto', 'Alba Sanz']);
  });

  it('arranca con la primera persona si no hay sesión guardada', () => {
    const store = montar();

    expect(store.sesion().nombre).toBe('Marta Ruiz');
    expect(store.haySesion()).toBe(false);
  });

  it('cambiar de persona abre la sesión: el rol ya no es global', () => {
    const store = montar();

    store.cambiarSesion(comoMemberId('alba'));

    expect(store.sesion().nombre).toBe('Alba Sanz');
    expect(store.haySesion()).toBe(true);
  });

  it('no persiste la identidad: al recargar manda la sesión de la API', () => {
    const store = montar();
    store.cambiarSesion(comoMemberId('alba'));

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const recargado = TestBed.inject(MemberStore);

    expect(recargado.sesion().nombre).toBe('Marta Ruiz');
    expect(recargado.haySesion()).toBe(false);
  });

  it('ignora un cambio a una persona inexistente', () => {
    const store = montar();

    store.cambiarSesion(comoMemberId('nadie'));

    expect(store.sesion().nombre).toBe('Marta Ruiz');
  });
});
