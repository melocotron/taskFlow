import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Renombrar un tablero.
 *
 * El store sabía renombrar desde S2.1 y la interfaz no lo ofrecía en ninguna parte:
 * este recorrido comprueba que ahora es una acción de verdad y que sobrevive a la
 * recarga, que es lo que promete el spec para todo lo que se guarda.
 */
async function sembrarTablero(page: Page, sesion: 'marta' | 'alba'): Promise<void> {
  await page.addInitScript((id: string) => {
    // Solo la primera vez: si no, cada recarga desharía el renombrado.
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

    localStorage.setItem('taskflow.sesion', id);
  }, sesion);
}

test('renombrar desde el detalle y conservarlo tras recargar', async ({ page }) => {
  await sembrarTablero(page, 'marta');
  await page.goto('/tableros/producto');

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
  await sembrarTablero(page, 'marta');
  await page.goto('/tableros/producto');

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
  await sembrarTablero(page, 'alba');
  await page.goto('/tableros/producto');

  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Renombrar' })).toHaveCount(0);
});
