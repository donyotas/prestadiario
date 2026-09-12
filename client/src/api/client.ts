import axios from 'axios';

declare global {
  interface Window {
    __PRESTADIARIO_API_URL__?: string;
  }
}

// La URL del backend se resuelve en tres pasos, de mas a menos especifico:
//
// 1. `public/config.js` (window.__PRESTADIARIO_API_URL__): se edita en el
//    servidor despues de publicar, asi que cambiar de backend no obliga a
//    volver a compilar el cliente.
// 2. `VITE_API_URL`: lo incrusta Vite al compilar (client/.env.production).
// 3. '/api': el mismo dominio. Es el caso del despliegue de un solo servicio,
//    y tambien el de desarrollo local, donde Vite redirige /api a :4000
//    (ver vite.config.ts).
const runtimeUrl =
  typeof window === 'undefined' ? '' : (window.__PRESTADIARIO_API_URL__ ?? '');
const baseURL = runtimeUrl || import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;