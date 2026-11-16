import { expect, test } from '@playwright/test';
import { iniciarSesion, registrar } from './support/api';
import { nuevoUsuario } from './support/datos';

test.describe('Registro e inicio de sesión', () => {
  test('una persona crea su cuenta de adoptante, entra y cierra sesión', async ({ page }) => {
    const u = nuevoUsuario('ADOPTANTE');

    await page.goto('/registro');
    await page.getByLabel('Adoptar o comprar un animal').check();
    await page.getByLabel('Nombre completo').fill(u.nombre);
    await page.getByLabel('Email').fill(u.email);
    await page.locator('#password').fill(u.password);
    await page.getByLabel(/Celular/).fill(u.telefono);
    await page.getByLabel(/Ciudad/).fill(u.ciudad);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    // Vuelve al login con el aviso y el email ya escrito
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status').filter({ hasText: 'Tu cuenta quedó creada' })).toBeVisible();
    await expect(page.getByLabel('Email')).toHaveValue(u.email);

    await page.locator('#password').fill(u.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/catalogo$/);
    await expect(page.getByText(`Hola, ${u.nombre}.`)).toBeVisible();
    const menu = page.getByRole('navigation', { name: 'Principal' });
    await expect(menu.getByRole('link', { name: 'Mis solicitudes' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Publicar animal' })).toHaveCount(0);

    // Perfil con los datos de la sesión
    await menu.getByRole('link', { name: u.nombre }).click();
    await expect(page.getByRole('heading', { name: u.nombre })).toBeVisible();
    await expect(page.getByText('Busco un animal')).toBeVisible();

    // La sesión sobrevive a recargar la página (token guardado)
    await page.reload();
    await expect(page.getByRole('heading', { name: u.nombre })).toBeVisible();

    await menu.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page.getByText('Cerraste sesión.')).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
  });

  test('con una contraseña equivocada no deja entrar', async ({ page, request }) => {
    const u = nuevoUsuario('ADOPTANTE');
    await registrar(request, u);

    await page.goto('/login');
    await page.getByLabel('Email').fill(u.email);
    await page.locator('#password').fill('una-clave-que-no-es');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    // El frontend traduce el 401 del backend a un mensaje propio
    await expect(page.getByRole('alert')).toContainText('El email o la contraseña no coinciden');
    await expect(page).toHaveURL(/\/login$/);
  });

  test('no permite registrar dos veces el mismo email', async ({ page, request }) => {
    const u = nuevoUsuario('VENDEDOR');
    await registrar(request, u);

    await page.goto('/registro');
    await page.getByLabel('Publicar animales').check();
    await page.getByLabel('Nombre completo').fill(u.nombre);
    await page.getByLabel('Email').fill(u.email);
    await page.locator('#password').fill(u.password);
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    const alerta = page.getByRole('alert');
    await expect(alerta).toContainText('Ya existe');
    await alerta.getByRole('link', { name: 'Ir a iniciar sesión' }).click();
    await expect(page).toHaveURL(/\/login$/);
  });

  test('el formulario de registro avisa los campos que faltan sin llamar a la API', async ({ page }) => {
    let llamoRegistro = false;
    page.on('request', (r) => {
      if (r.url().includes('/api/auth/register')) {
        llamoRegistro = true;
      }
    });

    await page.goto('/registro');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page.getByText('Escribe tu nombre')).toBeVisible();
    await expect(page.getByText('Escribe un email válido')).toBeVisible();
    await expect(page.getByText('La contraseña debe tener entre 8 y 72 caracteres')).toBeVisible();
    expect(llamoRegistro).toBe(false);
  });

  test('después de iniciar sesión vuelve a la página que pidió', async ({ page, request }) => {
    const u = nuevoUsuario('ADOPTANTE');
    await registrar(request, u);

    await page.goto('/solicitudes/mias');
    await expect(page).toHaveURL(/returnUrl=/);
    await page.getByLabel('Email').fill(u.email);
    await page.locator('#password').fill(u.password);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/solicitudes\/mias$/);
    await expect(page.getByRole('heading', { name: 'Mis solicitudes' })).toBeVisible();
  });

  test('un adoptante no puede entrar a las pantallas de vendedor', async ({ page, request }) => {
    const u = nuevoUsuario('ADOPTANTE');
    await registrar(request, u);
    await iniciarSesion(page, u);

    await page.goto('/publicar');
    await expect(page).toHaveURL(/\/catalogo$/);
    await page.goto('/solicitudes/recibidas');
    await expect(page).toHaveURL(/\/catalogo$/);
  });
});
