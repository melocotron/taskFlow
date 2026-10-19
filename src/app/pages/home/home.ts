import { CdkMenuTrigger } from '@angular/cdk/menu';
import { Component, computed, inject } from '@angular/core';
import { BoardStore } from '@entities/board';
import { MemberStore, etiquetaRol } from '@entities/member';
import type { MemberId } from '@entities/member';
import { turnoPorIndice } from '@shared/lib/turnos';
import {
  Avatar,
  Button,
  Card,
  EmptyState,
  Menu,
  MenuItem,
  Skeleton,
  ToastService,
} from '@shared/ui';

/**
 * Pantalla de arranque: lista de tableros.
 *
 * Es la primera pantalla real y sirve de prueba de extremo a extremo del sistema:
 * sesión → permisos → store → estados de carga → design system.
 */
@Component({
  selector: 'app-home',
  imports: [Avatar, Button, Card, CdkMenuTrigger, EmptyState, Menu, MenuItem, Skeleton],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export default class HomePage {
  private readonly tableros = inject(BoardStore);
  private readonly avisos = inject(ToastService);
  private readonly equipo = inject(MemberStore);

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

  protected etiqueta = etiquetaRol;

  protected turno(indice: number) {
    return turnoPorIndice(indice);
  }

  protected cambiarSesion(id: MemberId): void {
    this.equipo.cambiarSesion(id);
  }

  protected salir(): void {
    this.equipo.salir();
  }

  protected crearTablero(): void {
    // La interfaz ya esconde el botón, pero la comprobación se repite a propósito:
    // la UI no es la puerta. Invocado desde la consola, tampoco pasa.
    if (!this.puedeEditar()) {
      this.avisos.mostrar('Tu rol no permite crear tableros', 'peligro');
      return;
    }

    try {
      const board = this.tableros.crear('Tablero sin nombre');
      this.avisos.mostrar(`«${board.titulo}» creado`, 'acento');
    } catch (fallo) {
      this.avisos.mostrar(
        fallo instanceof Error ? fallo.message : 'No se pudo crear el tablero',
        'peligro',
      );
    }
  }

  protected reintentar(): void {
    void this.tableros.cargar();
  }
}
