import { expect, test } from '@playwright/test';
import { crearTarea, escenarioConEquipo } from './apoyo';

/**
 * Journey 3: filtrar tareas y que el filtro sobreviva a la recarga.
 *
 * El filtro vive en la URL. Por eso lo que más importa aquí es que recargar no lo
 * pierda y que la barra siga escribiendo en la URL mientras se teclea.
 */
test.beforeEach(async ({ page }) => {
  const { ivan, tablero } = await escenarioConEquipo(page);

  await crearTarea(page, tablero, 'Por hacer', 'Preparar la demo del viernes', {
    responsableId: ivan.id,
  });
  await crearTarea(page, tablero, 'En curso', 'Migrar el buscador a signals', {
    descripcion: 'Revisión de los textos',
    responsableId: ivan.id,
  });
  await crearTarea(page, tablero, 'Hecho', 'Cerrar el sprint');

  await page.goto(`/tableros/${tablero.id}`);
  await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();
});

test('buscar filtra al escribir y la recarga conserva el filtro', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });
  const buscador = page.getByRole('searchbox', { name: 'Buscar' });

  await buscador.fill('copy');

  await expect(porHacer.getByText('Revisar el copy del onboarding')).toBeVisible();
  await expect(porHacer.getByText('Preparar la demo del viernes')).toHaveCount(0);
  await expect(page.locator('.estado-filtro')).toHaveText('1 de 4 tarjetas');
  await expect(page).toHaveURL(/q=copy/);

  await page.reload();

  await expect(page.getByRole('searchbox', { name: 'Buscar' })).toHaveValue('copy');
  await expect(porHacer.getByText('Preparar la demo del viernes')).toHaveCount(0);
  await expect(page).toHaveURL(/q=copy/);
});

test('teclear deprisa no pierde caracteres ni desincroniza la URL', async ({ page }) => {
  const buscador = page.getByRole('searchbox', { name: 'Buscar' });

  await buscador.pressSequentially('copy', { delay: 60 });

  await expect(buscador).toHaveValue('copy');
  await expect(page).toHaveURL(/q=copy/);
});

test('busca en la descripción y sin acentos', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Buscar' }).fill('revision');

  await expect(
    page.getByRole('region', { name: 'En curso' }).getByText('Migrar el buscador a signals'),
  ).toBeVisible();
  await expect(page.locator('.estado-filtro')).toHaveText('1 de 4 tarjetas');
});

test('filtrar por persona y quitar el filtro', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });

  await page.getByRole('combobox', { name: 'Responsable' }).selectOption({ label: 'Iván Soto' });

  await expect(porHacer.getByText('Preparar la demo del viernes')).toBeVisible();
  await expect(porHacer.getByText('Revisar el copy del onboarding')).toHaveCount(0);
  await expect(page).toHaveURL(/persona=/);

  await page.getByRole('button', { name: 'Quitar filtro' }).click();

  await expect(porHacer.getByText('Revisar el copy del onboarding')).toBeVisible();
  await expect(page).not.toHaveURL(/persona=/);
  await expect(page.getByRole('combobox', { name: 'Responsable' })).toHaveValue('');
});

test('avisa cuando nada coincide', async ({ page }) => {
  await page.getByRole('searchbox', { name: 'Buscar' }).fill('zzzz');

  await expect(page.locator('.estado-filtro')).toHaveText('0 de 4 tarjetas');
  await expect(page.getByText('Ninguna tarjeta coincide con el filtro')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Quitar filtro' })).toBeVisible();
});
