import { expect, test } from '@playwright/test';

/**
 * S4.3: la aplicación es zoneless.
 *
 * Angular 22 arranca así por defecto, pero un `polyfills` viejo o una dependencia
 * que importe `zone.js` lo revertiría sin que los tests unitarios lo notaran.
 */
test('la aplicación arranca sin zone.js', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: 'Entra en TaskFlow' })).toBeVisible();

  expect(await page.evaluate(() => 'Zone' in window)).toBe(false);
});
