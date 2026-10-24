import { expect, test } from '@playwright/test';
import { registrar } from './apoyo';

/**
 * La versión 1.0 guardaba tableros y tarjetas en `localStorage`. Al estrenar
 * cuenta, la interfaz ofrece traerlos una sola vez y el servidor usa `legacy_id`
 * para que repetir la operación no duplique nada.
 */
test('importa el trabajo local y no lo repite tras recargar', async ({ page }) => {
  await page.goto('/');

  await page.evaluate(() => {
    localStorage.setItem(
      'taskflow.tableros',
      JSON.stringify([
        {
          id: 'legacy-board-1',
          titulo: 'Proyecto heredado',
          archivado: false,
          creadoEn: '2026-01-10T09:00:00.000Z',
          columnas: [{ id: 'legacy-col-1', titulo: 'Por hacer' }],
        },
      ]),
    );
    localStorage.setItem(
      'taskflow.tareas',
      JSON.stringify([
        {
          id: 'legacy-task-1',
          boardId: 'legacy-board-1',
          columnaId: 'legacy-col-1',
          titulo: 'Tarea heredada',
          descripcion: '',
          responsable: null,
          posicion: 0,
          creadoEn: '2026-01-10T09:05:00.000Z',
        },
      ]),
    );
  });

  await registrar(page, 'Marta Importa');
  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: 'Encontramos trabajo guardado en este navegador' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Importar mis datos' }).click();

  await expect(page.getByText('Importados 1 tablero y 1 tarjeta')).toBeVisible();
  await expect(page.getByRole('link', { name: /Proyecto heredado/ })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Encontramos trabajo guardado en este navegador' }),
  ).toBeHidden();

  await page.reload();

  await expect(page.getByRole('link', { name: /Proyecto heredado/ })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Encontramos trabajo guardado en este navegador' }),
  ).toBeHidden();
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('taskflow.tableros')))
    .toBeNull();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('taskflow.tareas'))).toBeNull();
});
