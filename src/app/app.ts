import { Component, computed, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@entities/auth';
import { MemberStore, comoMemberId } from '@entities/member';
import { ToastContainer } from '@shared/ui/toast';
import { ToastService } from './shared/ui/toast/toast.service';

@Component({
  imports: [RouterOutlet, ToastContainer],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  private readonly avisos = inject(ToastService);
  private readonly auth = inject(AuthService);
  private readonly equipo = inject(MemberStore);

  constructor() {
    /*
     * La API es la fuente de verdad de la identidad; los tableros siguen hablando de
     * `MemberId`. Este efecto adapta la cuenta al modelo que ya usa el dominio.
     */
    effect(() => {
      const usuario = this.auth.usuario();

      this.equipo.sincronizarSesion(
        usuario ? { id: comoMemberId(usuario.id), nombre: usuario.nombre } : null,
      );
    });
  }

  /** El primer aviso adelanta la carga del bloque diferido; no espera al ocio. */
  protected readonly hayAvisos = computed(() => this.avisos.avisos().length > 0);
}
