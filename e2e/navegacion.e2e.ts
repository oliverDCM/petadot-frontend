import { expect, Page, test } from '@playwright/test';

/** En celular el menú está plegado detrás del botón "Menú". */
async function abrirMenu(page: Page): Promise<void> {
  const boton = page.getByRole('button', { name: 'Menú' });
  if (await boton.isVisible()) {
    await boton.click();
  }
}

test.describe('Navegación pública', () => {
  test('desde la portada se llega al catálogo por el menú', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle('PetAdopt');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Adopta o compra un animal');

    await abrirMenu(page);
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Animales' }).click();

    await expect(page).toHaveURL(/\/catalogo$/);
    await expect(page.getByRole('heading', { name: 'Animales disponibles' })).toBeVisible();
    await expect(page.getByRole('search', { name: 'Filtrar animales' })).toBeVisible();
  });

  test('sin sesión el menú ofrece iniciar sesión y crear cuenta', async ({ page }) => {
    await page.goto('/catalogo');
    await abrirMenu(page);
    const menu = page.getByRole('navigation', { name: 'Principal' });
    await expect(menu.getByRole('link', { name: 'Iniciar sesión' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Crear cuenta' })).toBeVisible();
    await expect(menu.getByRole('link', { name: 'Publicar animal' })).toHaveCount(0);
  });

  test('una dirección que no existe muestra la página 404', async ({ page }) => {
    await page.goto('/esta-pagina-no-existe');
    await expect(page.getByRole('heading', { name: 'No encontramos esta página' })).toBeVisible();
    await page.getByRole('link', { name: 'Ver animales disponibles' }).click();
    await expect(page).toHaveURL(/\/catalogo$/);
  });

  test('un animal que no existe se explica sin romper la página', async ({ page }) => {
    await page.goto('/animales/999999999');
    await expect(page.getByRole('heading', { name: 'Este animal no existe o ya no está publicado' })).toBeVisible();
  });

  for (const ruta of ['/publicar', '/mis-publicaciones', '/solicitudes/mias', '/perfil']) {
    test(`${ruta} pide iniciar sesión y recuerda a dónde volver`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(new RegExp(`/login\\?returnUrl=${encodeURIComponent(ruta)}$`));
      await expect(page.getByRole('heading', { name: 'Iniciar sesión' })).toBeVisible();
    });
  }
});
