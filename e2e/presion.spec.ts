import { expect, test } from '@playwright/test';

/**
 * El hundido es feedback de puntero y de teclado. La prueba mira la propiedad
 * calculada, no una captura: así no depende de píxeles ni de la escala del sistema.
 */
test('la tarjeta de entrada se hunde al pulsar', async ({ page }) => {
  await page.goto('/entrar');

  const marta = page.getByRole('button', { name: 'Marta Ruiz' });
  await expect(marta).toHaveClass(/presionable/);
  await marta.hover();
  await page.mouse.down();

  await expect(marta).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, 1)');

  await page.mouse.up();
});

test('el hundido se desactiva con prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/entrar');

  const marta = page.getByRole('button', { name: 'Marta Ruiz' });
  await marta.hover();
  await page.mouse.down();

  await expect(marta).toHaveCSS('transform', 'none');

  await page.mouse.up();
});
