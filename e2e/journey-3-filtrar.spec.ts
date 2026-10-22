import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Journey 3 del PLAN: filtrar tareas y que el filtro sobreviva a la recarga.
 *
 * El filtro no es un estado de pantalla: vive en la URL. Por eso lo que más importa
 * aquí es que **recargar no lo pierda** y que la barra siga escribiendo en la URL
 * mientras se teclea, sin comerse caracteres por el camino. El resto de pruebas de
 * este archivo cubren los bordes del mismo recorrido: persona, sin acentos y vacío.
 */
async function sembrarTablero(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Solo la primera vez: si no, cada recarga sembraría otra vez y el filtro no probaría nada.
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

    localStorage.setItem(
      'taskflow.tareas',
      JSON.stringify([
        {
          id: 'a',
          boardId: 'producto',
          columnaId: 'por-hacer',
          titulo: 'Revisar el copy del onboarding',
          descripcion: 'Ajustar los tres primeros pasos',
          responsable: 'Marta Ruiz',
          posicion: 0,
          creadoEn: '2026-10-18T00:00:00.000Z',
        },
        {
          id: 'b',
          boardId: 'producto',
          columnaId: 'por-hacer',
          titulo: 'Preparar la demo del viernes',
          descripcion: '',
          responsable: 'Iván Soto',
          posicion: 1,
          creadoEn: '2026-10-18T00:00:00.000Z',
        },
        {
          id: 'c',
          boardId: 'producto',
          columnaId: 'en-curso',
          titulo: 'Migrar el buscador a signals',
          descripcion: 'Revisión de los textos',
          responsable: 'Iván Soto',
          posicion: 0,
          creadoEn: '2026-10-18T00:00:00.000Z',
        },
        {
          id: 'd',
          boardId: 'producto',
          columnaId: 'hecho',
          titulo: 'Cerrar el sprint',
          descripcion: '',
          responsable: null,
          posicion: 0,
          creadoEn: '2026-10-18T00:00:00.000Z',
        },
      ]),
    );

    localStorage.setItem('taskflow.sesion', 'marta');
  });
}

test.beforeEach(async ({ page }) => {
  await sembrarTablero(page);
  await page.goto('/tableros/producto');
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
  await expect(page).toHaveURL(/persona=ivan/);

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
