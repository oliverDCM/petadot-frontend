import { expect, test } from '@playwright/test';
import path from 'node:path';
import { iniciarSesion, registrar } from './support/api';
import { ciudadUnica, nuevoUsuario, unico } from './support/datos';

const FOTO = path.join(__dirname, 'fixtures', 'perro.png');
const NO_ES_FOTO = path.join(__dirname, 'fixtures', 'no-es-imagen.txt');

test.describe('Publicaciones del vendedor', () => {
  test('publica un animal con foto, aparece en el catálogo y lo edita', async ({ page, request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    await registrar(request, vendedor);
    await iniciarSesion(page, vendedor);
    const nombre = `Lupe ${unico()}`;
    const ciudad = ciudadUnica();

    // 1. Publicar con foto (sube la imagen a Amazon S3 a través del backend)
    await page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Publicar animal' }).click();
    await expect(page.getByRole('heading', { name: 'Publicar un animal' })).toBeVisible();

    await page.getByLabel('Elegir una foto').setInputFiles(FOTO);
    await expect(page.getByAltText('Vista previa de la foto elegida')).toBeVisible();
    await page.getByLabel('Nombre', { exact: true }).fill(nombre);
    await page.getByLabel('Especie').selectOption('PERRO');
    await page.getByLabel('Sexo').selectOption('HEMBRA');
    await page.getByLabel(/Raza/).fill('Criolla');
    await page.getByLabel(/Edad en meses/).fill('14');
    await page.getByLabel('Tiene sus vacunas').check();
    await page.getByLabel('Adopción', { exact: true }).check();
    await page.getByLabel('Ciudad donde está').fill(ciudad);
    await page.getByLabel(/Descripción/).fill('Juguetona y se lleva bien con niños.');
    await page.getByRole('button', { name: 'Publicar animal' }).click();

    await expect(page.getByText(`${nombre} ya está publicado.`)).toBeVisible({ timeout: 20_000 });
    await expect(page).toHaveURL(/\/mis-publicaciones$/);
    const fila = page.getByRole('listitem').filter({ hasText: nombre });
    await expect(fila.getByText('Disponible')).toBeVisible();
    // La miniatura usa la URL devuelta por el almacenamiento, no la imagen por defecto
    await expect(fila.locator('img.miniatura')).not.toHaveAttribute('src', /sin-foto/);

    // 2. Aparece en el catálogo público filtrando por su ciudad
    await page.goto('/catalogo');
    await page.getByLabel('Ciudad').fill(ciudad);
    await page.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page.getByText('1 animal con estos filtros')).toBeVisible();
    await page.getByRole('link', { name: new RegExp(nombre) }).click();

    // 3. Detalle con los datos publicados
    await expect(page.getByRole('heading', { level: 1, name: nombre })).toBeVisible();
    await expect(page.getByText('Juguetona y se lleva bien con niños.')).toBeVisible();
    await expect(page.locator('dl.datos')).toContainText(ciudad);
    await expect(page.getByRole('heading', { name: 'Es tu publicación' })).toBeVisible();

    // 4. Editar la descripción
    await page.getByRole('link', { name: 'Editar datos' }).click();
    await expect(page.getByRole('heading', { name: `Editar ${nombre}` })).toBeVisible();
    await expect(page.getByLabel('Nombre', { exact: true })).toHaveValue(nombre);
    await page.getByLabel(/Descripción/).fill('Ya sabe pasear con correa.');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();

    await expect(page.getByText(`Guardaste los cambios de ${nombre}.`)).toBeVisible();
    await page.getByRole('listitem').filter({ hasText: nombre }).getByRole('link', { name: nombre }).click();
    await expect(page.getByText('Ya sabe pasear con correa.')).toBeVisible();
  });

  test('retirar una publicación la saca del catálogo', async ({ page, request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    await registrar(request, vendedor);
    await iniciarSesion(page, vendedor);
    const nombre = `Coco ${unico()}`;
    const ciudad = ciudadUnica();

    // Publicar sin foto también es válido
    await page.goto('/publicar');
    await page.getByLabel('Nombre', { exact: true }).fill(nombre);
    await page.getByLabel('Especie').selectOption('OTRO');
    await page.getByLabel('Venta', { exact: true }).check();
    await page.getByLabel('Ciudad donde está').fill(ciudad);
    await page.getByRole('button', { name: 'Publicar animal' }).click();
    await expect(page.getByText(`${nombre} ya está publicado.`)).toBeVisible();

    const fila = page.getByRole('listitem').filter({ hasText: nombre });
    await fila.getByRole('button', { name: 'Retirar publicación' }).click();
    const dialogo = page.getByRole('dialog');
    await expect(dialogo).toContainText(`¿Retirar a ${nombre}?`);
    await dialogo.getByRole('button', { name: 'Retirar publicación' }).click();

    await expect(page.getByText(`Retiraste la publicación de ${nombre}.`)).toBeVisible();
    await expect(fila.getByText('Retirado')).toBeVisible();
    await expect(fila.getByRole('link', { name: 'Editar' })).toHaveCount(0);

    await page.goto('/catalogo');
    await page.getByLabel('Ciudad').fill(ciudad);
    await page.getByRole('button', { name: 'Filtrar' }).click();
    await expect(page.getByRole('heading', { name: 'No hay animales con estos filtros' })).toBeVisible();
  });

  test('valida la foto y los campos obligatorios antes de enviar', async ({ page, request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    await registrar(request, vendedor);
    await iniciarSesion(page, vendedor);

    await page.goto('/publicar');
    await page.getByLabel('Elegir una foto').setInputFiles(NO_ES_FOTO);
    await expect(page.getByText('Usa una imagen JPG, PNG o WEBP.')).toBeVisible();

    await page.getByRole('button', { name: 'Publicar animal' }).click();
    await expect(page.getByText('Escribe el nombre (máximo 100 caracteres)')).toBeVisible();
    await expect(page).toHaveURL(/\/publicar$/);
  });
});
