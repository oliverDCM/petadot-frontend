/** Token JWT de prueba (sin firma real) con el id de usuario en "sub". */
export function jwtDePrueba(sub: number, expEnSegundos = Math.floor(Date.now() / 1000) + 3600): string {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${b64({ alg: 'HS256' })}.${b64({ sub: String(sub), exp: expEnSegundos })}.firma`;
}
