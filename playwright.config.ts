import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas end to end (E2E) de PetAdopt con Playwright.
 *
 * Corren contra la aplicación completa levantada con docker compose
 * (frontend + backend + PostgreSQL + Mailpit + Amazon S3):
 *   docker compose up -d        (en la carpeta petadopt)
 *   npm run e2e                 (en la carpeta del frontend)
 *
 * Variables opcionales:
 *   E2E_BASE_URL   dirección del frontend   (por defecto http://localhost:4200)
 *   E2E_MAILPIT    dirección de Mailpit     (por defecto http://localhost:8025)
 */
const CI = !!process.env['CI'];

export default defineConfig({
  testDir: './e2e',
  // *.e2e.ts para que Vitest (pruebas unitarias, *.spec.ts) no las tome
  testMatch: '**/*.e2e.ts',
  // Cada escenario crea sus propios usuarios y animales: pueden correr en paralelo sin pisarse
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  workers: CI ? 2 : undefined,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: CI ? [['list'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'on-failure' }]],
  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:4200',
    locale: 'es-CO',
    timezoneId: 'America/Bogota',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'escritorio', use: { ...devices['Desktop Chrome'] } },
    // El menú se vuelve un botón "Menú" en pantallas angostas: se prueba la navegación básica en celular
    { name: 'celular', use: { ...devices['Pixel 7'] }, testMatch: '**/navegacion.e2e.ts' },
  ],
});
