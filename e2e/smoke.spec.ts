import { expect, test } from '@playwright/test';

/**
 * Smoke test de S0.4.
 *
 * Su valor no es cubrir funcionalidad: es demostrar que la cadena
 * navegador → app compilada → aserción por rol funciona. Los journeys reales
 * llegan en S4.1.
 */
test('la aplicación arranca y muestra TaskFlow', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1, name: 'TaskFlow' })).toBeVisible();
});
