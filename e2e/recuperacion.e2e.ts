import { expect, test } from '@playwright/test';
import { registrar } from './support/api';
import { nuevoUsuario } from './support/datos';
import { esperarCorreo, primerEnlace } from './support/mailpit';

test.describe('Recuperación de contraseña', () => {
  test('pide el enlace, lo recibe por correo, cambia la contraseña y el enlace no sirve dos veces', async ({
    page,
    request,
  }) => {
    test.slow();
    const u = nuevoUsuario('ADOPTANTE');
    await registrar(request, u);
    const nueva = 'Nueva-Clave-E2e-2026';

    // 1. Pedir el enlace desde el login
    await page.goto('/login');
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();
    await page.getByLabel('Email').fill(u.email);
    await page.getByRole('button', { name: 'Enviar enlace' }).click();

    const limite = page.getByRole('alert').filter({ hasText: 'Demasiadas solicitudes' });
    const exito = page.getByRole('status').filter({ hasText: 'El enlace vence en 30 minutos' });
    await expect(limite.or(exito)).toBeVisible();
    if (await limite.isVisible()) {
      throw new Error(
        'El backend limitó las solicitudes de recuperación (3 por hora por IP). ' +
          'Para correr las E2E seguido, pon RECUPERACION_MAX_INTENTOS=100 en el .env y recrea el backend.',
      );
    }

    // 2. Abrir el enlace del correo
    const correo = await esperarCorreo(u.email, 'Restablece tu contraseña de PetAdopt');
    const enlace = new URL(primerEnlace(correo.texto));
    expect(enlace.pathname).toBe('/restablecer-contrasena');
    expect(enlace.searchParams.get('token')).toBeTruthy();
    const destino = enlace.pathname + enlace.search;

    await page.goto(destino);
    await expect(page.getByRole('heading', { name: 'Crea una contraseña nueva' })).toBeVisible();
    // El token se quita de la barra de direcciones para que no quede en el historial
    await expect(page).toHaveURL(/\/restablecer-contrasena$/);

    await page.getByLabel('Contraseña nueva').fill(nueva);
    await page.getByLabel('Repite la contraseña').fill('otra-distinta');
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();
    await expect(page.getByText('Las contraseñas no coinciden')).toBeVisible();

    await page.getByLabel('Repite la contraseña').fill(nueva);
    await page.getByRole('button', { name: 'Guardar contraseña' }).click();

    // 3. Vuelve al login con aviso; entra con la nueva
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('status').filter({ hasText: 'Tu contraseña se actualizó' })).toBeVisible();
    await page.getByLabel('Email').fill(u.email);
    await page.locator('#password').fill(nueva);
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();
    await expect(page.getByText(`Hola, ${u.nombre}.`)).toBeVisible();
    await esperarCorreo(u.email, 'Tu contraseña de PetAdopt fue cambiada');

    // La contraseña vieja ya no sirve
    const vieja = await request.post('/api/auth/login', { data: { email: u.email, password: u.password } });
    expect(vieja.status()).toBe(401);

    // 4. El mismo enlace no se puede usar dos veces
    const otraPestana = await page.context().browser()!.newPage();
    await otraPestana.goto(new URL(destino, page.url()).toString());
    await otraPestana.getByLabel('Contraseña nueva').fill('Otra-Clave-2026');
    await otraPestana.getByLabel('Repite la contraseña').fill('Otra-Clave-2026');
    await otraPestana.getByRole('button', { name: 'Guardar contraseña' }).click();
    const error = otraPestana.getByRole('alert');
    await expect(error).toContainText(/ya fue usado|venció|no es válido/);
    await expect(error.getByRole('link', { name: 'Pedir un enlace nuevo' })).toBeVisible();
    await otraPestana.close();
  });

  test('un enlace sin token se explica y ofrece pedir otro', async ({ page }) => {
    await page.goto('/restablecer-contrasena');
    await expect(page.getByRole('alert')).toContainText('Este enlace no es válido o está incompleto');
    await page.getByRole('link', { name: 'Pedir un enlace nuevo' }).click();
    await expect(page).toHaveURL(/\/olvide-contrasena$/);
  });
});
