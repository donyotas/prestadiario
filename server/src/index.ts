import 'dotenv/config';
import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth';
import usersRouter from './routes/users';
import clientesRouter from './routes/clientes';
import prestamosRouter from './routes/prestamos';
import cuotasRouter from './routes/cuotas';
import dashboardRouter from './routes/dashboard';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/clientes', clientesRouter);
app.use('/api/prestamos', prestamosRouter);
app.use('/api/cuotas', cuotasRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
