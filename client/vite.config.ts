import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Escucha en todas las interfaces (IPv4 e IPv6). Sin esto, Vite puede
    // quedarse solo en IPv6 y fallar al abrir http://127.0.0.1:5173.
    // De paso permite probar la app desde el móvil en la misma red.
    host: true,
    proxy: {
      '/api': 'http://localhost:4000',
    },
  },
})
