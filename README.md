# PetAdopt Frontend

Angular 21 (componentes standalone, signals, zoneless). Consume la API del backend PetAdopt.

## Ejecutar en desarrollo

```bash
npm install
npm start          # http://localhost:4200  (API en http://localhost:8080/api)
```

El backend debe estar corriendo (IntelliJ o Docker) con `CORS_ALLOWED_ORIGINS=http://localhost:4200`.

## Pruebas y build

```bash
npm test                    # Vitest en modo observación (se repite al guardar)
npm run test:ci             # una sola pasada + cobertura (coverage/fronet-petadot/lcov.info)
npm run build               # build de producción en dist/fronet-petadot/browser
```

105 pruebas; cobertura aproximada: 92 % de líneas y 89 % de ramas.

## SonarQube

La configuración está en `sonar-project.properties` (proyecto `PetAdopt-Frontend`).
Con SonarQube corriendo en Docker (http://localhost:9000) y el token en la variable `SONAR_TOKEN`:

```powershell
npm run test:ci
docker run --rm -e SONAR_HOST_URL="http://host.docker.internal:9000" -e SONAR_TOKEN="$env:SONAR_TOKEN" -v "${PWD}:/usr/src" sonarsource/sonar-scanner-cli
```

Con Docker, el `Dockerfile` compila la app y la sirve con nginx, que reenvía `/api` al backend.

## Estructura

```
src/app/
  core/         modelos, sesión (TokenStorageService, AuthService), interceptores, guards, avisos
  shared/       formato de textos, chip de estado, diálogo de confirmación, barra de carga
  features/
    auth/         login, registro, olvidé y restablecer contraseña
    animales/     catálogo, detalle, publicar/editar, mis publicaciones
    solicitudes/  enviar, recibidas (aprobar/rechazar), mis solicitudes, contacto
    perfil/       mi perfil, perfil público del solicitante
  paginas/      inicio, página no encontrada
```

## Rutas

| Ruta | Quién | Historia |
|---|---|---|
| `/` | Todos | Portada |
| `/catalogo` | Todos | HU-FE-07 (filtros especie, tipo y ciudad; 12 por página) |
| `/animales/:id` | Todos | HU-FE-08, HU-FE-11 |
| `/login`, `/registro` | Sin sesión | HU-FE-03, HU-FE-04 |
| `/olvide-contrasena`, `/restablecer-contrasena` | Todos | HU-FE-18, HU-FE-19 |
| `/publicar`, `/animales/:id/editar` | Vendedor | HU-FE-09, HU-FE-17 |
| `/mis-publicaciones` | Vendedor | HU-FE-10 (cambio de estado) |
| `/solicitudes/recibidas` | Vendedor | HU-FE-12, HU-FE-13, HU-FE-20 |
| `/usuarios/:id/perfil` | Vendedor | HU-FE-15 |
| `/solicitudes/mias` | Adoptante | HU-FE-14, HU-FE-20 |
| `/perfil` | Con sesión | Perfil propio |

## Pruebas end to end (Playwright)

Prueban la aplicación completa en un navegador real: frontend, backend, PostgreSQL, Mailpit y Amazon S3.

```powershell
# Una sola vez: descargar el navegador de Playwright
npx playwright install chromium

# Levantar todo (en la carpeta petadopt) y correr las E2E (en la carpeta del frontend)
docker compose up -d
npm run e2e            # todas, en consola
npm run e2e:ui         # modo visual: ves cada paso en el navegador
npm run e2e:reporte    # abre el reporte HTML de la última ejecución
```

| Archivo | Qué prueba |
|---|---|
| `e2e/navegacion.e2e.ts` | Portada, catálogo, 404 y rutas protegidas (también en celular) |
| `e2e/autenticacion.e2e.ts` | Registro, login, contraseña equivocada, email repetido, permisos por rol |
| `e2e/publicacion.e2e.ts` | Publicar con foto (S3), ver en el catálogo, editar, retirar, validaciones |
| `e2e/adopcion.e2e.ts` | Solicitud → aprobación (con rechazo automático de la otra) → contacto → correos → entrega |
| `e2e/recuperacion.e2e.ts` | Olvidé mi contraseña → enlace por correo (Mailpit) → nueva contraseña → enlace de un solo uso |
| `e2e/integridad.e2e.ts` | Sin interfaz, contra la API real: decisiones simultáneas, solicitudes al liberar o retirar un animal, paginación del catálogo, fotos por enlace externo y contraseñas largas |

Cada prueba crea sus propios usuarios y animales con nombres únicos, así que se pueden repetir sin limpiar la base de datos.
Si una falla, el reporte trae una captura de pantalla, un video y la traza paso a paso (`npx playwright show-trace ...`).
La recuperación de contraseña está limitada a 3 pedidos por hora por IP: para correr las E2E varias veces seguidas, pon `RECUPERACION_MAX_INTENTOS=100` en el `.env` y ejecuta `docker compose up -d backend`.
