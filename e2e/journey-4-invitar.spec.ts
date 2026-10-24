import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { crearTablero, entrar, invitar, registrar, salir } from './apoyo';
import type { Cuenta, Tablero } from './apoyo';

/**
 * Journey 4: invitar a una cuenta y comprobar el rol por tablero.
 *
 * La invitación es por email y la cuenta tiene que existir. El recorrido termina
 * entrando con la persona invitada: el servidor decide el acceso en cada petición.
 */
async function conDosCuentas(page: Page): Promise<{
  marta: Cuenta;
  alba: Cuenta;
  tablero: Tablero;
}> {
  const marta = await registrar(page, 'Marta Ruiz');
  const tablero = await crearTablero(page);

  await salir(page);
  const alba = await registrar(page, 'Alba Sanz');
  await salir(page);
  await entrar(page, marta);

  return { marta, alba, tablero };
}

test('invitar como administradora: la otra cuenta ve el tablero en solo lectura', async ({
  page,
}) => {
  const { alba, tablero } = await conDosCuentas(page);

  await page.goto(`/tableros/${tablero.id}`);
  await page.getByRole('button', { name: /Personas \(1\)/ }).click();

  const dialogo = page.getByRole('dialog', { name: 'Personas del tablero' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText('registrado antes')).toBeVisible();

  await dialogo.getByRole('textbox', { name: 'Email' }).fill(alba.email);
  await dialogo
    .getByRole('combobox', { name: 'Rol', exact: true })
    .selectOption({ label: 'Solo lectura' });
  await dialogo.getByRole('button', { name: 'Invitar' }).click();

  const filaAlba = dialogo.locator('li', { hasText: 'Alba Sanz' });
  await expect(filaAlba).toBeVisible();
  await expect(filaAlba).toContainText('Solo lectura');

  const aviso = page.getByRole('status');
  await expect(aviso).toContainText('«Alba Sanz» · Solo lectura');
  await aviso.getByRole('button', { name: 'Cerrar el aviso' }).click();
  await expect(page.locator('app-toast')).toHaveCount(0);

  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();

  await salir(page);
  await entrar(page, alba);
  await page.goto('/');
  await expect(page.getByText('Tu rol: Solo lectura')).toBeVisible();

  await page.getByRole('link', { name: /Producto/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Por hacer' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Renombrar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Añadir tarjeta' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Acciones de / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Personas \(2\)/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Renombrar' })).toHaveCount(0);
});

test('quien no es miembro no entra por una URL directa', async ({ page }) => {
  await registrar(page, 'Marta Ruiz');
  const tablero = await crearTablero(page);

  await salir(page);
  await registrar(page, 'Iván Soto');
  await page.goto(`/tableros/${tablero.id}`);

  await expect(page.getByText('No se encontró ese tablero.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Por hacer' })).toHaveCount(0);
});

test('quien solo observa abre Personas, pero no ve el formulario de invitación', async ({
  page,
}) => {
  const { alba, tablero } = await conDosCuentas(page);
  await invitar(page, tablero, alba, 'viewer');

  await salir(page);
  await entrar(page, alba);
  await page.goto(`/tableros/${tablero.id}`);

  await page.getByRole('button', { name: /Personas \(2\)/ }).click();

  const dialogo = page.getByRole('dialog', { name: 'Personas del tablero' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText('Solo quien administra')).toBeVisible();
  await expect(dialogo.getByRole('button', { name: 'Invitar' })).toHaveCount(0);
  await expect(dialogo.getByRole('textbox', { name: 'Email' })).toHaveCount(0);
});
