import { expect, test } from '@playwright/test';
import { crearTablero, entrar, invitar, registrar, salir } from './apoyo';

/**
 * Renombrar un tablero y comprobar que el cambio sobrevive a la recarga.
 *
 * El rol se decide en el servidor: una persona observadora no recibe el botón y
 * tampoco podría renombrar llamando a la API.
 */
test('renombrar desde el detalle y conservarlo tras recargar', async ({ page }) => {
  await registrar(page, 'Marta Ruiz');
  const tablero = await crearTablero(page);
  await page.goto(`/tableros/${tablero.id}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();

  await page.getByRole('button', { name: 'Renombrar' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Renombrar tablero' });
  const campo = dialogo.getByRole('textbox', { name: 'Nombre del tablero' });

  await expect(campo).toHaveValue('Producto');
  await expect(campo).toBeFocused();
  await campo.fill('Producto digital');
  await dialogo.getByRole('button', { name: 'Guardar nombre' }).click();

  await expect(dialogo).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: 'Producto digital' })).toBeVisible();

  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'Producto digital' })).toBeVisible();
});

test('no deja el tablero sin nombre', async ({ page }) => {
  await registrar(page, 'Marta Ruiz');
  const tablero = await crearTablero(page);
  await page.goto(`/tableros/${tablero.id}`);

  await page.getByRole('button', { name: 'Renombrar' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Renombrar tablero' });
  await dialogo.getByRole('textbox', { name: 'Nombre del tablero' }).fill('');
  await dialogo.getByRole('button', { name: 'Guardar nombre' }).click();

  await expect(dialogo.getByRole('alert')).toHaveText('Ponle un nombre al tablero');
  await expect(dialogo).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
});

test('quien solo observa no ve el botón de renombrar', async ({ page }) => {
  const marta = await registrar(page, 'Marta Ruiz');
  const tablero = await crearTablero(page);

  await salir(page);
  const alba = await registrar(page, 'Alba Sanz');
  await salir(page);
  await entrar(page, marta);
  await invitar(page, tablero, alba, 'viewer');

  await salir(page);
  await entrar(page, alba);
  await page.goto(`/tableros/${tablero.id}`);

  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Renombrar' })).toHaveCount(0);
});
