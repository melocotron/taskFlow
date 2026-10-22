import { expect, test } from '@playwright/test';

/**
 * El laboratorio vive fuera del producto y demuestra las tres APIs sin backend.
 * La prueba cubre el camino completo: ruta lazy, provider de HTTP, interceptor,
 * `httpResource` y carga diferida con `injectAsync`.
 */
test('el laboratorio v22 carga DI perezosa y httpResource', async ({ page }) => {
  await page.goto('/kitchen-sink');

  await expect(page.getByRole('heading', { name: 'Angular 22: DI y recursos' })).toBeVisible();
  await expect(page.getByText('Producto · 3 tarjetas')).toBeVisible();

  await page.getByRole('button', { name: 'Cargar servicio bajo demanda' }).click();

  await expect(page.getByText('Servicio cargado bajo demanda con injectAsync().')).toBeVisible();
});
