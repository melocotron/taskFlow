import { TestBed } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  function servicio() {
    TestBed.configureTestingModule({});
    return TestBed.inject(ToastService);
  }

  afterEach(() => {
    vi.useRealTimers();
  });

  it('encola los avisos en orden', () => {
    const toasts = servicio();

    toasts.mostrar('Tarea creada');
    toasts.mostrar('Tarea movida', 'acento');

    expect(toasts.avisos().map((aviso) => aviso.mensaje)).toEqual(['Tarea creada', 'Tarea movida']);
  });

  it('se cierra solo al pasar el tiempo', () => {
    vi.useFakeTimers();
    const toasts = servicio();

    toasts.mostrar('Guardado', 'neutro', 3000);
    expect(toasts.avisos().length).toBe(1);

    vi.advanceTimersByTime(3000);

    expect(toasts.avisos().length).toBe(0);
  });

  it('cerrar a mano cancela el temporizador, no lo deja huérfano', () => {
    vi.useFakeTimers();
    const toasts = servicio();

    const id = toasts.mostrar('Guardado', 'neutro', 3000);
    toasts.cerrar(id);

    expect(toasts.avisos().length).toBe(0);

    // Si el temporizador siguiera vivo, esto no fallaría pero dejaría trabajo pendiente.
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cerrar un id inexistente no rompe nada', () => {
    const toasts = servicio();

    toasts.mostrar('Guardado');
    toasts.cerrar(9999);

    expect(toasts.avisos().length).toBe(1);
  });
});
