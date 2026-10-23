import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { crearTablero, registrar } from './apoyo';
import type { Cuenta, Tablero } from './apoyo';

/**
 * Crear y editar tarjetas de verdad.
 *
 * Cada prueba estrena cuenta y tablero en PostgreSQL. Lo que se comprueba es el
 * formulario, el responsable por identificador y que el resultado sobrevive a la
 * recarga.
 */
let marta: Cuenta;
let tablero: Tablero;

test.beforeEach(async ({ page }) => {
  marta = await registrar(page, 'Marta Ruiz');
  tablero = await crearTablero(page);
  await page.goto(`/tableros/${tablero.id}`);
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
});

async function abrirFormularioNuevo(page: Page): Promise<Locator> {
  await page
    .getByRole('region', { name: 'Por hacer' })
    .getByRole('button', { name: 'Añadir tarjeta' })
    .click();

  const dialogo = page.getByRole('dialog', { name: 'Nueva tarjeta en Por hacer' });
  await expect(dialogo).toBeVisible();

  return dialogo;
}

async function crearTarjeta(page: Page, titulo: string): Promise<void> {
  const dialogo = await abrirFormularioNuevo(page);

  await dialogo.getByRole('textbox', { name: 'Título' }).fill(titulo);
  await dialogo
    .getByRole('textbox', { name: 'Descripción' })
    .fill('Ajustar los tres primeros pasos');
  await dialogo
    .getByRole('combobox', { name: 'Responsable' })
    .selectOption({ label: 'Marta Ruiz' });
  await dialogo.getByRole('button', { name: 'Crear tarjeta' }).click();

  await expect(dialogo).toBeHidden();
}

test('crear la primera tarjeta desde la columna y verla tras recargar', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });

  await expect(page.getByText('Este tablero todavía no tiene tarjetas')).toBeVisible();

  await crearTarjeta(page, 'Revisar el copy');

  await expect(porHacer.getByText('Revisar el copy', { exact: true })).toBeVisible();
  await expect(porHacer.getByText('Ajustar los tres primeros pasos')).toBeVisible();
  await expect(porHacer.locator('.tarjeta-responsable')).toContainText('Marta Ruiz');
  await expect(porHacer.locator('.cuenta')).toHaveText('1 tarjeta');

  await page.reload();

  await expect(porHacer.getByText('Revisar el copy', { exact: true })).toBeVisible();
  await expect(porHacer.locator('.cuenta')).toHaveText('1 tarjeta');
});

test('no guarda una tarjeta sin título y lo explica en el campo', async ({ page }) => {
  const dialogo = await abrirFormularioNuevo(page);

  await dialogo.getByRole('button', { name: 'Crear tarjeta' }).click();

  await expect(dialogo.getByRole('alert')).toHaveText('Escribe qué hay que hacer');
  await expect(dialogo).toBeVisible();

  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();
  await expect(page.getByText('Este tablero todavía no tiene tarjetas')).toBeVisible();
});

test('editar desde la tarjeta y conservar el cambio tras recargar', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });

  await crearTarjeta(page, 'Revisar el copy');

  await porHacer.getByRole('button', { name: 'Acciones de Revisar el copy' }).click();
  await page.getByRole('menuitem', { name: 'Editar tarjeta' }).click();

  const dialogo = page.getByRole('dialog', { name: 'Editar tarjeta' });
  const responsable = dialogo.getByRole('combobox', { name: 'Responsable' });

  await expect(dialogo.getByRole('textbox', { name: 'Título' })).toHaveValue('Revisar el copy');
  await expect(responsable.locator('option:checked')).toHaveText('Marta Ruiz');
  await expect(responsable).toHaveValue(marta.id);

  await dialogo.getByRole('textbox', { name: 'Título' }).fill('Revisar el copy final');
  await dialogo.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(dialogo).toBeHidden();
  await expect(porHacer.getByText('Revisar el copy final')).toBeVisible();
  await expect(porHacer.getByText('Revisar el copy', { exact: true })).toHaveCount(0);

  await page.reload();

  await expect(porHacer.getByText('Revisar el copy final')).toBeVisible();
});
