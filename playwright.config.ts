import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://localhost:4200';
const apiURL = 'http://localhost:8080';
const databaseURL =
  process.env['DATABASE_URL'] ??
  'postgres://taskflow:taskflow@localhost:5432/taskflow?sslmode=disable';

/**
 * Configuración de E2E.
 *
 * - Arranca la API Go y `ng serve`; los recorridos usan PostgreSQL de verdad.
 * - En local reutiliza los servidores que ya estén levantados.
 * - En CI siempre arranca limpio y aplica las migraciones antes de la API.
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
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: [
    {
      command: 'go run ./cmd/migrate up && go run ./cmd/api',
      cwd: './backend',
      url: `${apiURL}/healthz`,
      reuseExistingServer: !process.env['CI'],
      timeout: 180_000,
      env: {
        DATABASE_URL: databaseURL,
        HTTP_ADDR: ':8080',
        APP_ENV: 'e2e',
        COOKIE_SECURE: 'false',
        COOKIE_NAME: 'taskflow_session',
        ALLOWED_ORIGINS: `${baseURL},${apiURL}`,
      },
    },
    {
      command: 'npm start -- --port 4200',
      url: baseURL,
      // En local se reutiliza el bundle que ya está sirviendo; en CI siempre es nuevo.
      reuseExistingServer: !process.env['CI'],
      timeout: 120_000,
    },
  ],
});
