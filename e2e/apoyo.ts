import { expect } from '@playwright/test';
import type { Page } from '@playwright/test';

/**
 * Apoyo para los E2E contra el backend real.
 *
 * La sesión es una cookie `HttpOnly`; por eso el registro y el login se hacen con
 * `page.request`, que comparte el tarro de cookies con la pestaña. La interfaz se
 * sigue usando para lo que se quiere probar: los recorridos y sus formularios.
 */

export const PASSWORD = 'taskflow-e2e-2026';

export interface Cuenta {
  readonly id: string;
  readonly nombre: string;
  readonly email: string;
}

export interface Columna {
  readonly id: string;
  readonly titulo: string;
  readonly posicion: number;
}

export interface Miembro {
  readonly memberId: string;
  readonly nombre: string;
  readonly email: string;
  readonly rol: string;
}

export interface Tablero {
  readonly id: string;
  readonly titulo: string;
  readonly columnas: readonly Columna[];
  readonly miembros: readonly Miembro[];
}

let secuencia = 0;

export function emailNuevo(prefijo = 'e2e'): string {
  secuencia += 1;

  return `${prefijo}-${Date.now()}-${secuencia}@example.com`;
}

export async function registrar(
  page: Page,
  nombre = 'Marta Ruiz',
  email = emailNuevo(),
): Promise<Cuenta> {
  const respuesta = await page.request.post('/api/v1/auth/register', {
    data: { nombre, email, password: PASSWORD },
  });

  expect(respuesta.status(), await respuesta.text()).toBe(201);

  return (await respuesta.json()) as Cuenta;
}

export async function entrar(page: Page, cuenta: Cuenta): Promise<void> {
  const respuesta = await page.request.post('/api/v1/auth/login', {
    data: { email: cuenta.email, password: PASSWORD },
  });

  expect(respuesta.status(), await respuesta.text()).toBe(200);
}

export async function salir(page: Page): Promise<void> {
  const respuesta = await page.request.post('/api/v1/auth/logout', { data: {} });

  expect(respuesta.status()).toBe(204);
}

export async function crearTablero(page: Page, titulo = 'Producto'): Promise<Tablero> {
  const respuesta = await page.request.post('/api/v1/boards', { data: { titulo } });

  expect(respuesta.status(), await respuesta.text()).toBe(201);

  return (await respuesta.json()) as Tablero;
}

export function columna(tablero: Tablero, titulo: string): Columna {
  const encontrada = tablero.columnas.find((candidata) => candidata.titulo === titulo);

  if (!encontrada) {
    throw new Error(`El tablero no tiene la columna «${titulo}»`);
  }

  return encontrada;
}

export async function crearTarea(
  page: Page,
  tablero: Tablero,
  nombreColumna: string,
  titulo: string,
  datos: { descripcion?: string; responsableId?: string } = {},
): Promise<void> {
  const respuesta = await page.request.post(`/api/v1/boards/${tablero.id}/tasks`, {
    data: {
      columnaId: columna(tablero, nombreColumna).id,
      titulo,
      descripcion: datos.descripcion ?? '',
      responsableId: datos.responsableId ?? null,
    },
  });

  expect(respuesta.status(), await respuesta.text()).toBe(201);
}

export async function invitar(
  page: Page,
  tablero: Tablero,
  cuenta: Cuenta,
  rol: 'admin' | 'editor' | 'viewer' = 'viewer',
): Promise<Miembro> {
  const respuesta = await page.request.post(`/api/v1/boards/${tablero.id}/members`, {
    data: { email: cuenta.email, rol },
  });

  expect(respuesta.status(), await respuesta.text()).toBe(201);

  return (await respuesta.json()) as Miembro;
}

/**
 * Crea un tablero con dos personas y dos tarjetas:
 * Marta (administradora) e Iván (editor) con una tarjeta asignada a cada uno.
 */
export async function escenarioConEquipo(page: Page): Promise<{
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

  return { marta, ivan, tablero };
}
