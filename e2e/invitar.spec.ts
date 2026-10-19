import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

type Rol = 'admin' | 'editor' | 'viewer';

interface Pertenencia {
  readonly memberId: string;
  readonly rol: Rol;
}

/**
 * Compartir un tablero.
 *
 * La historia 4 del spec: quien administra invita y decide si la otra persona puede
 * editar o solo mirar. El rol es **por tablero**, así que el recorrido termina
 * cambiando de sesión: la misma persona ve el tablero sin ninguna acción de edición.
 */
async function sembrarTablero(
  page: Page,
  sesion: string,
  miembros: readonly Pertenencia[],
): Promise<void> {
  await page.addInitScript(
    ({ sesion: id, miembros: equipo }: { sesion: string; miembros: readonly Pertenencia[] }) => {
      // Solo la primera vez: si no, cada recarga desharía la invitación.
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
            miembros: equipo,
          },
        ]),
      );

      localStorage.setItem('taskflow.sesion', id);
    },
    { sesion, miembros },
  );
}

test('invitar como observadora: ve el tablero, pero ninguna acción de edición', async ({
  page,
}) => {
  await sembrarTablero(page, 'marta', [{ memberId: 'marta', rol: 'admin' }]);
  await page.goto('/tableros/producto');

  await page.getByRole('button', { name: /Personas \(1\)/ }).click();

  const dialogo = page.getByRole('dialog', { name: 'Personas del tablero' });
  await expect(dialogo).toBeVisible();

  await dialogo.getByRole('combobox', { name: 'Persona' }).selectOption({ label: 'Alba Sanz' });
  await dialogo
    .getByRole('combobox', { name: 'Rol', exact: true })
    .selectOption({ label: 'Solo lectura' });
  await dialogo.getByRole('button', { name: 'Invitar' }).click();

  const filaAlba = dialogo.locator('li', { hasText: 'Alba Sanz' });
  await expect(filaAlba).toBeVisible();
  await expect(filaAlba).toContainText('Solo lectura');

  // Cerrar y cambiar de persona: la invitación tiene que servir para entrar de verdad.
  await page.keyboard.press('Escape');
  await expect(dialogo).toBeHidden();

  await page.getByRole('link', { name: /Todos los tableros/ }).click();
  await page.getByRole('button', { name: /Marta Ruiz/ }).click();
  await page.getByRole('menuitem', { name: 'Alba Sanz' }).click();

  await expect(page.getByText('Tu rol: Solo lectura')).toBeVisible();

  await page.getByRole('link', { name: /Producto/ }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Por hacer' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Renombrar' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Añadir tarjeta' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Acciones de / })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /Personas \(2\)/ })).toBeVisible();

  // El acceso y el rol sobreviven a la recarga, igual que el resto de datos.
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Producto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Renombrar' })).toHaveCount(0);
});

test('quien no es miembro no entra por una URL directa', async ({ page }) => {
  await sembrarTablero(page, 'ivan', [{ memberId: 'marta', rol: 'admin' }]);
  await page.goto('/tableros/producto');

  await expect(page.getByText('No tienes acceso a este tablero')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Por hacer' })).toHaveCount(0);
});

test('quien solo observa abre Personas, pero no ve el formulario de invitación', async ({
  page,
}) => {
  await sembrarTablero(page, 'alba', [
    { memberId: 'marta', rol: 'admin' },
    { memberId: 'alba', rol: 'viewer' },
  ]);
  await page.goto('/tableros/producto');

  await page.getByRole('button', { name: /Personas \(2\)/ }).click();

  const dialogo = page.getByRole('dialog', { name: 'Personas del tablero' });
  await expect(dialogo).toBeVisible();
  await expect(dialogo.getByText('Solo quien administra')).toBeVisible();
  await expect(dialogo.getByRole('button', { name: 'Invitar' })).toHaveCount(0);
  await expect(dialogo.getByRole('combobox', { name: 'Persona' })).toHaveCount(0);
});
