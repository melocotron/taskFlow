import { expect, test } from '@playwright/test';
import { crearTarea, escenarioConEquipo } from './apoyo';

/**
 * Journey 2: mover una tarea entre columnas con ratón y con teclado.
 *
 * El escenario se crea por API para que el test se centre en el arrastre, pero el
 * movimiento y la recarga pasan por la interfaz y por PostgreSQL.
 */
test.beforeEach(async ({ page }) => {
  const { ivan, tablero } = await escenarioConEquipo(page);

  await crearTarea(page, tablero, 'Por hacer', 'Preparar la demo del viernes', {
    responsableId: ivan.id,
  });

  await page.goto(`/tableros/${tablero.id}`);
  await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();
});

test('mover con el menú y seguir movida tras recargar', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });
  const enCurso = page.getByRole('region', { name: 'En curso' });
  const tarjeta = porHacer.locator('li', { hasText: 'Preparar la demo del viernes' });

  await tarjeta.getByRole('button', { name: /^Acciones de / }).click();
  await page.getByRole('menuitem', { name: 'Mover a En curso' }).click();

  await expect(enCurso.getByText('Preparar la demo del viernes')).toBeVisible();
  await expect(porHacer.getByText('Preparar la demo del viernes')).toHaveCount(0);

  await page.reload();

  await expect(enCurso.getByText('Preparar la demo del viernes')).toBeVisible();
});

test('mover con el teclado: abrir acciones, bajar y confirmar', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });
  const enCurso = page.getByRole('region', { name: 'En curso' });
  const disparador = porHacer.getByRole('button', {
    name: 'Acciones de Preparar la demo del viernes',
  });

  await disparador.press('Enter');

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Editar tarjeta' })).toBeFocused();

  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Mover a En curso' })).toBeFocused();
  await page.keyboard.press('Enter');

  await expect(menu).toBeHidden();
  await expect(enCurso.getByText('Preparar la demo del viernes')).toBeVisible();
  await expect(porHacer.getByText('Preparar la demo del viernes')).toHaveCount(0);

  await page.reload();

  await expect(enCurso.getByText('Preparar la demo del viernes')).toBeVisible();
});

test('reordenar dentro de la misma columna', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });
  const primera = porHacer.locator('li', { hasText: 'Revisar el copy del onboarding' });
  const segunda = porHacer.locator('li', { hasText: 'Preparar la demo del viernes' });

  const cajaSegunda = (await segunda.boundingBox())!;
  const cajaPrimera = (await primera.boundingBox())!;

  await segunda.hover();
  await page.mouse.down();
  await page.mouse.move(cajaSegunda.x + 40, cajaSegunda.y - 10, { steps: 5 });
  await page.mouse.move(cajaPrimera.x + 40, cajaPrimera.y + 10, { steps: 10 });
  await page.mouse.move(cajaPrimera.x + 45, cajaPrimera.y + 5, { steps: 5 });
  await page.mouse.up();

  await expect(porHacer.locator('li').first()).toContainText('Preparar la demo del viernes');

  await page.reload();

  await expect(porHacer.locator('li').first()).toContainText('Preparar la demo del viernes');
});

test('arrastrar una tarjeta a otra columna con el ratón', async ({ page }) => {
  const porHacer = page.getByRole('region', { name: 'Por hacer' });
  const hecho = page.getByRole('region', { name: 'Hecho' });

  const origen = porHacer.locator('li', { hasText: 'Preparar la demo del viernes' });
  const cajaOrigen = (await origen.boundingBox())!;
  const cajaDestino = (await hecho.locator('ul').boundingBox())!;

  await origen.hover();
  await page.mouse.down();
  await page.mouse.move(cajaOrigen.x + 40, cajaOrigen.y + 60, { steps: 5 });
  await page.mouse.move(cajaDestino.x + 40, cajaDestino.y + 20, { steps: 12 });
  await page.mouse.move(cajaDestino.x + 45, cajaDestino.y + 30, { steps: 5 });
  await page.mouse.up();

  await expect(hecho.getByText('Preparar la demo del viernes')).toBeVisible();
  await expect(porHacer.getByText('Preparar la demo del viernes')).toHaveCount(0);

  await page.reload();

  await expect(hecho.getByText('Preparar la demo del viernes')).toBeVisible();
});
