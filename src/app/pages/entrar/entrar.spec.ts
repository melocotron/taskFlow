import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MemberStore } from '@entities/member';
import EntrarPage from './entrar';

describe('EntrarPage', () => {
  function montar() {
    const navegaciones: string[] = [];

    TestBed.configureTestingModule({
      imports: [EntrarPage],
      providers: [
        { provide: Router, useValue: { navigateByUrl: (url: string) => navegaciones.push(url) } },
      ],
    });

    const fixture = TestBed.createComponent(EntrarPage);
    fixture.detectChanges();

    return {
      fixture,
      navegaciones,
      equipo: TestBed.inject(MemberStore),
      elemento: fixture.nativeElement as HTMLElement,
    };
  }

  beforeEach(() => {
    localStorage.clear();
  });

  it('lista a las tres personas del equipo sin anunciar un rol global', () => {
    const { elemento } = montar();

    expect(elemento.textContent).toContain('Marta Ruiz');
    expect(elemento.textContent).toContain('Iván Soto');
    expect(elemento.textContent).toContain('Alba Sanz');
    expect(elemento.textContent).toContain('Los permisos dependen de cada tablero');
    expect(elemento.textContent).not.toContain('Solo lectura');
  });

  it('elegir persona abre la sesión y navega al tablero', () => {
    const { elemento, equipo, navegaciones } = montar();

    expect(equipo.haySesion()).toBe(false);

    const botones = Array.from(elemento.querySelectorAll('button'));
    const deAlba = botones.find((boton) => boton.textContent?.includes('Alba Sanz'));

    deAlba?.click();

    expect(equipo.haySesion()).toBe(true);
    expect(equipo.sesion().nombre).toBe('Alba Sanz');
    expect(navegaciones).toEqual(['/']);
  });
});
