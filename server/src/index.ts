import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import clientesRouter from './routes/clientes';
import prestamosRouter from './routes/prestamos';
import cuotasRouter from './routes/cuotas';
import dashboardRouter from './routes/dashboard';

const app = express();

// Orígenes permitidos: tu Firebase Hosting en producción + localhost en desarrollo.
// Puedes sobreescribir/ampliar la lista con la variable de entorno CORS_ORIGINS
// (separada por comas), por ejemplo:
// CORS_ORIGINS=https://prestadiario-3756c.web.app,https://prestadiario-3756c.firebaseapp.com
const defaultOrigins = [
  'http://localhost:5173',
  'https://prestadiario-3756c.web.app',
  'https://prestadiario-3756c.firebaseapp.com',
];
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : defaultOrigins;

app.use(
  cors({
    origin(origin, callback) {
      // Permite peticiones sin origin (ej. curl, health checks) y las de la lista.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    },
  })
);
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/cuotas', cuotasRouter);
app.use('/api/dashboard', dashboardRouter);

// En producción el build del cliente se sirve desde este mismo servidor,
// así el despliegue queda como un único servicio (sin CORS ni URLs separadas).
const clientDist = path.join(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});