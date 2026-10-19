import {
  Component,
  ElementRef,
  OnInit,
  afterNextRender,
  computed,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
/**
 * Igual que en `task-form`: el nombre corto `FormField` es el envoltorio visual
 * (`app-field`) y la directiva de Signal Forms se aliasa.
 */
import {
  FormField as EnlaceDeCampo,
  FormRoot,
  form,
  maxLength,
  required,
  validate,
} from '@angular/forms/signals';
import type { ReadonlyFieldState } from '@angular/forms/signals';
import { Button, FormField, TextInput } from '@shared/ui';

/** Lo que sale del formulario, ya recortado. */
export interface DatosTablero {
  readonly titulo: string;
}

interface ModeloTablero {
  titulo: string;
}

const MAX_TITULO = 60;

/**
 * Formulario del nombre de un tablero: crea y renombra con la misma pieza.
 *
 * La validación vive aquí y no en cada página: si mañana el nombre tiene otra regla,
 * se cambia en un sitio y las dos puertas la cumplen a la vez. Habla por `output()`,
 * así que no sabe si detrás hay un store que crea o uno que renombra.
 */
@Component({
  selector: 'app-board-form',
  imports: [Button, EnlaceDeCampo, FormField, FormRoot, TextInput],
  templateUrl: './board-form.html',
  styleUrl: './board-form.css',
})
export class BoardForm implements OnInit {
  readonly modo = input<'crear' | 'renombrar'>('crear');
  readonly tituloInicial = input('');

  readonly guardado = output<DatosTablero>();
  readonly cancelado = output<void>();

  private readonly modelo = signal<ModeloTablero>({ titulo: '' });

  private readonly campo = viewChild<ElementRef<HTMLInputElement>>('campoTitulo');

  constructor() {
    // Al renombrar, el nombre viejo llega seleccionado: escribir sustituye en vez de
    // obligar a borrar. Solo después de pintar, cuando el control ya existe.
    afterNextRender(() => {
      if (this.modo() === 'renombrar') {
        this.campo()?.nativeElement.select();
      }
    });
  }

  protected readonly etiquetaBoton = computed(() =>
    this.modo() === 'crear' ? 'Crear tablero' : 'Guardar nombre',
  );

  /** La ayuda cambia con la intención: al renombrar importa saber que no se pierde nada. */
  protected readonly ayuda = computed(() =>
    this.modo() === 'crear'
      ? `Con este nombre lo verá todo el equipo. Máximo ${MAX_TITULO} caracteres.`
      : `Las tarjetas se quedan donde están. Máximo ${MAX_TITULO} caracteres.`,
  );

  protected readonly formulario = form(
    this.modelo,
    (tablero) => {
      required(tablero.titulo, { message: 'Ponle un nombre al tablero' });

      maxLength(tablero.titulo, MAX_TITULO, {
        message: `El nombre no puede pasar de ${MAX_TITULO} caracteres`,
      });

      // `required` acepta un nombre de espacios; el dominio no. Misma regla, misma respuesta.
      validate(tablero.titulo, ({ value }) =>
        value().trim().length === 0
          ? { kind: 'enBlanco', message: 'El nombre no puede quedarse en blanco' }
          : null,
      );
    },
    {
      submission: {
        action: async () => {
          this.guardado.emit({ titulo: this.modelo().titulo.trim() });
        },
      },
    },
  );

  protected readonly error = computed(() => this.mensaje(this.formulario.titulo()));

  ngOnInit(): void {
    const inicial = this.tituloInicial();

    if (inicial.length > 0) {
      this.modelo.set({ titulo: inicial });
    }
  }

  private mensaje(campo: ReadonlyFieldState<string>): string {
    if (!campo.touched()) {
      return '';
    }

    return campo.errors()[0]?.message ?? '';
  }
}
