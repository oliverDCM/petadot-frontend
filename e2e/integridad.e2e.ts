import { APIRequestContext, expect, test } from '@playwright/test';
import { publicarAnimal, registrar, token } from './support/api';
import { ciudadUnica, nuevoUsuario, unico, UsuarioPrueba } from './support/datos';

/*
 * Pruebas de integración contra la API real (backend + PostgreSQL), sin interfaz.
 * Cubren reglas que solo se pueden comprobar con el sistema completo: concurrencia, consistencia
 * entre animales y solicitudes, paginación en la base de datos y permisos sobre las fotos.
 */

const auth = (jwt: string) => ({ Authorization: `Bearer ${jwt}` });

async function solicitar(api: APIRequestContext, adoptante: UsuarioPrueba, animalId: number): Promise<number> {
  const r = await api.post('/api/solicitudes', {
    headers: auth(await token(api, adoptante)),
    data: { animalId, mensaje: 'Tengo patio cerrado y experiencia con animales.' },
  });
  expect(r.status(), await r.text()).toBe(201);
  return (await r.json()).id as number;
}

async function estadoDeSolicitud(api: APIRequestContext, jwtAdoptante: string, id: number): Promise<string> {
  const lista = (await (await api.get('/api/solicitudes/mias', { headers: auth(jwtAdoptante) })).json()) as {
    id: number;
    estado: string;
  }[];
  return lista.find((s) => s.id === id)!.estado;
}

