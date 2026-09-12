// Configuracion de despliegue del frontend.
//
// IMPORTANTE: este archivo NO se compila, se copia tal cual a la web publicada.
// Eso permite cambiar la URL del backend editando este archivo en el servidor,
// sin tener que volver a compilar el cliente.
//
// - Deja la cadena vacia ('') si el backend se sirve desde el MISMO dominio que
//   estos archivos (despliegue de un solo servicio). Las peticiones iran a /api.
// - Si el backend vive en otro dominio (por ejemplo la API en Railway y estos
//   archivos en Hostinger), escribe aqui su URL completa terminada en /api,
//   sin barra final. Ejemplo:
//   window.__PRESTADIARIO_API_URL__ = 'https://api.prestadiario.online/api';
window.__PRESTADIARIO_API_URL__ = '';
