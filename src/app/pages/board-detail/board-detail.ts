import type { DialogRef } from '@angular/cdk/dialog';
import {
  Component,
  TemplateRef,
  computed,
  effect,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BoardStore, comoBoardId } from '@entities/board';
import { MemberStore } from '@entities/member';
import { BoardFilters } from '@features/board-filters';
import type { FiltroTablero } from '@features/board-filters';
import { BoardForm } from '@features/board-form';
import type { DatosTablero } from '@features/board-form';
import { Button, DialogService, ToastService } from '@shared/ui';
import type { DialogContent } from '@shared/ui';
import { BoardCanvas } from '@widgets/board-canvas';

/**
 * Pantalla de un tablero.
 *
 * Resuelve la navegación por `tableros/:id` y compone el lienzo. Todo el trabajo
 * de pintar columnas y tarjetas vive en `board-canvas`.
 *
 * El nombre del tablero se puede cambiar desde aquí: el store sabía renombrar desde
 * S2.1, pero hasta ahora no había ninguna puerta en la interfaz.
 *
 * El filtro **vive en la URL** (`?q=` y `?persona=`): se puede compartir y sobrevive a la
 * recarga. Se escribe con `replaceUrl`, así que teclear no llena el historial de un paso
 * por pulsación —atrás vuelve a la pantalla anterior, no a cada búsqueda—.
 */
@Component({
  selector: 'app-board-detail',
  imports: [BoardCanvas, BoardFilters, BoardForm, Button, RouterLink],
  templateUrl: './board-detail.html',
  styleUrl: './board-detail.css',
})
export default class BoardDetailPage {
  private readonly tableros = inject(BoardStore);
  private readonly equipo = inject(MemberStore);
  private readonly dialogos = inject(DialogService);
  private readonly avisos = inject(ToastService);
  private readonly rutas = inject(Router);
  private readonly ruta = inject(ActivatedRoute);

  /** Llega desde la ruta gracias a `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  /** Query params, enlazados a inputs por el mismo `withComponentInputBinding()`. */
  readonly q = input('');
  readonly persona = input('');

  /**
   * Lo que dice la URL, ya normalizado.
   *
   * El router pone `undefined` en los inputs que la URL no trae, así que el `?? ''` no
   * es defensivo de más: sin él, el filtro arrancaría con `undefined` y el lienzo
   * intentaría recortar un texto que no existe.
   */
  private readonly filtroDeLaUrl = computed<FiltroTablero>(() => ({
    texto: this.q() ?? '',
    persona: this.persona() ?? '',
  }));

  /**
   * El filtro, derivado de la URL y escribible desde la barra.
   *
   * `linkedSignal` es justo esta pieza: un estado que se recalcula cuando cambia su
   * fuente (los query params) pero que además admite escritura mientras tanto. Con un
   * `computed` no se podría teclear; con un `signal` normal, la URL dejaría de mandar.
   */
  protected readonly filtro = linkedSignal<FiltroTablero>(() => this.filtroDeLaUrl());

  private referencia: DialogRef<unknown, DialogContent> | null = null;

  protected readonly plantillaRenombrar =
    viewChild.required<TemplateRef<unknown>>('plantillaRenombrar');

  protected readonly cargando = this.tableros.cargando;
  protected readonly tablero = computed(() => this.tableros.buscar(comoBoardId(this.id())));
  protected readonly puedeEditar = this.equipo.puedeEditar;

  constructor() {
    // La barra responde al instante; la URL se reescribe sin esperar a soltar la tecla.
    // `replaceUrl` evita un paso de historial por pulsación, y la comparación evita
    // navegar cuando la URL ya cuenta lo mismo (al recargar, por ejemplo).
    effect(() => {
      const filtro = this.filtro();
      const enUrl = this.filtroDeLaUrl();

      if (filtro.texto === enUrl.texto && filtro.persona === enUrl.persona) {
        return;
      }

      this.escribirEnLaUrl(filtro);
    });
  }

  protected aplicarFiltro(filtro: FiltroTablero): void {
    this.filtro.set(filtro);
  }

  /** Abre el diálogo con el nombre actual ya cargado. */
  protected renombrar(): void {
    // La interfaz esconde el botón sin permiso; el método lo vuelve a comprobar.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite renombrar tableros', 'peligro');
      return;
    }

    if (!this.tablero()) {
      return;
    }

    this.referencia = this.dialogos.abrir('Renombrar tablero', this.plantillaRenombrar());
  }

  /** Recibe el nombre ya validado y recortado por el formulario. */
  protected guardarNombre(datos: DatosTablero): void {
    const tablero = this.tablero();

    if (!tablero) {
      return;
    }

    try {
      this.tableros.renombrar(tablero.id, datos.titulo);
      this.avisos.mostrar(`El tablero ahora se llama «${datos.titulo}»`, 'acento');
      this.cerrarRenombrar();
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo renombrar el tablero',
        'peligro',
      );
    }
  }

  protected cerrarRenombrar(): void {
    this.referencia?.close();
    this.referencia = null;
  }

  /**
   * Lleva el filtro a la URL.
   *
   * El texto va tal cual se escribió (el espacio final no se recorta: si se recortara,
   * la URL devolvería un valor distinto del que hay en el campo y el cursor saltaría).
   * Escribir en blanco quita el parámetro, para que la URL limpia siga siendo `/tableros/:id`.
   */
  private escribirEnLaUrl(filtro: FiltroTablero): void {
    void this.rutas.navigate([], {
      relativeTo: this.ruta,
      queryParams: {
        q: filtro.texto.length > 0 ? filtro.texto : null,
        persona: filtro.persona.length > 0 ? filtro.persona : null,
      },
      replaceUrl: true,
    });
  }
}
