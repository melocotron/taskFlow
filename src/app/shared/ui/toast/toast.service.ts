import { Injectable, signal } from '@angular/core';
import type { ToastTono } from './toast';

export interface Aviso {
  readonly id: number;
  readonly mensaje: string;
  readonly tono: ToastTono;
}

/**
 * Cola de avisos efímeros.
 *
 * Un aviso no bloquea y no pide confirmación: si hiciera eso sería un diálogo.
 * Se va solo, y quien no llegó a leerlo puede repetir la acción.
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly cola = signal<readonly Aviso[]>([]);
  private readonly temporizadores = new Map<number, ReturnType<typeof setTimeout>>();
  private siguienteId = 0;

  readonly avisos = this.cola.asReadonly();

  mostrar(mensaje: string, tono: ToastTono = 'neutro', duracionMs = 5000): number {
    const id = ++this.siguienteId;

    this.cola.update((actuales) => [...actuales, { id, mensaje, tono }]);
    this.temporizadores.set(
      id,
      setTimeout(() => this.cerrar(id), duracionMs),
    );

    return id;
  }

  cerrar(id: number): void {
    const temporizador = this.temporizadores.get(id);

    if (temporizador !== undefined) {
      clearTimeout(temporizador);
      this.temporizadores.delete(id);
    }

    this.cola.update((actuales) => actuales.filter((aviso) => aviso.id !== id));
  }
}
