import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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

  /** El primer aviso adelanta la carga del bloque diferido; no espera al ocio. */
  protected readonly hayAvisos = computed(() => this.avisos.avisos().length > 0);
}
