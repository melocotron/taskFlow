import type { DialogRef } from '@angular/cdk/dialog';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, TemplateRef, computed, inject, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '@entities/auth';
import { BoardStore, esMiembro, rolEn } from '@entities/board';
import type { Board } from '@entities/board';
import { MemberStore, etiquetaRol } from '@entities/member';
import type { Rol } from '@entities/member';
import { BoardForm } from '@features/board-form';
import type { DatosTablero } from '@features/board-form';
import { turnoPorIndice } from '@shared/lib/turnos';
import {
  Avatar,
  Button,
  Card,
  DialogService,
  EmptyState,
  Menu,
  MenuItem,
  Skeleton,
  ToastService,
} from '@shared/ui';
import type { DialogContent } from '@shared/ui';

/**
 * Pantalla de arranque: la lista de tableros.
 *
 * Solo aparecen los tableros a los que la persona tiene acceso. El rol depende de cada
 * uno: la misma sesión puede ser administradora aquí y observadora allá, así que la
 * tarjeta dice cuál es el tuyo.
 *
 * Cualquier persona puede crear un tablero; quien lo crea entra como administrador.
 * Invitar al resto es una acción del tablero, no un permiso global.
 */
@Component({
  selector: 'app-board-list',
  imports: [
    Avatar,
    BoardForm,
    Button,
    Card,
    CdkMenuTrigger,
    EmptyState,
    Menu,
    MenuItem,
    RouterLink,
    Skeleton,
  ],
  templateUrl: './board-list.html',
  styleUrl: './board-list.css',
})
export default class BoardListPage {
  private readonly tableros = inject(BoardStore);
  private readonly avisos = inject(ToastService);
  private readonly equipo = inject(MemberStore);
  private readonly auth = inject(AuthService);
  private readonly dialogos = inject(DialogService);
  private readonly rutas = inject(Router);

  /** Referencia al diálogo abierto, para poder cerrarlo desde su propio contenido. */
  private referencia: DialogRef<unknown, DialogContent> | null = null;

  protected readonly plantillaNuevo = viewChild.required<TemplateRef<unknown>>('plantillaNuevo');

  protected readonly cargando = this.tableros.cargando;
  protected readonly conFallo = this.tableros.conFallo;
  protected readonly error = this.tableros.error;

  /** Los activos que además son tuyos: los demás no existen para esta sesión. */
  protected readonly misTableros = computed(() =>
    this.tableros.activos().filter((board) => esMiembro(board, this.equipo.sesion().id)),
  );

  protected readonly cuantos = computed(() => this.misTableros().length);

  protected readonly sesion = this.equipo.sesion;

  /** Etiqueta legible del rol, para la tarjeta de cada tablero. */
  protected etiqueta = etiquetaRol;

  protected turno(indice: number) {
    return turnoPorIndice(indice);
  }

  protected rolDe(board: Board): Rol | null {
    return rolEn(board, this.sesion().id);
  }

  /** Cierra la sesión en el servidor y en el store de identidad local. */
  protected async salir(): Promise<void> {
    try {
      await this.auth.salir();
    } finally {
      this.equipo.salir();
      await this.rutas.navigate(['/entrar']);
    }
  }

  protected nuevoTablero(): void {
    this.referencia = this.dialogos.abrir('Nuevo tablero', this.plantillaNuevo());
  }

  /** Recibe el nombre ya validado y recortado por el formulario. */
  protected crearTablero(datos: DatosTablero): void {
    try {
      const board = this.tableros.crear(datos.titulo, this.sesion().id);

      this.avisos.mostrar(`«${board.titulo}» creado`, 'acento');
      this.cerrarNuevo();
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo crear el tablero',
        'peligro',
      );
    }
  }

  protected cerrarNuevo(): void {
    this.referencia?.close();
    this.referencia = null;
  }

  protected reintentar(): void {
    void this.tableros.cargar();
  }
}
