import { Router, Request } from 'express';
import { Cuota } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { requireAuth, requireRole } from '../middleware/auth';
import { crearPrestamo, actualizarTasaPrestamo } from '../services/prestamoService';
import { estadoDisplay } from '../services/cuotaStatus';
import { generarReportePrestamoPDF } from '../services/reporteService';

const router = Router();
router.use(requireAuth);

const FRECUENCIAS = ['DIARIA', 'SEMANAL', 'MENSUAL'];
const ESTADOS = ['ACTIVO', 'PAGADO', 'ATRASADO', 'CANCELADO'];

function serializarCuotas(cuotas: Cuota[]) {
  return cuotas.map((c) => ({ ...c, estadoActual: estadoDisplay(c) }));
}

function saldoPendiente(cuotas: Cuota[]): number {
  const total = cuotas.reduce((acc, c) => acc + (c.montoEsperado - c.montoPagado), 0);
  return Math.round(total * 100) / 100;
}

async function clienteVisible(clienteId: number, req: Request): Promise<boolean> {
  if (req.user!.rol !== 'COBRADOR') return true;
  const cliente = await prisma.cliente.findUnique({ where: { id: clienteId } });
  return cliente?.cobradorId === req.user!.id;
}

router.get('/', async (req, res) => {
  const where = req.user!.rol === 'COBRADOR' ? { cliente: { cobradorId: req.user!.id } } : {};
  const prestamos = await prisma.prestamo.findMany({
    where,
    include: { cliente: true, cuotas: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json(
    prestamos.map(({ cuotas, ...p }) => ({ ...p, saldoPendiente: saldoPendiente(cuotas) })),
  );
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  const prestamo = await prisma.prestamo.findUnique({
    where: { id },
    include: { cliente: true, cuotas: { orderBy: { numero: 'asc' } } },
  });
  if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado' });
  if (!(await clienteVisible(prestamo.clienteId, req))) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  res.json({
    ...prestamo,
    saldoPendiente: saldoPendiente(prestamo.cuotas),
    cuotas: serializarCuotas(prestamo.cuotas),
  });
});

router.get('/:id/reporte', async (req, res) => {
  const id = Number(req.params.id);
  const prestamo = await prisma.prestamo.findUnique({
    where: { id },
    include: {
      cliente: true,
      cuotas: { orderBy: { numero: 'asc' }, include: { pagos: { orderBy: { fecha: 'asc' } } } },
    },
  });
  if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado' });
  if (!(await clienteVisible(prestamo.clienteId, req))) {
    return res.status(403).json({ error: 'No autorizado' });
  }

  generarReportePrestamoPDF(prestamo, saldoPendiente(prestamo.cuotas), req.user!.nombre, res);
});

router.get('/:id/cuotas', async (req, res) => {
  const id = Number(req.params.id);
  const prestamo = await prisma.prestamo.findUnique({ where: { id } });
  if (!prestamo) return res.status(404).json({ error: 'Préstamo no encontrado' });
  if (!(await clienteVisible(prestamo.clienteId, req))) {
    return res.status(403).json({ error: 'No autorizado' });
  }
  const cuotas = await prisma.cuota.findMany({
    where: { prestamoId: id },
    orderBy: { numero: 'asc' },
  });
  res.json(serializarCuotas(cuotas));
});

router.post('/', requireRole('ADMIN'), async (req, res) => {
  const { clienteId, capital, tasaMensual, plazoDias, numeroCuotas, frecuenciaCuota, fechaInicio } =
    req.body ?? {};

  if (!clienteId || !capital || !plazoDias || !numeroCuotas || !frecuenciaCuota) {
    return res.status(400).json({
      error: 'clienteId, capital, plazoDias, numeroCuotas y frecuenciaCuota son requeridos',
    });
  }
  if (!FRECUENCIAS.includes(frecuenciaCuota)) {
    return res.status(400).json({ error: 'frecuenciaCuota inválida' });
  }

  const cliente = await prisma.cliente.findUnique({ where: { id: Number(clienteId) } });
  if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

  try {
    const prestamo = await crearPrestamo({
      clienteId: Number(clienteId),
      capital: Number(capital),
      tasaMensual: tasaMensual !== undefined ? Number(tasaMensual) : 20,
      plazoDias: Number(plazoDias),
      numeroCuotas: Number(numeroCuotas),
      frecuenciaCuota,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
      createdByUserId: req.user!.id,
    });
    res.status(201).json(prestamo);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.patch('/:id', requireRole('ADMIN'), async (req, res) => {
  const id = Number(req.params.id);
  const { estado, tasaMensual } = req.body ?? {};

  if (estado !== undefined && !ESTADOS.includes(estado)) {
    return res.status(400).json({ error: 'estado inválido' });
  }

  const existente = await prisma.prestamo.findUnique({ where: { id } });
  if (!existente) return res.status(404).json({ error: 'Préstamo no encontrado' });

  try {
    if (tasaMensual !== undefined) {
      await actualizarTasaPrestamo(id, Number(tasaMensual));
    }
    if (estado !== undefined) {
      await prisma.prestamo.update({ where: { id }, data: { estado } });
    }
  } catch (err) {
    return res.status(409).json({ error: (err as Error).message });
  }

  const actualizado = await prisma.prestamo.findUnique({
    where: { id },
    include: { cliente: true, cuotas: { orderBy: { numero: 'asc' } } },
  });
  res.json({
    ...actualizado,
    saldoPendiente: saldoPendiente(actualizado!.cuotas),
    cuotas: serializarCuotas(actualizado!.cuotas),
  });
});

export default router;
