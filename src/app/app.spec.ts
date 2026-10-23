import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@entities/auth';
import type { Usuario } from '@entities/auth';
import { MemberStore } from '@entities/member';
import { App } from './app';

describe('App', () => {
  async function montar() {
    const auth = { usuario: signal<Usuario | null>(null) };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: AuthService, useValue: auth }, provideRouter([])],
    }).compileComponents();

    return { auth };
  }

  it('renderiza el outlet donde se montan las páginas', async () => {
    await montar();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const outlet: HTMLElement | null = fixture.nativeElement.querySelector('router-outlet');

    expect(outlet).toBeTruthy();
  });

  it('sincroniza la cuenta autenticada con el store de miembros', async () => {
    const { auth } = await montar();
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    auth.usuario.set({
      id: '0198f3f4-0000-7000-8000-000000000001',
      nombre: 'Marta Ruiz',
      email: 'marta@example.com',
      creadoEn: '2026-01-01T00:00:00Z',
    });
    fixture.detectChanges();

    const equipo = TestBed.inject(MemberStore);

    expect(equipo.haySesion()).toBe(true);
    expect(equipo.sesion().nombre).toBe('Marta Ruiz');
  });
});
