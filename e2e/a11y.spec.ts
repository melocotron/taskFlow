import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import type { Locator, Page } from '@playwright/test';

type Rol = 'admin' | 'editor' | 'viewer';

interface Pertenencia {
  readonly memberId: string;
  readonly rol: Rol;
}

interface Semilla {
  readonly sesion?: string;
  readonly conTablero?: boolean;
  readonly miembros?: readonly Pertenencia[];
}

const EQUIPO: readonly Pertenencia[] = [
  { memberId: 'marta', rol: 'admin' },
  { memberId: 'ivan', rol: 'editor' },
  { memberId: 'alba', rol: 'viewer' },
];

/**
 * Siembra el escenario. Sin sesión, la aplicación empieza en «¿Quién eres?».
 *
 * La auditoría no modifica datos, así que no hace falta el guardado de «solo la
 * primera vez» que usan los journeys: cada prueba estrena contexto y almacenamiento.
 */
async function sembrar(page: Page, semilla: Semilla = {}): Promise<void> {
  const { sesion, conTablero = true, miembros = EQUIPO } = semilla;

  await page.addInitScript(
    ({
      sesion: id,
      conTablero: hayTablero,
      miembros: equipo,
    }: {
      sesion?: string;
      conTablero: boolean;
      miembros: readonly Pertenencia[];
    }) => {
      if (!hayTablero) {
        localStorage.setItem('taskflow.tableros', '[]');
        localStorage.removeItem('taskflow.tareas');
      } else {
        localStorage.setItem(
          'taskflow.tableros',
          JSON.stringify([
            {
              id: 'producto',
              titulo: 'Producto',
              archivado: false,
              creadoEn: '2026-10-18T00:00:00.000Z',
              miembros: equipo,
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
              columnaId: 'en-curso',
              titulo: 'Preparar la demo del viernes',
              descripcion: '',
              responsable: 'Iván Soto',
              posicion: 0,
              creadoEn: '2026-10-18T00:00:00.000Z',
            },
          ]),
        );
      }

      if (id) {
        localStorage.setItem('taskflow.sesion', id);
      } else {
        localStorage.removeItem('taskflow.sesion');
      }
    },
    { sesion, conTablero, miembros },
  );
}

