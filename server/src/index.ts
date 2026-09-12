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
import { ensureDatabase } from './lib/ensureDatabase';
import { apiLimiter, loginLimiter, securityHeaders } from './middleware/security';

const app = express();

// En Railway/Render la app vive detrás de un proxy, así que la IP real del
// cliente llega en X-Forwarded-For. Sin esto, el rate limiting vería siempre
// la IP del proxy y contaría las peticiones de todos los usuarios como si
// fueran de uno solo.
app.set('trust proxy', 1);

// Cabeceras de seguridad (CSP, HSTS, nosniff, etc.) para todas las respuestas.
app.use(securityHeaders);

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
  cors((req, callback) => {
    const origin = req.headers.origin;
    const host = req.headers.host;

    // En produccion el SPA y la API se sirven desde el MISMO origen, pero el
    // navegador manda la cabecera Origin en todos los POST (login, crear
    // cliente, registrar pago). Si esa peticion del propio dominio no se
    // reconoce, el login devuelve 500 y la app queda inservible. Por eso el
    // mismo origen se permite siempre, sin depender de configurar la lista.
    let mismoOrigen = false;
    if (origin && host) {
      try {
        mismoOrigen = new URL(origin).host === host;
      } catch {
        mismoOrigen = false;
      }
    }

    // Permitidas: sin Origin (curl, health checks de la plataforma), el propio
    // dominio, y los origenes declarados (Firebase, localhost, CORS_ORIGINS).
    if (!origin || mismoOrigen || allowedOrigins.includes(origin)) {
      return callback(null, { origin: true });
    }

    // Origen ajeno: no se acredita con cabeceras CORS, pero tampoco se rompe la
    // peticion con un error. El navegador no podra leer la respuesta al no
    // recibirlas, que es justo lo que queremos.
    callback(null, { origin: false });
  })
);
app.use(express.json());

// Límites de peticiones: uno general para toda la API y otro mucho más
// estricto para el login, que es la única puerta sin token.
app.use('/api', apiLimiter);
app.use('/api/auth/login', loginLimiter);

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

// Prepara la base de datos (crea el esquema y el admin inicial si hace falta)
// antes de aceptar peticiones. Es idempotente: en arranques posteriores no hace nada.
ensureDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('No se pudo preparar la base de datos:', err);
    process.exit(1);
  });