test.describe('Integridad de los datos (API real)', () => {
  test('aprobar y rechazar la misma solicitud a la vez nunca deja datos contradictorios', async ({ request }) => {
    test.slow();
    const vendedor = nuevoUsuario('VENDEDOR');
    const adoptante = nuevoUsuario('ADOPTANTE');
    await Promise.all([registrar(request, vendedor), registrar(request, adoptante)]);
    const jwtVendedor = await token(request, vendedor);
    const jwtAdoptante = await token(request, adoptante);
    const ciudad = ciudadUnica();

    for (let intento = 0; intento < 8; intento++) {
      const animal = await publicarAnimal(request, vendedor, { nombre: `Carrera ${unico()}`, ciudad });
      const solicitudId = await solicitar(request, adoptante, animal.id);
      const decidir = (decision: string) =>
        request.put(`/api/solicitudes/${solicitudId}/decision`, { headers: auth(jwtVendedor), data: { decision } });

      const [aprobar, rechazar] = await Promise.all([decidir('APROBAR'), decidir('RECHAZAR')]);

      // Solo una de las dos decisiones puede ganar; la otra recibe 409 (ya fue decidida)
      expect([aprobar.status(), rechazar.status()].sort()).toEqual([200, 409]);
      const solicitud = await estadoDeSolicitud(request, jwtAdoptante, solicitudId);
      const animalFinal = (await (await request.get(`/api/animales/${animal.id}`)).json()).estado as string;
      if (aprobar.status() === 200) {
        expect([solicitud, animalFinal]).toEqual(['APROBADA', 'RESERVADO']);
      } else {
        expect([solicitud, animalFinal]).toEqual(['RECHAZADA', 'DISPONIBLE']);
      }
    }
  });

  test('liberar una reserva cierra la solicitud aprobada y retira el acceso al contacto', async ({ request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    const primero = nuevoUsuario('ADOPTANTE');
    const segundo = nuevoUsuario('ADOPTANTE', 'Luis Segundo');
    await Promise.all([registrar(request, vendedor), registrar(request, primero), registrar(request, segundo)]);
    const jwtVendedor = await token(request, vendedor);
    const jwtPrimero = await token(request, primero);
    const animal = await publicarAnimal(request, vendedor, { nombre: `Reserva ${unico()}`, ciudad: ciudadUnica() });
    const solicitudId = await solicitar(request, primero, animal.id);

    const aprobar = await request.put(`/api/solicitudes/${solicitudId}/decision`, {
      headers: auth(jwtVendedor),
      data: { decision: 'APROBAR' },
    });
    expect(aprobar.status()).toBe(200);
    expect((await request.get(`/api/solicitudes/${solicitudId}/contacto`, { headers: auth(jwtPrimero) })).status()).toBe(200);

    // El vendedor se arrepiente y vuelve a dejar el animal disponible
    const liberar = await request.put(`/api/animales/${animal.id}/estado`, {
      headers: auth(jwtVendedor),
      data: { estado: 'DISPONIBLE' },
    });
    expect(liberar.status()).toBe(200);

    expect(await estadoDeSolicitud(request, jwtPrimero, solicitudId)).toBe('RECHAZADA');
    expect((await request.get(`/api/solicitudes/${solicitudId}/contacto`, { headers: auth(jwtPrimero) })).status()).toBe(403);

    // Otra persona puede solicitarlo y ser aprobada: queda una sola solicitud aprobada para el animal
    const segundaId = await solicitar(request, segundo, animal.id);
    await request.put(`/api/solicitudes/${segundaId}/decision`, { headers: auth(jwtVendedor), data: { decision: 'APROBAR' } });
    const recibidas = (await (await request.get('/api/solicitudes/recibidas', { headers: auth(jwtVendedor) })).json()) as {
      animalId: number;
      estado: string;
    }[];
    expect(recibidas.filter((s) => s.animalId === animal.id && s.estado === 'APROBADA')).toHaveLength(1);
  });

  test('retirar una publicación cierra las solicitudes que estaban pendientes', async ({ request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    const adoptante = nuevoUsuario('ADOPTANTE');
    await Promise.all([registrar(request, vendedor), registrar(request, adoptante)]);
    const animal = await publicarAnimal(request, vendedor, { nombre: `Retiro ${unico()}`, ciudad: ciudadUnica() });
    const solicitudId = await solicitar(request, adoptante, animal.id);

    const retirar = await request.put(`/api/animales/${animal.id}/estado`, {
      headers: auth(await token(request, vendedor)),
      data: { estado: 'RETIRADO' },
    });
    expect(retirar.status()).toBe(200);

    expect(await estadoDeSolicitud(request, await token(request, adoptante), solicitudId)).toBe('RECHAZADA');
  });

  test('el catálogo pagina en el servidor y filtra la ciudad sin tildes ni mayúsculas', async ({ request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    await registrar(request, vendedor);
    const marca = unico();
    for (let i = 0; i < 5; i++) {
      await publicarAnimal(request, vendedor, { nombre: `Página ${i}`, ciudad: `Fusagasugá ${marca}`, especie: i % 2 ? 'GATO' : 'PERRO' });
    }

    const primera = await request.get('/api/animales', { params: { ciudad: `FUSAGASUGA ${marca}`, tamano: 2 } });
    expect(primera.status()).toBe(200);
    expect(primera.headers()['x-total-count']).toBe('5');
    expect(await primera.json()).toHaveLength(2);

    const ids: number[] = [];
    for (let pagina = 0; pagina < 3; pagina++) {
      const r = await request.get('/api/animales', { params: { ciudad: marca, tamano: 2, pagina } });
      ids.push(...((await r.json()) as { id: number }[]).map((a) => a.id));
    }
    expect(new Set(ids).size).toBe(5); // ninguna página repite ni pierde animales

    const gatos = await request.get('/api/animales', { params: { ciudad: marca, especie: 'GATO' } });
    expect(gatos.headers()['x-total-count']).toBe('2');

    const enorme = await request.get('/api/animales', { params: { tamano: 100000 } });
    expect(((await enorme.json()) as unknown[]).length).toBeLessThanOrEqual(100);
  });

  test('no se aceptan fotos por enlace externo ni nombres con saltos de línea', async ({ request }) => {
    const vendedor = nuevoUsuario('VENDEDOR');
    await registrar(request, vendedor);
    const headers = auth(await token(request, vendedor));
    const datos = { especie: 'PERRO', sexo: 'MACHO', tipo: 'ADOPCION', ciudad: 'Bogotá', vacunado: false, esterilizado: false };

    const externa = await request.post('/api/animales', {
      headers,
      data: { ...datos, nombre: 'Con rastreador', fotoUrl: 'https://rastreador.ejemplo.com/pixel.png' },
    });
    expect(externa.status()).toBe(400);

    const conSalto = await request.post('/api/animales', { headers, data: { ...datos, nombre: 'Firu\nlínea falsa en el log' } });
    expect(conSalto.status()).toBe(400);
    expect((await conSalto.json()).campos).toHaveProperty('nombre');
  });

  test('una contraseña con muchas tildes se rechaza con un 400 claro, no con un error interno', async ({ request }) => {
    const u = { ...nuevoUsuario('ADOPTANTE'), password: 'ñ'.repeat(72) }; // 72 caracteres, 144 bytes: más de lo que admite BCrypt
    const r = await request.post('/api/auth/register', { data: u });
    expect(r.status()).toBe(400);
    expect((await r.json()).mensaje).toContain('demasiado larga');
  });
});
