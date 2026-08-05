import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.use(requireAuth, requireRole('ADMIN'));

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
    orderBy: { nombre: 'asc' },
  });
  res.json(users);
});

router.post('/', async (req, res) => {
  const { nombre, email, password, rol } = req.body ?? {};
  if (!nombre || !email || !password || !rol) {
    return res.status(400).json({ error: 'nombre, email, password y rol son requeridos' });
  }
  if (rol !== 'ADMIN' && rol !== 'COBRADOR') {
    return res.status(400).json({ error: 'rol inválido' });
  }

  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un usuario con ese email' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { nombre, email, passwordHash, rol },
    select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
  });
  res.status(201).json(user);
});

router.patch('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, email, rol, password } = req.body ?? {};

  if (rol !== undefined && rol !== 'ADMIN' && rol !== 'COBRADOR') {
    return res.status(400).json({ error: 'rol inválido' });
  }

  const data: {
    nombre?: string;
    email?: string;
    rol?: 'ADMIN' | 'COBRADOR';
    passwordHash?: string;
  } = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (email !== undefined) data.email = email;
  if (rol !== undefined) data.rol = rol;
  if (password) data.passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, nombre: true, email: true, rol: true, createdAt: true },
    });
    res.json(user);
  } catch {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Usuario no encontrado' });
  }
});

export default router;
