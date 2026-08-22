import axios from 'axios';

// En desarrollo local, Vite redirige '/api' hacia el backend local (ver vite.config.ts)
// así que no hace falta configurar nada.
// En producción (ej. Firebase Hosting), el frontend ya no comparte dominio con el
// backend, así que necesitamos la URL completa. Defínela en client/.env como:
//   VITE_API_URL=https://tu-backend.up.railway.app/api
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;