import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MemberStore } from '@entities/member';
import type { MemberId } from '@entities/member';
import { turnoPorIndice } from '@shared/lib/turnos';
import { Avatar, Badge, Card } from '@shared/ui';
import { etiquetaRol } from '@entities/member';

/**
 * Pantalla de entrada.
 *
 * No hay contraseña: se elige persona, como fija el spec 001. La sesión queda guardada
 * y el guard deja pasar la próxima vez.
 */
@Component({
  selector: 'app-entrar',
  imports: [Avatar, Badge, Card],
  templateUrl: './entrar.html',
  styleUrl: './entrar.css',
})
export default class EntrarPage {
  private readonly miembros = inject(MemberStore);
  private readonly router = inject(Router);

  protected readonly equipo = this.miembros.miembros;

  protected turno(indice: number) {
    return turnoPorIndice(indice);
  }

  protected etiqueta = etiquetaRol;

  protected entrar(id: MemberId): void {
    this.miembros.cambiarSesion(id);
    void this.router.navigateByUrl('/');
  }
}
