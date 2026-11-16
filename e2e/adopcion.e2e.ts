import { Browser, expect, Page, test } from '@playwright/test';
import { iniciarSesion, publicarAnimal, registrar, token } from './support/api';
import { ciudadUnica, nuevoUsuario, unico, UsuarioPrueba } from './support/datos';
import { esperarCorreo } from './support/mailpit';

async function sesionEnNavegadorAparte(browser: Browser, u: UsuarioPrueba): Promise<Page> {
  const contexto = await browser.newContext();
  const page = await contexto.newPage();
  await iniciarSesion(page, u);
  return page;
}

test.describe('Flujo completo de adopción', () => {
  test('el adoptante solicita, el vendedor aprueba, ambos ven el contacto y se marca la entrega', async ({
    browser,
    request,
  }) => {
    test.slow(); // dos personas en dos navegadores: le damos el triple de tiempo

    // Preparación por API: vendedor con un animal, dos adoptantes y una solicitud del "otro" adoptante
    const vendedor = nuevoUsuario('VENDEDOR');
    const adoptante = nuevoUsuario('ADOPTANTE');
    const otro = nuevoUsuario('ADOPTANTE', 'Luis Otro');
    await Promise.all([registrar(request, vendedor), registrar(request, adoptante), registrar(request, otro)]);
    const ciudad = ciudadUnica();
    const animal = await publicarAnimal(request, vendedor, { nombre: `Tobías ${unico()}`, ciudad });
    const r = await request.post('/api/solicitudes', {
      headers: { Authorization: `Bearer ${await token(request, otro)}` },
      data: { animalId: animal.id, mensaje: 'Tengo finca y mucho espacio para que corra.' },
    });
    expect(r.status()).toBe(201);

    // 1. ADOPTANTE: encuentra el animal en el catálogo y envía la solicitud
    const pa = await sesionEnNavegadorAparte(browser, adoptante);
    await pa.goto('/catalogo');
    await pa.getByLabel('Ciudad').fill(ciudad);
    await pa.getByRole('button', { name: 'Filtrar' }).click();
    await pa.getByRole('link', { name: new RegExp(animal.nombre) }).click();
    await expect(pa.getByRole('heading', { name: 'Enviar solicitud' })).toBeVisible();

    await pa.getByLabel(`Cuéntale a quien publicó por qué quieres a ${animal.nombre}`).fill('hola');
    await pa.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(pa.getByText('Escribe un mensaje de al menos 10 caracteres')).toBeVisible();

    await pa
      .getByLabel(`Cuéntale a quien publicó por qué quieres a ${animal.nombre}`)
      .fill('Vivo con mi familia, tenemos patio cerrado y ya tuvimos perros.');
    await pa.getByRole('button', { name: 'Enviar solicitud' }).click();
    await expect(pa.getByText(/Solicitud enviada/)).toBeVisible();
    await expect(pa.getByRole('heading', { name: 'Ya enviaste una solicitud' })).toBeVisible();

    await pa.goto('/solicitudes/mias');
    const miSolicitud = pa.getByRole('listitem').filter({ hasText: animal.nombre });
    await expect(miSolicitud.getByText('Pendiente')).toBeVisible();
    await expect(miSolicitud.getByText('Esperando respuesta.')).toBeVisible();

    // 2. VENDEDOR: ve las dos solicitudes y aprueba la del adoptante
    const pv = await sesionEnNavegadorAparte(browser, vendedor);
    await pv.goto('/solicitudes/recibidas');
    const deAdoptante = pv.getByRole('listitem').filter({ hasText: adoptante.nombre });
    const deOtro = pv.getByRole('listitem').filter({ hasText: otro.nombre });
    await expect(deAdoptante.getByText('Pendiente')).toBeVisible();
    await expect(deOtro.getByText('Pendiente')).toBeVisible();

    await deAdoptante.getByRole('button', { name: 'Aprobar' }).click();
    const dialogo = pv.getByRole('dialog');
    await expect(dialogo).toContainText(`¿Aprobar la solicitud de ${adoptante.nombre}?`);
    await expect(dialogo).toContainText('La otra solicitud pendiente se rechazará automáticamente.');
    await dialogo.getByRole('button', { name: 'Aprobar solicitud' }).click();

    await expect(pv.getByText(`Aprobaste la solicitud de ${adoptante.nombre}.`)).toBeVisible();
    await expect(deAdoptante.getByText('Aprobada')).toBeVisible();
    await expect(deOtro.getByText('Rechazada')).toBeVisible();

    // El vendedor ve el contacto del adoptante
    await deAdoptante.getByRole('button', { name: 'Ver datos de contacto' }).click();
    const contactoAdoptante = pv.getByRole('region', { name: `Contacto de ${adoptante.nombre}` });
    await expect(contactoAdoptante).toContainText(adoptante.email);

    // 3. Los correos de aprobación llegaron a los dos (Mailpit)
    await esperarCorreo(adoptante.email, `Tu solicitud por ${animal.nombre} fue aprobada`);
    await esperarCorreo(vendedor.email, `Aprobaste la solicitud por ${animal.nombre}`);

    // 4. ADOPTANTE: ve la aprobación y el contacto del vendedor (con WhatsApp)
    await pa.reload();
    await expect(miSolicitud.getByText('Aprobada')).toBeVisible();
    await miSolicitud.getByRole('button', { name: 'Ver datos de contacto' }).click();
    const contactoVendedor = pa.getByRole('region', { name: `Contacto de ${vendedor.nombre}` });
    await expect(contactoVendedor).toContainText(vendedor.email);
    await expect(contactoVendedor.getByRole('link', { name: 'Escribir por WhatsApp' })).toHaveAttribute(
      'href',
      /^https:\/\/wa\.me\/57\d{10}/,
    );

    // El animal reservado ya no aparece en el catálogo
    await pa.goto('/catalogo');
    await pa.getByLabel('Ciudad').fill(ciudad);
    await pa.getByRole('button', { name: 'Filtrar' }).click();
    await expect(pa.getByRole('heading', { name: 'No hay animales con estos filtros' })).toBeVisible();

    // 5. VENDEDOR: marca la entrega
    await pv.goto('/mis-publicaciones');
    const fila = pv.getByRole('listitem').filter({ hasText: animal.nombre });
    await expect(fila.getByText('Reservado')).toBeVisible();
    await fila.getByRole('button', { name: 'Marcar como entregado' }).click();
    await pv.getByRole('dialog').getByRole('button', { name: 'Marcar como entregado' }).click();
    await expect(pv.getByText(`${animal.nombre} quedó marcado como entregado.`)).toBeVisible();
    await expect(fila.getByText('Adoptado')).toBeVisible();

    await pa.context().close();
    await pv.context().close();
  });

  test('un visitante sin sesión ve el animal pero debe iniciar sesión para solicitarlo', async ({ page, request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    await registrar(request, vendedor);
    const animal = await publicarAnimal(request, vendedor, { nombre: `Nube ${unico()}`, ciudad: ciudadUnica(), especie: 'GATO' });

    await page.goto(`/animales/${animal.id}`);
    await expect(page.getByRole('heading', { level: 1, name: animal.nombre })).toBeVisible();
    await expect(page.getByRole('heading', { name: `¿Te interesa ${animal.nombre}?` })).toBeVisible();

    await page.locator('.detalle-accion').getByRole('link', { name: 'Iniciar sesión' }).click();
    await expect(page).toHaveURL(new RegExp(`returnUrl=%2Fanimales%2F${animal.id}`));
  });
});
