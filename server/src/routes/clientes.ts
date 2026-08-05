import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const where = req.user!.rol === 'COBRADOR' ? { cobradorId: req.user!.id } : {};
  const clientes = await prisma.cliente.findMany({
    where,
    include: { cobrador: { select: { id: true, nombre: true } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(clientes);
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const cliente = await prisma.cliente.findUnique({
    where: { id },
    include: { cobrador: { select: { id: true, nombre: true } } },
  });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });
  if (req.user!.rol === 'COBRADOR' && cliente.cobradorId !== req.user!.id) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  res.json(cliente);
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { nombre, documento, telefono, direccion, cobradorId } = req.body ?? {};
  if (!nombre || !documento) {
    return res.status(400).json({ error: 'nombre y documento son requeridos' });
  }

  const existente = await prisma.cliente.findUnique({ where: { documento } });
  if (existente) {
    return res.status(409).json({ error: 'Ya existe un cliente con ese documento' });
  }

  const cliente = await prisma.cliente.create({
    data: {
      nombre,
      documento,
      telefono: telefono ?? null,
      direccion: direccion ?? null,
      cobradorId: cobradorId ?? null,
    },
  });
  res.status(201).json(cliente);
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, documento, telefono, direccion, cobradorId } = req.body ?? {};

  const data: {
    nombre?: string;
    documento?: string;
    telefono?: string | null;
    direccion?: string | null;
    cobradorId?: number | null;
  } = {};
  if (nombre !== undefined) data.nombre = nombre;
  if (documento !== undefined) data.documento = documento;
  if (telefono !== undefined) data.telefono = telefono;
  if (direccion !== undefined) data.direccion = direccion;
  if (cobradorId !== undefined) data.cobradorId = cobradorId;

  try {
    const cliente = await prisma.cliente.update({ where: { id }, data });
    res.json(cliente);
  } catch {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
});

export default router;
