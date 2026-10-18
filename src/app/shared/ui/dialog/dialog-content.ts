import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, inject, input } from '@angular/core';
import { IconButton } from '../icon-button/icon-button';

/** Datos que recibe la capa visual del diálogo. */
export interface DialogContentData {
  readonly titulo: string;
  readonly contenido: TemplateRef<unknown>;
}

/**
 * Capa visual del diálogo. No decide cuándo abrirse: eso lo hace `DialogService`
 * con el overlay del CDK, que aporta trampa de foco y restauración al trigger.
 */
@Component({
  selector: 'app-dialog-content',
  imports: [IconButton, NgTemplateOutlet],
  templateUrl: './dialog-content.html',
  styleUrl: './dialog-content.css',
})
export class DialogContent {
  private readonly datos = inject<DialogContentData>(DIALOG_DATA);
  private readonly referencia = inject<DialogRef>(DialogRef);

  readonly titulo = input(this.datos.titulo);
  protected readonly contenido = this.datos.contenido;

  protected cerrar(): void {
    this.referencia.close();
  }
}
