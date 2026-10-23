// Producción (build de Docker): la API se consume en la misma dirección que sirve la app.
// nginx reenvía /api al backend, por eso la URL es relativa y no hace falta CORS.
export const environment = {
  production: true,
  apiUrl: '/api'
};
