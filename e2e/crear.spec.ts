import { expect, test } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

/**
 * Crear y editar tarjetas de verdad.
 *
 * El formulario es la primera pieza con Signal Forms y la que cierra el pendiente de
 * S3.3: hasta ahora no había forma de añadir la primera tarjeta desde la interfaz.
 * Aquí se comprueba el recorrido completo y, sobre todo, que el resultado sobrevive a
 * la recarga, que es lo que promete el spec.
 */
async function sembrarTableroVacio(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Solo la primera vez: si no, cada recarga borraría lo creado.
    if (localStorage.getItem('taskflow.tableros')) {
      return;
    }

    localStorage.setItem(
      'taskflow.tableros',
      JSON.stringify([
        {
          id: 'producto',
          titulo: 'Producto',
          archivado: false,
          creadoEn: '2026-10-18T00:00:00.000Z',
          columnas: [
            { id: 'por-hacer', titulo: 'Por hacer' },
            { id: 'en-curso', titulo: 'En curso' },
            { id: 'hecho', titulo: 'Hecho' },
          ],
        },
      ]),
    );

    localStorage.setItem('taskflow.sesion', 'marta');
  });
}

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

test.beforeEach(async ({ page }) => {
  await sembrarTableroVacio(page);
  await page.goto('/tableros/producto');
});

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
  await expect(dialogo.getByRole('textbox', { name: 'Título' })).toHaveValue('Revisar el copy');
  await expect(dialogo.getByRole('combobox', { name: 'Responsable' })).toHaveValue('Marta Ruiz');

  await dialogo.getByRole('textbox', { name: 'Título' }).fill('Revisar el copy final');
  await dialogo.getByRole('button', { name: 'Guardar cambios' }).click();

  await expect(dialogo).toBeHidden();
  await expect(porHacer.getByText('Revisar el copy final')).toBeVisible();
  await expect(porHacer.getByText('Revisar el copy', { exact: true })).toHaveCount(0);

  await page.reload();

  await expect(porHacer.getByText('Revisar el copy final')).toBeVisible();
});
