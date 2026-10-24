import { expect, test } from '@playwright/test';

/**
 * El hundido es feedback de puntero y de teclado. La prueba mira la propiedad
 * calculada, no una captura: así no depende de píxeles ni de la escala del sistema.
 */
test('el botón de acceso se hunde al pulsar', async ({ page }) => {
  await page.goto('/entrar');

  const entrar = page.locator('form').getByRole('button', { name: 'Entrar', exact: true });
  await entrar.hover();
  await page.mouse.down();

  await expect(entrar).toHaveCSS('transform', 'matrix(0.97, 0, 0, 0.97, 0, 0)');

  await page.mouse.up();
});

test('el hundido se desactiva con prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/entrar');

  const entrar = page.locator('form').getByRole('button', { name: 'Entrar', exact: true });
  await entrar.hover();
  await page.mouse.down();

  await expect(entrar).toHaveCSS('transform', 'none');

  await page.mouse.up();
});
