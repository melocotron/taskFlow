import { expect, test } from '@playwright/test';

/**
 * Smoke test de S0.4, actualizado en S3.2.
 *
 * No pretende cubrir funcionalidad —los journeys reales llegan en S4.1—: comprueba
 * que la cadena navegador → app compilada → guard → datos → design system sigue viva.
 *
 * Desde S3.1 la raíz está protegida, así que el recorrido empieza en `/entrar`.
 */
test('entrar, crear un tablero y abrir su detalle', async ({ page }) => {
  await page.goto('/');

  // Sin sesión no se entra: el guard manda a la pantalla de entrada.
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole('heading', { level: 1, name: '¿Quién eres?' })).toBeVisible();

  await page.getByRole('button', { name: /Marta Ruiz/ }).click();

  // Con sesión, la raíz es la lista de tableros.
  await expect(page.getByRole('heading', { level: 1, name: 'TaskFlow' })).toBeVisible();

  await page.getByRole('button', { name: 'Nuevo tablero' }).click();

  await page.getByRole('textbox', { name: 'Nombre del tablero' }).fill('Producto');
  await page.getByRole('button', { name: 'Crear tablero' }).click();

  const tarjeta = page.getByRole('link', { name: /Producto/ });
  await expect(tarjeta).toBeVisible();

  await tarjeta.click();

  await expect(page).toHaveURL(/\/tableros\//);
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Por hacer' })).toBeVisible();
  await expect(page.getByText('Este tablero todavía no tiene tarjetas')).toBeVisible();
});
