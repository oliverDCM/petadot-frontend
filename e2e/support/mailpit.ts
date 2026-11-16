import { expect, request } from '@playwright/test';

/*
 * Lee los correos que el backend envió a Mailpit (servidor SMTP de pruebas del docker compose).
 * API de Mailpit: https://mailpit.axllent.org/docs/api-v1/
 */
const MAILPIT = process.env['E2E_MAILPIT'] ?? 'http://localhost:8025';

interface ResumenCorreo {
  ID: string;
  Subject: string;
}

export interface Correo {
  asunto: string;
  texto: string;
}

/** Espera (hasta 20 s) el último correo enviado a `email` cuyo asunto contenga `asunto`. */
export async function esperarCorreo(email: string, asunto: string): Promise<Correo> {
  const api = await request.newContext({ baseURL: MAILPIT });
  try {
    let encontrado: ResumenCorreo | undefined;
    await expect
      .poll(
        async () => {
          const r = await api.get('/api/v1/search', { params: { query: `to:"${email}"`, limit: 20 } });
          if (!r.ok()) {
            return `Mailpit respondió ${r.status()}`;
          }
          const { messages } = (await r.json()) as { messages: ResumenCorreo[] };
          encontrado = messages.find((m) => m.Subject.includes(asunto));
          return encontrado ? 'ok' : `sin correo "${asunto}" para ${email}`;
        },
        { message: `No llegó a Mailpit (${MAILPIT}) el correo "${asunto}" para ${email}`, timeout: 20_000 },
      )
      .toBe('ok');

    const detalle = await api.get(`/api/v1/message/${encontrado!.ID}`);
    const cuerpo = (await detalle.json()) as { Subject: string; Text: string };
    return { asunto: cuerpo.Subject, texto: cuerpo.Text };
  } finally {
    await api.dispose();
  }
}

/** Saca el primer enlace http(s) del cuerpo de un correo. */
export function primerEnlace(texto: string): string {
  const m = /https?:\/\/\S+/.exec(texto);
  expect(m, 'el correo no trae ningún enlace').not.toBeNull();
  return m![0];
}
