import { defineConfig, devices } from '@playwright/test';

/**
 * Configuración de E2E.
 *
 * - `webServer` arranca `ng serve` por su cuenta: un solo comando levanta todo.
 * - `reuseExistingServer` evita relanzar el servidor si ya está corriendo en local.
 * - Un solo proyecto (Chromium) hasta que haya journeys que justifiquen más.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 2 : 0,
  workers: process.env['CI'] ? 1 : undefined,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],

  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm start -- --port 4200',
    url: 'http://localhost:4200',
    // Siempre un servidor nuevo. Reutilizar uno viejo sirvió un bundle obsoleto y me
    // hizo diagnosticar un bug de CSS que no existía: mejor 5 s más de arranque.
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
