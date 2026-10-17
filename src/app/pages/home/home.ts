import { Component } from '@angular/core';

/**
 * Página de arranque. Existe para probar el esqueleto: alias `@pages/*`,
 * lazy loading y boundaries. Se sustituye en la Fase 3 por `board-list`.
 */
@Component({
  selector: 'app-home',
  template: `
    <main class="home">
      <h1>TaskFlow</h1>
      <p>Esqueleto listo: FSD, alias y lazy routing funcionando.</p>
      <p class="siguiente">Siguiente: design system (Fase 1).</p>
    </main>
  `,
  styles: `
    .home {
      display: grid;
      align-content: center;
      gap: 0.5rem;
      min-height: 100dvh;
      padding: 2rem;
      font-family: system-ui, sans-serif;
    }

    h1 {
      margin: 0;
      font-size: 2rem;
      letter-spacing: -0.02em;
    }

    p {
      margin: 0;
    }

    .siguiente {
      font-size: 0.875rem;
      opacity: 0.6;
    }
  `,
})
export default class HomePage {}
