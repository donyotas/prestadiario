import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';
import { requireAuth, signToken } from '../middleware/auth';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valido = await bcrypt.compare(password, user.passwordHash);
  if (!valido) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
  const token = signToken(payload);

  res.json({ token, user: payload });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
