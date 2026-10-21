import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Journey 2 del PLAN: mover una tarea entre columnas con ratón y con teclado.
 *
 * El arrastre no se puede probar en jsdom: el CDK mide píxeles. Aquí se mueve con el
 * ratón de verdad y, sobre todo, se comprueba lo que pide el sprint: que el movimiento
 * **sobreviva a la recarga**. El recorrido de teclado abre el menú de acciones, baja
 * con las flechas y confirma con Enter.
 *
 * Todavía se siembra el tablero en el almacenamiento: aquí interesa el arrastre sobre
 * tarjetas ya colocadas, no el camino de creación, que es el journey 1.
 */
async function sembrarTablero(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // Solo la primera vez: si no, cada recarga volvería a sembrar y no se probaría nada.
    if (localStorage.getItem('taskflow.tareas')) {
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
          descripcion: '',
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

  // `press` enfoca el control y lo activa con el teclado: no hay ratón en este camino.
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

  // El CDK mide el movimiento: hay que soltar con pasos intermedios, no de un salto.
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
