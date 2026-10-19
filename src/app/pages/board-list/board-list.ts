import type { DialogRef } from '@angular/cdk/dialog';
import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, TemplateRef, computed, inject, signal, viewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BoardStore } from '@entities/board';
import { MemberStore, etiquetaRol } from '@entities/member';
import type { MemberId } from '@entities/member';
import { turnoPorIndice } from '@shared/lib/turnos';
import {
  Avatar,
  Button,
  Card,
  DialogService,
  EmptyState,
  FormField,
  Menu,
  MenuItem,
  Skeleton,
  TextInput,
  ToastService,
} from '@shared/ui';
import type { DialogContent } from '@shared/ui';

/**
 * Pantalla de arranque: la lista de tableros.
 *
 * Es la primera rebanada vertical completa (sesión → permisos → store → estados de
 * carga → design system) y la puerta al detalle de cada tablero.
 *
 * El nombre del tablero se pide en un diálogo y no se inventa: un tablero llamado
 * «Tablero sin nombre» no le sirve a nadie y hay que renombrarlo igual.
 */
@Component({
  selector: 'app-board-list',
  imports: [
    Avatar,
    Button,
    Card,
    CdkMenuTrigger,
    EmptyState,
    FormField,
    Menu,
    MenuItem,
    RouterLink,
    Skeleton,
    TextInput,
  ],
  templateUrl: './board-list.html',
  styleUrl: './board-list.css',
})
export default class BoardListPage {
  private readonly tableros = inject(BoardStore);
  private readonly avisos = inject(ToastService);
  private readonly equipo = inject(MemberStore);
  private readonly dialogos = inject(DialogService);
  private readonly rutas = inject(Router);

  /** Referencia al diálogo abierto, para poder cerrarlo desde su propio contenido. */
  private referencia: DialogRef<unknown, DialogContent> | null = null;

  protected readonly plantillaNuevo = viewChild.required<TemplateRef<unknown>>('plantillaNuevo');

  protected readonly cargando = this.tableros.cargando;
  protected readonly conFallo = this.tableros.conFallo;
  protected readonly error = this.tableros.error;
  protected readonly activos = this.tableros.activos;
  protected readonly cuantos = this.tableros.cuantosActivos;

  protected readonly sesion = this.equipo.sesion;
  protected readonly miembros = this.equipo.miembros;
  protected readonly puedeEditar = this.equipo.puedeEditar;

  protected readonly turnoActual = computed(() => {
    const indice = this.miembros().findIndex((persona) => persona.id === this.sesion().id);

    return turnoPorIndice(Math.max(indice, 0));
  });

  /** Estado del formulario de creación; vive aquí porque el diálogo proyecta esta plantilla. */
  protected readonly nombreNuevo = signal('');
  protected readonly errorNombre = signal('');

  protected etiqueta = etiquetaRol;

  protected turno(indice: number) {
    return turnoPorIndice(indice);
  }

  protected cambiarSesion(id: MemberId): void {
    this.equipo.cambiarSesion(id);
  }

  /** Salir deja de tener sentido si te deja dentro: se cierra la sesión y se sale. */
  protected salir(): void {
    this.equipo.salir();
    void this.rutas.navigate(['/entrar']);
  }

  protected nuevoTablero(): void {
    // La interfaz ya esconde el botón, pero la comprobación se repite a propósito:
    // la UI no es la puerta. Invocado desde la consola, tampoco pasa.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite crear tableros', 'peligro');
      return;
    }

    this.nombreNuevo.set('');
    this.errorNombre.set('');
    this.referencia = this.dialogos.abrir('Nuevo tablero', this.plantillaNuevo());
  }

  protected alEscribir(evento: Event): void {
    this.nombreNuevo.set((evento.target as HTMLInputElement).value);
    this.errorNombre.set('');
  }

  protected confirmarNuevo(evento: Event): void {
    evento.preventDefault();

    const titulo = this.nombreNuevo().trim();

    if (titulo.length === 0) {
      this.errorNombre.set('Ponle un nombre al tablero para poder crearlo');
      return;
    }

    try {
      const board = this.tableros.crear(titulo);

      this.avisos.mostrar(`«${board.titulo}» creado`, 'acento');
      this.cerrarNuevo();
    } catch (fallo) {
      this.errorNombre.set(fallo instanceof Error ? fallo.message : 'No se pudo crear el tablero');
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
