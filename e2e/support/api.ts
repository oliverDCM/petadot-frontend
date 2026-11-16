import { APIRequestContext, expect, Page } from '@playwright/test';
import { UsuarioPrueba } from './datos';

/*
 * Atajos por la API REST para PREPARAR los datos de un escenario (crear usuarios, publicar animales).
 * Lo que se quiere probar se hace siempre por la interfaz, como lo haría una persona.
 * Las peticiones pasan por el mismo nginx del frontend (/api -> backend).
 */

export interface AnimalCreado {
  id: number;
  nombre: string;
  ciudad: string | null;
  estado: string;
}

export async function registrar(api: APIRequestContext, u: UsuarioPrueba): Promise<void> {
  const r = await api.post('/api/auth/register', { data: u });
  expect(r.status(), `registro de ${u.email}: ${await r.text()}`).toBe(201);
}

export async function token(api: APIRequestContext, u: UsuarioPrueba): Promise<string> {
  const r = await api.post('/api/auth/login', { data: { email: u.email, password: u.password } });
  expect(r.ok(), `login de ${u.email}: ${await r.text()}`).toBeTruthy();
  return (await r.json()).token as string;
}

export async function publicarAnimal(
  api: APIRequestContext,
  vendedor: UsuarioPrueba,
  datos: { nombre: string; ciudad: string; especie?: string; tipo?: string; descripcion?: string },
): Promise<AnimalCreado> {
  const jwt = await token(api, vendedor);
  const r = await api.post('/api/animales', {
    headers: { Authorization: `Bearer ${jwt}` },
    data: {
      nombre: datos.nombre,
      especie: datos.especie ?? 'PERRO',
      raza: 'Criollo',
      edadMeses: 14,
      sexo: 'HEMBRA',
      descripcion: datos.descripcion ?? 'Publicado por una prueba E2E.',
      fotoUrl: null,
      ciudad: datos.ciudad,
      vacunado: true,
      esterilizado: false,
      tipo: datos.tipo ?? 'ADOPCION',
    },
  });
  expect(r.status(), `publicar ${datos.nombre}: ${await r.text()}`).toBe(201);
  return r.json();
}

/** Inicia sesión por la interfaz y espera a quedar dentro. */
export async function iniciarSesion(page: Page, u: UsuarioPrueba, returnUrl?: string): Promise<void> {
  await page.goto(returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login');
  await page.getByLabel('Email').fill(u.email);
  await page.locator('#password').fill(u.password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByRole('button', { name: 'Cerrar sesión' }).first()).toBeAttached();
}
