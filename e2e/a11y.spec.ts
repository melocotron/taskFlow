import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';
import { PASSWORD, crearTarea, crearTablero, entrar, invitar, registrar, salir } from './apoyo';
import type { Cuenta, Tablero } from './apoyo';

/**
 * Auditoría de accesibilidad contra la aplicación real.
 *
 * Cada escenario se crea por API; la sesión es una cookie real. Axe se ejecuta con
 * todas sus reglas por defecto.
 */
async function sinViolaciones(page: Page, pantalla: string): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).analyze();
  const resumen = violations.map((violacion) => ({
    id: violacion.id,
    impacto: violacion.impact,
    ayuda: violacion.help,
    nodos: violacion.nodes.map((nodo) => nodo.target.join(' ')),
  }));

  expect(resumen, `axe encontró violaciones en ${pantalla}`).toEqual([]);
}

/** El foco se ve: el contorno global de `:focus-visible` está aplicado de verdad. */
async function comprobarFocoVisible(page: Page): Promise<void> {
  const foco = await page.evaluate(() => {
    const elemento = document.activeElement as HTMLElement | null;
    const estilos = elemento ? getComputedStyle(elemento) : null;

    return {
      etiqueta: elemento?.tagName ?? 'SIN FOCO',
      estilo: estilos?.outlineStyle ?? '',
      ancho: estilos?.outlineWidth ?? '',
    };
  });

  expect(foco.estilo, `El foco no tiene contorno visible en ${foco.etiqueta}`).toBe('solid');
  expect(foco.ancho, `El contorno del foco mide cero en ${foco.etiqueta}`).not.toBe('0px');
}

/** Avanza con Tab hasta el control indicado, sin usar el ratón. */
async function tabularHasta(page: Page, objetivo: Locator, maximo = 40): Promise<void> {
  for (let paso = 0; paso < maximo; paso++) {
    if (await objetivo.evaluate((elemento) => elemento === document.activeElement)) {
      return;
    }

    await page.keyboard.press('Tab');
  }

  await expect(objetivo, 'No se llegó al control con Tab').toBeFocused();
}

async function abrirDialogoConTeclado(
  page: Page,
  disparador: Locator,
  nombre: string,
): Promise<Locator> {
  await tabularHasta(page, disparador);
  await comprobarFocoVisible(page);
  await page.keyboard.press('Enter');

  const dialogo = page.getByRole('dialog', { name: nombre });
  await expect(dialogo).toBeVisible();
  expect(
    await dialogo.evaluate((elemento) => elemento.contains(document.activeElement)),
    'El foco no entró en el diálogo',
  ).toBe(true);
  await comprobarFocoVisible(page);

  return dialogo;
}

async function tableroConTrabajo(page: Page): Promise<{
  marta: Cuenta;
  ivan: Cuenta;
  tablero: Tablero;
}> {
  const marta = await registrar(page, 'Marta Ruiz');
  const tablero = await crearTablero(page);

  await crearTarea(page, tablero, 'Por hacer', 'Revisar el copy del onboarding', {
    descripcion: 'Ajustar los tres primeros pasos',
    responsableId: marta.id,
  });

  await salir(page);
  const ivan = await registrar(page, 'Iván Soto');
  await salir(page);
  await entrar(page, marta);
  await invitar(page, tablero, ivan, 'editor');
  await crearTarea(page, tablero, 'En curso', 'Preparar la demo del viernes', {
    responsableId: ivan.id,
  });

  return { marta, ivan, tablero };
}

