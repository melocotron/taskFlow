import { Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
/**
 * Hay dos `FormField`: el envoltorio visual `app-field` de `shared/ui` y la directiva
 * de Signal Forms que ata un control nativo a un campo. Aquí se aliasa la segunda para
 * que el nombre corto siga siendo el del componente que se ve en la plantilla.
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
import { MemberStore } from '@entities/member';
import { Button, FormField, TextInput } from '@shared/ui';

/** Lo que sale del formulario: texto ya limpio, listo para el store. */
export interface DatosTarjeta {
  readonly titulo: string;
  readonly descripcion: string;
  /** `null` cuando no se asigna a nadie. */
  readonly responsable: string | null;
}

/** Modelo del formulario: todo texto, para no arrastrar `null` por los controles. */
interface ModeloTarjeta {
  titulo: string;
  descripcion: string;
  responsable: string;
}

/** Topes del esquema. El del título también se cuenta en la ayuda del campo. */
const MAX_TITULO = 80;
const MAX_DESCRIPCION = 500;

/**
 * Formulario de tarjeta: la misma pieza crea y edita.
 *
 * No habla con el store: emite lo escrito y quien lo abre decide qué hacer con ello.
 * Así la creación y la edición no pueden divergir en validaciones ni en mensajes.
 *
 * Se construye con **Signal Forms**: el modelo es una señal, el esquema declara las
 * reglas y el estado del campo (tocado, errores) es lo que pinta el mensaje. No hay
 * copia paralela de los datos ni suscripciones que limpiar.
 */
@Component({
  selector: 'app-task-form',
  imports: [Button, EnlaceDeCampo, FormField, FormRoot, TextInput],
  templateUrl: './task-form.html',
  styleUrl: './task-form.css',
})
export class TaskForm implements OnInit {
  private readonly equipo = inject(MemberStore);

  readonly modo = input<'crear' | 'editar'>('crear');

  /** Valores de partida al editar. Se aplican antes del primer pintado. */
  readonly inicial = input<DatosTarjeta | null>(null);

  readonly guardado = output<DatosTarjeta>();
  readonly cancelado = output<void>();

  private readonly modelo = signal<ModeloTarjeta>({
    titulo: '',
    descripcion: '',
    responsable: '',
  });

  protected readonly miembros = this.equipo.miembros;

  protected readonly etiquetaGuardar = computed(() =>
    this.modo() === 'crear' ? 'Crear tarjeta' : 'Guardar cambios',
  );

  /** La ayuda sale del mismo número que la validación: no puede quedarse desfasada. */
  protected readonly ayudaTitulo = `Máximo ${MAX_TITULO} caracteres.`;

  /**
   * El esquema es la única puerta de validación.
   *
   * `required` no basta: un título hecho de espacios lo pasa y el dominio lo rechaza
   * al crear. La segunda regla mira el texto ya recortado, así que el formulario y
   * `crearTask()` dicen que no por el mismo motivo.
   */
  protected readonly formulario = form(
    this.modelo,
    (tarjeta) => {
      required(tarjeta.titulo, { message: 'Escribe qué hay que hacer' });

      maxLength(tarjeta.titulo, MAX_TITULO, {
        message: `El título no puede pasar de ${MAX_TITULO} caracteres`,
      });
      maxLength(tarjeta.descripcion, MAX_DESCRIPCION, {
        message: `La descripción no puede pasar de ${MAX_DESCRIPCION} caracteres`,
      });

      validate(tarjeta.titulo, ({ value }) =>
        value().trim().length === 0
          ? { kind: 'enBlanco', message: 'El título no puede quedarse en blanco' }
          : null,
      );
    },
    {
      submission: {
        action: async () => {
          this.guardado.emit(this.datos());
        },
      },
    },
  );

  protected readonly errorTitulo = computed(() => this.mensaje(this.formulario.titulo()));
  protected readonly errorDescripcion = computed(() => this.mensaje(this.formulario.descripcion()));

  /**
   * Los valores iniciales llegan como `input()` y los inputs existen antes de
   * `ngOnInit`: se vuelcan aquí y el primer pintado ya sale relleno.
   */
  ngOnInit(): void {
    const inicial = this.inicial();

    if (!inicial) {
      return;
    }

    this.modelo.set({
      titulo: inicial.titulo,
      descripcion: inicial.descripcion,
      responsable: inicial.responsable ?? '',
    });
  }

  /** Recorta antes de salir: quien recibe los datos no tiene que acordarse. */
  private datos(): DatosTarjeta {
    const { titulo, descripcion, responsable } = this.modelo();

    return {
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      responsable: responsable.trim() === '' ? null : responsable,
    };
  }

  /**
   * Un error solo se anuncia cuando el campo ya se tocó. Mientras alguien escribe
   * por primera vez no hay nada que reprocharle.
   */
  private mensaje(campo: ReadonlyFieldState<string>): string {
    if (!campo.touched()) {
      return '';
    }

    return campo.errors()[0]?.message ?? '';
  }
}
