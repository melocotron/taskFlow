import { expect, test } from '@playwright/test';
import { PASSWORD, emailNuevo } from './apoyo';

/**
 * Journey 1: crear una cuenta, un tablero y la primera tarjeta.
 *
 * Empieza sin sesión a propósito: el recorrido incluye el guard, el registro real y
 * la creación desde la interfaz. Termina recargando, porque todo lo que se guarda
 * tiene que seguir ahí.
 */
test('crear una cuenta, un tablero y añadir la primera tarjeta', async ({ page }) => {
  await page.goto('/');

  // Sin sesión no se entra: el guard manda a la pantalla de acceso.
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Entra en TaskFlow' })).toBeVisible();

  await page
    .getByRole('group', { name: 'Entrar o crear cuenta' })
    .getByRole('button', { name: 'Crear cuenta' })
    .click();
  await expect(page.getByRole('heading', { level: 1, name: 'Crea tu cuenta' })).toBeVisible();

  const formulario = page.locator('form');
  await formulario.getByRole('textbox', { name: 'Nombre' }).fill('Marta Ruiz');
  await formulario.getByRole('textbox', { name: 'Email' }).fill(emailNuevo('journey-1'));
  await formulario.getByLabel('Contraseña').fill(PASSWORD);
  await formulario.getByRole('button', { name: 'Crear cuenta' }).click();

  // Con sesión, la raíz es la lista de tableros.
  await expect(page.getByRole('heading', { level: 1, name: 'TaskFlow' })).toBeVisible();

  await page.getByRole('button', { name: 'Nuevo tablero' }).click();

  const dialogoTablero = page.getByRole('dialog', { name: 'Nuevo tablero' });
  await expect(dialogoTablero).toBeVisible();
  await dialogoTablero.getByRole('textbox', { name: 'Nombre del tablero' }).fill('Producto');
  await dialogoTablero.getByRole('button', { name: 'Crear tablero' }).click();
  await expect(dialogoTablero).toBeHidden();

  const enlaceTablero = page.getByRole('link', { name: /Producto/ });
  await expect(enlaceTablero).toBeVisible();
  await enlaceTablero.click();

  await expect(page).toHaveURL(/\/tableros\//);
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();

  const porHacer = page.getByRole('region', { name: 'Por hacer' });
  await expect(porHacer).toBeVisible();
  await expect(page.getByText('Este tablero todavía no tiene tarjetas')).toBeVisible();

  await porHacer.getByRole('button', { name: 'Añadir tarjeta' }).click();

  const dialogoTarjeta = page.getByRole('dialog', { name: 'Nueva tarjeta en Por hacer' });
  await expect(dialogoTarjeta).toBeVisible();
  await dialogoTarjeta.getByRole('textbox', { name: 'Título' }).fill('Revisar el copy');
  await dialogoTarjeta
    .getByRole('textbox', { name: 'Descripción' })
    .fill('Ajustar los tres primeros pasos');
  await dialogoTarjeta
    .getByRole('combobox', { name: 'Responsable' })
    .selectOption({ label: 'Marta Ruiz' });
  await dialogoTarjeta.getByRole('button', { name: 'Crear tarjeta' }).click();
  await expect(dialogoTarjeta).toBeHidden();

  await expect(porHacer.getByText('Revisar el copy', { exact: true })).toBeVisible();
  await expect(porHacer.locator('.cuenta')).toHaveText('1 tarjeta');

  await page.reload();

  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(porHacer.getByText('Revisar el copy', { exact: true })).toBeVisible();
  await expect(porHacer.locator('.cuenta')).toHaveText('1 tarjeta');
});