/**
 * Pasa axe con todas sus reglas por defecto, no solo por las etiquetas WCAG.
 *
 * El mensaje incluye solo lo necesario para saber qué regla y qué nodo fallan; el
 * volcado completo de axe en la consola de Playwright no cabe en una salida útil.
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
async function tabularHasta(page: Page, objetivo: Locator, maximo = 30): Promise<void> {
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

test.describe('auditoría axe', () => {
  test('entrar: sin violaciones', async ({ page }) => {
    await sembrar(page, { conTablero: false });
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1, name: '¿Quién eres?' })).toBeVisible();
    await sinViolaciones(page, 'entrar');
  });

  test('lista vacía: sin violaciones', async ({ page }) => {
    await sembrar(page, { sesion: 'marta', conTablero: false });
    await page.goto('/');

    await expect(page.getByText('No tienes tableros todavía')).toBeVisible();
    await sinViolaciones(page, 'lista vacía');
  });

  test('lista, menú de sesión y creación: sin violaciones', async ({ page }) => {
    await sembrar(page, { sesion: 'marta' });
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
    await sembrar(page, { sesion: 'marta' });
    await page.goto('/tableros/producto');

    await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
    await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();
    await sinViolaciones(page, 'detalle del tablero');

    await page.getByRole('button', { name: 'Renombrar' }).click();
    const renombrar = page.getByRole('dialog', { name: 'Renombrar tablero' });
    await expect(renombrar).toBeVisible();
    await sinViolaciones(page, 'diálogo renombrar tablero');
    await page.keyboard.press('Escape');
    await expect(renombrar).toBeHidden();

    await page.getByRole('button', { name: /Personas \(3\)/ }).click();
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

    // Los avisos viven fuera de `main`; también tienen que estar dentro de un landmark.
    await page.getByRole('button', { name: 'Acciones de Preparar la demo del viernes' }).click();
    await page.getByRole('menuitem', { name: 'Mover a Por hacer' }).click();
    await expect(page.getByRole('status')).toContainText('Preparar la demo del viernes');

    // La entrada del aviso anima la opacidad. Axe debe medirlo ya asentado; si no,
    // calcula el contraste sobre un fotograma intermedio y denuncia un falso positivo.
    await page
      .locator('app-toast')
      .evaluate((elemento) =>
        Promise.all(elemento.getAnimations().map((animacion) => animacion.finished)),
      );

    await sinViolaciones(page, 'aviso de movimiento');
  });

  test('vista de observadora: sin violaciones', async ({ page }) => {
    await sembrar(page, { sesion: 'alba' });
    await page.goto('/tableros/producto');

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
    await sembrar(page, { sesion: 'ivan', miembros: [{ memberId: 'marta', rol: 'admin' }] });
    await page.goto('/tableros/producto');

    await expect(page.getByText('No tienes acceso a este tablero')).toBeVisible();
    await sinViolaciones(page, 'acceso denegado');
  });

  test('tablero inexistente: sin violaciones', async ({ page }) => {
    await sembrar(page, { sesion: 'marta', conTablero: false });
    await page.goto('/tableros/producto');

    await expect(page.getByText('No se encontró ese tablero.')).toBeVisible();
    await sinViolaciones(page, 'tablero inexistente');
  });

  test('detalle en móvil: sin violaciones', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await sembrar(page, { sesion: 'marta' });
    await page.goto('/tableros/producto');

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
  await sembrar(page);

  // Entrar: el primer Tab llega a la primera persona y Enter abre la sesión.
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1, name: '¿Quién eres?' })).toBeVisible();

  const marta = page.getByRole('button', { name: /Marta Ruiz/ });
  await tabularHasta(page, marta);
  await comprobarFocoVisible(page);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { level: 1, name: 'TaskFlow' })).toBeVisible();

  // Lista: Tab recorre «Nuevo tablero», la sesión y el enlace al tablero.
  const producto = page.getByRole('link', { name: /Producto/ });
  await expect(producto).toBeVisible();
  await tabularHasta(page, producto);
  await comprobarFocoVisible(page);
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByText('Revisar el copy del onboarding')).toBeVisible();

  // Renombrar: el diálogo enfoca su primer campo y Escape devuelve el foco.
  const renombrar = page.getByRole('button', { name: 'Renombrar' });
  const dialogoRenombrar = await abrirDialogoConTeclado(page, renombrar, 'Renombrar tablero');
  await page.keyboard.press('Escape');
  await expect(dialogoRenombrar).toBeHidden();
  await expect(renombrar).toBeFocused();

  // Personas: mismo contrato de foco, también desde el botón de la cabecera.
  const personas = page.getByRole('button', { name: /Personas \(3\)/ });
  const dialogoPersonas = await abrirDialogoConTeclado(page, personas, 'Personas del tablero');
  await page.keyboard.press('Escape');
  await expect(dialogoPersonas).toBeHidden();
  await expect(personas).toBeFocused();

  // Menú de una tarjeta: el foco entra en la primera opción y Escape vuelve al disparador.
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

  // Crear: se llega con Tab al botón de la columna y el formulario recibe el foco.
  const anadir = page
    .getByRole('region', { name: 'Por hacer' })
    .getByRole('button', { name: 'Añadir tarjeta' });
  const dialogoNueva = await abrirDialogoConTeclado(page, anadir, 'Nueva tarjeta en Por hacer');
  await page.keyboard.press('Escape');
  await expect(dialogoNueva).toBeHidden();
  await expect(anadir).toBeFocused();
});