test.describe('auditoría axe', () => {
  test('entrar: sin violaciones', async ({ page }) => {
    await page.goto('/entrar');
    await expect(page.getByRole('heading', { level: 1, name: 'Entra en TaskFlow' })).toBeVisible();
    await sinViolaciones(page, 'entrar');
  });

  test('lista vacía: sin violaciones', async ({ page }) => {
    await registrar(page, 'Marta Ruiz');
    await page.goto('/');

    await expect(page.getByText('No tienes tableros todavía')).toBeVisible();
    await sinViolaciones(page, 'lista vacía');
  });

  test('lista, menú de sesión y creación: sin violaciones', async ({ page }) => {
    await registrar(page, 'Marta Ruiz');
    await crearTablero(page);
    await page.goto('/');

    await expect(page.getByRole('link', { name: /Producto/ })).toBeVisible();
    await sinViolaciones(page, 'lista de tableros');

    await page.getByRole('button', { name: /Marta Ruiz/ }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await sinViolaciones(page, 'menú de sesión');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Nuevo tablero' }).click();
    const dialogo = page.getByRole('dialog', { name: 'Nuevo tablero' });
    await expect(dialogo).toBeVisible();
    await sinViolaciones(page, 'diálogo nuevo tablero');
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();
  });

  test('detalle, acciones y formularios: sin violaciones', async ({ page }) => {
    test.setTimeout(60_000);
    const { tablero } = await tableroConTrabajo(page);
    await page.goto(`/tableros/${tablero.id}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
    await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();
    await sinViolaciones(page, 'detalle del tablero');

    await page.getByRole('button', { name: 'Renombrar' }).click();
    const renombrar = page.getByRole('dialog', { name: 'Renombrar tablero' });
    await expect(renombrar).toBeVisible();
    await sinViolaciones(page, 'diálogo renombrar tablero');
    await page.keyboard.press('Escape');
    await expect(renombrar).toBeHidden();

    await page.getByRole('button', { name: /Personas \(2\)/ }).click();
    const personas = page.getByRole('dialog', { name: 'Personas del tablero' });
    await expect(personas).toBeVisible();
    await sinViolaciones(page, 'diálogo personas');
    await page.keyboard.press('Escape');
    await expect(personas).toBeHidden();

    await page.getByRole('button', { name: 'Acciones de Preparar la demo del viernes' }).click();
    await expect(page.getByRole('menu')).toBeVisible();
    await sinViolaciones(page, 'menú de tarjeta');

    await page.getByRole('menuitem', { name: 'Editar tarjeta' }).click();
    const editar = page.getByRole('dialog', { name: 'Editar tarjeta' });
    await expect(editar).toBeVisible();
    await sinViolaciones(page, 'diálogo editar tarjeta');
    await page.keyboard.press('Escape');
    await expect(editar).toBeHidden();

    await page
      .getByRole('region', { name: 'Por hacer' })
      .getByRole('button', { name: 'Añadir tarjeta' })
      .click();
    const nueva = page.getByRole('dialog', { name: 'Nueva tarjeta en Por hacer' });
    await expect(nueva).toBeVisible();
    await sinViolaciones(page, 'diálogo nueva tarjeta');
    await page.keyboard.press('Escape');
    await expect(nueva).toBeHidden();

    await page.getByRole('button', { name: 'Acciones de Preparar la demo del viernes' }).click();
    await page.getByRole('menuitem', { name: 'Mover a Por hacer' }).click();
    await expect(page.getByRole('status')).toContainText('Preparar la demo del viernes');

    await page
      .locator('app-toast')
      .evaluate((elemento) =>
        Promise.all(elemento.getAnimations().map((animacion) => animacion.finished)),
      );

    await sinViolaciones(page, 'aviso de movimiento');
  });

  test('vista de observadora: sin violaciones', async ({ page }) => {
    const { marta, tablero } = await tableroConTrabajo(page);

    await salir(page);
    const alba = await registrar(page, 'Alba Sanz');
    await salir(page);
    await entrar(page, marta);
    await invitar(page, tablero, alba, 'viewer');
    await salir(page);
    await entrar(page, alba);

    await page.goto(`/tableros/${tablero.id}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
    await expect(page.getByRole('region', { name: 'Por hacer' })).toBeVisible();
    await sinViolaciones(page, 'detalle como observadora');

    await page.getByRole('button', { name: /Personas \(3\)/ }).click();
    const personas = page.getByRole('dialog', { name: 'Personas del tablero' });
    await expect(personas).toBeVisible();
    await expect(personas.getByText('Solo quien administra')).toBeVisible();
    await sinViolaciones(page, 'personas como observadora');
  });

  test('acceso denegado: sin violaciones', async ({ page }) => {
    await registrar(page, 'Marta Ruiz');
    const tablero = await crearTablero(page);

    await salir(page);
    await registrar(page, 'Iván Soto');
    await page.goto(`/tableros/${tablero.id}`);

    await expect(page.getByText('No se encontró ese tablero.')).toBeVisible();
    await sinViolaciones(page, 'acceso denegado');
  });

  test('tablero inexistente: sin violaciones', async ({ page }) => {
    await registrar(page, 'Marta Ruiz');
    await page.goto(`/tableros/${crypto.randomUUID()}`);

    await expect(page.getByText('No se encontró ese tablero.')).toBeVisible();
    await sinViolaciones(page, 'tablero inexistente');
  });

  test('detalle en móvil: sin violaciones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const { tablero } = await tableroConTrabajo(page);
    await page.goto(`/tableros/${tablero.id}`);

    await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
    await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();
    await sinViolaciones(page, 'detalle en móvil');

    await page
      .getByRole('region', { name: 'Por hacer' })
      .getByRole('button', { name: 'Añadir tarjeta' })
      .click();
    const nueva = page.getByRole('dialog', { name: 'Nueva tarjeta en Por hacer' });
    await expect(nueva).toBeVisible();
    await sinViolaciones(page, 'diálogo nueva tarjeta en móvil');
  });
});

test('recorrido completo sin ratón, con foco visible', async ({ page }) => {
  test.setTimeout(60_000);
  const { marta } = await tableroConTrabajo(page);
  await salir(page);
  await page.goto('/entrar');

  const email = page.getByRole('textbox', { name: 'Email' });
  await tabularHasta(page, email);
  await comprobarFocoVisible(page);
  await page.keyboard.type(marta.email);

  const password = page.getByLabel('Contraseña');
  await tabularHasta(page, password);
  await page.keyboard.type(PASSWORD);

  const enviar = page.locator('form').getByRole('button', { name: 'Entrar', exact: true });
  await tabularHasta(page, enviar);
  await comprobarFocoVisible(page);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'TaskFlow' })).toBeVisible();

  const producto = page.getByRole('link', { name: /Producto/ });
  await expect(producto).toBeVisible();
  await tabularHasta(page, producto);
  await comprobarFocoVisible(page);
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();

  const renombrar = page.getByRole('button', { name: 'Renombrar' });
  const dialogoRenombrar = await abrirDialogoConTeclado(page, renombrar, 'Renombrar tablero');
  await page.keyboard.press('Escape');
  await expect(dialogoRenombrar).toBeHidden();
  await expect(renombrar).toBeFocused();

  const personas = page.getByRole('button', { name: /Personas \(2\)/ });
  const dialogoPersonas = await abrirDialogoConTeclado(page, personas, 'Personas del tablero');
  await page.keyboard.press('Escape');
  await expect(dialogoPersonas).toBeHidden();
  await expect(personas).toBeFocused();

  const acciones = page.getByRole('button', {
    name: 'Acciones de Preparar la demo del viernes',
  });
  await tabularHasta(page, acciones);
  await comprobarFocoVisible(page);
  await page.keyboard.press('Enter');

  const menu = page.getByRole('menu');
  await expect(menu).toBeVisible();
  await expect(page.getByRole('menuitem', { name: 'Editar tarjeta' })).toBeFocused();
  await comprobarFocoVisible(page);
  await page.keyboard.press('Escape');
  await expect(menu).toBeHidden();
  await expect(acciones).toBeFocused();

  const anadir = page
    .getByRole('region', { name: 'Por hacer' })
    .getByRole('button', { name: 'Añadir tarjeta' });
  const dialogoNueva = await abrirDialogoConTeclado(page, anadir, 'Nueva tarjeta en Por hacer');
  await page.keyboard.press('Escape');
  await expect(dialogoNueva).toBeHidden();
  await expect(anadir).toBeFocused();
});
